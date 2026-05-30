import { useTranslation } from "react-i18next";
import { type AircraftResults } from "../../utils/calculator";

interface Props {
  results: AircraftResults;
}

function MetricCard({
  label,
  value,
  unit,
  status,
}: {
  label: string;
  value: string;
  unit?: string;
  status?: "ok" | "warn" | "bad";
}) {
  const color =
    status === "ok"
      ? "text-emerald-600"
      : status === "warn"
        ? "text-amber-600"
        : status === "bad"
          ? "text-red-600"
          : "text-slate-900";
  return (
    <div className="bg-slate-50 rounded-lg p-3">
      <div className="text-xs text-slate-400 mb-1">{label}</div>
      <div className={`text-xl font-medium ${color}`}>
        {value}
        {unit && <span className="text-sm text-slate-400 ml-1">{unit}</span>}
      </div>
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
    pink: "bg-pink-50 text-pink-700 border-pink-100",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-100",
  };
  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden">
      <div
        className={`px-4 py-2 text-xs font-medium uppercase tracking-wider border-b ${colors[color] || colors.blue}`}
      >
        {title}
      </div>
      <div className="divide-y divide-slate-50">{children}</div>
    </div>
  );
}

function Row({
  label,
  sub,
  value,
  unit,
  status,
}: {
  label: string;
  sub?: string;
  value: string;
  unit?: string;
  status?: "ok" | "warn" | "bad" | "info";
}) {
  const valueColor =
    status === "ok"
      ? "text-emerald-600"
      : status === "warn"
        ? "text-amber-600"
        : status === "bad"
          ? "text-red-600"
          : "text-blue-600";
  return (
    <div className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors">
      <div>
        <div className="text-sm text-slate-700">{label}</div>
        {sub && <div className="text-xs text-slate-400 italic">{sub}</div>}
      </div>
      <div className={`text-sm font-medium text-right ${valueColor}`}>
        {value}
        {unit && <span className="text-xs text-slate-400 ml-1">{unit}</span>}
      </div>
    </div>
  );
}

function StatusDot({ status }: { status: "ok" | "warn" | "bad" }) {
  const cls =
    status === "ok"
      ? "bg-emerald-500"
      : status === "warn"
        ? "bg-amber-500"
        : "bg-red-500";
  return <span className={`inline-block w-2 h-2 rounded-full ${cls} mr-2`} />;
}

function CGBar({ results }: { results: AircraftResults }) {
  const { CG_front, CG_rear, CG_opt } = results;
  const barMin = Math.floor(CG_front * 0.92);
  const barMax = Math.ceil(CG_rear * 1.08);
  const barRange = barMax - barMin;
  const { t } = useTranslation();
  const toP = (x: number) => (((x - barMin) / barRange) * 100).toFixed(1) + "%";
  return (
    <div className="bg-white border border-slate-100 rounded-xl p-4">
      <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
        {t("calculator.results.cg")}
      </div>
      <div className="relative h-7 bg-slate-100 rounded-lg overflow-hidden">
        <div
          className="absolute top-0 h-full bg-red-100 flex items-center justify-center text-xs text-red-700"
          style={{ left: "0", width: toP(CG_front) }}
        >
          {t("calculator.results.front")}
        </div>
        <div
          className="absolute top-0 h-full bg-emerald-100 flex items-center justify-center text-xs text-emerald-700"
          style={{
            left: toP(CG_front),
            width: (((CG_rear - CG_front) / barRange) * 100).toFixed(1) + "%",
          }}
        >
          {t("calculator.results.optimal")}
        </div>
        <div
          className="absolute top-0 h-full bg-amber-100 flex items-center justify-center text-xs text-amber-700"
          style={{ left: toP(CG_rear), right: "0" }}
        >
          {t("calculator.results.rear")}
        </div>
        <div
          className="absolute top-0 h-full w-0.5 bg-blue-500"
          style={{ left: toP(CG_opt) }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400 mt-2">
        <span>
          {t("calculator.results.front")}: {CG_front.toFixed(1)}{" "}
          {t("common.units.mm")}
        </span>
        <span className="text-blue-500 font-medium">
          {t("calculator.results.optimal")}: {CG_opt.toFixed(1)}{" "}
          {t("common.units.mm")}
        </span>
        <span>
          {t("calculator.results.rear")}: {CG_rear.toFixed(1)}{" "}
          {t("common.units.mm")}
        </span>
      </div>
    </div>
  );
}

export default function ResultPanel({ results }: Props) {
  const f = (n: number, d = 1) => (isNaN(n) ? "—" : n.toFixed(d));
  const spd = (ms: number) => `${f(ms, 2)} м/с  (${f(ms * 3.6, 1)} км/год)`;
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Main metrics */}
      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label={t("calculator.results.wingArea")}
          value={f(results.S_total, 2)}
          unit={t("common.units.dm2")}
        />
        <MetricCard
          label={t("calculator.results.wingLoading")}
          value={f(results.WL, 1)}
          unit={t("common.units.g_dm2")}
          status={results.status.WL}
        />
        <MetricCard
          label={t("calculator.results.thrustWeight")}
          value={f(results.TW, 2)}
          status={results.status.TW}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MetricCard
          label={t("calculator.results.totalThrust")}
          value={f(results.thrust_total, 0)}
          unit={t("common.units.g")}
        />
        <MetricCard
          label={t("calculator.results.power")}
          value={f(results.power_total, 0)}
          unit={t("common.units.W")}
        />
        <MetricCard
          label={t("calculator.results.specificPower")}
          value={f(results.PW, 0)}
          unit={t("common.units.Wkg")}
        />
      </div>

      {/* Center of Gravity */}
      <CGBar results={results} />

      {/* Geometry */}
      <Section title={t("calculator.results.geometry")} color="blue">
        <Row
          label={t("calculator.results.centerSectionArea")}
          sub="S_цп"
          value={f(results.S_cp, 2)}
          unit={t("common.units.dm2")}
          status="info"
        />
        <Row
          label={t("calculator.results.consoleArea")}
          sub="S_кр"
          value={f(results.S_wing, 2)}
          unit={t("common.units.dm2")}
          status="info"
        />
        <Row
          label={t("calculator.results.totalArea")}
          sub="S_total"
          value={f(results.S_total, 2)}
          unit={t("common.units.dm2")}
          status="info"
        />
        <Row
          label={t("calculator.results.stabilizerArea")}
          sub="S_ст"
          value={f(results.S_stab, 2)}
          unit={t("common.units.dm2")}
          status="info"
        />
        <Row
          label={t("calculator.results.finArea")}
          sub="S_кіль"
          value={f(results.S_fin, 2)}
          unit={t("common.units.dm2")}
          status="info"
        />
        <Row
          label={t("calculator.results.mac")}
          value={f(results.MAC, 1)}
          unit={t("common.units.mm")}
          status="info"
        />
        <Row
          label={t("calculator.results.totalSpan")}
          value={f(results.span, 0)}
          unit={t("common.units.mm")}
          status="info"
        />
      </Section>

      {/* Aerodynamic Center */}
      <Section title={t("calculator.results.aerodynamicCenter")} color="blue">
        <Row
          label={t("calculator.results.acCenterSection")}
          sub="x_AC_цп = b_цп × 0.25"
          value={f(results.ac_cp, 1)}
          unit={t("common.units.mm")}
          status="info"
        />
        <Row
          label={t("calculator.results.acWing")}
          sub="x_AC_кр = зміщення + b_кр × 0.25"
          value={f(results.ac_wing, 1)}
          unit={t("common.units.mm")}
          status="info"
        />
        <Row
          label={t("calculator.results.acWeighted")}
          sub="x_AC — від носа"
          value={f(results.ac_main, 1)}
          unit="мм від носа"
          status="info"
        />
      </Section>

      {/* Neutral Point */}
      <Section title={t("calculator.results.neutralPoint")} color="green">
        <Row
          label={t("calculator.results.acStabilizer")}
          sub="x_AC_ст від носа"
          value={f(results.ac_stab, 1)}
          unit="мм від носа"
          status="info"
        />
        <Row
          label={t("calculator.results.stabilizerArm")}
          sub="Lt = x_AC_ст − x_AC"
          value={f(results.Lt, 1)}
          unit={t("common.units.mm")}
          status="info"
        />
        <Row
          label={t("calculator.results.neutralPoint")}
          sub="NP = x_AC + (S_ст/S) × Lt × 0.70"
          value={f(results.NP, 1)}
          unit="мм від носа"
          status="ok"
        />
      </Section>

      {/* Center of Gravity — Values */}
      <Section title={t("calculator.results.centerOfGravity")} color="amber">
        <Row
          label={t("calculator.results.cgFrontLimit")}
          sub="SM = 15% → NP − 0.15 × MAC"
          value={f(results.CG_front, 1)}
          unit={t("common.units.mm")}
          status="warn"
        />
        <Row
          label={t("calculator.results.cgOptimal")}
          sub="SM = 10% → NP − 0.10 × MAC"
          value={f(results.CG_opt, 1)}
          unit={t("common.units.mm")}
          status="ok"
        />
        <Row
          label={t("calculator.results.cgRearLimit")}
          sub="SM = 5% → NP − 0.05 × MAC"
          value={f(results.CG_rear, 1)}
          unit={t("common.units.mm")}
          status="warn"
        />
      </Section>

      {/* Stability Coefficients */}
      <Section title={t("calculator.results.stabilityCoeff")} color="blue">
        <Row
          label={t("calculator.results.vh")}
          sub={results.tail_type_label}
          value={f(results.VH, 3)}
          status={results.status.VH}
        />
        <Row
          label={t("calculator.results.vv")}
          sub="(S_кіль × Lt) / (S × l)"
          value={f(results.VV, 3)}
          status={results.status.VV}
        />
      </Section>

      {/* Aspect Ratio */}
      <Section title={t("calculator.results.aspectRatio")} color="purple">
        <Row
          label="Aspect Ratio"
          sub="AR = l² / S"
          value={f(results.AR, 2)}
          status={results.status.AR}
        />
        <Row
          label={t("calculator.results.inductiveDragK")}
          sub="k = 1 / (π × AR × 0.85)"
          value={f(results.k_ind, 4)}
          status="info"
        />
        <Row
          label={t("calculator.results.ldmax")}
          sub="0.5 × √(π × AR × e / CD0)"
          value={f(results.LD_max, 1)}
          status="info"
        />
      </Section>

      {/* Wing Loading */}
      <Section title={t("calculator.results.wingLoading2")} color="pink">
        <Row
          label="Навантаження WL"
          sub="WL = маса(г) / площа(дм²)"
          value={f(results.WL, 1)}
          unit="г/дм²"
          status={results.status.WL}
        />
        <Row
          label={`Норма для «${results.wl_norm.label}»`}
          sub=""
          value={`${results.wl_norm.min}–${results.wl_norm.max}`}
          unit="г/дм²"
          status="info"
        />
        <Row
          label="Швидкість зриву"
          sub="V = √(2×m×g / (ρ×S×CL_max))"
          value={spd(results.V_stall)}
          status="info"
        />
        <Row
          label="Мінімальна злітна"
          sub="V_зліт = V_stall × 1.2"
          value={spd(results.V_takeoff_ms)}
          status="info"
        />
        <Row
          label="Крейсерська швидкість"
          sub="при CD0=0.025, e=0.85"
          value={spd(results.V_cruise_ms)}
          status="info"
        />
      </Section>

      {/* Propulsion */}
      <Section title={t("calculator.results.propulsion")} color="amber">
        <Row
          label="T/W — тяговооснащеність"
          sub={`${results.thrust_total}г / ${(results.thrust_total / results.TW) | 0}г`}
          value={f(results.TW, 2)}
          status={results.status.TW}
        />
        <Row
          label="Питома потужність"
          sub="Вт/кг"
          value={f(results.PW, 1)}
          unit="Вт/кг"
          status={results.PW >= 100 ? "ok" : "warn"}
        />
        <Row
          label="Швидкість ~нульової тяги"
          sub="V₀ ≈ 2.5 × v_ind"
          value={spd(results.V_zero_ms)}
          status="info"
        />
        <Row
          label="Тяга на злітній швидкості"
          sub="T(V_зліт) з урахуванням падіння"
          value={`${f(results.T_at_takeoff, 1)} кг`}
          status={results.T_at_takeoff > 0 ? "ok" : "warn"}
        />
        <Row
          label="Площа диску гвинта"
          sub="A = π(D/2)²"
          value={f(results.A_disk * 10000, 1)}
          unit="см²"
          status="info"
        />
      </Section>

      {/* Recommendations */}
      <div className="bg-white border border-slate-100 rounded-xl p-4">
        <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
          {t("calculator.results.recommendations")}
        </div>
        <div className="flex flex-col gap-2">
          {results.notes.map((note, i) => (
            <div
              key={i}
              className={`px-3 py-2 rounded-lg text-xs flex items-start gap-2 ${
                note.type === "ok"
                  ? "bg-emerald-50 text-emerald-700"
                  : note.type === "warn"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-red-50 text-red-700"
              }`}
            >
              <StatusDot status={note.type} />
              {note.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
