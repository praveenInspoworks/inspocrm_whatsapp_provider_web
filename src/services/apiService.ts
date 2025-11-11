/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, { AxiosResponse, AxiosError } from "axios";

// API Service for handling HTTP requests
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
}

// Health Check Interfaces
export interface HealthComponentDetails {
  database?: string;
  validationQuery?: string;
  total?: number;
  free?: number;
  threshold?: number;
  path?: string;
  exists?: boolean;
  location?: string;
  version?: string;
  validChains?: any[];
  invalidChains?: any[];
}

export interface HealthComponent {
  status: "UP" | "DOWN";
  details?: HealthComponentDetails;
  components?: {
    [key: string]: HealthComponent;
  };
}

export interface HealthCheckResponse {
  status: "UP" | "DOWN";
  groups: string[];
  components: {
    db: HealthComponent;
    diskSpace: HealthComponent;
    mail: HealthComponent;
    ping: HealthComponent;
    redis: HealthComponent;
    ssl: HealthComponent;
    [key: string]: HealthComponent;
  };
}

// Token refresh state management
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (reason: any) => void;
}> = [];

// Process failed requests queue after token refresh
const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Generic API request function with automatic token refresh
async function apiRequest<T = any>(
  endpoint: string,
  options: {
    method?: string;
    headers?: Record<string, string>;
    data?: any;
    params?: any;
  } = {}
): Promise<T> {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/inspocrm";
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

  // Build headers
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Add auth token if available
  const token =
    localStorage.getItem("tenant_token") ||
    localStorage.getItem("platform_token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Add tenant code if available
  const tenantCode = localStorage.getItem("tenant_id");
  if (tenantCode) {
    headers["X-Tenant-Code"] = tenantCode;
  }

  try {
    const response: AxiosResponse<T> = await axios({
      url,
      method: options.method || "GET",
      headers,
      data: options.data,
      params: options.params,
    });

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      const originalRequest = {
        url,
        method: options.method || "GET",
        headers,
        data: options.data,
        params: options.params,
      };

      // Handle 401 (Unauthorized) and 403 (Forbidden) errors with token refresh
      // 403 can also indicate expired/invalid token in some API designs
      if ((error.response.status === 401 || error.response.status === 403) &&
           !originalRequest.url.includes('/auth/refresh') &&
           !originalRequest.url.includes('/member/auth/token/refresh')) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            // Retry the original request with new token
            return apiRequest<T>(endpoint, options);
          }).catch(err => {
            throw err;
          });
        }

        isRefreshing = true;

        try {
          // Try to refresh the token
          const { authService } = await import('./authService');
          const newToken = await authService.refreshTenantToken();

          if (newToken) {
            // Update the original request headers with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Process queued requests
            processQueue(null, newToken);

            // Retry the original request
            const retryResponse: AxiosResponse<T> = await axios({
              url: originalRequest.url,
              method: originalRequest.method,
              headers: originalRequest.headers,
              data: originalRequest.data,
              params: originalRequest.params,
            });

            return retryResponse.data;
          } else {
            // Token refresh failed, process queue with error
            processQueue(error, null);
            throw error;
          }
        } catch (refreshError:any) {
          // Token refresh failed, process queue with error
          processQueue(error, null);

          // If refresh failed with 403 Forbidden, clear auth and redirect to login
          if (axios.isAxiosError(refreshError) &&
              refreshError.response &&
              refreshError.response.status === 403) {
            console.warn('Token refresh failed with 403 Forbidden - clearing authentication');

            // Clear local storage
            const { authService } = await import('./authService');
            authService.clearAllAuth();

            // Redirect to login without user intervention
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
          } else {
            throw error;
          }
        } finally {
          isRefreshing = false;
        }
      }

      // For non-401 errors or auth endpoints, throw the original error
      throw {
        message:
          error.response.data?.message ||
          `HTTP error! status: ${error.response.status}`,
        status: error.response.status,
        data: error.response.data,
      };
    } else {
      // Network or other errors
      throw {
        message: error.message || "Network error occurred",
        status: 0,
      };
    }
  }
}

// HTTP methods - SINGLE get function with optional params
export const get = async <T = any>(
  endpoint: string, 
  params?: Record<string, any>
): Promise<T> => {
  return apiRequest<T>(endpoint, { 
    method: "GET",
    params: params
  });
};

export const post = async <T = any>(
  endpoint: string,
  data?: any
): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: "POST",
    data: data,
  });
};

export const put = async <T = any>(
  endpoint: string,
  data?: any
): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: "PUT",
    data: data,
  });
};

export const patch = async <T = any>(
  endpoint: string,
  data?: any
): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method: "PATCH",
    data: data,
  });
};

// DELETE method with optional data parameter
export const del = async <T = any>(
  endpoint: string,
  data?: any
): Promise<T> => {
  return apiRequest<T>(endpoint, { 
    method: "DELETE",
    data: data 
  });
};

// Health Check Functions
export const healthCheck = {
  // Get overall system health
  getSystemHealth: async (): Promise<HealthCheckResponse> => {
    return get<HealthCheckResponse>("/actuator/health");
  },

  // Get liveness probe
  getLiveness: async (): Promise<HealthCheckResponse> => {
    return get<HealthCheckResponse>("/actuator/health/liveness");
  },

  // Get readiness probe
  getReadiness: async (): Promise<HealthCheckResponse> => {
    return get<HealthCheckResponse>("/actuator/health/readiness");
  },

  // Check specific component health
  getComponentHealth: async (component: string): Promise<HealthComponent> => {
    const health = await healthCheck.getSystemHealth();
    return health.components[component];
  },

  // Check if system is healthy
  isSystemHealthy: async (): Promise<boolean> => {
    try {
      const health = await healthCheck.getSystemHealth();
      return health.status === "UP";
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  },

  // Get detailed health status with component breakdown
  getDetailedHealth: async (): Promise<{
    overall: "UP" | "DOWN";
    components: Array<{
      name: string;
      status: "UP" | "DOWN";
      details?: HealthComponentDetails;
    }>;
  }> => {
    const health = await healthCheck.getSystemHealth();
    const components = Object.entries(health.components).map(([name, component]) => ({
      name,
      status: component.status,
      details: component.details,
    }));

    return {
      overall: health.status,
      components,
    };
  },
};

// File upload helper with token refresh support
export const uploadFile = async (
  endpoint: string,
  file: File,
  additionalData?: Record<string, string>
): Promise<any> => {
  const baseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8081/inspocrm";
  const url = endpoint.startsWith("http") ? endpoint : `${baseUrl}${endpoint}`;

  const formData = new FormData();
  formData.append("file", file);

  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  // Build headers for axios (don't set Content-Type for FormData - axios will set it automatically with boundary)
  const headers: Record<string, string> = {};

  // Add auth token if available
  const token =
    localStorage.getItem("tenant_token") ||
    localStorage.getItem("platform_token");
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  // Add tenant code if available
  const tenantCode = localStorage.getItem("tenant_id");
  if (tenantCode) {
    headers["X-Tenant-Code"] = tenantCode;
  }

  try {
    const response: AxiosResponse<any> = await axios.post(url, formData, {
      headers,
    });

    return response.data;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      const originalRequest = {
        url,
        method: "POST",
        headers,
        data: formData,
      };

      // Handle 401 (Unauthorized) and 403 (Forbidden) errors with token refresh for file uploads
      // 403 can also indicate expired/invalid token in some API designs
      if ((error.response.status === 401 || error.response.status === 403) &&
           !originalRequest.url.includes('/auth/refresh') &&
           !originalRequest.url.includes('/member/auth/token/refresh')) {
        if (isRefreshing) {
          // If already refreshing, queue this request
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          }).then(() => {
            // Retry the original request with new token
            return uploadFile(endpoint, file, additionalData);
          }).catch(err => {
            throw err;
          });
        }

        isRefreshing = true;

        try {
          // Try to refresh the token
          const { authService } = await import('./authService');
          const newToken = await authService.refreshTenantToken();

          if (newToken) {
            // Update the original request headers with new token
            originalRequest.headers.Authorization = `Bearer ${newToken}`;

            // Process queued requests
            processQueue(null, newToken);

            // Retry the original request
            const retryResponse: AxiosResponse<any> = await axios.post(
              originalRequest.url,
              originalRequest.data,
              { headers: originalRequest.headers }
            );

            return retryResponse.data;
          } else {
            // Token refresh failed, process queue with error
            processQueue(error, null);
            throw error;
          }
        } catch (refreshError) {
          // Token refresh failed, process queue with error
          processQueue(error, null);
          throw error;
        } finally {
          isRefreshing = false;
        }
      }

      // For non-401 errors or auth endpoints, throw the original error
      throw {
        message:
          error.response.data?.message ||
          `HTTP error! status: ${error.response.status}`,
        status: error.response.status,
        data: error.response.data,
      };
    } else {
      // Network or other errors
      throw {
        message: error.message || "Network error occurred",
        status: 0,
      };
    }
  }
};

export default {
  get,
  post,
  put,
  patch,
  delete: del,
  uploadFile,
  healthCheck,
  apiRequest,
};
