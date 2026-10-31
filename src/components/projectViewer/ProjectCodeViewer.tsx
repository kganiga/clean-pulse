import React, { useState } from 'react';
import JSZip from 'jszip';
import {
  Folder,
  FileCode,
  Download,
  Copy,
  Check,
  Search,
  FileText,
  Terminal,
  ExternalLink,
  Shield,
  Layers,
} from 'lucide-react';
import { ANDROID_PROJECT_FILES, AndroidProjectFile } from '../../data/androidProjectFiles';
import { M3Button } from '../common/MaterialComponents';
import { triggerHaptic } from '../../utils/formatters';

export function ProjectCodeViewer() {
  const [selectedFile, setSelectedFile] = useState<AndroidProjectFile>(ANDROID_PROJECT_FILES[0]);
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'kotlin' | 'gradle' | 'test' | 'docs'>(
    'all'
  );

  const filteredFiles = ANDROID_PROJECT_FILES.filter((file) => {
    if (categoryFilter === 'kotlin' && !file.path.endsWith('.kt')) return false;
    if (
      categoryFilter === 'gradle' &&
      !file.path.endsWith('.kts') &&
      !file.path.endsWith('.toml') &&
      !file.path.endsWith('.xml')
    )
      return false;
    if (categoryFilter === 'test' && !file.path.includes('Test')) return false;
    if (categoryFilter === 'docs' && !file.path.endsWith('.md')) return false;

    if (search.trim() !== '') {
      const q = search.toLowerCase();
      return (
        file.path.toLowerCase().includes(q) ||
        file.description.toLowerCase().includes(q) ||
        file.content.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopy = () => {
    triggerHaptic('light');
    navigator.clipboard.writeText(selectedFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    triggerHaptic('medium');
    setIsExporting(true);

    try {
      const zip = new JSZip();

      // Populate every project file in its exact directory structure
      for (const file of ANDROID_PROJECT_FILES) {
        zip.file(file.path, file.content);
      }

      // Add a standard gradlew placeholder script
      zip.file(
        'gradlew',
        `#!/bin/sh
exec gradle "$@"
`
      );

      const blob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CleanPulse-Android-Studio-Project.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Failed to generate zip:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
      {/* Top Bar */}
      <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            <h1 className="text-base font-bold text-slate-100">Android Studio Project Workspace</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Production-ready native Kotlin & Jetpack Compose codebase (SDK 35 · Room · WorkManager)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <M3Button
            onClick={handleDownloadZip}
            disabled={isExporting}
            className="text-xs"
            icon={<Download className="w-4 h-4" />}
          >
            {isExporting ? 'Packaging ZIP...' : 'Export Android Studio Project (.ZIP)'}
          </M3Button>
        </div>
      </div>

      {/* Main Body: File Browser + Code Editor */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Sidebar: File Tree */}
        <div className="lg:col-span-4 border-r border-slate-800/80 bg-slate-950/50 flex flex-col h-full max-h-[72vh] lg:max-h-none overflow-hidden">
          {/* Search & Filter Bar */}
          <div className="p-4 border-b border-slate-800/80 space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search files or code..."
                className="w-full h-9 pl-9 pr-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All Files' },
                { id: 'kotlin', label: 'Kotlin' },
                { id: 'gradle', label: 'Gradle' },
                { id: 'test', label: 'Tests' },
                { id: 'docs', label: 'Docs' },
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setCategoryFilter(f.id as any)}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-lg whitespace-nowrap transition-colors ${
                    categoryFilter === f.id
                      ? 'bg-slate-800 text-emerald-400 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Files List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {filteredFiles.map((file) => {
              const isSelected = selectedFile.path === file.path;
              return (
                <button
                  key={file.path}
                  onClick={() => {
                    triggerHaptic('light');
                    setSelectedFile(file);
                  }}
                  className={`w-full text-left p-2.5 rounded-xl text-xs transition-colors flex items-start gap-2.5 ${
                    isSelected
                      ? 'bg-emerald-500/10 text-emerald-300 font-medium border border-emerald-500/20'
                      : 'text-slate-300 hover:bg-slate-900 hover:text-slate-100'
                  }`}
                >
                  {file.path.endsWith('.kt') ? (
                    <FileCode className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : file.path.endsWith('.md') ? (
                    <FileText className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                  ) : (
                    <Terminal className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono">{file.path}</p>
                    <p className="text-[10px] text-slate-500 truncate mt-0.5">{file.description}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Editor Area */}
        <div className="lg:col-span-8 flex flex-col h-full bg-slate-950 overflow-hidden">
          {/* File Header Tab */}
          <div className="px-5 py-3 border-b border-slate-800/80 bg-slate-900/60 flex items-center justify-between shrink-0">
            <div>
              <span className="font-mono text-xs text-slate-200 font-semibold">
                {selectedFile.path}
              </span>
              <p className="text-[11px] text-slate-400">{selectedFile.description}</p>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          {/* Syntax Highlighted Code Viewer */}
          <div className="flex-1 overflow-auto p-4 font-mono text-xs leading-relaxed text-slate-200">
            <pre className="whitespace-pre">
              <code>{selectedFile.content}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
