import React, { useState } from 'react';
import { LayoutDashboard, Users, Music, Handshake, LogOut, Menu, X, Clock, PenTool } from 'lucide-react';
import { useAuth } from './AuthContext';
import { cn } from './utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'militar', label: 'Militar', icon: Users },
    { id: 'instrumento', label: 'Instrumento', icon: Music },
    { id: 'cautela', label: 'Cautela / Baixa', icon: Handshake },
    { id: 'temporaria', label: 'Cautela Temporária', icon: Clock },
    { id: 'configuracoes', label: 'Configurações', icon: PenTool },
  ];

  const navContent = (
    <div className="flex flex-col justify-between h-full w-full bg-[#003366]">
      <div className="w-full">
        <div className="p-6 flex items-center gap-3 border-b border-white/10">
          <div className="bg-white p-1 rounded-lg">
            <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ1ZUzrUgFeQJFrms5rRiTosk25nzGlNsBwyg&s" alt="Logo" className="w-8 h-8 object-contain" />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight uppercase tracking-wider">Sistema de Acervo</h1>
            <p className="text-[10px] text-white/60 uppercase">Banda de Música EEAR</p>
          </div>
        </div>

        <nav className="mt-6 flex-1 px-4 space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                setIsMenuOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all",
                activeTab === item.id
                  ? "bg-white/20 text-white shadow-sm"
                  : "text-white/70 hover:bg-white/10 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      </div>

      <div className="p-4 border-t border-white/10">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 text-white/70 hover:bg-red-500/20 hover:text-red-300 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Sair do Sistema</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar for large screens */}
      <aside className="hidden lg:block w-64 bg-[#003366] text-white flex-col shrink-0 shadow-xl">
        {navContent}
      </aside>

      {/* Mobile Menu Overlay */}
      <div className={cn(
        "fixed inset-0 bg-black/40 z-40 lg:hidden",
        isMenuOpen ? "block" : "hidden"
      )} onClick={() => setIsMenuOpen(false)}></div>

      {/* Mobile Menu Drawer */}
      <aside className={cn(
        "fixed top-0 bottom-0 left-0 w-64 bg-[#003366] text-white flex flex-col shadow-xl z-50 transition-transform duration-300 ease-in-out",
        isMenuOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {navContent}
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-8 shrink-0">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <button className="lg:hidden text-slate-600 shrink-0" onClick={() => setIsMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h2 className="text-base sm:text-xl font-bold text-[#003366] truncate">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-900">Operador do Sistema</p>
              <p className="text-[10px] text-slate-500 uppercase">Administrador</p>
            </div>
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-slate-200 flex items-center justify-center border border-slate-300">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-slate-500" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-3 sm:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
