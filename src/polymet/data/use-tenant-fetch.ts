import { useTenant } from "@/polymet/data/tenant-context";

interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}

export function useTenantFetch() {
  const { tenant } = useTenant();

  const tenantFetch = async (url: string, options: FetchOptions = {}) => {
    const headers = new Headers(options.headers);

    // Add x-tenant-id header
    headers.set("x-tenant-id", tenant.tenantId);

    // Add default Content-Type if not set and body exists
    if (options.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  };

  return { tenantFetch, tenant };
}

// Helper function for common fetch patterns
export function useTenantApi() {
  const { tenantFetch, tenant } = useTenantFetch();

  const get = async <T = any,>(url: string): Promise<T> => {
    const response = await tenantFetch(url);
    if (!response.ok) {
      throw new Error(`GET ${url} failed: ${response.statusText}`);
    }
    return response.json();
  };

  const post = async <T = any,>(url: string, data: any): Promise<T> => {
    const response = await tenantFetch(url, {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`POST ${url} failed: ${response.statusText}`);
    }
    return response.json();
  };

  const put = async <T = any,>(url: string, data: any): Promise<T> => {
    const response = await tenantFetch(url, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`PUT ${url} failed: ${response.statusText}`);
    }
    return response.json();
  };

  const del = async <T = any,>(url: string): Promise<T> => {
    const response = await tenantFetch(url, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(`DELETE ${url} failed: ${response.statusText}`);
    }
    return response.json();
  };

  return { get, post, put, del, tenantFetch, tenant };
}
