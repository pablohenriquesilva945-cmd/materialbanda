import React, { createContext, useContext, useState, useEffect } from 'react';

export interface User {
  username: string;
  nome_conferente: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  errorMsg: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('auth_cautela') === 'true';
  });
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user_cautela');
    return saved ? JSON.parse(saved) : null;
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const login = async (username: string, password: string) => {
    setErrorMsg(null);
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAuthenticated(true);
        setUser(data.user);
        localStorage.setItem('auth_cautela', 'true');
        localStorage.setItem('user_cautela', JSON.stringify(data.user));
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
    setUser(null);
    localStorage.removeItem('auth_cautela');
    localStorage.removeItem('user_cautela');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, errorMsg, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
