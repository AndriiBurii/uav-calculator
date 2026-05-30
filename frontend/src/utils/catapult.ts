const RHO = 1.225;

export interface CatapultDesignInputs {
  // Structure
  cyl_d: number; // inner diameter of cylinder, mm
  cyl_len: number; // cylinder length, mm
  piston_mass_g: number; // mass of piston + rod, g
  cart_mass_g: number; // mass of cart, g
  friction: number; // coefficient of friction

  // Pneumatics
  rec_vol: number; // receiver volume, L
  max_pressure: number; // maximum pressure, bar
  temperature: number; // temperature, °C

  // Aircraft
  aircraft_mass_g: number;
  cat_angle: number; // launch angle, °
}

export interface CatapultDesignResults {
  // Geometry
  A_piston_cm2: number; // piston area, cm²
  V_cyl_L: number; // cylinder volume, L

  // Forces at maximum pressure
  F_piston_0_kg: number; // initial force on piston, kg
  P_fin_bar: number; // final pressure after firing, bar
  P_drop_pct: number; // pressure drop, %

  // Energetics
  W_gas: number; // work done by gas, J
  W_grav: number; // work against gravity, J
  W_friction: number; // work lost to friction, J
  W_total: number; // useful work, J

  // Speed and Acceleration
  V_cat_ms: number; // cart speed without aircraft, m/s
  accel_0_g: number; // initial acceleration, g
  accel_avg_g: number; // average acceleration, g
  t_launch_ms: number; // launch time, ms

  // Table of variants
  table: CatapultTableRow[];

  // Status
  pressure_ok: boolean; // whether the maximum pressure is not exceeded
}

export interface CatapultTableRow {
  mass_kg: number;
  P_min_bar: number; // minimum pressure for this mass
  V_cat_ms: number; // speed at maximum pressure
  ok: boolean; // whether the maximum pressure is sufficient
}

export interface CatapultLaunchInputs {
  // Launch parameters
  cyl_d: number;
  cyl_len: number;
  piston_mass_g: number;
  cart_mass_g: number;
  friction: number;
  rec_vol: number;
  max_pressure: number;
  work_pressure: number; // working pressure for this launch, bar

  // Aircraft parameters
  aircraft_mass_g: number;
  V_stall: number; // m/s
  thrust_total_g: number;
  prop_d: number; // inches
  num_motors: number;

  // Launch conditions
  cat_angle: number; // °
  wind_ms: number; // m/s
  throttle_pct: number; // throttle setting, %
}

export interface CatapultLaunchResults {
  // Required speed
  V_takeoff_ms: number; // V_stall × 1.2
  V_need_ms: number; // with wind correction
  V_cat_ms: number; // speed achieved by catapult
  V_margin_ms: number; // margin between achieved speed and required speed

  // Pressure
  P_work_bar: number; // working pressure
  P_min_bar: number; // minimum required
  pressure_ok: boolean; // whether the pressure is sufficient

  // Dynamics
  accel_0_g: number;
  accel_avg_g: number;
  t_launch_ms: number;
  P_fin_bar: number; // pressure after firing

  // Thrust
  T_at_takeoff_kg: number;

  // Status
  launch_ok: boolean;
}

// Additional utility functions

function tempCorrection(temp_c: number): number {
  // Temperature correction (isothermal at 20°C = base)
  return (273.15 + temp_c) / (273.15 + 20);
}

function calcPropZeroThrustSpeed(
  thrust_total_g: number,
  prop_d_inch: number,
  num_motors: number,
): number {
  const prop_d_m = prop_d_inch * 0.0254;
  const A_disk = Math.PI * (prop_d_m / 2) ** 2;
  if (A_disk <= 0) return 30;
  const v_ind0 = Math.sqrt(
    ((thrust_total_g / 1000) * 9.81) / (2 * RHO * A_disk),
  );
  return 2.5 * v_ind0 * num_motors;
}

function thrustAtV(
  V_ms: number,
  thrust_total_g: number,
  V_zero: number,
): number {
  return Math.max(
    0,
    (thrust_total_g / 1000) * 9.81 * (1 - Math.max(0, V_ms) / V_zero),
  );
}

// Main calculations

export function calculateDesign(
  inp: CatapultDesignInputs,
): CatapultDesignResults {
  const temp_k = tempCorrection(inp.temperature);
  const P0_Pa = inp.max_pressure * 1e5 * temp_k;
  const cyl_d_m = inp.cyl_d / 1000;
  const cyl_len_m = inp.cyl_len / 1000;
  const rec_vol_m3 = inp.rec_vol / 1000;

  const A_piston = Math.PI * (cyl_d_m / 2) ** 2;
  const A_piston_cm2 = A_piston * 10000;
  const V_cyl_m3 = A_piston * cyl_len_m;
  const V_cyl_L = V_cyl_m3 * 1000;

  const m_cart = (inp.cart_mass_g + inp.piston_mass_g) / 1000;
  const m_aircraft = inp.aircraft_mass_g / 1000;
  const m_total = m_cart + m_aircraft;

  const sin_a = Math.sin((inp.cat_angle * Math.PI) / 180);
  const F_grav = m_total * 9.81 * sin_a;
  const F_friction =
    inp.friction * m_total * 9.81 * Math.cos((inp.cat_angle * Math.PI) / 180);

  const P_fin_Pa = (P0_Pa * rec_vol_m3) / (rec_vol_m3 + V_cyl_m3);
  const P_fin_bar = P_fin_Pa / 1e5;
  const P_drop_pct = (1 - P_fin_Pa / P0_Pa) * 100;

  const F_piston_0 = P0_Pa * A_piston;
  const F_piston_0_kg = F_piston_0 / 9.81;

  const W_gas =
    P0_Pa * rec_vol_m3 * Math.log((rec_vol_m3 + V_cyl_m3) / rec_vol_m3);
  const W_grav = F_grav * cyl_len_m;
  const W_friction = F_friction * cyl_len_m;
  const W_total = Math.max(0, W_gas - W_grav - W_friction);

  const V_cat_ms = W_total > 0 ? Math.sqrt((2 * W_total) / m_total) : 0;

  const accel_0 = (F_piston_0 - F_grav - F_friction) / m_total;
  const accel_0_g = accel_0 / 9.81;
  const F_avg = W_total / cyl_len_m;
  const accel_avg = F_avg / m_total;
  const accel_avg_g = accel_avg / 9.81;
  const t_launch_ms = accel_avg > 0 ? (V_cat_ms / accel_avg) * 1000 : 0;

  // Table for different masses
  const masses = [5, 10, 15, 18, 20, 25, 30];
  const table: CatapultTableRow[] = masses.map((mass_kg) => {
    const m_tot = m_cart + mass_kg;
    const V_stall_est = 10; // rough estimate for the table
    const V_need = V_stall_est * 1.2;
    const sin_a_t = Math.sin((inp.cat_angle * Math.PI) / 180);
    const W_grav_t = m_tot * 9.81 * sin_a_t * cyl_len_m;
    const W_fric_t =
      inp.friction *
      m_tot *
      9.81 *
      Math.cos((inp.cat_angle * Math.PI) / 180) *
      cyl_len_m;
    const W_need_t = 0.5 * m_tot * V_need ** 2 + W_grav_t + W_fric_t;
    const ln_ratio = Math.log((rec_vol_m3 + V_cyl_m3) / rec_vol_m3);
    const P_min_Pa = ln_ratio > 0 ? W_need_t / (rec_vol_m3 * ln_ratio) : 0;
    const P_min_bar = P_min_Pa / 1e5 / temp_k;

    const P_work_Pa = inp.max_pressure * 1e5 * temp_k;
    const W_gas_t = P_work_Pa * rec_vol_m3 * ln_ratio;
    const W_total_t = Math.max(0, W_gas_t - W_grav_t - W_fric_t);
    const V_cat_t = W_total_t > 0 ? Math.sqrt((2 * W_total_t) / m_tot) : 0;

    return {
      mass_kg,
      P_min_bar: Math.max(0, P_min_bar),
      V_cat_ms: V_cat_t,
      ok: P_min_bar <= inp.max_pressure,
    };
  });

  return {
    A_piston_cm2,
    V_cyl_L,
    F_piston_0_kg,
    P_fin_bar,
    P_drop_pct,
    W_gas,
    W_grav,
    W_friction,
    W_total,
    V_cat_ms,
    accel_0_g,
    accel_avg_g,
    t_launch_ms,
    table,
    pressure_ok: inp.max_pressure <= inp.max_pressure,
  };
}

// Main launch calculations

export function calculateLaunch(
  inp: CatapultLaunchInputs,
): CatapultLaunchResults {
  const P0_Pa = inp.work_pressure * 1e5;
  const cyl_d_m = inp.cyl_d / 1000;
  const cyl_len_m = inp.cyl_len / 1000;
  const rec_vol_m3 = inp.rec_vol / 1000;

  const A_piston = Math.PI * (cyl_d_m / 2) ** 2;
  const V_cyl_m3 = A_piston * cyl_len_m;

  const m_cart = (inp.cart_mass_g + inp.piston_mass_g) / 1000;
  const m_aircraft = inp.aircraft_mass_g / 1000;
  const m_total = m_cart + m_aircraft;

  const sin_a = Math.sin((inp.cat_angle * Math.PI) / 180);
  const cos_a = Math.cos((inp.cat_angle * Math.PI) / 180);
  const F_grav = m_total * 9.81 * sin_a;
  const F_friction = inp.friction * m_total * 9.81 * cos_a;

  const P_fin_Pa = (P0_Pa * rec_vol_m3) / (rec_vol_m3 + V_cyl_m3);
  const P_fin_bar = P_fin_Pa / 1e5;
  const F_piston_0 = P0_Pa * A_piston;

  const W_gas =
    P0_Pa * rec_vol_m3 * Math.log((rec_vol_m3 + V_cyl_m3) / rec_vol_m3);
  const W_grav = F_grav * cyl_len_m;
  const W_friction = F_friction * cyl_len_m;

  // Iterative calculation of thrust
  const V_zero = calcPropZeroThrustSpeed(
    inp.thrust_total_g,
    inp.prop_d,
    inp.num_motors,
  );
  let W_thrust =
    (inp.thrust_total_g / 1000) * 9.81 * (inp.throttle_pct / 100) * cyl_len_m;

  for (let i = 0; i < 3; i++) {
    const V_est = Math.sqrt(
      Math.max(0, (2 * (W_gas + W_thrust - W_grav - W_friction)) / m_total),
    );
    const T_avg =
      thrustAtV(V_est / 2, inp.thrust_total_g, V_zero) *
      (inp.throttle_pct / 100);
    W_thrust = T_avg * cyl_len_m;
  }

  const W_total = Math.max(0, W_gas + W_thrust - W_grav - W_friction);
  const V_cat_ms = W_total > 0 ? Math.sqrt((2 * W_total) / m_total) : 0;

  const F_thrust_launch =
    (inp.thrust_total_g / 1000) * 9.81 * (inp.throttle_pct / 100);
  const accel_0 =
    (F_piston_0 + F_thrust_launch - F_grav - F_friction) / m_total;
  const accel_0_g = accel_0 / 9.81;
  const F_avg = W_total / cyl_len_m;
  const accel_avg = F_avg / m_total;
  const accel_avg_g = accel_avg / 9.81;
  const t_launch_ms = accel_avg > 0 ? (V_cat_ms / accel_avg) * 1000 : 0;

  const V_takeoff_ms = inp.V_stall * 1.2;
  const V_need_ms = Math.max(0, V_takeoff_ms - inp.wind_ms);
  const V_margin_ms = V_cat_ms - V_need_ms;
  const launch_ok = V_cat_ms >= V_need_ms;

  // Minimum pressure
  const ln_ratio = Math.log((rec_vol_m3 + V_cyl_m3) / rec_vol_m3);
  const W_need_gas = 0.5 * m_total * V_need_ms ** 2 + W_grav + W_friction;
  const P_min_Pa =
    ln_ratio > 0 ? Math.max(0, W_need_gas / (rec_vol_m3 * ln_ratio)) : 0;
  const P_min_bar = P_min_Pa / 1e5;

  // Thrust at takeoff speed
  const T_at_takeoff_kg =
    thrustAtV(V_takeoff_ms, inp.thrust_total_g, V_zero) / 9.81;

  return {
    V_takeoff_ms,
    V_need_ms,
    V_cat_ms,
    V_margin_ms,
    P_work_bar: inp.work_pressure,
    P_min_bar,
    pressure_ok:
      inp.work_pressure >= P_min_bar && P_min_bar <= inp.max_pressure,
    accel_0_g,
    accel_avg_g,
    t_launch_ms,
    P_fin_bar,
    T_at_takeoff_kg,
    launch_ok,
  };
}

export const defaultDesignInputs: CatapultDesignInputs = {
  cyl_d: 54,
  cyl_len: 1500,
  piston_mass_g: 500,
  cart_mass_g: 1800,
  friction: 0.03,
  rec_vol: 20,
  max_pressure: 6,
  temperature: 20,
  aircraft_mass_g: 18000,
  cat_angle: 15,
};
