import React, { useState } from 'react';
import { LayoutDashboard, Users, Music, Handshake, LogOut, Menu, X, Clock, PenTool, Calendar, Shield } from 'lucide-react';
import { useAuth } from './AuthContext';
import { cn } from './utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { logout, user } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Painel Geral', icon: LayoutDashboard },
    { id: 'militar', label: 'Efetivo de Militares', icon: Users },
    { id: 'instrumento', label: 'Acervo e Materiais', icon: Music },
    { id: 'cautela', label: 'Cautela Permanente', icon: Handshake },
    { id: 'temporaria', label: 'Cautela Temporária', icon: Clock },
    { id: 'configuracoes', label: 'Configurações', icon: PenTool },
  ];

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const capitalizedDate = currentDate.charAt(0).toUpperCase() + currentDate.slice(1);

  const navContent = (
    <div className="flex flex-col justify-between h-full w-full bg-[#003366]">
      <div className="w-full">
        <div className="p-5 sm:p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-white p-1.5 rounded-lg shrink-0 shadow-xs">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1ZUzrUgFeQJFrms5rRiTosk25nzGlNsBwyg&s" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white leading-tight uppercase tracking-wider truncate">SISTCAUTELA</h1>
            <p className="text-[11px] text-blue-200/80 uppercase tracking-wide truncate">Banda de Música EEAR</p>
          </div>
        </div>

        <nav className="mt-4 px-3 space-y-1.5">
          {menuItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsMenuOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg transition-all text-left font-medium text-sm cursor-pointer",
                  isActive
                    ? "bg-white/15 text-white font-semibold shadow-xs"
                    : "text-white/75 hover:bg-white/10 hover:text-white"
                )}
              >
                <item.icon className={cn("w-4 h-4 shrink-0", isActive ? "text-amber-400" : "text-white/70")} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10 space-y-2">
        <div className="px-3 py-2 bg-white/5 rounded-lg">
          <p className="text-[10px] text-blue-200 uppercase font-semibold">Conferente Ativo</p>
          <p className="text-xs font-bold text-white truncate">{user?.nome_conferente || user?.username || 'Operador'}</p>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-2.5 px-3 py-2 text-white/75 hover:bg-red-500/20 hover:text-red-200 rounded-lg transition-all text-xs font-semibold cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Encerrar Sessão</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:block w-64 bg-[#003366] text-white flex-col shrink-0 shadow-lg">
        {navContent}
      </aside>

      {/* Mobile Overlay */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMenuOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <aside className={cn(
        "fixed top-0 bottom-0 left-0 w-64 bg-[#003366] text-white flex flex-col shadow-2xl z-50 transition-transform duration-200 ease-in-out lg:hidden",
        isMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {navContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-50">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0 shadow-2xs">
          <div className="flex items-center gap-3 overflow-hidden">
            <button
              className="lg:hidden text-slate-700 hover:text-slate-900 p-1.5 rounded-md hover:bg-slate-100 cursor-pointer shrink-0"
              onClick={() => setIsMenuOpen(true)}
              aria-label="Abrir Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-bold text-[#003366] truncate">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{capitalizedDate}</span>
            </div>

            <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[180px]">
                  {user?.nome_conferente || user?.username || 'Conferente'}
                </p>
                <p className="text-[10px] text-slate-400 uppercase font-medium">Banda de Música</p>
              </div>
              <div className="w-8 h-8 rounded-lg bg-[#003366] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                <Shield className="w-4 h-4 text-amber-400" />
              </div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1500px] mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
