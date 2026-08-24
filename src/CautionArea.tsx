import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Handshake, Search, CheckCircle, FileText, Download, History, X, QrCode, Trash2, Plus } from 'lucide-react';
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
      "w-full text-left px-3.5 py-2.5 cursor-pointer flex items-center justify-between group transition-all border-l-3",
      isSelected
        ? "bg-blue-50/80 border-[#003366]"
        : "hover:bg-slate-50 border-transparent"
    )}
  >
    <div className="flex flex-col pr-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className={cn(
          "text-xs font-semibold transition-colors",
          isSelected ? "text-[#003366]" : "text-slate-800"
        )}>{m.nome}</span>
        {m.estado === 'Manutenção' && (
          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-50 text-amber-700 border border-amber-200">
            Manutenção
          </span>
        )}
      </div>
      <span className="text-[10px] text-slate-500 font-mono">BMP: {m.bmp}</span>
    </div>
    <div className={cn(
      "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
      isSelected
        ? "bg-[#003366] border-[#003366] text-white"
        : "bg-white border-slate-300"
    )}>
      {isSelected && <CheckCircle className="w-3 h-3" />}
    </div>
  </button>
));

const CautelaRow = React.memo(({ c, listTab, onPreview, onBaixa, onAdicionarItem, onDelete }: {
  c: Cautela,
  listTab: 'Ativa' | 'Finalizada',
  onPreview: (c: Cautela) => void,
  onBaixa: (c: Cautela) => void,
  onAdicionarItem: (c: Cautela) => void,
  onDelete: (id: number) => void
}) => (
  <tr className="hover:bg-slate-50/80 transition-colors">
    <td className="px-5 py-3.5">
      <div className="flex flex-col">
        <span className="text-sm font-semibold text-slate-900">{c.militar_nome}</span>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[11px] text-slate-500 font-medium">{c.militar_posto}</span>
          <span className="text-[10px] text-slate-400 font-mono">SARAM: {c.militar_saram}</span>
        </div>
      </div>
    </td>
    <td className="px-5 py-3.5">
      <div className="flex flex-wrap gap-1 max-w-[240px]">
        {c.itens.map(item => (
          <span key={item.id} className="bg-slate-100 text-slate-700 text-[11px] font-medium px-2 py-0.5 rounded border border-slate-200">
            {item.nome}
          </span>
        ))}
      </div>
    </td>
    <td className="px-5 py-3.5">
      <div className="flex flex-col">
        <span className="text-xs font-semibold text-slate-800">
          {format(new Date(listTab === 'Ativa' ? c.data_cautela : (c.data_baixa || c.data_cautela)), 'dd/MM/yyyy')}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          {format(new Date(listTab === 'Ativa' ? c.data_cautela : (c.data_baixa || c.data_cautela)), 'HH:mm')}
        </span>
      </div>
    </td>
    <td className="px-5 py-3.5 text-right">
      <div className="flex items-center justify-end gap-1.5">
        <button
          onClick={() => onPreview(c)}
          className="p-1.5 text-slate-500 hover:text-[#003366] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
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
          className="p-1.5 text-slate-500 hover:text-[#003366] hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          title="Baixar Termo PDF"
        >
          <Download className="w-4 h-4" />
        </button>
        {listTab === 'Ativa' && (
          <>
            <button
              onClick={() => onAdicionarItem(c)}
              className="bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 px-2.5 py-1 rounded-md text-xs font-semibold transition-all inline-flex items-center gap-1 cursor-pointer"
              title="Adicionar Item"
            >
              <Plus className="w-3 h-3" />
              <span>Adicionar</span>
            </button>
            <button
              onClick={() => onBaixa(c)}
              className="bg-[#003366] hover:bg-[#002244] text-white px-3 py-1 rounded-md text-xs font-semibold shadow-2xs transition-all cursor-pointer"
            >
              Dar Baixa
            </button>
          </>
        )}
        {listTab === 'Finalizada' && (
          <>
            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">Finalizada</span>
            <button
              onClick={() => onDelete(c.id)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
              title="Excluir Registro"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </>
        )}
      </div>
    </td>
  </tr>
));

const CautelaMobileCard = React.memo(({ c, listTab, onPreview, onBaixa, onAdicionarItem, onDelete }: {
  c: Cautela,
  listTab: 'Ativa' | 'Finalizada',
  onPreview: (c: Cautela) => void,
  onBaixa: (c: Cautela) => void,
  onAdicionarItem: (c: Cautela) => void,
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
        <div className="flex gap-2">
          <button
            onClick={() => onAdicionarItem(c)}
            className="bg-white border border-emerald-500 text-emerald-600 hover:bg-emerald-500 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar
          </button>
          <button
            onClick={() => onBaixa(c)}
            className="bg-white border border-primary text-primary hover:bg-primary hover:text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all"
          >
            Dar Baixa
          </button>
        </div>
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

  // Estados para adição de item
  const [cautelaParaAdicionarItem, setCautelaParaAdicionarItem] = useState<Cautela | null>(null);
  const [materialSelecionadoParaAdicao, setMaterialSelecionadoParaAdicao] = useState<number | null>(null);
  const [pendingAdicaoItem, setPendingAdicaoItem] = useState<{ cautela: Cautela, materialId: number } | null>(null);

  // Debounced search states
  const debouncedMilitarSearch = useDebounce(militarSearch, 300);
  const debouncedMaterialSearch = useDebounce(materialSearch, 300);
  const debouncedRecordSearch = useDebounce(recordSearch, 300);

  const fetchData = async () => {
    try {
      const timestamp = Date.now();
      const opts: RequestInit = {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      };
      const [cRes, mRes, matRes] = await Promise.all([
        fetch(`/api/cautelas?_t=${timestamp}`, opts),
        fetch(`/api/militares?_t=${timestamp}`, opts),
        fetch(`/api/materiais?_t=${timestamp}`, opts)
      ]);
      if (cRes.ok) setCautelas(await cRes.json());
      if (mRes.ok) setMilitares(await mRes.json());
      if (matRes.ok) setMateriais(await matRes.json());
    } catch (err) {
      console.error("Erro ao carregar dados:", err);
    }
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
    if (pendingAdicaoItem) {
      await finalizeAdicaoItem(pendingAdicaoItem, militarSig, encarregadoSig);
    } else if (pendingBaixa) {
      await finalizeBaixa(pendingBaixa, militarSig, encarregadoSig);
    } else {
      await finalizeCautela(militarSig, encarregadoSig);
    }
    setIsSignatureModalOpen(false);
    setPendingBaixa(null);
    setPendingAdicaoItem(null);
  };

  const finalizeAdicaoItem = async (pending: { cautela: Cautela, materialId: number }, assinatura_militar: string, assinatura_encarregado: string) => {
    const res = await fetch(`/api/cautelas/${pending.cautela.id}/adicionar-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        material_id: pending.materialId,
        assinatura_militar,
        assinatura_encarregado,
        conferente: user?.nome_conferente || ''
      })
    });

    if (res.ok) {
      setMaterialSelecionadoParaAdicao(null);
      setCautelaParaAdicionarItem(null);
      setMaterialSearch('');
      await fetchData();
    } else {
      const data = await res.json();
      alert(data.error || 'Erro ao adicionar item à cautela');
    }
  };

  const finalizeCautela = async (assinatura_militar: string, assinatura_encarregado: string) => {
    try {
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
        setRecordSearch(''); // Limpa a busca para exibir a nova cautela imediatamente
        setListTab('Ativa');  // Garante que está na aba Cautelas Ativas

        // Atualiza imediatamente o estado com a nova cautela
        if (data.cautela) {
          setCautelas(prev => [data.cautela, ...prev.filter(c => c.id !== data.id)]);
        }

        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao cadastrar cautela');
      }
    } catch (err) {
      console.error("Erro ao finalizar cautela:", err);
      alert('Erro de conexão ao realizar cautela');
    }
  };

  const handleDeleteCautela = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este registro do histórico?')) return;

    const res = await fetch(`/api/cautelas/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      setCautelas(prev => prev.filter(c => c.id !== id));
      await fetchData();
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
    try {
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
          assinatura_encarregado,
          conferente: user?.nome_conferente || ''
        })
      });

      if (res.ok) {
        const data = await res.json();
        const devolucaoCautela = data.cautela;

        setRecordSearch('');
        setListTab('Finalizada');

        if (devolucaoCautela) {
          setCautelas(prev => [devolucaoCautela, ...prev.filter(c => c.id !== devolucaoCautela.id)]);
          const url = await previewTermoBaixa(devolucaoCautela);
          setPreviewUrl(url.toString());
          setPreviewTitle(`Visualização: Termo de Devolução - ${devolucaoCautela.militar_nome}`);
          setCurrentCautelaForPreview(devolucaoCautela);
        }

        await fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Erro ao processar baixa');
      }
    } catch (err) {
      console.error("Erro ao processar baixa:", err);
      alert('Erro de conexão ao processar baixa.');
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

  const handleSignatureModalPreview = async () => {
    if (pendingAdicaoItem) {
      const m = materiais.find(item => item.id === pendingAdicaoItem.materialId)!;
      const tempCautela: Cautela = {
        ...pendingAdicaoItem.cautela,
        itens: [
          ...pendingAdicaoItem.cautela.itens,
          {
            id: m.id,
            cautela_id: pendingAdicaoItem.cautela.id,
            material_id: m.id,
            nome: m.nome,
            bmp: m.bmp,
            marca: m.marca,
            estado: m.estado,
            estado_na_cautela: m.estado,
            tipo: m.tipo,
            status: m.status,
            created_at: m.created_at
          }
        ],
        conferente: user?.nome_conferente || ''
      };
      const url = await previewTermoCautela(tempCautela);
      setPreviewUrl(url.toString());
      setPreviewTitle(`Prévia do Termo de Cautela (Adição) - ${pendingAdicaoItem.cautela.militar_nome}`);
    } else if (pendingBaixa) {
      const tempCautela: Cautela = {
        ...pendingBaixa.cautela,
        itens: pendingBaixa.cautela.itens.filter(item => pendingBaixa.materialIds.includes(item.material_id)),
        conferente: user?.nome_conferente || ''
      };
      const url = await previewTermoBaixa(tempCautela);
      setPreviewUrl(url.toString());
      setPreviewTitle(`Prévia do Termo de Devolução - ${pendingBaixa.cautela.militar_nome}`);
    } else {
      const militar = militares.find(m => m.id === parseInt(selectedMilitar));
      if (!militar) return;
      const tempCautela: Cautela = {
        id: 0,
        militar_id: militar.id,
        militar_nome: militar.nome,
        militar_saram: militar.saram,
        militar_posto: militar.posto,
        data_cautela: new Date().toISOString(),
        status: 'Ativa',
        tipo: 'Permanente',
        observacoes,
        itens: selectedMateriais.map(id => {
          const m = materiais.find(item => item.id === id)!;
          return {
            id: m.id,
            cautela_id: 0,
            material_id: m.id,
            nome: m.nome,
            bmp: m.bmp,
            marca: m.marca,
            estado: m.estado,
            estado_na_cautela: m.estado,
            tipo: m.tipo,
            status: m.status,
            created_at: m.created_at
          };
        }),
        conferente: user?.nome_conferente || ''
      };
      const url = await previewTermoCautela(tempCautela);
      setPreviewUrl(url.toString());
      setPreviewTitle(`Prévia do Termo de Cautela - ${militar.nome}`);
    }
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
        (c.militar_nome || '').toLowerCase().includes(search) ||
        (c.militar_saram || '').includes(search) ||
        (c.itens || []).some(item => (item.nome || '').toLowerCase().includes(search) || (item.bmp || '').includes(search))
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
          setPendingAdicaoItem(null);
        }}
        onConfirm={onSignatureConfirm}
        militarNome={
          pendingAdicaoItem
            ? pendingAdicaoItem.cautela.militar_nome
            : (pendingBaixa ? pendingBaixa.cautela.militar_nome : (militares.find(m => m.id === parseInt(selectedMilitar))?.nome || ''))
        }
        itens={
          pendingAdicaoItem
            ? [(() => {
                const m = materiais.find(item => item.id === pendingAdicaoItem.materialId);
                return { nome: m?.nome || '', bmp: m?.bmp || '', marca: m?.marca };
              })()]
            : (pendingBaixa
                ? pendingBaixa.cautela.itens
                    .filter(item => pendingBaixa.materialIds.includes(item.material_id))
                    .map(item => ({ nome: item.nome, bmp: item.bmp, marca: item.marca }))
                : selectedMateriais.map(id => {
                    const m = materiais.find(item => item.id === id);
                    return { nome: m?.nome || '', bmp: m?.bmp || '', marca: m?.marca };
                  }))
        }
        onPreviewPdf={handleSignatureModalPreview}
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

      {cautelaParaAdicionarItem && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-2">Adicionar Item à Cautela</h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Selecione um material disponível para associar à cautela de <strong>{cautelaParaAdicionarItem.militar_nome}</strong>.
            </p>

            {/* Buscador de Material */}
            <div className="space-y-3 mb-6">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={materialSearch}
                  onChange={e => setMaterialSearch(e.target.value)}
                  placeholder="Buscar material disponível..."
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white outline-none transition-all"
                />
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

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-[200px] overflow-y-auto bg-slate-50">
                {filteredMateriaisDisponiveis.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-400">Nenhum material disponível encontrado</div>
                ) : (
                  filteredMateriaisDisponiveis.map(m => {
                    const isSelected = materialSelecionadoParaAdicao === m.id;
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => setMaterialSelecionadoParaAdicao(m.id)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 cursor-pointer flex items-center justify-between transition-all border-l-4",
                          isSelected ? "bg-emerald-50 border-emerald-500 shadow-sm" : "hover:bg-slate-50 border-transparent"
                        )}
                      >
                        <div className="flex flex-col">
                          <span className={cn("text-xs font-bold", isSelected ? "text-emerald-800" : "text-slate-700")}>{m.nome}</span>
                          <span className="text-[9px] text-slate-400 uppercase">BMP: {m.bmp}</span>
                        </div>
                        {isSelected && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setCautelaParaAdicionarItem(null);
                  setMaterialSelecionadoParaAdicao(null);
                  setMaterialSearch('');
                }}
                className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!materialSelecionadoParaAdicao) return;
                  setPendingAdicaoItem({ cautela: cautelaParaAdicionarItem, materialId: materialSelecionadoParaAdicao });
                  setCautelaParaAdicionarItem(null);
                  setIsSignatureModalOpen(true);
                }}
                disabled={!materialSelecionadoParaAdicao}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 py-2 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                Prosseguir para Assinatura
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Form */}
        <section className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Handshake className="w-4 h-4 text-[#003366]" />
                <h3 className="font-bold text-slate-800 text-sm">Nova Cautela Permanente</h3>
              </div>
            </div>
            <div className="p-5">
              <form onSubmit={handleConfirmCautela} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Militar Responsável</label>
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={militarSearch}
                      onChange={e => setMilitarSearch(e.target.value)}
                      placeholder="Filtrar militares por nome ou SARAM..."
                      className="w-full pl-8 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] outline-none transition-all font-medium"
                    />
                    {militarSearch && (
                      <button
                        type="button"
                        onClick={() => setMilitarSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <select
                    value={selectedMilitar}
                    onChange={e => setSelectedMilitar(e.target.value)}
                    className={cn(
                      "w-full bg-slate-50 border rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm py-2.5 px-3 outline-none appearance-none truncate font-medium cursor-pointer",
                      selectedMilitar ? "border-[#003366] text-[#003366] font-bold" : "border-slate-300 text-slate-600"
                    )}
                    required
                  >
                    <option value="">Selecione o militar recebedor...</option>
                    {filteredMilitares.map(m => (
                      <option key={m.id} value={m.id}>{m.posto} {m.nome} (SARAM: {m.saram})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Materiais Disponíveis</label>
                    {selectedMateriais.length > 0 && (
                      <span className="bg-[#003366] text-white text-[10px] font-bold px-2 py-0.2 rounded-full">
                        {selectedMateriais.length} selecionado(s)
                      </span>
                    )}
                  </div>
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={materialSearch}
                      onChange={e => setMaterialSearch(e.target.value)}
                      placeholder="Filtrar por nome, BMP ou escanear..."
                      className="w-full pl-8 pr-16 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] outline-none transition-all font-medium"
                    />
                    <button
                      type="button"
                      onClick={() => setIsScanning(true)}
                      className="absolute right-8 top-1/2 -translate-y-1/2 text-slate-500 hover:text-[#003366] p-1 rounded transition-colors cursor-pointer"
                      title="Escanear QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>
                    {materialSearch && (
                      <button
                        type="button"
                        onClick={() => setMaterialSearch('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 bg-white">
                    {filteredMateriaisDisponiveis.map(m => (
                      <MaterialItem
                        key={m.id}
                        m={m}
                        isSelected={selectedMateriais.includes(m.id)}
                        onToggle={toggleMaterial}
                      />
                    ))}
                    {filteredMateriaisDisponiveis.length === 0 && (
                      <div className="p-4 text-center text-slate-400 text-xs font-medium">Nenhum material disponível no filtro.</div>
                    )}
                  </div>
                  {selectedMateriais.length > 0 && (
                    <div className="space-y-2 mt-3 pt-3 border-t border-slate-200 animate-in fade-in">
                      <div className="flex justify-between items-center px-1">
                        <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Itens Selecionados ({selectedMateriais.length})</label>
                        <button
                          type="button"
                          onClick={() => setSelectedMateriais([])}
                          className="text-[10px] font-bold text-red-600 hover:text-red-800 uppercase cursor-pointer"
                        >
                          Desmarcar Todos
                        </button>
                      </div>
                      <div className="border border-slate-200 rounded-lg overflow-hidden max-h-40 overflow-y-auto divide-y divide-slate-100 bg-slate-50">
                        {selectedMateriais.map(id => {
                          const m = materiais.find(item => item.id === id);
                          if (!m) return null;
                          return (
                            <div key={m.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-100/60 transition-colors">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800">{m.nome}</span>
                                <span className="text-[10px] text-slate-500 font-mono">BMP: {m.bmp} {m.marca && `| ${m.marca}`}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => toggleMaterial(m.id)}
                                className="text-slate-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors cursor-pointer"
                                title="Remover material"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-1.5 pt-1">
                  <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Observações (Opcional)</label>
                  <textarea
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-xs py-2 px-3 outline-none resize-none font-medium"
                    placeholder="Ex: Utilização em ensaios e apresentações oficiais..."
                    rows={2}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!selectedMilitar || selectedMateriais.length === 0}
                  className="w-full bg-[#003366] hover:bg-[#002244] disabled:bg-slate-300 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2 shadow-xs transition-all text-sm cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Prosseguir com Cautela</span>
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* List Section */}
        <section className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setListTab('Ativa')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    listTab === 'Ativa'
                      ? "bg-[#003366] text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Cautelas Ativas
                </button>
                <button
                  onClick={() => setListTab('Finalizada')}
                  className={cn(
                    "px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer",
                    listTab === 'Finalizada'
                      ? "bg-[#003366] text-white shadow-2xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  )}
                >
                  Histórico de Baixas
                </button>
              </div>

              <div className="relative w-full sm:w-[220px]">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={recordSearch}
                  onChange={e => setRecordSearch(e.target.value)}
                  placeholder="Buscar militar ou material..."
                  className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] outline-none transition-all w-full font-medium"
                />
              </div>
            </div>

            {/* Desktop Table */}
            <div className="overflow-x-auto hidden md:block">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider">
                    <th className="px-5 py-3">Militar</th>
                    <th className="px-5 py-3">Itens Cautelados</th>
                    <th className="px-5 py-3">
                      {listTab === 'Ativa' ? 'Data Cautela' : 'Data Baixa'}
                    </th>
                    <th className="px-5 py-3 text-right">Ações</th>
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
                      onAdicionarItem={(cautela) => {
                        setCautelaParaAdicionarItem(cautela);
                        setMaterialSelecionadoParaAdicao(null);
                        setMaterialSearch('');
                      }}
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
                  onAdicionarItem={(cautela) => {
                    setCautelaParaAdicionarItem(cautela);
                    setMaterialSelecionadoParaAdicao(null);
                    setMaterialSearch('');
                  }}
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
