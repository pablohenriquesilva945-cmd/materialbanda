import React, { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

const QrScanner: React.FC<QrScannerProps> = ({ onScanSuccess, onClose }) => {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    const handleSuccess = (decodedText: string) => {
      scanner.clear();
      onScanSuccess(decodedText);
    };

    scanner.render(handleSuccess, undefined);

    return () => {
      scanner.clear().catch(err => console.error("Failed to clear scanner", err));
    };
  }, [onScanSuccess]);

  return (
    <div className="fixed inset-0 bg-black/80 flex flex-col items-center justify-center z-50 p-4">
        <div id="qr-reader" className="w-full max-w-md bg-white rounded-xl p-4"></div>
        <button 
            onClick={onClose} 
            className="mt-6 bg-white text-slate-800 font-bold py-2 px-6 rounded-lg"
        >
            Cancelar
        </button>
    </div>
  );
};

export default QrScanner;
