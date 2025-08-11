import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Configure API base URL - defaults to relative URLs for same-origin deployment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

function getApiUrl(path: string): string {
  // If path already starts with http, use as-is (absolute URL)
  if (path.startsWith('http')) return path;
  
  // If API_BASE_URL is set, prepend it (for external API)
  if (API_BASE_URL) {
    return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  }
  
  // Default: relative URL (same-origin)
  return path;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Handle 401 errors by clearing invalid tokens
    if (res.status === 401) {
      localStorage.removeItem('supabase_token');
      // Don't throw immediately, let the component handle it
    }
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const token = localStorage.getItem('supabase_token');
  const headers: HeadersInit = data ? { "Content-Type": "application/json" } : {};
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const fullUrl = getApiUrl(url);
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: API_BASE_URL ? "omit" : "include", // Use omit for external APIs
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const token = localStorage.getItem('supabase_token');
    const headers: HeadersInit = {};
    
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const url = getApiUrl(queryKey.join("/") as string);
    const res = await fetch(url, {
      headers,
      credentials: API_BASE_URL ? "omit" : "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      // Clear invalid token
      localStorage.removeItem('supabase_token');
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
