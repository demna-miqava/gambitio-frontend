import axios, { isAxiosError, type AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/constants/apiConfig";
import { recordServerDate } from "@/utils/serverClock";

type TokenGetter = () => Promise<string | null>;
let getAuthToken: TokenGetter | null = null;

/** Called by ClerkProviderWithRoutes so API calls can attach the session token. */
export const setAuthTokenGetter = (getter: TokenGetter | null) => {
  getAuthToken = getter;
};

export const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Authenticate with a bearer token rather than cookies, so the API works on
// a different domain than the frontend.
axiosInstance.interceptors.request.use(async (config) => {
  const token = await getAuthToken?.();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Every response's Date header tells how far this device's clock is off
// (see serverClock); errors carry one too
axiosInstance.interceptors.response.use(
  (response) => {
    recordServerDate(response.headers?.date);
    return response;
  },
  (error) => {
    if (isAxiosError(error)) {
      recordServerDate(error.response?.headers?.date);
      // The error carries the request it answers, session token included,
      // and callers log errors whole (console.error(error)): a console
      // screenshot or a pasted log must not hold a working token
      error.config?.headers?.delete("Authorization");
    }
    return Promise.reject(error);
  }
);

export const apiRequest = async <T>(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const response = await axiosInstance.request<T>({ ...config, method, url });
  return response.data;
};
