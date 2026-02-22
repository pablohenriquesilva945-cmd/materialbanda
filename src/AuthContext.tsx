import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  errorMsg: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('auth_cautela') === 'true';
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const login = async (password: string) => {
    setErrorMsg(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        localStorage.setItem('auth_cautela', 'true');
        return true;
      }
      const msg = data.error || 'Senha incorreta';
      setErrorMsg(msg);
      console.warn('Login falhou:', msg);
      return false;
    } catch (e) {
      const msg = 'Erro de conexão no login. Verifique se o servidor está rodando e se as variáveis de ambiente no Vercel estão configuradas.';
      setErrorMsg(msg);
      console.error(msg, e);
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('auth_cautela');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, errorMsg, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
