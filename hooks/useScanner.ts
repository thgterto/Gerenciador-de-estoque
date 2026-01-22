
import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface UseScannerProps {
    onScan: (decodedText: string) => void;
    onError?: (errorMessage: string) => void;
    aspectRatio?: number;
}

export const useScanner = ({ onScan, onError, aspectRatio = 1.0 }: UseScannerProps) => {
    // ID único para o elemento DOM do scanner
    const [elementId] = useState(() => `scanner-${Math.random().toString(36).substr(2, 9)}`);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const isMounted = useRef(false);

    const playBeep = useCallback(() => {
        try {
            const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContext) {
                const ctx = new AudioContext();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 800;
                gain.gain.value = 0.1;
                osc.start();
                setTimeout(() => { 
                    osc.stop(); 
                    ctx.close();
                }, 100);
            }
        } catch (e) {
            console.warn("AudioContext bloqueado/não suportado");
        }
    }, []);

    const cleanup = useCallback(async () => {
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (e) {
                // Erros de stop são esperados se o scanner já estiver parado ou desmontado
                console.debug("Scanner stop/clear ignored:", e);
            }
            scannerRef.current = null;
            setIsScanning(false);
        }
    }, []);

    const startScanner = useCallback(async () => {
        // Previne múltiplas inicializações
        if (isScanning || scannerRef.current) return;

        const element = document.getElementById(elementId);
        if (!element) return;

        try {
            const scanner = new Html5Qrcode(elementId, {
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.CODE_128
                ],
                verbose: false
            });
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: "environment" },
                {
                    fps: 10,
                    qrbox: { width: 250, height: 250 },
                    aspectRatio: aspectRatio
                },
                (decodedText) => {
                    // Previne leituras múltiplas muito rápidas (debounce simples)
                    if (!isMounted.current) return;
                    
                    playBeep();
                    if (navigator.vibrate) navigator.vibrate(50);
                    onScan(decodedText);
                },
                () => {
                    // Ignora erros de frame vazio
                }
            );

            if (isMounted.current) {
                setIsScanning(true);
                setError(null);
            } else {
                // Se desmontou durante o start, limpa imediatamente
                await cleanup();
            }

        } catch (err: any) {
            console.error("Erro ao iniciar scanner:", err);
            if (isMounted.current) {
                let msg = "Erro ao acessar câmera.";
                if (err?.name === "NotAllowedError" || err?.toString().includes("Permission")) {
                    msg = "Permissão negada. Verifique o navegador.";
                } else if (err?.name === "NotFoundError") {
                    msg = "Nenhuma câmera encontrada.";
                }
                setError(msg);
                if (onError) onError(msg);
            }
            await cleanup();
        }
    }, [elementId, aspectRatio, onScan, onError, playBeep, cleanup, isScanning]);

    // Controle de Ciclo de Vida
    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
            cleanup();
        };
    }, [cleanup]);

    return {
        elementId,
        startScanner,
        stopScanner: cleanup,
        isScanning,
        error
    };
};
