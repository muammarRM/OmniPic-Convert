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
  Upload,
  Download,
  Trash2,
  Sliders,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Archive,
  HelpCircle,
  Shield,
  Zap,
} from 'lucide-react';

interface FileQueueItem {
  id: string;
  file: File;
  previewUrl: string;
  status: 'idle' | 'processing' | 'done' | 'error';
  result?: ConvertResult;
  error?: string;
}

function InstagramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
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
      if (updated[i].status === 'done') continue;
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
        const name = item.result.filename || `foto_${index + 1}.jpg`;
        zip.file(name, item.result.blob);
      }
    });

    const content = await zip.generateAsync({ type: 'blob' });
    const downloadUrl = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `OmniPic_${Date.now()}.zip`;
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
        author: data.author || 'Pengguna Instagram',
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
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(imgUrl)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) throw new Error('Gagal mengunduh media dari Instagram');
      const blob = await response.blob();
      const file = new File([blob], `instagram_${Date.now()}.jpg`, { type: 'image/jpeg' });
      appendFiles([file]);
      setActiveTab('converter');
    } catch (err) {
      alert('Gagal mengirim foto ke kompresor: ' + String(err));
    }
  };

  const doneCount = files.filter((f) => f.status === 'done').length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      <Navbar />

      <main className="flex-1 mx-auto max-w-5xl px-4 py-8 sm:px-6 w-full space-y-8">
        {/* Clean, Human Headline - No AI Eyebrow Chip */}
        <div className="text-center space-y-2 max-w-2xl mx-auto pt-2">
          <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-white">
            Kompres &amp; Konversi Foto Online
          </h1>
          <p className="text-sm text-slate-400">
            Kecilkan ukuran file foto (misal &lt; 200 KB untuk CPNS/KTP), ubah format JPG, PNG, WebP, HEIC iPhone, atau simpan foto Instagram. Cepat dan 100% aman langsung di browser.
          </p>
        </div>

        {/* Minimalist Tab Navigation */}
        <div className="flex justify-center">
          <div className="inline-flex rounded-lg bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setActiveTab('converter')}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'converter'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Kompres &amp; Ubah Format
            </button>
            <button
              onClick={() => setActiveTab('instagram')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'instagram'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <InstagramIcon className="h-3.5 w-3.5" />
              <span>Unduh Foto Instagram</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* TAB 1: CONVERTER & COMPRESSOR */}
        {/* ========================================================================= */}
        {activeTab === 'converter' && (
          <div id="kompresor" className="space-y-6">
            {/* Primary Dropzone - Clear & Inviting */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-950/20'
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

              <div className="max-w-md mx-auto space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-600/10 text-blue-400">
                  <Upload className="h-6 w-6" />
                </div>

                <div className="space-y-1">
                  <div className="inline-block px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold shadow-sm transition-colors">
                    Pilih Foto
                  </div>
                  <p className="text-xs text-slate-400 pt-2">
                    atau tarik dan lepas file foto langsung ke sini
                  </p>
                </div>

                <p className="text-[11px] text-slate-400">
                  Mendukung JPG, PNG, WebP, HEIC iPhone • Bisa pilih banyak foto sekaligus
                </p>
              </div>
            </div>

            {/* Practical Settings Bar */}
            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-5 space-y-5">
              <div className="flex items-center gap-2 text-xs font-semibold text-white">
                <Sliders className="h-4 w-4 text-blue-400" />
                <span>Pengaturan Kompresi &amp; Hasil</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* 1. Format */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-medium">Format Tujuan</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { id: 'image/jpeg', label: 'JPG' },
                      { id: 'image/png', label: 'PNG' },
                      { id: 'image/webp', label: 'WebP' },
                      { id: 'application/pdf', label: 'PDF' },
                    ].map((fmt) => (
                      <button
                        key={fmt.id}
                        type="button"
                        onClick={() => setOutputFormat(fmt.id as ConvertOptions['outputFormat'])}
                        className={`py-2 px-1 text-center text-xs font-medium rounded-md border transition-colors ${
                          outputFormat === fmt.id
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                      >
                        {fmt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Target Size vs Quality */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-slate-300 font-medium">Batas Ukuran</label>
                    <div className="flex text-[11px] text-slate-400 gap-2">
                      <button
                        type="button"
                        onClick={() => setMode('target')}
                        className={`hover:text-white ${mode === 'target' ? 'text-blue-400 font-medium underline' : ''}`}
                      >
                        Target KB
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setMode('quality')}
                        className={`hover:text-white ${mode === 'quality' ? 'text-blue-400 font-medium underline' : ''}`}
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
                          className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-white focus:border-blue-500 focus:outline-none"
                          placeholder="Maksimal KB"
                        />
                        <span className="text-xs text-slate-400 bg-slate-950 px-2.5 py-1.5 rounded-md border border-slate-800">
                          KB
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[11px]">
                        {[100, 200, 300, 500].map((kb) => (
                          <button
                            key={kb}
                            type="button"
                            onClick={() => setTargetKb(kb)}
                            className={`px-2 py-0.5 rounded border transition-colors ${
                              targetKb === kb
                                ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            &le;{kb}KB
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 pt-1">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Kualitas Gambar</span>
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

                {/* 3. Resize & Pas Foto */}
                <div className="space-y-2">
                  <label className="text-xs text-slate-300 font-medium">Ukuran &amp; Pas Foto</label>
                  <select
                    value={preset}
                    onChange={(e) => setPreset(e.target.value)}
                    className="w-full rounded-md bg-slate-950 border border-slate-800 px-3 py-1.5 text-xs text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    {Object.entries(PRESET_DIMENSIONS).map(([key, val]) => (
                      <option key={key} value={key}>
                        {val.label} {val.desc ? `(${val.desc})` : ''}
                      </option>
                    ))}
                  </select>

                  {preset === 'custom' && (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <input
                        type="number"
                        placeholder="Lebar (px)"
                        value={customW}
                        onChange={(e) => setCustomW(parseInt(e.target.value) || 100)}
                        className="rounded-md bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-white"
                      />
                      <input
                        type="number"
                        placeholder="Tinggi (px)"
                        value={customH}
                        onChange={(e) => setCustomH(parseInt(e.target.value) || 100)}
                        className="rounded-md bg-slate-950 border border-slate-800 px-2.5 py-1 text-xs text-white"
                      />
                      <label className="col-span-2 flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer pt-0.5">
                        <input
                          type="checkbox"
                          checked={maintainAspect}
                          onChange={(e) => setMaintainAspect(e.target.checked)}
                          className="rounded bg-slate-950 border-slate-700 accent-blue-600"
                        />
                        <span>Pertahankan rasio proporsional</span>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* File Queue Section */}
            {files.length > 0 && (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 px-4 py-3 rounded-lg">
                  <div className="text-xs text-slate-300">
                    <span className="font-semibold text-white">{files.length} foto dipilih</span>
                    {doneCount > 0 && (
                      <span className="text-emerald-400 ml-2">({doneCount} selesai dikompres)</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={clearAllFiles}
                      disabled={isProcessingAll}
                      className="px-3 py-1.5 text-xs text-slate-400 hover:text-rose-400 transition-colors"
                    >
                      Hapus Semua
                    </button>

                    {doneCount > 0 && (
                      <button
                        type="button"
                        onClick={handleDownloadZip}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                      >
                        <Archive className="h-3.5 w-3.5" />
                        <span>Unduh Semua (.ZIP)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={handleProcessAll}
                      disabled={isProcessingAll}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
                    >
                      {isProcessingAll ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                          <span>Memproses...</span>
                        </>
                      ) : (
                        <span>Mulai Kompres</span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Queue List */}
                <div className="space-y-2">
                  {files.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 p-3 rounded-lg border border-slate-800/80 bg-slate-900/50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-md bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={item.previewUrl}
                            alt={item.file.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-white truncate max-w-[180px] sm:max-w-xs">
                            {item.file.name}
                          </p>
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                            <span>{formatBytes(item.file.size)}</span>
                            {item.result && (
                              <>
                                <ArrowRight className="h-2.5 w-2.5 text-slate-500" />
                                <span className="text-emerald-400 font-medium">
                                  {formatBytes(item.result.compressedSize)}
                                </span>
                                <span className="text-[10px] text-emerald-400">
                                  (-
                                  {Math.round(
                                    ((item.file.size - item.result.compressedSize) / item.file.size) * 100
                                  )}
                                  %)
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {item.status === 'idle' && (
                          <span className="text-[11px] text-slate-400">Siap</span>
                        )}
                        {item.status === 'processing' && (
                          <div className="flex items-center gap-1 text-[11px] text-blue-400">
                            <RefreshCw className="h-3 w-3 animate-spin" />
                            <span>Proses...</span>
                          </div>
                        )}
                        {item.status === 'done' && item.result && (
                          <a
                            href={item.result.dataUrl}
                            download={item.result.filename}
                            className="flex items-center gap-1 px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors"
                          >
                            <Download className="h-3 w-3" />
                            <span>Unduh</span>
                          </a>
                        )}
                        {item.status === 'error' && (
                          <span className="text-[11px] text-rose-400" title={item.error}>
                            Gagal
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => removeFile(item.id)}
                          className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: INSTAGRAM PHOTO GRABBER */}
        {/* ========================================================================= */}
        {activeTab === 'instagram' && (
          <div id="instagram" className="rounded-xl border border-slate-800 bg-slate-900/60 p-6 sm:p-8 space-y-6">
            <div className="max-w-xl mx-auto text-center space-y-1.5">
              <h2 className="text-lg sm:text-xl font-bold text-white">
                Unduh Foto dari Instagram
              </h2>
              <p className="text-xs text-slate-400">
                Tempel link postingan foto atau carousel publik dari Instagram.
              </p>
            </div>

            <form onSubmit={handleFetchInstagram} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2">
              <input
                type="url"
                value={igUrl}
                onChange={(e) => setIgUrl(e.target.value)}
                placeholder="https://www.instagram.com/p/..."
                className="flex-1 rounded-md bg-slate-950 border border-slate-800 px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                required
              />
              <button
                type="submit"
                disabled={igLoading}
                className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-50"
              >
                {igLoading ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    <span>Mengambil...</span>
                  </>
                ) : (
                  <span>Ambil Foto</span>
                )}
              </button>
            </form>

            {igError && (
              <div className="max-w-xl mx-auto p-3 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{igError}</span>
              </div>
            )}

            {/* Instagram Result Gallery */}
            {igResult && (
              <div className="max-w-2xl mx-auto space-y-4 pt-4 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-medium text-white">@{igResult.author}</span>
                  <span>{igResult.media.length} foto ditemukan</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {igResult.media.map((item, idx) => (
                    <div
                      key={idx}
                      className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 space-y-2.5 overflow-hidden"
                    >
                      <div className="aspect-square rounded bg-slate-900 overflow-hidden flex items-center justify-center">
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
                          className="flex-1 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-center text-xs font-medium text-slate-200 transition-colors"
                        >
                          Unduh
                        </a>
                        <button
                          type="button"
                          onClick={() => handleSendToConverter(item.url)}
                          className="flex-1 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-center text-xs font-medium text-white transition-colors"
                        >
                          Kirim ke Kompresor
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Clean Editorial Ad Slot */}
        <AdBanner label="Sponsor" />

        {/* Helpful, Human Practical Guide (Replaces the AI Slop 4-Column Feature Grid) */}
        <section className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-6 sm:p-8 space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-white">Panduan &amp; Pertanyaan Umum</h3>
            <p className="text-xs text-slate-400">
              Informasi praktis seputar kompresi dokumen resmi dan keamanan file Anda.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2 text-xs">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Zap className="h-4 w-4 text-blue-400 shrink-0" />
                <h4>Cara Kompres Foto Jadi 200 KB</h4>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Pilih tab <strong>Target KB</strong>, ketik angka <strong>200</strong>, lalu klik <strong>Mulai Kompres</strong>. Algoritma otomatis menyesuaikan kompresi agar ukuran file tepat berada di bawah batas maksimal 200 KB tanpa membuat foto pecah.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-white">
                <Shield className="h-4 w-4 text-emerald-400 shrink-0" />
                <h4>Apakah Foto Saya Aman?</h4>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Sangat aman. Semua proses kompresi dan konversi berlangsung 100% di memori perangkat Anda (client-side Canvas). Foto Anda tidak pernah dikirim, disimpan, atau diproses di server kami.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 font-semibold text-white">
                <HelpCircle className="h-4 w-4 text-amber-400 shrink-0" />
                <h4>Konversi Foto iPhone (.HEIC)</h4>
              </div>
              <p className="text-slate-400 leading-relaxed">
                File foto dari iPhone berformat HEIC/HEIF dapat langsung dimasukkan ke dropzone. Sistem akan otomatis mengonversinya menjadi JPG atau WebP standar yang siap diunggah ke website instansi apa pun.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
