import React, { useState, useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Save, Trash2, CheckCircle, PenTool, UserCheck, Users } from 'lucide-react';
import { useAuth } from './AuthContext';

const SettingsArea: React.FC = () => {
    const { user } = useAuth();
    const [signature, setSignature] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });
    const sigRef = useRef<SignatureCanvas>(null);

    // States for text names
    const [commanderName, setCommanderName] = useState('CAP VALDECI');
    const [conferenteName, setConferenteName] = useState('1S ARTHUR');
    const [isSavingNames, setIsSavingNames] = useState(false);

    // States for user password change
    const [oldUserPassword, setOldUserPassword] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [confirmUserPassword, setConfirmUserPassword] = useState('');
    const [isSavingUserPassword, setIsSavingUserPassword] = useState(false);

    useEffect(() => {
        fetchSignature();
        fetchNames();
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

    const fetchNames = async () => {
        try {
            const res = await fetch('/api/config/names');
            if (res.ok) {
                const data = await res.json();
                if (data.commander_name) setCommanderName(data.commander_name);
                if (data.conferente_name) setConferenteName(data.conferente_name);
            }
        } catch (e) {
            console.error("Erro ao buscar nomes:", e);
        }
    };

    const handleClear = () => {
        sigRef.current?.clear();
    };

    const handleRemoveExisting = async () => {
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

    const handleSaveNames = async () => {
        setIsSavingNames(true);
        try {
            const res = await fetch('/api/config/names', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    commander_name: commanderName
                }),
            });

            if (res.ok) {
                setMessage({ text: 'Nomes de chefia atualizados com sucesso!', type: 'success' });
            } else {
                setMessage({ text: 'Erro ao salvar os nomes das assinaturas.', type: 'error' });
            }
        } catch (e) {
            console.error("Erro ao salvar nomes:", e);
            setMessage({ text: 'Erro ao salvar os nomes das assinaturas.', type: 'error' });
        } finally {
            setIsSavingNames(false);
            setTimeout(() => setMessage({ text: '', type: '' }), 4000);
        }
    };

    const handleUpdateUserPassword = async () => {
        if (!user) return;
        if (!oldUserPassword || !newUserPassword || !confirmUserPassword) {
            setMessage({ text: 'Por favor, preencha todos os campos de senha.', type: 'error' });
            return;
        }
        if (newUserPassword !== confirmUserPassword) {
            setMessage({ text: 'A nova senha e a confirmação não coincidem.', type: 'error' });
            return;
        }

        setIsSavingUserPassword(true);
        try {
            const res = await fetch('/api/update-user-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: user.username,
                    oldPassword: oldUserPassword,
                    newPassword: newUserPassword
                }),
            });

            if (res.ok) {
                setMessage({ text: 'Sua senha de conferente foi atualizada com sucesso!', type: 'success' });
                setOldUserPassword('');
                setNewUserPassword('');
                setConfirmUserPassword('');
            } else {
                const errData = await res.json();
                setMessage({ text: `Erro: ${errData.error || 'Não foi possível alterar a senha.'}`, type: 'error' });
            }
        } catch (e) {
            console.error("Erro ao alterar senha:", e);
            setMessage({ text: 'Erro ao alterar a senha.', type: 'error' });
        } finally {
            setIsSavingUserPassword(false);
            setTimeout(() => setMessage({ text: '', type: '' }), 4000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {message.text && (
                <div className={`p-4 rounded-xl text-sm font-bold flex flex-col gap-1 shadow-sm transition-all duration-300 border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {message.text}
                </div>
            )}

            {/* Configuração de Nomes das Assinaturas */}
            {/* Identificação das Assinaturas */}
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-2xs border border-slate-200 space-y-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Users className="text-[#003366] w-4 h-4" />
                        Identificação dos Responsáveis nos Termos
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">
                        Configure os postos e nomes que sairão impressos sob os campos de assinatura dos relatórios e termos oficiais.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                            Conferente Ativo (Sessão Atual)
                        </label>
                        <input
                            type="text"
                            value={user?.nome_conferente || conferenteName}
                            disabled
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-200 bg-slate-100/70 text-slate-600 font-bold text-sm uppercase cursor-not-allowed font-mono"
                        />
                        <span className="text-[11px] text-slate-400 font-medium">Definido automaticamente pelo usuário autenticado.</span>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                            Nome / Posto do Chefe da Banda
                        </label>
                        <input
                            type="text"
                            value={commanderName}
                            onChange={(e) => setCommanderName(e.target.value)}
                            placeholder="Ex: CAP VALDECI"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm uppercase"
                        />
                        <span className="text-[11px] text-slate-400 font-medium">Nome exibido na assinatura central de autorização.</span>
                    </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                        onClick={handleSaveNames}
                        disabled={isSavingNames}
                        className="bg-[#003366] hover:bg-[#002244] disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-xs text-xs cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        <span>{isSavingNames ? 'Salvando...' : 'Salvar Identificações'}</span>
                    </button>
                </div>
            </div>

            {/* Configuração de Assinatura do Chefe da Banda */}
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-2xs border border-slate-200 space-y-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <PenTool className="text-[#003366] w-4 h-4" />
                        Assinatura Digitalizada do Chefe da Banda
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">
                        Insira a rubrica/assinatura oficial para inserção automática nos termos impressos e PDFs gerados.
                    </p>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">Campo de Rubrica / Escrita</label>
                        {!signature && (
                            <button
                                onClick={handleClear}
                                className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 uppercase cursor-pointer"
                            >
                                <Trash2 className="w-3 h-3" /> Limpar
                            </button>
                        )}
                    </div>

                    <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-lg overflow-hidden min-h-[180px] flex flex-col items-center justify-center relative touch-none">
                        {signature ? (
                            <div className="relative group w-full flex items-center justify-center p-6 bg-white rounded-lg">
                                <img src={signature} alt="Assinatura Salva" className="max-h-28 object-contain" />
                                <div className="absolute inset-0 bg-slate-900/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                                    <button
                                        onClick={handleRemoveExisting}
                                        className="bg-white text-slate-800 font-bold text-xs px-3.5 py-2 rounded-md shadow-md flex items-center gap-1.5 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Assinar Novamente
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <SignatureCanvas
                                ref={sigRef}
                                penColor="black"
                                canvasProps={{
                                    className: "w-full h-[180px] cursor-crosshair bg-white"
                                }}
                            />
                        )}

                        {!signature && (
                            <div className="absolute bottom-3 text-[11px] font-medium tracking-wide text-slate-400 pointer-events-none uppercase">
                                Desenhe a assinatura no quadro branco
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !!signature}
                            className="bg-[#003366] hover:bg-[#002244] disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-xs text-xs cursor-pointer"
                        >
                            {signature ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                            <span>{signature ? 'Assinatura Registrada' : (isSaving ? 'Salvando...' : 'Salvar Assinatura')}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Alterar Senha do Conferente */}
            <div className="bg-white p-5 sm:p-6 rounded-xl shadow-2xs border border-slate-200 space-y-4">
                <div>
                    <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <UserCheck className="text-[#003366] w-4 h-4" />
                        Segurança da Conta / Alterar Senha
                    </h2>
                    <p className="text-slate-500 text-xs mt-0.5 font-medium">
                        Atualize a senha de acesso da conta em uso (<strong className="font-bold text-slate-800">{user?.nome_conferente || user?.username}</strong>).
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                            Senha Atual
                        </label>
                        <input
                            type="password"
                            value={oldUserPassword}
                            onChange={(e) => setOldUserPassword(e.target.value)}
                            placeholder="Digite a senha atual"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                            Nova Senha
                        </label>
                        <input
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="Digite a nova senha"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                            Confirmar Nova Senha
                        </label>
                        <input
                            type="password"
                            value={confirmUserPassword}
                            onChange={(e) => setConfirmUserPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                            className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-[#003366]/20 focus:border-[#003366] transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-slate-100">
                    <button
                        onClick={handleUpdateUserPassword}
                        disabled={isSavingUserPassword}
                        className="bg-[#003366] hover:bg-[#002244] disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-xs text-xs cursor-pointer"
                    >
                        <Save className="w-4 h-4" />
                        <span>{isSavingUserPassword ? 'Salvando...' : 'Atualizar Senha'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsArea;
