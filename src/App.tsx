/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Music, 
  Mic2, 
  Play, 
  Pause, 
  Download, 
  Settings2, 
  RefreshCw, 
  Waves, 
  Headphones,
  CheckCircle2,
  AlertCircle,
  FileAudio,
  ChevronRight,
  Disc3
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import { ARTIST_VOICES, SONG_STRUCTURES, GENRES } from './constants';
import { Voice, SongStructure, GenerationStatus, SongMetadata } from './types';
import { generateLyrics, analyzeBeat } from './services/geminiService';

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState<Voice>(ARTIST_VOICES[1]);
  const [selectedStructure, setSelectedStructure] = useState<SongStructure>(SONG_STRUCTURES[0]);
  const [topic, setTopic] = useState('');
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [metadata, setMetadata] = useState<SongMetadata | null>(null);
  const [generatedLyrics, setGeneratedLyrics] = useState<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load project on mount
  useEffect(() => {
    const savedProject = localStorage.getItem('vocalverse_project');
    if (savedProject) {
      try {
        const data = JSON.parse(savedProject);
        setTopic(data.topic || '');
        const voice = ARTIST_VOICES.find(v => v.id === data.voiceId);
        if (voice) setSelectedVoice(voice);
        const structure = SONG_STRUCTURES.find(s => s.id === data.structureId);
        if (structure) setSelectedStructure(structure);
        if (data.metadata) setMetadata(data.metadata);
        if (data.generatedLyrics) {
          setGeneratedLyrics(data.generatedLyrics);
          setStatus('completed');
        }
      } catch (e) {
        console.error("Failed to load saved project", e);
      }
    }
  }, []);

  const saveProject = () => {
    setSaveStatus('saving');
    const projectData = {
      topic,
      voiceId: selectedVoice.id,
      structureId: selectedStructure.id,
      metadata,
      generatedLyrics,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem('vocalverse_project', JSON.stringify(projectData));
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setAudioUrl(URL.createObjectURL(uploadedFile));
      setIsPlaying(false);
      setProgress(0);
    }
  };

  const handleGenerate = async () => {
    if (!file || !topic) return;

    try {
      setStatus('analyzing');
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = (reader.result as string).split(',')[1];
        try {
          const analysis = await analyzeBeat(base64);
          setMetadata(analysis);
          setStatus('generating_lyrics');
          const lyrics = await generateLyrics({
            topic,
            genre: analysis.genre || 'Hip Hop',
            voiceStyle: selectedVoice.name,
            structure: selectedStructure.sequence
          });
          setGeneratedLyrics(lyrics);
          
          setStatus('synthesizing_vocals');
          await new Promise(resolve => setTimeout(resolve, 3000));
          
          setStatus('mixing');
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          setStatus('completed');
        } catch (err) {
          console.error(err);
          setStatus('error');
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleExport = () => {
    if (!audioUrl) return;
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${metadata?.title || 'generated-song'}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="h-screen w-full bg-white text-gray-900 font-sans flex flex-col overflow-hidden">
      {/* Top Navigation */}
      <nav className="h-16 border-b border-gray-100 px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
            <div className="w-3.5 h-3.5 bg-white rounded-full"></div>
          </div>
          <span className="font-bold tracking-tight text-xl uppercase italic">Sonic<span className="text-gray-400">.ai</span></span>
        </div>
        
        <div className="hidden md:flex gap-8 text-xs font-bold uppercase tracking-widest text-gray-400">
          <button className="text-black border-b-2 border-black pb-1">Studio</button>
          <button className="hover:text-gray-900 transition-colors">Library</button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={saveProject}
            disabled={saveStatus !== 'idle'}
            className="px-4 py-2 border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-tighter hover:bg-gray-50 transition-colors flex items-center gap-2"
          >
            {saveStatus === 'saving' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Settings2 className="w-3 h-3" />}
            {saveStatus === 'saved' ? 'Project Saved' : 'Save Project'}
          </button>
          {status === 'completed' && (
            <button 
              onClick={handleExport}
              className="px-6 py-2 bg-black text-white rounded-full text-[10px] font-bold uppercase tracking-tighter shadow-lg shadow-black/10 hover:bg-gray-800 transition-all"
            >
              Export Master
            </button>
          )}
        </div>
      </nav>

      {/* Main Workspace */}
      <main className="flex-1 overflow-hidden grid grid-cols-12">
        
        {/* Left Sidebar: Track DNA (Settings) */}
        <aside className="col-span-12 lg:col-span-3 border-r border-gray-100 p-6 flex flex-col gap-8 bg-gray-50/50 overflow-y-auto">
          <section>
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-4">Instrumental Source</h2>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "bg-white border border-gray-200 rounded-2xl p-4 shadow-sm cursor-pointer transition-all hover:border-gray-300 group",
                file && "border-blue-200 bg-blue-50/20"
              )}
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden" 
                accept="audio/*" 
                onChange={handleFileUpload}
              />
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-colors",
                  file ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-gray-200"
                )}>
                  <FileAudio className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">
                    {file ? file.name : "Select instrumental"}
                  </p>
                  {metadata ? (
                    <p className="text-[10px] text-gray-400 font-mono">
                      {metadata.bpm || '128'} BPM • {metadata.key || 'C MINOR'}
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400">Accepts MP3, WAV</p>
                  )}
                </div>
              </div>
              <button className="w-full mt-4 py-2.5 text-[10px] font-bold uppercase tracking-widest border border-dashed border-gray-200 text-gray-400 rounded-lg group-hover:border-gray-300">
                {file ? "Replace File" : "Choose File"}
              </button>
            </div>
          </section>

          <section>
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold mb-4">Lyrics Persona</h2>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Genre Mood</label>
                <select 
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5"
                  defaultValue={metadata?.genre || 'Hip Hop'}
                >
                  {GENRES.map(g => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Arrangement</label>
                <div className="grid grid-cols-2 gap-2">
                  {SONG_STRUCTURES.map(s => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedStructure(s)}
                      className={cn(
                        "p-2.5 text-[10px] font-bold uppercase tracking-tighter rounded-xl border transition-all",
                        selectedStructure.id === s.id 
                          ? "bg-black text-white border-black" 
                          : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                      )}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">Song Theme</label>
                <textarea 
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="What is the song about? (e.g. Love, Pain, Money)"
                  className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-black/5 min-h-[100px] resize-none"
                />
              </div>
            </div>
          </section>

          <div className="mt-auto">
            <div className="bg-indigo-600 rounded-2xl p-5 text-white shadow-xl shadow-indigo-100">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80">Pro Neural Engine</p>
                <RefreshCw className={cn("w-3 h-3 text-white/50", status !== 'idle' && status !== 'completed' && "animate-spin")} />
              </div>
              <p className="text-sm font-bold mb-4">
                {status === 'idle' ? "Ready to process" : status === 'completed' ? "Synthesis Complete" : "Processing Audio..."}
              </p>
              <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ 
                    width: status === 'completed' ? '100%' : (status === 'idle' ? '0%' : '65%') 
                  }}
                  className="h-full bg-white rounded-full"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Center: AI Artist Selection */}
        <section className="col-span-12 lg:col-span-6 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-8">
          <div className="flex justify-between items-end shrink-0">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Select AI Vocalist</h1>
              <p className="text-sm text-gray-400 mt-1">High-fidelity neural voice clones for studio-grade results.</p>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
              <button 
                onClick={() => setGenderFilter('all')}
                className={cn(
                  "px-5 py-2 text-[10px] font-bold uppercase tracking-tighter rounded-lg transition-all",
                  genderFilter === 'all' ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-900"
                )}
              >
                All
              </button>
              <button 
                onClick={() => setGenderFilter('male')}
                className={cn(
                  "px-5 py-2 text-[10px] font-bold uppercase tracking-tighter rounded-lg transition-all",
                  genderFilter === 'male' ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-900"
                )}
              >
                Male
              </button>
              <button 
                onClick={() => setGenderFilter('female')}
                className={cn(
                  "px-5 py-2 text-[10px] font-bold uppercase tracking-tighter rounded-lg transition-all",
                  genderFilter === 'female' ? "bg-white shadow-sm text-gray-900" : "text-gray-400 hover:text-gray-900"
                )}
              >
                Female
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {ARTIST_VOICES
              .filter(a => genderFilter === 'all' || a.gender === genderFilter)
              .map((artist) => (
                <div
                  key={artist.id}
                  onClick={() => setSelectedVoice(artist)}
                  className={cn(
                    "relative group cursor-pointer rounded-3xl p-5 transition-all overflow-hidden",
                    selectedVoice.id === artist.id
                      ? "bg-gray-900 text-white shadow-2xl scale-[1.02]"
                      : "bg-white border border-gray-100 hover:border-gray-300 text-gray-900"
                  )}
                >
                  {selectedVoice.id === artist.id && (
                    <div className="absolute top-4 right-4 z-10 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                  
                  <div className={cn(
                    "w-full aspect-square rounded-2xl mb-4 flex items-center justify-center font-bold text-2xl transition-colors relative overflow-hidden",
                    selectedVoice.id === artist.id ? "bg-white/10 text-white" : "bg-gray-100 text-gray-300"
                  )}>
                    {artist.imageUrl ? (
                      <img 
                        src={artist.imageUrl} 
                        alt={artist.name} 
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500 opacity-80 group-hover:opacity-100"
                      />
                    ) : (
                      artist.name.split(' ').map(n => n[0]).join('')
                    )}
                    {selectedVoice.id === artist.id && (
                      <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
                    )}
                  </div>
                  
                  <p className="font-bold text-base tracking-tight">{artist.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                     <span className={cn(
                      "text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full",
                      selectedVoice.id === artist.id ? "bg-white/20 text-white/80" : "bg-gray-100 text-gray-400"
                    )}>
                      {artist.gender}
                     </span>
                     <p className={cn(
                       "text-[10px] font-medium truncate",
                       selectedVoice.id === artist.id ? "text-white/60" : "text-gray-400"
                     )}>{artist.description}</p>
                  </div>
                </div>
              ))}
          </div>

          {/* Synthesis Feedback */}
          <AnimatePresence>
            {status !== 'idle' && status !== 'completed' && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col items-center justify-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 p-12 text-center"
              >
                <div className="relative mb-8">
                  <Disc3 className="w-20 h-20 text-gray-900 animate-spin-slow" />
                  <div className="absolute inset-0 border-2 border-indigo-500 rounded-full animate-ping opacity-20" />
                </div>
                <h3 className="text-xl font-bold uppercase tracking-[0.3em] mb-2">{status === 'synthesizing_vocals' ? 'Neural Link' : status.replace('_', ' ')}</h3>
                <p className="text-xs text-gray-400 font-mono max-w-sm">
                  {status === 'analyzing' && "Deconstructing waveform for BPM and Key mapping..."}
                  {status === 'generating_lyrics' && "Drafting lyrical structures based on artist weights..."}
                  {status === 'synthesizing_vocals' && "Reconstructing vocal timbres via neural pathways..."}
                  {status === 'mixing' && "Balancing dynamic range and spatial imaging..."}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Sidebar: Lyrics & Controls */}
        <aside className="col-span-12 lg:col-span-3 border-l border-gray-100 p-6 flex flex-col bg-gray-50/30 overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-gray-400 font-bold">AI Lyrical Board</h2>
            {status === 'completed' && (
              <button onClick={handleGenerate} className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 transition-colors">
                REGENERATE
              </button>
            )}
          </div>
          
          <div className={cn(
            "flex-1 bg-white border border-gray-100 rounded-2xl p-6 text-[13px] leading-relaxed text-gray-600 font-serif italic overflow-y-auto shadow-inner",
            !generatedLyrics && "flex items-center justify-center text-gray-300"
          )}>
            {generatedLyrics ? (
              <div className="space-y-8">
                {generatedLyrics.lyrics.map((section: any, idx: number) => (
                  <div key={idx}>
                    <p className="not-italic font-bold text-[10px] text-gray-400 uppercase tracking-widest mb-3 border-b border-gray-50 pb-1">
                      {section.section}
                    </p>
                    <div className="space-y-4">
                      {section.lines.map((line: string, lIdx: number) => (
                         <p key={lIdx} className="hover:text-black transition-colors cursor-default">{line}</p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center">
                <Music className="w-8 h-8 mx-auto mb-4 opacity-20" />
                <p className="font-sans not-italic text-xs">Waiting for generation</p>
              </div>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <button 
              onClick={handleGenerate}
              disabled={!file || !topic || status !== 'idle'}
              className={cn(
                "w-full py-4 rounded-2xl font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-xl",
                (!file || !topic || status !== 'idle')
                  ? "bg-gray-100 text-gray-400 shadow-none cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 hover:-translate-y-1 active:translate-y-0"
              )}
            >
              <span>{status === 'idle' ? "Generate Track" : "Processing..."}</span>
              <Mic2 className="w-4 h-4" />
            </button>
          </div>
        </aside>
      </main>

      {/* Bottom Playback Control */}
      <footer className="h-20 border-t border-gray-100 px-8 flex items-center justify-between bg-white bg-opacity-95 backdrop-blur-md sticky bottom-0 shrink-0 z-20">
        {/* Track Info */}
        <div className="flex items-center gap-4 w-1/4">
          <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white shadow-lg overflow-hidden relative">
            {isPlaying ? (
              <AnimatePresence>
                 <motion.div 
                   animate={{ rotate: 360 }}
                   transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                   className="w-full h-full flex items-center justify-center"
                 >
                   <Disc3 className="w-6 h-6" />
                 </motion.div>
              </AnimatePresence>
            ) : (
              <div className="w-3 h-3 border-2 border-white/50 transform rotate-45"></div>
            )}
          </div>
          <div className="leading-tight truncate pr-4">
            <p className="text-sm font-bold truncate">{generatedLyrics?.title || 'No project active'}</p>
            <p className="text-[10px] text-gray-400 uppercase tracking-tighter truncate">
              {status === 'completed' ? `AI Voice: ${selectedVoice.name}` : 'Ready for mastering'}
            </p>
          </div>
        </div>

        {/* Master Controls */}
        <div className="flex flex-col items-center gap-2 flex-1 max-w-xl">
          <div className="flex items-center gap-10">
            <button className="text-gray-300 hover:text-black transition-colors"><Settings2 className="w-4 h-4" /></button>
            <button className="text-gray-400 hover:text-black transition-colors"><ChevronRight className="w-5 h-5 rotate-180" /></button>
            <button 
              onClick={togglePlayback}
              className="w-11 h-11 bg-black rounded-full flex items-center justify-center text-white shadow-xl shadow-black/20 hover:scale-105 active:scale-95 transition-all"
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
            </button>
            <button className="text-gray-400 hover:text-black transition-colors"><ChevronRight className="w-5 h-5" /></button>
            <button className="text-gray-300 hover:text-black transition-colors"><RefreshCw className="w-4 h-4" /></button>
          </div>
          <div className="w-full h-1 bg-gray-50 rounded-full flex items-center overflow-hidden">
             <motion.div 
               className="h-full bg-black rounded-full relative"
               initial={{ width: 0 }}
               animate={{ width: isPlaying ? '100%' : '0%' }}
               transition={{ duration: 30, ease: "linear" }}
             >
               <div className="absolute right-0 w-3 h-3 bg-black border-2 border-white rounded-full -top-1 shadow shadow-black/20"></div>
             </motion.div>
          </div>
        </div>

        {/* Audio Engine Info */}
        <div className="flex items-center justify-end gap-6 w-1/4">
          <div className="flex items-center gap-3">
             <div className="flex gap-0.5 items-end h-3">
               {[0.4, 0.7, 0.5, 0.9, 0.3].map((h, i) => (
                 <motion.div 
                   key={i}
                   animate={{ height: isPlaying ? [`${h*100}%`, `${(h+0.2)*100}%`, `${h*100}%`] : `${h*100}%` }}
                   transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.1 }}
                   className="w-0.5 bg-gray-200 rounded-t-full"
                 />
               ))}
             </div>
             <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">Master Studio</p>
          </div>
          <div className="h-6 w-[1px] bg-gray-100" />
          <button 
            onClick={handleExport}
            className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] hover:text-indigo-600 transition-colors flex items-center gap-2"
          >
            <Download className="w-3 h-3" />
            MP3 • HI-RES
          </button>
        </div>
      </footer>

      {/* Audio Engine */}
      <audio 
        ref={audioRef} 
        src={audioUrl || undefined} 
        onEnded={() => setIsPlaying(false)}
        className="hidden"
      />

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f9fafb;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e5e7eb;
          border-radius: 10px;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}


