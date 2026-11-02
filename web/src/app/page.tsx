'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdBanner from '@/components/AdBanner';
import {
  processImage,
  generateLivePreview,
  ConvertOptions,
  ConvertResult,
  formatBytes,
  PRESET_DIMENSIONS,
} from '@/lib/converter';
import JSZip from 'jszip';
import {
  Upload,
  Download,
  Trash2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Archive,
  Shield,
  Zap,
  Image as ImageIcon,
  Film,
  DownloadCloud,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Camera,
  Check,
  ExternalLink,
  BookOpen,
  Scissors,
  Volume2,
  Share2,
  Copy,
  Crop,
  FileText,
  Eye,
  ZoomIn,
} from 'lucide-react';
import CropModal from '@/components/CropModal';
import { createMultiPagePdf } from '@/lib/pdfGenerator';

interface FileQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  result?: ConvertResult;
  error?: string;
}

type ToolType = 'photo' | 'video' | 'downloader';

function HomeContent() {
  const searchParams = useSearchParams();
  const toolParam = searchParams.get('tool') as ToolType | null;

  // Active Tool Switcher
  const [activeTool, setActiveTool] = useState<ToolType>('photo');

  useEffect(() => {
    if (toolParam && (toolParam === 'photo' || toolParam === 'video' || toolParam === 'downloader')) {
      setActiveTool(toolParam);
      const el = document.getElementById('studio-panel');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [toolParam]);

  // =========================================================================
  // 1. PHOTO STUDIO STATE
  // =========================================================================
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'>('image/jpeg');
  const [mode, setMode] = useState<'target' | 'quality'>('target');
  const [targetKb, setTargetKb] = useState<number>(200);
  const [quality, setQuality] = useState<number>(0.85);
  const [preset, setPreset] = useState<string>('original');
  const [customW, setCustomW] = useState<number>(800);
  const [customH, setCustomH] = useState<number>(600);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);

  // Manipulation settings
  const [rotation, setRotation] = useState<number>(0);
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [filter, setFilter] = useState<'none' | 'grayscale' | 'contrast' | 'bright' | 'sepia' | 'scanner'>('none');
  const [watermarkText, setWatermarkText] = useState<string>('');
  const [bgColor, setBgColor] = useState<'none' | 'red' | 'blue' | 'white'>('none');

  // Photo files queue
  const [files, setFiles] = useState<FileQueueItem[]>([]);
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);
  const [isDraggingPhoto, setIsDraggingPhoto] = useState<boolean>(false);
  const [cropModalOpen, setCropModalOpen] = useState<boolean>(false);
  const [cropTargetItem, setCropTargetItem] = useState<FileQueueItem | null>(null);
  const [isMergingPdf, setIsMergingPdf] = useState<boolean>(false);
  const [isZipping, setIsZipping] = useState<boolean>(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Live Studio Preview State
  const [selectedPreviewIndex, setSelectedPreviewIndex] = useState<number>(0);
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
  const [isGeneratingPreview, setIsGeneratingPreview] = useState<boolean>(false);
  const [previewCompareMode, setPreviewCompareMode] = useState<'result' | 'original'>('result');
  const [isZoomModalOpen, setIsZoomModalOpen] = useState<boolean>(false);

  // Real-time Live Preview Engine with Debounce
  useEffect(() => {
    if (files.length === 0) {
      setLivePreviewUrl(null);
      return;
    }

    const targetIdx = Math.min(selectedPreviewIndex, files.length - 1);
    const targetFileItem = files[targetIdx];
    if (!targetFileItem) return;

    let isCancelled = false;
    setIsGeneratingPreview(true);

    const debounceTimer = setTimeout(async () => {
      try {
        const previewOptions: ConvertOptions = {
          outputFormat,
          quality,
          targetSizeKb: mode === 'target' ? targetKb : undefined,
          resizePreset: preset as ConvertOptions['resizePreset'],
          customWidth: preset === 'custom' ? customW : undefined,
          customHeight: preset === 'custom' ? customH : undefined,
          maintainAspectRatio: maintainAspect,
          rotation,
          flipHorizontal: flipH,
          flipVertical: flipV,
          filter,
          watermarkText: watermarkText.trim() || undefined,
          bgColor,
        };

        const previewDataUrl = await generateLivePreview(targetFileItem.file, previewOptions, 560);
        if (!isCancelled) {
          setLivePreviewUrl(previewDataUrl);
          setIsGeneratingPreview(false);
        }
      } catch (err) {
        console.warn('Live preview generation failed:', err);
        if (!isCancelled) setIsGeneratingPreview(false);
      }
    }, 100);

    return () => {
      isCancelled = true;
      clearTimeout(debounceTimer);
    };
  }, [
    files,
    selectedPreviewIndex,
    bgColor,
    filter,
    preset,
    customW,
    customH,
    maintainAspect,
    rotation,
    flipH,
    flipV,
    watermarkText,
    outputFormat,
    mode,
    targetKb,
    quality,
  ]);

  // =========================================================================
  // 2. VIDEO & GIF STUDIO STATE
  // =========================================================================
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [videoDuration, setVideoDuration] = useState<number>(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState<number>(0);
  const [videoStartTime, setVideoStartTime] = useState<number>(0);
  const [gifDuration, setGifDuration] = useState<number>(3);
  const [gifProgress, setGifProgress] = useState<number>(0);
  const [isGeneratingGif, setIsGeneratingGif] = useState<boolean>(false);
  const [gifResultUrl, setGifResultUrl] = useState<string | null>(null);
  const [capturedFrameUrl, setCapturedFrameUrl] = useState<string | null>(null);
  const [isExtractingAudio, setIsExtractingAudio] = useState<boolean>(false);
  const [extractedAudioUrl, setExtractedAudioUrl] = useState<string | null>(null);
  const [extractedAudioName, setExtractedAudioName] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const videoPlayerRef = useRef<HTMLVideoElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  // =========================================================================
  // 3. UNIVERSAL MEDIA DOWNLOADER STATE
  // =========================================================================
  const [mediaInputUrl, setMediaInputUrl] = useState<string>('');
  const [isMediaLoading, setIsMediaLoading] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [mediaResult, setMediaResult] = useState<{
    platform: string;
    title?: string;
    author?: string;
    media: {
      url: string;
      thumbnail?: string;
      title?: string;
      type: 'image' | 'video';
      source: string;
    }[];
  } | null>(null);

  // =========================================================================
  // PHOTO HANDLERS
  // =========================================================================
  const appendFiles = (newFiles: File[]) => {
    const validItems: FileQueueItem[] = newFiles.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'idle',
    }));
    setFiles((prev) => [...prev, ...validItems]);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((item) => item.id === id);
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
      if (target?.result?.dataUrl) URL.revokeObjectURL(target.result.dataUrl);
      return prev.filter((item) => item.id !== id);
    });
  };

  const clearAllFiles = () => {
    files.forEach((item) => {
      if (item.previewUrl) URL.revokeObjectURL(item.previewUrl);
      if (item.result?.dataUrl) URL.revokeObjectURL(item.result.dataUrl);
    });
    setFiles([]);
  };

  const processItem = async (item: FileQueueItem): Promise<FileQueueItem> => {
    const options: ConvertOptions = {
      outputFormat,
      quality,
      targetSizeKb: mode === 'target' ? targetKb : undefined,
      resizePreset: preset as ConvertOptions['resizePreset'],
      customWidth: preset === 'custom' ? customW : undefined,
      customHeight: preset === 'custom' ? customH : undefined,
      maintainAspectRatio: maintainAspect,
      rotation,
      flipHorizontal: flipH,
      flipVertical: flipV,
      filter,
      watermarkText: watermarkText.trim() || undefined,
      bgColor,
    };

    try {
      const result = await processImage(item.file, options);
      return { ...item, status: 'done', result };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ...item, status: 'error', error: msg };
    }
  };

  const handleProcessAllPhotos = async () => {
    if (files.length === 0 || isProcessingAll) return;
    setIsProcessingAll(true);

    const updated = [...files];
    for (let i = 0; i < updated.length; i++) {
      if (updated[i].status !== 'done') {
        updated[i] = { ...updated[i], status: 'processing' };
        setFiles([...updated]);
        const res = await processItem(updated[i]);
        updated[i] = res;
        setFiles([...updated]);
      }
    }
    setIsProcessingAll(false);
  };

  const handleDownloadZip = async () => {
    const doneItems = files.filter((f) => f.status === 'done' && f.result);
    if (doneItems.length === 0 || isZipping) return;
    setIsZipping(true);

    try {
      const zip = new JSZip();
      doneItems.forEach((item, index) => {
        if (item.result) {
          const name = item.result.filename || `foto_${index + 1}.jpg`;
          zip.file(name, item.result.blob);
        }
      });

      const content = await zip.generateAsync({ type: 'blob' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(content);
      link.download = `omnipic_batch_${Date.now()}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
    } catch (err) {
      alert('Gagal membuat paket ZIP: ' + String(err));
    } finally {
      setIsZipping(false);
    }
  };

  // Quick preset chips
  const applyTargetKbPreset = (kb: number) => {
    setMode('target');
    setTargetKb(kb);
    setOutputFormat('image/jpeg');
  };

  const handleOpenCrop = (item: FileQueueItem) => {
    setCropTargetItem(item);
    setCropModalOpen(true);
  };

  const handleApplyCrop = (croppedFile: File) => {
    if (!cropTargetItem) return;
    const newPreviewUrl = URL.createObjectURL(croppedFile);
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === cropTargetItem.id) {
          if (f.previewUrl) URL.revokeObjectURL(f.previewUrl);
          if (f.result?.dataUrl) URL.revokeObjectURL(f.result.dataUrl);
          return {
            ...f,
            file: croppedFile,
            previewUrl: newPreviewUrl,
            status: 'idle',
            result: undefined,
          };
        }
        return f;
      })
    );
    setCropModalOpen(false);
    setCropTargetItem(null);
  };

  const handleMergeToPdf = async () => {
    if (files.length === 0 || isMergingPdf) return;
    setIsMergingPdf(true);

    try {
      const pageImages: { jpegBytes: Uint8Array; width: number; height: number }[] = [];

      for (const item of files) {
        const blobUrl = item.result ? item.result.dataUrl : item.previewUrl;
        const res = await fetch(blobUrl);
        const blob = await res.blob();

        const img = new Image();
        const imgLoaded = new Promise<HTMLImageElement>((resolve, reject) => {
          img.onload = () => resolve(img);
          img.onerror = (e) => reject(e);
          img.src = URL.createObjectURL(blob);
        });

        const loadedImg = await imgLoaded;
        const w = loadedImg.naturalWidth || 800;
        const h = loadedImg.naturalHeight || 600;

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, w, h);
          ctx.drawImage(loadedImg, 0, 0, w, h);

          const jpegBlob = await new Promise<Blob | null>((resolve) =>
            canvas.toBlob((b) => resolve(b), 'image/jpeg', 0.85)
          );

          if (jpegBlob) {
            const arrBuffer = await jpegBlob.arrayBuffer();
            pageImages.push({
              jpegBytes: new Uint8Array(arrBuffer),
              width: w,
              height: h,
            });
          }
        }
      }

      if (pageImages.length > 0) {
        const pdfBlob = createMultiPagePdf(pageImages);
        const link = document.createElement('a');
        link.href = URL.createObjectURL(pdfBlob);
        link.download = `omnipic_dokumen_gabung_${Date.now()}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }
    } catch (err) {
      alert('Gagal menggabungkan foto ke PDF: ' + String(err));
    } finally {
      setIsMergingPdf(false);
    }
  };

  // =========================================================================
  // VIDEO & GIF HANDLERS
  // =========================================================================
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setVideoFile(file);
      if (videoUrl) URL.revokeObjectURL(videoUrl);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setGifResultUrl(null);
      setCapturedFrameUrl(null);
      setExtractedAudioUrl(null);
      setVideoStartTime(0);
    }
  };

  const handleCaptureFrame = () => {
    if (!videoPlayerRef.current) return;
    const video = videoPlayerRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      setCapturedFrameUrl(dataUrl);
    }
  };

  const handleSendCapturedFrameToPhotoStudio = async () => {
    if (!capturedFrameUrl) return;
    try {
      const res = await fetch(capturedFrameUrl);
      const blob = await res.blob();
      const file = new File([blob], `video_frame_${Math.round(videoCurrentTime)}s.jpg`, {
        type: 'image/jpeg',
      });
      appendFiles([file]);
      setActiveTool('photo');
      document.getElementById('studio-panel')?.scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      console.warn('Send frame error:', e);
    }
  };

  const handleGenerateGif = async () => {
    if (!videoPlayerRef.current || !videoUrl) return;
    setIsGeneratingGif(true);
    setGifProgress(10);

    try {
      const gifshot = (await import('gifshot')).default;
      const video = videoPlayerRef.current;
      const targetWidth = Math.min(480, video.videoWidth || 480);
      const targetHeight = Math.round(targetWidth * ((video.videoHeight || 360) / (video.videoWidth || 480)));

      gifshot.createGIF(
        {
          video: [videoUrl],
          gifWidth: targetWidth,
          gifHeight: targetHeight,
          interval: 0.1, // 10 fps
          numFrames: Math.min(50, Math.round(gifDuration * 10)),
          offset: videoStartTime,
          progressCallback: (captureProgress: number) => {
            setGifProgress(Math.min(95, Math.round(captureProgress * 100)));
          },
        },
        (obj) => {
          setIsGeneratingGif(false);
          setGifProgress(100);
          if (!obj.error && obj.image) {
            setGifResultUrl(obj.image);
          } else {
            alert('Gagal membuat animasi GIF: ' + (obj.errorMsg || 'Coba potong durasi lebih pendek.'));
          }
        }
      );
    } catch (err) {
      setIsGeneratingGif(false);
      alert('Terjadi kendala saat memproses video: ' + String(err));
    }
  };

  const handleExtractAudio = async () => {
    if (!videoFile) return;
    setIsExtractingAudio(true);
    try {
      const { extractAudioFromVideo } = await import('@/lib/audioExtractor');
      const { blob, filename } = await extractAudioFromVideo(videoFile);
      const url = URL.createObjectURL(blob);
      setExtractedAudioUrl(url);
      setExtractedAudioName(filename);
    } catch (err) {
      alert('Gagal mengekstrak audio dari video: ' + String(err));
    } finally {
      setIsExtractingAudio(false);
    }
  };

  const handleCopyShareLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText('https://omni-pic-convert.vercel.app/');
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // =========================================================================
  // UNIVERSAL MEDIA DOWNLOADER HANDLERS
  // =========================================================================
  const handleFetchMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaInputUrl.trim()) return;

    setIsMediaLoading(true);
    setMediaError(null);
    setMediaResult(null);

    try {
      const res = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: mediaInputUrl.trim() }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Media tidak ditemukan. Pastikan tautan bersifat publik.');
      }

      setMediaResult(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMediaError(msg);
    } finally {
      setIsMediaLoading(false);
    }
  };

  const handleSendMediaToPhotoStudio = async (mediaUrlToLoad: string) => {
    try {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(mediaUrlToLoad)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Gagal mengunduh media dari tautan');
      const blob = await response.blob();
      const file = new File([blob], `media_${Date.now()}.jpg`, { type: 'image/jpeg' });
      appendFiles([file]);
      setActiveTool('photo');
      document.getElementById('studio-panel')?.scrollIntoView({ behavior: 'smooth' });
    } catch (err) {
      alert('Gagal mengirim media ke studio: ' + String(err));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1">
        {/* ========================================================================= */}
        {/* HERO PROMOTION SECTION */}
        {/* ========================================================================= */}
        <section className="relative overflow-hidden border-b border-slate-900 bg-gradient-to-b from-blue-950/20 via-slate-950 to-slate-950 py-8 sm:py-12">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 space-y-5">
            <div className="space-y-2.5">
              <h1 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Studio Serbabisa: Kompres Foto, Olah Video &amp; Unduh Media
              </h1>
              <p className="max-w-2xl mx-auto text-xs sm:text-sm text-slate-400 leading-relaxed">
                Kecilkan foto pas 200 KB untuk SSCASN CPNS, ubah ukuran pas foto 3x4 &amp; 4x6, buat animasi GIF, dan unduh media publik secara instan. 100% diproses langsung di browser Anda.
              </p>
            </div>

            {/* Tool Selection Tabs */}
            <div className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 shadow-lg">
              <button
                onClick={() => setActiveTool('photo')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTool === 'photo'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <ImageIcon className="h-4 w-4" />
                <span>Studio Foto &amp; Kompresi</span>
              </button>

              <button
                onClick={() => setActiveTool('video')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTool === 'video'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Film className="h-4 w-4" />
                <span>Studio Video &amp; GIF</span>
              </button>

              <button
                onClick={() => setActiveTool('downloader')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                  activeTool === 'downloader'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <DownloadCloud className="h-4 w-4" />
                <span>Unduh Media Multi-Platform</span>
              </button>
            </div>
          </div>
        </section>

        {/* Sponsor Banner 1 */}
        <div className="mx-auto max-w-5xl px-4 sm:px-6 pt-6">
          <AdBanner label="Sponsor Rekomendasi" />
        </div>

        {/* ========================================================================= */}
        {/* ACTIVE TOOL STUDIO CONTAINER */}
        {/* ========================================================================= */}
        <section id="studio-panel" className="mx-auto max-w-5xl px-4 py-6 sm:px-6 space-y-8">
          {/* ===================================================================== */}
          {/* TOOL 1: PHOTO STUDIO & COMPRESSOR */}
          {/* ===================================================================== */}
          {activeTool === 'photo' && (
            <div className="space-y-6">
              {/* 1. Drag and Drop Zone (Top First) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingPhoto(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  setIsDraggingPhoto(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDraggingPhoto(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    appendFiles(Array.from(e.dataTransfer.files));
                  }
                }}
                onClick={() => photoInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center p-8 sm:p-12 rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
                  isDraggingPhoto
                    ? 'border-blue-500 bg-blue-950/20'
                    : 'border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60'
                }`}
              >
                <input
                  ref={photoInputRef}
                  type="file"
                  multiple
                  accept="image/*,.heic,.heif"
                  onChange={(e) => {
                    if (e.target.files) {
                      appendFiles(Array.from(e.target.files));
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-500 mb-3">
                  <Upload className="h-6 w-6" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white mb-1 text-center">
                  Tarik foto ke sini atau klik untuk memilih file
                </h3>
                <p className="text-xs text-slate-400 mb-4 text-center max-w-md">
                  Mendukung JPG, PNG, WebP, dan kamera iPhone (.HEIC). 100% diproses langsung di browser Anda.
                </p>
                <button
                  type="button"
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs sm:text-sm font-semibold shadow-md transition-colors"
                >
                  Pilih Foto dari Perangkat
                </button>
              </div>

              {/* 2. Quick Preset Buttons */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono">
                    Pilihan Target Cepat (Sekali Klik)
                  </span>
                  <Link
                    href="/panduan"
                    className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                  >
                    <BookOpen className="h-3.5 w-3.5" />
                    <span>Lihat Panduan Dokumen CPNS &amp; Ukuran Foto</span>
                  </Link>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => applyTargetKbPreset(200)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      mode === 'target' && targetKb === 200
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    200 KB (Standar SSCASN / CPNS &amp; KTP)
                  </button>

                  <button
                    onClick={() => applyTargetKbPreset(100)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      mode === 'target' && targetKb === 100
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    100 KB (Dokumen Kecil)
                  </button>

                  <button
                    onClick={() => applyTargetKbPreset(300)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      mode === 'target' && targetKb === 300
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    300 KB (Pas Foto Ijazah)
                  </button>

                  <button
                    onClick={() => {
                      setPreset('3x4');
                      setOutputFormat('image/jpeg');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      preset === '3x4' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    Pas Foto 3x4 cm
                  </button>

                  <button
                    onClick={() => {
                      setPreset('4x6');
                      setOutputFormat('image/jpeg');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      preset === '4x6' ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    Pas Foto 4x6 cm
                  </button>

                  <button
                    onClick={() => {
                      setBgColor(bgColor === 'red' ? 'none' : 'red');
                      setOutputFormat('image/jpeg');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      bgColor === 'red' ? 'bg-rose-600 text-white shadow-md' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    🔴 Latar Merah (CPNS Ganjil)
                  </button>

                  <button
                    onClick={() => {
                      setBgColor(bgColor === 'blue' ? 'none' : 'blue');
                      setOutputFormat('image/jpeg');
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      bgColor === 'blue' ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                    }`}
                  >
                    🔵 Latar Biru (CPNS Genap)
                  </button>
                </div>
              </div>

              {/* Comprehensive Manipulation Controls */}
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 sm:p-5 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {/* Col 1: Format & Mode */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                      1. Format &amp; Kualitas
                    </label>
                    <div className="space-y-2">
                      <select
                        value={outputFormat}
                        onChange={(e) =>
                          setOutputFormat(
                            e.target.value as 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'
                          )
                        }
                        className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="image/jpeg">JPG / JPEG (Universal &amp; CPNS)</option>
                        <option value="image/png">PNG (Transparansi / Grafis)</option>
                        <option value="image/webp">WebP (Ringkas &amp; Web)</option>
                        <option value="application/pdf">PDF (Dokumen Tunggal)</option>
                      </select>

                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setMode('target')}
                          className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                            mode === 'target' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Target KB
                        </button>
                        <button
                          type="button"
                          onClick={() => setMode('quality')}
                          className={`py-1.5 px-3 rounded-md text-xs font-medium transition-colors ${
                            mode === 'quality' ? 'bg-blue-600 text-white font-semibold' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          Manual
                        </button>
                      </div>

                      {mode === 'target' ? (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Maksimal Ukuran</span>
                            <span className="font-semibold text-white">{targetKb} KB</span>
                          </div>
                          <input
                            type="range"
                            min="20"
                            max="2000"
                            step="10"
                            value={targetKb}
                            onChange={(e) => setTargetKb(Number(e.target.value))}
                            className="w-full accent-blue-600 cursor-pointer"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Kualitas Kompresi</span>
                            <span className="font-semibold text-white">{Math.round(quality * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0.1"
                            max="1.0"
                            step="0.05"
                            value={quality}
                            onChange={(e) => setQuality(Number(e.target.value))}
                            className="w-full accent-blue-600 cursor-pointer"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Col 2: Ukuran & Preset Pas Foto */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                      2. Dimensi &amp; Pas Foto
                    </label>
                    <div className="space-y-2">
                      <select
                        value={preset}
                        onChange={(e) => setPreset(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        {Object.entries(PRESET_DIMENSIONS).map(([key, val]) => (
                          <option key={key} value={key}>
                            {val.label} {val.desc ? `(${val.desc})` : ''}
                          </option>
                        ))}
                      </select>

                      {preset === 'custom' && (
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <div>
                            <span className="text-[10px] text-slate-400">Lebar (px)</span>
                            <input
                              type="number"
                              min="10"
                              max="10000"
                              value={customW}
                              onChange={(e) => {
                                const val = Math.max(10, Math.min(10000, Number(e.target.value) || 800));
                                setCustomW(val);
                              }}
                              className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400">Tinggi (px)</span>
                            <input
                              type="number"
                              min="10"
                              max="10000"
                              value={customH}
                              onChange={(e) => {
                                const val = Math.max(10, Math.min(10000, Number(e.target.value) || 600));
                                setCustomH(val);
                              }}
                              className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-xs text-white"
                            />
                          </div>
                          <label className="flex items-center gap-1.5 text-[10px] text-slate-400 col-span-2 cursor-pointer pt-1">
                            <input
                              type="checkbox"
                              checked={maintainAspect}
                              onChange={(e) => setMaintainAspect(e.target.checked)}
                              className="rounded border-slate-700 bg-slate-950 text-blue-600"
                            />
                            <span>Kunci Rasio Aspek (Proporsional)</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Col 3: Manipulasi Cepat & Filter */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                      3. Edit &amp; Watermark
                    </label>
                    <div className="space-y-2">
                      {/* Rotation and Flips */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setRotation((prev) => (prev + 90) % 360)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium"
                          title="Putar 90 Derajat Searah Jarum Jam"
                        >
                          <RotateCw className="h-3 w-3" />
                          <span>Putar ({rotation}°)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setFlipH((prev) => !prev)}
                          className={`p-1.5 rounded text-xs font-medium transition-colors ${
                            flipH ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                          title="Cermin Horizontal"
                        >
                          <FlipHorizontal className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setFlipV((prev) => !prev)}
                          className={`p-1.5 rounded text-xs font-medium transition-colors ${
                            flipV ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                          }`}
                          title="Cermin Vertikal"
                        >
                          <FlipVertical className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      {/* Filters */}
                      <select
                        value={filter}
                        onChange={(e) =>
                          setFilter(
                            e.target.value as 'none' | 'grayscale' | 'contrast' | 'bright' | 'sepia' | 'scanner'
                          )
                        }
                        className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="none">Filter: Normal</option>
                        <option value="scanner">📑 Mode Scan Dokumen (Kertas Putih Bersih)</option>
                        <option value="grayscale">Hitam-Putih (Fotokopi Dokumen)</option>
                        <option value="contrast">Kontras Tajam (Teks Pudar)</option>
                        <option value="bright">Terangkan (Foto Redup)</option>
                        <option value="sepia">Sepia (Klasik)</option>
                      </select>

                      {/* Background Color Changer */}
                      <select
                        value={bgColor}
                        onChange={(e) =>
                          setBgColor(e.target.value as 'none' | 'red' | 'blue' | 'white')
                        }
                        className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                      >
                        <option value="none">Latar Belakang: Asli (Tanpa Ubah)</option>
                        <option value="red">🔴 Ganti Latar Merah (CPNS Tahun Ganjil)</option>
                        <option value="blue">🔵 Ganti Latar Biru (CPNS Tahun Genap)</option>
                        <option value="white">⚪ Ganti Latar Putih (Visa / Paspor)</option>
                      </select>

                      {bgColor !== 'none' && (
                        <div className="rounded-lg bg-blue-950/40 border border-blue-800/40 p-2.5 text-[11px] text-blue-200/90 leading-relaxed flex items-start gap-2">
                          <span className="shrink-0 text-sm">🛡️</span>
                          <span>
                            <strong>Pelindung Wajah &amp; Kulit Aktif:</strong> Sistem cerdas melindungi area kulit dan wajah agar tidak ikut terwarnai. Optimal untuk foto dengan dinding polos atau foto transparan.
                          </span>
                        </div>
                      )}

                      {/* Watermark */}
                      <input
                        type="text"
                        placeholder="Teks Watermark (opsional)..."
                        value={watermarkText}
                        onChange={(e) => setWatermarkText(e.target.value)}
                        className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Live Interactive Studio Preview Panel */}
              {files.length > 0 && (
                <div id="live-preview-section" className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 sm:p-5 space-y-4 shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600/20 text-blue-400">
                          <Eye className="h-3.5 w-3.5" />
                        </span>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <span>Pratinjau Langsung (Live Preview)</span>
                          {isGeneratingPreview && (
                            <RefreshCw className="h-3 w-3 animate-spin text-blue-400" />
                          )}
                        </h3>
                      </div>
                      <p className="text-xs text-slate-400">
                        Periksa hasil ganti latar merah/biru, pemotongan pas foto, dan efek secara instan sebelum diunduh.
                      </p>
                    </div>

                    {/* Compare Mode Toggle */}
                    <div className="flex items-center gap-1 self-start sm:self-auto bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setPreviewCompareMode('result')}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          previewCompareMode === 'result'
                            ? 'bg-blue-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        ✨ Hasil Edit / Latar
                      </button>
                      <button
                        type="button"
                        onClick={() => setPreviewCompareMode('original')}
                        className={`px-3 py-1 rounded-md font-semibold transition-all ${
                          previewCompareMode === 'original'
                            ? 'bg-slate-800 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        📷 Foto Asli
                      </button>
                    </div>
                  </div>

                  {/* Multiple Photos Selector Tabs (if more than 1 file) */}
                  {files.length > 1 && (
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                      <span className="text-[11px] font-semibold text-slate-400 shrink-0">Pratinjau Foto:</span>
                      {files.map((fileItem, idx) => (
                        <button
                          key={fileItem.id}
                          type="button"
                          onClick={() => setSelectedPreviewIndex(idx)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 flex items-center gap-1.5 ${
                            selectedPreviewIndex === idx
                              ? 'bg-blue-600/25 text-blue-300 border border-blue-500/50'
                              : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
                          }`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${selectedPreviewIndex === idx ? 'bg-blue-400' : 'bg-slate-600'}`}></span>
                          <span className="truncate max-w-[120px]">{fileItem.file.name}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Main Preview Frame Container */}
                  <div className="relative rounded-xl border border-slate-800/90 bg-slate-950 p-4 sm:p-6 flex flex-col items-center justify-center min-h-[280px] sm:min-h-[340px] overflow-hidden">
                    {/* Top-Left Floating Info Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5 z-10 pointer-events-none">
                      {previewCompareMode === 'result' && bgColor !== 'none' && (
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold shadow-md ${
                            bgColor === 'red'
                              ? 'bg-rose-600 text-white border border-rose-400/40'
                              : bgColor === 'blue'
                              ? 'bg-blue-600 text-white border border-blue-400/40'
                              : 'bg-white text-slate-900 border border-slate-300'
                          }`}
                        >
                          <span>
                            {bgColor === 'red'
                              ? '🔴 Latar Merah (CPNS Ganjil)'
                              : bgColor === 'blue'
                              ? '🔵 Latar Biru (CPNS Genap)'
                              : '⚪ Latar Putih Bersih'}
                          </span>
                        </span>
                      )}

                      {preset !== 'original' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 text-[10px] font-mono border border-slate-700 shadow-sm">
                          {preset === '3x4' ? '📐 3x4 cm' : preset === '4x6' ? '📐 4x6 cm' : preset === '2x3' ? '📐 2x3 cm' : preset.toUpperCase()}
                        </span>
                      )}

                      {filter !== 'none' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 text-[10px] font-mono border border-slate-700 shadow-sm">
                          {filter === 'scanner' ? '📑 Scan' : filter.toUpperCase()}
                        </span>
                      )}
                    </div>

                    {/* Top-Right Zoom Button */}
                    <button
                      type="button"
                      onClick={() => setIsZoomModalOpen(true)}
                      className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-lg bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition-colors flex items-center gap-1.5 shadow-md"
                      title="Perbesar Pratinjau Resolusi Tinggi"
                    >
                      <ZoomIn className="h-3.5 w-3.5 text-blue-400" />
                      <span className="hidden sm:inline">Perbesar</span>
                    </button>

                    {/* Image Viewport */}
                    <div className="relative max-w-full flex items-center justify-center my-2">
                      {previewCompareMode === 'original' ? (
                        <img
                          src={files[selectedPreviewIndex]?.previewUrl || ''}
                          alt="Foto Asli"
                          className="max-h-[320px] max-w-full object-contain rounded-lg shadow-2xl border border-slate-800/80 transition-all"
                        />
                      ) : livePreviewUrl ? (
                        <img
                          src={livePreviewUrl}
                          alt="Pratinjau Hasil"
                          className="max-h-[320px] max-w-full object-contain rounded-lg shadow-2xl border border-slate-800/80 transition-all"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 py-12 gap-2">
                          <RefreshCw className="h-6 w-6 animate-spin text-blue-400" />
                          <span className="text-xs">Membuat pratinjau instan...</span>
                        </div>
                      )}
                    </div>

                    {/* Bottom Status Feedback */}
                    <div className="mt-2 text-center">
                      <span className="text-[11px] text-slate-400 font-medium">
                        {previewCompareMode === 'original' ? (
                          'Menampilkan foto asli (sebelum diolah).'
                        ) : bgColor !== 'none' ? (
                          <span>
                            🛡️ <strong>Latar resmi CPNS aktif</strong> dengan proteksi otomatis agar wajah &amp; kulit tidak terwarnai.
                          </span>
                        ) : (
                          'Pratinjau aktif sesuai pengaturan studio saat ini.'
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* File Queue Section */}
              {files.length > 0 && (
                <div className="space-y-4 pt-4 border-t border-slate-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-sm font-semibold text-white">
                      Daftar Antrean ({files.length} Foto)
                    </span>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-1.5"
                      >
                        <Upload className="h-3.5 w-3.5 text-blue-400" />
                        <span>+ Tambah Foto</span>
                      </button>

                      <button
                        onClick={clearAllFiles}
                        className="px-3 py-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white text-xs font-medium transition-colors"
                      >
                        Kosongkan Antrean
                      </button>

                      <button
                        onClick={handleProcessAllPhotos}
                        disabled={isProcessingAll}
                        className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
                      >
                        {isProcessingAll ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Memproses...</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-3.5 w-3.5" />
                            <span>Mulai Kompres ({files.length})</span>
                          </>
                        )}
                      </button>

                      {files.length > 0 && (
                        <button
                          onClick={handleMergeToPdf}
                          disabled={isMergingPdf}
                          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
                          title="Gabungkan semua foto dalam antrean menjadi satu dokumen PDF"
                        >
                          {isMergingPdf ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              <span>Membuat PDF...</span>
                            </>
                          ) : (
                            <>
                              <FileText className="h-3.5 w-3.5" />
                              <span>Gabung Jadi 1 PDF</span>
                            </>
                          )}
                        </button>
                      )}

                      {files.some((f) => f.status === 'done') && (
                        <button
                          onClick={handleDownloadZip}
                          disabled={isZipping}
                          className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/70 text-white text-xs font-semibold shadow-md transition-colors flex items-center gap-1.5"
                        >
                          {isZipping ? (
                            <>
                              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                              <span>Mengompres ZIP...</span>
                            </>
                          ) : (
                            <>
                              <Archive className="h-3.5 w-3.5" />
                              <span>Unduh Semua (.ZIP)</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Queue Items */}
                  <div className="grid grid-cols-1 gap-2.5">
                    {files.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.previewUrl}
                            alt="Preview"
                            className="h-10 w-10 rounded object-cover bg-slate-950 shrink-0 border border-slate-800"
                          />
                          <div className="min-w-0 space-y-0.5">
                            <p className="text-xs font-medium text-white truncate max-w-xs sm:max-w-md">
                              {item.file.name}
                            </p>
                            <div className="flex items-center gap-2 text-[11px] text-slate-400">
                              <span>{formatBytes(item.file.size)}</span>
                              {item.result && (
                                <>
                                  <ArrowRight className="h-2.5 w-2.5 text-slate-600" />
                                  <span className="font-semibold text-emerald-400">
                                    {formatBytes(item.result.compressedSize)}
                                  </span>
                                  {item.file.size > item.result.compressedSize ? (
                                    <span className="text-emerald-400/90 text-[10px]">
                                      ({Math.round(((item.file.size - item.result.compressedSize) / item.file.size) * 100)}% lebih hemat)
                                    </span>
                                  ) : null}
                                  {mode === 'target' && item.result.compressedSize <= targetKb * 1024 && (
                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px] font-semibold border border-emerald-500/30">
                                      <Check className="h-2.5 w-2.5" />
                                      <span>Lolos &le;{targetKb} KB</span>
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const foundIdx = files.findIndex((f) => f.id === item.id);
                              if (foundIdx !== -1) setSelectedPreviewIndex(foundIdx);
                              document.getElementById('live-preview-section')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`px-2.5 py-1 rounded border text-xs font-medium transition-colors flex items-center gap-1 ${
                              selectedPreviewIndex === files.findIndex((f) => f.id === item.id)
                                ? 'border-blue-500/50 bg-blue-600/25 text-blue-300'
                                : 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                            }`}
                            title="Tampilkan foto ini di pratinjau studio"
                          >
                            <Eye className="h-3 w-3 text-blue-400" />
                            <span className="hidden sm:inline">Pratinjau</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenCrop(item)}
                            className="px-2.5 py-1 rounded border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center gap-1"
                            title="Potong atau sesuaikan area foto"
                          >
                            <Crop className="h-3 w-3 text-blue-400" />
                            <span className="hidden sm:inline">Crop</span>
                          </button>

                          {item.status === 'done' && item.result && (
                            <a
                              href={item.result.dataUrl}
                              download={item.result.filename}
                              className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center gap-1"
                            >
                              <Download className="h-3 w-3" />
                              <span>Unduh</span>
                            </a>
                          )}

                          <button
                            onClick={() => removeFile(item.id)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================== */}
          {/* TOOL 2: VIDEO & GIF STUDIO */}
          {/* ===================================================================== */}
          {activeTool === 'video' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Film className="h-5 w-5 text-blue-500" />
                    <span>Studio Manipulasi Video &amp; Animasi GIF</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Ekstrak frame foto beresolusi tinggi dari video atau jadikan potongan video sebagai animasi GIF looping secara instan tanpa software berat.
                  </p>
                </div>

                {/* Upload or Drop Video */}
                {!videoUrl ? (
                  <div
                    onClick={() => videoInputRef.current?.click()}
                    className="flex flex-col items-center justify-center p-10 rounded-xl border-2 border-dashed border-slate-800 hover:border-slate-700 bg-slate-900/40 hover:bg-slate-900/60 cursor-pointer transition-all"
                  >
                    <input
                      ref={videoInputRef}
                      type="file"
                      accept="video/mp4,video/webm,video/ogg,video/quicktime"
                      onChange={handleVideoSelect}
                      className="hidden"
                    />
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-500 mb-3">
                      <Film className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-semibold text-white mb-1">
                      Pilih file video dari komputer / galeri HP
                    </p>
                    <p className="text-xs text-slate-400 mb-3">Mendukung MP4, WebM, dan format rekaman video standar.</p>
                    <button
                      type="button"
                      className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                    >
                      Buka File Video
                    </button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Video Info & Player */}
                    <div className="flex items-center justify-between text-xs text-slate-400 max-w-xl mx-auto px-1">
                      <span className="truncate max-w-xs text-slate-300 font-medium">
                        {videoFile?.name || 'File Video'}
                      </span>
                      <span>{videoFile ? formatBytes(videoFile.size) : ''}</span>
                    </div>

                    <div className="relative rounded-xl overflow-hidden bg-black border border-slate-800 max-w-xl mx-auto">
                      <video
                        ref={videoPlayerRef}
                        src={videoUrl}
                        controls
                        onLoadedMetadata={(e) => {
                          const v = e.currentTarget;
                          setVideoDuration(v.duration);
                        }}
                        onTimeUpdate={(e) => {
                          setVideoCurrentTime(e.currentTarget.currentTime);
                        }}
                        className="w-full max-h-80 object-contain mx-auto"
                      />
                    </div>

                    {/* Timeline Controls & Settings */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto p-4 rounded-xl border border-slate-800 bg-slate-950/60">
                      {/* Capture Frame */}
                      <div className="space-y-3 border-b md:border-b-0 md:border-r border-slate-800 pb-4 md:pb-0 md:pr-4">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                          1. Ambil Foto HD dari Video
                        </span>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Jeda video pada detik yang diinginkan, lalu klik tombol di bawah untuk mengambil gambar beresolusi penuh.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleCaptureFrame}
                            className="flex-1 py-2 px-3 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <Camera className="h-3.5 w-3.5" />
                            <span>Tangkap Foto HD</span>
                          </button>
                        </div>
                      </div>

                      {/* Video to GIF */}
                      <div className="space-y-3">
                        <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                          2. Buat Animasi GIF
                        </span>
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Mulai dari Detik</span>
                            <span className="text-white font-semibold">{videoStartTime.toFixed(1)}s</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={Math.max(0, videoDuration - 1)}
                            step="0.5"
                            value={videoStartTime}
                            onChange={(e) => setVideoStartTime(Number(e.target.value))}
                            className="w-full accent-blue-600 cursor-pointer"
                          />

                          <div className="flex justify-between text-xs text-slate-400">
                            <span>Durasi GIF</span>
                            <span className="text-white font-semibold">{gifDuration} Detik</span>
                          </div>
                          <input
                            type="range"
                            min="1"
                            max="5"
                            step="1"
                            value={gifDuration}
                            onChange={(e) => setGifDuration(Number(e.target.value))}
                            className="w-full accent-blue-600 cursor-pointer"
                          />

                          <button
                            type="button"
                            onClick={handleGenerateGif}
                            disabled={isGeneratingGif}
                            className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                          >
                            {isGeneratingGif ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                <span>Membuat GIF ({gifProgress}%)...</span>
                              </>
                            ) : (
                              <>
                                <Scissors className="h-3.5 w-3.5" />
                                <span>Ekspor Animasi GIF</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      {/* 3. Ekstrak Audio dari Video */}
                      <div className="space-y-3 col-span-1 md:col-span-2 pt-4 border-t border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center gap-1.5">
                            <Volume2 className="h-3.5 w-3.5 text-blue-400" />
                            <span>3. Ekstrak Suara / Musik dari Video</span>
                          </span>
                          <span className="text-[10px] text-slate-400">Format .WAV Berkualitas Tinggi</span>
                        </div>
                        <p className="text-xs text-slate-400">
                          Ambil rekaman suara, podcast, atau audio latar dari video tanpa kompresi yang merusak kualitas.
                        </p>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={handleExtractAudio}
                            disabled={isExtractingAudio}
                            className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:bg-slate-900 border border-slate-700 text-white text-xs font-semibold transition-colors flex items-center gap-2"
                          >
                            {isExtractingAudio ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                                <span>Mengekstrak Suara...</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="h-3.5 w-3.5 text-blue-400" />
                                <span>Ekstrak Trek Audio</span>
                              </>
                            )}
                          </button>

                          {extractedAudioUrl && (
                            <a
                              href={extractedAudioUrl}
                              download={extractedAudioName || 'audio.wav'}
                              className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span>Unduh Audio ({extractedAudioName})</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Captured Frame Preview */}
                    {capturedFrameUrl && (
                      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/80 max-w-xl mx-auto space-y-3">
                        <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" />
                          <span>Foto HD Berhasil Ditangkap!</span>
                        </span>
                        <img
                          src={capturedFrameUrl}
                          alt="Captured Frame"
                          className="w-full max-h-64 object-contain rounded-lg border border-slate-800"
                        />
                        <div className="flex items-center gap-2">
                          <a
                            href={capturedFrameUrl}
                            download={`omnipic_frame_${Date.now()}.jpg`}
                            className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-center text-xs font-semibold text-white transition-colors"
                          >
                            Unduh Foto (.JPG)
                          </a>
                          <button
                            type="button"
                            onClick={handleSendCapturedFrameToPhotoStudio}
                            className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-center text-xs font-semibold text-slate-200 transition-colors"
                          >
                            Kirim ke Studio Foto
                          </button>
                        </div>
                      </div>
                    )}

                    {/* GIF Result Preview */}
                    {gifResultUrl && (
                      <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-950/20 max-w-xl mx-auto space-y-3">
                        <span className="text-xs font-bold text-indigo-400 flex items-center gap-1">
                          <Check className="h-3.5 w-3.5" />
                          <span>Animasi GIF Selesai Dibuat!</span>
                        </span>
                        <img
                          src={gifResultUrl}
                          alt="GIF Result"
                          className="w-full max-h-64 object-contain rounded-lg border border-slate-800"
                        />
                        <a
                          href={gifResultUrl}
                          download={`omnipic_animasi_${Date.now()}.gif`}
                          className="block w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-center text-xs font-semibold text-white transition-colors shadow-md"
                        >
                          Unduh Animasi (.GIF)
                        </a>
                      </div>
                    )}

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setVideoFile(null);
                          setVideoUrl(null);
                          setGifResultUrl(null);
                          setCapturedFrameUrl(null);
                        }}
                        className="text-xs text-slate-500 hover:text-slate-300 underline"
                      >
                        Ganti File Video Lain
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===================================================================== */}
          {/* TOOL 3: UNIVERSAL MEDIA DOWNLOADER */}
          {/* ===================================================================== */}
          {activeTool === 'downloader' && (
            <div className="space-y-6">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 space-y-5">
                <div className="max-w-xl mx-auto text-center space-y-1.5">
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center justify-center gap-2">
                    <DownloadCloud className="h-5 w-5 text-blue-500" />
                    <span>Unduh Media Multi-Platform</span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Masukkan tautan publik dari Instagram, YouTube (Thumbnail HD), TikTok, atau link file gambar langsung.
                  </p>
                </div>

                {/* Search Form */}
                <form onSubmit={handleFetchMedia} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2">
                  <input
                    type="url"
                    value={mediaInputUrl}
                    onChange={(e) => setMediaInputUrl(e.target.value)}
                    placeholder="https://www.instagram.com/p/... atau link YouTube / TikTok..."
                    className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                    required
                  />
                  <button
                    type="submit"
                    disabled={isMediaLoading}
                    className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
                  >
                    {isMediaLoading ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Mencari...</span>
                      </>
                    ) : (
                      <>
                        <Download className="h-3.5 w-3.5" />
                        <span>Ambil Media</span>
                      </>
                    )}
                  </button>
                </form>

                {/* Error Banner */}
                {mediaError && (
                  <div className="max-w-xl mx-auto p-3 rounded-lg border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{mediaError}</span>
                  </div>
                )}

                {/* Supported Badges */}
                <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-400 pt-2">
                  <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/50">
                    Instagram (Post &amp; Reels)
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/50">
                    YouTube (Thumbnail 1080p HD)
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/50">
                    TikTok (Cover &amp; Info)
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/50">
                    Direct Image Link (.JPG, .PNG)
                  </span>
                </div>

                {/* Results Gallery */}
                {mediaResult && (
                  <div className="max-w-2xl mx-auto space-y-4 pt-6 border-t border-slate-800">
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider font-mono">
                          Platform: {mediaResult.platform}
                        </span>
                        <h3 className="text-sm font-bold text-white line-clamp-1">{mediaResult.title}</h3>
                      </div>
                      {mediaResult.author && (
                        <span className="text-xs text-slate-400">Oleh: {mediaResult.author}</span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {mediaResult.media.map((item, idx) => (
                        <div
                          key={idx}
                          className="rounded-xl border border-slate-800 bg-slate-950 overflow-hidden flex flex-col"
                        >
                          <div className="aspect-video relative bg-slate-900 flex items-center justify-center overflow-hidden">
                            <img
                              src={item.thumbnail || item.url}
                              alt="Media Result"
                              className="w-full h-full object-cover"
                            />
                          </div>

                          <div className="p-3 space-y-2 flex-1 flex flex-col justify-between">
                            <p className="text-xs text-slate-300 font-medium line-clamp-1">
                              {item.title || `Media Item ${idx + 1}`}
                            </p>

                            <div className="flex items-center gap-2 pt-1">
                              <a
                                href={`/api/proxy?url=${encodeURIComponent(item.url)}`}
                                download={`omnipic_media_${idx + 1}.jpg`}
                                className="flex-1 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-center text-xs font-semibold text-white transition-colors"
                              >
                                Unduh File
                              </a>

                              <button
                                type="button"
                                onClick={() => handleSendMediaToPhotoStudio(item.url)}
                                className="flex-1 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-center text-xs font-semibold text-slate-200 transition-colors"
                              >
                                Kirim ke Studio
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>

        {/* ========================================================================= */}
        {/* PURE PROMOTIONAL & FEATURE SHOWCASE SECTION */}
        {/* ========================================================================= */}
        <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 space-y-12">
          {/* 3 Core Trust Pillars */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-800">
              <div className="space-y-2 md:pr-6">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <Shield className="h-4 w-4" />
                  <span>100% Privasi di Browser</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Foto dan dokumen tidak pernah diunggah ke server cloud. Semua kompresi dan manipulasi berjalan langsung di memori perangkat Anda.
                </p>
              </div>

              <div className="space-y-2 pt-4 md:pt-0 md:px-6">
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm">
                  <Zap className="h-4 w-4" />
                  <span>Akurasi Target KB Resmi</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pencarian biner adaptif memastikan ukuran file berada tepat di bawah batas ketentuan pendaftaran CPNS/SSCASN tanpa membuat wajah buram.
                </p>
              </div>

              <div className="space-y-2 pt-4 md:pt-0 md:pl-6">
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                  <Archive className="h-4 w-4" />
                  <span>Bebas Kuota &amp; Ringan</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Tanpa registrasi akun atau langganan berbayar. Ekspor puluhan foto sekaligus menjadi satu arsip ZIP atau satukan dalam dokumen PDF rapi.
                </p>
              </div>
            </div>
          </div>

          {/* Ad Banner 2 */}
          <AdBanner label="Sponsor Rekomendasi" />

          {/* Promotional Desktop App & Guide Banners */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Desktop App Promo */}
            <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/30 p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400 font-mono">
                  Aplikasi Windows (.exe)
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Butuh Kompres Ribuan Foto Secara Offline?
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Unduh OmniPic Desktop untuk Windows. Berjalan offline tanpa koneksi internet, mendukung antrean batch besar, dan 100% open-source.
                </p>
              </div>
              <a
                href="https://github.com/muammarRM/OmniPic-Convert/releases"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white text-xs font-semibold transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-blue-400" />
                <span>Unduh OmniPic Desktop (.exe)</span>
                <ExternalLink className="h-3 w-3 text-slate-500 ml-1" />
              </a>
            </div>

            {/* Panduan & FAQ Redirect Banner */}
            <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/30 p-6 space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 font-mono">
                  Pusat Informasi &amp; Bantuan
                </span>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Panduan Resmi CPNS &amp; Standar Pas Foto
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Pelajari ketentuan ukuran pas foto 2x3, 3x4, 4x6 cm, tips dokumen SSCASN agar lolos verifikasi administrasi, dan FAQ privasi.
                </p>
              </div>
              <Link
                href="/panduan"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors shadow-md"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Buka Panduan &amp; Tanya Jawab (FAQ)</span>
                <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </div>
          </div>

          {/* Viral Social Share Card */}
          <div className="rounded-xl border border-blue-500/30 bg-gradient-to-r from-blue-950/40 via-slate-900 to-indigo-950/40 p-6 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="space-y-1 text-center sm:text-left">
              <h3 className="text-sm sm:text-base font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                <Share2 className="h-4 w-4 text-blue-400" />
                <span>Bantu Rekan Pejuang CPNS &amp; Teman Kerja Anda</span>
              </h3>
              <p className="text-xs text-slate-400 max-w-xl">
                Bagikan OmniPic ke grup WhatsApp atau Telegram agar rekan yang butuh kompresi pas foto 200 KB tidak perlu bayar jasa percetakan.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
              <a
                href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                  'Halo! Jika butuh kompres foto 200 KB untuk berkas resmi CPNS/KTP atau ubah ukuran pas foto 3x4 & 4x6 gratis dan cepat, gunakan OmniPic di sini: https://omni-pic-convert.vercel.app/'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md"
              >
                <span>Bagikan ke WhatsApp</span>
              </a>

              <a
                href={`https://t.me/share/url?url=${encodeURIComponent(
                  'https://omni-pic-convert.vercel.app/'
                )}&text=${encodeURIComponent(
                  'OmniPic - Studio kompres foto 200 KB resmi CPNS & olah video gratis di browser.'
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-md"
              >
                <span>Telegram</span>
              </a>

              <button
                type="button"
                onClick={handleCopyShareLink}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center gap-1.5"
              >
                {copiedLink ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Salin Link Web</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </section>
      </main>

      <CropModal
        isOpen={cropModalOpen}
        file={cropTargetItem?.file || null}
        onClose={() => {
          setCropModalOpen(false);
          setCropTargetItem(null);
        }}
        onApplyCrop={handleApplyCrop}
      />

      {/* High-Resolution Inspection Zoom Modal */}
      {isZoomModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="relative max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-600/20 text-blue-400">
                  <ZoomIn className="h-4 w-4" />
                </span>
                <div>
                  <h4 className="text-sm font-bold text-white">Inspeksi Pratinjau Resolusi Tinggi</h4>
                  <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                    {files[selectedPreviewIndex]?.file.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-semibold transition-colors"
              >
                ✕ Tutup
              </button>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-950 rounded-xl p-3 border border-slate-800 min-h-[260px]">
              <img
                src={previewCompareMode === 'original' ? files[selectedPreviewIndex]?.previewUrl : (livePreviewUrl || files[selectedPreviewIndex]?.previewUrl)}
                alt="High-Res Zoom Inspection"
                className="max-h-[60vh] max-w-full object-contain rounded-lg shadow-lg"
              />
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-400">
              <span>Periksa kerapian tepian rambut, bahu, dan kebersihan latar foto sebelum mengunduh.</span>
              <button
                type="button"
                onClick={() => setIsZoomModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors text-center"
              >
                Selesai Memeriksa
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
            <span>Memuat OmniPic Studio...</span>
          </div>
        </div>
      }
    >
      <HomeContent />
    </Suspense>
  );
}
