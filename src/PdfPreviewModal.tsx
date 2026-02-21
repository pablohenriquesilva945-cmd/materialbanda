import React from 'react';
import { X, Download, Printer } from 'lucide-react';

interface PdfPreviewModalProps {
  url: string;
  onClose: () => void;
  title: string;
  onDownload: () => void;
}

const PdfPreviewModal: React.FC<PdfPreviewModalProps> = ({ url, onClose, title, onDownload }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Printer className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-bold text-slate-800">{title}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={onDownload}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-primary/90 transition-all"
            >
              <Download className="w-4 h-4" />
              Baixar PDF
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 bg-slate-100 p-4">
          <iframe 
            src={`${url}#toolbar=0`} 
            className="w-full h-full rounded-lg border border-slate-200 shadow-inner bg-white"
            title="PDF Preview"
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-white border border-slate-200 rounded-lg text-sm font-bold hover:bg-slate-100 transition-all"
          >
            Fechar Visualização
          </button>
        </div>
      </div>
    </div>
  );
};

export default PdfPreviewModal;
