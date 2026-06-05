/**
 * Configuration sécurisée des variables d'environnement
 */

import { z } from "zod";

// Schéma de validation des variables d'environnement
const EnvSchema = z.object({
  // Supabase
  SUPABASE_URL: z.string().url("SUPABASE_URL must be a valid URL"),
  SUPABASE_PUBLISHABLE_KEY: z.string().min(1, "SUPABASE_PUBLISHABLE_KEY is required"),

  // Lovable
  VITE_LOVABLE_API_KEY: z.string().optional(),

  // Mode
  MODE: z.enum(["development", "production"]).optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("production"),
});

type Env = z.infer<typeof EnvSchema>;

let validatedEnv: Env | null = null;

/**
 * Récupère et valide les variables d'environnement
 */
export function getEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  try {
    validatedEnv = EnvSchema.parse(
      typeof window !== "undefined"
        ? // Client-side: only public env vars (VITE_*)
          {
            VITE_LOVABLE_API_KEY: import.meta.env.VITE_LOVABLE_API_KEY,
          }
        : // Server-side: all env vars
          process.env
    );

    return validatedEnv;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missing = error.errors
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      throw new Error(`Invalid environment configuration: ${missing}`);
    }
    throw error;
  }
}

/**
 * Vérifie si nous sommes en production
 */
export function isProduction(): boolean {
  try {
    const env = getEnv();
    return env.NODE_ENV === "production";
  } catch {
    return true; // Par défaut, traiter comme production en cas d'erreur
  }
}

/**
 * Vérifie si nous sommes en développement
 */
export function isDevelopment(): boolean {
  return !isProduction();
}

/**
 * Récupère une variable d'environnement avec un défaut
 */
export function getEnvVar(key: string, defaultValue?: string): string {
  if (typeof window !== "undefined") {
    // Client-side
    const value = (import.meta.env as any)[key];
    return value || defaultValue || "";
  }

  // Server-side
  const value = process.env[key];
  return value || defaultValue || "";
}
