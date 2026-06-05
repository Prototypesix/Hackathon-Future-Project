#!/usr/bin/env node

/**
 * QUICK REFERENCE GUIDE - SmartAsset Improvements
 * Copy and paste ready code snippets
 */

// =============================================================================
// 1. FETCHING DATA
// =============================================================================

// Single source of truth for queries
import { useAssets, useFaultReports, useSparePartRequests, useDashboardStats } from "@/hooks/use-queries";

// Usage:
function MyComponent() {
  const { data: assets, isLoading, error, isFetching } = useAssets({ 
    status: "active",
    page: 1,
    pageSize: 20 
  });
  
  // Shortcut for dashboard
  const dashboard = useDashboardStats();
}

// =============================================================================
// 2. DISPLAYING DATA WITH STATE MANAGEMENT
// =============================================================================

import { QueryWrapper, LoadingSkeleton, ErrorAlert, EmptyState } from "@/lib/ui-helpers";

function DisplayAssets() {
  const { data: assetData, isLoading, error } = useAssets();
  
  return (
    <QueryWrapper
      isLoading={isLoading}
      error={error}
      data={assetData?.data}
      isEmpty={(data) => !data || data.length === 0}
    >
      {(assets) => (
        <ul>
          {assets.map(asset => (
            <li key={asset.id}>{asset.name}</li>
          ))}
        </ul>
      )}
    </QueryWrapper>
  );
}

// =============================================================================
// 3. CREATING/UPDATING DATA
// =============================================================================

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createAsset, updateAsset } from "@/lib/api/assets";
import { CreateAssetSchema, AssetSchema } from "@/lib/api/validators";
import { getErrorMessage } from "@/lib/api/errors";

function CreateAssetForm() {
  const queryClient = useQueryClient();
  
  const createMutation = useMutation({
    mutationFn: async (formData: any) => {
      // Validate before sending
      const validated = CreateAssetSchema.parse({
        ...formData,
        company_id: "current-company-id",
        status: "active",
      });
      return createAsset(validated);
    },
    onSuccess: (newAsset) => {
      // Invalidate cache to refresh
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      
      // Or manually update cache
      queryClient.setQueryData(["asset", newAsset.id], newAsset);
    },
    onError: (error: any) => {
      alert(getErrorMessage(error));
    },
  });
  
  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      createMutation.mutate(new FormData(e.currentTarget));
    }}>
      <input name="name" required />
      <button disabled={createMutation.isPending}>
        {createMutation.isPending ? "Création..." : "Créer"}
      </button>
    </form>
  );
}

// =============================================================================
// 4. FORMATTING DATA
// =============================================================================

import {
  formatDateRelative,
  formatDate,
  formatDateTime,
  getStatusLabel,
  getSeverityLabel,
  getStatusColor,
  getSeverityColor,
} from "@/lib/formatters";

function FaultCard({ fault }) {
  return (
    <div className={`p-4 ${getStatusColor(fault.status)}`}>
      <h3>{fault.title}</h3>
      <p className="text-sm text-muted-foreground">
        Status: {getStatusLabel(fault.status)}
      </p>
      <p className="text-sm text-muted-foreground">
        Severity: <span className={getSeverityColor(fault.severity)}>
          {getSeverityLabel(fault.severity)}
        </span>
      </p>
      <time>{formatDateRelative(fault.created_at)}</time>
    </div>
  );
}

// =============================================================================
// 5. ERROR HANDLING
// =============================================================================

import { ApiError, ValidationError, AuthError, handleSupabaseError } from "@/lib/api/errors";

async function handleAssetCreation(data: any) {
  try {
    const asset = await createAsset(data);
    console.log("Asset created:", asset);
  } catch (error) {
    if (error instanceof ValidationError) {
      console.error("Validation failed:", error.message);
    } else if (error instanceof AuthError) {
      // Redirect to login
    } else if (error instanceof ApiError) {
      console.error(`Error ${error.status}:`, error.message);
    } else {
      console.error("Unknown error:", error);
    }
  }
}

// =============================================================================
// 6. PAGINATION AND FILTERING
// =============================================================================

import { useState } from "react";
import type { AssetFilters } from "@/lib/api/validators";

function PaginatedAssets() {
  const [filters, setFilters] = useState<Partial<AssetFilters>>({
    page: 1,
    pageSize: 20,
  });

  const { data: assetData } = useAssets(filters);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleStatusFilter = (status: string) => {
    setFilters(prev => ({ ...prev, page: 1, status }));
  };

  return (
    <div>
      <select onChange={(e) => handleStatusFilter(e.target.value)}>
        <option value="">Tous les statuts</option>
        <option value="active">Actif</option>
        <option value="maintenance">Maintenance</option>
        <option value="down">En panne</option>
        <option value="critical">Critique</option>
      </select>

      {assetData?.data.map(asset => (
        <div key={asset.id}>{asset.name}</div>
      ))}

      <div className="flex gap-2">
        <button 
          onClick={() => handlePageChange((filters.page || 1) - 1)}
          disabled={(filters.page || 1) <= 1}
        >
          Précédent
        </button>
        <span>Page {filters.page || 1} / {Math.ceil((assetData?.count || 0) / (filters.pageSize || 20))}</span>
        <button 
          onClick={() => handlePageChange((filters.page || 1) + 1)}
          disabled={!assetData?.hasMore}
        >
          Suivant
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// 7. OPTIMISTIC UPDATES
// =============================================================================

import { useQueryClient } from "@tanstack/react-query";
import { updateAsset } from "@/lib/api/assets";

function UpdateAssetButton({ asset }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (newStatus: string) => updateAsset(asset.id, { status: newStatus }),
    onMutate: async (newStatus) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["assets"] });

      // Snapshot current data
      const previousData = queryClient.getQueryData(["assets"]);

      // Optimistically update
      queryClient.setQueryData(["asset", asset.id], { ...asset, status: newStatus });

      return { previousData };
    },
    onError: (err, newStatus, context: any) => {
      // Revert on error
      queryClient.setQueryData(["asset", asset.id], context.previousData);
    },
  });

  return (
    <button onClick={() => updateMutation.mutate("active")}>
      Mark as Active
    </button>
  );
}

// =============================================================================
// 8. AUTHENTICATION
// =============================================================================

import { useAuth, useProfile } from "@/hooks/use-auth";

function UserInfo() {
  const { user, profile, isLoading, error } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <h2>{profile?.full_name || user.email}</h2>
      <img src={profile?.avatar_url || ""} alt="Avatar" />
    </div>
  );
}

// =============================================================================
// 9. ENVIRONMENT VARIABLES
// =============================================================================

import { getEnv, isProduction, isDevelopment, getEnvVar } from "@/lib/env";

if (isProduction()) {
  console.log("Running in production mode");
}

if (isDevelopment()) {
  console.log("Running in development mode");
}

const env = getEnv();
console.log("Supabase URL:", env.SUPABASE_URL);

// =============================================================================
// 10. TESTING SETUP
// =============================================================================

import { describe, it, expect, beforeEach } from "vitest";
import { createTestQueryClient, createMockSupabaseClient } from "@/lib/test-utils";

describe("My Component", () => {
  let queryClient: any;

  beforeEach(() => {
    queryClient = createTestQueryClient();
  });

  it("should display assets", () => {
    // Your test here
  });
});

// =============================================================================
// COMMON PATTERNS
// =============================================================================

// Pattern 1: Loading multiple related queries
function Dashboard() {
  const assets = useAssets();
  const faults = useFaultReports();
  const parts = useSparePartRequests();

  if (assets.isPending || faults.isPending || parts.isPending) {
    return <LoadingSkeleton count={4} />;
  }

  if (assets.error || faults.error || parts.error) {
    return <ErrorAlert message="Failed to load data" />;
  }

  return <div>{/* content */}</div>;
}

// Pattern 2: Retry with exponential backoff (automatic with TanStack Query)
const { refetch } = useAssets();
await refetch(); // Automatically retries

// Pattern 3: Invalidate specific queries
const queryClient = useQueryClient();
queryClient.invalidateQueries({ queryKey: ["assets"] });
queryClient.invalidateQueries({ queryKey: ["asset-stats"] });

// Pattern 4: Combine with other hooks
function ComplexComponent() {
  const { data: assets } = useAssets();
  const { user } = useAuth();
  const { updateProfile } = useUpdateProfile();

  // Use all hooks together
}

// Pattern 5: Handle async form submission
async function handleSubmit(formData: any) {
  try {
    const validated = CreateAssetSchema.parse(formData);
    const result = await createAsset(validated);
    showSuccess("Asset created!");
    return result;
  } catch (error) {
    showError(getErrorMessage(error));
  }
}

// =============================================================================
// CHECKLIST BEFORE COMMIT
// =============================================================================

/*
Before pushing code:

- [ ] Using API functions from src/lib/api/* instead of direct Supabase queries
- [ ] Validating data with Zod schemas from src/lib/api/validators
- [ ] Handling errors with try/catch and getErrorMessage()
- [ ] Using custom hooks from src/hooks/* for queries
- [ ] Formatting dates with formatDate/formatDateRelative from src/lib/formatters
- [ ] Using QueryWrapper or similar for loading/error states
- [ ] No `any` types without good reason
- [ ] No hardcoded status/severity labels (use getStatusLabel, etc.)
- [ ] Tests written for new functions
- [ ] Documentation updated if needed
*/

export {};
