import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Save, Trash2, CheckCircle, PenTool, LayoutDashboard } from 'lucide-react';

const SettingsArea: React.FC = () => {
    const [signature, setSignature] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const sigRef = useRef<SignatureCanvas>(null);

    useEffect(() => {
        fetchSignature();
    }, []);

    const fetchSignature = async () => {
        try {
            const res = await fetch('/api/config/commander-signature');
            const data = await res.json();
            if (data.signature) {
                setSignature(data.signature);
            }
        } catch (e) {
            console.error("Erro ao buscar assinatura:", e);
        }
    };

    const handleClear = () => {
        sigRef.current?.clear();
    };

    const handleRemoveExisting = async () => {
        // Optionally remove from DB immediately, or just let them overwrite.
        // We'll let them overwrite by clearing local state.
        setSignature(null);
    };

    const handleSave = async () => {
        if (signature) {
            setMessage({ text: 'Assinatura mantida e salva com sucesso!', type: 'success' });
            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
            return;
        }

        if (!sigRef.current || sigRef.current.isEmpty()) {
            setMessage({ text: 'Por favor, assine antes de salvar.', type: 'error' });
            return;
        }

        const newSignature = sigRef.current.getCanvas().toDataURL('image/png') || '';
        setIsSaving(true);
        try {
            const res = await fetch('/api/config/commander-signature', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ signature: newSignature }),
            });

            if (res.ok) {
                setSignature(newSignature);
                setMessage({ text: 'Assinatura atualizada com sucesso!', type: 'success' });
            } else {
                const errData = await res.json();
                setMessage({ text: `Erro ao salvar: ${errData.error || 'Desconhecido'}`, type: 'error' });
            }
        } catch (e) {
            console.error("Erro:", e);
            setMessage({ text: 'Erro inesperado ao salvar.', type: 'error' });
        } finally {
            setIsSaving(false);
            setTimeout(() => setMessage({ text: '', type: '' }), 4000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <PenTool className="text-primary w-6 h-6" />
                    Assinatura do Chefe da Banda
                </h2>
                <p className="text-slate-600 mb-6 text-sm">
                    Cadastre a assinatura do Chefe da Banda de Música. Esta assinatura será inserida automaticamente ao gerar os Termos de Responsabilidade e Cautela e Termos de Devolução e Baixa do sistema.
                </p>

                {message.text && (
                    <div className={`p-4 mb-4 rounded-xl text-sm font-bold flex flex-col gap-1 \${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-slate-700">Assinatura Digital</label>
                        {!signature && (
                            <button
                                onClick={handleClear}
                                className="text-xs font-bold text-red-500 hover:text-red-700 flex items-center gap-1 uppercase"
                            >
                                <Trash2 className="w-3 h-3" /> Limpar Escrita
                            </button>
                        )}
                    </div>

                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-xl overflow-hidden min-h-[200px] flex flex-col items-center justify-center relative touch-none">
                        {signature ? (
                            <div className="relative group w-full flex items-center justify-center p-8 bg-white border border-slate-200 rounded-xl">
                                <img src={signature} alt="Assinatura Salva" className="max-h-32 object-contain" />
                                <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                    <button
                                        onClick={handleRemoveExisting}
                                        className="bg-white text-slate-800 font-bold text-sm px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 hover:bg-red-50 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" /> Remarcar Assinatura
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <SignatureCanvas
                                ref={sigRef}
                                penColor="black"
                                canvasProps={{
                                    className: "w-full h-[200px] cursor-crosshair bg-white"
                                }}
                            />
                        )}

                        {!signature && (
                            <div className="absolute bottom-4 text-xs font-medium tracking-wide text-slate-400 pointer-events-none uppercase">
                                Assine no espaço acima
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !!signature}
                            className="bg-primary hover:opacity-90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                        >
                            {signature ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                            {signature ? 'Assinatura Adicionada' : (isSaving ? 'Salvando...' : 'Salvar Assinatura')}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsArea;
