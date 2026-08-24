import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Handshake, Search, CheckCircle, FileText, Download, History, X, QrCode, Trash2, Calendar, AlertTriangle, Plus } from 'lucide-react';
import { Cautela, Militar, Material, CautelaItem as ICautelaItem } from './types';
import { cn } from './utils';
import { format, isPast, startOfDay } from 'date-fns';
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
                ? "bg-amber-50/80 border-amber-600 shadow-2xs"
                : "hover:bg-slate-50 border-transparent"
        )}
    >
        <div className="flex flex-col pr-2">
            <div className="flex items-center gap-1.5 flex-wrap">
                <span className={cn(
                    "text-xs font-semibold transition-colors",
                    isSelected ? "text-amber-900" : "text-slate-800"
                )}>{m.nome}</span>
                {m.estado === 'Manutenção' && (
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 border border-amber-300">
                        Manutenção
                    </span>
                )}
            </div>
            <span className="text-[10px] text-slate-500 font-mono">BMP: {m.bmp}</span>
        </div>
        <div className={cn(
            "w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-all",
            isSelected
                ? "bg-amber-600 border-amber-600 text-white"
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
}) => {
    const isOverdue = listTab === 'Ativa' && c.data_devolucao && (() => {
        const prazo = new Date(c.data_devolucao!.replace(' ', 'T'));
        const hoje = new Date();
        prazo.setHours(0, 0, 0, 0);
        hoje.setHours(0, 0, 0, 0);
        return prazo < hoje;
    })();

    return (
        <tr className={cn("hover:bg-slate-50/80 transition-colors", isOverdue && "bg-red-50/60 hover:bg-red-100/60 border-l-3 border-l-red-600")}>
            <td className="px-5 py-3.5">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">{c.militar_nome}</span>
                        {isOverdue && (
                            <span className="flex items-center gap-1 bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded shadow-2xs">
                                <AlertTriangle className="w-3 h-3" />
                                VENCIDA
                            </span>
                        )}
                    </div>
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
                    <div className="flex items-center gap-1 text-slate-700">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className={cn("text-xs font-semibold", isOverdue ? "text-red-700 font-bold" : "text-slate-800")}>
                            {listTab === 'Ativa' ? 'Devolução: ' : 'Devolvido: '}
                            {listTab === 'Ativa'
                                ? (c.data_devolucao ? format(new Date(c.data_devolucao.replace(' ', 'T')), 'dd/MM/yyyy') : 'Não definido')
                                : (c.data_baixa ? format(new Date(c.data_baixa.replace(' ', 'T')), 'dd/MM/yyyy HH:mm') : 'N/A')}
                        </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                        Retirada: {format(new Date(c.data_cautela), 'dd/MM/yyyy HH:mm')}
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
                                className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-md text-xs font-semibold shadow-2xs transition-all cursor-pointer"
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
    );
});
const CautelaMobileCard = React.memo(({ c, listTab, onPreview, onBaixa, onAdicionarItem, onDelete }: {
    c: Cautela,
    listTab: 'Ativa' | 'Finalizada',
    onPreview: (c: Cautela) => void,
    onBaixa: (c: Cautela) => void,
    onAdicionarItem: (c: Cautela) => void,
    onDelete: (id: number) => void
}) => {
    const isOverdue = listTab === 'Ativa' && c.data_devolucao && (() => {
        const prazo = new Date(c.data_devolucao!.replace(' ', 'T'));
        const hoje = new Date();
        // Only overdue if the deadline date is strictly before today (not same day)
        prazo.setHours(0, 0, 0, 0);
        hoje.setHours(0, 0, 0, 0);
        return prazo < hoje;
    })();

    return (
        <div className={cn("p-4 space-y-3", isOverdue && "bg-red-50/50")}>
            <div className="flex justify-between items-start">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{c.militar_nome}</span>
                        {isOverdue && (
                            <span className="flex items-center gap-1 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded shadow-sm animate-pulse ring-2 ring-red-200">
                                <AlertTriangle className="w-3 h-3" />
                                ATRASADA
                            </span>
                        )}
                    </div>
                    <span className="text-[10px] text-slate-400 uppercase">{c.militar_posto}</span>
                </div>
                <div className="flex flex-col items-end text-right">
                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded shrink-0", isOverdue ? "bg-red-600 text-white" : "text-amber-600 bg-amber-50")}>
                        {listTab === 'Ativa' ? 'Prazo: ' : 'Dev: '}
                        {listTab === 'Ativa'
                            ? (c.data_devolucao ? format(new Date(c.data_devolucao.replace(' ', 'T')), 'dd/MM/yyyy') : 'N/D')
                            : (c.data_baixa ? format(new Date(c.data_baixa.replace(' ', 'T')), 'dd/MM/yyyy') : 'N/D')}
                    </span>
                    <span className="text-[9px] text-slate-400">
                        {format(new Date(c.data_cautela), 'dd/MM/yyyy')}
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
    );
});

const TemporaryCautionArea: React.FC = () => {
    const { user } = useAuth();
    const [cautelas, setCautelas] = useState<Cautela[]>([]);
    const [militares, setMilitares] = useState<Militar[]>([]);
    const [materiais, setMateriais] = useState<Material[]>([]);

    const [selectedMilitar, setSelectedMilitar] = useState<string>('');
    const [selectedMateriais, setSelectedMateriais] = useState<number[]>([]);
    const [dataDevolucao, setDataDevolucao] = useState(format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'));
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

    const overdueCount = useMemo(() => {
        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);
        return cautelas.filter(c => {
            if (c.status !== 'Ativa' || !c.data_devolucao) return false;
            const prazo = new Date(c.data_devolucao.replace(' ', 'T'));
            prazo.setHours(0, 0, 0, 0);
            return prazo < hoje;
        }).length;
    }, [cautelas]);

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
        if (!selectedMilitar || selectedMateriais.length === 0 || !dataDevolucao) return;
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
            const body = {
                militar_id: parseInt(selectedMilitar),
                material_ids: selectedMateriais,
                observacoes,
                tipo: 'Temporária',
                data_devolucao: dataDevolucao ? new Date(`${dataDevolucao}T12:00:00Z`).toISOString() : null,
                assinatura_militar,
                assinatura_encarregado,
                conferente: user?.nome_conferente || ''
            };
            const res = await fetch('/api/cautelas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
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

                // Atualiza imediatamente o estado local com a nova cautela
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
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;
        const res = await fetch(`/api/cautelas/${id}`, { method: 'DELETE' });
        if (res.ok) {
            setCautelas(prev => prev.filter(c => c.id !== id));
            await fetchData();
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
            setPreviewTitle(`Visualização: Termo Temporário - ${cautela.militar_nome}`);
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
            setPreviewTitle(`Prévia do Termo Temporário (Adição) - ${pendingAdicaoItem.cautela.militar_nome}`);
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
                tipo: 'Temporária',
                data_devolucao: dataDevolucao ? new Date(`${dataDevolucao}T12:00:00Z`).toISOString() : undefined,
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
            setPreviewTitle(`Prévia do Termo Temporário - ${militar.nome}`);
        }
    };

    const toggleMaterial = useCallback((id: number) => {
        setSelectedMateriais(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    }, []);

    const debouncedMilitarSearch = useDebounce(militarSearch, 300);
    const debouncedMaterialSearch = useDebounce(materialSearch, 300);
    const debouncedRecordSearch = useDebounce(recordSearch, 300);

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
                m.bmp.includes(search)
            )
        ).slice(0, 50);
    }, [materiais, debouncedMaterialSearch]);

    const filteredCautelas = useMemo(() => {
        const search = debouncedRecordSearch.toLowerCase();
        return cautelas.filter(c =>
            c.tipo === 'Temporária' &&
            c.status === listTab && (
                (c.militar_nome || '').toLowerCase().includes(search) ||
                (c.militar_saram || '').includes(search) ||
                (c.itens || []).some(item => (item.nome || '').toLowerCase().includes(search) || (item.bmp || '').includes(search))
            )
        );
    }, [cautelas, listTab, debouncedRecordSearch]);

    return (
        <div className="space-y-8">
            {isScanning && <QrScanner onScanSuccess={(text) => {
                try {
                    const { id } = JSON.parse(text);
                    if (materiais.find(m => m.id === id && m.status === 'Disponível' && !m.cautelado_por) && !selectedMateriais.includes(id)) {
                        toggleMaterial(id);
                    }
                } catch { }
                setIsScanning(false);
            }} onClose={() => setIsScanning(false)} />}

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
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-6">
                        <h3 className="text-lg font-bold text-slate-800 mb-4">Itens para Devolução</h3>
                        <div className="space-y-2 mb-6 max-h-[40vh] overflow-y-auto">
                            {partialBaixaCautela.itens.map(item => (
                                <label key={item.id} className="flex items-center gap-4 p-3 rounded-lg border border-slate-200">
                                    <input
                                        type="checkbox"
                                        checked={selectedBaixaItems.includes(item.material_id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setSelectedBaixaItems([...selectedBaixaItems, item.material_id]);
                                            else setSelectedBaixaItems(selectedBaixaItems.filter(id => id !== item.material_id));
                                        }}
                                        className="w-5 h-5 accent-amber-500"
                                    />
                                    <div className="flex flex-col">
                                        <span className="text-sm font-bold">{item.nome}</span>
                                        <span className="text-[10px] text-slate-500">BMP: {item.bmp}</span>
                                    </div>
                                </label>
                            ))}
                        </div>
                        <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                            <button onClick={() => setPartialBaixaCautela(null)} className="px-4 py-2 text-slate-500 font-bold">Cancelar</button>
                            <button
                                onClick={() => {
                                    handleBaixa({ cautela: partialBaixaCautela, materialIds: selectedBaixaItems });
                                    setPartialBaixaCautela(null);
                                }}
                                className="bg-primary text-white font-bold px-6 py-2 rounded-xl"
                            >
                                Confirmar Devolução
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {previewUrl && (
                <PdfPreviewModal
                    url={previewUrl}
                    title={previewTitle}
                    onClose={() => { setPreviewUrl(null); setCurrentCautelaForPreview(null); }}
                    onDownload={async () => {
                        if (currentCautelaForPreview) {
                            if (currentCautelaForPreview.status === 'Ativa') await downloadTermoCautela(currentCautelaForPreview);
                            else await downloadTermoBaixa(currentCautelaForPreview);
                        }
                    }}
                />
            )}

            {cautelaParaAdicionarItem && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Adicionar Item à Cautela Temporária</h3>
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
                                                    isSelected ? "bg-amber-50 border-amber-500 shadow-sm" : "hover:bg-slate-50 border-transparent"
                                                )}
                                            >
                                                <div className="flex flex-col">
                                                    <span className={cn("text-xs font-bold", isSelected ? "text-amber-800" : "text-slate-700")}>{m.nome}</span>
                                                    <span className="text-[9px] text-slate-400 uppercase">BMP: {m.bmp}</span>
                                                </div>
                                                {isSelected && <CheckCircle className="w-4 h-4 text-amber-500" />}
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
                                className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-2 rounded-xl disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
                            >
                                Prosseguir para Assinatura
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <section className="lg:col-span-5 space-y-4">
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <Calendar className="w-5 h-5 text-amber-500" />
                        <h3 className="text-xl font-bold">Retirada Temporária</h3>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
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
                                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                                    />
                                </div>
                                <select
                                    value={selectedMilitar}
                                    onChange={e => setSelectedMilitar(e.target.value)}
                                    className="w-full bg-slate-50 border border-slate-300 rounded-xl text-sm py-2.5 px-4"
                                    required
                                >
                                    <option value="">Selecione o militar...</option>
                                    {filteredMilitares.map(m => (
                                        <option key={m.id} value={m.id}>{m.nome} ({m.posto})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 ml-1 flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-amber-500" />
                                    Data Prevista de Devolução
                                </label>
                                <input
                                    type="date"
                                    value={dataDevolucao}
                                    min={format(new Date(), 'yyyy-MM-dd')}
                                    onChange={e => setDataDevolucao(e.target.value)}
                                    className="w-full bg-amber-50/50 border border-amber-200 rounded-xl text-sm py-2.5 px-4 font-bold text-amber-900 outline-none focus:ring-4 focus:ring-amber-500/10 transition-all"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-sm font-bold text-slate-700">Materiais</label>
                                </div>
                                <div className="relative mb-2">
                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input
                                        type="text"
                                        value={materialSearch}
                                        onChange={e => setMaterialSearch(e.target.value)}
                                        placeholder="Filtrar ou escanear..."
                                        className="w-full pl-10 pr-20 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                                    />
                                    <button type="button" onClick={() => setIsScanning(true)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 p-1">
                                        <QrCode className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="border border-slate-200 rounded-xl overflow-hidden max-h-40 overflow-y-auto divide-y divide-slate-100 bg-slate-50/30">
                                    {filteredMateriaisDisponiveis.map(m => (
                                        <MaterialItem
                                            key={m.id}
                                            m={m}
                                            isSelected={selectedMateriais.includes(m.id)}
                                            onToggle={toggleMaterial}
                                        />
                                    ))}
                                </div>
                                {selectedMateriais.length > 0 && (
                                    <div className="space-y-2 mt-4 pt-4 border-t border-slate-200 animate-in fade-in duration-200">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Itens Selecionados ({selectedMateriais.length})</label>
                                            <button
                                                type="button"
                                                onClick={() => setSelectedMateriais([])}
                                                className="text-[10px] font-bold text-red-500 hover:text-red-700 uppercase cursor-pointer"
                                            >
                                                Desmarcar Todos
                                            </button>
                                        </div>
                                        <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto divide-y divide-slate-100 bg-slate-50">
                                            {selectedMateriais.map(id => {
                                                const m = materiais.find(item => item.id === id);
                                                if (!m) return null;
                                                return (
                                                    <div key={m.id} className="flex items-center justify-between px-3 py-2 hover:bg-slate-100/50 transition-colors">
                                                        <div className="flex flex-col">
                                                            <span className="text-xs font-bold text-slate-700">{m.nome}</span>
                                                            <span className="text-[10px] text-slate-400">BMP: {m.bmp} {m.marca && `| ${m.marca}`}</span>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => toggleMaterial(m.id)}
                                                            className="text-slate-400 hover:text-red-500 p-1 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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

                            <button
                                type="submit"
                                disabled={!selectedMilitar || selectedMateriais.length === 0}
                                className="w-full bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-600/10 transition-all text-sm"
                            >
                                <CheckCircle className="w-5 h-5" />
                                Registrar Retirada Temporária
                            </button>
                        </form>
                    </div>
                </section>

                <section className="lg:col-span-7 space-y-4">
                    <div className="flex flex-col gap-4 mb-2">
                        <div className="flex items-center gap-4 border-b border-slate-200">
                            <button
                                onClick={() => setListTab('Ativa')}
                                className={cn(
                                    "flex items-center gap-2 pb-2 border-b-2 transition-all",
                                    listTab === 'Ativa' ? "border-amber-500 text-amber-600" : "border-transparent text-slate-400"
                                )}
                            >
                                <History className="w-5 h-5" />
                                <h3 className="text-lg font-bold">Em Aberto</h3>
                            </button>
                            <button
                                onClick={() => setListTab('Finalizada')}
                                className={cn(
                                    "flex items-center gap-2 pb-2 border-b-2 transition-all",
                                    listTab === 'Finalizada' ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-400"
                                )}
                            >
                                <CheckCircle className="w-5 h-5" />
                                <h3 className="text-lg font-bold">Devolvidos</h3>
                            </button>
                        </div>
                        <div className="relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={recordSearch}
                                onChange={e => setRecordSearch(e.target.value)}
                                placeholder="Buscar por militar ou BMP..."
                                className="pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs w-full"
                            />
                        </div>

                        {listTab === 'Ativa' && overdueCount > 0 && (
                            <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-4 animate-in slide-in-from-top-2 duration-300">
                                <div className="bg-red-500 p-2 rounded-lg text-white">
                                    <AlertTriangle className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="text-red-900 font-bold text-sm">Atenção: Itens Atrasados</h4>
                                    <p className="text-red-700 text-xs text-balance">
                                        Existem <strong>{overdueCount}</strong> cautelas temporárias com o prazo de devolução expirado.
                                        Por favor, entre em contato com os militares responsáveis para regularizar a situação.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto hidden md:block">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Militar</th>
                                        <th className="px-6 py-4">Materiais</th>
                                        <th className="px-6 py-4">Prazo / Retirada</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
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
                                </tbody>
                            </table>
                        </div>
                        <div className="md:hidden divide-y divide-slate-100">
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
                        </div>
                    </div>
                </section>
            </div>

            {showSuccess && (
                <div className="bg-emerald-50 border-2 border-dashed border-emerald-200 rounded-2xl p-8 flex items-center justify-between animate-in fade-in zoom-in-95">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <CheckCircle className="w-8 h-8" />
                        </div>
                        <div>
                            <h4 className="text-xl font-bold text-emerald-900">Sucesso!</h4>
                            <p className="text-sm text-emerald-700">Retirada temporária registrada com sucesso.</p>
                        </div>
                    </div>
                    <button onClick={() => setShowSuccess(false)} className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold">Fechar</button>
                </div>
            )}
        </div>
    );
};

export default TemporaryCautionArea;
