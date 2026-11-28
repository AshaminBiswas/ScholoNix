import type { Metadata } from "next";
import { SCHOLONIX_OPENAPI_SPEC } from "@/modules/docs/openapi-spec";
import { SwaggerDocsExplorer } from "@/modules/docs/components/swagger-docs-explorer";

export const metadata: Metadata = {
  title: "API Documentation (Swagger / OpenAPI) | ScholoNix",
  description:
    "Interactive OpenAPI 3.0.3 / Swagger documentation for ScholoNix School Management SaaS APIs.",
};

export default function ApiDocsPage() {
  return <SwaggerDocsExplorer spec={SCHOLONIX_OPENAPI_SPEC} />;
}
