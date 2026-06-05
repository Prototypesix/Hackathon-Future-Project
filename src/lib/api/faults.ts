/**
 * API functions pour la gestion des pannes (faults)
 */

import { supabase } from "@/integrations/supabase/client";
import {
  FaultReport,
  CreateFaultReport,
  FaultReportSchema,
  CreateFaultReportSchema,
} from "./validators";
import { handleSupabaseError } from "./errors";

interface FaultResponse {
  data: FaultReport[];
  count: number;
  hasMore: boolean;
}

interface FaultFilters {
  page?: number;
  pageSize?: number;
  status?: string;
  severity?: string;
  assetId?: string;
}

/**
 * Récupère la liste des pannes avec filtres
 */
export async function fetchFaultReports(filters: FaultFilters = {}): Promise<FaultResponse> {
  try {
    const { page = 1, pageSize = 20, status, severity, assetId } = filters;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from("fault_reports")
      .select("*, assets(name)", { count: "exact" });

    if (status) {
      query = query.eq("status", status);
    }

    if (severity) {
      query = query.eq("severity", severity);
    }

    if (assetId) {
      query = query.eq("asset_id", assetId);
    }

    const { data, count, error } = await query
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) handleSupabaseError(error);

    const validatedData = data?.map((item) => FaultReportSchema.parse(item)) ?? [];

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
 * Récupère une panne spécifique
 */
export async function fetchFaultReport(id: string): Promise<FaultReport> {
  try {
    const { data, error } = await supabase
      .from("fault_reports")
      .select("*, assets(name), fault_images(*)")
      .eq("id", id)
      .single();

    if (error) handleSupabaseError(error);

    return FaultReportSchema.parse(data);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Crée une nouvelle panne
 */
export async function createFaultReport(fault: CreateFaultReport): Promise<FaultReport> {
  try {
    const validatedFault = CreateFaultReportSchema.parse(fault);

    const { data, error } = await supabase
      .from("fault_reports")
      .insert([{ ...validatedFault, status: "open" }])
      .select()
      .single();

    if (error) handleSupabaseError(error);

    return FaultReportSchema.parse(data);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Met à jour le statut d'une panne
 */
export async function updateFaultStatus(id: string, status: string): Promise<FaultReport> {
  try {
    const { data, error } = await supabase
      .from("fault_reports")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) handleSupabaseError(error);

    return FaultReportSchema.parse(data);
  } catch (error) {
    handleSupabaseError(error);
  }
}

/**
 * Récupère les pannes récentes
 */
export async function fetchRecentFaults(limit: number = 6): Promise<FaultReport[]> {
  try {
    const { data, error } = await supabase
      .from("fault_reports")
      .select("*, assets(name)")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) handleSupabaseError(error);

    return data?.map((item) => FaultReportSchema.parse(item)) ?? [];
  } catch (error) {
    handleSupabaseError(error);
    return [];
  }
}

/**
 * Récupère les statistiques des pannes
 */
export async function fetchFaultStats(): Promise<{
  total: number;
  open: number;
  bySeverity: Record<string, number>;
  byStatus: Record<string, number>;
}> {
  try {
    const { data, error } = await supabase.from("fault_reports").select("severity, status");

    if (error) handleSupabaseError(error);

    const stats = {
      total: data?.length ?? 0,
      open: data?.filter((f: any) => f.status === "open").length ?? 0,
      bySeverity: {} as Record<string, number>,
      byStatus: {} as Record<string, number>,
    };

    data?.forEach((item: any) => {
      stats.bySeverity[item.severity] = (stats.bySeverity[item.severity] ?? 0) + 1;
      stats.byStatus[item.status] = (stats.byStatus[item.status] ?? 0) + 1;
    });

    return stats;
  } catch (error) {
    handleSupabaseError(error);
    return { total: 0, open: 0, bySeverity: {}, byStatus: {} };
  }
}
