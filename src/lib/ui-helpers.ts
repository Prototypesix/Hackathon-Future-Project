/**
 * Utilitaires pour gestion des états de chargement et erreurs
 */

import React from "react";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Composant Loading skeleton avec animation
 */
export function LoadingSkeleton({ count = 3, className = "" }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}

/**
 * Composant Loading spinner
 */
export function LoadingSpinner({ message = "Chargement..." }) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2 py-8">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

/**
 * Composant d'erreur
 */
export function ErrorAlert({
  title = "Erreur",
  message,
  onRetry,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
}) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        <div className="space-y-2">
          <p>{message}</p>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm font-medium underline hover:opacity-75"
            >
              Réessayer
            </button>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Composant Empty State
 */
export function EmptyState({
  title = "Aucune donnée",
  description = "Il n'y a rien à afficher pour le moment.",
  icon: Icon = AlertCircle,
}: {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="flex flex-col items-center justify-center space-y-2 py-12 text-center">
      <Icon className="h-8 w-8 text-muted-foreground" />
      <div>
        <h3 className="font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

/**
 * Composant QueryWrapper pour gérer les états de requête
 */
export function QueryWrapper<T>({
  isLoading,
  error,
  data,
  isEmpty,
  children,
  onRetry,
}: {
  isLoading: boolean;
  error: Error | null;
  data: T | undefined;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => React.ReactNode;
  onRetry?: () => void;
}) {
  if (isLoading) {
    return <LoadingSkeleton count={5} />;
  }

  if (error) {
    return <ErrorAlert message={error.message} onRetry={onRetry} />;
  }

  if (!data || (isEmpty && isEmpty(data))) {
    return <EmptyState />;
  }

  return <>{children(data)}</>;
}

/**
 * Hook pour gérer les états de mutation
 */
export function useMutationState() {
  const [state, setState] = React.useState<{
    isLoading: boolean;
    error: Error | null;
    success: boolean;
  }>({
    isLoading: false,
    error: null,
    success: false,
  });

  const setLoading = (isLoading: boolean) =>
    setState((s) => ({ ...s, isLoading }));

  const setError = (error: Error | null) =>
    setState((s) => ({ ...s, error, success: false }));

  const setSuccess = () =>
    setState((s) => ({ ...s, success: true, error: null }));

  const reset = () =>
    setState({ isLoading: false, error: null, success: false });

  return { ...state, setLoading, setError, setSuccess, reset };
}
