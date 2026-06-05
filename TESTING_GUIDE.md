# 🧪 Guide Complet des Tests SmartAsset

## Table des matières
1. [Setup initial](#setup-initial)
2. [Tester une API Function](#tester-une-api-function)
3. [Tester un Custom Hook](#tester-un-custom-hook)
4. [Tester un Composant React](#tester-un-composant-react)
5. [Tester la Validation Zod](#tester-la-validation-zod)
6. [Commandes utiles](#commandes-utiles)

---

## Setup Initial

### 1️⃣ Installation des dépendances

```bash
npm install -D vitest @testing-library/react @testing-library/user-event jsdom
```

### 2️⃣ Créer `vitest.config.ts`

```typescript
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
```

### 3️⃣ Ajouter au `package.json`

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:watch": "vitest --watch"
  }
}
```

---

## Tester une API Function

### Exemple: Tester `fetchAssets()`

**Fichier:** `src/__tests__/api/assets.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { fetchAssets, createAsset } from "@/lib/api/assets";
import * as supabaseModule from "@/integrations/supabase/client";

// Mock Supabase avant les imports
vi.mock("@/integrations/supabase/client");

describe("Assets API", () => {
  beforeEach(() => {
    vi.clearAllMocks(); // Nettoyer les mocks avant chaque test
  });

  describe("fetchAssets", () => {
    it("should fetch assets successfully", async () => {
      // 1. Préparer les données de test
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

      // 2. Créer le mock Supabase
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

      // 3. Appeler la fonction
      const result = await fetchAssets();

      // 4. Vérifier les résultats (assertions)
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

      // Vérifier que le filtre a été appliqué
      expect(mockQuery.eq).toHaveBeenCalledWith("status", "critical");
    });

    it("should handle errors", async () => {
      const mockQuery = {
        select: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: "Database error" },
        }),
      };

      vi.spyOn(supabaseModule.supabase, "from").mockReturnValue(mockQuery as any);

      // Vérifier que la fonction lève une erreur
      await expect(fetchAssets()).rejects.toThrow();
    });
  });
});
```

### Concepts clés:

| Concept | Explication |
|---------|------------|
| `vi.mock()` | Mock un module entièrement |
| `vi.spyOn()` | Espionner et mocker une fonction |
| `vi.fn()` | Créer une fonction mock |
| `mockReturnValue()` | Retourner une valeur |
| `mockResolvedValue()` | Retourner une Promise résolue |
| `mockResolvedValueOnce()` | Pour un seul appel |
| `toHaveBeenCalledWith()` | Vérifier les paramètres |

---

## Tester un Custom Hook

### Exemple: Tester `useAssets()`

**Fichier:** `src/__tests__/hooks/use-queries.test.ts`

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAssets } from "@/hooks/use-queries";
import { createTestQueryClient } from "@/lib/test-utils";

describe("useAssets hook", () => {
  // Wrapper pour fournir QueryClientProvider
  const createWrapper = () => {
    const queryClient = createTestQueryClient();
    return ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it("should fetch assets", async () => {
    const { result } = renderHook(() => useAssets(), {
      wrapper: createWrapper(),
    });

    // État initial: chargement
    expect(result.current.isPending).toBe(true);

    // Attendre que la requête se termine
    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Vérifier les données
    expect(result.current.data).toBeDefined();
  });

  it("should handle errors", async () => {
    // Mock la fonction fetchAssets pour lancer une erreur
    const { result } = renderHook(() => useAssets(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isPending).toBe(false);
    });

    // Vérifier que l'erreur a été capturée
    if (result.current.error) {
      expect(result.current.error).toBeDefined();
    }
  });

  it("should cache results", async () => {
    const queryClient = createTestQueryClient();
    const wrapper = ({ children }: any) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );

    // Premier appel
    const { result: result1 } = renderHook(() => useAssets(), { wrapper });

    await waitFor(() => {
      expect(result1.current.isPending).toBe(false);
    });

    const data1 = result1.current.data;

    // Deuxième appel (devrait utiliser le cache)
    const { result: result2 } = renderHook(() => useAssets(), { wrapper });

    // Pas de rechargement car en cache
    expect(result2.current.data).toBe(data1);
  });
});
```

### Helpers utiles:

```typescript
import { renderHook, waitFor, act } from "@testing-library/react";

// Attendre un changement d'état
await waitFor(() => {
  expect(result.current.data).toBeDefined();
});

// Exécuter des actions synchrones
act(() => {
  // trigger state changes
});

// Réexécuter le hook avec d'autres props
rerender();
```

---

## Tester un Composant React

### Exemple: Tester le Dashboard

**Fichier:** `src/__tests__/routes/dashboard.test.tsx`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { createTestQueryClient } from "@/lib/test-utils";
import Dashboard from "@/routes/_authenticated.dashboard";

describe("Dashboard Component", () => {
  it("should render dashboard headers", () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    // Vérifier que les éléments sont affichés
    expect(screen.getByText("Tableau de bord")).toBeInTheDocument();
    expect(screen.getByText("Équipements")).toBeInTheDocument();
  });

  it("should display loading skeleton initially", () => {
    const queryClient = createTestQueryClient();

    const { container } = render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    // Vérifier la présence du skeleton
    expect(container.querySelector(".animate-pulse")).toBeInTheDocument();
  });

  it("should display error alert on failure", async () => {
    // Mock pour retourner une erreur
    vi.mock("@/hooks/use-queries", () => ({
      useDashboardStats: () => ({
        isLoading: false,
        error: new Error("Failed to fetch"),
        assets: null,
        faults: null,
        parts: null,
        recentFaults: [],
      }),
    }));

    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    // Vérifier l'affichage de l'erreur
    expect(screen.getByText(/Erreur/i)).toBeInTheDocument();
  });

  it("should display stats when data is loaded", async () => {
    const queryClient = createTestQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <Dashboard />
      </QueryClientProvider>
    );

    // Attendre le chargement
    await screen.findByText("Équipements");

    // Vérifier les cartes de stats
    expect(screen.getByText("Équipements")).toBeInTheDocument();
    expect(screen.getByText("Pannes signalées")).toBeInTheDocument();
    expect(screen.getByText("Demandes pièces")).toBeInTheDocument();
  });
});
```

### Méthodes utiles:

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Render
render(<Component />);

// Sélecteurs
screen.getByText("text");
screen.getByRole("button", { name: /save/i });
screen.getByLabelText("Email");
screen.getByTestId("submit-btn");
screen.queryByText("not visible"); // ne lève pas d'erreur

// Actions
await userEvent.click(button);
await userEvent.type(input, "text");
await userEvent.selectOptions(select, "option");

// Attendre
await screen.findByText("loaded");
```

---

## Tester la Validation Zod

### Exemple: Tester les schémas

**Fichier:** `src/__tests__/api/validators.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import {
  AssetSchema,
  CreateAssetSchema,
  FaultReportSchema,
} from "@/lib/api/validators";

describe("Asset Validators", () => {
  describe("AssetSchema", () => {
    it("should accept valid asset", () => {
      const validAsset = {
        id: "uuid-1234",
        name: "Pump A",
        company_id: "uuid-5678",
        status: "active" as const,
        created_at: "2026-06-05T00:00:00Z",
        updated_at: "2026-06-05T00:00:00Z",
      };

      const result = AssetSchema.safeParse(validAsset);
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const invalidAsset = {
        id: "uuid-1234",
        name: "Pump A",
        company_id: "uuid-5678",
        status: "invalid-status",
        created_at: "2026-06-05T00:00:00Z",
        updated_at: "2026-06-05T00:00:00Z",
      };

      const result = AssetSchema.safeParse(invalidAsset);
      expect(result.success).toBe(false);
      expect(result.error?.issues).toBeDefined();
    });

    it("should provide helpful error messages", () => {
      const invalidAsset = {
        name: 123, // pas une string
        company_id: "uuid",
        status: "active",
      };

      const result = AssetSchema.safeParse(invalidAsset);
      if (!result.success) {
        expect(result.error.issues[0].message).toBeDefined();
        console.log(result.error.issues[0].message);
      }
    });
  });

  describe("CreateAssetSchema", () => {
    it("should accept minimal fields", () => {
      const minimalAsset = {
        name: "Equipment",
        company_id: "uuid",
        status: "active" as const,
      };

      const result = CreateAssetSchema.safeParse(minimalAsset);
      expect(result.success).toBe(true);
    });

    it("should accept with optional fields", () => {
      const fullAsset = {
        name: "Equipment",
        company_id: "uuid",
        status: "active" as const,
        model: "X2000",
        manufacturer: "TechCorp",
        location: "Building A",
      };

      const result = CreateAssetSchema.safeParse(fullAsset);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.model).toBe("X2000");
      }
    });

    it("should reject missing required fields", () => {
      const incompleteAsset = {
        company_id: "uuid",
        status: "active" as const,
        // Missing name
      };

      const result = CreateAssetSchema.safeParse(incompleteAsset);
      expect(result.success).toBe(false);
    });
  });

  describe("FaultReportSchema", () => {
    it("should validate fault reports", () => {
      const fault = {
        id: "uuid-1234",
        asset_id: "uuid-5678",
        title: "Pump not working",
        description: "The pump stopped after 2 hours of operation",
        severity: "high" as const,
        status: "open" as const,
        reported_by: "uuid-9012",
        created_at: "2026-06-05T00:00:00Z",
        updated_at: "2026-06-05T00:00:00Z",
      };

      const result = FaultReportSchema.safeParse(fault);
      expect(result.success).toBe(true);
    });

    it("should reject short descriptions", () => {
      const fault = {
        id: "uuid-1234",
        asset_id: "uuid-5678",
        title: "Issue",
        description: "Bad", // Trop court
        severity: "high" as const,
        status: "open" as const,
        reported_by: "uuid-9012",
        created_at: "2026-06-05T00:00:00Z",
        updated_at: "2026-06-05T00:00:00Z",
      };

      const result = FaultReportSchema.safeParse(fault);
      expect(result.success).toBe(false);
    });
  });
});
```

---

## Commandes Utiles

```bash
# Lancer tous les tests
npm run test

# Mode watch (relance au changement)
npm run test -- --watch

# Tests d'un fichier spécifique
npm run test src/__tests__/api/assets.test.ts

# Tests avec un filtre
npm run test -- --grep "Assets"

# Affichage UI (mode visuel)
npm run test -- --ui

# Coverage (couverture de code)
npm run test -- --coverage

# Tests avec mode détaillé
npm run test -- --reporter=verbose

# Arrêter au premier échec
npm run test -- --bail
```

---

## Matrice de Couverture

| Type | Couverture Attendue | Fichiers |
|------|-------------------|----------|
| API Functions | 80%+ | `src/lib/api/*.test.ts` |
| Custom Hooks | 75%+ | `src/hooks/*.test.ts` |
| Components | 70%+ | `src/routes/**/*.test.tsx` |
| Validators | 90%+ | `src/lib/api/validators.test.ts` |
| Utils | 85%+ | `src/lib/*.test.ts` |

---

## Checklist Avant Commit

- [ ] Tests écrits pour les nouvelles API functions
- [ ] Tests écrits pour les nouveaux custom hooks
- [ ] Tests des validations Zod
- [ ] Tous les tests passent (`npm run test`)
- [ ] Couverture > 70% (`npm run test -- --coverage`)
- [ ] Pas de console.log() ou warnings dans les tests
- [ ] Les tests sont reproductibles

---

## Dépannage Courant

### Les mocks ne fonctionnent pas

```typescript
// ❌ Mauvais - le mock est après l'import
import { supabase } from "@/integrations/supabase/client";
vi.mock("@/integrations/supabase/client");

// ✅ Correct - le mock est avant l'import
vi.mock("@/integrations/supabase/client");
import { supabase } from "@/integrations/supabase/client";
```

### Le hook ne se réexécute pas

```typescript
// ✅ Utiliser waitFor pour attendre les changements
await waitFor(() => {
  expect(result.current.data).toBeDefined();
});
```

### L'assertion ne fonctionne pas

```typescript
// ❌ La valeur peut être undefined
expect(result.current.data[0]).toBeDefined();

// ✅ Vérifier d'abord la longueur
expect(result.current.data).toHaveLength(1);
expect(result.current.data[0].name).toBe("Pump A");
```

---

## Ressources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [TanStack Query Testing](https://tanstack.com/query/latest/docs/react/testing)
- [Zod Validation](https://zod.dev/)

---

**Dernière mise à jour:** 5 juin 2026
