'use client';

import React, { useState, useRef, useCallback } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AdBanner from '@/components/AdBanner';
import {
  processImage,
  ConvertOptions,
  ConvertResult,
  formatBytes,
  PRESET_DIMENSIONS,
} from '@/lib/converter';
import JSZip from 'jszip';
import {
  UploadCloud,
  Sparkles,
  Download,
  Trash2,
  Sliders,
  ArrowRight,
  Wand2,
  RefreshCw,
  AlertCircle,
  FolderArchive,
} from 'lucide-react';

function InstagramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

interface FileQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  result?: ConvertResult;
  error?: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<'converter' | 'instagram'>('converter');

  // Converter Settings State
  const [outputFormat, setOutputFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'>('image/jpeg');
  const [mode, setMode] = useState<'target' | 'quality'>('target');
  const [targetKb, setTargetKb] = useState<number>(200);
  const [quality, setQuality] = useState<number>(0.85);
  const [preset, setPreset] = useState<string>('original');
  const [customW, setCustomW] = useState<number>(800);
  const [customH, setCustomH] = useState<number>(600);
  const [maintainAspect, setMaintainAspect] = useState<boolean>(true);

  // Files Queue State
  const [files, setFiles] = useState<FileQueueItem[]>([]);
  const [isProcessingAll, setIsProcessingAll] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Instagram State
  const [igUrl, setIgUrl] = useState<string>('');
  const [igLoading, setIgLoading] = useState<boolean>(false);
  const [igError, setIgError] = useState<string | null>(null);
  const [igResult, setIgResult] = useState<{
    author: string;
    caption: string;
    media: { url: string; thumbnail?: string }[];
  } | null>(null);

  // Drag and Drop Handler
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      appendFiles(Array.from(e.dataTransfer.files));
    }
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      appendFiles(Array.from(e.target.files));
      e.target.value = '';
    }
  };

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

  // Process a single item
  const processItem = async (item: FileQueueItem): Promise<FileQueueItem> => {
    const options: ConvertOptions = {
      outputFormat,
      quality,
      targetSizeKb: mode === 'target' ? targetKb : undefined,
      resizePreset: preset as ConvertOptions['resizePreset'],
      customWidth: preset === 'custom' ? customW : undefined,
      customHeight: preset === 'custom' ? customH : undefined,
      maintainAspectRatio: maintainAspect,
    };

    try {
      const result = await processImage(item.file, options);
      return { ...item, status: 'done', result };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { ...item, status: 'error', error: msg };
    }
  };

  // Convert all items in queue
  const handleProcessAll = async () => {
    if (files.length === 0 || isProcessingAll) return;
    setIsProcessingAll(true);

    const updated = [...files];
    for (let i = 0; i < updated.length; i++) {
      updated[i] = { ...updated[i], status: 'processing' };
      setFiles([...updated]);
      updated[i] = await processItem(updated[i]);
      setFiles([...updated]);
    }

    setIsProcessingAll(false);
  };

  // Download all as ZIP
  const handleDownloadZip = async () => {
    const doneItems = files.filter((f) => f.status === 'done' && f.result);
    if (doneItems.length === 0) return;

    const zip = new JSZip();
    doneItems.forEach((item, index) => {
      if (item.result) {
        const name = item.result.filename || `image_${index + 1}.jpg`;
        zip.file(name, item.result.blob);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `OmniPic_Batch_${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  };

  // Instagram Grabber Submit
  const handleFetchInstagram = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!igUrl.trim()) return;

    setIgLoading(true);
    setIgError(null);
    setIgResult(null);

    try {
      const res = await fetch('/api/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: igUrl }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengambil gambar dari Instagram.');
      }

      setIgResult({
        author: data.author || 'Instagram User',
        caption: data.caption || '',
        media: data.media || [],
      });
    } catch (err: unknown) {
      setIgError(err instanceof Error ? err.message : String(err));
    } finally {
      setIgLoading(false);
    }
  };

  // Send Instagram image to Converter Studio
  const handleSendToConverter = async (imgUrl: string) => {
    try {
      // Use proxy to avoid CORS
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(imgUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Gagal mengunduh media dari Instagram');
      const blob = await response.blob();
      const file = new File([blob], `instagram_${Date.now()}.jpg`, { type: 'image/jpeg' });
      appendFiles([file]);
      setActiveTab('converter');
    } catch (err) {
      alert('Gagal mentransfer foto ke studio: ' + String(err));
    }
  };

  const doneCount = files.filter((f) => f.status === 'done').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />

      {/* Top AdSense Slot Banner */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 w-full pt-4">
        <AdBanner label="Sponsor Banner / Iklan Teratas" />
      </div>

      <main className="flex-1 mx-auto max-w-7xl px-4 py-6 sm:px-6 w-full space-y-8">
        {/* Hero Header */}
        <div className="text-center space-y-3 max-w-3xl mx-auto pt-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Studio Konversi, Kompresi Presisi, & Instagram Grabber</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
            Konversi & Kecilkan Ukuran Foto <span className="text-blue-500">Tanpa Batas</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400">
            Selesaikan urusan foto CPNS, BUMN, KTP, dan pas foto dalam hitungan detik. Tanpa login, 100% aman langsung di browser Anda.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-xl bg-slate-900 p-1 border border-slate-800">
            <button
              onClick={() => setActiveTab('converter')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'converter'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sliders className="h-4 w-4" />
              <span>Universal Image Studio</span>
            </button>
            <button
              onClick={() => setActiveTab('instagram')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'instagram'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <InstagramIcon className="h-4 w-4 text-rose-400" />
              <span>Instagram Photo Grabber</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CONVERTER & COMPRESSOR STUDIO */}
        {/* ========================================================================= */}
        {activeTab === 'converter' && (
          <div className="space-y-6">
            {/* Control Panel Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Settings Column */}
              <div className="lg:col-span-1 rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sliders className="h-4 w-4 text-blue-400" />
                    Pengaturan Ekspor
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                    Presets
                  </span>
                </div>

                {/* Format Output */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">Format Tujuan</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'image/jpeg', label: 'JPG' },
                      { id: 'image/png', label: 'PNG' },
                      { id: 'image/webp', label: 'WebP' },
                      { id: 'application/pdf', label: 'PDF' },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        onClick={() => setOutputFormat(fmt.id as ConvertOptions['outputFormat'])}
                        className={`py-2 px-2 rounded-lg text-xs font-mono font-medium border transition-colors ${
                          outputFormat === fmt.id
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-800/80 border-slate-700/60 text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Compression Mode: Target KB vs Quality Slider */}
                <div className="space-y-3 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-300">Mode Optimasi</label>
                    <div className="flex rounded-md bg-slate-800 p-0.5 text-[11px] font-medium">
                      <button
                        onClick={() => setMode('target')}
                        className={`px-2 py-0.5 rounded ${
                          mode === 'target' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Target KB
                      </button>
                      <button
                        onClick={() => setMode('quality')}
                        className={`px-2 py-0.5 rounded ${
                          mode === 'quality' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Kualitas %
                      </button>
                    </div>
                  </div>

                  {mode === 'target' ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={targetKb}
                          onChange={(e) => setTargetKb(Math.max(10, parseInt(e.target.value) || 10))}
                          className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-sm text-white font-mono focus:border-blue-500 focus:outline-none"
                          placeholder="Contoh: 200"
                        />
                        <span className="text-xs font-mono text-slate-400 bg-slate-800 px-3 py-2 rounded-lg border border-slate-700">
                          KB
                        </span>
                      </div>
                      {/* Fast chips */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] text-slate-500">Cepat:</span>
                        {[100, 200, 300, 500].map((kb) => (
                          <button
                            key={kb}
                            onClick={() => setTargetKb(kb)}
                            className={`text-[11px] font-mono px-2 py-0.5 rounded border transition-colors ${
                              targetKb === kb
                                ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            &le; {kb} KB
                          </button>
                        ))}
                      </div>
                      <p className="text-[11px] text-slate-500">
                        *Cocok untuk unggah SSCASN CPNS / BUMN yang mensyaratkan foto maksimal 200 KB.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs font-mono text-slate-400">
                        <span>Kompresi</span>
                        <span className="text-blue-400 font-semibold">{Math.round(quality * 100)}%</span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1.0"
                        step="0.05"
                        value={quality}
                        onChange={(e) => setQuality(parseFloat(e.target.value))}
                        className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
                      />
                    </div>
                  )}
                </div>

                {/* Resize & Pas Foto Presets */}
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <label className="text-xs font-medium text-slate-300">Preset Ukuran & Pas Foto</label>
                  <select
                    value={preset}
                    onChange={(e) => setPreset(e.target.value)}
                    className="w-full rounded-lg bg-slate-950 border border-slate-800 px-3 py-2 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    {Object.entries(PRESET_DIMENSIONS).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label} {val.desc ? `— ${val.desc}` : ''}
                      </option>
                    ))}
                  </select>

                  {preset === 'custom' && (
                    <div className="space-y-2 pt-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400">Lebar (px)</span>
                          <input
                            type="number"
                            value={customW}
                            onChange={(e) => setCustomW(parseInt(e.target.value) || 100)}
                            className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-xs font-mono"
                          />
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400">Tinggi (px)</span>
                          <input
                            type="number"
                            value={customH}
                            onChange={(e) => setCustomH(parseInt(e.target.value) || 100)}
                            className="w-full rounded bg-slate-950 border border-slate-800 px-2 py-1 text-xs font-mono"
                          />
                        </div>
                      </div>
                      <label className="flex items-center gap-2 text-[11px] text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={maintainAspect}
                          onChange={(e) => setMaintainAspect(e.target.checked)}
                          className="rounded bg-slate-950 border-slate-700 accent-blue-600"
                        />
                        <span>Pertahankan Aspek Rasio</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              {/* Upload & Queue Column */}
              <div className="lg:col-span-2 space-y-4">
                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
                    isDragging
                      ? 'border-blue-500 bg-blue-500/10 scale-[1.01]'
                      : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,.heic,.heif"
                    onChange={handleFileInput}
                    className="hidden"
                  />
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600/10 text-blue-500 border border-blue-500/20">
                    <UploadCloud className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-white">
                      Tarik & Jatuhkan Gambar ke sini, atau <span className="text-blue-400">Pilih File</span>
                    </p>
                    <p className="text-xs text-slate-400">
                      Mendukung JPG, PNG, WebP, HEIC/HEIF iPhone, GIF, BMP (Bisa batch banyak foto sekaligus)
                    </p>
                  </div>
                </div>

                {/* Queue Summary and Batch Actions */}
                {files.length > 0 && (
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-semibold text-white">{files.length} Gambar</span>
                      <span className="text-slate-500">|</span>
                      <span className="text-emerald-400 font-mono">{doneCount} Selesai</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={clearAllFiles}
                        disabled={isProcessingAll}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        <span>Hapus Semua</span>
                      </button>

                      {doneCount > 0 && (
                        <button
                          onClick={handleDownloadZip}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors shadow-sm"
                        >
                          <FolderArchive className="h-3.5 w-3.5" />
                          <span>Unduh ZIP ({doneCount})</span>
                        </button>
                      )}

                      <button
                        onClick={handleProcessAll}
                        disabled={isProcessingAll}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50 shadow-md shadow-blue-600/20"
                      >
                        {isProcessingAll ? (
                          <>
                            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                            <span>Memproses...</span>
                          </>
                        ) : (
                          <>
                            <Wand2 className="h-3.5 w-3.5" />
                            <span>Proses Semua</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {/* Queue Items List */}
                <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                  {files.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-800/80 bg-slate-900/50 hover:border-slate-700/80 transition-colors"
                    >
                      {/* Left: Thumbnail & Name */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 rounded-lg bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.previewUrl}
                            alt={item.file.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="text-xs font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                            {item.file.name}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                            <span>Asli: {formatBytes(item.file.size)}</span>
                            {item.result && (
                              <>
                                <ArrowRight className="h-2.5 w-2.5 text-slate-500" />
                                <span className="text-emerald-400 font-semibold">
                                  {formatBytes(item.result.compressedSize)}
                                </span>
                                <span className="rounded bg-emerald-500/10 px-1 py-0.2 text-[10px] text-emerald-400 border border-emerald-500/20">
                                  -
                                  {Math.round(
                                    ((item.file.size - item.result.compressedSize) / item.file.size) * 100
                                  )}
                                  %
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right: Status / Action */}
                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === 'idle' && (
                          <span className="text-[11px] text-slate-400 font-mono">Menunggu</span>
                        )}
                        {item.status === 'processing' && (
                          <div className="flex items-center gap-1.5 text-[11px] text-blue-400 font-mono">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Memproses</span>
                          </div>
                        )}
                        {item.status === 'done' && item.result && (
                          <a
                            href={item.result.dataUrl}
                            download={item.result.filename}
                            className="flex items-center gap-1 px-2.5 py-1 rounded bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 text-xs font-mono font-medium transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            <span>Unduh</span>
                          </a>
                        )}
                        {item.status === 'error' && (
                          <span className="text-[11px] text-rose-400 font-mono" title={item.error}>
                            Gagal
                          </span>
                        )}

                        <button
                          onClick={() => removeFile(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INSTAGRAM PHOTO GRABBER */}
        {/* ========================================================================= */}
        {activeTab === 'instagram' && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono">
                <InstagramIcon className="h-3.5 w-3.5" />
                <span>Pengunduh Foto Postingan & Reels Publik</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white">
                Ambil & Konversi Foto dari Instagram
              </h2>
              <p className="text-xs sm:text-sm text-slate-400">
                Tempelkan tautan link postingan Instagram publik Anda. Foto dapat diunduh langsung atau dikirim instan ke Converter Studio.
              </p>
            </div>

            <form onSubmit={handleFetchInstagram} className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={igUrl}
                onChange={(e) => setIgUrl(e.target.value)}
                placeholder="https://www.instagram.com/p/C3x9abc..."
                className="flex-1 rounded-lg bg-slate-950 border border-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-rose-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={igLoading}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold bg-rose-600 hover:bg-rose-500 text-white transition-colors disabled:opacity-50 shadow-md shadow-rose-600/20"
              >
                {igLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>Mengambil...</span>
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    <span>Ambil Foto</span>
                  </>
                )}
              </button>
            </form>

            {igError && (
              <div className="max-w-2xl mx-auto p-4 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{igError}</span>
              </div>
            )}

            {/* Instagram Result Gallery */}
            {igResult && (
              <div className="max-w-3xl mx-auto space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">@{igResult.author}</span>
                    <span>• {igResult.media.length} Foto Ditemukan</span>
                  </div>
                  {igResult.caption && (
                    <span className="truncate max-w-[250px] text-slate-500">{igResult.caption}</span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {igResult.media.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-3 space-y-3 overflow-hidden"
                    >
                      <div className="aspect-square rounded-md overflow-hidden bg-slate-900 flex items-center justify-center">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.url}
                          alt="Instagram Media"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/api/proxy?url=${encodeURIComponent(item.url)}`}
                          download={`instagram_${Date.now()}_${idx + 1}.jpg`}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
                        >
                          <Download className="h-3.5 w-3.5" />
                          <span>Download Foto</span>
                        </a>
                        <button
                          onClick={() => handleSendToConverter(item.url)}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white transition-colors"
                        >
                          <Wand2 className="h-3.5 w-3.5" />
                          <span>Kirim ke Studio</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* In-content Responsive Ad Banner */}
        <AdBanner label="In-Content Ad Banner / Ruang Iklan Tengah" />

        {/* Future Roadmap / Fitur Saran Kedepannya */}
        <section className="rounded-xl border border-slate-800/80 bg-slate-900/40 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-400" />
                Rencana & Saran Fitur Kedepannya (Roadmap)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Peluang monetisasi dan fitur lanjutan untuk memperluas audiens & traffic organik.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
              Future Plan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-semibold text-blue-400">01. AI Background Remover</span>
              <p className="text-xs text-slate-300">
                Hapus latar belakang foto merah/biru pas foto secara instan menggunakan model WASM lokal di browser.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-semibold text-emerald-400">02. Auto Face Centering</span>
              <p className="text-xs text-slate-300">
                Deteksi wajah otomatis untuk crop proporsional rasio pas foto resmi standar ICAO / paspor Indonesia.
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-semibold text-amber-400">03. Watermark Stamping</span>
              <p className="text-xs text-slate-300">
                Fitur proteksi watermark massal untuk KTP atau dokumen sensitif (misal: &ldquo;VERIFIKASI PINJAMAN TGL XX&rdquo;).
              </p>
            </div>

            <div className="p-4 rounded-lg bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-xs font-mono font-semibold text-purple-400">04. Multi-Platform Reels / TikTok</span>
              <p className="text-xs text-slate-300">
                Perluasan pengunduh cover thumbnail & foto carousel ke platform TikTok, Pinterest, dan Twitter/X.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
