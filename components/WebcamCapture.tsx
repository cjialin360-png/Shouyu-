import React, { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

interface WebcamCaptureProps {
  onCapture: (base64: string) => void;
  isProcessing: boolean;
}

export interface WebcamRef {
  capture: () => void;
}

const WebcamCapture = forwardRef<WebcamRef, WebcamCaptureProps>(({ onCapture, isProcessing }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } 
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        setError('Camera access denied or unavailable.');
        console.error("Camera Error:", err);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useImperativeHandle(ref, () => ({
    capture: () => {
      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
          const base64 = canvas.toDataURL('image/jpeg', 0.8);
          onCapture(base64);
        }
      }
    }
  }));

  if (error) {
    return <div className="p-4 text-red-600 border border-red-300 rounded bg-red-50">{error}</div>;
  }

  return (
    <div className="relative w-full max-w-md mx-auto overflow-hidden border-4 border-[#5c4d3c] rounded-lg shadow-2xl bg-black">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        className={`w-full h-auto object-cover transform scale-x-[-1] transition-opacity duration-300 ${isProcessing ? 'opacity-50' : 'opacity-100'}`}
      />
      <canvas ref={canvasRef} className="hidden" />
      
      {/* Overlay Frame Guide */}
      <div className="absolute inset-0 border-[1px] border-white/30 pointer-events-none m-4 rounded"></div>
      
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
        </div>
      )}
      
      {!hasPermission && !error && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Initializing Camera...
        </div>
      )}
    </div>
  );
});

export default WebcamCapture;
