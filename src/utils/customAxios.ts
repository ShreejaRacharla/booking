import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import Cookies from "js-cookie";
import { v4 as uuidv4 } from "uuid";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

if (!API_BASE_URL) {
  console.error("NEXT_PUBLIC_API_BASE_URL is not defined in .env.local");
}

const customAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: true,
});

const generateIdempotencyKey = (): string => {
  return uuidv4();
};

customAxios.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const fullUrl = `${config.baseURL}${config.url}`;

    if (typeof window !== "undefined") {
      const accessToken = Cookies.get("accessToken");
      if (accessToken) {
        config.headers.Authorization = `Bearer ${accessToken}`;
      }
    }

    const idempotencyKey = generateIdempotencyKey();
    config.headers["Idempotency-Key"] = idempotencyKey;

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

customAxios.interceptors.response.use(
  (response) => {
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
      console.error("NETWORK ERROR - Check your connection");
      return Promise.reject(error);
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

        const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });

        const newAccessToken = response.data.accessToken;

        Cookies.set("accessToken", newAccessToken, {
          path: "/",
          secure: process.env.NODE_ENV === "production",
          sameSite: "strict",
          expires: 7,
        });

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        const newIdempotencyKey = generateIdempotencyKey();
        originalRequest.headers["Idempotency-Key"] = newIdempotencyKey;
        return customAxios(originalRequest);
      } catch (refreshError: any) {
        console.error("Token refresh failed:", refreshError.message);

        const authCookies = [
          "accessToken",
          "refreshToken",
          "sessionId",
          "user",
          "auth",
          "token",
          "jwt",
        ];

        authCookies.forEach((name) => {
          Cookies.remove(name, { path: "/" });
          Cookies.remove(name);
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        });

        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
      console.error("Access Forbidden - You don't have permission");
    }

    if (error.response?.status === 404) {
      console.error("Resource Not Found");
    }

    if (error.response?.status === 500) {
      console.error("Internal Server Error");
    }

    if (error.response?.status === 428) {
      console.error("Precondition Required - Idempotency-Key is required");
    }

    return Promise.reject(error);
  }
);

export default customAxios;