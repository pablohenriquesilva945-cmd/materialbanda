import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './Layout';
import Dashboard from './Dashboard';
import MilitaryArea from './MilitaryArea';
import InventoryArea from './InventoryArea';
import CautionArea from './CautionArea';
import TemporaryCautionArea from './TemporaryCautionArea';
import SettingsArea from './SettingsArea';
import { LogIn, ShieldAlert } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, login, errorMsg } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-[400px] bg-white rounded-xl shadow-xl overflow-hidden border border-slate-200">
          <div className="bg-[#003366] p-7 text-center">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-3.5 overflow-hidden border-2 border-white/30 shadow-md p-2">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1ZUzrUgFeQJFrms5rRiTosk25nzGlNsBwyg&s" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-white text-xl font-bold tracking-tight">SISTCAUTELA</h1>
            <p className="text-blue-100/75 text-xs uppercase tracking-wider mt-0.5 font-medium">Banda de Música EEAR</p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              setIsLoggingIn(true);
              try {
                await login(username, password);
                setPassword('');
              } finally {
                setIsLoggingIn(false);
              }
            }}
            className="p-7 space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Conferente / Identificação
              </label>
              <select
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] outline-none transition-all text-sm text-slate-800 font-medium cursor-pointer"
              >
                <option value="">Selecione um nome</option>
                <option value="arthur">1S ARTHUR</option>
                <option value="ivo">1S IVO</option>
                <option value="everton">1S EVERTON</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Senha de Acesso
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite sua senha"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] outline-none transition-all text-sm font-medium"
                required
              />
              {errorMsg && (
                <div className="mt-2 p-2.5 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-semibold flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-[#003366] hover:bg-[#002244] disabled:bg-slate-400 text-white font-semibold py-3 rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 text-sm cursor-pointer mt-1"
            >
              {isLoggingIn ? (
                <span>Verificando...</span>
              ) : (
                <>
                  <span>Entrar no Sistema</span>
                  <LogIn className="w-4 h-4" />
                </>
              )}
            </button>

            <p className="text-center text-[11px] text-slate-400 uppercase tracking-wider pt-2">
              Uso exclusivo de militares autorizados
            </p>
          </form>
        </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {activeTab === 'dashboard' && <Dashboard onNavigate={setActiveTab} />}
      {activeTab === 'militar' && <MilitaryArea />}
      {activeTab === 'instrumento' && <InventoryArea />}
      {activeTab === 'cautela' && <CautionArea />}
      {activeTab === 'temporaria' && <TemporaryCautionArea />}
      {activeTab === 'configuracoes' && <SettingsArea />}
    </Layout>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary capturou erro:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white">
          <div className="max-w-md w-full bg-slate-800 border border-slate-700 rounded-xl p-6 text-center space-y-4 shadow-xl">
            <h2 className="text-lg font-bold">Inconsistência detectada</h2>
            <p className="text-sm text-slate-300">
              Clique abaixo para atualizar o sistema com segurança.
            </p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full bg-[#003366] hover:bg-[#002244] border border-blue-500 text-white font-bold py-2.5 rounded-lg text-sm transition-all"
            >
              Recarregar Sistema
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ErrorBoundary>
  );
}
