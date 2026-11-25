import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = "INTERNAL_SERVER_ERROR",
    details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = "Authentication required") {
    super(message, 401, "UNAUTHENTICATED");
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = "Access denied: insufficient permissions") {
    super(message, 403, "FORBIDDEN");
  }
}

export class VerificationRequiredError extends AppError {
  constructor(message: string = "Verification required before proceeding") {
    super(message, 403, "VERIFICATION_REQUIRED");
  }
}

export class TenantNotFoundError extends AppError {
  constructor(message: string = "School tenant not found or inactive") {
    super(message, 404, "TENANT_NOT_FOUND");
  }
}

export class TenantMismatchError extends AppError {
  constructor(message: string = "Cross-tenant access prohibited") {
    super(message, 403, "TENANT_MISMATCH");
  }
}

export class ValidationError extends AppError {
  constructor(message: string = "Validation failed", details?: unknown) {
    super(message, 400, "VALIDATION_ERROR", details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = "Resource") {
    super(`${resource} not found`, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string = "Resource conflict") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitExceededError extends AppError {
  constructor(message: string = "Too many requests. Please try again later.") {
    super(message, 429, "RATE_LIMIT_EXCEEDED");
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(
    message: string = "Service temporarily unavailable. Please try again in a moment.",
  ) {
    super(message, 503, "SERVICE_UNAVAILABLE");
  }
}

/**
 * Converts any caught error into a uniform, safe HTTP JSON response.
 * Never exposes raw internal stack traces in production.
 */
export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.statusCode },
    );
  }

  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: "Request validation failed",
          details: error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const isDev = process.env.NODE_ENV === "development";
  console.error(
    "[API:UnexpectedError]",
    error instanceof Error ? { name: error.name, message: error.message } : String(error),
  );
  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message:
          isDev && error instanceof Error
            ? error.message
            : "An unexpected internal error occurred",
      },
    },
    { status: 500 },
  );
}
