import { useState } from "react";
import { configsApi } from "../../api/configs";
import { type AircraftInputs } from "../../utils/calculator";

interface Props {
  inputs: AircraftInputs;
  onClose: () => void;
  onSaved: () => void;
}

export default function SaveConfigModal({ inputs, onClose, onSaved }: Props) {
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Введіть назву конфігурації");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await configsApi.create({
        name: name.trim(),
        wing_type: inputs.wingType,
        tail_type: inputs.tailType,
        config_data: inputs as unknown as Record<string, unknown>,
      });
      onSaved();
      onClose();
    } catch {
      setError("Помилка збереження");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/30 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl border border-slate-200 p-6 w-full max-w-sm shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-medium text-slate-800 mb-4">
          Зберегти конфігурацію
        </h3>

        <input
          type="text"
          placeholder="Назва конфігурації"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          autoFocus
          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-400 transition-colors mb-3"
        />

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        <div className="flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Скасувати
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg transition-colors"
          >
            {loading ? "Збереження..." : "Зберегти"}
          </button>
        </div>
      </div>
    </div>
  );
}
