import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { configsApi } from "../api/configs";
import AppLayout from "../components/layout/AppLayout";
import { type AircraftConfig } from "../types";

export default function ConfigsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [configs, setConfigs] = useState<AircraftConfig[]>([]);
  const [loading, setLoading] = useState(true);

  const loadConfigs = async () => {
    try {
      const { data } = await configsApi.list();
      setConfigs(data.configs || []);
    } catch {
      setConfigs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConfigs();
  }, []);

  const handleDelete = async (id: number) => {
    if (!confirm(t("configs.confirmDelete"))) return;
    await configsApi.delete(id);
    loadConfigs();
  };

  const handleLoad = (cfg: AircraftConfig) => {
    navigate("/calculator", { state: { config: cfg } });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-lg font-medium text-slate-800">
            {t("configs.title")}
          </h1>
          <button
            onClick={() => navigate("/calculator")}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            {t("configs.newCalc")}
          </button>
        </div>

        {loading ? (
          <div className="text-sm text-slate-400 text-center py-16">
            {t("common.loading")}
          </div>
        ) : configs.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl">
            <div className="text-slate-400 text-sm mb-3">
              {t("configs.empty")}
            </div>
            <button
              onClick={() => navigate("/calculator")}
              className="text-sm text-blue-600 hover:underline"
            >
              {t("configs.createFirst")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {configs.map((cfg) => (
              <div
                key={cfg.id}
                className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between hover:border-slate-300 transition-colors"
              >
                <div className="flex flex-col gap-1">
                  <div className="font-medium text-slate-800">{cfg.name}</div>
                  <div className="flex gap-3 text-xs text-slate-400">
                    <span>
                      {t(`configs.wingType.${cfg.wing_type}`) || cfg.wing_type}
                    </span>
                    <span>·</span>
                    <span>
                      {t(`configs.tailType.${cfg.tail_type}`) || cfg.tail_type}
                    </span>
                    <span>·</span>
                    <span>{new Date(cfg.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleLoad(cfg)}
                    className="text-sm text-blue-600 hover:text-blue-700 px-3 py-1.5 border border-blue-200 hover:border-blue-300 rounded-lg transition-colors"
                  >
                    {t("configs.load")}
                  </button>
                  <button
                    onClick={() => handleDelete(cfg.id)}
                    className="text-sm text-slate-400 hover:text-red-500 px-3 py-1.5 border border-slate-200 hover:border-red-200 rounded-lg transition-colors"
                  >
                    {t("configs.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
