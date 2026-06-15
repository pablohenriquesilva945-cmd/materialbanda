import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { X, Trash2, CheckCircle } from 'lucide-react';

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

  if (!isOpen) return null;

  const handleClearMilitar = () => militarSigRef.current?.clear();
  const handleClearEncarregado = () => encarregadoSigRef.current?.clear();

  const handleConfirm = () => {
    if (militarSigRef.current?.isEmpty() || encarregadoSigRef.current?.isEmpty()) {
      alert('Por favor, ambas as partes devem assinar.');
      return;
    }

    const militarSig = militarSigRef.current?.getCanvas().toDataURL('image/png') || '';
    const encarregadoSig = encarregadoSigRef.current?.getCanvas().toDataURL('image/png') || '';

    onConfirm(militarSig, encarregadoSig);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            Assinatura Digital do Termo
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Assinatura do Militar: <span className="text-primary">{militarNome}</span>
              </label>
              <button
                onClick={handleClearMilitar}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 uppercase"
              >
                <Trash2 className="w-3 h-3" /> Limpar
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 overflow-hidden touch-none">
              <SignatureCanvas
                ref={militarSigRef}
                penColor="black"
                canvasProps={{
                  className: "w-full h-24 sm:h-40 cursor-crosshair"
                }}
              />
            </div>
          </div>

          {/* Encarregado Signature */}
          <div className="space-y-2 sm:space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                Assinatura do Encarregado do Material
              </label>
              <button
                onClick={handleClearEncarregado}
                className="text-[10px] font-bold text-red-500 hover:text-red-700 flex items-center gap-1 uppercase"
              >
                <Trash2 className="w-3 h-3" /> Limpar
              </button>
            </div>
            <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 overflow-hidden touch-none">
              <SignatureCanvas
                ref={encarregadoSigRef}
                penColor="black"
                canvasProps={{
                  className: "w-full h-24 sm:h-40 cursor-crosshair"
                }}
              />
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="px-8 py-2.5 rounded-xl font-bold bg-primary text-white shadow-lg shadow-primary/20 hover:scale-105 transition-all flex items-center gap-2"
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
