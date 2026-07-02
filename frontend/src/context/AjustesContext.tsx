import React, { createContext, useContext, useState, useEffect } from 'react';

interface AjustesContextType {
  ajustes: Record<string, string>;
  actualizarAjuste: (clave: string, valor: string) => Promise<void>;
}

export const AjustesContext = createContext<AjustesContextType | undefined>(undefined);

export const AjustesProvider = ({ children }: { children: React.ReactNode }) => {
  const [ajustes, setAjustes] = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/ajustes')
      .then(res => res.json())
      .then(data => {
        // Aseguramos que data es un objeto Record<string, string>
        // Si tu backend devuelve un array de objetos [{clave: 'x', valor: 'y'}], 
        // tendrías que mapearlo aquí. Asumo que devuelve el objeto directo.
        setAjustes(data);
      })
      .catch(console.error);
  }, []);

  const actualizarAjuste = async (clave: string, valor: string) => {
    setAjustes(prev => ({ ...prev, [clave]: valor }));
    await fetch('/api/ajustes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clave, valor })
    }).catch(console.error);
  };

  return (
    <AjustesContext.Provider value={{ ajustes, actualizarAjuste }}>
      {children}
    </AjustesContext.Provider>
  );
};

export const useAjustes = () => {
  const context = useContext(AjustesContext);
  if (!context) throw new Error("useAjustes debe usarse dentro de un Provider");
  return context;
};