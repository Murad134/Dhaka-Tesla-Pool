const API_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch(path, options = {}) {
  if (!API_URL) throw new Error("NEXT_PUBLIC_API_URL is not configured");
  const token = typeof window !== "undefined" ? localStorage.getItem("tesla_token") : null;
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, { ...options, headers, cache: "no-store" });
  const text = await response.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = { error: text || "Unexpected response" }; }
  if (!response.ok) {
    throw new ApiError(
      data?.error || `Request failed (${response.status})`,
      response.status,
      data?.details
    );
  }
  return data;
}

export function moneyPoysha(value) {
  return `৳${(Number(value || 0) / 100).toFixed(2)}`;
}
