/**
 * Improved useProfile hook with better error handling and caching
 */

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { handleSupabaseError } from "@/lib/api/errors";
import type { Profile } from "@/lib/api/validators";

/**
 * Hook pour récupérer le profil utilisateur actuel avec cache
 */
export function useProfile() {
  return useQuery<Profile | null, Error>({
    queryKey: ["current-user-profile"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return null;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single();

        if (error) {
          handleSupabaseError(error);
        }

        return data as Profile | null;
      } catch (error) {
        handleSupabaseError(error);
      }
    },
    // Cache le profil pendant 5 minutes
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    retry: 1, // Réessayer une seule fois en cas d'erreur
  });
}

/**
 * Hook pour mettre à jour le profil utilisateur
 */
export function useUpdateProfile() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const updateProfile = useCallback(
    async (updates: Partial<Profile>) => {
      setIsLoading(true);
      setError(null);

      try {
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          throw new Error("User not authenticated");
        }

        const { data, error: updateError } = await supabase
          .from("profiles")
          .update(updates)
          .eq("id", user.id)
          .select()
          .single();

        if (updateError) {
          handleSupabaseError(updateError);
        }

        setIsLoading(false);
        return data;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        setIsLoading(false);
        throw error;
      }
    },
    []
  );

  return { updateProfile, isLoading, error };
}

/**
 * Hook pour gérer l'authentification
 */
export function useAuth() {
  const profile = useProfile();
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function getUser() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (mounted) {
          setUser(user);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch user:", error);
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => {
        if (mounted) {
          setUser(session?.user || null);
        }
      }
    );

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return {
    user,
    profile: profile.data,
    isLoading: isLoading || profile.isPending,
    error: profile.error,
  };
}
