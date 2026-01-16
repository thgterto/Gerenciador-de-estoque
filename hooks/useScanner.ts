
import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';

interface UseScannerProps {
    /** Função callback executada quando um código é lido com sucesso */
    onScan: (decodedText: string) => void;
    /** Função callback opcional para erros críticos de inicialização */
    onError?: (errorMessage: string) => void;
    /** Proporção do vídeo (padrão 1.0 para quadrado) */
    aspectRatio?: number;
}

/**
 * Hook personalizado para gerenciar a câmera e leitura de códigos QR/Barras.
 * Encapsula a complexidade da biblioteca `html5-qrcode` e gerencia concorrência.
 * 
 * @example
 * const { elementId, startScanner, stopScanner, error } = useScanner({ onScan: handleScan });
 */
export const useScanner = ({ onScan, onError, aspectRatio = 1.0 }: UseScannerProps) => {
    const scannerRef = useRef<Html5Qrcode | null>(null);
    const [elementId] = useState(() => `scanner-${Math.random().toString(36).substr(2, 9)}`);
    const [error, setError] = useState<string | null>(null);
    const [isScanning, setIsScanning] = useState(false);
    
    // Refs para controle de estado assíncrono
    const scanInProgress = useRef(false);
    const isStarting = useRef(false);
    const shouldScan = useRef(false);

    /**
     * Toca um beep curto usando AudioContext.
     */
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
            console.warn("AudioContext não suportado ou bloqueado", e);
        }
    }, []);

    /**
     * Para a câmera e limpa o elemento DOM.
     */
    const stopScanner = useCallback(async () => {
        shouldScan.current = false;

        // Se estiver iniciando, deixamos o startScanner lidar com o cleanup via shouldScan
        if (isStarting.current) {
            return;
        }

        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (e) {
                // Erros de stop/clear são geralmente inofensivos aqui (ex: elemento já removido)
                console.warn("Scanner cleanup info:", e);
            }
            setIsScanning(false);
        }
    }, []);

    /**
     * Inicializa a câmera e começa o escaneamento.
     */
    const startScanner = useCallback(async () => {
        shouldScan.current = true;
        
        const element = document.getElementById(elementId);
        if (!element) return;

        // Evita chamadas concorrentes de start
        if (isStarting.current) return;
        isStarting.current = true;

        // Limpeza preventiva
        if (scannerRef.current) {
            try {
                if (scannerRef.current.isScanning) {
                    await scannerRef.current.stop();
                }
                scannerRef.current.clear();
            } catch (e) {
                // Ignora erros de limpeza preventiva
            }
        }

        try {
            // Se o usuário cancelou enquanto esperávamos
            if (!shouldScan.current) {
                isStarting.current = false;
                return;
            }

            const scanner = new Html5Qrcode(elementId);
            scannerRef.current = scanner;

            const config = {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: aspectRatio,
                formatsToSupport: [
                    Html5QrcodeSupportedFormats.QR_CODE,
                    Html5QrcodeSupportedFormats.EAN_13,
                    Html5QrcodeSupportedFormats.CODE_128
                ]
            };

            await scanner.start(
                { facingMode: "environment" },
                config,
                (decodedText) => {
                    if (scanInProgress.current || !shouldScan.current) return;
                    scanInProgress.current = true;

                    playBeep();
                    if (navigator.vibrate) navigator.vibrate(50);
                    
                    onScan(decodedText);

                    setTimeout(() => {
                        scanInProgress.current = false;
                    }, 1500);
                },
                (err) => {
                    // Ignora erros de leitura frame a frame
                    if (onError && typeof err === 'string' && err.includes("permission")) {
                        onError(err);
                    }
                }
            );

            // Verifica se o usuário cancelou durante a inicialização (race condition)
            if (!shouldScan.current) {
                await scanner.stop();
                scanner.clear();
                setIsScanning(false);
            } else {
                setIsScanning(true);
                setError(null);
            }

        } catch (err: any) {
            // Tratamento específico para o erro de interrupção de play()
            const msgStr = err?.message || err?.toString() || "";
            if (msgStr.includes("play() request was interrupted") || msgStr.includes("media was removed")) {
                console.debug("Scanner start interrupted (harmless).");
                return;
            }

            console.error("Erro ao iniciar scanner:", err);
            
            if (shouldScan.current) {
                let msg = "Erro ao acessar a câmera.";
                if (err?.name === "NotAllowedError" || msgStr.includes("Permission")) {
                    msg = "Permissão de câmera negada. Verifique as configurações do navegador.";
                } else if (err?.name === "NotFoundError") {
                    msg = "Nenhuma câmera encontrada no dispositivo.";
                }
                setError(msg);
            }
            setIsScanning(false);
        } finally {
            isStarting.current = false;
            // Segunda verificação de segurança no finally
            if (!shouldScan.current && scannerRef.current?.isScanning) {
                stopScanner();
            }
        }
    }, [elementId, aspectRatio, onScan, onError, playBeep, stopScanner]);

    useEffect(() => {
        return () => {
            shouldScan.current = false;
            if (scannerRef.current) {
                // Tentativa de parar se estiver rodando
                if (scannerRef.current.isScanning) {
                    scannerRef.current.stop().catch(() => {});
                }
                try { scannerRef.current.clear(); } catch(e) {}
            }
        };
    }, []);

    return {
        elementId,
        startScanner,
        stopScanner,
        isScanning,
        error
    };
};
