import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import CalculatorPage from "./pages/CalculatorPage";
import CatapultPage from "./pages/CatapultPage";
import ConfigsPage from "./pages/ConfigsPage";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/calculator" element={<CalculatorPage />} />

        <Route path="/configs" element={<ConfigsPage />} />

        <Route path="/catapult" element={<CatapultPage />} />

        <Route path="*" element={<Navigate to="/calculator" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
