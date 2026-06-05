/**
 * Custom hooks pour TanStack Query avec caching optimisé
 */

import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { fetchAssets, fetchAsset, fetchAssetStats } from "@/lib/api/assets";
import { fetchFaultReports, fetchRecentFaults, fetchFaultStats } from "@/lib/api/faults";
import { fetchSparePartRequests, fetchSparePartStats } from "@/lib/api/spare-parts";
import { Asset, AssetFilters, FaultReport, SparePartRequest } from "@/lib/api/validators";
import { ApiError, getErrorMessage } from "@/lib/api/errors";

// Configuration par défaut du caching
const DEFAULT_STALE_TIME = 1000 * 60 * 5; // 5 minutes
const DEFAULT_GC_TIME = 1000 * 60 * 10; // 10 minutes

// =====================
// Assets Hooks
// =====================

export function useAssets(filters?: Partial<AssetFilters>) {
  return useQuery<any, ApiError>({
    queryKey: ["assets", filters],
    queryFn: () => fetchAssets(filters),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useAsset(id: string) {
  return useQuery<Asset, ApiError>({
    queryKey: ["asset", id],
    queryFn: () => fetchAsset(id),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
    enabled: !!id,
  });
}

export function useAssetStats() {
  return useQuery<any, ApiError>({
    queryKey: ["asset-stats"],
    queryFn: () => fetchAssetStats(),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// =====================
// Faults Hooks
// =====================

export function useFaultReports(filters?: any) {
  return useQuery<any, ApiError>({
    queryKey: ["fault-reports", filters],
    queryFn: () => fetchFaultReports(filters),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useRecentFaults(limit?: number) {
  return useQuery<FaultReport[], ApiError>({
    queryKey: ["recent-faults", limit],
    queryFn: () => fetchRecentFaults(limit),
    staleTime: 1000 * 60 * 2, // 2 minutes pour les données "récentes"
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useFaultStats() {
  return useQuery<any, ApiError>({
    queryKey: ["fault-stats"],
    queryFn: () => fetchFaultStats(),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// =====================
// Spare Parts Hooks
// =====================

export function useSparePartRequests(filters?: any) {
  return useQuery<any, ApiError>({
    queryKey: ["spare-part-requests", filters],
    queryFn: () => fetchSparePartRequests(filters),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

export function useSparePartStats() {
  return useQuery<any, ApiError>({
    queryKey: ["spare-part-stats"],
    queryFn: () => fetchSparePartStats(),
    staleTime: DEFAULT_STALE_TIME,
    gcTime: DEFAULT_GC_TIME,
  });
}

// =====================
// Combined Dashboard Hook
// =====================

export function useDashboardStats() {
  const assetsResult = useAssetStats();
  const faultsResult = useFaultStats();
  const partsResult = useSparePartStats();
  const recentFaultsResult = useRecentFaults(6);

  const isLoading = assetsResult.isPending || faultsResult.isPending || partsResult.isPending;
  const error = assetsResult.error || faultsResult.error || partsResult.error;

  return {
    assets: assetsResult.data,
    faults: faultsResult.data,
    parts: partsResult.data,
    recentFaults: recentFaultsResult.data,
    isLoading,
    error,
    isFetching:
      assetsResult.isFetching ||
      faultsResult.isFetching ||
      partsResult.isFetching ||
      recentFaultsResult.isFetching,
  };
}
