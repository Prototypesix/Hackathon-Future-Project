/**
 * Schémas Zod pour validation des données côté client et serveur
 */

import { z } from "zod";

// =====================
// Assets
// =====================
export const AssetSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Asset name required"),
  company_id: z.string().uuid(),
  category_id: z.string().uuid().optional(),
  model: z.string().optional(),
  manufacturer: z.string().optional(),
  serial_number: z.string().optional(),
  location: z.string().optional(),
  status: z.enum(["active", "maintenance", "down", "critical"]),
  photo_url: z.string().url().optional(),
  qr_code: z.string().optional(),
  purchase_date: z.string().datetime().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  created_by: z.string().uuid().optional(),
});

export type Asset = z.infer<typeof AssetSchema>;

export const CreateAssetSchema = AssetSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
});

export type CreateAsset = z.infer<typeof CreateAssetSchema>;

// =====================
// Fault Reports
// =====================
export const FaultReportSchema = z.object({
  id: z.string().uuid(),
  asset_id: z.string().uuid(),
  title: z.string().min(1, "Title required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  severity: z.enum(["low", "medium", "high", "critical"]),
  status: z.enum(["open", "in_progress", "resolved", "closed"]),
  reported_by: z.string().uuid(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type FaultReport = z.infer<typeof FaultReportSchema>;

export const CreateFaultReportSchema = FaultReportSchema.omit({
  id: true,
  status: true,
  created_at: true,
  updated_at: true,
});

export type CreateFaultReport = z.infer<typeof CreateFaultReportSchema>;

// =====================
// Spare Part Requests
// =====================
export const SparePartRequestSchema = z.object({
  id: z.string().uuid(),
  asset_id: z.string().uuid(),
  part_name: z.string().min(1, "Part name required"),
  quantity: z.number().int().positive("Quantity must be positive"),
  urgency: z.enum(["low", "medium", "high", "critical"]),
  status: z.string(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type SparePartRequest = z.infer<typeof SparePartRequestSchema>;

export const CreateSparePartRequestSchema = SparePartRequestSchema.omit({
  id: true,
  status: true,
  created_at: true,
  updated_at: true,
});

export type CreateSparePartRequest = z.infer<typeof CreateSparePartRequestSchema>;

// =====================
// Profiles
// =====================
export const ProfileSchema = z.object({
  id: z.string().uuid(),
  full_name: z.string().nullable(),
  avatar_url: z.string().url().nullable(),
  company_id: z.string().uuid().nullable(),
});

export type Profile = z.infer<typeof ProfileSchema>;

// =====================
// Query Filters
// =====================
export const PaginationSchema = z.object({
  page: z.number().int().positive().default(1),
  pageSize: z.number().int().positive().max(100).default(20),
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const AssetFiltersSchema = z.object({
  status: z.enum(["active", "maintenance", "down", "critical"]).optional(),
  category_id: z.string().uuid().optional(),
  search: z.string().optional(),
  ...PaginationSchema.shape,
});

export type AssetFilters = z.infer<typeof AssetFiltersSchema>;
