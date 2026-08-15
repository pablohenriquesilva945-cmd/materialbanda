import React, { useState, useEffect } from 'react';
import { Save, Search, UserPlus, Trash2, Edit, X, User, Phone, Mail, MapPin, Hash, BadgeCheck } from 'lucide-react';
import { Militar, POSTOS_GRADUACOES, HIERARQUIA_PESOS } from './types';
import { useDebounce } from './useDebounce';

const MilitaryArea: React.FC = () => {
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [selectedMilitarForView, setSelectedMilitarForView] = useState<Militar | null>(null);
  const [formData, setFormData] = useState({
    nome: '',
    saram: '',
    posto: '',
    email: '',
    telefone: '',
    endereco: ''
  });
  const [filter, setFilter] = useState('');
  const debouncedFilter = useDebounce(filter, 300);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMilitares = () => {
    fetch('/api/militares', { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } })
      .then(res => res.json())
      .then(data => setMilitares(data));
  };

  useEffect(() => {
    fetchMilitares();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.saram || !formData.posto) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingId ? `/api/militares/${editingId}` : '/api/militares';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        setFormData({ nome: '', saram: '', posto: '', email: '', telefone: '', endereco: '' });
        setEditingId(null);
        fetchMilitares();
      } else {
        setError(data.error || 'Erro ao salvar militar');
      }
    } catch (err) {
      console.error(err);
      setError('Erro de conexão com o servidor');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (m: Militar) => {
    setFormData({
      nome: m.nome,
      saram: m.saram,
      posto: m.posto,
      email: m.email || '',
      telefone: m.telefone || '',
      endereco: m.endereco || ''
    });
    setEditingId(m.id);
    setSelectedMilitarForView(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este militar? Esta ação não pode ser desfeita.')) return;

    try {
      const res = await fetch(`/api/militares/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchMilitares();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao excluir militar');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão com o servidor');
    }
  };

  const filteredMilitares = militares.filter(m =>
    m.nome.toLowerCase().includes(debouncedFilter.toLowerCase()) ||
    m.saram.includes(debouncedFilter) ||
    m.posto.toLowerCase().includes(debouncedFilter.toLowerCase())
  ).sort((a, b) => {
    const pesoA = HIERARQUIA_PESOS[a.posto] || 99;
    const pesoB = HIERARQUIA_PESOS[b.posto] || 99;
    if (pesoA !== pesoB) {
      return pesoA - pesoB;
    }
    return a.nome.localeCompare(b.nome);
  });

  return (
    <div className="space-y-6">
      {/* Details Modal */}
      {selectedMilitarForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-md rounded-xl shadow-xl overflow-hidden flex flex-col border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <User className="w-4 h-4 text-[#003366]" />
                Ficha do Militar
              </h3>
              <button
                onClick={() => setSelectedMilitarForView(null)}
                className="p-1 hover:bg-slate-200 rounded-md transition-colors cursor-pointer"
                title="Fechar"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="flex items-center gap-3.5 p-3.5 bg-slate-50 rounded-lg border border-slate-200">
                <div className="w-12 h-12 rounded-lg bg-[#003366] flex items-center justify-center text-white font-bold text-sm shadow-2xs">
                  {selectedMilitarForView.posto.slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900 leading-tight">{selectedMilitarForView.nome}</h4>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="bg-[#003366] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase">
                      {selectedMilitarForView.posto}
                    </span>
                    <span className="text-xs font-mono font-medium text-slate-600">
                      SARAM: {selectedMilitarForView.saram}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2.5 text-xs">
                <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">E-mail</p>
                    <p className="font-medium text-slate-700">{selectedMilitarForView.email || 'Não informado'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <Phone className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Telefone</p>
                    <p className="font-medium text-slate-700">{selectedMilitarForView.telefone || 'Não informado'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Endereço</p>
                    <p className="font-medium text-slate-700">{selectedMilitarForView.endereco || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2.5">
              <button
                onClick={() => handleEdit(selectedMilitarForView)}
                className="px-4 py-2 rounded-lg font-bold border border-slate-300 text-slate-700 hover:bg-slate-100 transition-all flex items-center gap-1.5 text-xs cursor-pointer"
              >
                <Edit className="w-3.5 h-3.5" />
                Editar Dados
              </button>
              <button
                onClick={() => setSelectedMilitarForView(null)}
                className="px-5 py-2 rounded-lg font-bold bg-[#003366] text-white hover:bg-[#002244] transition-all text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#003366]" />
            <h3 className="font-bold text-slate-800 text-sm">
              {editingId ? 'Editar Militar' : 'Cadastrar Novo Militar'}
            </h3>
          </div>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ nome: '', saram: '', posto: '', email: '', telefone: '', endereco: '' });
              }}
              className="text-xs font-bold text-red-600 hover:text-red-800 uppercase px-2.5 py-1 rounded bg-red-50 border border-red-200 cursor-pointer"
            >
              Cancelar Edição
            </button>
          )}
        </div>
        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Nome Completo</label>
              <input
                type="text"
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm py-2.5 px-3.5 outline-none font-medium"
                placeholder="Ex: João da Silva Santos"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">SARAM (Nº Militar)</label>
              <input
                type="text"
                value={formData.saram}
                onChange={e => setFormData({ ...formData, saram: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm py-2.5 px-3.5 outline-none font-mono font-medium"
                placeholder="Ex: 7654321"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Posto / Graduação</label>
              <select
                value={formData.posto}
                onChange={e => setFormData({ ...formData, posto: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm py-2.5 px-3.5 outline-none font-medium cursor-pointer"
                required
              >
                <option value="">Selecione o posto...</option>
                {POSTOS_GRADUACOES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm py-2.5 px-3.5 outline-none font-medium"
                placeholder="email@fab.mil.br"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Telefone</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm py-2.5 px-3.5 outline-none font-medium"
                placeholder="(99) 99999-9999"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">Endereço Residencial</label>
              <input
                type="text"
                value={formData.endereco}
                onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm py-2.5 px-3.5 outline-none font-medium"
                placeholder="Rua, Número, Bairro, Cidade - UF"
              />
            </div>
            <div className="md:col-span-3 flex flex-col items-end gap-2 pt-1">
              {error && (
                <p className="text-red-600 text-xs font-bold animate-in fade-in">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#003366] hover:bg-[#002244] disabled:bg-slate-400 text-white font-semibold py-2.5 px-6 rounded-lg shadow-xs transition-all flex items-center gap-2 text-sm cursor-pointer"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{isSubmitting ? 'Salvando...' : (editingId ? 'Atualizar Dados' : 'Salvar Militar')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-800 text-sm">
              Efetivo Cadastrado
            </h3>
            <p className="text-xs text-slate-500 font-medium">Militares ordenados por hierarquia ({filteredMilitares.length})</p>
          </div>
          <div className="relative w-full sm:w-[320px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Buscar por nome, SARAM ou posto..."
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] outline-none transition-all font-medium"
            />
          </div>
        </div>
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th className="px-5 py-3">Posto / Graduação</th>
                <th className="px-5 py-3">Nome Completo</th>
                <th className="px-5 py-3">SARAM</th>
                <th className="px-5 py-3">E-mail</th>
                <th className="px-5 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMilitares.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="bg-blue-50 text-[#003366] border border-blue-200/80 px-2.5 py-0.5 rounded-md text-xs font-bold uppercase">
                      {m.posto}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{m.nome}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-slate-600 font-medium">{m.saram}</td>
                  <td className="px-5 py-3.5 text-sm text-slate-600">{m.email || '-'}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-center items-center gap-1.5">
                      <button
                        onClick={() => setSelectedMilitarForView(m)}
                        className="p-1.5 text-slate-500 hover:text-[#003366] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Ver Ficha"
                      >
                        <User className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(m)}
                        className="p-1.5 text-slate-500 hover:text-[#003366] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Editar Militar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Excluir Militar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMilitares.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-slate-400 text-sm font-medium">Nenhum militar encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredMilitares.map(m => (
            <div key={m.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div className="flex flex-col gap-1">
                  <span className="bg-blue-50 text-[#003366] border border-blue-200 self-start px-2 py-0.5 rounded text-[10px] font-bold uppercase">{m.posto}</span>
                  <p className="text-sm font-bold text-slate-900">{m.nome}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedMilitarForView(m)}
                    className="p-1.5 text-slate-600 bg-slate-100 rounded-md"
                  >
                    <User className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(m)}
                    className="p-1.5 text-slate-600 bg-slate-100 rounded-md"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 text-red-600 bg-red-50 rounded-md"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">SARAM</p>
                  <p className="text-slate-800 font-semibold font-mono">{m.saram}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">E-mail</p>
                  <p className="text-slate-800 font-semibold truncate">{m.email || '-'}</p>
                </div>
              </div>
            </div>
          ))}
          {filteredMilitares.length === 0 && (
            <p className="px-5 py-6 text-center text-slate-400 text-sm font-medium">Nenhum militar encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MilitaryArea;
