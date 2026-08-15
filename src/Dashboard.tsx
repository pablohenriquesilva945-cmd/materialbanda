import React, { useState, useEffect } from 'react';
import { Users, Music, Handshake, Wrench, ChevronRight, AlertTriangle, ArrowUpRight, PlusCircle, Clock } from 'lucide-react';

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
    fetch(`/api/stats?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Erro ao carregar estatísticas:", err));
  }, []);

  const cards = [
    {
      id: 'militar',
      label: 'Efetivo Cadastrado',
      count: stats.militares,
      unit: 'militares',
      icon: Users,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      iconBg: 'bg-blue-600 text-white'
    },
    {
      id: 'instrumento',
      label: 'Acervo Total',
      count: stats.materiais,
      unit: 'itens',
      icon: Music,
      color: 'bg-slate-50 text-slate-700 border-slate-200',
      iconBg: 'bg-[#003366] text-white'
    },
    {
      id: 'cautela',
      label: 'Cautelas Ativas',
      count: stats.cautelasAtivas,
      unit: 'cautelas',
      icon: Handshake,
      color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      iconBg: 'bg-emerald-600 text-white'
    },
    {
      id: 'instrumento',
      label: 'Em Manutenção',
      count: stats.emManutencao,
      unit: 'em reparo',
      icon: Wrench,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      iconBg: 'bg-amber-600 text-white'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Alerta de Devolução Atrasada */}
      {stats.atrasados > 0 && (
        <button
          onClick={() => onNavigate('temporaria')}
          className="w-full bg-red-50 border border-red-200 p-4 rounded-xl flex items-center justify-between group hover:bg-red-100/80 transition-all text-left cursor-pointer"
        >
          <div className="flex items-center gap-3.5">
            <div className="bg-red-600 p-2.5 rounded-lg text-white shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-red-900 font-bold text-sm">Material com Prazo Excedido</h4>
              <p className="text-red-700 text-xs mt-0.5">
                Existem <strong>{stats.atrasados}</strong> cautela(s) temporária(s) com a data de devolução vencida.
              </p>
            </div>
          </div>
          <div className="flex items-center text-red-700 font-bold text-xs group-hover:translate-x-1 transition-transform">
            <span>Conferir</span>
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </div>
        </button>
      )}

      {/* Grid de Métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {cards.map((card) => (
          <button
            key={card.label}
            onClick={() => onNavigate(card.id)}
            className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs hover:border-slate-300 hover:shadow-xs transition-all text-left flex flex-col justify-between group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{card.label}</span>
              <div className={`p-2 rounded-lg ${card.iconBg} shadow-2xs`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold text-slate-900">{card.count}</span>
              <span className="text-xs text-slate-400 font-medium">{card.unit}</span>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 group-hover:text-[#003366] transition-colors">
              <span>Acessar área</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </div>
          </button>
        ))}
      </div>

      {/* Atalhos Operacionais e Orientação */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-2xs space-y-3">
          <h3 className="text-base font-bold text-slate-900">Ações Rápidas de Cautela</h3>
          <p className="text-xs text-slate-500">
            Inicie rapidamente uma nova retirada de instrumento ou registre a baixa de material com assinatura.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => onNavigate('cautela')}
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#003366] text-white">
                  <Handshake className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Cautela Permanente</p>
                  <p className="text-xs text-slate-500">Instrumentos fixos do militar</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => onNavigate('temporaria')}
              className="flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl transition-all text-left cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-600 text-white">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Retirada Temporária</p>
                  <p className="text-xs text-slate-500">Empréstimos com prazo de retorno</p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-2xs flex flex-col justify-between space-y-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Controle Interno</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Sistema homologado para o gerenciamento de patrimônio e carga de instrumentos da Banda de Música da EEAR.
            </p>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-600 font-medium">
            <span className="font-bold text-slate-800 block mb-0.5">Dica Operacional:</span>
            Materiais em manutenção podem ser cautelados normalmente e exibem aviso para o recebedor.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
