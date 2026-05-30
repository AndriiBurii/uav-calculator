import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";
import InputPanel from "../components/calculator/InputPanel";
import ResultPanel from "../components/calculator/ResultPanel";
import SaveConfigModal from "../components/calculator/SaveConfigModal";
import AppLayout from "../components/layout/AppLayout";
import { type AircraftConfig } from "../types";
import {
  calculate,
  defaultInputs,
  type AircraftInputs,
} from "../utils/calculator";

export default function CalculatorPage() {
  const location = useLocation();
  const state = location.state as { config?: AircraftConfig } | null;
  const { t } = useTranslation();

  const [inputs, setInputs] = useState<AircraftInputs>(
    state?.config
      ? (state.config.config_data as unknown as AircraftInputs)
      : defaultInputs,
  );
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [loadedName, setLoadedName] = useState<string | null>(
    state?.config?.name ?? null,
  );

  const results = calculate(inputs);

  return (
    <AppLayout>
      <div className="flex h-[calc(100vh-56px-48px)] gap-0 bg-white border border-slate-200 rounded-xl overflow-y-auto">
        {/* Left panel */}
        <div className="w-[38%] border-r border-slate-100 bg-slate-50 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">
              {t("calculator.title")}
            </h2>
            {loadedName && (
              <span className="text-xs text-blue-500 bg-blue-50 px-2 py-0.5 rounded-md">
                {loadedName}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto">
            <InputPanel inputs={inputs} onChange={setInputs} />
          </div>
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col">
          <div className="px-4 py-3 border-b border-slate-100 bg-white flex items-center justify-between">
            <h2 className="text-sm font-medium text-slate-700">
              {t("calculator.results_calc")}
            </h2>
            <button
              onClick={() => setShowSaveModal(true)}
              className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
            >
              {t("calculator.saveConfig")}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ResultPanel results={results} />
          </div>
        </div>
      </div>

      {showSaveModal && (
        <SaveConfigModal
          inputs={inputs}
          onClose={() => setShowSaveModal(false)}
          onSaved={() => setLoadedName(null)}
        />
      )}
    </AppLayout>
  );
}
