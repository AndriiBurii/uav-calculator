import { useTranslation } from "react-i18next";

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const toggle = () => {
    i18n.changeLanguage(i18n.language.startsWith("uk") ? "en" : "uk");
  };

  const isUk = i18n.language.startsWith("uk");

  return (
    <button
      onClick={toggle}
      className="text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 hover:border-slate-300 px-2 py-1 rounded-md transition-colors"
    >
      {isUk ? "EN" : "UK"}
    </button>
  );
}
