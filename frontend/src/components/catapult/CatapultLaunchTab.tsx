import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { catapultApi } from "../../api/catapult";
import { configsApi } from "../../api/configs";
import type {
  AircraftConfig,
  CatapultConfig,
  CatapultConfigData,
} from "../../types";
import type { AircraftInputs } from "../../utils/calculator";
import {
  calculateLaunch,
  type CatapultLaunchInputs,
} from "../../utils/catapult";

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
  sub?: string;
  status?: "ok" | "warn" | "bad" | "info";
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

const defaultInputs: CatapultLaunchInputs = {
  cyl_d: 54,
  cyl_len: 1500,
  piston_mass_g: 500,
  cart_mass_g: 1800,
  friction: 0.03,
  rec_vol: 20,
  max_pressure: 6,
  work_pressure: 5,
  aircraft_mass_g: 18000,
  V_stall: 14,
  thrust_total_g: 1800,
  prop_d: 10,
  num_motors: 2,
  cat_angle: 15,
  wind_ms: 0,
  throttle_pct: 100,
};

export default function CatapultLaunchTab() {
  const [inputs, setInputs] = useState<CatapultLaunchInputs>(defaultInputs);
  const [catapultConfigs, setCatapultConfigs] = useState<CatapultConfig[]>([]);
  const [aircraftConfigs, setAircraftConfigs] = useState<AircraftConfig[]>([]);
  const { t } = useTranslation();

  const set = <K extends keyof CatapultLaunchInputs>(
    key: K,
    value: CatapultLaunchInputs[K],
  ) => setInputs((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    catapultApi.list().then((r) => setCatapultConfigs(r.data.configs || []));
    configsApi.list().then((r) => setAircraftConfigs(r.data.configs || []));
  }, []);

  const loadCatapult = (id: string) => {
    if (!id) return;
    const cfg = catapultConfigs.find((c) => c.id === parseInt(id));
    if (!cfg) return;
    const data = cfg.config_data as unknown as CatapultConfigData;
    setInputs((prev) => ({
      ...prev,
      cyl_d: data.cyl_d,
      cyl_len: data.cyl_len,
      piston_mass_g: data.piston_mass_g,
      cart_mass_g: data.cart_mass_g,
      friction: data.friction,
      rec_vol: data.rec_vol,
      max_pressure: data.max_pressure,
      work_pressure: Math.min(prev.work_pressure, data.max_pressure),
    }));
  };

  const loadAircraft = (id: string) => {
    if (!id) return;
    const cfg = aircraftConfigs.find((c) => c.id === parseInt(id));
    if (!cfg) return;
    const data = cfg.config_data as unknown as AircraftInputs;
    setInputs((prev) => ({
      ...prev,
      aircraft_mass_g: data.mass_g,
      thrust_total_g: data.thrust_g * (data.num_motors || 1),
      prop_d: data.prop_d,
      num_motors: data.num_motors || 1,
    }));
  };

  const results = calculateLaunch(inputs);
  const f = (n: number, d = 1) => (isNaN(n) ? "—" : n.toFixed(d));
  const spd = (ms: number) =>
    `${f(ms, 2)} ${t("common.units.ms")}  (${f(ms * 3.6, 1)} ${t("common.units.kmh")})`;

  return (
    <div className="grid grid-cols-[38%_1fr] gap-0 bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Left panel */}
      <div className="border-r border-slate-100 bg-slate-50">
        <div className="px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h2 className="text-sm font-medium text-slate-700">
            {t("catapult.launch.title")}
          </h2>
        </div>
        <div className="p-4 flex flex-col gap-3">
          {/* Load Configurations */}
          <div className="flex flex-col gap-2">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {t("catapult.launch.loadConfig")}
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                {t("catapult.launch.catapult")}
              </label>
              <select
                onChange={(e) => loadCatapult(e.target.value)}
                className="w-full text-sm px-2 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-400"
              >
                <option value="">— {t("catapult.launch.selectSaved")} —</option>
                {catapultConfigs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 block mb-1">
                {t("catapult.launch.aircraft")}
              </label>
              <select
                onChange={(e) => loadAircraft(e.target.value)}
                className="w-full text-sm px-2 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-400"
              >
                <option value="">— {t("catapult.launch.selectSaved")} —</option>
                {aircraftConfigs.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Aircraft Parameters */}
          <div className="border-t border-slate-100 pt-3">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              {t("catapult.launch.aircraftParams")}
            </div>
            <div className="flex flex-col gap-2">
              <Field
                label={t("catapult.launch.fields.aircraftMass")}
                unit={t("common.units.g")}
                value={inputs.aircraft_mass_g}
                onChange={(v) => set("aircraft_mass_g", v)}
              />
              <Field
                label={t("catapult.launch.fields.stallSpeed")}
                unit={t("common.units.ms")}
                value={inputs.V_stall}
                step={0.1}
                onChange={(v) => set("V_stall", v)}
              />
              <Field
                label={t("catapult.launch.fields.totalThrust")}
                unit={t("common.units.g")}
                value={inputs.thrust_total_g}
                onChange={(v) => set("thrust_total_g", v)}
              />
              <Field
                label={t("catapult.launch.fields.propDiam")}
                unit={t("common.units.inch")}
                value={inputs.prop_d}
                step={0.5}
                onChange={(v) => set("prop_d", v)}
              />
              <Field
                label={t("catapult.launch.fields.numMotors")}
                value={inputs.num_motors}
                step={1}
                min={1}
                onChange={(v) => set("num_motors", Math.round(v))}
              />
            </div>
          </div>

          {/* Launch Conditions */}
          <div className="border-t border-slate-100 pt-3">
            <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
              {t("catapult.launch.launchConditions")}
            </div>
            <div className="flex flex-col gap-2">
              <Field
                label={t("catapult.launch.fields.workPressure")}
                unit={t("common.units.bar")}
                value={inputs.work_pressure}
                step={0.5}
                onChange={(v) =>
                  set("work_pressure", Math.min(v, inputs.max_pressure))
                }
              />
              {inputs.work_pressure > inputs.max_pressure && (
                <div className="text-xs text-red-500 bg-red-50 px-2 py-1.5 rounded-md">
                  ⚠️ Перевищує максимальний тиск {inputs.max_pressure} бар!
                </div>
              )}
              <Field
                label={t("catapult.launch.fields.angle")}
                unit="°"
                value={inputs.cat_angle}
                step={1}
                onChange={(v) => set("cat_angle", v)}
              />
              <Field
                label={t("catapult.launch.fields.headwind")}
                unit={t("common.units.ms")}
                value={inputs.wind_ms}
                step={0.5}
                onChange={(v) => set("wind_ms", v)}
              />
              <Field
                label={t("catapult.launch.fields.throttle")}
                unit="%"
                value={inputs.throttle_pct}
                step={5}
                min={0}
                onChange={(v) => set("throttle_pct", Math.min(100, v))}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Right panel — results */}
      <div>
        <div className="px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h2 className="text-sm font-medium text-slate-700">
            {t("catapult.launch.results")}
          </h2>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {/* Main Status */}
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
                ? "✓ Запуск можливий"
                : "✗ Швидкості не вистачає"}
            </div>
            <div
              className={`text-sm mt-1 ${
                results.launch_ok ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {results.launch_ok
                ? `Запас швидкості: +${f(results.V_margin_ms, 2)} ${t("common.units.ms")} (+${f(results.V_margin_ms * 3.6, 1)} ${t("common.units.kmh")})`
                : `Не вистачає: ${f(Math.abs(results.V_margin_ms), 2)} ${t("common.units.ms")}. Збільшіть тиск або зменшіть кут.`}
            </div>
          </div>

          {/* Pressure warning */}
          {results.P_min_bar > inputs.max_pressure && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="text-sm font-medium text-red-700">
                ⚠️ Потрібний тиск {f(results.P_min_bar, 2)}{" "}
                {t("common.units.bar")} перевищує максимальний{" "}
                {inputs.max_pressure} {t("common.units.bar")}!
              </div>
              <div className="text-xs text-red-600 mt-1">
                Небезпечно! Збільшіть довжину рейки або діаметр циліндра.
              </div>
            </div>
          )}

          {/* Speed Analysis */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider border-b bg-blue-50 text-blue-700 border-blue-100">
              Аналіз швидкостей
            </div>
            <div className="p-4">
              <ResultRow
                label="Швидкість зриву"
                sub="V_stall"
                value={spd(inputs.V_stall)}
                status="info"
              />
              <ResultRow
                label="Мінімальна злітна"
                sub="V_stall × 1.2"
                value={spd(results.V_takeoff_ms)}
                status="info"
              />
              <ResultRow
                label="Потрібна відносно землі"
                sub="з урахуванням вітру"
                value={spd(results.V_need_ms)}
                status="info"
              />
              <ResultRow
                label="Швидкість катапульти"
                sub="на виході з рейки"
                value={spd(results.V_cat_ms)}
                status={results.launch_ok ? "ok" : "bad"}
              />
              <ResultRow
                label="Запас швидкості"
                value={`${f(results.V_margin_ms, 2)} ${t("common.units.ms")}  (${f(results.V_margin_ms * 3.6, 1)} ${t("common.units.kmh")})`}
                status={results.V_margin_ms >= 0 ? "ok" : "bad"}
              />
            </div>
          </div>

          {/* Pressure */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider border-b bg-purple-50 text-purple-700 border-purple-100">
              Тиск
            </div>
            <div className="p-4">
              <ResultRow
                label="Робочий тиск"
                value={f(inputs.work_pressure, 1)}
                unit={t("common.units.bar")}
                status="info"
              />
              <ResultRow
                label="Мінімальний потрібний тиск"
                value={f(results.P_min_bar, 2)}
                unit={t("common.units.bar")}
                status={results.pressure_ok ? "ok" : "bad"}
              />
              <ResultRow
                label="Максимальний тиск ресівера"
                value={f(inputs.max_pressure, 1)}
                unit={t("common.units.bar")}
                status="info"
              />
              <ResultRow
                label="Тиск після пострілу"
                value={f(results.P_fin_bar, 2)}
                unit={t("common.units.bar")}
                status="info"
              />
            </div>
          </div>

          {/* Dynamics */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider border-b bg-amber-50 text-amber-700 border-amber-100">
              Динаміка розгону
            </div>
            <div className="p-4">
              <ResultRow
                label="Початкове прискорення"
                value={f(results.accel_0_g, 2)}
                unit="g"
                status="info"
              />
              <ResultRow
                label="Середнє прискорення"
                value={f(results.accel_avg_g, 2)}
                unit="g"
                status="info"
              />
              <ResultRow
                label="Час розгону"
                value={f(results.t_launch_ms, 0)}
                unit="мс"
                status="info"
              />
              <ResultRow
                label="Тяга на злітній швидкості"
                value={`${f(results.T_at_takeoff_kg, 1)} ${t("common.units.kg")}`}
                status={results.T_at_takeoff_kg > 0 ? "ok" : "warn"}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
