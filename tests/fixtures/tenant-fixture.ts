/**
 * Deterministic synthetic fixtures for tests.
 * NEVER use real student, guardian, or staff data.
 */

export interface MockTenant {
  schoolId: string;
  slug: string;
  name: string;
}

export const MOCK_TENANT_A: MockTenant = {
  schoolId: "11111111-1111-1111-1111-111111111111",
  slug: "greenwood-high",
  name: "Greenwood High School",
};

export const MOCK_TENANT_B: MockTenant = {
  schoolId: "22222222-2222-2222-2222-222222222222",
  slug: "oakridge-academy",
  name: "Oakridge Academy",
};
