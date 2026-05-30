import type { AuthResponse, User } from "../types";
import client from "./client";

export const authApi = {
  register: (email: string, password: string, name: string) =>
    client.post<{ user: User }>("/auth/register", { email, password, name }),

  login: (email: string, password: string) =>
    client.post<AuthResponse>("/auth/login", { email, password }),

  refresh: (refresh_token: string) =>
    client.post<{ access_token: string }>("/auth/refresh", { refresh_token }),

  logout: (refresh_token: string) =>
    client.post("/auth/logout", { refresh_token }),
};
