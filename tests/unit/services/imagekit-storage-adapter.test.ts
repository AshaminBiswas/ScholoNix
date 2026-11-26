import { describe, expect, it, vi } from "vitest";
import { createImageKitStorageAdapter } from "@/server/storage/imagekit-adapter";
import { createR2StorageAdapter } from "@/server/storage/r2-adapter";
import { admissionsDocumentStorage } from "@/server/school/admissions-document-storage";
import { admissionsPdfService } from "@/server/school/admissions-pdf-generator";
import type { AdmissionApplicationRecord } from "@/modules/school/admissions/types";

function makeSampleApp(): AdmissionApplicationRecord {
  return {
    id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    schoolId: "11111111-1111-4111-8111-111111111111",
    applicationCode: "APP2026-0042",
    studentIdNumber: "STU2026-0042",
    admissionNumber: null,
    enquiryId: null,
    studentName: "Synthetic Aarav",
    gender: "Male",
    dateOfBirth: "2018-05-12",
    gradeApplied: "Class II",
    academicYear: "2026 – 2027",
    guardianName: "Synthetic Guardian",
    guardianRelation: "Father",
    guardianPhone: "+919876543210",
    guardianEmail: "parent@scholonix.example",
    previousSchool: null,
    status: "UNDER_REVIEW",
    verificationStatus: "PENDING",
    verificationNotes: null,
    documentsChecklist: [],
    admissionType: "FRESH",
    isDraft: false,
    currentStep: 4,
    appliedAt: "2026-05-01T10:00:00.000Z",
    shortlistedAt: null,
    admittedAt: null,
    rejectedAt: null,
    verifiedAt: null,
    createdAt: "2026-05-01T10:00:00.000Z",
    updatedAt: "2026-05-01T10:00:00.000Z",
  };
}

describe("ImageKit storage adapter & resilient PDF delivery", () => {
  const config = {
    privateKey: "private_test_synthetic_key",
    publicKey: "public_test_synthetic_key",
    urlEndpoint: "https://ik.imagekit.io/synthetic_school",
    baseFolder: "/scholonix",
  };

  it("uploads private tenant PDFs/images, mints signed URLs, and fetches with versionTag metadata", async () => {
    const uploadMock = vi.fn(async () => ({
      fileId: "ik_file_123",
      filePath: "/scholonix/1111/admissions/pdf/app1.pdf",
      url: "https://ik.imagekit.io/synthetic_school/scholonix/1111/admissions/pdf/app1.pdf",
      size: 9,
    }));
    const listMock = vi.fn(async () => [
      {
        fileId: "ik_file_123",
        filePath: "/scholonix/1111/admissions/pdf/app1.pdf",
        name: "app1.pdf",
        mime: "application/pdf",
        description: JSON.stringify({
          mimeType: "application/pdf",
          fileName: "app1.pdf",
          versionTag: "2026-05-01T10:00:00.000Z",
        }),
        versionInfo: { id: "ver_999" },
      },
    ]);
    const deleteMock = vi.fn(async () => undefined);
    const buildSrcMock = vi.fn(
      (opts: { urlEndpoint: string; src: string; queryParameters?: Record<string, string> }) => {
        const qs = new URLSearchParams({
          "ik-s": "signed-hmac",
          ...(opts.queryParameters ?? {}),
        }).toString();
        return `${opts.urlEndpoint}${opts.src}?${qs}`;
      },
    );
    const fetcherMock = vi.fn(async () => {
      return new Response(Buffer.from("%PDF-1.7\n"), {
        status: 200,
        headers: { "content-type": "application/pdf" },
      });
    });

    const adapter = createImageKitStorageAdapter({
      config,
      client: {
        files: {
          upload: uploadMock as never,
          delete: deleteMock as never,
        },
        assets: {
          list: listMock as never,
        },
        helper: {
          buildSrc: buildSrcMock as never,
        },
      },
      fetcher: fetcherMock as never,
    });

    expect(adapter.isConfigured()).toBe(true);
    expect(adapter.provider).toBe("imagekit");

    const stored = await adapter.putObject({
      storageKey: "1111/admissions/pdf/app1.pdf",
      buffer: Buffer.from("%PDF-1.7\n"),
      mimeType: "application/pdf",
      fileName: "app1.pdf",
      isPrivate: true,
      overwrite: true,
      versionTag: "2026-05-01T10:00:00.000Z",
      tags: ["school:1111", "doc:application_pdf"],
    });

    expect(stored.provider).toBe("imagekit");
    expect(stored.fileId).toBe("ik_file_123");
    expect(uploadMock).toHaveBeenCalledWith(
      expect.objectContaining({
        fileName: "app1.pdf",
        folder: "/scholonix/1111/admissions/pdf",
        isPrivateFile: true,
        useUniqueFileName: false,
        overwriteFile: true,
      }),
    );

    const signedUrl = await adapter.getSignedUrl?.("1111/admissions/pdf/app1.pdf", {
      expiresInSeconds: 300,
      disposition: "attachment",
    });
    expect(signedUrl).toContain("ik-attachment=true");
    expect(buildSrcMock).toHaveBeenCalledWith(
      expect.objectContaining({
        signed: true,
        expiresIn: 300,
      }),
    );

    const retrieved = await adapter.getObject("1111/admissions/pdf/app1.pdf");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.buffer.toString("utf8")).toBe("%PDF-1.7\n");
    expect(retrieved?.versionTag).toBe("2026-05-01T10:00:00.000Z");
    expect(retrieved?.mimeType).toBe("application/pdf");

    await adapter.deleteObject("1111/admissions/pdf/app1.pdf");
    expect(deleteMock).toHaveBeenCalledWith("ik_file_123");
  });

  it("still reads directly via signed URL if ImageKit assets.list lags right after upload", async () => {
    const adapter = createImageKitStorageAdapter({
      config,
      client: {
        files: { upload: vi.fn() as never, delete: vi.fn() as never },
        assets: { list: vi.fn(async () => []) as never },
        helper: {
          buildSrc: vi.fn(() => "https://ik.imagekit.io/synthetic_school/scholonix/1111/admissions/p.jpg?ik-s=ok") as never,
        },
      },
      fetcher: vi.fn(async () => new Response(Buffer.from([0xff, 0xd8, 0xff]), {
        status: 200,
        headers: { "content-type": "image/jpeg" },
      })) as never,
    });

    const found = await adapter.getObject("1111/admissions/p.jpg");
    expect(found?.mimeType).toBe("image/jpeg");
    expect(found?.buffer).toHaveLength(3);
  });

  it("serves generated A4 PDF cleanly even if remote cache persistence throws", async () => {
    const saveSpy = vi
      .spyOn(admissionsDocumentStorage, "saveGeneratedPdf")
      .mockRejectedValueOnce(new Error("Simulated storage write failure"));

    const result = await admissionsPdfService.getOrGenerateApplicationPdf({
      school: {
        id: "11111111-1111-4111-8111-111111111111",
        name: "Synthetic ImageKit School",
        slug: "sc_imagekit_test",
        logoUrl: "/favicon-32x32.png",
        affiliationBoard: "CBSE",
        city: "Pune",
        state: "Maharashtra",
      },
      application: makeSampleApp(),
    });

    expect(result.buffer.subarray(0, 4).toString("utf8")).toBe("%PDF");
    expect(result.pageCount).toBeGreaterThanOrEqual(1);
    expect(result.filename).toContain("STU2026-0042");
    saveSpy.mockRestore();
  });

  it("exposes future Cloudflare R2 adapter slot without coupling business logic", () => {
    const r2 = createR2StorageAdapter();
    expect(r2.provider).toBe("r2");
  });
});
