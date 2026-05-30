import type { AircraftConfig } from "../types";
import client from "./client";

export const configsApi = {
  list: () => client.get<{ configs: AircraftConfig[] }>("/configs"),

  get: (id: number) => client.get<{ config: AircraftConfig }>(`/configs/${id}`),

  create: (data: Partial<AircraftConfig>) =>
    client.post<{ config: AircraftConfig }>("/configs", data),

  update: (id: number, data: Partial<AircraftConfig>) =>
    client.put<{ config: AircraftConfig }>(`/configs/${id}`, data),

  delete: (id: number) => client.delete(`/configs/${id}`),
};
