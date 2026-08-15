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
    fetch(`/api/materiais?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    })
      .then(res => res.json())
      .then(data => setMateriais(data))
      .catch(err => console.error("Erro ao buscar materiais:", err));
  };

  useEffect(() => {
    fetchMateriais();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Para Acessório, bmp não é obrigatório no formulário (será gerado)
    const isBmpRequired = activeSubTab !== 'Acessório';
    if (!formData.nome || (isBmpRequired && !formData.bmp)) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const url = editingId ? `/api/materiais/${editingId}` : '/api/materiais';
      const method = editingId ? 'PUT' : 'POST';

      const finalBmp = activeSubTab === 'Acessório'
        ? (formData.bmp || `AC-${Date.now()}`)
        : formData.bmp;

      const finalMarca = '';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ...formData, 
          bmp: finalBmp,
          marca: finalMarca,
          tipo: activeSubTab 
        })
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
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto no-scrollbar">
        {subTabs.map((tab) => {
          const count = materiais.filter(m => m.tipo === tab.id).length;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveSubTab(tab.id as TipoMaterial);
                setFilter('');
              }}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer",
                isActive
                  ? "bg-[#003366] text-white shadow-xs"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
              <span className={cn(
                "text-xs px-2 py-0.5 rounded-md font-bold",
                isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
              )}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Form */}
      <div className="bg-white rounded-xl shadow-2xs border border-slate-200 overflow-hidden">
        <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-4 h-4 text-[#003366]" />
            <h3 className="font-bold text-slate-800 text-sm">{editingId ? 'Editar' : 'Cadastrar'} {activeSubTab}</h3>
          </div>
          {editingId && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({ nome: '', bmp: '', marca: '', estado: 'Bom', subtipo: '', lugar: '' });
              }}
              className="text-xs font-bold text-red-600 hover:text-red-800 uppercase px-2.5 py-1 rounded bg-red-50 border border-red-200 cursor-pointer"
            >
              Cancelar Edição
            </button>
          )}
        </div>
        <div className="p-5 sm:p-6">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Nome do Item (com Marca/Modelo)
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={e => setFormData({ ...formData, nome: e.target.value })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm py-2.5 px-3.5 outline-none font-medium"
                placeholder={
                  activeSubTab === 'Instrumento' 
                    ? 'Ex: Saxofone Alto Yamaha YAS-23' 
                    : activeSubTab === 'Acessório' 
                      ? 'Ex: Bocal 7C Bach' 
                      : 'Ex: Estante de Partitura K&M'
                }
                required
              />
            </div>
            {activeSubTab !== 'Acessório' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  BMP (Patrimônio)
                </label>
                <input
                  type="text"
                  value={formData.bmp}
                  onChange={e => setFormData({ ...formData, bmp: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm py-2.5 px-3.5 outline-none font-medium font-mono"
                  placeholder="Ex: 123456"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Estado de Conservação
              </label>
              <select
                value={formData.estado}
                onChange={e => setFormData({ ...formData, estado: e.target.value as EstadoMaterial })}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm py-2.5 px-3.5 outline-none font-medium cursor-pointer"
              >
                <option value="Bom">Bom (Pronto para uso)</option>
                <option value="Manutenção">Manutenção (Necessita reparo)</option>
                <option value="Descarte">Descarte</option>
              </select>
            </div>
            {activeSubTab === 'Outros' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Local de Armazenamento
                </label>
                <input
                  type="text"
                  value={formData.lugar}
                  onChange={e => setFormData({ ...formData, lugar: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm py-2.5 px-3.5 outline-none font-medium"
                  placeholder="Ex: Armário A, Prateleira 2"
                />
              </div>
            )}
            {activeSubTab === 'Acessório' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Tipo de Acessório
                </label>
                <select
                  value={formData.subtipo}
                  onChange={e => setFormData({ ...formData, subtipo: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm py-2.5 px-3.5 outline-none font-medium cursor-pointer"
                  required
                >
                  <option value="">Selecione...</option>
                  <option value="Duradouro">Duradouro</option>
                  <option value="Consumo">Consumo</option>
                </select>
              </div>
            )}
            <div className="md:col-span-4 flex flex-col items-end gap-2 pt-1">
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
                <span>{isSubmitting ? 'Salvando...' : (editingId ? 'Atualizar Dados' : `Cadastrar ${activeSubTab}`)}</span>
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
              Lista de {activeSubTab}s
            </h3>
            <p className="text-xs text-slate-500 font-medium">Itens cadastrados no acervo ({filteredMateriais.length})</p>
          </div>
          <div className="relative w-full sm:w-[320px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] outline-none transition-all"
              placeholder="Buscar por nome, BMP ou militar..."
            />
          </div>
        </div>
        <div className="overflow-x-auto hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                <th className="px-5 py-3">Nome / Descrição</th>
                <th className="px-5 py-3">BMP</th>
                {activeSubTab === 'Outros' && <th className="px-5 py-3">Lugar</th>}
                <th className="px-5 py-3">Estado</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Cautelado Por</th>
                <th className="px-5 py-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMateriais.map(m => (
                <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3.5 text-sm font-semibold text-slate-900">{m.nome}</td>
                  <td className="px-5 py-3.5 text-sm font-mono text-slate-600 font-medium">{m.bmp}</td>
                  {activeSubTab === 'Outros' && <td className="px-5 py-3.5 text-sm text-slate-600">{m.lugar || '-'}</td>}
                  <td className="px-5 py-3.5">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold",
                      m.estado === 'Bom' ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        m.estado === 'Manutenção' ? "bg-amber-50 text-amber-700 border border-amber-200" :
                          "bg-red-50 text-red-700 border border-red-200"
                    )}>
                      {m.estado}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-xs font-bold",
                      m.status === 'Disponível' ? "bg-blue-50 text-blue-700 border border-blue-200" :
                        m.status === 'Cautelado' ? "bg-orange-50 text-orange-700 border border-orange-200" :
                          "bg-slate-100 text-slate-700 border border-slate-200"
                    )}>
                      {m.status}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-slate-700 font-medium">
                    {m.cautelado_por || '-'}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex justify-center items-center gap-1.5">
                      <button
                        onClick={() => handleEdit(m)}
                        className="p-1.5 text-slate-500 hover:text-[#003366] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Editar Material"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setSelectedMaterialForQr(m)}
                        className="p-1.5 text-slate-500 hover:text-[#003366] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                        title="Código QR"
                      >
                        <QrCode className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                        title="Excluir Material"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredMateriais.length === 0 && (
                <tr>
                  <td colSpan={activeSubTab === 'Outros' ? 7 : 6} className="px-5 py-8 text-center text-slate-400 text-sm font-medium">
                    Nenhum item encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="divide-y divide-slate-100 md:hidden">
          {filteredMateriais.map(m => (
            <div key={m.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-bold text-slate-900">{m.nome}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => handleEdit(m)} className="p-1.5 text-slate-600 bg-slate-100 rounded-md">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => setSelectedMaterialForQr(m)} className="p-1.5 text-slate-600 bg-slate-100 rounded-md">
                    <QrCode className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(m.id)} className="p-1.5 text-red-600 bg-red-50 rounded-md">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">BMP</p>
                  <p className="text-slate-800 font-semibold font-mono">{m.bmp}</p>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">Estado</p>
                  <span className="font-bold text-[10px]">{m.estado}</span>
                </div>
                <div className="bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">Status</p>
                  <span className="font-bold text-[10px]">{m.status}</span>
                </div>
              </div>
              {m.status === 'Cautelado' && m.cautelado_por && (
                <div className="text-xs bg-slate-50 p-2 rounded border border-slate-100">
                  <p className="text-slate-400 font-bold uppercase text-[9px] mb-0.5">Cautelado Por</p>
                  <p className="text-slate-800 font-medium">{m.cautelado_por}</p>
                </div>
              )}
            </div>
          ))}
          {filteredMateriais.length === 0 && (
            <p className="px-5 py-6 text-center text-slate-400 text-sm font-medium">Nenhum item encontrado.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryArea;
