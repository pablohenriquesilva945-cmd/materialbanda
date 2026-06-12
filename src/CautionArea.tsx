import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Handshake, Search, CheckCircle, FileText, Download, History, X, QrCode, Trash2 } from 'lucide-react';
import { Cautela, Militar, Material, EstadoMaterial, CautelaItem as ICautelaItem } from './types';
import { cn } from './utils';
import { format } from 'date-fns';
import { downloadTermoCautela, downloadTermoBaixa, previewTermoCautela, previewTermoBaixa } from './pdfService';
import PdfPreviewModal from './PdfPreviewModal';
import QrScanner from './QrScanner';
import SignatureModal from './SignatureModal';
import { useDebounce } from './useDebounce';
import { useAuth } from './AuthContext';

const MaterialItem = React.memo(({ m, isSelected, onToggle }: { m: Material, isSelected: boolean, onToggle: (id: number) => void }) => (
  <button
    type="button"
    onClick={() => onToggle(m.id)}
    className={cn(
      "w-full text-left px-4 py-2.5 cursor-pointer flex items-center justify-between group transition-all border-l-4",
      isSelected
        ? "bg-emerald-50 border-emerald-500 shadow-sm"
        : "hover:bg-slate-50 border-transparent"
    )}
  >
    <div className="flex flex-col">
      <span className={cn(
        "text-[13px] font-bold transition-colors",
        isSelected ? "text-emerald-800" : "text-slate-700"
      )}>{m.nome}</span>
      <span className="text-[9px] text-slate-400 uppercase font-medium">BMP: {m.bmp}</span>
    </div>
    <div className={cn(
      "w-5 h-5 rounded border flex items-center justify-center transition-all",
      isSelected
        ? "bg-emerald-500 border-emerald-600 text-white"
        : "bg-white border-slate-300"
    )}>
      {isSelected && <CheckCircle className="w-3 h-3" />}
    </div>
  </button>
));

const CautelaRow = React.memo(({ c, listTab, onPreview, onBaixa, onDelete }: {
  c: Cautela,
  listTab: 'Ativa' | 'Finalizada',
  onPreview: (c: Cautela) => void,
  onBaixa: (c: Cautela) => void,
  onDelete: (id: number) => void
}) => (
  <tr className="hover:bg-slate-50/50 transition-colors">
    <td className="px-6 py-4">
      <div className="flex flex-col">
        <span className="text-sm font-bold">{c.militar_nome}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase">{c.militar_posto}</span>
          <span className={cn(
            "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
            c.tipo === 'Temporária' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
          )}>
            {c.tipo}
          </span>
        </div>
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex flex-wrap gap-1 max-w-[200px]">
        {c.itens.map(item => (
          <span key={item.id} className="bg-slate-100 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
            {item.nome}
          </span>
        ))}
      </div>
    </td>
    <td className="px-6 py-4">
      <div className="flex flex-col">
        <span className="text-sm font-medium">
          {format(new Date(listTab === 'Ativa' ? c.data_cautela : (c.data_baixa || c.data_cautela)), 'dd/MM/yyyy')}
        </span>
        <span className="text-[10px] text-slate-400">
          {format(new Date(listTab === 'Ativa' ? c.data_cautela : (c.data_baixa || c.data_cautela)), 'HH:mm')}
        </span>
      </div>
    </td>
    <td className="px-6 py-4 text-right space-x-2">
      <button
        onClick={() => onPreview(c)}
        className="p-2 text-slate-400 hover:text-primary transition-colors"
        title="Visualizar Termo"
      >
        <Search className="w-4 h-4" />
      </button>
      <button
        onClick={async () => {
          if (c.status === 'Ativa') {
            await downloadTermoCautela(c);
          } else {
            await downloadTermoBaixa(c);
          }
        }}
        className="p-2 text-slate-400 hover:text-primary transition-colors"
        title="Baixar Termo"
      >
        <Download className="w-4 h-4" />
      </button>
      {listTab === 'Ativa' && (
        <button
          onClick={() => onBaixa(c)}
          className="bg-white border border-primary text-primary hover:bg-primary hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
        >
          Dar Baixa
        </button>
      )}
      {listTab === 'Finalizada' && (
        <div className="flex items-center justify-end gap-2">
          <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded">Finalizada</span>
          <button
            onClick={() => onDelete(c.id)}
            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
            title="Excluir Registro"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </td>
  </tr>
));

const CautelaMobileCard = React.memo(({ c, listTab, onPreview, onBaixa, onDelete }: {
  c: Cautela,
  listTab: 'Ativa' | 'Finalizada',
  onPreview: (c: Cautela) => void,
  onBaixa: (c: Cautela) => void,
  onDelete: (id: number) => void
}) => (
  <div className="p-4 space-y-3">
    <div className="flex justify-between items-start">
      <div className="flex flex-col">
        <span className="text-sm font-bold">{c.militar_nome}</span>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 uppercase">{c.militar_posto}</span>
          <span className={cn(
            "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter",
            c.tipo === 'Temporária' ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
          )}>
            {c.tipo}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-end text-right">
        <span className="text-sm font-medium">
          {format(new Date(listTab === 'Ativa' ? c.data_cautela : (c.data_baixa || c.data_cautela)), 'dd/MM/yyyy')}
        </span>
        <span className="text-[10px] text-slate-400">
          {format(new Date(listTab === 'Ativa' ? c.data_cautela : (c.data_baixa || c.data_cautela)), 'HH:mm')}
        </span>
      </div>
    </div>
    <div>
      <p className="text-xs font-bold text-slate-500 uppercase mb-1">Itens</p>
      <div className="flex flex-wrap gap-1">
        {c.itens.map(item => (
          <span key={item.id} className="bg-slate-100 text-[10px] font-medium px-2 py-0.5 rounded border border-slate-200">
            {item.nome}
          </span>
        ))}
      </div>
    </div>
    <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
      <button
        onClick={() => onPreview(c)}
        className="p-2 text-slate-400 hover:text-primary transition-colors"
        title="Visualizar Termo"
      >
        <Search className="w-4 h-4" />
      </button>
      <button
        onClick={async () => {
          if (c.status === 'Ativa') {
            await downloadTermoCautela(c);
          } else {
            await downloadTermoBaixa(c);
          }
        }}
        className="p-2 text-slate-400 hover:text-primary transition-colors"
        title="Baixar Termo"
      >
        <Download className="w-4 h-4" />
      </button>
      {listTab === 'Ativa' && (
        <button
          onClick={() => onBaixa(c)}
          className="bg-white border border-primary text-primary hover:bg-primary hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
        >
          Dar Baixa
        </button>
      )}
      {listTab === 'Finalizada' && (
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-emerald-600 uppercase bg-emerald-50 px-2 py-1 rounded">Finalizada</span>
          <button
            onClick={() => onDelete(c.id)}
            className="p-2 text-slate-300 hover:text-red-500 transition-colors"
            title="Excluir Registro"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  </div>
));

const CautionArea: React.FC = () => {
  const { user } = useAuth();
  const [cautelas, setCautelas] = useState<Cautela[]>([]);
  const [militares, setMilitares] = useState<Militar[]>([]);
  const [materiais, setMateriais] = useState<Material[]>([]);

  const [selectedMilitar, setSelectedMilitar] = useState<string>('');
  const [selectedMateriais, setSelectedMateriais] = useState<number[]>([]);
  const [observacoes, setObservacoes] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [lastCautelaId, setLastCautelaId] = useState<number | null>(null);

  const [militarSearch, setMilitarSearch] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [recordSearch, setRecordSearch] = useState('');

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [currentCautelaForPreview, setCurrentCautelaForPreview] = useState<Cautela | null>(null);
  const [listTab, setListTab] = useState<'Ativa' | 'Finalizada'>('Ativa');
  const [isScanning, setIsScanning] = useState(false);
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [pendingBaixa, setPendingBaixa] = useState<{ cautela: Cautela, materialIds: number[] } | null>(null);
  const [partialBaixaCautela, setPartialBaixaCautela] = useState<Cautela | null>(null);
  const [selectedBaixaItems, setSelectedBaixaItems] = useState<number[]>([]);

  // Debounced search states
  const debouncedMilitarSearch = useDebounce(militarSearch, 300);
  const debouncedMaterialSearch = useDebounce(materialSearch, 300);
  const debouncedRecordSearch = useDebounce(recordSearch, 300);

  const fetchData = async () => {
    const opts = { headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' } };
    const [cRes, mRes, matRes] = await Promise.all([
      fetch('/api/cautelas', opts),
      fetch('/api/militares', opts),
      fetch('/api/materiais', opts)
    ]);
    setCautelas(await cRes.json());
    setMilitares(await mRes.json());
    setMateriais(await matRes.json());
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleConfirmCautela = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMilitar || selectedMateriais.length === 0) return;
    setIsSignatureModalOpen(true);
  };

  const onSignatureConfirm = async (militarSig: string, encarregadoSig: string) => {
    if (pendingBaixa) {
      await finalizeBaixa(pendingBaixa, militarSig, encarregadoSig);
    } else {
      await finalizeCautela(militarSig, encarregadoSig);
    }
    setIsSignatureModalOpen(false);
    setPendingBaixa(null);
  };

  const finalizeCautela = async (assinatura_militar: string, assinatura_encarregado: string) => {
    const res = await fetch('/api/cautelas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        militar_id: parseInt(selectedMilitar),
        material_ids: selectedMateriais,
        observacoes,
        tipo: 'Permanente',
        assinatura_militar,
        assinatura_encarregado,
        conferente: user?.nome_conferente || ''
      })
    });

    if (res.ok) {
      const data = await res.json();
      setLastCautelaId(data.id);
      setShowSuccess(true);
      setSelectedMilitar('');
      setSelectedMateriais([]);
      setObservacoes('');
      fetchData();
    }
  };

  const handleDeleteCautela = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este registro do histórico?')) return;

    const res = await fetch(`/api/cautelas/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      fetchData();
    } else {
      const data = await res.json();
      alert(data.error || 'Erro ao excluir cautela');
    }
  };

  const handleBaixaInit = (cautela: Cautela) => {
    if (cautela.itens.length > 1) {
      setPartialBaixaCautela(cautela);
      setSelectedBaixaItems(cautela.itens.map(i => i.material_id));
    } else {
      handleBaixa({ cautela, materialIds: cautela.itens.map(i => i.material_id) });
    }
  };

  const handleBaixa = async (pending: { cautela: Cautela, materialIds: number[] }) => {
    setPendingBaixa(pending);
    setIsSignatureModalOpen(true);
  };

  const finalizeBaixa = async (pending: { cautela: Cautela, materialIds: number[] }, assinatura_militar: string, assinatura_encarregado: string) => {
    const itens_estados = pending.cautela.itens
      .filter(item => pending.materialIds.includes(item.material_id))
      .map(item => ({
        material_id: item.material_id,
        novo_estado: item.estado_na_cautela
      }));

    if (itens_estados.length === 0) return;

    const res = await fetch(`/api/cautelas/${pending.cautela.id}/baixa`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itens_estados,
        assinatura_militar,
        assinatura_encarregado
      })
    });

    if (res.ok) {
      fetchData();
    }
  };

  const handlePreview = async (cautela: Cautela) => {
    if (cautela.status === 'Ativa') {
      const url = await previewTermoCautela(cautela);
      setPreviewUrl(url.toString());
      setPreviewTitle(`Visualização: Termo de Cautela - ${cautela.militar_nome}`);
    } else {
      const url = await previewTermoBaixa(cautela);
      setPreviewUrl(url.toString());
      setPreviewTitle(`Visualização: Termo de Devolução - ${cautela.militar_nome}`);
    }
    setCurrentCautelaForPreview(cautela);
  };

  const toggleMaterial = useCallback((id: number) => {
    setSelectedMateriais(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  }, []);

  const filteredMilitares = useMemo(() => {
    const search = debouncedMilitarSearch.toLowerCase();
    return militares.filter(m =>
      m.nome.toLowerCase().includes(search) ||
      m.saram.includes(search) ||
      m.posto.toLowerCase().includes(search)
    );
  }, [militares, debouncedMilitarSearch]);

  const filteredMateriaisDisponiveis = useMemo(() => {
    const search = debouncedMaterialSearch.toLowerCase();
    return materiais.filter(m =>
      (m.status === 'Disponível' && !m.cautelado_por) && (
        m.nome.toLowerCase().includes(search) ||
        m.bmp.includes(search) ||
        (m.marca && m.marca.toLowerCase().includes(search))
      )
    ).slice(0, 50); // Limit rendered items for performance
  }, [materiais, debouncedMaterialSearch]);

  const filteredCautelas = useMemo(() => {
    const search = debouncedRecordSearch.toLowerCase();
    return cautelas.filter(c =>
      c.tipo === 'Permanente' &&
      c.status === listTab && (
        c.militar_nome.toLowerCase().includes(search) ||
        c.militar_saram.includes(search) ||
        c.itens.some(item => item.nome.toLowerCase().includes(search) || item.bmp.includes(search))
      )
    );
  }, [cautelas, listTab, debouncedRecordSearch]);

  const handleScanSuccess = (decodedText: string) => {
    try {
      const { id } = JSON.parse(decodedText);
      const material = materiais.find(m => m.id === id && m.status === 'Disponível' && !m.cautelado_por);
      if (material && !selectedMateriais.includes(id)) {
        toggleMaterial(id);
      }
    } catch (error) {
      console.error("Erro ao processar QR code:", error);
    }
    setIsScanning(false);
  };

  return (
    <div className="space-y-8">
      {isScanning && <QrScanner onScanSuccess={handleScanSuccess} onClose={() => setIsScanning(false)} />}
      <SignatureModal
        isOpen={isSignatureModalOpen}
        onClose={() => {
          setIsSignatureModalOpen(false);
          setPendingBaixa(null);
        }}
        onConfirm={onSignatureConfirm}
        militarNome={pendingBaixa ? pendingBaixa.cautela.militar_nome : (militares.find(m => m.id === parseInt(selectedMilitar))?.nome || '')}
      />

      {partialBaixaCautela && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Selecionar Itens para Baixa</h3>
            <p className="text-sm text-slate-600 mb-4 leading-relaxed">
              Quais itens o militar está devolvendo? Os itens <strong className="text-primary font-bold">não marcados</strong> continuarão em uma nova cautela ativa.
            </p>
            <div className="space-y-2 max-h-[40vh] overflow-y-auto mb-6 pr-2">
              {partialBaixaCautela.itens.map(item => (
                <label key={item.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer transition-colors">
                  <input
                    type="checkbox"
                    checked={selectedBaixaItems.includes(item.material_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedBaixaItems([...selectedBaixaItems, item.material_id]);
                      } else {
                        setSelectedBaixaItems(selectedBaixaItems.filter(id => id !== item.material_id));
                      }
                    }}
                    className="w-5 h-5 text-primary rounded border-slate-300 focus:ring-primary accent-primary cursor-pointer"
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-800">{item.nome}</span>
                    <span className="text-[10px] text-slate-500 font-mono">BMP: {item.bmp}</span>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setPartialBaixaCautela(null);
                  setSelectedBaixaItems([]);
                }}
                className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (selectedBaixaItems.length === 0) {
                    alert('Selecione pelo menos um item para dar baixa.');
                    return;
                  }
                  handleBaixa({ cautela: partialBaixaCautela, materialIds: selectedBaixaItems });
                  setPartialBaixaCautela(null);
                }}
                disabled={selectedBaixaItems.length === 0}
                className="bg-primary text-white font-bold px-6 py-2 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100 transition-all flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                Prosseguir
              </button>
            </div>
          </div>
        </div>
      )}

      {previewUrl && (
        <PdfPreviewModal
          url={previewUrl}
          title={previewTitle}
          onClose={() => {
            setPreviewUrl(null);
            setCurrentCautelaForPreview(null);
          }}
          onDownload={async () => {
            if (currentCautelaForPreview) {
              if (currentCautelaForPreview.status === 'Ativa') {
                await downloadTermoCautela(currentCautelaForPreview);
              } else {
                await downloadTermoBaixa(currentCautelaForPreview);
              }
            }
          }}
        />
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form */}
        <section className="lg:col-span-5 space-y-4">
          <div className="flex items-center gap-2 mb-2 px-1">
            <Handshake className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold">Nova Cautela</h3>
          </div>
          <div className="bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
            <form onSubmit={handleConfirmCautela} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700 ml-1">Militar Responsável</label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={militarSearch}
                    onChange={e => setMilitarSearch(e.target.value)}
                    placeholder="Filtrar militares..."
                    className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none transition-all"
                  />
                  {militarSearch && (
                    <button
                      type="button"
                      onClick={() => setMilitarSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <select
                  value={selectedMilitar}
                  onChange={e => setSelectedMilitar(e.target.value)}
                  className={cn(
                    "w-full bg-slate-50/50 border rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm py-2.5 px-4 outline-none appearance-none truncate",
                    selectedMilitar ? "border-primary ring-2 ring-primary/5 font-bold text-primary" : "border-slate-300 text-slate-500"
                  )}
                  required
                >
                  <option value="">Selecione o militar...</option>
                  {filteredMilitares.map(m => (
                    <option key={m.id} value={m.id}>{m.nome} ({m.posto})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-sm font-bold text-slate-700">Materiais Disponíveis</label>
                  {selectedMateriais.length > 0 && (
                    <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                      {selectedMateriais.length}
                    </span>
                  )}
                </div>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={materialSearch}
                    onChange={e => setMaterialSearch(e.target.value)}
                    placeholder="Filtrar ou escanear..."
                    className="w-full pl-10 pr-20 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setIsScanning(true)}
                    className="absolute right-10 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary p-1 bg-slate-100 rounded-md"
                    title="Escanear QR Code"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                  {materialSearch && (
                    <button
                      type="button"
                      onClick={() => setMaterialSearch('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-52 overflow-y-auto divide-y divide-slate-100 bg-slate-50/30">
                  {filteredMateriaisDisponiveis.map(m => (
                    <MaterialItem
                      key={m.id}
                      m={m}
                      isSelected={selectedMateriais.includes(m.id)}
                      onToggle={toggleMaterial}
                    />
                  ))}
                  {filteredMateriaisDisponiveis.length === 0 && (
                    <div className="p-4 text-center text-slate-400 text-xs italic">Nenhum material.</div>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-bold text-slate-700 ml-1">Observações</label>
                <textarea
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  className="w-full bg-slate-50/50 border border-slate-300 rounded-xl focus:bg-white focus:ring-4 focus:ring-primary/5 focus:border-primary transition-all text-sm py-2.5 px-4 outline-none resize-none"
                  placeholder="Ex: Missão externa, ensaio, etc."
                  rows={2}
                />
              </div>

              <button
                type="submit"
                disabled={!selectedMilitar || selectedMateriais.length === 0}
                className="w-full bg-primary hover:opacity-90 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-primary/10 transition-all text-sm"
              >
                <CheckCircle className="w-5 h-5" />
                Confirmar Cautela
              </button>
            </form>
          </div>
        </section>

        {/* List Section */}
        <section className="lg:col-span-7 space-y-4">
          <div className="flex flex-col gap-4 mb-2">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar pb-1">
              <button
                onClick={() => setListTab('Ativa')}
                className={cn(
                  "flex items-center gap-2 pb-2 border-b-2 transition-all whitespace-nowrap",
                  listTab === 'Ativa' ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                <History className="w-5 h-5" />
                <h3 className="text-lg font-bold">Ativas</h3>
              </button>
              <button
                onClick={() => setListTab('Finalizada')}
                className={cn(
                  "flex items-center gap-2 pb-2 border-b-2 transition-all whitespace-nowrap",
                  listTab === 'Finalizada' ? "border-primary text-primary" : "border-transparent text-slate-400 hover:text-slate-600"
                )}
              >
                <CheckCircle className="w-5 h-5" />
                <h3 className="text-lg font-bold">Histórico</h3>
              </button>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={recordSearch}
                  onChange={e => setRecordSearch(e.target.value)}
                  placeholder="Buscar registros..."
                  className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-primary/20 outline-none transition-all w-full"
                />
              </div>
              <span className="bg-primary/5 text-primary text-[10px] font-black px-3 py-1.5 rounded-lg border border-primary/10 text-center uppercase whitespace-nowrap">
                {filteredCautelas.length} registros
              </span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Desktop Table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Militar</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Itens</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                      {listTab === 'Ativa' ? 'Data Cautela' : 'Data Baixa'}
                    </th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCautelas.map(c => (
                    <CautelaRow
                      key={c.id}
                      c={c}
                      listTab={listTab}
                      onPreview={handlePreview}
                      onBaixa={handleBaixaInit}
                      onDelete={handleDeleteCautela}
                    />
                  ))}
                  {cautelas.filter(c => c.status === listTab).length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-sm italic">
                        {listTab === 'Ativa' ? 'Nenhuma cautela ativa.' : 'Nenhuma cautela finalizada no histórico.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="divide-y divide-slate-100 md:hidden">
              {filteredCautelas.map(c => (
                <CautelaMobileCard
                  key={c.id}
                  c={c}
                  listTab={listTab}
                  onPreview={handlePreview}
                  onBaixa={handleBaixaInit}
                  onDelete={handleDeleteCautela}
                />
              ))}
              {cautelas.filter(c => c.status === listTab).length === 0 && (
                <div className="px-6 py-8 text-center text-slate-400 text-sm italic">
                  {listTab === 'Ativa' ? 'Nenhuma cautela ativa.' : 'Nenhuma cautela finalizada no histórico.'}
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Success Feedback */}
      {showSuccess && (
        <div className="bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl p-4 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10" />
            </div>
            <div className="text-center md:text-left">
              <h4 className="text-lg sm:text-xl font-bold text-emerald-900 leading-tight">Cautela Registrada!</h4>
              <p className="text-xs sm:text-sm text-emerald-700 mt-1">O registro foi salvo com sucesso.</p>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <button
              onClick={() => {
                const c = cautelas.find(c => c.id === lastCautelaId);
                if (c) handlePreview(c);
              }}
              className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 hover:scale-[1.02] transition-all text-sm"
            >
              <Search className="w-4 h-4" />
              Ver Termo
            </button>
            <button
              onClick={async () => {
                const c = cautelas.find(c => c.id === lastCautelaId);
                if (c) await downloadTermoCautela(c);
              }}
              className="flex items-center justify-center gap-2 bg-primary text-white px-5 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all text-sm"
            >
              <FileText className="w-4 h-4" />
              Baixar Termo
            </button>
            <button
              onClick={() => setShowSuccess(false)}
              className="flex items-center justify-center gap-2 bg-white border border-slate-200 px-5 py-3 rounded-xl font-bold hover:bg-slate-50 transition-colors text-sm"
            >
              <X className="w-4 h-4" />
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CautionArea;
