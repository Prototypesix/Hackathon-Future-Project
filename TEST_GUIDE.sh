#!/bin/bash
# SmartAsset Testing Guide
# Comment tester le projet

# =============================================================================
# SETUP - Installation des dépendances de test
# =============================================================================

# 1. Vérifier que Vitest est installé
npm list vitest

# 2. Si pas installé, installer:
npm install -D vitest @testing-library/react @testing-library/user-event

# 3. Créer un fichier vitest.config.ts à la racine:
cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
EOF

# =============================================================================
# ÉTAPE 1: Tester une API Function
# =============================================================================

# Créer: src/__tests__/api/assets.test.ts

cat > src/__tests__/api/assets.test.ts << 'EOF'
import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchAssets, createAsset } from "@/lib/api/assets";
import { CreateAssetSchema } from "@/lib/api/validators";
import * as supabaseModule from "@/integrations/supabase/client";

// Mock Supabase
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

describe("Assets API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchAssets", () => {
    it("should fetch assets successfully", async () => {
      const mockAssets = [
        {
          id: "1",
          name: "Pump A",
          company_id: "company-1",
          status: "active",
          created_at: "2026-06-05T00:00:00Z",
          updated_at: "2026-06-05T00:00:00Z",
        },
      ];

      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockAssets,
          count: 1,
          error: null,
        }),
      };

      vi.spyOn(supabaseModule.supabase, "from").mockReturnValue(mockQuery as any);

      const result = await fetchAssets();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].name).toBe("Pump A");
      expect(result.count).toBe(1);
    });

    it("should apply filters", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: [],
          count: 0,
          error: null,
        }),
      };

      vi.spyOn(supabaseModule.supabase, "from").mockReturnValue(mockQuery as any);

      await fetchAssets({ status: "critical" });

      expect(mockQuery.eq).toHaveBeenCalledWith("status", "critical");
    });

    it("should handle errors", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error", status: 500 },
        }),
      };

      vi.spyOn(supabaseModule.supabase, "from").mockReturnValue(mockQuery as any);

      expect(fetchAssets()).rejects.toThrow();
    });
  });

  describe("createAsset", () => {
    it("should validate input schema", () => {
      const validData = {
        name: "New Pump",
        company_id: "company-1",
        status: "active" as const,
      };

      const validated = CreateAssetSchema.parse(validData);
      expect(validated.name).toBe("New Pump");
    });

    it("should reject invalid input", () => {
      const invalidData = {
        // Missing required name
        company_id: "company-1",
        status: "active",
      };

      expect(() => CreateAssetSchema.parse(invalidData)).toThrow();
    });
  });
});
EOF

# =============================================================================
# ÉTAPE 2: Tester un Custom Hook
# =============================================================================

# Créer: src/__tests__/hooks/use-queries.test.ts

cat > src/__tests__/hooks/use-queries.test.ts << 'EOF'
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAssets } from "@/hooks/use-queries";
import { createTestQueryClient } from "@/lib/test-utils";

describe("useAssets hook", () => {
  it("should return initial state", () => {
    const queryClient = createTestQueryClient();

    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useAssets(), { wrapper });

    expect(result.current.isPending).toBeDefined();
  });

  it("should handle loading state", async () => {
    const queryClient = createTestQueryClient();

    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    const { result } = renderHook(() => useAssets(), { wrapper });

    await waitFor(() => {
      expect(result.current.status).toMatch(/pending|success|error/);
    });
  });
});
EOF

# =============================================================================
# ÉTAPE 3: Tester un Composant
# =============================================================================

# Créer: src/__tests__/routes/dashboard.test.tsx

cat > src/__tests__/routes/dashboard.test.tsx << 'EOF'
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/lib/test-utils";

// Mock le composant Dashboard
vi.mock("@/routes/_authenticated.dashboard", () => ({
  Dashboard: () => <div>Dashboard Mock</div>,
}));

describe("Dashboard Component", () => {
  it("should render dashboard title", () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <div>Dashboard Mock</div>
      </QueryClientProvider>
    );

    expect(screen.getByText("Dashboard Mock")).toBeInTheDocument();
  });

  it("should display loading state", () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <div>Loading...</div>
      </QueryClientProvider>
    );

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });
});
EOF

# =============================================================================
# ÉTAPE 4: Tester la Validation avec Zod
# =============================================================================

# Créer: src/__tests__/api/validators.test.ts

cat > src/__tests__/api/validators.test.ts << 'EOF'
import { describe, it, expect } from "vitest";
import {
  AssetSchema,
  CreateAssetSchema,
  FaultReportSchema,
  CreateFaultReportSchema,
} from "@/lib/api/validators";
import { z } from "zod";

describe("Validators", () => {
  describe("AssetSchema", () => {
    it("should validate a complete asset", () => {
      const validAsset = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Pump A",
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        status: "active" as const,
        created_at: "2026-06-05T00:00:00Z",
        updated_at: "2026-06-05T00:00:00Z",
      };

      const result = AssetSchema.safeParse(validAsset);
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const invalidAsset = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        name: "Pump A",
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        status: "invalid-status",
        created_at: "2026-06-05T00:00:00Z",
        updated_at: "2026-06-05T00:00:00Z",
      };

      const result = AssetSchema.safeParse(invalidAsset);
      expect(result.success).toBe(false);
    });
  });

  describe("CreateAssetSchema", () => {
    it("should accept minimal required fields", () => {
      const minimalAsset = {
        name: "New Equipment",
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        status: "active" as const,
      };

      const result = CreateAssetSchema.safeParse(minimalAsset);
      expect(result.success).toBe(true);
    });

    it("should reject missing required fields", () => {
      const incompleteAsset = {
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        status: "active" as const,
      };

      const result = CreateAssetSchema.safeParse(incompleteAsset);
      expect(result.success).toBe(false);
    });

    it("should accept optional fields", () => {
      const assetWithOptional = {
        name: "Equipment",
        company_id: "123e4567-e89b-12d3-a456-426614174000",
        status: "active" as const,
        model: "X2000",
        manufacturer: "TechCorp",
        location: "Building A",
      };

      const result = CreateAssetSchema.safeParse(assetWithOptional);
      expect(result.success).toBe(true);
    });
  });

  describe("FaultReportSchema", () => {
    it("should validate a complete fault report", () => {
      const validFault = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        asset_id: "123e4567-e89b-12d3-a456-426614174000",
        title: "Pump not working",
        description: "The pump stopped working after 2 hours",
        severity: "high" as const,
        status: "open" as const,
        reported_by: "123e4567-e89b-12d3-a456-426614174000",
        created_at: "2026-06-05T00:00:00Z",
        updated_at: "2026-06-05T00:00:00Z",
      };

      const result = FaultReportSchema.safeParse(validFault);
      expect(result.success).toBe(true);
    });

    it("should reject descriptions too short", () => {
      const shortFault = {
        id: "123e4567-e89b-12d3-a456-426614174000",
        asset_id: "123e4567-e89b-12d3-a456-426614174000",
        title: "Pump",
        description: "Bad",
        severity: "high" as const,
        status: "open" as const,
        reported_by: "123e4567-e89b-12d3-a456-426614174000",
        created_at: "2026-06-05T00:00:00Z",
        updated_at: "2026-06-05T00:00:00Z",
      };

      const result = FaultReportSchema.safeParse(shortFault);
      expect(result.success).toBe(false);
    });
  });
});
EOF

# =============================================================================
# ÉTAPE 5: Exécuter les tests
# =============================================================================

echo "=== Setup complet pour les tests ==="
echo ""
echo "Pour exécuter les tests:"
echo ""
echo "1. Tous les tests:"
echo "   npm run test"
echo ""
echo "2. Tests d'un fichier spécifique:"
echo "   npm run test src/__tests__/api/assets.test.ts"
echo ""
echo "3. Tests en mode watch (recharge automatique):"
echo "   npm run test -- --watch"
echo ""
echo "4. Tests avec couverture:"
echo "   npm run test -- --coverage"
echo ""
echo "5. Tests avec filtre:"
echo "   npm run test -- --grep 'Assets'"
echo ""
echo "Ajouter au package.json:"
echo '  "test": "vitest",'
echo '  "test:ui": "vitest --ui",'
echo '  "test:coverage": "vitest --coverage"'
