/**
 * Extracts a human-readable error message from varied API / Axios / use-hook-api error payloads.
 */
export function extractErrorMessage(errorData: any, fallback = "An unexpected error occurred."): string {
  if (!errorData) return fallback;

  // 1. Check detail field (common in FastAPI / Pydantic)
  const detail =
    errorData?.fullRes?.detail ??
    errorData?.response?.data?.detail ??
    errorData?.detail ??
    errorData?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail.trim();
  }
  if (detail && typeof detail === "object" && typeof detail.message === "string") {
    return detail.message.trim();
  }
  if (Array.isArray(detail) && detail.length > 0) {
    const first = detail[0];
    const msg = first?.msg || first?.message;
    if (typeof msg === "string" && msg.trim()) {
      return msg.trim();
    }
  }

  // 2. Check message field
  const message =
    errorData?.fullRes?.message ??
    errorData?.response?.data?.message ??
    errorData?.data?.message ??
    errorData?.message;

  if (typeof message === "string" && message.trim()) {
    return message.trim();
  }
  if (Array.isArray(message) && message.length > 0) {
    const combined = message.filter(Boolean).join(", ");
    if (combined) return combined;
  }

  // 3. Status-based fallbacks
  const status = errorData?.status || errorData?.response?.status || errorData?.statusCode;
  if (status === 404) return "Requested resource not found (404).";
  if (status === 409) return "Conflict: Resource already exists.";
  if (status === 401) return "Authentication required. Please log in again.";
  if (status === 403) return "You do not have permission to perform this action.";

  return fallback;
}
