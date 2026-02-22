import React, { useState, useEffect } from 'react';
import { Save, Search, UserPlus, Trash2, Edit, X, User, Phone, Mail, MapPin, Hash, BadgeCheck } from 'lucide-react';
import { Militar, POSTOS_GRADUACOES } from './types';

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
    m.nome.toLowerCase().includes(filter.toLowerCase()) ||
    m.saram.includes(filter) ||
    m.posto.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Details Modal */}
      {selectedMilitarForView && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                Dados do Militar
              </h3>
              <button
                onClick={() => setSelectedMilitarForView(null)}
                className="p-2 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              <div className="flex items-center gap-4 p-4 bg-primary/5 rounded-2xl border border-primary/10">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <User className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-xl font-bold text-slate-900">{selectedMilitarForView.nome}</h4>
                  <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded uppercase">
                    {selectedMilitarForView.posto}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Hash className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SARAM</p>
                    <p className="text-sm font-bold text-slate-700">{selectedMilitarForView.saram}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">E-mail</p>
                    <p className="text-sm font-bold text-slate-700">{selectedMilitarForView.email || 'Não informado'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Telefone</p>
                    <p className="text-sm font-bold text-slate-700">{selectedMilitarForView.telefone || 'Não informado'}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 hover:bg-slate-50 rounded-xl transition-colors group">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Endereço</p>
                    <p className="text-sm font-bold text-slate-700">{selectedMilitarForView.endereco || 'Não informado'}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
              <button
                onClick={() => handleEdit(selectedMilitarForView)}
                className="px-6 py-2.5 rounded-xl font-bold border border-primary text-primary hover:bg-primary/5 transition-all flex items-center gap-2"
              >
                <Edit className="w-4 h-4" />
                Editar Dados
              </button>
              <button
                onClick={() => setSelectedMilitarForView(null)}
                className="px-8 py-2.5 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-slate-800">
              {editingId ? 'Editar Militar' : 'Cadastrar Novo Militar'}
            </h3>
          </div>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ nome: '', saram: '', posto: '', email: '', telefone: '', endereco: '' });
              }}
              className="text-xs font-bold text-red-500 hover:text-red-700 uppercase"
            >
              Cancelar Edição
            </button>
          )}
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">Nome Completo</label>
              <input
                type="text"
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm py-2.5 px-4 outline-none"
                placeholder="Ex: João da Silva Santos"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">SARAM</label>
              <input
                type="text"
                value={formData.saram}
                onChange={e => setFormData({ ...formData, saram: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm py-2.5 px-4 outline-none"
                placeholder="Ex: 7654321"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">Posto e Graduação</label>
              <select
                value={formData.posto}
                onChange={e => setFormData({ ...formData, posto: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm py-2.5 px-4 outline-none appearance-none"
                required
              >
                <option value="">Selecione...</option>
                {POSTOS_GRADUACOES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm py-2.5 px-4 outline-none"
                placeholder="email@fab.mil.br"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">Telefone</label>
              <input
                type="text"
                value={formData.telefone}
                onChange={e => setFormData({ ...formData, telefone: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm py-2.5 px-4 outline-none"
                placeholder="(99) 99999-9999"
              />
            </div>
            <div className="md:col-span-3">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">Endereço</label>
              <input
                type="text"
                value={formData.endereco}
                onChange={e => setFormData({ ...formData, endereco: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm py-2.5 px-4 outline-none"
                placeholder="Rua, Número, Bairro, Cidade"
              />
            </div>
            <div className="md:col-span-3 flex flex-col items-end gap-2 pt-2">
              {error && (
                <p className="text-red-500 text-sm font-bold animate-in fade-in slide-in-from-top-1">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:opacity-90 disabled:bg-slate-400 text-white font-bold py-2.5 px-8 rounded-lg shadow-md transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSubmitting ? 'Salvando...' : (editingId ? 'Atualizar Dados' : 'Salvar Militar')}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Lista de Militares Cadastrados
          </h3>
          <div className="relative max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="pl-10 w-full border-slate-300 rounded-full text-sm focus:ring-primary focus:border-primary"
              placeholder="Buscar por nome, SARAM ou posto..."
            />
          </div>
        </div>
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">Posto/Grad</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">Nome Completo</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">SARAM</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMilitares.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <span className="bg-primary/10 text-primary px-2.5 py-1 rounded text-[10px] font-bold uppercase">{m.posto}</span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{m.nome}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{m.saram}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{m.email || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() => setSelectedMilitarForView(m)}
                        className="p-1.5 text-slate-400 hover:text-primary transition-colors"
                        title="Ver Detalhes"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
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
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-sm">Nenhum militar encontrado.</td>
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
                  <span className="bg-primary/10 text-primary self-start px-2 py-0.5 rounded text-[10px] font-bold uppercase">{m.posto}</span>
                  <p className="text-sm font-bold text-slate-900">{m.nome}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSelectedMilitarForView(m)}
                    className="p-2 text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-slate-500 font-bold uppercase text-[9px] mb-0.5">SARAM</p>
                  <p className="text-slate-800 font-semibold">{m.saram}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-slate-500 font-bold uppercase text-[9px] mb-0.5">E-mail</p>
                  <p className="text-slate-800 font-semibold truncate">{m.email || '-'}</p>
                </div>
              </div>
            </div>
          ))}
          {filteredMilitares.length === 0 && (
            <p className="px-6 py-8 text-center text-slate-400 text-sm italic">Nenhum militar encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MilitaryArea;
