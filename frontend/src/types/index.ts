export interface User {
  id: number;
  email: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
}

export interface AircraftConfig {
  id: number;
  user_id: number;
  name: string;
  wing_type: string;
  tail_type: string;
  config_data: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface CatapultConfig {
  id: number;
  user_id: number;
  name: string;
  config_data: CatapultConfigData;
  created_at: string;
  updated_at: string;
}

export interface CatapultConfigData {
  // Common
  cyl_d: number; // inner diameter of the cylinder, mm
  cyl_len: number; // cylinder length, mm
  piston_mass_g: number; // mass of the piston + rod, g
  cart_mass_g: number; // mass of the cart, g
  friction: number; // coefficient of friction (0.02-0.05)

  // Pneumatics
  rec_vol: number; // receiver volume, l
  max_pressure: number; // maximum pressure of the receiver, bar
  temperature: number; // temperature of the air, °C
}

export interface ApiError {
  error: string;
}
