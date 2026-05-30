import type { CatapultConfig } from "../types";
import client from "./client";

export const catapultApi = {
  list: () => client.get<{ configs: CatapultConfig[] }>("/catapult-configs"),

  get: (id: number) =>
    client.get<{ config: CatapultConfig }>(`/catapult-configs/${id}`),

  create: (data: Partial<CatapultConfig>) =>
    client.post<{ config: CatapultConfig }>("/catapult-configs", data),

  update: (id: number, data: Partial<CatapultConfig>) =>
    client.put<{ config: CatapultConfig }>(`/catapult-configs/${id}`, data),

  delete: (id: number) => client.delete(`/catapult-configs/${id}`),
};
