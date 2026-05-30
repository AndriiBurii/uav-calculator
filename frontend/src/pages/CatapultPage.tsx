import { useState } from "react";
import { useTranslation } from "react-i18next";
import CatapultBungeeTab from "../components/catapult/CatapultBungeeTab";
import CatapultDesignTab from "../components/catapult/CatapultDesignTab";
import CatapultLaunchTab from "../components/catapult/CatapultLaunchTab";
import AppLayout from "../components/layout/AppLayout";

type Tab = "design" | "launch" | "bungee";

export default function CatapultPage() {
  const [activeTab, setActiveTab] = useState<Tab>("design");
  const { t } = useTranslation();

  const tabs: { id: Tab; label: string }[] = [
    { id: "design", label: t("catapult.tabs.design") },
    { id: "launch", label: t("catapult.tabs.launch") },
    { id: "bungee", label: t("catapult.tabs.bungee") },
  ];

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-lg font-medium text-slate-800">
            {t("catapult.title")}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            {t("catapult.subtitle")}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl mb-6 w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 text-sm rounded-lg transition-all ${
                activeTab === tab.id
                  ? "bg-white text-slate-800 font-medium shadow-sm"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "design" && <CatapultDesignTab />}
        {activeTab === "launch" && <CatapultLaunchTab />}
        {activeTab === "bungee" && <CatapultBungeeTab />}
      </div>
    </AppLayout>
  );
}
