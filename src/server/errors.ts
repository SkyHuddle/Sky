/**
 * Errors with a stable machine-readable code, mapped to HTTP status by the API layer and to
 * inline messages by the client. Messages are written for users, not developers.
 */
export type AppErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION"
  | "LOCKED"
  | "NO_OPEN_WINDOW"
  | "ROSTER_INVALID"
  | "TRANSFER_LIMIT"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INVITE_EXPIRED"
  | "DEMO_DISABLED";

const STATUS: Record<AppErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION: 400,
  LOCKED: 409,
  NO_OPEN_WINDOW: 409,
  ROSTER_INVALID: 422,
  TRANSFER_LIMIT: 422,
  CONFLICT: 409,
  RATE_LIMITED: 429,
  INVITE_EXPIRED: 410,
  DEMO_DISABLED: 403,
};

export class AppError extends Error {
  readonly status: number;

  constructor(
    readonly code: AppErrorCode,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.status = STATUS[code];
  }
}

export const isAppError = (e: unknown): e is AppError => e instanceof AppError;
