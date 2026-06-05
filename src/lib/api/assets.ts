/**
 * API functions pour la gestion des assets
 */

import { supabase } from "@/integrations/supabase/client";
import {
  Asset,
  CreateAsset,
  AssetFilters,
  AssetSchema,
  CreateAssetSchema,
} from "./validators";
import { handleSupabaseError, ValidationError } from "./errors";

interface AssetResponse {
  data: Asset[];
  count: number;
  hasMore: boolean;
}

/**
 * Récupère la liste des assets avec filtres et pagination
 */
export async function fetchAssets(filters: Partial<AssetFilters> = {}): Promise<AssetResponse> {
  try {
    const { page = 1, pageSize = 20, status, category_id, search } = filters;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from("assets").select("*", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    if (category_id) {
      query = query.eq("category_id", category_id);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) handleSupabaseError(error);

    // Valider les données
    const validatedData = data?.map((item) => AssetSchema.parse(item)) ?? [];

    return {
      data: validatedData,
      count: count ?? 0,
      hasMore: (page * pageSize) < (count ?? 0),
    };
  } catch (error) {
    if (error instanceof ValidationError) throw error;
    handleSupabaseError(error);
  }
}

/**
 * Récupère un asset spécifique par ID
 */
export async function fetchAsset(id: string): Promise<Asset> {
  try {
    const { data, error } = await supabase
      .from("assets")
      .select("*")
      .eq("id", id)
      .single();

    if (error) handleSupabaseError(error);

    return AssetSchema.parse(data);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Crée un nouvel asset
 */
export async function createAsset(asset: CreateAsset): Promise<Asset> {
  try {
    // Valider les données en entrée
    const validatedAsset = CreateAssetSchema.parse(asset);

    const { data, error } = await supabase
      .from("assets")
      .insert([validatedAsset])
      .select()
      .single();

    if (error) handleSupabaseError(error);

    return AssetSchema.parse(data);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Met à jour un asset
 */
export async function updateAsset(id: string, updates: Partial<Asset>): Promise<Asset> {
  try {
    const { data, error } = await supabase
      .from("assets")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) handleSupabaseError(error);

    return AssetSchema.parse(data);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Supprime un asset
 */
export async function deleteAsset(id: string): Promise<void> {
  try {
    const { error } = await supabase.from("assets").delete().eq("id", id);

    if (error) handleSupabaseError(error);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Récupère les statistiques des assets
 */
export async function fetchAssetStats(): Promise<{
  total: number;
  byStatus: Record<string, number>;
  byCategory: Record<string, number>;
}> {
  try {
    const { data, error } = await supabase
      .from("assets")
      .select("status, category_id");

    if (error) handleSupabaseError(error);

    const stats = {
      total: data?.length ?? 0,
      byStatus: {} as Record<string, number>,
      byCategory: {} as Record<string, number>,
    };

    data?.forEach((item: any) => {
      stats.byStatus[item.status] = (stats.byStatus[item.status] ?? 0) + 1;
      if (item.category_id) {
        stats.byCategory[item.category_id] = (stats.byCategory[item.category_id] ?? 0) + 1;
      }
    });

    return stats;
  } catch (error) {
    handleSupabaseError(error);
  }
}
