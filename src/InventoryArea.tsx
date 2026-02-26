import React, { useState, useEffect } from 'react';
import { Save, Search, PlusCircle, Trash2, Edit, Music, Package, Box, QrCode } from 'lucide-react';
import { Material, TipoMaterial, EstadoMaterial } from './types';
import { cn } from './utils';
import QrCodeModal from './QrCodeModal';
import { useDebounce } from './useDebounce';

const InventoryArea: React.FC = () => {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<TipoMaterial>('Instrumento');
  const [formData, setFormData] = useState({
    nome: '',
    bmp: '',
    marca: '',
    estado: 'Bom' as EstadoMaterial,
    subtipo: '',
    lugar: ''
  });
  const [filter, setFilter] = useState('');
  const debouncedFilter = useDebounce(filter, 300);
  const [selectedMaterialForQr, setSelectedMaterialForQr] = useState<Material | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchMateriais = () => {
    fetch('/api/materiais', { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } })
      .then(res => res.json())
      .then(data => setMateriais(data));
  };

  useEffect(() => {
    fetchMateriais();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.bmp) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingId ? `/api/materiais/${editingId}` : '/api/materiais';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, tipo: activeSubTab })
      });

      const data = await res.json();

      if (res.ok) {
        setFormData({ nome: '', bmp: '', marca: '', estado: 'Bom', subtipo: '', lugar: '' });
        setEditingId(null);
        fetchMateriais();
        if (!editingId) {
          setSelectedMaterialForQr(data);
        }
      } else {
        setError(data.error || 'Erro ao salvar material');
      }
    } catch (err: any) {
      console.error(err);
      setError(`Erro de rede/parse: ${err.message || 'Desconhecido'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (m: Material) => {
    setFormData({
      nome: m.nome,
      bmp: m.bmp,
      marca: m.marca || '',
      estado: m.estado,
      subtipo: m.subtipo || '',
      lugar: m.lugar || ''
    });
    setEditingId(m.id);
    setActiveSubTab(m.tipo);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este item?')) return;

    try {
      const res = await fetch(`/api/materiais/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (res.ok) {
        fetchMateriais();
      } else {
        alert(data.error || 'Erro ao excluir material');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão com o servidor');
    }
  };

  const filteredMateriais = materiais.filter(m =>
    m.tipo === activeSubTab && (
      m.nome.toLowerCase().includes(debouncedFilter.toLowerCase()) ||
      m.bmp.includes(debouncedFilter) ||
      (m.marca && m.marca.toLowerCase().includes(debouncedFilter.toLowerCase())) ||
      (m.cautelado_por && m.cautelado_por.toLowerCase().includes(debouncedFilter.toLowerCase()))
    )
  );

  const subTabs = [
    { id: 'Instrumento', label: 'Instrumentos', icon: Music },
    { id: 'Acessório', label: 'Acessórios', icon: Package },
    { id: 'Outros', label: 'Outros', icon: Box },
  ];

  return (
    <div className="space-y-8">
      <QrCodeModal material={selectedMaterialForQr} onClose={() => setSelectedMaterialForQr(null)} />
      {/* Sub-tabs */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-8 overflow-x-auto no-scrollbar scroll-smooth snap-x">
        {subTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveSubTab(tab.id as TipoMaterial);
              setFilter('');
            }}
            className={cn(
              "pb-4 text-sm font-bold flex items-center gap-2 transition-all relative whitespace-nowrap snap-start",
              activeSubTab === tab.id
                ? "text-primary border-b-2 border-primary"
                : "text-slate-400 hover:text-slate-600"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-primary" />
            <h3 className="font-bold text-slate-800">{editingId ? 'Editar' : 'Cadastrar'} {activeSubTab}</h3>
          </div>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ nome: '', bmp: '', marca: '', estado: 'Bom', subtipo: '', lugar: '' });
              }}
              className="text-xs font-bold text-red-500 hover:text-red-700 uppercase"
            >
              Cancelar Edição
            </button>
          )}
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">Nome do Item</label>
              <input
                type="text"
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm py-2.5 px-4 outline-none"
                placeholder={`Ex: ${activeSubTab === 'Instrumento' ? 'Saxofone Alto' : activeSubTab === 'Acessório' ? 'Bocal 7C' : 'Estante'}`}
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">BMP (Patrimônio)</label>
              <input
                type="text"
                value={formData.bmp}
                onChange={e => setFormData({ ...formData, bmp: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm py-2.5 px-4 outline-none"
                placeholder="Ex: 123456"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">Marca/Modelo</label>
              <input
                type="text"
                value={formData.marca}
                onChange={e => setFormData({ ...formData, marca: e.target.value })}
                className="w-full bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm py-2.5 px-4 outline-none"
                placeholder="Ex: Yamaha"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">Estado</label>
              <select
                value={formData.estado}
                onChange={e => setFormData({ ...formData, estado: e.target.value as EstadoMaterial })}
                className="w-full bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm py-2.5 px-4 outline-none appearance-none"
              >
                <option value="Bom">Bom</option>
                <option value="Manutenção">Manutenção</option>
                <option value="Descarte">Descarte</option>
              </select>
            </div>
            {activeSubTab === 'Outros' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">Lugar (Armazenamento)</label>
                <input
                  type="text"
                  value={formData.lugar}
                  onChange={e => setFormData({ ...formData, lugar: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm py-2.5 px-4 outline-none"
                  placeholder="Ex: Armário A, Prateleira 2"
                />
              </div>
            )}
            {activeSubTab === 'Acessório' && (
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1 ml-1">Tipo de Acessório</label>
                <select
                  value={formData.subtipo}
                  onChange={e => setFormData({ ...formData, subtipo: e.target.value })}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm py-2.5 px-4 outline-none appearance-none"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Duradouro">Duradouro</option>
                  <option value="Consumo">Consumo</option>
                </select>
              </div>
            )}
            <div className="md:col-span-4 flex flex-col items-end gap-2 pt-2">
              {error && (
                <p className="text-red-500 text-sm font-bold animate-in fade-in slide-in-from-top-1">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#003366] hover:bg-[#002244] disabled:bg-slate-400 text-white font-bold py-2.5 px-8 rounded-lg shadow-md transition-all flex items-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSubmitting ? 'Salvando...' : (editingId ? 'Atualizar Dados' : `Cadastrar ${activeSubTab}`)}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            Lista de {activeSubTab}s
          </h3>
          <div className="relative w-full sm:w-[320px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="pl-10 w-full border-slate-300 rounded-full text-sm focus:ring-primary focus:border-primary truncate"
              placeholder="Buscar por nome, BMP ou marca/modelo..."
            />
          </div>
        </div>
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">Nome</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">BMP</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">Marca/Modelo</th>
                {activeSubTab === 'Outros' && <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">Lugar</th>}
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">Estado</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b">Cautelado Por</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider border-b text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMateriais.map(m => (
                <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-slate-900">{m.nome}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{m.bmp}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{m.marca || '-'}</td>
                  {activeSubTab === 'Outros' && <td className="px-6 py-4 text-sm text-slate-600">{m.lugar || '-'}</td>}
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                      m.estado === 'Bom' ? "bg-green-100 text-green-700" :
                        m.estado === 'Manutenção' ? "bg-amber-100 text-amber-700" :
                          "bg-red-100 text-red-700"
                    )}>
                      {m.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase",
                      m.status === 'Disponível' ? "bg-blue-100 text-blue-700" :
                        m.status === 'Cautelado' ? "bg-orange-100 text-orange-700" :
                          "bg-slate-100 text-slate-700"
                    )}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600">
                    {m.cautelado_por || '-'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(m)} className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setSelectedMaterialForQr(m)} className="p-1.5 text-slate-400 hover:text-primary transition-colors">
                        <QrCode className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMateriais.length === 0 && (
                <tr>
                  <td colSpan={activeSubTab === 'Outros' ? 7 : 6} className="px-6 py-8 text-center text-slate-400 text-sm">Nenhum item encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredMateriais.map(m => (
            <div key={m.id} className="p-4 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-slate-900">{m.nome}</p>
                  <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wider">{m.marca || 'Sem marca/modelo'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(m)} className="p-2 text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-lg">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(m.id)}
                    className="p-2 text-slate-400 hover:text-red-600 transition-colors bg-slate-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setSelectedMaterialForQr(m)} className="p-2 text-slate-400 hover:text-primary transition-colors bg-slate-50 rounded-lg">
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-slate-500 font-bold uppercase text-[9px] mb-0.5">BMP</p>
                  <p className="text-slate-800 font-semibold">{m.bmp}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-slate-500 font-bold uppercase text-[9px] mb-0.5">Estado</p>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase inline-block",
                    m.estado === 'Bom' ? "bg-green-100 text-green-700" :
                      m.estado === 'Manutenção' ? "bg-amber-100 text-amber-700" :
                        "bg-red-100 text-red-700"
                  )}>{m.estado}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-slate-500 font-bold uppercase text-[9px] mb-0.5">Status</p>
                  <span className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-bold uppercase inline-block",
                    m.status === 'Disponível' ? "bg-blue-100 text-blue-700" :
                      m.status === 'Cautelado' ? "bg-orange-100 text-orange-700" :
                        "bg-slate-100 text-slate-700"
                  )}>{m.status}</span>
                </div>
              </div>
              {m.status === 'Cautelado' && m.cautelado_por && (
                <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-slate-500 font-bold uppercase text-[9px] mb-0.5">Cautelado Por</p>
                  <p className="text-slate-800 font-semibold">{m.cautelado_por}</p>
                </div>
              )}
              {activeSubTab === 'Outros' && m.lugar && (
                <div className="text-xs bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-slate-500 font-bold uppercase text-[9px] mb-0.5">Lugar</p>
                  <p className="text-slate-800 font-semibold">{m.lugar}</p>
                </div>
              )}
            </div>
          ))}
          {filteredMateriais.length === 0 && (
            <p className="px-6 py-8 text-center text-slate-400 text-sm">Nenhum item encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryArea;
