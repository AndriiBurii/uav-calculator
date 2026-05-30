import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../../api/auth";
import { useAuthStore } from "../../store/auth";
import LanguageSwitcher from "../ui/LanguageSwitcher";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refresh_token") || "";
    try {
      await authApi.logout(refreshToken);
    } finally {
      logout();
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-bold text-slate-900 tracking-tight">
              UAV Calculator
            </span>
            <nav className="flex items-center gap-4 text-sm">
              <Link
                to="/configs"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                {t("nav.configs")}
              </Link>
              <Link
                to="/catapult"
                className="text-slate-600 hover:text-blue-600 transition-colors"
              >
                {t("nav.catapult")}
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <LanguageSwitcher />
            <span className="text-slate-500">
              {user?.name || t("nav.profile")}
            </span>
            <button
              onClick={handleLogout}
              className="text-slate-500 hover:text-red-600 transition-colors"
            >
              {t("nav.logout")}
            </button>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}
