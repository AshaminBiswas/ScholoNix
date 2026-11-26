import "server-only";
import fs from "node:fs";
import path from "node:path";
import {
  PDFDocument,
  PageSizes,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFImage,
  type PDFPage,
} from "pdf-lib";
import { logger } from "@/lib/logger";
import {
  ADMISSION_STATUS_META,
  DOCUMENT_VERIFICATION_META,
  type AdmissionApplicationRecord,
} from "@/modules/school/admissions/types";
import { admissionsDocumentStorage } from "./admissions-document-storage";

export interface PdfSchoolProfile {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string | null;
  uniqueId?: string | null;
  affiliationBoard?: string | null;
  city?: string | null;
  state?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
}

const A4_WIDTH = PageSizes.A4[0]; // 595.28 pt
const A4_HEIGHT = PageSizes.A4[1]; // 841.89 pt
const MARGIN_X = 36;
const CONTENT_WIDTH = A4_WIDTH - MARGIN_X * 2;
const TOP_START_Y = A4_HEIGHT - 36;
const BOTTOM_SAFE_Y = 56;

const BRAND_PRIMARY = rgb(0.31, 0.15, 0.91); // #4F27E8
const BRAND_SOFT = rgb(0.95, 0.94, 1.0); // #F2EFFD
const BRAND_BORDER = rgb(0.84, 0.86, 0.94); // #D6DBF0
const INK_DARK = rgb(0.03, 0.04, 0.23); // #08093B
const INK_MUTED = rgb(0.32, 0.34, 0.48); // #52577A
const INK_LIGHT = rgb(0.48, 0.5, 0.62);
const SURFACE_ALT = rgb(0.98, 0.975, 1.0);
const WHITE = rgb(1, 1, 1);
const EMERALD_BG = rgb(0.93, 0.99, 0.96);
const EMERALD_INK = rgb(0.02, 0.47, 0.34);

/**
 * Standard Helvetica uses WinAnsi encoding (codepoints 0x20-0xFF excluding control chars).
 * Normalize common Indian/typographic symbols so pdf-lib never throws encoding errors.
 */
export function sanitizePdfText(raw: string | null | undefined, fallback = "Not Provided"): string {
  if (raw === null || raw === undefined) return fallback;
  const normalized = String(raw)
    .replace(/\u20B9/g, "Rs. ") // ₹
    .replace(/[\u2013\u2014]/g, "-") // en/em dash
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2022\u00B7]/g, "-")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) return fallback;

  let safe = "";
  for (let i = 0; i < normalized.length; i += 1) {
    const code = normalized.charCodeAt(i);
    if ((code >= 32 && code <= 126) || (code >= 160 && code <= 255)) {
      safe += normalized[i]!;
    } else {
      safe += " ";
    }
  }
  return safe.replace(/\s+/g, " ").trim() || fallback;
}

function wrapTextToLines(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number,
): string[] {
  const clean = sanitizePdfText(text, "");
  if (!clean) return [""];
  const words = clean.split(" ");
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      current = candidate;
    } else {
      if (current) {
        lines.push(current);
      }
      // Handle overly long unbroken tokens (e.g. emails or long IDs)
      if (font.widthOfTextAtSize(word, fontSize) > maxWidth) {
        let chunk = "";
        for (const ch of word) {
          const next = chunk + ch;
          if (font.widthOfTextAtSize(next, fontSize) <= maxWidth) {
            chunk = next;
          } else {
            if (chunk) lines.push(chunk);
            chunk = ch;
          }
        }
        current = chunk;
      } else {
        current = word;
      }
    }
  }
  if (current) lines.push(current);
  return lines.length > 0 ? lines : [""];
}

function formatDateIst(iso: string | null | undefined, includeTime = false): string {
  if (!iso) return "Not Provided";
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return sanitizePdfText(iso);
  const opts: Intl.DateTimeFormatOptions = includeTime
    ? {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      }
    : {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      };
  return sanitizePdfText(new Intl.DateTimeFormat("en-IN", opts).format(parsed));
}

function formatBytesLabel(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function buildPdfFilename(application: AdmissionApplicationRecord): string {
  const code = sanitizePdfText(application.applicationCode, "application")
    .replace(/[^a-zA-Z0-9_-]/g, "_");
  const sid = application.studentIdNumber
    ? `_${sanitizePdfText(application.studentIdNumber, "").replace(/[^a-zA-Z0-9_-]/g, "_")}`
    : "";
  return `${code}${sid}_Application.pdf`;
}

class PdfA4Composer {
  public readonly pdfDoc: PDFDocument;
  public readonly regular: PDFFont;
  public readonly bold: PDFFont;
  private readonly school: PdfSchoolProfile;
  private readonly application: AdmissionApplicationRecord;
  public page: PDFPage;
  public y: number;

  constructor(
    pdfDoc: PDFDocument,
    regular: PDFFont,
    bold: PDFFont,
    school: PdfSchoolProfile,
    application: AdmissionApplicationRecord,
  ) {
    this.pdfDoc = pdfDoc;
    this.regular = regular;
    this.bold = bold;
    this.school = school;
    this.application = application;
    this.page = pdfDoc.addPage(PageSizes.A4);
    this.y = TOP_START_Y;
  }

  public ensureSpace(neededHeight: number): void {
    if (this.y - neededHeight >= BOTTOM_SAFE_Y) {
      return;
    }
    this.addContinuationPage();
  }

  public addContinuationPage(): void {
    this.page = this.pdfDoc.addPage(PageSizes.A4);
    const barY = A4_HEIGHT - 44;
    this.page.drawRectangle({
      x: MARGIN_X,
      y: barY,
      width: CONTENT_WIDTH,
      height: 22,
      color: BRAND_SOFT,
      borderColor: BRAND_BORDER,
      borderWidth: 0.75,
    });
    this.page.drawText(
      sanitizePdfText(`${this.school.name}  |  Admission Application Dossier`),
      {
        x: MARGIN_X + 10,
        y: barY + 7,
        size: 8.5,
        font: this.bold,
        color: BRAND_PRIMARY,
      },
    );
    const rightMeta = sanitizePdfText(
      `App ID: ${this.application.applicationCode}${
        this.application.studentIdNumber ? `  |  Student ID: ${this.application.studentIdNumber}` : ""
      }`,
    );
    const rightWidth = this.bold.widthOfTextAtSize(rightMeta, 8);
    this.page.drawText(rightMeta, {
      x: MARGIN_X + CONTENT_WIDTH - 10 - rightWidth,
      y: barY + 7,
      size: 8,
      font: this.bold,
      color: INK_MUTED,
    });
    this.y = barY - 16;
  }

  public drawSectionTitle(title: string): void {
    this.ensureSpace(44);
    this.page.drawRectangle({
      x: MARGIN_X,
      y: this.y - 22,
      width: CONTENT_WIDTH,
      height: 22,
      color: BRAND_SOFT,
      borderColor: BRAND_BORDER,
      borderWidth: 0.75,
    });
    this.page.drawRectangle({
      x: MARGIN_X,
      y: this.y - 22,
      width: 4,
      height: 22,
      color: BRAND_PRIMARY,
    });
    this.page.drawText(sanitizePdfText(title), {
      x: MARGIN_X + 12,
      y: this.y - 14.5,
      size: 10,
      font: this.bold,
      color: INK_DARK,
    });
    this.y -= 28;
  }

  public drawKeyValueGrid(
    pairs: Array<{ label: string; value: string }>,
    columns: 2 | 1 = 2,
  ): void {
    const colGap = 14;
    const colWidth = columns === 2 ? (CONTENT_WIDTH - colGap) / 2 : CONTENT_WIDTH;
    const labelWidth = 104;
    const valueMaxWidth = colWidth - labelWidth - 16;

    for (let i = 0; i < pairs.length; i += columns) {
      const left = pairs[i]!;
      const right = columns === 2 ? pairs[i + 1] : undefined;

      const leftLines = wrapTextToLines(left.value, this.regular, 8.5, valueMaxWidth);
      const rightLines = right
        ? wrapTextToLines(right.value, this.regular, 8.5, valueMaxWidth)
        : [];
      const rowLines = Math.max(leftLines.length, rightLines.length, 1);
      const rowHeight = rowLines * 12 + 8;

      this.ensureSpace(rowHeight + 4);

      const drawCell = (
        x: number,
        pair: { label: string; value: string },
        lines: string[],
      ) => {
        this.page.drawRectangle({
          x,
          y: this.y - rowHeight,
          width: colWidth,
          height: rowHeight,
          color: SURFACE_ALT,
          borderColor: BRAND_BORDER,
          borderWidth: 0.5,
        });
        this.page.drawText(sanitizePdfText(pair.label), {
          x: x + 8,
          y: this.y - 13,
          size: 8,
          font: this.bold,
          color: INK_MUTED,
        });
        lines.forEach((line, idx) => {
          this.page.drawText(line, {
            x: x + labelWidth + 8,
            y: this.y - 13 - idx * 12,
            size: 8.5,
            font: this.regular,
            color: INK_DARK,
          });
        });
      };

      drawCell(MARGIN_X, left, leftLines);
      if (right) {
        drawCell(MARGIN_X + colWidth + colGap, right, rightLines);
      }

      this.y -= rowHeight + 4;
    }
    this.y -= 6;
  }

  public drawTable(
    headers: string[],
    colWidths: number[],
    rows: string[][],
  ): void {
    const drawHeaderRow = () => {
      this.ensureSpace(24);
      this.page.drawRectangle({
        x: MARGIN_X,
        y: this.y - 20,
        width: CONTENT_WIDTH,
        height: 20,
        color: BRAND_PRIMARY,
      });
      let cursorX = MARGIN_X;
      headers.forEach((h, idx) => {
        this.page.drawText(sanitizePdfText(h), {
          x: cursorX + 7,
          y: this.y - 13,
          size: 8,
          font: this.bold,
          color: WHITE,
        });
        cursorX += colWidths[idx]!;
      });
      this.y -= 20;
    };

    drawHeaderRow();

    rows.forEach((row, rIdx) => {
      const cellLines = row.map((cell, cIdx) =>
        wrapTextToLines(cell, this.regular, 8, Math.max(30, colWidths[cIdx]! - 12)),
      );
      const maxLines = Math.max(1, ...cellLines.map((l) => l.length));
      const rowHeight = maxLines * 11 + 8;

      if (this.y - rowHeight < BOTTOM_SAFE_Y) {
        this.addContinuationPage();
        drawHeaderRow();
      }

      this.page.drawRectangle({
        x: MARGIN_X,
        y: this.y - rowHeight,
        width: CONTENT_WIDTH,
        height: rowHeight,
        color: rIdx % 2 === 0 ? WHITE : SURFACE_ALT,
        borderColor: BRAND_BORDER,
        borderWidth: 0.5,
      });

      let cursorX = MARGIN_X;
      cellLines.forEach((lines, cIdx) => {
        if (cIdx > 0) {
          this.page.drawLine({
            start: { x: cursorX, y: this.y },
            end: { x: cursorX, y: this.y - rowHeight },
            thickness: 0.4,
            color: BRAND_BORDER,
          });
        }
        lines.forEach((line, lIdx) => {
          this.page.drawText(line, {
            x: cursorX + 7,
            y: this.y - 12 - lIdx * 11,
            size: 8,
            font: this.regular,
            color: INK_DARK,
          });
        });
        cursorX += colWidths[cIdx]!;
      });

      this.y -= rowHeight;
    });

    this.y -= 10;
  }

  public stampAllFooters(): void {
    const pages = this.pdfDoc.getPages();
    const total = pages.length;
    const generatedAt = formatDateIst(new Date().toISOString(), true);

    pages.forEach((p, idx) => {
      p.drawLine({
        start: { x: MARGIN_X, y: 38 },
        end: { x: MARGIN_X + CONTENT_WIDTH, y: 38 },
        thickness: 0.6,
        color: BRAND_BORDER,
      });
      const leftFooter = sanitizePdfText(
        `${this.school.name}  |  App: ${this.application.applicationCode}${
          this.application.studentIdNumber ? `  |  Student ID: ${this.application.studentIdNumber}` : ""
        }`,
      );
      p.drawText(leftFooter, {
        x: MARGIN_X,
        y: 24,
        size: 7.5,
        font: this.regular,
        color: INK_LIGHT,
      });
      const rightFooter = sanitizePdfText(`Page ${idx + 1} of ${total}  |  Generated ${generatedAt}`);
      const rw = this.bold.widthOfTextAtSize(rightFooter, 7.5);
      p.drawText(rightFooter, {
        x: MARGIN_X + CONTENT_WIDTH - rw,
        y: 24,
        size: 7.5,
        font: this.bold,
        color: INK_MUTED,
      });
    });
  }
}

async function embedImageBuffer(pdfDoc: PDFDocument, buf: Buffer): Promise<PDFImage | null> {
  if (buf.length < 8) return null;
  try {
    // PNG magic bytes
    if (
      buf[0] === 0x89 &&
      buf[1] === 0x50 &&
      buf[2] === 0x4e &&
      buf[3] === 0x47
    ) {
      return await pdfDoc.embedPng(buf);
    }
    // JPEG magic bytes
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
      return await pdfDoc.embedJpg(buf);
    }
  } catch {
    return null;
  }
  return null;
}

function isSafeRemoteLogoUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== "https:") return null;
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host.endsWith(".local") ||
      host === "127.0.0.1" ||
      host.startsWith("10.") ||
      host.startsWith("192.168.") ||
      host.startsWith("169.254.") ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return null;
    }
    if (host === "ik.imagekit.io" && !parsed.searchParams.has("tr")) {
      parsed.searchParams.set("tr", "f-png");
    }
    return parsed;
  } catch {
    return null;
  }
}

async function tryEmbedSchoolLogo(
  pdfDoc: PDFDocument,
  logoUrl?: string | null,
): Promise<PDFImage | null> {
  const raw = logoUrl?.trim();
  if (!raw) return null;

  if (raw.startsWith("data:image/")) {
    const commaIdx = raw.indexOf(",");
    if (commaIdx > 0) {
      const meta = raw.slice(0, commaIdx).toLowerCase();
      const payload = raw.slice(commaIdx + 1);
      if (meta.includes(";base64")) {
        const buf = Buffer.from(payload, "base64");
        return embedImageBuffer(pdfDoc, buf);
      }
    }
    return null;
  }

  if (raw.startsWith("/") && !raw.startsWith("//")) {
    const publicRoot = path.resolve(process.cwd(), "public");
    const targetPath = path.resolve(publicRoot, raw.replace(/^\/+/, ""));
    if (targetPath.startsWith(`${publicRoot}${path.sep}`) && fs.existsSync(targetPath)) {
      try {
        return await embedImageBuffer(pdfDoc, fs.readFileSync(targetPath));
      } catch {
        return null;
      }
    }
    return null;
  }

  const safeRemote = isSafeRemoteLogoUrl(raw);
  if (safeRemote) {
    try {
      const res = await fetch(safeRemote.toString(), {
        signal: AbortSignal.timeout(3000),
      });
      if (!res.ok) return null;
      const arr = await res.arrayBuffer();
      if (arr.byteLength > 3 * 1024 * 1024) return null;
      return await embedImageBuffer(pdfDoc, Buffer.from(arr));
    } catch {
      return null;
    }
  }

  return null;
}

function getSchoolInitials(name: string): string {
  const parts = sanitizePdfText(name, "SC").split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "SC";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
}

async function tryEmbedStudentPhoto(
  pdfDoc: PDFDocument,
  schoolId: string,
  photoKey?: string | null,
): Promise<PDFImage | null> {
  if (!photoKey) return null;
  const obj = await admissionsDocumentStorage.readDocumentIfExists(schoolId, photoKey);
  if (!obj) return null;
  try {
    if (obj.mimeType === "image/png" || photoKey.toLowerCase().endsWith(".png")) {
      return await pdfDoc.embedPng(obj.buffer);
    }
    if (
      obj.mimeType === "image/jpeg" ||
      photoKey.toLowerCase().endsWith(".jpg") ||
      photoKey.toLowerCase().endsWith(".jpeg")
    ) {
      return await pdfDoc.embedJpg(obj.buffer);
    }
  } catch {
    return null;
  }
  return null;
}

export async function buildApplicationDossierPdf(params: {
  school: PdfSchoolProfile;
  application: AdmissionApplicationRecord;
}): Promise<{ buffer: Buffer; pageCount: number; filename: string }> {
  const { school, application } = params;
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Admission Application ${application.applicationCode}`);
  pdfDoc.setSubject(`Student Admission Record - ${application.studentName}`);
  pdfDoc.setAuthor(sanitizePdfText(school.name));
  pdfDoc.setCreator("ScholoNix Admissions PDF Engine");

  const regular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const bold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const composer = new PdfA4Composer(pdfDoc, regular, bold, school, application);
  const [schoolLogo, studentPhoto] = await Promise.all([
    tryEmbedSchoolLogo(pdfDoc, school.logoUrl),
    tryEmbedStudentPhoto(pdfDoc, school.id, application.studentPhotoKey),
  ]);

  // =========================================================================
  // PAGE 1 TOP INSTITUTIONAL HEADER + SCHOOL LOGO + PHOTO + REFERENCE STRIP
  // =========================================================================
  const headerH = 78;
  composer.page.drawRectangle({
    x: MARGIN_X,
    y: composer.y - headerH,
    width: CONTENT_WIDTH,
    height: headerH,
    color: BRAND_PRIMARY,
  });

  // School Logo Badge (Left)
  const logoBoxSize = 54;
  const logoBoxX = MARGIN_X + 14;
  const logoBoxY = composer.y - headerH + (headerH - logoBoxSize) / 2;
  composer.page.drawRectangle({
    x: logoBoxX,
    y: logoBoxY,
    width: logoBoxSize,
    height: logoBoxSize,
    color: WHITE,
    borderColor: BRAND_BORDER,
    borderWidth: 0.75,
  });

  if (schoolLogo) {
    const pad = 4;
    const maxDim = logoBoxSize - pad * 2;
    const dims = schoolLogo.scaleToFit(maxDim, maxDim);
    composer.page.drawImage(schoolLogo, {
      x: logoBoxX + (logoBoxSize - dims.width) / 2,
      y: logoBoxY + (logoBoxSize - dims.height) / 2,
      width: dims.width,
      height: dims.height,
    });
  } else {
    composer.page.drawRectangle({
      x: logoBoxX + 4,
      y: logoBoxY + 4,
      width: logoBoxSize - 8,
      height: logoBoxSize - 8,
      color: BRAND_SOFT,
    });
    const initials = getSchoolInitials(school.name);
    const iw = bold.widthOfTextAtSize(initials, 16);
    composer.page.drawText(initials, {
      x: logoBoxX + (logoBoxSize - iw) / 2,
      y: logoBoxY + logoBoxSize / 2 - 5.5,
      size: 16,
      font: bold,
      color: BRAND_PRIMARY,
    });
  }

  const textStartX = logoBoxX + logoBoxSize + 14;
  const maxSchoolNameW = MARGIN_X + CONTENT_WIDTH - textStartX - 16;
  const cleanSchoolName = sanitizePdfText(school.name);
  let titleSize = 16;
  while (titleSize > 11 && bold.widthOfTextAtSize(cleanSchoolName, titleSize) > maxSchoolNameW) {
    titleSize -= 1;
  }

  composer.page.drawText(cleanSchoolName, {
    x: textStartX,
    y: composer.y - 25,
    size: titleSize,
    font: bold,
    color: WHITE,
  });

  const schoolSubParts = [
    school.affiliationBoard ? `Board: ${school.affiliationBoard}` : null,
    [school.city, school.state].filter(Boolean).join(", ") || null,
    school.uniqueId ? `School ID: ${school.uniqueId}` : null,
  ].filter(Boolean);
  composer.page.drawText(sanitizePdfText(schoolSubParts.join("  |  ")), {
    x: textStartX,
    y: composer.y - 42,
    size: 8.5,
    font: regular,
    color: rgb(0.9, 0.89, 1),
  });

  const dossierLabel = "OFFICIAL ADMISSION APPLICATION DOSSIER";
  composer.page.drawText(dossierLabel, {
    x: textStartX,
    y: composer.y - 61,
    size: 9.5,
    font: bold,
    color: WHITE,
  });

  const schoolContactLine = [school.contactEmail, school.contactPhone].filter(Boolean).join("  |  ");
  if (schoolContactLine) {
    const safeContact = sanitizePdfText(schoolContactLine);
    const labelEndX = textStartX + bold.widthOfTextAtSize(dossierLabel, 9.5) + 12;
    const maxContactW = Math.max(0, MARGIN_X + CONTENT_WIDTH - 14 - labelEndX);
    let contactSize = 7.5;
    while (contactSize > 6 && regular.widthOfTextAtSize(safeContact, contactSize) > maxContactW) {
      contactSize -= 0.5;
    }
    const cw = regular.widthOfTextAtSize(safeContact, contactSize);
    if (cw <= maxContactW) {
      composer.page.drawText(safeContact, {
        x: MARGIN_X + CONTENT_WIDTH - 14 - cw,
        y: composer.y - 61,
        size: contactSize,
        font: regular,
        color: rgb(0.9, 0.89, 1),
      });
    }
  }

  composer.y -= headerH + 14;

  // Summary Box + Student Photo on Page 1
  const summaryH = 98;
  const photoBoxW = 78;
  const photoBoxH = 92;
  const summaryLeftW = CONTENT_WIDTH - photoBoxW - 12;

  composer.page.drawRectangle({
    x: MARGIN_X,
    y: composer.y - summaryH,
    width: summaryLeftW,
    height: summaryH,
    color: WHITE,
    borderColor: BRAND_BORDER,
    borderWidth: 0.8,
  });

  const statusLabel = ADMISSION_STATUS_META[application.status]?.label ?? application.status;
  const verLabel =
    DOCUMENT_VERIFICATION_META[application.verificationStatus]?.label ??
    application.verificationStatus;
  const admissionTypeLabel =
    application.admissionType === "TRANSFER" ? "Admission (Transfer)" : "Fresh Admission";

  composer.page.drawText(sanitizePdfText(application.studentName), {
    x: MARGIN_X + 12,
    y: composer.y - 20,
    size: 13,
    font: bold,
    color: INK_DARK,
  });

  composer.page.drawText(
    sanitizePdfText(
      `Grade Applying For: ${application.gradeApplied}   |   Academic Year: ${application.academicYear}`,
    ),
    {
      x: MARGIN_X + 12,
      y: composer.y - 36,
      size: 8.5,
      font: bold,
      color: INK_MUTED,
    },
  );

  // Reference badges inside summary
  const badgeItems = [
    `App ID: ${application.applicationCode}`,
    application.studentIdNumber ? `Student ID: ${application.studentIdNumber}` : null,
    application.admissionNumber ? `Adm No: ${application.admissionNumber}` : null,
  ].filter((x): x is string => Boolean(x));

  let bx = MARGIN_X + 12;
  badgeItems.forEach((badge) => {
    const safeBadge = sanitizePdfText(badge);
    const bw = bold.widthOfTextAtSize(safeBadge, 8) + 14;
    composer.page.drawRectangle({
      x: bx,
      y: composer.y - 62,
      width: bw,
      height: 18,
      color: badge.startsWith("Student ID") ? EMERALD_BG : BRAND_SOFT,
      borderColor: BRAND_BORDER,
      borderWidth: 0.5,
    });
    composer.page.drawText(safeBadge, {
      x: bx + 7,
      y: composer.y - 56,
      size: 8,
      font: bold,
      color: badge.startsWith("Student ID") ? EMERALD_INK : BRAND_PRIMARY,
    });
    bx += bw + 6;
  });

  composer.page.drawText(
    sanitizePdfText(
      `Type: ${admissionTypeLabel}   |   Status: ${statusLabel}   |   Verification: ${verLabel}   |   Submitted: ${formatDateIst(application.appliedAt, true)}`,
    ),
    {
      x: MARGIN_X + 12,
      y: composer.y - 84,
      size: 7.5,
      font: regular,
      color: INK_MUTED,
    },
  );

  // Photo frame
  const photoX = MARGIN_X + summaryLeftW + 12;
  const photoY = composer.y - photoBoxH - 3;
  composer.page.drawRectangle({
    x: photoX,
    y: photoY,
    width: photoBoxW,
    height: photoBoxH,
    color: SURFACE_ALT,
    borderColor: BRAND_BORDER,
    borderWidth: 0.8,
  });

  if (studentPhoto) {
    const dims = studentPhoto.scaleToFit(photoBoxW - 6, photoBoxH - 6);
    composer.page.drawImage(studentPhoto, {
      x: photoX + (photoBoxW - dims.width) / 2,
      y: photoY + (photoBoxH - dims.height) / 2,
      width: dims.width,
      height: dims.height,
    });
  } else {
    const label = "STUDENT PHOTO";
    const lw = bold.widthOfTextAtSize(label, 7);
    composer.page.drawText(label, {
      x: photoX + (photoBoxW - lw) / 2,
      y: photoY + photoBoxH / 2 - 3,
      size: 7,
      font: bold,
      color: INK_LIGHT,
    });
  }

  composer.y -= summaryH + 16;

  // =========================================================================
  // SECTION 1: STUDENT PERSONAL, CONTACT & RESIDENTIAL ADDRESS
  // =========================================================================
  composer.drawSectionTitle("1. Student Information & Residential Address");
  const studentAddr = application.studentDetails?.address;
  const fullStudentAddress = studentAddr
    ? [
        studentAddr.addressLine1,
        studentAddr.addressLine2,
        studentAddr.city,
        studentAddr.state,
        studentAddr.postalCode,
      ]
        .filter(Boolean)
        .join(", ")
    : "Not Provided";

  composer.drawKeyValueGrid(
    [
      { label: "Full Name", value: application.studentName },
      { label: "Student ID", value: application.studentIdNumber || "Pending Assignment" },
      { label: "Date of Birth", value: formatDateIst(application.dateOfBirth, false) },
      { label: "Gender", value: application.gender || "Not Provided" },
      { label: "Nationality", value: application.nationality || "Not Provided" },
      { label: "Blood Group", value: application.bloodGroup || "Not Provided" },
      { label: "Grade Applying For", value: application.gradeApplied },
      { label: "Academic Year", value: application.academicYear },
      { label: "Student Email", value: application.studentDetails?.email || "Not Provided" },
      { label: "Student Phone", value: application.studentDetails?.phone || "Not Provided" },
    ],
    2,
  );
  composer.drawKeyValueGrid([{ label: "Residential Address", value: fullStudentAddress }], 1);

  // =========================================================================
  // SECTION 2: PARENT / GUARDIAN DETAILS
  // =========================================================================
  composer.drawSectionTitle("2. Parent & Guardian Information");
  const primaryG = application.guardianDetails?.primary;
  composer.drawKeyValueGrid(
    [
      { label: "Primary Guardian", value: primaryG?.fullName || application.guardianName },
      { label: "Relationship", value: primaryG?.relationship || application.guardianRelation },
      { label: "Occupation", value: primaryG?.occupation || "Not Provided" },
      { label: "Annual Income", value: primaryG?.annualIncome || "Not Provided" },
      { label: "Email Address", value: primaryG?.email || application.guardianEmail || "Not Provided" },
      { label: "Phone Number", value: primaryG?.phone || application.guardianPhone },
    ],
    2,
  );

  const secondaryG = application.guardianDetails?.secondary;
  if (secondaryG && secondaryG.fullName) {
    composer.drawKeyValueGrid(
      [
        { label: "Secondary Guardian", value: secondaryG.fullName },
        { label: "Relationship", value: secondaryG.relationship || "Mother" },
        { label: "Occupation", value: secondaryG.occupation || "Not Provided" },
        { label: "Annual Income", value: secondaryG.annualIncome || "Not Provided" },
        { label: "Email Address", value: secondaryG.email || "Not Provided" },
        { label: "Phone Number", value: secondaryG.phone || "Not Provided" },
      ],
      2,
    );
  }

  const gAddrObj = application.guardianDetails?.sameAsStudentAddress
    ? application.studentDetails?.address
    : application.guardianDetails?.address;
  const fullGuardianAddress = gAddrObj
    ? [
        gAddrObj.addressLine1,
        gAddrObj.addressLine2,
        gAddrObj.city,
        gAddrObj.state,
        gAddrObj.postalCode,
      ]
        .filter(Boolean)
        .join(", ")
    : fullStudentAddress;

  composer.drawKeyValueGrid(
    [
      {
        label: "Emergency Contact",
        value: application.guardianDetails?.emergencyContactNumber || application.guardianPhone,
      },
      {
        label: "Preferred Contact",
        value: application.guardianDetails?.preferredCommunicationMode || "Phone",
      },
    ],
    2,
  );
  composer.drawKeyValueGrid(
    [
      {
        label: "Guardian Address",
        value: application.guardianDetails?.sameAsStudentAddress
          ? `${fullGuardianAddress} (Same as Student Address)`
          : fullGuardianAddress,
      },
    ],
    1,
  );

  // =========================================================================
  // SECTION 3: ACADEMIC BACKGROUND & ASSESSMENT RECORDS
  // =========================================================================
  composer.drawSectionTitle("3. Academic Details & Previous Performance");
  if (application.admissionType === "TRANSFER" && application.academicDetails) {
    const acad = application.academicDetails;
    composer.drawKeyValueGrid(
      [
        {
          label: "Previous School",
          value: acad.previousSchoolName || application.previousSchool || "Not Provided",
        },
        { label: "Board / Curriculum", value: acad.boardCurriculum || "Not Provided" },
        { label: "Last Standard", value: acad.lastStandardStudied || "Not Provided" },
        { label: "Completion Year", value: acad.yearOfCompletion || "Not Provided" },
        {
          label: "Marks Obtained",
          value:
            acad.marksObtained !== null && acad.marksObtained !== undefined
              ? `${acad.marksObtained} / ${acad.totalMarks ?? "-"}`
              : "Not Provided",
        },
        {
          label: "Verified Percentage",
          value:
            acad.percentage !== null && acad.percentage !== undefined
              ? `${acad.percentage.toFixed(1)}%`
              : "Not Provided",
        },
      ],
      2,
    );

    if (acad.schoolAddress) {
      composer.drawKeyValueGrid([{ label: "Prev School Address", value: acad.schoolAddress }], 1);
    }

    if (Array.isArray(acad.previousAcademics) && acad.previousAcademics.length > 0) {
      composer.drawTable(
        ["Academic Year", "Standard / Class", "Marks Obtained", "Total Marks", "Percentage"],
        [120, 145, 90, 90, 78.28],
        acad.previousAcademics.map((row) => [
          row.academicYear,
          row.standard,
          String(row.marksObtained),
          String(row.totalMarks),
          `${row.percentage.toFixed(1)}%`,
        ]),
      );
    }
  } else {
    composer.drawKeyValueGrid(
      [
        {
          label: "Admission Category",
          value:
            application.admissionType === "TRANSFER"
              ? "Transfer Admission"
              : "Fresh Admission (Prior school marks not required)",
        },
        { label: "Previous School", value: application.previousSchool || "Not Applicable" },
      ],
      1,
    );
  }

  // =========================================================================
  // SECTION 4: UPLOADED DOCUMENTS MANIFEST (Checklist requirement table omitted)
  // =========================================================================
  composer.drawSectionTitle("4. Submitted Documents & Verification Status");
  const uploadedDocs = application.uploadedDocuments ?? [];
  if (uploadedDocs.length > 0) {
    composer.drawTable(
      ["Uploaded Document", "Original Filename", "File Size", "Uploaded At"],
      [150, 178.28, 70, 125],
      uploadedDocs.map((doc) => [
        doc.label,
        doc.fileName,
        formatBytesLabel(doc.sizeBytes),
        formatDateIst(doc.uploadedAt, true),
      ]),
    );
  } else {
    composer.drawKeyValueGrid(
      [{ label: "Uploaded Documents", value: "No documents uploaded for this application." }],
      1,
    );
  }

  // =========================================================================
  // SECTION 5: DECLARATION, REVIEW NOTES & OFFICIAL SIGNATURES
  // =========================================================================
  composer.drawSectionTitle("5. Declaration & Official Authorization");
  const declLines = wrapTextToLines(
    "I hereby declare that all information provided in this admission application is true, complete, and accurate to the best of my knowledge. I understand that submission of incorrect or falsified records may result in cancellation of admission at any stage.",
    regular,
    8.5,
    CONTENT_WIDTH - 24,
  );
  const declBoxH = declLines.length * 12 + 34;
  composer.ensureSpace(declBoxH + 85);

  composer.page.drawRectangle({
    x: MARGIN_X,
    y: composer.y - declBoxH,
    width: CONTENT_WIDTH,
    height: declBoxH,
    color: SURFACE_ALT,
    borderColor: BRAND_BORDER,
    borderWidth: 0.6,
  });
  declLines.forEach((line, idx) => {
    composer.page.drawText(line, {
      x: MARGIN_X + 12,
      y: composer.y - 16 - idx * 12,
      size: 8.5,
      font: regular,
      color: INK_DARK,
    });
  });
  composer.page.drawText(
    sanitizePdfText(
      `Declaration Status: ${
        application.declarationAccepted ? "Accepted Electronically" : "Recorded on Submission"
      }   |   Remarks: ${application.verificationNotes || "None"}`,
    ),
    {
      x: MARGIN_X + 12,
      y: composer.y - declBoxH + 10,
      size: 8,
      font: bold,
      color: BRAND_PRIMARY,
    },
  );
  composer.y -= declBoxH + 14;

  // Signature Boxes
  const sigW = (CONTENT_WIDTH - 16) / 2;
  const sigH = 62;
  composer.ensureSpace(sigH + 10);

  const drawSigBox = (x: number, title: string, subtitle: string) => {
    composer.page.drawRectangle({
      x,
      y: composer.y - sigH,
      width: sigW,
      height: sigH,
      color: WHITE,
      borderColor: BRAND_BORDER,
      borderWidth: 0.7,
    });
    composer.page.drawLine({
      start: { x: x + 14, y: composer.y - sigH + 22 },
      end: { x: x + sigW - 14, y: composer.y - sigH + 22 },
      thickness: 0.6,
      color: INK_LIGHT,
    });
    composer.page.drawText(sanitizePdfText(title), {
      x: x + 14,
      y: composer.y - sigH + 11,
      size: 8,
      font: bold,
      color: INK_DARK,
    });
    composer.page.drawText(sanitizePdfText(subtitle), {
      x: x + 14,
      y: composer.y - 14,
      size: 7.5,
      font: regular,
      color: INK_LIGHT,
    });
  };

  drawSigBox(
    MARGIN_X,
    `Parent / Guardian Signature (${application.guardianName})`,
    "Date: ____________________",
  );
  drawSigBox(
    MARGIN_X + sigW + 16,
    `Authorized Signatory (${school.name})`,
    "Admissions Office / Principal Seal",
  );
  composer.y -= sigH + 8;

  composer.stampAllFooters();

  const bytes = await pdfDoc.save();
  return {
    buffer: Buffer.from(bytes),
    pageCount: pdfDoc.getPageCount(),
    filename: buildPdfFilename(application),
  };
}

export const admissionsPdfService = {
  async generateAndStoreApplicationPdf(params: {
    school: PdfSchoolProfile;
    application: AdmissionApplicationRecord;
  }): Promise<{ buffer: Buffer; pageCount: number; filename: string; storageKey: string }> {
    const startedAt = Date.now();
    const result = await buildApplicationDossierPdf(params);
    const storageKey = await admissionsDocumentStorage.saveGeneratedPdf(
      params.school.id,
      params.application.id,
      result.buffer,
      params.application.updatedAt,
    );

    logger.info(
      {
        event: "ADMISSION_PDF_GENERATED",
        schoolId: params.school.id,
        applicationId: params.application.id,
        applicationCode: params.application.applicationCode,
        pageCount: result.pageCount,
        sizeBytes: result.buffer.length,
        durationMs: Date.now() - startedAt,
      },
      "[AdmissionsPdfService] Generated A4 admission application PDF",
    );

    return {
      ...result,
      storageKey,
    };
  },

  async getOrGenerateApplicationPdf(params: {
    school: PdfSchoolProfile;
    application: AdmissionApplicationRecord;
  }): Promise<{ buffer: Buffer; pageCount: number; filename: string; signedUrl?: string | null }> {
    const cached = await admissionsDocumentStorage.readGeneratedPdf(
      params.school.id,
      params.application.id,
    );
    if (cached && cached.versionTag && cached.versionTag === params.application.updatedAt) {
      const parsed = await PDFDocument.load(cached.buffer).catch(() => null);
      const signedUrl = await admissionsDocumentStorage
        .getSignedPdfUrl(params.school.id, params.application.id, { expiresInSeconds: 180 })
        .catch(() => null);
      return {
        buffer: cached.buffer,
        pageCount: parsed ? parsed.getPageCount() : 1,
        filename: buildPdfFilename(params.application),
        signedUrl,
      };
    }

    const generated = await buildApplicationDossierPdf(params);
    let persisted = false;
    try {
      await admissionsDocumentStorage.saveGeneratedPdf(
        params.school.id,
        params.application.id,
        generated.buffer,
        params.application.updatedAt,
      );
      persisted = true;
    } catch (storageErr) {
      // Never block user PDF download if external cache storage is temporarily unreachable
      logger.warn(
        {
          event: "ADMISSION_PDF_CACHE_WRITE_FAILED",
          schoolId: params.school.id,
          applicationId: params.application.id,
          error: storageErr instanceof Error ? storageErr.message : String(storageErr),
        },
        "[AdmissionsPdfService] Serving freshly built A4 PDF after storage cache write failed",
      );
    }

    const signedUrl = persisted
      ? await admissionsDocumentStorage
          .getSignedPdfUrl(params.school.id, params.application.id, { expiresInSeconds: 180 })
          .catch(() => null)
      : null;

    return {
      buffer: generated.buffer,
      pageCount: generated.pageCount,
      filename: generated.filename,
      signedUrl,
    };
  },
};
