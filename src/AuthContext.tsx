import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  errorMsg: string | null;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const login = async (password: string) => {
    // Login remains for legacy/compatibility but always returns true if needed
    setIsAuthenticated(true);
    return true;
  };

  const logout = () => {
    // Logout disabled to keep user always authenticated as requested
    console.log('Logout desativado');
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
