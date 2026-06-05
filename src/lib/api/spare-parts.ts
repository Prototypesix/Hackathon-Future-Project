/**
 * API functions pour la gestion des demandes de pièces détachées
 */

import { supabase } from "@/integrations/supabase/client";
import {
  SparePartRequest,
  CreateSparePartRequest,
  SparePartRequestSchema,
  CreateSparePartRequestSchema,
} from "./validators";
import { handleSupabaseError } from "./errors";

interface SparePartResponse {
  data: SparePartRequest[];
  count: number;
  hasMore: boolean;
}

interface SparePartFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  urgency?: string;
  assetId?: string;
}

/**
 * Récupère les demandes de pièces détachées
 */
export async function fetchSparePartRequests(
  filters: SparePartFilters = {}
): Promise<SparePartResponse> {
  try {
    const { page = 1, pageSize = 20, status, urgency, assetId } = filters;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("spare_part_requests")
      .select("*, assets(name)", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    if (urgency) {
      query = query.eq("urgency", urgency);
    }

    if (assetId) {
      query = query.eq("asset_id", assetId);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) handleSupabaseError(error);

    const validatedData = data?.map((item) => SparePartRequestSchema.parse(item)) ?? [];

    return {
      data: validatedData,
      count: count ?? 0,
      hasMore: (page * pageSize) < (count ?? 0),
    };
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Crée une nouvelle demande de pièce
 */
export async function createSparePartRequest(
  request: CreateSparePartRequest
): Promise<SparePartRequest> {
  try {
    const validatedRequest = CreateSparePartRequestSchema.parse(request);

    const { data, error } = await supabase
      .from("spare_part_requests")
      .insert([{ ...validatedRequest, status: "submitted" }])
      .select()
      .single();

    if (error) handleSupabaseError(error);

    return SparePartRequestSchema.parse(data);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Met à jour le statut d'une demande
 */
export async function updateSparePartStatus(
  id: string,
  status: string
): Promise<SparePartRequest> {
  try {
    const { data, error } = await supabase
      .from("spare_part_requests")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) handleSupabaseError(error);

    return SparePartRequestSchema.parse(data);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Récupère les statistiques des demandes
 */
export async function fetchSparePartStats(): Promise<{
  total: number;
  pending: number;
  byUrgency: Record<string, number>;
  byStatus: Record<string, number>;
}> {
  try {
    const { data, error } = await supabase
      .from("spare_part_requests")
      .select("urgency, status");

    if (error) handleSupabaseError(error);

    const stats = {
      total: data?.length ?? 0,
      pending: data?.filter((r: any) => !["delivered", "cancelled"].includes(r.status))
        .length ?? 0,
      byUrgency: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    data?.forEach((item: any) => {
      stats.byUrgency[item.urgency] = (stats.byUrgency[item.urgency] ?? 0) + 1;
      stats.byStatus[item.status] = (stats.byStatus[item.status] ?? 0) + 1;
    });

    return stats;
  } catch (error) {
    handleSupabaseError(error);
    return { total: 0, pending: 0, byUrgency: {}, byStatus: {} };
  }
}
