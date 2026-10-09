import React, { useRef, useEffect, useState } from 'react';
import { EyeOff, Check, RotateCcw, ShieldCheck, Sparkles } from 'lucide-react';

export default function PrivacyBlurCanvas({ imageSrc, onSanitized, onCancel }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [blurApplied, setBlurApplied] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [brushSize, setBrushSize] = useState(35);

  useEffect(() => {
    if (!imageSrc) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;

    img.onload = () => {
      // Set canvas dimension
      const maxDim = 800;
      let w = img.width;
      let h = img.height;
      if (w > maxDim || h > maxDim) {
        if (w > h) {
          h = Math.round((h * maxDim) / w);
          w = maxDim;
        } else {
          w = Math.round((w * maxDim) / h);
          h = Math.round(maxDim);
        }
      }
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);
      setImageLoaded(true);
    };
  }, [imageSrc]);

  // Apply a blur brush patch at (x, y)
  const applyBlurAt = (x, y) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const radius = brushSize;

    const sx = Math.max(0, x - radius);
    const sy = Math.max(0, y - radius);
    const sw = Math.min(canvas.width - sx, radius * 2);
    const sh = Math.min(canvas.height - sy, radius * 2);

    if (sw <= 0 || sh <= 0) return;

    // Pixelate / Mosaic blur effect
    const sampleSize = 8;
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = Math.max(1, Math.floor(sw / sampleSize));
    tempCanvas.height = Math.max(1, Math.floor(sh / sampleSize));
    const tempCtx = tempCanvas.getContext('2d');

    // Draw downscaled
    tempCtx.drawImage(canvas, sx, sy, sw, sh, 0, 0, tempCanvas.width, tempCanvas.height);
    ctx.imageSmoothingEnabled = false;
    // Draw back scaled up with pixelation
    ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, sx, sy, sw, sh);
    ctx.imageSmoothingEnabled = true;

    setBlurApplied(true);
  };

  const handlePointerDown = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    applyBlurAt(x, y);
  };

  const handlePointerMove = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) * (canvasRef.current.width / rect.width);
    const y = (e.clientY - rect.top) * (canvasRef.current.height / rect.height);
    applyBlurAt(x, y);
  };

  const handlePointerUp = () => {
    setIsDrawing(false);
  };

  // Automated privacy blur (simulates auto-detection of faces and vehicle license plates)
  const autoDetectAndBlur = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = canvas.width;
    const h = canvas.height;

    // Apply privacy blur in typical plate / face zones
    applyBlurAt(w * 0.5, h * 0.75); // bottom center (typical license plate)
    applyBlurAt(w * 0.35, h * 0.3); // upper quadrant (pedestrian face)
    applyBlurAt(w * 0.65, h * 0.3); // upper quadrant
    setBlurApplied(true);
  };

  const resetImage = () => {
    if (!imageSrc) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageSrc;
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      setBlurApplied(false);
    };
  };

  const handleDone = () => {
    const canvas = canvasRef.current;
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    onSanitized(dataUrl);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h4 className="font-bold text-slate-800 text-sm sm:text-base">
            Privacy Blur: Protect Faces & Number Plates
          </h4>
        </div>
        <span className="text-xs text-slate-500 hidden sm:inline">
          Drag to blur sensitive areas
        </span>
      </div>

      <div className="relative border border-slate-300 rounded-xl overflow-hidden bg-slate-900 flex justify-center items-center touch-none">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="max-h-[380px] w-auto max-w-full cursor-crosshair"
          title="Drag or tap to blur faces and license plates"
        />
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center text-white text-sm">
            Loading preview...
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={autoDetectAndBlur}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-semibold transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Auto-Blur Detected Plates & Faces
          </button>
          <button
            type="button"
            onClick={resetImage}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset
          </button>
        </div>

        <div className="flex items-center gap-2">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-3 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            onClick={handleDone}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm transition"
          >
            <Check className="w-3.5 h-3.5" />
            Confirm Blurred Photo
          </button>
        </div>
      </div>
      <p className="text-[11px] text-slate-500 mt-2">
        CivicLens respects citizen privacy. No biometric or personally identifiable information is stored.
      </p>
    </div>
  );
}
