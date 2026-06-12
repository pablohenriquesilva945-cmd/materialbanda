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
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <Users className="text-primary w-6 h-6" />
                    Identificação das Assinaturas
                </h2>
                <p className="text-slate-600 mb-6 text-sm">
                    Atualize os nomes dos responsáveis que aparecerão impressos nos Termos de Cautela e de Devolução (abaixo das linhas de assinatura).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 block">
                            Nome/Posto do Conferente (Sessão Ativa)
                        </label>
                        <input
                            type="text"
                            value={user?.nome_conferente || conferenteName}
                            disabled
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-400 font-bold text-sm uppercase cursor-not-allowed"
                        />
                        <span className="text-xs text-slate-400">O conferente é definido pelo login ativo.</span>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 block">
                            Nome/Posto do Chefe da Banda
                        </label>
                        <input
                            type="text"
                            value={commanderName}
                            onChange={(e) => setCommanderName(e.target.value)}
                            placeholder="Ex: CAP VALDECI"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm uppercase"
                        />
                        <span className="text-xs text-slate-400">Nome que constará sob a assinatura central.</span>
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
                    <button
                        onClick={handleSaveNames}
                        disabled={isSavingNames}
                        className="bg-primary hover:opacity-90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                    >
                        <Save className="w-5 h-5" />
                        {isSavingNames ? 'Salvando...' : 'Salvar Identificações'}
                    </button>
                </div>
            </div>

            {/* Configuração de Assinatura do Chefe da Banda */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <PenTool className="text-primary w-6 h-6" />
                    Assinatura do Chefe da Banda
                </h2>
                <p className="text-slate-600 mb-6 text-sm">
                    Cadastre a assinatura digitalizada do Chefe da Banda de Música. Esta assinatura será inserida automaticamente ao gerar os Termos de Cautela e de Devolução do sistema.
                </p>

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

            {/* Alterar Senha do Conferente */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                    <UserCheck className="text-primary w-6 h-6" />
                    Segurança / Alterar Senha
                </h2>
                <p className="text-slate-600 mb-6 text-sm">
                    Altere a senha de acesso da conta de conferente ativa (<strong className="font-bold text-slate-800">{user?.nome_conferente}</strong>).
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 block">
                            Senha Atual
                        </label>
                        <input
                            type="password"
                            value={oldUserPassword}
                            onChange={(e) => setOldUserPassword(e.target.value)}
                            placeholder="Sua senha atual"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 block">
                            Nova Senha
                        </label>
                        <input
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            placeholder="Sua nova senha"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700 block">
                            Confirmar Nova Senha
                        </label>
                        <input
                            type="password"
                            value={confirmUserPassword}
                            onChange={(e) => setConfirmUserPassword(e.target.value)}
                            placeholder="Confirme a nova senha"
                            className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-sm"
                        />
                    </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-100 mt-6">
                    <button
                        onClick={handleUpdateUserPassword}
                        disabled={isSavingUserPassword}
                        className="bg-primary hover:opacity-90 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
                    >
                        <Save className="w-5 h-5" />
                        {isSavingUserPassword ? 'Salvando...' : 'Atualizar Senha'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsArea;
