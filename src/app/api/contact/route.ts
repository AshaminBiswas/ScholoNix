import { NextResponse } from "next/server";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  email: z.string().trim().email("Please enter a valid email address"),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  schoolName: z.string().trim().max(150).optional().or(z.literal("")),
  role: z.string().trim().max(100).optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Subject is required").max(150, "Subject is too long"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(2000, "Message is too long"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = contactSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          errors: result.error.flatten().fieldErrors,
          message: "Please correct the errors in the form.",
        },
        { status: 400 }
      );
    }

    const { name, email, subject, schoolName } = result.data;

    // In a production environment, send email via nodemailer / webhook or record in CRM
    // For development, validate payload and return a successful response
    return NextResponse.json({
      success: true,
      message: `Thank you, ${name}! We have received your inquiry regarding "${subject}" for ${schoolName || "your school"}. Our dedicated team will respond to ${email} within 24 hours.`,
      referenceId: `CNTC-${Date.now().toString().slice(-6)}`,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred while sending your message. Please try again.",
      },
      { status: 500 }
    );
  }
}
