/**
 * Utilitaires de formatage et conversion
 */

import { formatDistanceToNow, formatDate as fnsFormatDate } from "date-fns";
import { fr } from "date-fns/locale";

/**
 * Formate une date relative en français
 */
export function formatDateRelative(date: string | Date): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return formatDistanceToNow(d, { addSuffix: true, locale: fr });
  } catch {
    return "Date invalide";
  }
}

/**
 * Formate une date en format court
 */
export function formatDate(date: string | Date, format: string = "dd/MM/yyyy"): string {
  try {
    const d = typeof date === "string" ? new Date(date) : date;
    return fnsFormatDate(d, format, { locale: fr });
  } catch {
    return "Date invalide";
  }
}

/**
 * Formate une date avec heure
 */
export function formatDateTime(date: string | Date): string {
  return formatDate(date, "dd/MM/yyyy HH:mm");
}

/**
 * Obtient le label d'un statut
 */
export const statusLabels: Record<string, string> = {
  // Asset status
  active: "Actif",
  maintenance: "Maintenance",
  down: "En panne",
  critical: "Critique",

  // Fault status
  open: "Ouvert",
  in_progress: "En cours",
  resolved: "Résolu",
  closed: "Fermé",

  // Spare part status
  submitted: "Soumis",
  review: "Révision",
  inspection: "Inspection",
  analysis: "Analyse",
  engineering: "Ingénierie",
  fabrication: "Fabrication",
  qc: "QC",
  shipped: "Expédié",
  delivered: "Livré",
  cancelled: "Annulé",
};

export function getStatusLabel(status: string): string {
  return statusLabels[status] ?? status;
}

/**
 * Obtient le label de sévérité
 */
export const severityLabels: Record<string, string> = {
  low: "Basse",
  medium: "Moyenne",
  high: "Élevée",
  critical: "Critique",
};

export function getSeverityLabel(severity: string): string {
  return severityLabels[severity] ?? severity;
}

/**
 * Obtient la couleur d'un statut
 */
export const statusColors: Record<string, string> = {
  // Asset status
  active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  maintenance: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  down: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",

  // Fault status
  open: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  closed: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",

  // Spare part status - workflow
  submitted: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  review: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  inspection: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  analysis: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  engineering: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  fabrication: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  qc: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  shipped: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  delivered: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  cancelled: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function getStatusColor(status: string): string {
  return statusColors[status] ?? "bg-gray-100 text-gray-800";
}

/**
 * Obtient la couleur de sévérité
 */
export const severityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function getSeverityColor(severity: string): string {
  return severityColors[severity] ?? "bg-gray-100 text-gray-800";
}

/**
 * Génère un slug à partir d'une chaîne
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/**
 * Tronque une chaîne de caractères
 */
export function truncate(str: string, length: number = 50): string {
  return str.length > length ? str.substring(0, length) + "..." : str;
}

/**
 * Formate un nombre de secondes en durée lisible
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  const parts = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

  return parts.join(" ");
}
