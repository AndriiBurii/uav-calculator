export interface AircraftInputs {
  wingType: "with_center" | "without_center" | "flying_wing";
  tailType: "h_tail" | "classic" | "v_tail" | "t_tail";

  // Centerplane
  b_cp: number; // centerline chord, mm
  s_cp: number; // span of centerplane, mm

  // Consoles
  b_wing: number; // wing chord, mm
  s_wing: number; // wing span (one side), mm
  wing_offset: number; // wing offset from the nose, mm

  // Stabilizer
  b_stab: number; // stabilizer chord, mm
  s_stab: number; // stabilizer span, mm
  tail_dist: number; // distance from trailing edge of centerplane to leading edge of stabilizer, mm
  elev_pct: number; // elevator percentage of stabilizer chord

  // Fins
  fin_h: number; // height of fin, mm
  fin_c: number; // chord of fin, mm
  v_tail_angle: number; // angle of V-tail, degrees (usually 100-120°, i.e., 40-50° from horizontal)

  // Ailerons
  ail_len: number; // length of aileron, mm
  ail_chord: number; // chord of aileron, mm

  // Mass
  mass_g: number; // takeoff mass, g
  cl_max: number; // maximum Cl

  // Propulsion
  num_motors: number; // number of motors
  thrust_g: number; // thrust of one motor, g
  power_w: number; // power of one motor, W
  prop_d: number; // diameter of propeller, inches
  prop_p: number; // pitch of propeller, inches
  motor_name?: string; // name of motor (for saving in configuration)
  prop_name?: string; // name of propeller (for saving in configuration)
}

export interface AircraftResults {
  // Areas (mm²)
  S_cp: number;
  S_wing: number;
  S_total: number;
  S_stab: number;
  S_fin: number;

  // Geometry
  span: number; // total span, mm
  MAC: number; // mean aerodynamic chord, mm

  // Aerodynamic centers
  ac_cp: number;
  ac_wing: number;
  ac_main: number; // weighted AC of the wing
  ac_stab: number; // AC of the stabilizer from the nose
  Lt: number; // stabilizer arm, mm
  NP: number; // neutral point from the nose, mm

  // Center of gravity
  CG_front: number;
  CG_opt: number;
  CG_rear: number;

  // Coefficients
  VH: number;
  VV: number;
  AR: number;
  LD_max: number;
  V_cruise_ms: number;

  // Load
  WL: number;
  wl_norm: { min: number; max: number; label: string };

  // Thrust
  thrust_total: number;
  power_total: number;
  TW: number; // thrust/weight
  PW: number; // power/weight (W/kg)

  // Speeds
  V_stall: number; // m/s
  V_stall_kmh: number;

  // Statuses
  status: {
    VH: "ok" | "warn" | "bad";
    VV: "ok" | "warn" | "bad";
    WL: "ok" | "warn" | "bad";
    TW: "ok" | "warn" | "bad";
    AR: "ok" | "warn" | "bad";
  };

  notes: Note[];
  control: {
    b_elev: number;
    elev_start_up: number;
    elev_start_dn: number;
    elev_fly_up: number;
    elev_fly_dn: number;
    ail_start_up: number;
    ail_start_dn: number;
    ail_fly_up: number;
    ail_fly_dn: number;
  };
  k_ind: number;
  V_zero_ms: number;
  V_takeoff_ms: number;
  T_at_takeoff: number;
  A_disk: number;
  tail_type_label: string;
}

export interface Note {
  type: "ok" | "warn" | "bad";
  text: string;
}

const RHO = 1.225;

function wlNorm(kg: number) {
  if (kg < 1.0) return { min: 15, max: 40, label: "мала модель (до 1 кг)" };
  if (kg < 3.0) return { min: 30, max: 65, label: "легкий БЛА (1–3 кг)" };
  if (kg < 8.0) return { min: 50, max: 100, label: "середній БЛА (3–8 кг)" };
  if (kg < 20.0) return { min: 80, max: 170, label: "важкий БЛА (8–20 кг)" };
  return { min: 120, max: 230, label: "великий БЛА (>20 кг)" };
}

export function calculate(inp: AircraftInputs): AircraftResults {
  const num_motors = Math.max(1, inp.num_motors || 1);
  const thrust_total = inp.thrust_g * num_motors;
  const power_total = inp.power_w * num_motors;

  // Areas (mm²)
  const S_cp = inp.wingType === "without_center" ? 0 : inp.b_cp * inp.s_cp;
  const S_wing =
    inp.wingType === "flying_wing"
      ? inp.b_cp * inp.s_cp
      : inp.b_wing * inp.s_wing * 2;
  const S_total = inp.wingType === "flying_wing" ? S_wing : S_cp + S_wing;

  const S_stab = inp.wingType === "flying_wing" ? 0 : inp.b_stab * inp.s_stab;

  // Span (mm) — for VV used as in the original
  const span =
    inp.wingType === "flying_wing"
      ? inp.s_cp
      : inp.wingType === "without_center"
        ? inp.s_wing * 2
        : inp.s_cp + inp.s_wing * 2;

  // MAC — weighted average chord
  const MAC =
    inp.wingType === "flying_wing"
      ? inp.b_cp
      : inp.wingType === "without_center"
        ? inp.b_wing
        : S_total > 0
          ? (inp.b_cp * S_cp + inp.b_wing * S_wing) / S_total
          : inp.b_cp;

  // Aerodynamic centers from the nose
  const ac_cp = inp.b_cp * 0.25;
  const ac_wing = inp.wing_offset + inp.b_wing * 0.25;
  const ac_main =
    S_total > 0 ? (ac_cp * S_cp + ac_wing * S_wing) / S_total : ac_cp;

  // AC of stabilizer
  const ac_stab = inp.b_cp + inp.tail_dist + inp.b_stab * 0.25;
  const Lt = ac_stab - ac_main;

  // Neutral Point (NP)
  const a_ratio = 0.7;
  const NP = ac_main + (S_total > 0 ? (S_stab / S_total) * Lt * a_ratio : 0);

  // CG from the neutral point
  const CG_front = NP - 0.15 * MAC;
  const CG_opt = NP - 0.1 * MAC;
  const CG_rear = NP - 0.05 * MAC;

  // S_fin with consideration of tail type
  const fin_count = inp.tailType === "h_tail" ? 2 : 1;
  const S_fin_raw =
    inp.wingType === "flying_wing" ? 0 : inp.fin_h * inp.fin_c * fin_count;

  // VH, VV with consideration of tail type
  let VH = 0;
  let VV = 0;
  let S_fin = S_fin_raw;

  if (inp.tailType === "v_tail" && inp.wingType !== "flying_wing") {
    // V-tail: two fins at an angle to each other
    const half_angle_deg = (180 - inp.v_tail_angle) / 2;
    const half_angle_rad = (half_angle_deg * Math.PI) / 180;
    const S_each = inp.fin_h * inp.fin_c;
    const S_v_total = S_each * 2;

    // Effective areas projected onto horizontal and vertical planes
    const S_eff_H = S_v_total * Math.cos(half_angle_rad);
    const S_eff_V = S_v_total * Math.sin(half_angle_rad);
    S_fin = S_v_total;

    VH = S_total > 0 && MAC > 0 ? (S_eff_H * Lt) / (S_total * MAC) : 0;
    VV = S_total > 0 && span > 0 ? (S_eff_V * Lt) / (S_total * span) : 0;
  } else if (inp.tailType === "t_tail" && inp.wingType !== "flying_wing") {
    // T-tail: stabilizer at the top of the fuselage
    const t_tail_efficiency = 1.1;
    VH =
      S_total > 0 && MAC > 0
        ? (S_stab * Lt * t_tail_efficiency) / (S_total * MAC)
        : 0;
    VV = S_total > 0 && span > 0 ? (S_fin_raw * Lt) / (S_total * span) : 0;
  } else {
    // H-tail or conventional — standard calculation
    VH = S_total > 0 && MAC > 0 ? (S_stab * Lt) / (S_total * MAC) : 0;
    VV = S_total > 0 && span > 0 ? (S_fin_raw * Lt) / (S_total * span) : 0;
  }
  // Wing load
  const S_dm2 = S_total / 10000;
  const WL = S_dm2 > 0 ? inp.mass_g / S_dm2 : 0;
  const mass_kg = inp.mass_g / 1000;
  const norm = wlNorm(mass_kg);

  // Span
  const span_m = span / 1000;
  const S_m2 = S_total / 1e6;
  const AR = S_m2 > 0 ? (span_m * span_m) / S_m2 : 0;

  // Speeds
  const V_stall =
    S_m2 > 0 && inp.cl_max > 0
      ? Math.sqrt((2 * mass_kg * 9.81) / (RHO * S_m2 * inp.cl_max))
      : 0;
  const V_stall_kmh = V_stall * 3.6;

  // Aerodynamic quality
  const e = 0.85;
  const CD0 = 0.025;
  const LD_max = AR > 0 ? 0.5 * Math.sqrt((Math.PI * AR * e) / CD0) : 0;
  const V_cruise_ms =
    S_m2 > 0
      ? Math.sqrt(
          (2 * mass_kg * 9.81) /
            (RHO * S_m2 * Math.sqrt(Math.PI * AR * e * CD0)),
        )
      : 0;

  // Thrust-to-weight and power-to-weight ratios
  const TW = inp.mass_g > 0 ? thrust_total / inp.mass_g : 0;
  const PW = mass_kg > 0 ? power_total / mass_kg : 0;

  // Status
  const status: AircraftResults["status"] = {
    VH: VH >= 0.3 && VH <= 0.5 ? "ok" : VH >= 0.22 ? "warn" : "bad",
    VV: VV >= 0.02 && VV <= 0.05 ? "ok" : VV >= 0.015 ? "warn" : "bad",
    WL: WL >= norm.min && WL <= norm.max ? "ok" : "warn",
    TW: TW >= 0.5 ? "ok" : TW >= 0.3 ? "warn" : "bad",
    AR: AR >= 5 && AR <= 10 ? "ok" : "warn",
  };

  // Areas in dm² for display
  const S_cp_dm2 = S_cp / 10000;
  const S_wing_dm2 = S_wing / 10000;
  const S_total_dm2 = S_total / 10000;
  const S_stab_dm2 = S_stab / 10000;
  const S_fin_dm2 = S_fin / 10000;

  // Recommendations based on statuses
  const notes: Note[] = [];

  if (status.VH === "ok")
    notes.push({
      type: "ok",
      text: `VH = ${VH.toFixed(3)} — в нормі (0.30–0.50). Поздовжня стійкість забезпечена.`,
    });
  else if (VH < 0.3)
    notes.push({
      type: "warn",
      text: `VH = ${VH.toFixed(3)} — нижче норми (0.30–0.50). Збільшіть площу або плече стабілізатора.`,
    });
  else
    notes.push({
      type: "warn",
      text: `VH = ${VH.toFixed(3)} — вище норми. Стабілізатор занадто великий.`,
    });

  if (status.VV === "ok")
    notes.push({
      type: "ok",
      text: `VV = ${VV.toFixed(3)} — в нормі (0.020–0.050). Бокова стійкість забезпечена.`,
    });
  else if (VV < 0.02)
    notes.push({
      type: "warn",
      text: `VV = ${VV.toFixed(3)} — нижче норми. Збільшіть площу або плече кілів.`,
    });
  else
    notes.push({
      type: "warn",
      text: `VV = ${VV.toFixed(3)} — вище норми. Надмірна бокова стійкість.`,
    });

  if (status.WL === "ok")
    notes.push({
      type: "ok",
      text: `WL = ${WL.toFixed(1)} г/дм² — в нормі для класу «${norm.label}» (${norm.min}–${norm.max} г/дм²).`,
    });
  else if (WL < norm.min)
    notes.push({
      type: "warn",
      text: `WL = ${WL.toFixed(1)} г/дм² — нижче норми для «${norm.label}». Мала злітна швидкість, чутливість до вітру.`,
    });
  else
    notes.push({
      type: "warn",
      text: `WL = ${WL.toFixed(1)} г/дм² — вище норми для «${norm.label}». Швидкість зриву ${V_stall.toFixed(1)} м/с.`,
    });

  if (TW >= 1.0)
    notes.push({
      type: "ok",
      text: `T/W = ${TW.toFixed(2)} — відмінна тяга. Здатен до вертикального набору висоти.`,
    });
  else if (TW >= 0.5)
    notes.push({
      type: "ok",
      text: `T/W = ${TW.toFixed(2)} — достатня тяга. Впевнений зліт з розбігу або катапульти.`,
    });
  else if (TW >= 0.3)
    notes.push({
      type: "warn",
      text: `T/W = ${TW.toFixed(2)} — мінімальна тяга для літака. Зліт тільки з катапульти, набір висоти повільний.`,
    });
  else
    notes.push({
      type: "bad",
      text: `T/W = ${TW.toFixed(2)} — тяга критично мала. Літак не зможе набрати висоту. Мінімум для літака: 0.3.`,
    });

  if (status.AR === "ok")
    notes.push({
      type: "ok",
      text: `AR = ${AR.toFixed(2)} — оптимальне подовження. L/D max ≈ ${LD_max.toFixed(1)}.`,
    });
  else if (AR < 5)
    notes.push({
      type: "warn",
      text: `AR = ${AR.toFixed(2)} — мале подовження. Великий індуктивний опір.`,
    });
  else
    notes.push({
      type: "warn",
      text: `AR = ${AR.toFixed(2)} — велике подовження. Крило чутливе до навантажень на згин.`,
    });

  // Control surface deflections
  const sinDeg = (a: number) => Math.sin((a * Math.PI) / 180);
  const b_elev = (inp.b_stab * inp.elev_pct) / 100;

  const control = {
    b_elev,
    elev_start_up: b_elev * sinDeg(15),
    elev_start_dn: b_elev * sinDeg(10),
    elev_fly_up: b_elev * sinDeg(20),
    elev_fly_dn: b_elev * sinDeg(15),
    ail_start_up: inp.ail_chord * sinDeg(18),
    ail_start_dn: inp.ail_chord * sinDeg(12),
    ail_fly_up: inp.ail_chord * sinDeg(20),
    ail_fly_dn: inp.ail_chord * sinDeg(15),
  };

  // Additional parameters for takeoff performance and induced drag estimation
  const k_ind = AR > 0 ? 1 / (Math.PI * AR * 0.85) : 0;

  const prop_d_m = inp.prop_d * 0.0254;
  const A_disk = Math.PI * (prop_d_m / 2) ** 2;
  const v_ind0 =
    A_disk > 0
      ? Math.sqrt(((thrust_total / 1000) * 9.81) / (2 * RHO * A_disk))
      : 0;
  const V_zero_ms = 2.5 * v_ind0;
  const V_takeoff_ms = V_stall * 1.2;
  const T_at_takeoff =
    V_zero_ms > 0
      ? Math.max(
          0,
          (thrust_total / 1000) * 9.81 * (1 - V_takeoff_ms / V_zero_ms),
        ) / 9.81
      : 0;

  return {
    S_cp: S_cp_dm2,
    S_wing: S_wing_dm2,
    S_total: S_total_dm2,
    S_stab: S_stab_dm2,
    S_fin: S_fin_dm2,
    span,
    MAC,
    ac_cp,
    ac_wing,
    ac_main,
    ac_stab,
    Lt,
    NP,
    CG_front,
    CG_opt,
    CG_rear,
    VH,
    VV,
    AR,
    LD_max,
    V_cruise_ms,
    WL,
    wl_norm: norm,
    thrust_total,
    power_total,
    TW,
    PW,
    V_stall,
    V_stall_kmh,
    status,
    notes,
    control,
    k_ind,
    V_zero_ms,
    V_takeoff_ms,
    T_at_takeoff,
    A_disk,
    tail_type_label:
      inp.tailType === "h_tail"
        ? "H-хвіст: (S_ст × Lt) / (S × MAC)"
        : inp.tailType === "v_tail"
          ? `V-хвіст: ефективна горизонтальна проекція, кут ${((180 - inp.v_tail_angle) / 2).toFixed(0)}°`
          : inp.tailType === "t_tail"
            ? "T-хвіст: ефективність +10% (ефект кінцевої пластини)"
            : "Класичний: (S_ст × Lt) / (S × MAC)",
  };
}

export const defaultInputs: AircraftInputs = {
  wingType: "with_center",
  tailType: "h_tail",

  b_cp: 550,
  s_cp: 450,
  b_wing: 360,
  s_wing: 1000,
  wing_offset: 250,

  b_stab: 280,
  s_stab: 420,
  tail_dist: 490,
  elev_pct: 33,

  fin_h: 350,
  fin_c: 140,
  v_tail_angle: 110,

  ail_len: 440,
  ail_chord: 62,

  mass_g: 18000,
  cl_max: 1.45,

  num_motors: 2,
  thrust_g: 900,
  power_w: 120,
  prop_d: 10,
  prop_p: 4.5,
  motor_name: "",
  prop_name: "",
};
