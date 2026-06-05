/**
 * Gestion centralisée des erreurs API
 */

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: Record<string, any>) {
    super("VALIDATION_ERROR", 400, message, details);
    this.name = "ValidationError";
  }
}

export class AuthError extends ApiError {
  constructor(message: string) {
    super("AUTH_ERROR", 401, message);
    this.name = "AuthError";
  }
}

export class NotFoundError extends ApiError {
  constructor(resource: string) {
    super("NOT_FOUND", 404, `${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class PermissionError extends ApiError {
  constructor(message: string = "You do not have permission to perform this action") {
    super("PERMISSION_DENIED", 403, message);
    this.name = "PermissionError";
  }
}

export function handleSupabaseError(error: any): never {
  console.error("[Supabase Error]", error);

  if (error?.status === 401 || error?.code === "PGRST301") {
    throw new AuthError("Authentication required or invalid");
  }

  if (error?.status === 403 || error?.code === "PGRST103") {
    throw new PermissionError();
  }

  if (error?.status === 404) {
    throw new NotFoundError("Resource");
  }

  if (error?.message?.includes("constraint")) {
    throw new ValidationError("Data validation failed", { original: error.message });
  }

  throw new ApiError(
    error?.code || "UNKNOWN_ERROR",
    error?.status || 500,
    error?.message || "An unknown error occurred"
  );
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Une erreur s'est produite";
}
