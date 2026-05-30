import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { configsApi } from "../../api/configs";
import type { AircraftConfig } from "../../types";
import type { AircraftInputs } from "../../utils/calculator";

interface BungeeInputs {
  // Rubber
  rubber_type: "latex_tube" | "latex_flat" | "bungee_cord";
  outer_d: number; // outer diameter or width, mm
  inner_d: number; // inner diameter (for tube), mm
  nat_length: number; // natural length, m
  stretch_ratio: number; // stretching ratio (2.5-4x)
  num_strands: number; // number of strands in parallel

  // Aircraft
  aircraft_mass_g: number;

  // Conditions
  angle_deg: number; // angle of the bungee to the horizontal, °
  wind_ms: number; // headwind, m/s
  v_stall: number; // stall speed, m/s
}

interface BungeeResults {
  // Geometry
  cross_section_mm2: number; // cross-sectional area of the rubber, mm²
  rubber_volume_cm3: number; // volume of the rubber, cm³
  rubber_mass_g: number; // mass of the rubber, g
  stretched_length: number; // stretched length, m
  pullback_m: number; // pullback distance from the hook, m

  // Energetics
  G_modulus: number; // shear module , MPa
  k_stiffness: number; // stiffness, N/m
  F_max_N: number; // maximum tension force, N
  F_max_kg: number; // maximum tension force, kg
  E_stored: number; // stored energy, J
  E_useful: number; // useful energy (with efficiency), J

  // Speed
  V_launch_ms: number; // launch speed, m/s
  V_launch_kmh: number;
  V_need_ms: number; // required speed
  V_margin_ms: number; // margin to required speed
  launch_ok: boolean;
}

const RUBBER_TYPES = {
  latex_tube: {
    label: "Латексна трубка",
    density: 1050, // kg/m³
    G: 0.4, // MPa, shear modulus
    eta: 0.85, // efficiency
    default_outer: 20,
    default_inner: 10,
  },
  latex_flat: {
    label: "Плоска латексна стрічка",
    density: 1050,
    G: 0.35,
    eta: 0.82,
    default_outer: 50, // width
    default_inner: 0, // thickness instead of inner diameter
  },
  bungee_cord: {
    label: "Бунджі-корд (амортизатор)",
    density: 900,
    G: 0.25,
    eta: 0.78,
    default_outer: 10,
    default_inner: 0,
  },
};

function calculateBungee(inp: BungeeInputs): BungeeResults {
  const type = RUBBER_TYPES[inp.rubber_type];
  const λ = inp.stretch_ratio;

  // Cross-sectional area
  let cross_mm2: number;
  if (inp.rubber_type === "latex_tube") {
    cross_mm2 = (Math.PI / 4) * (inp.outer_d ** 2 - inp.inner_d ** 2);
  } else {
    cross_mm2 = inp.outer_d * (inp.inner_d || 5); // width × thickness
  }
  cross_mm2 = Math.max(cross_mm2, 1);

  const cross_m2 = cross_mm2 / 1e6;
  const volume_m3 = cross_m2 * inp.nat_length * inp.num_strands;
  const volume_cm3 = volume_m3 * 1e6;
  const rubber_mass_g = volume_m3 * type.density * 1000;

  // Stretched length and pullback distance
  const stretched_length = inp.nat_length * λ;
  const pullback_m = stretched_length - inp.nat_length;

  // Stiffness through shear modulus (non-linear rubber → linear approximation)
  // k = G × A × n / L₀
  const G_Pa = type.G * 1e6;
  const k = (G_Pa * cross_m2 * inp.num_strands) / inp.nat_length;

  // Maximum force at full extension
  const F_max_N = k * pullback_m * (λ - 1); // non-linear correction
  const F_max_kg = F_max_N / 9.81;

  // Stored energy (non-linear Munro-Rivlin model simplified)
  // E = η × G × V × (λ² + 2/λ - 3)
  const E_stored = G_Pa * volume_m3 * (λ ** 2 + 2 / λ - 3);
  const E_useful = E_stored * type.eta;

  // Energy losses due to gravity (angle)
  const mass_kg = inp.aircraft_mass_g / 1000;
  const sin_a = Math.sin((inp.angle_deg * Math.PI) / 180);
  const E_grav = mass_kg * 9.81 * sin_a * pulled_m(inp);
  const E_kinetic = Math.max(0, E_useful - E_grav);

  // Launch speed
  const V_launch_ms = E_kinetic > 0 ? Math.sqrt((2 * E_kinetic) / mass_kg) : 0;
  const V_launch_kmh = V_launch_ms * 3.6;

  // Comparison with required speed
  const V_takeoff = inp.v_stall * 1.2;
  const V_need_ms = Math.max(0, V_takeoff - inp.wind_ms);
  const V_margin_ms = V_launch_ms - V_need_ms;

  return {
    cross_section_mm2: cross_mm2,
    rubber_volume_cm3: volume_cm3,
    rubber_mass_g,
    stretched_length,
    pullback_m,
    G_modulus: type.G,
    k_stiffness: k,
    F_max_N,
    F_max_kg,
    E_stored,
    E_useful,
    V_launch_ms,
    V_launch_kmh,
    V_need_ms,
    V_margin_ms,
    launch_ok: V_margin_ms >= 0,
  };
}

function pulled_m(inp: BungeeInputs): number {
  return inp.nat_length * (inp.stretch_ratio - 1);
}

const defaultInputs: BungeeInputs = {
  rubber_type: "latex_tube",
  outer_d: 20,
  inner_d: 10,
  nat_length: 30,
  stretch_ratio: 3,
  num_strands: 2,
  aircraft_mass_g: 18000,
  angle_deg: 10,
  wind_ms: 0,
  v_stall: 14,
};

function Field({
  label,
  unit,
  value,
  onChange,
  step = 1,
  min = 0,
}: {
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-xs text-slate-500 flex-1">
        {label}
        {unit && <span className="italic text-slate-400 ml-1">{unit}</span>}
      </label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-24 text-right px-2 py-1 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-400"
      />
    </div>
  );
}

function ResultRow({
  label,
  value,
  unit,
  status,
  sub,
}: {
  label: string;
  value: string;
  unit?: string;
  status?: "ok" | "warn" | "bad" | "info";
  sub?: string;
}) {
  const color =
    status === "ok"
      ? "text-emerald-600"
      : status === "warn"
        ? "text-amber-600"
        : status === "bad"
          ? "text-red-600"
          : "text-blue-600";
  return (
    <div className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
      <div>
        <div className="text-sm text-slate-600">{label}</div>
        {sub && <div className="text-xs text-slate-400 italic">{sub}</div>}
      </div>
      <span className={`text-sm font-medium ${color}`}>
        {value}
        {unit && <span className="text-xs text-slate-400 ml-1">{unit}</span>}
      </span>
    </div>
  );
}

export default function CatapultBungeeTab() {
  const [inputs, setInputs] = useState<BungeeInputs>(defaultInputs);
  const [aircraftConfigs, setAircraftConfigs] = useState<AircraftConfig[]>([]);
  const { t } = useTranslation();

  const set = <K extends keyof BungeeInputs>(key: K, value: BungeeInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    configsApi.list().then((r) => setAircraftConfigs(r.data.configs || []));
  }, []);

  const loadAircraft = (id: string) => {
    if (!id) return;
    const cfg = aircraftConfigs.find((c) => c.id === parseInt(id));
    if (!cfg) return;
    const data = cfg.config_data as unknown as AircraftInputs;
    setInputs((prev) => ({ ...prev, aircraft_mass_g: data.mass_g }));
  };

  const handleTypeChange = (type: BungeeInputs["rubber_type"]) => {
    const t = RUBBER_TYPES[type];
    setInputs((prev) => ({
      ...prev,
      rubber_type: type,
      outer_d: t.default_outer,
      inner_d: t.default_inner,
    }));
  };

  const results = calculateBungee(inputs);
  const f = (n: number, d = 1) =>
    isNaN(n) || !isFinite(n) ? "—" : n.toFixed(d);
  const spd = (ms: number) => `${f(ms, 2)} м/с  (${f(ms * 3.6, 1)} км/год)`;

  const isLatexTube = inputs.rubber_type === "latex_tube";

  return (
    <div className="grid grid-cols-[38%_1fr] gap-0 bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Left panel */}
      <div className="border-r border-slate-100 bg-slate-50">
        <div className="px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h2 className="text-sm font-medium text-slate-700">
            {t("catapult.bungee.title")}
          </h2>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {/* Aircraft selection */}
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              {t("catapult.bungee.aircraft")}
            </label>
            <select
              onChange={(e) => loadAircraft(e.target.value)}
              className="w-full text-sm px-2 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-400"
            >
              <option value="">{t("catapult.bungee.selectSaved")}</option>
              {aircraftConfigs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Rubber type */}
          <div className="border-t border-slate-100 pt-3">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
              {t("catapult.bungee.rubberType")}
            </div>
            <div className="flex flex-col gap-1">
              {(
                Object.entries(RUBBER_TYPES) as [
                  BungeeInputs["rubber_type"],
                  (typeof RUBBER_TYPES)[keyof typeof RUBBER_TYPES],
                ][]
              ).map(([key, val]) => (
                <label
                  key={key}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="radio"
                    name="rubber_type"
                    checked={inputs.rubber_type === key}
                    onChange={() => handleTypeChange(key)}
                    className="text-blue-600"
                  />
                  <span className="text-sm text-slate-600">{val.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Rubber dimensions */}
          <div className="border-t border-slate-100 pt-3">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              {t("catapult.bungee.rubberDimensions")}
            </div>
            <div className="flex flex-col gap-2">
              <Field
                label={
                  isLatexTube
                    ? "Зовнішній діаметр"
                    : inputs.rubber_type === "latex_flat"
                      ? "Ширина стрічки"
                      : "Діаметр корду"
                }
                unit={t("common.units.mm")}
                value={inputs.outer_d}
                onChange={(v) => set("outer_d", v)}
              />
              {isLatexTube && (
                <Field
                  label={t("catapult.bungee.fields.innerDiameter")}
                  unit={t("common.units.mm")}
                  value={inputs.inner_d}
                  onChange={(v) => set("inner_d", v)}
                />
              )}
              {inputs.rubber_type === "latex_flat" && (
                <Field
                  label={t("catapult.bungee.fields.bandThickness")}
                  unit={t("common.units.mm")}
                  value={inputs.inner_d || 5}
                  onChange={(v) => set("inner_d", v)}
                />
              )}
              <Field
                label={t("catapult.bungee.fields.naturalLength")}
                unit={t("common.units.m")}
                value={inputs.nat_length}
                step={0.5}
                onChange={(v) => set("nat_length", v)}
              />
              <Field
                label={t("catapult.bungee.fields.stretchRatio")}
                value={inputs.stretch_ratio}
                step={0.5}
                min={1.5}
                onChange={(v) => set("stretch_ratio", v)}
              />
              <Field
                label={t("catapult.bungee.fields.numStrands")}
                value={inputs.num_strands}
                step={1}
                min={1}
                onChange={(v) => set("num_strands", Math.round(v))}
              />

              {/* Hints */}
              <div className="text-xs text-slate-400 bg-slate-100 px-2 py-1.5 rounded-md">
                Розтягнута довжина: {f(results.stretched_length, 1)} м ·
                Відтягування: {f(results.pullback_m, 1)} м
              </div>
            </div>
          </div>

          {/* Conditions */}
          <div className="border-t border-slate-100 pt-3">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              {t("catapult.bungee.launchParams")}
            </div>
            <div className="flex flex-col gap-2">
              <Field
                label={t("catapult.bungee.fields.aircraftMass")}
                unit={t("common.units.g")}
                value={inputs.aircraft_mass_g}
                onChange={(v) => set("aircraft_mass_g", v)}
              />
              <Field
                label={t("catapult.bungee.fields.stallSpeed")}
                unit={t("common.units.ms")}
                value={inputs.v_stall}
                step={0.5}
                onChange={(v) => set("v_stall", v)}
              />
              <Field
                label={t("catapult.bungee.fields.bungeeAngle")}
                unit={t("common.units.deg")}
                value={inputs.angle_deg}
                step={1}
                onChange={(v) => set("angle_deg", v)}
              />
              <Field
                label={t("catapult.bungee.fields.headwind")}
                unit={t("common.units.ms")}
                value={inputs.wind_ms}
                step={0.5}
                onChange={(v) => set("wind_ms", v)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div>
        <div className="px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h2 className="text-sm font-medium text-slate-700">
            {t("catapult.bungee.results")}
          </h2>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {/* Main status */}
          <div
            className={`rounded-xl p-4 border ${
              results.launch_ok
                ? "bg-emerald-50 border-emerald-200"
                : "bg-red-50 border-red-200"
            }`}
          >
            <div
              className={`text-lg font-medium ${
                results.launch_ok ? "text-emerald-700" : "text-red-700"
              }`}
            >
              {results.launch_ok
                ? t("catapult.bungee.status.adequate")
                : t("catapult.bungee.status.inadequate")}
            </div>
            <div
              className={`text-sm mt-1 ${
                results.launch_ok ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {results.launch_ok
                ? `Запас: +${f(results.V_margin_ms, 2)} м/с над потрібними ${f(results.V_need_ms, 2)} м/с`
                : `Не вистачає ${f(Math.abs(results.V_margin_ms), 2)} м/с. Збільшіть довжину або к-сть джгутів.`}
            </div>
          </div>

          {/* Geometry */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider border-b bg-blue-50 text-blue-700 border-blue-100">
              {t("catapult.bungee.sections.geometryAndMass")}
            </div>
            <div className="p-4">
              <ResultRow
                label={t("catapult.bungee.results.crossSection")}
                value={f(results.cross_section_mm2, 1)}
                unit="мм²"
                status="info"
              />
              <ResultRow
                label={t("catapult.bungee.results.rubberVolume")}
                value={f(results.rubber_volume_cm3, 1)}
                unit={t("common.units.cm3")}
                status="info"
              />
              <ResultRow
                label={t("catapult.bungee.results.rubberMass")}
                value={f(results.rubber_mass_g, 0)}
                unit={t("common.units.g")}
                status="info"
              />
              <ResultRow
                label={t("catapult.bungee.results.stretchedLength")}
                value={f(results.stretched_length, 2)}
                unit={t("common.units.m")}
                status="info"
              />
              <ResultRow
                label={t("catapult.bungee.results.pullbackDistance")}
                value={f(results.pullback_m, 2)}
                unit={t("common.units.m")}
                status="info"
              />
            </div>
          </div>

          {/* Energetics */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider border-b bg-purple-50 text-purple-700 border-purple-100">
              {t("catapult.bungee.sections.energetics")}
            </div>
            <div className="p-4">
              <ResultRow
                label={t("catapult.bungee.results.shearModulus")}
                value={f(results.G_modulus, 2)}
                unit={t("common.units.MPa")}
                status="info"
              />
              <ResultRow
                label={t("catapult.bungee.results.stiffness")}
                value={f(results.k_stiffness, 0)}
                unit={t("common.units.Nm")}
                status="info"
              />
              <ResultRow
                label={t("catapult.bungee.results.maxTension")}
                value={`${f(results.F_max_N, 0)} Н  (${f(results.F_max_kg, 1)} кг)`}
                status="info"
              />
              <ResultRow
                label={t("catapult.bungee.results.storedEnergy")}
                value={f(results.E_stored, 1)}
                unit={t("common.units.J")}
                status="info"
              />
              <ResultRow
                label={t("catapult.bungee.results.usefulEnergy")}
                value={f(results.E_useful, 1)}
                unit={t("common.units.J")}
                status="info"
              />
            </div>
          </div>

          {/* Speed Analysis */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider border-b bg-amber-50 text-amber-700 border-amber-100">
              {t("catapult.bungee.sections.speedAnalysis")}
            </div>
            <div className="p-4">
              <ResultRow
                label={t("catapult.bungee.results.launchSpeed")}
                value={spd(results.V_launch_ms)}
                status={results.launch_ok ? "ok" : "bad"}
              />
              <ResultRow
                label={t("catapult.bungee.results.requieredSpeed")}
                sub="V_stall × 1.2 − вітер"
                value={spd(results.V_need_ms)}
                status="info"
              />
              <ResultRow
                label={t("catapult.bungee.results.speedMargin")}
                value={`${f(results.V_margin_ms, 2)} {t("common.units.m/s")}`}
                status={results.V_margin_ms >= 0 ? "ok" : "bad"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
