import React, { useState, useEffect } from 'react';
import { Users, Music, Handshake, Wrench, ChevronRight } from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    militares: 0,
    materiais: 0,
    cautelasAtivas: 0,
    emManutencao: 0,
    atrasados: 0
  });

  useEffect(() => {
    fetch('/api/stats')
      .then(res => res.json())
      .then(data => setStats(data));
  }, []);

  const cards = [
    { id: 'militar', label: 'Militar', count: stats.militares, icon: Users, color: 'bg-blue-500' },
    { id: 'instrumento', label: 'Instrumento', count: stats.materiais, icon: Music, color: 'bg-emerald-500' },
    { id: 'cautela', label: 'Cautela / Baixa', count: stats.cautelasAtivas, icon: Handshake, color: 'bg-orange-500' },
    { id: 'instrumento', label: 'Em Manutenção', count: stats.emManutencao, icon: Wrench, color: 'bg-red-500' },
  ];

  return (
    <div className="space-y-8">
      {stats.atrasados > 0 && (
        <button
          onClick={() => onNavigate('temporaria')}
          className="w-full bg-red-50 border-2 border-red-200 p-4 rounded-xl flex items-center justify-between group hover:bg-red-100 transition-all animate-pulse"
        >
          <div className="flex items-center gap-4">
            <div className="bg-red-500 p-2 rounded-lg text-white">
              <Wrench className="w-5 h-5" />
            </div>
            <div className="text-left">
              <h4 className="text-red-900 font-bold">Atenção: Material com Prazo Excedido</h4>
              <p className="text-red-700 text-sm">Existem {stats.atrasados} cautelas temporárias com a data de devolução vencida.</p>
            </div>
          </div>
          <div className="flex items-center text-red-600 font-bold text-sm">
            Ver agora <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </button>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={() => onNavigate(card.id)}
            className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all text-left flex flex-col group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.color} text-white group-hover:scale-110 transition-transform`}>
                <card.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-slate-900">{card.count}</span>
            </div>
            <div className="mt-4 flex items-center text-xs font-medium text-slate-400 group-hover:text-primary transition-colors">
              Ver detalhes <ChevronRight className="w-3 h-3 ml-1" />
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8">
        <h3 className="text-lg font-bold text-slate-900 mb-4">Bem-vindo ao Sistema de Cautela</h3>
        <p className="text-slate-600 leading-relaxed">
          Este sistema foi desenvolvido para o controle interno e restrito de materiais da Banda de Música da Aeronáutica.
          Utilize o menu lateral para navegar entre as áreas de cadastro de militares, instrumentos e gestão de cautelas.
        </p>
      </div>
    </div>
  );
};

export default Dashboard;
