'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Crop, Check, X, RotateCw } from 'lucide-react';

interface CropModalProps {
  isOpen: boolean;
  file: File | null;
  onClose: () => void;
  onApplyCrop: (croppedFile: File) => void;
}

type AspectRatioPreset = 'free' | '1:1' | '3:4' | '4:6' | '16:9';

export default function CropModal({ isOpen, file, onClose, onApplyCrop }: CropModalProps) {
  const [aspectPreset, setAspectPreset] = useState<AspectRatioPreset>('3:4');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageObj, setImageObj] = useState<HTMLImageElement | null>(null);

  // Crop coordinates (0 to 1 normalized to image natural size)
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number }>({
    x: 0.1,
    y: 0.1,
    w: 0.8,
    h: 0.8,
  });

  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load image when file changes
  useEffect(() => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      setImageObj(img);
      // Set initial centered crop
      setCropRect({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
    };
    img.src = url;
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Adjust crop rectangle based on aspect ratio
  useEffect(() => {
    if (!imageObj) return;
    const imgW = imageObj.naturalWidth;
    const imgH = imageObj.naturalHeight;

    let targetRatio: number | null = null;
    if (aspectPreset === '1:1') targetRatio = 1;
    else if (aspectPreset === '3:4') targetRatio = 3 / 4;
    else if (aspectPreset === '4:6') targetRatio = 4 / 6;
    else if (aspectPreset === '16:9') targetRatio = 16 / 9;

    if (targetRatio) {
      const imgAspect = imgW / imgH;
      let w = 0.8;
      let h = (w * imgAspect) / targetRatio;
      if (h > 0.9) {
        h = 0.9;
        w = (h * targetRatio) / imgAspect;
      }
      setCropRect({
        x: Math.max(0, (1 - w) / 2),
        y: Math.max(0, (1 - h) / 2),
        w: Math.min(1, w),
        h: Math.min(1, h),
      });
    }
  }, [aspectPreset, imageObj]);

  // Render on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !imageObj) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Canvas display dimensions
    const displayW = canvas.width;
    const displayH = canvas.height;

    ctx.clearRect(0, 0, displayW, displayH);

    // Draw background dim
    ctx.drawImage(imageObj, 0, 0, displayW, displayH);

    // Dim overlay
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, displayW, displayH);

    // Clear bright crop area
    const cropX = cropRect.x * displayW;
    const cropY = cropRect.y * displayH;
    const cropW = cropRect.w * displayW;
    const cropH = cropRect.h * displayH;

    ctx.save();
    ctx.beginPath();
    ctx.rect(cropX, cropY, cropW, cropH);
    ctx.clip();
    ctx.drawImage(imageObj, 0, 0, displayW, displayH);
    ctx.restore();

    // Draw crop boundary line and rule-of-thirds grid
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(cropX, cropY, cropW, cropH);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    // vertical lines
    ctx.moveTo(cropX + cropW / 3, cropY);
    ctx.lineTo(cropX + cropW / 3, cropY + cropH);
    ctx.moveTo(cropX + (cropW * 2) / 3, cropY);
    ctx.lineTo(cropX + (cropW * 2) / 3, cropY + cropH);
    // horizontal lines
    ctx.moveTo(cropX, cropY + cropH / 3);
    ctx.lineTo(cropX + cropW, cropY + cropH / 3);
    ctx.moveTo(cropX, cropY + (cropH * 2) / 3);
    ctx.lineTo(cropX + cropW, cropY + (cropH * 2) / 3);
    ctx.stroke();
  }, [imageObj, cropRect]);

  // Handle canvas drag
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const dx = (e.clientX - dragStart.x) / rect.width;
    const dy = (e.clientY - dragStart.y) / rect.height;

    setCropRect((prev) => {
      const newX = Math.max(0, Math.min(1 - prev.w, prev.x + dx));
      const newY = Math.max(0, Math.min(1 - prev.h, prev.y + dy));
      return { ...prev, x: newX, y: newY };
    });

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleApply = () => {
    if (!imageObj || !file) return;

    const sourceW = imageObj.naturalWidth;
    const sourceH = imageObj.naturalHeight;

    const realX = Math.round(cropRect.x * sourceW);
    const realY = Math.round(cropRect.y * sourceH);
    const realW = Math.max(10, Math.round(cropRect.w * sourceW));
    const realH = Math.max(10, Math.round(cropRect.h * sourceH));

    const outCanvas = document.createElement('canvas');
    outCanvas.width = realW;
    outCanvas.height = realH;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) return;

    outCtx.drawImage(imageObj, realX, realY, realW, realH, 0, 0, realW, realH);

    outCanvas.toBlob(
      (blob) => {
        if (!blob) return;
        const croppedFile = new File([blob], `cropped_${file.name}`, { type: file.type || 'image/jpeg' });
        onApplyCrop(croppedFile);
        onClose();
      },
      file.type || 'image/jpeg',
      0.95
    );
  };

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-5 sm:p-6 space-y-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
              <Crop className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold text-white">Potong / Crop Foto</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (!imageObj) return;
                const canvas = document.createElement('canvas');
                canvas.width = imageObj.naturalHeight;
                canvas.height = imageObj.naturalWidth;
                const ctx = canvas.getContext('2d');
                if (ctx) {
                  ctx.translate(canvas.width / 2, canvas.height / 2);
                  ctx.rotate((90 * Math.PI) / 180);
                  ctx.drawImage(imageObj, -imageObj.naturalWidth / 2, -imageObj.naturalHeight / 2);
                  const newImg = new Image();
                  newImg.onload = () => setImageObj(newImg);
                  newImg.src = canvas.toDataURL();
                }
              }}
              className="flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
            >
              <RotateCw className="h-3 w-3" />
              <span>Putar 90°</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Aspect Ratio Preset Selector */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 font-mono">
            Pilihan Rasio Aspek
          </span>
          <div className="flex flex-wrap gap-2">
            {[
              { id: '3:4', label: '3:4 (Pas Foto)' },
              { id: '4:6', label: '4:6 (Pas Foto)' },
              { id: '1:1', label: '1:1 (Persegi)' },
              { id: '16:9', label: '16:9 (Landscape)' },
              { id: 'free', label: 'Bebas' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setAspectPreset(p.id as AspectRatioPreset)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                  aspectPreset === p.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Canvas Workspace */}
        <div className="relative flex items-center justify-center bg-black/60 rounded-xl overflow-hidden border border-slate-800 select-none p-2">
          <canvas
            ref={canvasRef}
            width={480}
            height={360}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="cursor-move max-w-full max-h-[50vh] object-contain rounded"
          />
        </div>

        <p className="text-[11px] text-slate-400 text-center">
          Klik dan geser kotak biru untuk memposisikan wajah atau area yang ingin diambil.
        </p>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 text-xs font-medium transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
          >
            <Check className="h-3.5 w-3.5" />
            <span>Terapkan Potongan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
