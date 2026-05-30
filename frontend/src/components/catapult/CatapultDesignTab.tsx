import { useState } from "react";
import { useTranslation } from "react-i18next";
import { catapultApi } from "../../api/catapult";
import type { CatapultDesignInputs } from "../../utils/catapult";
import { calculateDesign, defaultDesignInputs } from "../../utils/catapult";
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

function Section({
  title,
  color = "blue",
  children,
}: {
  title: string;
  color?: string;
  children: React.ReactNode;
}) {
  const colors: Record<string, string> = {
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    purple: "bg-purple-50 text-purple-700 border-purple-100",
  };
  return (
    <div className="border-t border-slate-100 pt-3">
      <div
        className={`text-xs font-medium px-2 py-1 rounded-md inline-block mb-3 ${colors[color]}`}
      >
        {title}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  unit,
  status,
}: {
  label: string;
  value: string;
  unit?: string;
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
      <span className="text-sm text-slate-600">{label}</span>
      <span className={`text-sm font-medium ${color}`}>
        {value}
        {unit && <span className="text-xs text-slate-400 ml-1">{unit}</span>}
      </span>
    </div>
  );
}

export default function CatapultDesignTab() {
  const [inputs, setInputs] =
    useState<CatapultDesignInputs>(defaultDesignInputs);
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saving, setSaving] = useState(false);
  const { t } = useTranslation();

  const set = <K extends keyof CatapultDesignInputs>(
    key: K,
    value: CatapultDesignInputs[K],
  ) => setInputs((prev) => ({ ...prev, [key]: value }));

  const results = calculateDesign(inputs);
  const f = (n: number, d = 1) => (isNaN(n) ? "—" : n.toFixed(d));
  const spd = (ms: number) => `${f(ms, 2)} м/с  (${f(ms * 3.6, 1)} км/год)`;

  const handleSave = async () => {
    if (!saveName.trim()) return;
    setSaving(true);
    try {
      await catapultApi.create({
        name: saveName.trim(),
        config_data: inputs,
      });
      setShowSave(false);
      setSaveName("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="grid grid-cols-[38%_1fr] gap-0 bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Left panel — inputs */}
      <div className="border-r border-slate-100 bg-slate-50">
        <div className="px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h2 className="text-sm font-medium text-slate-700">
            {t("catapult.design.title")}
          </h2>
        </div>
        <div className="p-4 flex flex-col gap-3">
          <Section
            title={t("catapult.design.sections.construction")}
            color="blue"
          >
            <Field
              label={t("catapult.design.fields.cylDiam")}
              unit={t("common.units.mm")}
              value={inputs.cyl_d}
              onChange={(v) => set("cyl_d", v)}
            />
            <Field
              label={t("catapult.design.fields.pistonStroke")}
              unit={t("common.units.mm")}
              value={inputs.cyl_len}
              onChange={(v) => set("cyl_len", v)}
            />
            <Field
              label={t("catapult.design.fields.pistonMass")}
              unit={t("common.units.g")}
              value={inputs.piston_mass_g}
              onChange={(v) => set("piston_mass_g", v)}
            />
            <Field
              label={t("catapult.design.fields.cartMass")}
              unit={t("common.units.g")}
              value={inputs.cart_mass_g}
              onChange={(v) => set("cart_mass_g", v)}
            />
            <Field
              label={t("catapult.design.fields.friction")}
              value={inputs.friction}
              step={0.005}
              onChange={(v) => set("friction", v)}
            />
          </Section>

          <Section
            title={t("catapult.design.sections.pneumatics")}
            color="purple"
          >
            <Field
              label={t("catapult.design.fields.receiverVol")}
              unit={t("common.units.l")}
              value={inputs.rec_vol}
              onChange={(v) => set("rec_vol", v)}
            />
            <Field
              label={t("catapult.design.fields.maxPressure")}
              unit={t("common.units.bar")}
              value={inputs.max_pressure}
              step={0.5}
              onChange={(v) => set("max_pressure", v)}
            />
            <Field
              label={t("catapult.design.fields.temperature")}
              unit="°C"
              value={inputs.temperature}
              min={-30}
              onChange={(v) => set("temperature", v)}
            />
          </Section>

          <Section
            title={t("catapult.design.sections.conditions")}
            color="amber"
          >
            <Field
              label={t("catapult.design.fields.aircraftMass")}
              unit={t("common.units.g")}
              value={inputs.aircraft_mass_g}
              onChange={(v) => set("aircraft_mass_g", v)}
            />
            <Field
              label={t("catapult.design.fields.angle")}
              unit="°"
              value={inputs.cat_angle}
              step={1}
              onChange={(v) => set("cat_angle", v)}
            />
          </Section>

          <button
            onClick={() => setShowSave(true)}
            className="mt-2 w-full text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 py-2 rounded-lg transition-colors"
          >
            {t("catapult.design.save")}
          </button>
        </div>
      </div>

      {/* Right panel — results */}
      <div>
        <div className="px-4 py-3 border-b border-slate-100 bg-white sticky top-0 z-10">
          <h2 className="text-sm font-medium text-slate-700">
            {t("catapult.design.results")}
          </h2>
        </div>
        <div className="p-4 flex flex-col gap-4">
          {/* Main Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Площа поршня</div>
              <div className="text-xl font-medium text-slate-900">
                {f(results.A_piston_cm2, 2)}
                <span className="text-sm text-slate-400 ml-1">
                  {t("common.units.cm2")}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Об'єм циліндра</div>
              <div className="text-xl font-medium text-slate-900">
                {f(results.V_cyl_L, 3)}
                <span className="text-sm text-slate-400 ml-1">
                  {t("common.units.l")}
                </span>
              </div>
            </div>
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-400 mb-1">Початкова сила</div>
              <div className="text-xl font-medium text-slate-900">
                {f(results.F_piston_0_kg, 1)}
                <span className="text-sm text-slate-400 ml-1">
                  {t("common.units.kg")}
                </span>
              </div>
            </div>
          </div>

          {/* Pneumatics */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider border-b bg-purple-50 text-purple-700 border-purple-100">
              {t("catapult.design.sections.pneumatics")}
            </div>
            <div className="p-4">
              <ResultRow
                label="Тиск після пострілу"
                value={f(results.P_fin_bar, 2)}
                unit={t("common.units.bar")}
                status="info"
              />
              <ResultRow
                label="Падіння тиску"
                value={f(results.P_drop_pct, 1)}
                unit={t("common.units.pct")}
                status="info"
              />
              <ResultRow
                label="Робота газу"
                value={f(results.W_gas, 1)}
                unit={t("common.units.J")}
                status="info"
              />
              <ResultRow
                label="Робота проти гравітації"
                value={f(results.W_grav, 1)}
                unit={t("common.units.J")}
                status="info"
              />
              <ResultRow
                label="Втрати на тертя"
                value={f(results.W_friction, 1)}
                unit={t("common.units.J")}
                status="info"
              />
              <ResultRow
                label="Корисна робота"
                value={f(results.W_total, 1)}
                unit={t("common.units.J")}
                status={results.W_total > 0 ? "ok" : "bad"}
              />
            </div>
          </div>

          {/* Dynamics */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider border-b bg-blue-50 text-blue-700 border-blue-100">
              Динаміка розгону
            </div>
            <div className="p-4">
              <ResultRow
                label="Швидкість каретки"
                value={spd(results.V_cat_ms)}
                status="info"
              />
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
            </div>
          </div>

          {/* Table of variants */}
          <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
            <div className="px-4 py-2 text-xs font-medium uppercase tracking-wider border-b bg-amber-50 text-amber-700 border-amber-100">
              Таблиця: маса літака → потрібний тиск
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left px-4 py-2 text-xs text-slate-400 font-medium">
                      Маса, кг
                    </th>
                    <th className="text-right px-4 py-2 text-xs text-slate-400 font-medium">
                      Мін. тиск, бар
                    </th>
                    <th className="text-right px-4 py-2 text-xs text-slate-400 font-medium">
                      Швидкість при макс. тиску
                    </th>
                    <th className="text-center px-4 py-2 text-xs text-slate-400 font-medium">
                      Статус
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {results.table.map((row) => (
                    <tr
                      key={row.mass_kg}
                      className={`border-b border-slate-50 ${
                        row.mass_kg ===
                        Math.round(inputs.aircraft_mass_g / 1000)
                          ? "bg-blue-50"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-2 font-medium">
                        {row.mass_kg} {t("common.units.kg")}
                      </td>
                      <td
                        className={`px-4 py-2 text-right font-medium ${
                          row.ok ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {f(row.P_min_bar, 2)}
                      </td>
                      <td className="px-4 py-2 text-right text-slate-600">
                        {f(row.V_cat_ms, 1)} {t("common.units.ms")}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {row.ok ? (
                          <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                            ✓ вистачає
                          </span>
                        ) : (
                          <span className="text-xs bg-red-50 text-red-700 px-2 py-0.5 rounded-full">
                            ✗ не вистачає
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Saving modal*/}
      {showSave && (
        <div
          className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
          onClick={() => setShowSave(false)}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-slate-800 mb-4">
              {t("catapult.design.saveTitle")}
            </h3>
            <input
              type="text"
              placeholder={t("catapult.design.savePlaceholder")}
              value={saveName}
              onChange={(e) => setSaveName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              autoFocus
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 mb-3"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setShowSave(false)}
                className="px-4 py-2 text-sm text-slate-500"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg disabled:opacity-50"
              >
                {saving ? t("common.saving") : t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
