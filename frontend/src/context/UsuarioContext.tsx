import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

export interface DatosUsuario {
  altura: string;
  sexo: string;
  nacimiento: string;
}

interface UsuarioContextType {
  datosUsuario: DatosUsuario;
  actualizarDatos: (nuevosDatos: Partial<DatosUsuario>) => Promise<void>;
  isLoading: boolean;
}

export const UsuarioContext = createContext<UsuarioContextType | undefined>(undefined);

export const UsuarioProvider = ({ children }: { children: React.ReactNode }) => {
  const [datosUsuario, setDatosUsuario] = useState<DatosUsuario>({
    altura: '',
    sexo: '',
    nacimiento: ''
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch('/api/usuario')
      .then(res => res.json())
      .then((data: Record<string, string>) => {
        setDatosUsuario({
          altura: data.altura || '',
          sexo: data.sexo || '',
          nacimiento: data.nacimiento || ''
        });
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const actualizarDatos = async (nuevosDatos: Partial<DatosUsuario>) => {
    const fusionado = { ...datosUsuario, ...nuevosDatos };
    setDatosUsuario(fusionado as DatosUsuario);
    
    // El backend espera un diccionario entero para hacer upsert
    await apiFetch('/api/usuario', {
      method: 'PUT',
      body: JSON.stringify(fusionado)
    }).catch(console.error);
  };

  return (
    <UsuarioContext.Provider value={{ datosUsuario, actualizarDatos, isLoading }}>
      {children}
    </UsuarioContext.Provider>
  );
};

export const useUsuario = () => {
  const context = useContext(UsuarioContext);
  if (!context) throw new Error("useUsuario debe usarse dentro de un UsuarioProvider");
  return context;
};

