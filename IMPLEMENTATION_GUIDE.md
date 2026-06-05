/**
 * Exemple d'implémentation d'une page Assets refactorisée
 * This file demonstrates how to refactor existing pages using the new improvements
 */

/**
 * TEMPLATE: Refactorer une page existante
 * =======================================
 * 
 * Avant: utilisation de useQuery directement avec supabase
 * Après: utilisation des custom hooks et API functions
 */

// AVANT - Antipattern (à ne pas utiliser)
/**
 * 
 * import { useQuery } from "@tanstack/react-query";
 * import { supabase } from "@/integrations/supabase/client";
 * 
 * function AssetsPage() {
 *   const [assets, setAssets] = useState<any[]>([]);
 *   const [loading, setLoading] = useState(true);
 *   const [error, setError] = useState<string | null>(null);
 * 
 *   useEffect(() => {
 *     async function load() {
 *       try {
 *         const { data, error } = await supabase
 *           .from("assets")
 *           .select("*");
 * 
 *         if (error) throw error;
 *         setAssets(data as any);
 *       } catch (err: any) {
 *         setError(err.message);
 *       } finally {
 *         setLoading(false);
 *       }
 *     }
 *     load();
 *   }, []);
 * 
 *   if (loading) return <div>Loading...</div>;
 *   if (error) return <div>Error: {error}</div>;
 * 
 *   return (
 *     <div>
 *       {assets.map((asset: any) => (
 *         <div key={asset.id}>{asset.name}</div>
 *       ))}
 *     </div>
 *   );
 * }
 */

// APRÈS - Best practice (utiliser ce pattern)
/**
 * 
 * import { useAssets } from "@/hooks/use-queries";
 * import { 
 *   LoadingSkeleton, 
 *   ErrorAlert, 
 *   EmptyState,
 *   QueryWrapper 
 * } from "@/lib/ui-helpers";
 * import type { AssetFilters } from "@/lib/api/validators";
 * 
 * function AssetsPage() {
 *   const [filters, setFilters] = useState<Partial<AssetFilters>>({});
 *   const { data: assetData, isLoading, error } = useAssets(filters);
 * 
 *   const handleFilterChange = (newFilters: Partial<AssetFilters>) => {
 *     setFilters(newFilters);
 *   };
 * 
 *   return (
 *     <>
 *       <PageHeader title="Équipements" />
 *       <PageBody>
 *         <AssetFilters onChange={handleFilterChange} />
 * 
 *         <QueryWrapper
 *           isLoading={isLoading}
 *           error={error}
 *           data={assetData?.data}
 *           isEmpty={(data) => !data || data.length === 0}
 *         >
 *           {(assets) => (
 *             <div className="grid gap-4">
 *               {assets.map((asset) => (
 *                 <AssetCard key={asset.id} asset={asset} />
 *               ))}
 *             </div>
 *           )}
 *         </QueryWrapper>
 *       </PageBody>
 *     </>
 *   );
 * }
 */

/**
 * PATTERN: Composant de création avec validation
 */

// EXEMPLE: Créer un nouvel asset
/**
 * 
 * import { useCallback, useState } from "react";
 * import { useMutation, useQueryClient } from "@tanstack/react-query";
 * import { createAsset } from "@/lib/api/assets";
 * import { CreateAssetSchema } from "@/lib/api/validators";
 * import { getErrorMessage } from "@/lib/api/errors";
 * import { useToast } from "@/components/ui/use-toast";
 * 
 * function CreateAssetForm() {
 *   const queryClient = useQueryClient();
 *   const { toast } = useToast();
 *   const [formData, setFormData] = useState({
 *     name: "",
 *     model: "",
 *     manufacturer: "",
 *   });
 * 
 *   const createMutation = useMutation({
 *     mutationFn: async (data) => {
 *       const validated = CreateAssetSchema.parse({
 *         ...data,
 *         company_id: "...",
 *         status: "active",
 *       });
 *       return createAsset(validated);
 *     },
 *     onSuccess: () => {
 *       queryClient.invalidateQueries({ queryKey: ["assets"] });
 *       toast.success("Asset créé avec succès!");
 *       setFormData({ name: "", model: "", manufacturer: "" });
 *     },
 *     onError: (error) => {
 *       toast.error(getErrorMessage(error));
 *     },
 *   });
 * 
 *   const handleSubmit = (e: React.FormEvent) => {
 *     e.preventDefault();
 *     createMutation.mutate(formData);
 *   };
 * 
 *   return (
 *     <form onSubmit={handleSubmit}>
 *       <input
 *         value={formData.name}
 *         onChange={(e) =>
 *           setFormData({ ...formData, name: e.target.value })
 *         }
 *       />
 *       <button type="submit" disabled={createMutation.isPending}>
 *         {createMutation.isPending ? "Création..." : "Créer"}
 *       </button>
 *     </form>
 *   );
 * }
 */

/**
 * PATTERN: Afficher des statistiques avec combinaison de hooks
 */

// EXEMPLE: Dashboard avec données combinées
/**
 * 
 * import { 
 *   useDashboardStats, 
 *   useAssetStats, 
 *   useFaultStats 
 * } from "@/hooks/use-queries";
 * 
 * function StatisticsSection() {
 *   const { assets, faults, parts, isLoading } = useDashboardStats();
 * 
 *   if (isLoading) return <LoadingSkeleton count={4} />;
 * 
 *   return (
 *     <div className="grid grid-cols-4 gap-4">
 *       <StatCard 
 *         label="Équipements actifs"
 *         value={assets?.byStatus?.active ?? 0}
 *       />
 *       <StatCard 
 *         label="Pannes ouvertes"
 *         value={faults?.open ?? 0}
 *       />
 *       <StatCard 
 *         label="Pièces en attente"
 *         value={parts?.pending ?? 0}
 *       />
 *     </div>
 *   );
 * }
 */

/**
 * PATTERN: Filtrage et pagination
 */

// EXEMPLE: Liste paginée avec filtres
/**
 * 
 * import { useState } from "react";
 * import { useAssets } from "@/hooks/use-queries";
 * import { Pagination } from "@/components/ui/pagination";
 * import type { AssetFilters } from "@/lib/api/validators";
 * 
 * function PaginatedAssets() {
 *   const [filters, setFilters] = useState<Partial<AssetFilters>>({
 *     page: 1,
 *     pageSize: 20,
 *   });
 * 
 *   const { data: assetData, isLoading } = useAssets(filters);
 * 
 *   const handlePageChange = (page: number) => {
 *     setFilters((prev) => ({ ...prev, page }));
 *   };
 * 
 *   const handleStatusFilter = (status: string) => {
 *     setFilters((prev) => ({ ...prev, page: 1, status }));
 *   };
 * 
 *   return (
 *     <div>
 *       <AssetStatusFilter onChange={handleStatusFilter} />
 * 
 *       <AssetList 
 *         assets={assetData?.data ?? []} 
 *         isLoading={isLoading} 
 *       />
 * 
 *       {assetData && (
 *         <Pagination
 *           currentPage={filters.page ?? 1}
 *           totalPages={Math.ceil(assetData.count / (filters.pageSize ?? 20))}
 *           onPageChange={handlePageChange}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 */

/**
 * PATTERN: Gestion des erreurs avec retry
 */

// EXEMPLE: Composant avec logique de retry
/**
 * 
 * import { useCallback } from "react";
 * import { useQueryClient } from "@tanstack/react-query";
 * import { useAsset } from "@/hooks/use-queries";
 * import { ErrorAlert } from "@/lib/ui-helpers";
 * 
 * function AssetDetail({ assetId }: { assetId: string }) {
 *   const queryClient = useQueryClient();
 *   const { data: asset, error, refetch } = useAsset(assetId);
 * 
 *   const handleRetry = useCallback(() => {
 *     queryClient.invalidateQueries({ queryKey: ["asset", assetId] });
 *     refetch();
 *   }, [assetId, queryClient, refetch]);
 * 
 *   if (error) {
 *     return (
 *       <ErrorAlert 
 *         message={error.message}
 *         onRetry={handleRetry}
 *       />
 *     );
 *   }
 * 
 *   return <div>{asset?.name}</div>;
 * }
 */

/**
 * CHECKLIST: Avant de committer du code
 * ======================================
 * 
 * - [ ] Les requêtes API utilisent les fonctions de src/lib/api/*
 * - [ ] Les types sont importés de src/lib/api/validators
 * - [ ] Les erreurs sont catchées avec getErrorMessage()
 * - [ ] Les données sont validées avec les schémas Zod
 * - [ ] Les dates sont formatées avec formatDateRelative() ou formatDate()
 * - [ ] Les états loading/error sont gérés avec des composants UI
 * - [ ] Aucun `any` type n'est utilisé sans raison valide
 * - [ ] Les custom hooks sont utilisés pour les requêtes répétées
 * - [ ] Le code utilise QueryWrapper ou composants similaires
 * - [ ] Les tests sont écrits pour les nouvelles fonctionnalités
 */

export {};
