import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

// Mock 'server-only' in test environments since react-server bundler conditions are not active in Vitest
vi.mock("server-only", () => ({}));
