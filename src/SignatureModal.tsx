import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Trash2, CheckCircle, PenTool, ShieldCheck } from 'lucide-react';
import { cn } from './utils';

interface SignatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (militarSig: string, encarregadoSig: string) => void;
  militarNome: string;
  itens?: { nome: string; bmp: string; marca?: string }[];
  onPreviewPdf?: () => void;
}

const SignatureModal: React.FC<SignatureModalProps> = ({ isOpen, onClose, onConfirm, militarNome, itens, onPreviewPdf }) => {
  const militarSigRef = useRef<SignatureCanvas>(null);
  const encarregadoSigRef = useRef<SignatureCanvas>(null);

  const [militarDigital, setMilitarDigital] = useState(false);
  const [encarregadoDigital, setEncarregadoDigital] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMilitarDigital(false);
      setEncarregadoDigital(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleClearMilitar = () => militarSigRef.current?.clear();
  const handleClearEncarregado = () => encarregadoSigRef.current?.clear();

  const handleConfirm = () => {
    const isMilitarEmpty = !militarDigital && militarSigRef.current?.isEmpty();
    const isEncarregadoEmpty = !encarregadoDigital && encarregadoSigRef.current?.isEmpty();

    if (isMilitarEmpty && isEncarregadoEmpty) {
      alert('Por favor, assine na tela ou selecione a opção de assinatura digital para ambas as partes.');
      return;
    }

    if (isMilitarEmpty) {
      alert('Por favor, o militar deve assinar na tela ou selecionar a opção de assinatura digital.');
      return;
    }

    if (isEncarregadoEmpty) {
      alert('Por favor, o encarregado deve assinar na tela ou selecionar a opção de assinatura digital.');
      return;
    }

    const militarSig = militarDigital ? '' : (militarSigRef.current?.getCanvas().toDataURL('image/png') || '');
    const encarregadoSig = encarregadoDigital ? '' : (encarregadoSigRef.current?.getCanvas().toDataURL('image/png') || '');

    onConfirm(militarSig, encarregadoSig);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Assinatura do Termo
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors cursor-pointer">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 sm:space-y-8 touch-pan-y">
          {/* Prévia dos itens sendo cautelados/devolvidos */}
          {itens && itens.length > 0 && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Itens inclusos nesta operação ({itens.length})
                </span>
                {onPreviewPdf && (
                  <button
                    type="button"
                    onClick={onPreviewPdf}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200/50 cursor-pointer"
                  >
                    Visualizar Prévia do Termo (PDF)
                  </button>
                )}
              </div>
              <div className="max-h-32 overflow-y-auto divide-y divide-slate-100 border border-slate-200/60 rounded-xl bg-white px-3 shadow-sm">
                {itens.map((item, idx) => (
                  <div key={idx} className="py-2 flex justify-between items-center text-xs text-slate-700">
                    <span className="font-bold text-slate-800">{item.nome}</span>
                    <div className="flex items-center gap-2">
                      {item.marca && <span className="text-[10px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded">{item.marca}</span>}
                      <span className="text-slate-500 font-mono text-[10px]">BMP: {item.bmp}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Militar Signature */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Assinatura do Militar: <span className="text-primary">{militarNome}</span>
              </label>
              
              <div className="flex items-center gap-2">
                <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setMilitarDigital(false)}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer",
                      !militarDigital
                        ? "bg-white text-primary shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <PenTool className="w-3 h-3" />
                    Desenhar
                  </button>
                  <button
                    type="button"
                    onClick={() => setMilitarDigital(true)}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer",
                      militarDigital
                        ? "bg-primary text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    Digital / Gov.br (Em Branco)
                  </button>
                </div>

                {!militarDigital && (
                  <button
                    onClick={handleClearMilitar}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 uppercase px-1.5 py-1 hover:bg-red-50 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Limpar
                  </button>
                )}
              </div>
            </div>

            {militarDigital ? (
              <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">
                  Espaço reservado para Assinatura Digital (Gov.br / ICP-Brasil)
                </span>
                <p className="text-[11px] text-slate-500 max-w-md">
                  O campo no termo será gerado em branco com a linha e identificação do militar prontas para aposição do certificado digital.
                </p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 overflow-hidden touch-none">
                <SignatureCanvas
                  ref={militarSigRef}
                  penColor="black"
                  canvasProps={{
                    className: "w-full h-24 sm:h-40 cursor-crosshair"
                  }}
                />
              </div>
            )}
          </div>

          {/* Encarregado Signature */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Assinatura do Encarregado do Material
              </label>

              <div className="flex items-center gap-2">
                <div className="inline-flex bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => setEncarregadoDigital(false)}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer",
                      !encarregadoDigital
                        ? "bg-white text-primary shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <PenTool className="w-3 h-3" />
                    Desenhar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEncarregadoDigital(true)}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-bold transition-all flex items-center gap-1 cursor-pointer",
                      encarregadoDigital
                        ? "bg-primary text-white shadow-xs"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    <ShieldCheck className="w-3 h-3" />
                    Digital / Gov.br (Em Branco)
                  </button>
                </div>

                {!encarregadoDigital && (
                  <button
                    onClick={handleClearEncarregado}
                    className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 uppercase px-1.5 py-1 hover:bg-red-50 rounded cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Limpar
                  </button>
                )}
              </div>
            </div>

            {encarregadoDigital ? (
              <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-4 sm:p-6 flex flex-col items-center justify-center text-center gap-2">
                <div className="w-10 h-10 rounded-full bg-blue-100 text-primary flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">
                  Espaço reservado para Assinatura Digital do Encarregado
                </span>
                <p className="text-[11px] text-slate-500 max-w-md">
                  O campo no termo será gerado em branco com a linha e identificação do conferente prontas para aposição digital.
                </p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 overflow-hidden touch-none">
                <SignatureCanvas
                  ref={encarregadoSigRef}
                  penColor="black"
                  canvasProps={{
                    className: "w-full h-24 sm:h-40 cursor-crosshair"
                  }}
                />
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-8 py-2.5 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
          >
            <CheckCircle className="w-5 h-5" />
            Confirmar e Gerar Termo
          </button>
        </div>
      </div>
    </div>
  );
};

export default SignatureModal;
