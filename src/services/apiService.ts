/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse } from "axios";

// =========================================
// 🌐 API CONFIGURATION
// =========================================
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8082/inspocrm";
const AUTH_CHANNEL = "inspocrm_auth_channel";

// =========================================
// 🔑 TOKEN KEYS
// =========================================
const TOKEN_KEYS = {
  PLATFORM_TOKEN: "inspocrm_platform_token",
  TENANT_TOKEN: "inspocrm_tenant_token",
  REFRESH_TOKEN: "inspocrm_refresh_token",
  TENANT_ID: "inspocrm_tenant_id",
  TENANT_SCHEMA: "inspocrm_tenant_schema",
  USER_DATA: "inspocrm_user_data",
  TOKEN_EXPIRY: "inspocrm_token_expiry",
};

// =========================================
// 🧩 INTERFACES
// =========================================
export interface ApiResponse<T = any> {
  data?: T;
  message?: string;
  status?: number;
  success?: boolean;
}

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  data?: Record<string, unknown>;
}

export interface HealthComponentDetails {
  database?: string;
  total?: number;
  free?: number;
  threshold?: number;
  version?: string;
}

export interface HealthComponent {
  status: "UP" | "DOWN";
  details?: HealthComponentDetails;
}

export interface HealthCheckResponse {
  status: "UP" | "DOWN";
  components: Record<string, HealthComponent>;
}

// =========================================
// 🔁 TOKEN REFRESH STATE
// =========================================
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (r: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => (error ? reject(error) : resolve(token)));
  failedQueue = [];
};

// =========================================
// ⚙️ INSPOCRM API SERVICE CLASS
// =========================================
class InspoCrmApiService {
  private baseURL: string;
  private broadcastChannel: BroadcastChannel;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.broadcastChannel = new BroadcastChannel(AUTH_CHANNEL);
    this.broadcastChannel.addEventListener("message", this.handleAuthMessage.bind(this));
  }

  // ==========================
  // 🔄 AUTH MANAGEMENT
  // ==========================
  private handleAuthMessage(event: MessageEvent) {
    const { type, data } = event.data;
    if (type === "TOKEN_REFRESH" && data?.tokens) {
      Object.entries(data.tokens).forEach(([key, value]) => {
        if (value) localStorage.setItem(key, value as string);
      });
    } else if (type === "LOGOUT") {
      this.clearAuthData();
      if (typeof window !== "undefined") window.location.href = "/login";
    }
  }

  private getToken() {
    return (
      localStorage.getItem(TOKEN_KEYS.TENANT_TOKEN) ||
      localStorage.getItem(TOKEN_KEYS.PLATFORM_TOKEN)
    );
  }

  private getRefreshToken() {
    return localStorage.getItem(TOKEN_KEYS.REFRESH_TOKEN);
  }

  private getTenantCode() {
    return localStorage.getItem(TOKEN_KEYS.TENANT_ID);
  }

  private isTokenExpired(): boolean {
    const expiry = localStorage.getItem(TOKEN_KEYS.TOKEN_EXPIRY);
    if (!expiry) return true;
    const expTime = parseInt(expiry);
    return Date.now() > expTime - 5 * 60 * 1000;
  }

  clearAuthData() {
    Object.values(TOKEN_KEYS).forEach((key) => localStorage.removeItem(key));
    this.broadcastChannel.postMessage({ type: "LOGOUT" });
  }

  // ==========================
  // 🔁 TOKEN REFRESH
  // ==========================
  async refreshToken(): Promise<string | null> {
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => this.refreshToken());
    }

    isRefreshing = true;

    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) throw new Error("No refresh token");

      const response: AxiosResponse<any> = await axios.post(
        `${this.baseURL}/api/v1/auth/token/refresh`,
        { refreshToken }
      );

      const { accessToken, refreshToken: newRefresh } = response.data || {};
      if (accessToken) {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const expiry = payload.exp * 1000;
        localStorage.setItem(TOKEN_KEYS.TENANT_TOKEN, accessToken);
        localStorage.setItem(TOKEN_KEYS.REFRESH_TOKEN, newRefresh || refreshToken);
        localStorage.setItem(TOKEN_KEYS.TOKEN_EXPIRY, expiry.toString());

        this.broadcastChannel.postMessage({
          type: "TOKEN_REFRESH",
          data: {
            tokens: {
              [TOKEN_KEYS.TENANT_TOKEN]: accessToken,
              [TOKEN_KEYS.REFRESH_TOKEN]: newRefresh || refreshToken,
            },
          },
        });

        processQueue(null, accessToken);
        return accessToken;
      }

      throw new Error("Invalid refresh response");
    } catch (error) {
      processQueue(error, null);
      this.clearAuthData();
      return null;
    } finally {
      isRefreshing = false;
    }
  }

  // ==========================
  // 🌍 REQUEST HANDLER
  // ==========================
  async apiRequest<T = any>(
    endpoint: string,
    options: { method?: string; headers?: Record<string, string>; data?: any; params?: any } = {}
  ): Promise<T> {
    const url = endpoint.startsWith("http") ? endpoint : `${this.baseURL}${endpoint}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const tenant = this.getTenantCode();
    if (tenant) headers["X-Tenant-Code"] = tenant;

    try {
      const response = await axios({
        url,
        method: options.method || "GET",
        headers,
        data: options.data,
        params: options.params,
      });
      return response.data;
    } catch (error: any) {
      if (axios.isAxiosError(error) && error.response) {
        if (
          (error.response.status === 401 || error.response.status === 403) &&
          !url.includes("/auth/token/refresh")
        ) {
          const newToken = await this.refreshToken();
          if (newToken) {
            headers["Authorization"] = `Bearer ${newToken}`;
            const retry = await axios({
              url,
              method: options.method || "GET",
              headers,
              data: options.data,
              params: options.params,
            });
            return retry.data;
          } else {
            this.clearAuthData();
            if (typeof window !== "undefined") window.location.href = "/login";
            throw error;
          }
        }

        throw {
          message:
            error.response.data?.message ||
            `HTTP Error ${error.response.status}`,
          status: error.response.status,
          data: error.response.data,
        };
      }
      throw { message: error.message || "Network Error", status: 0 };
    }
  }

  // ==========================
  // 🧾 SHORTCUT METHODS
  // ==========================
  get<T = any>(endpoint: string, params?: Record<string, any>) {
    return this.apiRequest<T>(endpoint, { method: "GET", params });
  }
  post<T = any>(endpoint: string, data?: any) {
    return this.apiRequest<T>(endpoint, { method: "POST", data });
  }
  put<T = any>(endpoint: string, data?: any) {
    return this.apiRequest<T>(endpoint, { method: "PUT", data });
  }
  patch<T = any>(endpoint: string, data?: any) {
    return this.apiRequest<T>(endpoint, { method: "PATCH", data });
  }
  delete<T = any>(endpoint: string, data?: any) {
    return this.apiRequest<T>(endpoint, { method: "DELETE", data });
  }

  // ==========================
  // 📁 FILE UPLOAD
  // ==========================
  async uploadFile(endpoint: string, file: File, additional?: Record<string, string>) {
    const url = endpoint.startsWith("http") ? endpoint : `${this.baseURL}${endpoint}`;
    const formData = new FormData();
    formData.append("file", file);
    if (additional)
      Object.entries(additional).forEach(([k, v]) => formData.append(k, v));

    const headers: Record<string, string> = {};
    const token = this.getToken();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const tenant = this.getTenantCode();
    if (tenant) headers["X-Tenant-Code"] = tenant;

    const response = await axios.post(url, formData, { headers });
    return response.data;
  }

  // ==========================
  // 💚 HEALTH CHECKS
  // ==========================
  async getSystemHealth(): Promise<HealthCheckResponse> {
    return this.get("/actuator/health");
  }

  async isSystemHealthy(): Promise<boolean> {
    try {
      const health = await this.getSystemHealth();
      return health.status === "UP";
    } catch {
      return false;
    }
  }

  async getDetailedHealth() {
    const health = await this.getSystemHealth();
    return {
      overall: health.status,
      components: Object.entries(health.components).map(([k, v]) => ({
        name: k,
        status: v.status,
        details: v.details,
      })),
    };
  }
}

// =========================================
// 🧱 INSTANCE + INSPOCRM EXPORT STYLE
// =========================================
const api = new InspoCrmApiService(API_BASE_URL);

export const get = api.get.bind(api);
export const post = api.post.bind(api);
export const put = api.put.bind(api);
export const patch = api.patch.bind(api);
export const del = api.delete.bind(api);
export const uploadFile = api.uploadFile.bind(api);
export const healthCheck = {
  getSystemHealth: () => api.getSystemHealth(),
  getDetailedHealth: () => api.getDetailedHealth(),
  isSystemHealthy: () => api.isSystemHealthy(),
};

export default {
  get,
  post,
  put,
  patch,
  delete: del,
  uploadFile,
  healthCheck,
};
