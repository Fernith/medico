import { useState } from "react";
import {
  Play
} from "lucide-react";


export const PasoSeleccion = ({ state, actions }: any) => {
  const [isLoading, setIsLoading] = useState(false);

  const rutinasActivas = state.rutinas.filter((r: any) => r.activo !== false);

  const handleSelect = async (r: any) => {
    setIsLoading(true);
    try {
      await actions.selectRutina(r);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-lg p-6 flex-1 flex flex-col items-center justify-center mt-8 animate-in fade-in zoom-in duration-300">
        <div className="bg-slate-800/90 backdrop-blur-md p-10 rounded-[2rem] border border-slate-700 shadow-2xl flex flex-col items-center text-center">
          <svg
            className="w-16 h-16 text-indigo-500 animate-spin mb-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <h2 className="text-2xl font-black text-white mb-2">
            Cargando rutina
          </h2>
          <p className="text-slate-400 font-medium">
            Preparando los ejercicios planificados...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-lg p-6 space-y-6 flex-1 flex flex-col mt-8">
      <h1 className="text-3xl font-black mb-4 text-center">¿Qué toca hoy?</h1>
      {rutinasActivas.length === 0 ? (
        <div className="p-6 bg-slate-800 rounded-2xl text-center text-slate-400">
          No hay rutinas activas.
        </div>
      ) : (
        <div className="space-y-4">
          {rutinasActivas.map((r: any) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              className="w-full flex items-center justify-between p-5 bg-slate-800 hover:bg-slate-700 rounded-2xl transition-all border border-slate-700 hover:border-indigo-500 group text-left"
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-4 h-12 rounded-full shadow-sm"
                  style={{ backgroundColor: r.color || "#4f46e5" }}
                />
                <div>
                  <h3 className="text-xl font-bold text-white">{r.nombre}</h3>
                  {r.descripcion && (
                    <p className="text-slate-400 text-sm mt-1">
                      {r.descripcion}
                    </p>
                  )}
                </div>
              </div>
              <Play
                className="w-6 h-6 text-slate-500 group-hover:text-indigo-400 transition-colors"
                fill="currentColor"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
