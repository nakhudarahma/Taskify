
const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api/v1";

type RequestMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function fetchWithAuth(endpoint: string, method: RequestMethod = "GET", body?: any) {
    // const { data: { session } } = await supabase.auth.getSession();
    // const token = session?.access_token;
    const rawToken = localStorage.getItem('token');
    // Trim any hidden whitespace (common from mobile clipboard managers)
    const token = rawToken ? rawToken.trim() : null;

    console.log(`[API] Request to ${endpoint} | Token exists: ${!!token} | Token: ${token ? token.substring(0, 10) + '...' : 'None'}`);

    const headers: HeadersInit = {
        "Content-Type": "application/json",
    };

    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
        console.log(`[API] Attaching Authorization header: Bearer ${token.substring(0, 10)}...`);
    } else {
        console.warn(`[API] No token found for request to ${endpoint}`);
    }

    const config: RequestInit = {
        method,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    // Ensure proper URL construction handling slashes
    const baseUrl = API_URL.endsWith('/') ? API_URL.slice(0, -1) : API_URL;
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const response = await fetch(`${baseUrl}${path}`, config);

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `API request failed: ${response.statusText}`);
    }

    return response.json();
}

export const api = {
    get: (endpoint: string) => fetchWithAuth(endpoint, "GET"),
    post: (endpoint: string, body: any) => fetchWithAuth(endpoint, "POST", body),
    put: (endpoint: string, body: any) => fetchWithAuth(endpoint, "PUT", body),
    patch: (endpoint: string, body: any) => fetchWithAuth(endpoint, "PATCH", body),
    delete: (endpoint: string) => fetchWithAuth(endpoint, "DELETE"),
};
