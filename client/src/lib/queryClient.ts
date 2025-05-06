import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get the authenticated user from localStorage
  const userStr = localStorage.getItem('user');
  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Add user-id header if user exists
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user && user.id) {
        headers['user-id'] = user.id.toString();
      }
    } catch (error) {
      console.error('Failed to parse user from localStorage', error);
    }
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
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
    // Get the authenticated user from localStorage
    const userStr = localStorage.getItem('user');
    const headers: Record<string, string> = {};
    
    // Add user-id header if user exists
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user && user.id) {
          headers['user-id'] = user.id.toString();
        }
      } catch (error) {
        console.error('Failed to parse user from localStorage', error);
      }
    }

    const res = await fetch(queryKey[0] as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
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
