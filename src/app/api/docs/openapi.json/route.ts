import { NextResponse } from "next/server";
import { SCHOLONIX_OPENAPI_SPEC } from "@/modules/docs/openapi-spec";

export const dynamic = "force-static";

export async function GET() {
  return NextResponse.json(SCHOLONIX_OPENAPI_SPEC, {
    headers: {
      "Cache-Control": "public, max-age=300",
    },
  });
}
