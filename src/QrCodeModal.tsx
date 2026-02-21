import React from 'react';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import { X, Printer } from 'lucide-react';
import { Material } from './types';

interface QrCodeModalProps {
  material: Material | null;
  onClose: () => void;
}

const QrCodeModal: React.FC<QrCodeModalProps> = ({ material, onClose }) => {
  if (!material) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        printWindow.document.write(`
          <html>
            <head><title>Imprimir QR Code</title></head>
            <body style="text-align: center; margin-top: 50px;">
              <h2>${material.nome}</h2>
              <p>BMP: ${material.bmp}</p>
              <img src="${dataUrl}" />
              <script>window.onload = () => { window.print(); window.close(); }</script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full relative m-4 text-center border-4 border-slate-200">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">QR Code do Material</h2>
        <p className="text-slate-500 mb-6">Use este código para identificar o item rapidamente.</p>
        
        <div className="p-4 bg-slate-100 rounded-lg inline-block border border-slate-200">
          <QRCode value={JSON.stringify({ id: material.id, bmp: material.bmp })} size={200} />
        </div>

        <div className="mt-6 text-center">
            <p className="font-bold text-lg text-primary">{material.nome}</p>
            <p className="text-sm text-slate-500">BMP: {material.bmp} | {material.marca}</p>
        </div>

        <button 
          onClick={handlePrint}
          className="mt-8 w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all"
        >
          <Printer className="w-5 h-5" />
          Imprimir Etiqueta
        </button>
      </div>
    </div>
  );
};

export default QrCodeModal;
