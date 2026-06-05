/**
 * Utilitaires pour les tests unitaires et d'intégration
 */

import { vi, describe, it, expect, beforeEach, afterEach } from "vitest";
import { QueryClient } from "@tanstack/react-query";

/**
 * Crée un QueryClient pour les tests
 */
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/**
 * Mock factory pour Supabase
 */
export function createMockSupabaseClient() {
  return {
    from: vi.fn(() => ({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
      insert: vi.fn().mockResolvedValue({ data: [], error: null }),
      update: vi.fn().mockResolvedValue({ data: [], error: null }),
      delete: vi.fn().mockResolvedValue({ data: [], error: null }),
      eq: vi.fn(function () {
        return this;
      }),
      neq: vi.fn(function () {
        return this;
      }),
      ilike: vi.fn(function () {
        return this;
      }),
      order: vi.fn(function () {
        return this;
      }),
      range: vi.fn(function () {
        return this;
      }),
      limit: vi.fn(function () {
        return this;
      }),
      single: vi.fn(function () {
        return this;
      }),
    })),
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { id: "test-user-id" } },
      }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  };
}

/**
 * Helper pour tester les API functions
 */
export async function testApiFunction(
  fn: () => Promise<any>,
  expectedError?: { code: string; status: number }
) {
  try {
    const result = await fn();
    if (expectedError) {
      throw new Error(`Expected error but got result: ${JSON.stringify(result)}`);
    }
    return result;
  } catch (error: any) {
    if (expectedError) {
      expect(error.code).toBe(expectedError.code);
      expect(error.status).toBe(expectedError.status);
    } else {
      throw error;
    }
  }
}

/**
 * Example test suite pour une API function
 * =========================================
 * 
 * import { describe, it, expect, beforeEach, vi } from "vitest";
 * import { createMockSupabaseClient } from "@/lib/test-utils";
 * import * as assetsApi from "@/lib/api/assets";
 * 
 * describe("Assets API", () => {
 *   let supabaseMock: any;
 * 
 *   beforeEach(() => {
 *     supabaseMock = createMockSupabaseClient();
 *     vi.mock("@/integrations/supabase/client", () => ({
 *       supabase: supabaseMock,
 *     }));
 *   });
 * 
 *   describe("fetchAssets", () => {
 *     it("should fetch assets with default pagination", async () => {
 *       supabaseMock.from().select.mockResolvedValue({
 *         data: [
 *           {
 *             id: "1",
 *             name: "Asset 1",
 *             company_id: "company-1",
 *             status: "active",
 *           },
 *         ],
 *         count: 1,
 *         error: null,
 *       });
 * 
 *       const result = await assetsApi.fetchAssets();
 * 
 *       expect(result.data).toHaveLength(1);
 *       expect(result.count).toBe(1);
 *       expect(result.hasMore).toBe(false);
 *     });
 * 
 *     it("should apply filters correctly", async () => {
 *       const filters = { status: "critical", search: "pump" };
 * 
 *       await assetsApi.fetchAssets(filters);
 * 
 *       expect(supabaseMock.from).toHaveBeenCalledWith("assets");
 *       expect(supabaseMock.from().eq).toHaveBeenCalledWith("status", "critical");
 *       expect(supabaseMock.from().ilike).toHaveBeenCalledWith(
 *         "name",
 *         "%pump%"
 *       );
 *     });
 *   });
 * 
 *   describe("createAsset", () => {
 *     it("should validate input data", async () => {
 *       const invalidData = {
 *         // Missing required name field
 *         company_id: "company-1",
 *         status: "active",
 *       };
 * 
 *       expect(() => {
 *         assetsApi.createAsset(invalidData as any);
 *       }).toThrow("Asset name required");
 *     });
 *   });
 * });
 */

/**
 * Example test suite pour un custom hook
 * ======================================
 * 
 * import { renderHook, waitFor } from "@testing-library/react";
 * import { QueryClientProvider } from "@tanstack/react-query";
 * import { useAssets } from "@/hooks/use-queries";
 * import { createTestQueryClient } from "@/lib/test-utils";
 * 
 * describe("useAssets hook", () => {
 *   it("should fetch and cache assets", async () => {
 *     const queryClient = createTestQueryClient();
 * 
 *     const wrapper = ({ children }: any) => (
 *       <QueryClientProvider client={queryClient}>
 *         {children}
 *       </QueryClientProvider>
 *     );
 * 
 *     const { result } = renderHook(() => useAssets(), { wrapper });
 * 
 *     expect(result.current.isPending).toBe(true);
 * 
 *     await waitFor(() => {
 *       expect(result.current.isPending).toBe(false);
 *     });
 * 
 *     expect(result.current.data).toBeDefined();
 *   });
 * });
 */

export {};
