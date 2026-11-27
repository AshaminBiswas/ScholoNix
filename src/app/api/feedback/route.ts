import { NextResponse } from "next/server";
import { z } from "zod";
import { platformRepository } from "@/server/platform/platform-repository";

const feedbackSchema = z.object({
  category: z.enum([
    "General Experience",
    "Feature Request",
    "Bug Report",
    "Design & Usability",
    "Administration & Billing",
  ], {
    errorMap: () => ({ message: "Please select a valid feedback category" }),
  }),
  rating: z.number().int().min(1, "Please choose a rating").max(5, "Rating cannot exceed 5"),
  sentiment: z.enum(["love", "happy", "neutral", "unhappy"]).optional(),
  module: z.string().trim().max(100).optional().or(z.literal("")),
  feedback: z.string().trim().min(5, "Feedback message must be at least 5 characters").max(2500, "Feedback message is too long"),
  role: z.string().trim().max(100).optional().or(z.literal("")),
  email: z.string().trim().email("Please provide a valid email address").optional().or(z.literal("")),
  schoolName: z.string().trim().max(150).optional().or(z.literal("")),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = feedbackSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          errors: result.error.flatten().fieldErrors,
          message: "Please review the feedback inputs.",
        },
        { status: 400 }
      );
    }

    const { category, rating, sentiment, module, feedback, role, email, schoolName } = result.data;
    const referenceId = `FDBK-${Date.now().toString().slice(-6)}`;

    await platformRepository.createSupportTicket({
      referenceCode: referenceId,
      source: "FEEDBACK_FORM",
      senderName: email || schoolName || "Anonymous Educator",
      senderEmail: email || null,
      schoolName: schoolName || null,
      role: role || null,
      category,
      subject: `${category} (${rating}/5★${module ? ` · ${module}` : ""})`,
      message: feedback,
      rating,
      sentiment: sentiment || null,
      module: module || null,
      priority: rating <= 2 ? "HIGH" : "LOW",
    });

    return NextResponse.json({
      success: true,
      message: "Thank you for sharing your feedback! Your insights help our team make ScholoNix even better for educators and parents.",
      referenceId,
      received: {
        category,
        rating,
        followUp: !!email,
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Unable to submit feedback at this moment. Please try again.",
      },
      { status: 500 }
    );
  }
}
