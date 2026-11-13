import axios, { type AxiosRequestConfig } from "axios";
import { API_BASE_URL } from "@/constants/apiConfig";

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

export const apiRequest = async <T>(
  method: "get" | "post" | "put" | "patch" | "delete",
  url: string,
  config: AxiosRequestConfig = {}
): Promise<T> => {
  const response = await axiosInstance.request<T>({ ...config, method, url });
  return response.data;
};
