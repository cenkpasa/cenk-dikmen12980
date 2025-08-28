import React, { useState, useRef, useEffect, useCallback } from 'react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import Loader from '../common/Loader';
import { useNotification } from '../../contexts/NotificationContext';
import { parseBusinessCard } from '../../services/aiService';
import { useLanguage } from '../../contexts/LanguageContext';

interface BusinessCardScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onScan: (data: any) => void;
}

const BusinessCardScanner = ({ isOpen, onClose, onScan }: BusinessCardScannerProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const { showNotification } = useNotification();
    const { t } = useLanguage();

    const startCamera = useCallback(async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }
            });
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
            }
            setStream(mediaStream);
        } catch (err) {
            console.error("Camera error:", err);
            showNotification(t('cameraError'), 'error');
            onClose();
        }
    }, [onClose, showNotification, t]);

    const stopCamera = useCallback(() => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    }, [stream]);

    useEffect(() => {
        if (isOpen) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => {
            stopCamera();
        };
    }, [isOpen, startCamera, stopCamera]);

    const handleCapture = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const context = canvas.getContext('2d');
            context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setCapturedImage(dataUrl);
            stopCamera();
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        startCamera();
    };

    const handleProcessImage = async () => {
        if (!capturedImage) return;
        setIsProcessing(true);
        try {
            const base64Data = capturedImage.split(',')[1];
            const result = await parseBusinessCard(base64Data);
            if (result.success && result.data) {
                onScan(result.data);
            } else {
                showNotification(t('cardReadError', { error: result.text }), 'error');
            }
        } catch (error) {
            showNotification('aiError', 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('scanCard')} size="2xl">
            <div className="flex flex-col items-center">
                <div className="w-full aspect-video bg-black rounded-lg overflow-hidden relative">
                    <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-contain ${capturedImage ? 'hidden' : 'block'}`} />
                    <canvas ref={canvasRef} className="hidden" />
                    {capturedImage && <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />}
                    {isProcessing && (
                         <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                            <Loader />
                            <p className="text-white mt-4">{t('analyzingCard')}</p>
                        </div>
                    )}
                </div>
                <div className="mt-4 flex gap-4">
                    {!capturedImage ? (
                        <Button variant="primary" icon="fas fa-camera" onClick={handleCapture}>{t('takePhoto')}</Button>
                    ) : (
                        <>
                            <Button variant="secondary" icon="fas fa-redo" onClick={handleRetake} disabled={isProcessing}>{t('retakePhoto')}</Button>
                            <Button variant="success" icon="fas fa-check" onClick={handleProcessImage} isLoading={isProcessing}>{t('confirmAndProcess')}</Button>
                        </>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default BusinessCardScanner;