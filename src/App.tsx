import React, { useState } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import Layout from './Layout';
import Dashboard from './Dashboard';
import MilitaryArea from './MilitaryArea';
import InventoryArea from './InventoryArea';
import CautionArea from './CautionArea';
import TemporaryCautionArea from './TemporaryCautionArea';
import SettingsArea from './SettingsArea';
import { LogIn } from 'lucide-react';

const AppContent: React.FC = () => {
  const { isAuthenticated, login, errorMsg } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [password, setPassword] = useState('');

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
          <div className="bg-primary p-8 text-center">
            <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-white/20 shadow-xl p-2">
              <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1ZUzrUgFeQJFrms5rRiTosk25nzGlNsBwyg&s" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-white text-2xl font-bold">Sistema de Acervo</h1>
            <p className="text-white/60 text-sm uppercase tracking-widest mt-1">Banda de Música EEAR</p>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              await login(password);
              setPassword('');
            }}
            className="p-8 space-y-6"
          >
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">Acesso Restrito</label>
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                }}
                placeholder="Digite a senha de acesso"
                className="w-full px-4 py-3.5 bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary outline-none transition-all text-base"
              />
              {errorMsg && <p className="text-red-500 text-xs mt-2 font-medium ml-1">{errorMsg}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-primary hover:opacity-90 text-white font-bold py-4 rounded-xl shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 group"
            >
              <span>Entrar no Sistema</span>
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>

            <p className="text-center text-[10px] text-slate-400 uppercase tracking-widest">
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

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
