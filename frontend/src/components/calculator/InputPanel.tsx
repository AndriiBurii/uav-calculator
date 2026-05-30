import { useTranslation } from "react-i18next";
import { type AircraftInputs } from "../../utils/calculator";

interface Props {
  inputs: AircraftInputs;
  onChange: (inputs: AircraftInputs) => void;
}

type WingType = AircraftInputs["wingType"];
type TailType = AircraftInputs["tailType"];

function Field({
  label,
  unit,
  value,
  onChange,
  min = 0,
  step = 1,
}: {
  label: string;
  unit?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  step?: number;
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
        min={min}
        step={step}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        className="w-24 text-right px-2 py-1 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-400 transition-colors"
      />
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-slate-100 pt-3">
      <div className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-3">
        {title}
      </div>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  );
}

export default function InputPanel({ inputs, onChange }: Props) {
  const { t } = useTranslation();
  const set = <K extends keyof AircraftInputs>(
    key: K,
    value: AircraftInputs[K],
  ) => onChange({ ...inputs, [key]: value });

  const isFlyingWing = inputs.wingType === "flying_wing";
  const isWithCenter = inputs.wingType === "with_center";

  return (
    <div className="flex flex-col gap-3 p-4 overflow-y-auto h-full">
      {/* Construction Type */}
      <div className="flex flex-col gap-2">
        <div className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {t("calculator.sections.construction")}
        </div>
        <div>
          <label className="text-xs text-slate-500 block mb-1">
            {t("calculator.wingType")}
          </label>
          <select
            value={inputs.wingType}
            onChange={(e) => set("wingType", e.target.value as WingType)}
            className="w-full text-sm px-2 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-400"
          >
            <option value="with_center">
              {t("calculator.wingTypes.with_center")}
            </option>
            <option value="without_center">
              {t("calculator.wingTypes.without_center")}
            </option>
            <option value="flying_wing">
              {t("calculator.wingTypes.flying_wing")}
            </option>
          </select>
        </div>
        {!isFlyingWing && (
          <div>
            <label className="text-xs text-slate-500 block mb-1">
              {t("calculator.tailType")}
            </label>
            <select
              value={inputs.tailType}
              onChange={(e) => set("tailType", e.target.value as TailType)}
              className="w-full text-sm px-2 py-1.5 border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-400"
            >
              <option value="h_tail">{t("calculator.tailTypes.h_tail")}</option>
              <option value="classic">
                {t("calculator.tailTypes.classic")}
              </option>
              <option value="v_tail">{t("calculator.tailTypes.v_tail")}</option>
              <option value="t_tail">{t("calculator.tailTypes.t_tail")}</option>
            </select>
          </div>
        )}
      </div>
      {/* Center Section or Flying Wing */}
      {(isWithCenter || isFlyingWing) && (
        <Section
          title={
            isFlyingWing
              ? t("calculator.sections.wing")
              : t("calculator.sections.centerSection")
          }
        >
          <Field
            label={t("calculator.fields.chord")}
            unit={t("common.units.mm")}
            value={inputs.b_cp}
            onChange={(v) => set("b_cp", v)}
          />
          <Field
            label={t("calculator.fields.span")}
            unit={t("common.units.mm")}
            value={inputs.s_cp}
            onChange={(v) => set("s_cp", v)}
          />
        </Section>
      )}
      {/* Consoles */}
      {!isFlyingWing && (
        <Section title={t("calculator.sections.consoles")}>
          <Field
            label={t("calculator.fields.chord")}
            unit={t("common.units.mm")}
            value={inputs.b_wing}
            onChange={(v) => set("b_wing", v)}
          />
          <Field
            label={t("calculator.fields.span")}
            unit={t("common.units.mm")}
            value={inputs.s_wing}
            onChange={(v) => set("s_wing", v)}
          />
          <Field
            label={t("calculator.fields.wingOffset")}
            unit={t("common.units.mm")}
            value={inputs.wing_offset}
            onChange={(v) => set("wing_offset", v)}
          />
        </Section>
      )}
      {/* Stabilizer */}
      {!isFlyingWing && (
        <Section title={t("calculator.sections.stabilizer")}>
          <Field
            label={t("calculator.fields.chord")}
            unit={t("common.units.mm")}
            value={inputs.b_stab}
            onChange={(v) => set("b_stab", v)}
          />
          <Field
            label={t("calculator.fields.span")}
            unit={t("common.units.mm")}
            value={inputs.s_stab}
            onChange={(v) => set("s_stab", v)}
          />
          <Field
            label={t("calculator.fields.stabDist")}
            unit={t("common.units.mm")}
            value={inputs.tail_dist}
            onChange={(v) => set("tail_dist", v)}
          />
          <Field
            label={t("calculator.fields.elevator")}
            unit={t("calculator.fields.elevatorUnit")}
            value={inputs.elev_pct}
            onChange={(v) => set("elev_pct", v)}
          />
        </Section>
      )}
      {/* Fins — not for flying wing and not for v_tail */}
      {!isFlyingWing && inputs.tailType !== "v_tail" && (
        <Section
          title={
            inputs.tailType === "h_tail"
              ? t("calculator.sections.fins")
              : t("calculator.sections.fin")
          }
        >
          <Field
            label={t("calculator.fields.height")}
            unit={t("common.units.mm")}
            value={inputs.fin_h}
            onChange={(v) => set("fin_h", v)}
          />
          <Field
            label={t("calculator.fields.chord")}
            unit={t("common.units.mm")}
            value={inputs.fin_c}
            onChange={(v) => set("fin_c", v)}
          />
        </Section>
      )}
      {/* V-tail */}
      {inputs.tailType === "v_tail" && !isFlyingWing && (
        <Section title={t("calculator.tailTypes.v_tail")}>
          <Field
            label={t("calculator.fields.vTailSpan")}
            unit={t("common.units.mm")}
            value={inputs.fin_h}
            onChange={(v) => set("fin_h", v)}
          />
          <Field
            label={t("calculator.fields.vTailChord")}
            unit={t("common.units.mm")}
            value={inputs.fin_c}
            onChange={(v) => set("fin_c", v)}
          />
          <Field
            label={t("calculator.fields.vTailAngle")}
            unit={t("common.units.deg")}
            value={inputs.v_tail_angle}
            step={5}
            onChange={(v) => set("v_tail_angle", v)}
          />
          <div className="text-xs text-slate-400 bg-slate-50 px-2 py-1.5 rounded-md">
            {t("calculator.place.angle")}{" "}
            {((180 - inputs.v_tail_angle) / 2).toFixed(0)}°
          </div>
        </Section>
      )}
      {/* Ailerons */}
      <Section title={t("calculator.sections.ailerons")}>
        <Field
          label={t("calculator.fields.length")}
          unit={t("common.units.mm")}
          value={inputs.ail_len}
          onChange={(v) => set("ail_len", v)}
        />
        <Field
          label={t("calculator.fields.chord")}
          unit={t("common.units.mm")}
          value={inputs.ail_chord}
          onChange={(v) => set("ail_chord", v)}
        />
      </Section>
      {/* Mass */}
      <Section title={t("calculator.sections.mass")}>
        <Field
          label={t("calculator.fields.mass")}
          unit={t("common.units.g")}
          value={inputs.mass_g}
          onChange={(v) => set("mass_g", v)}
        />
        <Field
          label={t("calculator.fields.clMax")}
          value={inputs.cl_max}
          step={0.05}
          onChange={(v) => set("cl_max", v)}
        />
      </Section>
      {/* Propulsion */}
      <Section title={t("calculator.sections.propulsion")}>
        {/* Text inputs for names */}
        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">
            {t("calculator.fields.motorName")}
          </label>
          <input
            type="text"
            value={inputs.motor_name || ""}
            onChange={(e) => set("motor_name", e.target.value as never)}
            placeholder={t("calculator.place.motor")}
            className="w-full px-2 py-1 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-slate-500">
            {t("calculator.fields.propName")}
          </label>
          <input
            type="text"
            value={inputs.prop_name || ""}
            onChange={(e) => set("prop_name", e.target.value as never)}
            placeholder={t("calculator.place.prop")}
            className="w-full px-2 py-1 text-sm border border-slate-200 rounded-md bg-white focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        <Field
          label={t("calculator.fields.numMotors")}
          value={inputs.num_motors}
          min={1}
          step={1}
          onChange={(v) => set("num_motors", Math.max(1, Math.round(v)))}
        />
        <Field
          label={t("calculator.fields.thrustPerMotor")}
          unit={t("common.units.g")}
          value={inputs.thrust_g}
          onChange={(v) => set("thrust_g", v)}
        />
        <Field
          label={t("calculator.fields.powerPerMotor")}
          unit={t("common.units.W")}
          value={inputs.power_w}
          onChange={(v) => set("power_w", v)}
        />
        <Field
          label={t("calculator.fields.propDiam")}
          unit={t("common.units.inch")}
          value={inputs.prop_d}
          step={0.5}
          onChange={(v) => set("prop_d", v)}
        />
        <Field
          label={t("calculator.fields.propPitch")}
          unit={t("common.units.inch")}
          value={inputs.prop_p}
          step={0.5}
          onChange={(v) => set("prop_p", v)}
        />

        {inputs.num_motors > 1 && (
          <div className="text-xs text-blue-500 bg-blue-50 px-2 py-1.5 rounded-md">
            {t("calculator.fields.totalThrust")}:{" "}
            {(inputs.thrust_g * inputs.num_motors).toFixed(0)} г ·{" "}
            {t("calculator.fields.totalPower")}:{" "}
            {(inputs.power_w * inputs.num_motors).toFixed(0)} Вт
          </div>
        )}
      </Section>{" "}
    </div>
  );
}
