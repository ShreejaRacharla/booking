import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("NEXT_PUBLIC_API_BASE_URL is not defined in .env.local");
}

console.log("API Base URL:", API_BASE_URL);

// ============================================
// AXIOS INSTANCE CONFIGURATION
// ============================================

const customAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: true,
});

const SKIP_IDEMPOTENCY_ENDPOINTS = [
  "/login",
  "/register",
  "/refresh",
  "/logout",
];

const generateIdempotencyKey = (): string => {
  return uuidv4();
};

// ============================================
// REQUEST INTERCEPTOR
// ============================================

customAxios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const fullUrl = `${config.baseURL}${config.url}`;
    console.log(`[${config.method?.toUpperCase()}] ${fullUrl}`);

    const isPublicEndpoint = SKIP_IDEMPOTENCY_ENDPOINTS.some((endpoint) =>
      config.url?.includes(endpoint)
    );

    if (!isPublicEndpoint && typeof window !== "undefined") {
      const accessToken = Cookies.get("accessToken");
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
        console.log("Authorization token added");
      } else {
        console.warn("No access token found");
      }
    }

    if (!isPublicEndpoint) {
      const idempotencyKey = generateIdempotencyKey();
      config.headers["Idempotency-Key"] = idempotencyKey;
      console.log(`Idempotency-Key: ${idempotencyKey}`);
    } else {
      console.log("Skipping idempotency for public endpoint");
    }

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// ============================================
// RESPONSE INTERCEPTOR
// ============================================

customAxios.interceptors.response.use(
  (response) => {
    console.log(
      `[${response.status}] ${response.config.method?.toUpperCase()} ${
        response.config.url
      }`
    );
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest: any = error.config;

    const errorDetails = {
      method: error.config?.method?.toUpperCase(),
      url: error.config?.url,
      fullUrl: error.config
        ? `${error.config.baseURL}${error.config.url}`
        : "unknown",
      status: error.response?.status,
      statusText: error.response?.statusText,
      message: error.message,
      code: error.code,
      data: error.response?.data,
    };

    console.error("API Error:", errorDetails);

    if (error.code === "ERR_NETWORK" || error.message === "Network Error") {
      console.error(`NETWORK ERROR`);
    }

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      typeof window !== "undefined"
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = Cookies.get("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        console.log("🔄 Attempting to refresh access token...");

        const response = await axios.post(`${API_BASE_URL}/refresh`, {
          refreshToken,
        });

        const newAccessToken = response.data.accessToken;

        Cookies.set("accessToken", newAccessToken, {
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          expires: 7,
        });

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        const newIdempotencyKey = generateIdempotencyKey();
        originalRequest.headers["Idempotency-Key"] = newIdempotencyKey;
        console.log(`🔑 New Idempotency-Key for retry: ${newIdempotencyKey}`);

        console.log("✅ Token refreshed successfully, retrying request...");

        return customAxios(originalRequest);
      } catch (refreshError: any) {
        console.error("❌ Token refresh failed:", refreshError.message);

        console.log("🔒 Clearing auth data and redirecting to login...");

        ["accessToken", "refreshToken", "sessionId", "user"].forEach((name) => {
          Cookies.remove(name, { path: "/" });
          Cookies.remove(name);
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });

        if (window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      console.error("🚫 Access Forbidden - You don't have permission");
    }

    if (error.response?.status === 404) {
      console.error("🔍 Resource Not Found");
    }

    if (error.response?.status === 500) {
      console.error("💥 Internal Server Error");
    }

    return Promise.reject(error);
  }
);

export default customAxios;