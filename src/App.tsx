import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Upload, 
  Youtube, 
  BookOpen, 
  Layout as LayoutIcon, 
  FileText, 
  Image as ImageIcon, 
  Video, 
  Settings, 
  Moon, 
  Sun, 
  Download, 
  ChevronRight, 
  ChevronLeft,
  Sparkles,
  Palette,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import confetti from 'canvas-confetti';

import { generateStudyMaterial, generateDiagram, generateVideo } from './services/geminiService';
import { exportToPDF, exportToPPT } from './services/exportService';
import { StudyMaterial, ThemeMode, Flashcard, Slide } from './types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Logo Component (SVG representation of the provided logo)
const Logo = ({ className }: { className?: string }) => (
  <div className={cn("flex items-center gap-2", className)}>
    <div className="relative w-10 h-10 flex items-center justify-center">
      <div className="absolute inset-0 border-2 border-cyan-400 rounded-full border-t-purple-500 border-l-purple-500 transform -rotate-45"></div>
      <span className="text-2xl font-bold text-white z-10">N</span>
    </div>
    <span className="text-xl font-bold tracking-widest text-cyan-400">NOTECRAFT</span>
  </div>
);

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('dark');
  const [bgColor, setBgColor] = useState('#0a0a0a');
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [material, setMaterial] = useState<StudyMaterial | null>(null);
  const [activeTab, setActiveTab] = useState<'summary' | 'flashcards' | 'presentation' | 'visuals'>('summary');
  const [flashcardIndex, setFlashcardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [videoUrl, setVideoUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [focus, setFocus] = useState('General Overview');
  const [currentView, setCurrentView] = useState<'home' | 'about'>('home');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const handleProcess = async () => {
    setLoading(true);
    setMaterial(null);
    setStatus('Analyzing content...');
    
    try {
      let fileData;
      if (file) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(',')[1]);
        });
        reader.readAsDataURL(file);
        const base64 = await base64Promise;
        fileData = { data: base64, mimeType: file.type };
      }

      const focusPrompts: Record<string, string> = {
        'General Overview': 'Generate a comprehensive summary of the main points.',
        'Exam Preparation': 'Focus on key terms, potential exam questions, and critical facts.',
        'Deep Technical Dive': 'Analyze the underlying mechanics, technical details, and advanced concepts.',
        'Key Concepts Only': 'Extract only the most essential concepts and define them clearly.',
        'Flashcard Intensive': 'Prioritize creating a high volume of detailed and challenging flashcards.',
        'Visual Learner': 'Focus on structure that can be easily diagrammed and visualized.',
        'Step-by-Step Tutorial': 'Break down the content into a logical, instructional sequence.',
        'Executive Summary': 'Provide a high-level, action-oriented summary for quick decision making.'
      };

      const prompt = `Act as an expert AI Tutor. Analyze the provided ${file ? 'file' : 'video URL: ' + videoUrl}. 
      Focus Strategy: ${focusPrompts[focus] || focusPrompts['General Overview']}. 
      Generate a comprehensive summary, a set of 10 flashcards, and a 5-slide presentation structure.
      Also, identify a key concept that would benefit from a diagram.`;

      const result = await generateStudyMaterial(prompt, fileData);
      
      setStatus('Generating visuals...');
      const diagram = await generateDiagram(`Educational diagram for: ${result.summary.substring(0, 100)}`);
      
      setMaterial({ ...result, diagramUrl: diagram });
      confetti();
    } catch (error) {
      console.error(error);
      setStatus('Error processing content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!material) return;
    setLoading(true);
    setStatus('Generating AI video explanation...');
    try {
      const video = await generateVideo(material.summary.substring(0, 200));
      setMaterial({ ...material, videoUrl: video });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const colors = [
    '#0a0a0a', '#1a1a1a', '#0f172a', '#1e1b4b', '#1e293b', 
    '#450a0a', '#064e3b', '#164e63', '#312e81', '#4c1d95'
  ];

  return (
    <div 
      className={cn(
        "min-h-screen transition-colors duration-500 font-sans selection:bg-cyan-500/30",
        theme === 'dark' ? "text-white" : "text-gray-900 bg-gray-50"
      )}
      style={{ backgroundColor: theme === 'dark' ? bgColor : undefined }}
    >
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button onClick={() => setCurrentView('home')} className="hover:opacity-80 transition-opacity">
          <Logo />
        </button>
        
        <nav className="hidden md:flex items-center gap-8">
          <button 
            onClick={() => setCurrentView('home')} 
            className={cn("text-sm font-medium transition-colors hover:text-cyan-400", currentView === 'home' ? "text-cyan-400" : "")}
          >
            Home
          </button>
          <a 
            href="https://notecraftblog.blogspot.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-sm font-medium hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            Blog <ExternalLink className="w-3 h-3" />
          </a>
          <button 
            onClick={() => setCurrentView('about')} 
            className={cn("text-sm font-medium transition-colors hover:text-cyan-400", currentView === 'about' ? "text-cyan-400" : "")}
          >
            About
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Customize Background"
          >
            <Palette className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </header>

      {/* Theme Customizer Overlay */}
      <AnimatePresence>
        {isCustomizing && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-20 right-6 z-40 bg-white/10 backdrop-blur-xl border border-white/20 p-4 rounded-2xl shadow-2xl"
          >
            <h3 className="text-xs uppercase tracking-widest font-bold mb-3 opacity-60">Background Color</h3>
            <div className="grid grid-cols-5 gap-2">
              {colors.map(c => (
                <button 
                  key={c}
                  onClick={() => setBgColor(c)}
                  className={cn(
                    "w-8 h-8 rounded-full border-2 transition-transform hover:scale-110",
                    bgColor === c ? "border-cyan-400" : "border-transparent"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-6xl mx-auto px-6 py-12">
        {currentView === 'home' ? (
          <>
            {/* Hero Section */}
            {!material && (
              <div className="text-center mb-16">
                <motion.h1 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-5xl md:text-7xl font-bold mb-6 tracking-tight"
                >
                  Master Any Subject with <span className="text-cyan-400">NoteCraft</span>
                </motion.h1>
                <motion.p 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-xl opacity-60 max-w-2xl mx-auto mb-12"
                >
                  Upload a PDF, DOCX, or text file, or paste a video URL. Our AI Tutor transforms it into 
                  flashcards, presentations, and diagrams instantly.
                </motion.p>

                <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                  {/* File Upload */}
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative p-8 rounded-3xl border-2 border-dashed border-white/10 hover:border-cyan-400/50 transition-all cursor-pointer bg-white/5"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept=".pdf,.docx,.txt,.png,.jpg,.jpeg"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-cyan-400/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Upload className="w-8 h-8 text-cyan-400" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold">{file ? file.name : 'Upload Source File'}</p>
                        <p className="text-sm opacity-50">PDF, DOCX, Images, or Text</p>
                      </div>
                    </div>
                  </div>

                  {/* Video URL */}
                  <div className="p-8 rounded-3xl border-2 border-white/10 bg-white/5 flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
                        <Youtube className="w-6 h-6 text-red-500" />
                      </div>
                      <p className="font-bold">Video URL</p>
                    </div>
                    <input 
                      type="text" 
                      placeholder="Paste YouTube or Video Link..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-cyan-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Focus Customization */}
                <div className="mt-8 max-w-md mx-auto">
                  <label className="block text-xs uppercase tracking-widest font-bold mb-2 opacity-50">Learning Focus</label>
                  <select 
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none"
                  >
                    <option value="General Overview">General Overview</option>
                    <option value="Exam Preparation">Exam Preparation</option>
                    <option value="Deep Technical Dive">Deep Technical Dive</option>
                    <option value="Key Concepts Only">Key Concepts Only</option>
                    <option value="Flashcard Intensive">Flashcard Intensive</option>
                    <option value="Visual Learner">Visual Learner (Diagram Focus)</option>
                    <option value="Step-by-Step Tutorial">Step-by-Step Tutorial</option>
                    <option value="Executive Summary">Executive Summary</option>
                  </select>
                </div>

                <button 
                  onClick={handleProcess}
                  disabled={loading || (!file && !videoUrl)}
                  className="mt-12 px-12 py-4 bg-cyan-400 text-black font-bold rounded-full hover:bg-cyan-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Generate Study Kit
                </button>
              </div>
            )}

            {/* Results Section */}
            {material && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setMaterial(null)}
                      className="p-2 hover:bg-white/10 rounded-full"
                    >
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <h2 className="text-3xl font-bold">Study Kit</h2>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => exportToPDF('Summary', material.summary)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                    >
                      <Download className="w-4 h-4" /> PDF
                    </button>
                    <button 
                      onClick={() => exportToPPT('Presentation', material.presentation)}
                      className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
                    >
                      <Download className="w-4 h-4" /> PPT
                    </button>
                  </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/10">
                  {[
                    { id: 'summary', icon: FileText, label: 'Summary' },
                    { id: 'flashcards', icon: BookOpen, label: 'Flashcards' },
                    { id: 'presentation', icon: LayoutIcon, label: 'Slides' },
                    { id: 'visuals', icon: ImageIcon, label: 'Visuals' }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={cn(
                        "flex items-center gap-2 px-6 py-4 border-b-2 transition-all",
                        activeTab === tab.id ? "border-cyan-400 text-cyan-400" : "border-transparent opacity-50 hover:opacity-100"
                      )}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[400px]">
                  {activeTab === 'summary' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="prose prose-invert max-w-none">
                      <div className="bg-white/5 p-8 rounded-3xl border border-white/10">
                        <Markdown>{material.summary}</Markdown>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'flashcards' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-8">
                      <div 
                        onClick={() => setShowAnswer(!showAnswer)}
                        className="w-full max-w-md h-64 perspective-1000 cursor-pointer"
                      >
                        <div className={cn(
                          "relative w-full h-full transition-transform duration-500 transform-style-3d",
                          showAnswer ? "rotate-y-180" : ""
                        )}>
                          {/* Front */}
                          <div className="absolute inset-0 backface-hidden bg-white/10 border border-white/20 rounded-3xl flex items-center justify-center p-8 text-center text-xl font-medium">
                            {material.flashcards[flashcardIndex].question}
                          </div>
                          {/* Back */}
                          <div className="absolute inset-0 backface-hidden bg-cyan-400 text-black rounded-3xl flex items-center justify-center p-8 text-center text-xl font-bold rotate-y-180">
                            {material.flashcards[flashcardIndex].answer}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <button 
                          onClick={() => { setFlashcardIndex(prev => Math.max(0, prev - 1)); setShowAnswer(false); }}
                          className="p-3 bg-white/10 rounded-full hover:bg-white/20"
                        >
                          <ChevronLeft />
                        </button>
                        <span className="font-mono">{flashcardIndex + 1} / {material.flashcards.length}</span>
                        <button 
                          onClick={() => { setFlashcardIndex(prev => Math.min(material.flashcards.length - 1, prev + 1)); setShowAnswer(false); }}
                          className="p-3 bg-white/10 rounded-full hover:bg-white/20"
                        >
                          <ChevronRight />
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === 'presentation' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6">
                      {material.presentation.map((slide, i) => (
                        <div key={i} className="bg-white/5 p-8 rounded-3xl border border-white/10">
                          <h3 className="text-xl font-bold text-cyan-400 mb-4">{slide.title}</h3>
                          <ul className="space-y-2">
                            {slide.content.map((item, j) => (
                              <li key={j} className="flex items-start gap-3 opacity-80">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                                {item}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {activeTab === 'visuals' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                      {material.diagramUrl && (
                        <div className="space-y-4">
                          <h3 className="text-xl font-bold flex items-center gap-2">
                            <ImageIcon className="w-5 h-5 text-cyan-400" /> Concept Diagram
                          </h3>
                          <div className="rounded-3xl overflow-hidden border border-white/10 bg-black">
                            <img src={material.diagramUrl} alt="Diagram" className="w-full h-auto" referrerPolicy="no-referrer" />
                          </div>
                        </div>
                      )}

                      <div className="p-8 rounded-3xl bg-gradient-to-br from-purple-500/10 to-cyan-500/10 border border-white/10 text-center">
                        <h3 className="text-2xl font-bold mb-4">AI Video Explanation</h3>
                        <p className="opacity-60 mb-8">Generate a cinematic AI video explaining the core concepts of this material.</p>
                        
                        {material.videoUrl ? (
                          <video controls className="w-full rounded-2xl shadow-2xl">
                            <source src={material.videoUrl} type="video/mp4" />
                          </video>
                        ) : (
                          <button 
                            onClick={handleGenerateVideo}
                            disabled={loading}
                            className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all flex items-center gap-2 mx-auto"
                          >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                            Generate Video
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="max-w-3xl mx-auto space-y-12"
          >
            <div className="space-y-6">
              <h2 className="text-5xl font-bold">About <span className="text-cyan-400">NoteCraft</span></h2>
              <div className="h-1 w-24 bg-cyan-400 rounded-full"></div>
            </div>

            <div className="space-y-8 text-lg leading-relaxed opacity-80">
              <p>
                NoteCraft is an innovative AI-powered educational platform designed to revolutionize the way students and professionals learn. 
                By leveraging cutting-edge artificial intelligence, we transform complex source materials—whether they are long PDF or DOCX documents, 
                dense technical papers, or educational videos—into structured, interactive study kits.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-8 py-8">
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <h3 className="text-cyan-400 font-bold mb-2">Our Mission</h3>
                  <p className="text-sm">To make high-quality learning accessible and efficient for everyone, everywhere, for free.</p>
                </div>
                <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
                  <h3 className="text-cyan-400 font-bold mb-2">The Technology</h3>
                  <p className="text-sm">Powered by state-of-the-art multimodal AI models that understand text, images, and video context.</p>
                </div>
              </div>

              <p>
                Whether you're preparing for a critical exam, diving deep into a new technical field, or just looking for a quick executive summary, 
                NoteCraft provides the tools you need to succeed. Our platform generates flashcards for active recall, structured presentations for 
                visual organization, and even cinematic AI video explanations to bring concepts to life.
              </p>

              <p className="font-medium text-cyan-400">
                NoteCraft is a NoteCraft company product, dedicated to building the future of educational technology.
              </p>
            </div>

            <button 
              onClick={() => setCurrentView('home')}
              className="px-8 py-3 border border-cyan-400 text-cyan-400 rounded-full hover:bg-cyan-400 hover:text-black transition-all"
            >
              Back to Home
            </button>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-24 border-t border-white/10 px-6 py-12">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="space-y-4">
            <Logo />
            <p className="text-sm opacity-50">© {new Date().getFullYear()} NoteCraft. All rights reserved.</p>
          </div>
          
          <div className="flex gap-12">
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-widest font-bold opacity-40">Product</h4>
              <ul className="text-sm space-y-2">
                <li><button onClick={() => setCurrentView('home')} className="hover:text-cyan-400">Features</button></li>
                <li><a href="https://notecraftblog.blogspot.com" target="_blank" rel="noopener noreferrer" className="hover:text-cyan-400">Blog</a></li>
                <li><a href="#" className="hover:text-cyan-400">Roadmap</a></li>
              </ul>
            </div>
            <div className="space-y-3">
              <h4 className="text-xs uppercase tracking-widest font-bold opacity-40">Support</h4>
              <ul className="text-sm space-y-2">
                <li><a href="#" className="hover:text-cyan-400">Help Center</a></li>
                <li><a href="#" className="hover:text-cyan-400">Contact</a></li>
                <li><button onClick={() => setCurrentView('about')} className="hover:text-cyan-400">About</button></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t border-white/5 text-center">
          <p className="text-xs opacity-30 italic">Hosted with Scholarly's SOHO</p>
        </div>
      </footer>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center"
          >
            <div className="relative w-24 h-24 mb-8">
              <div className="absolute inset-0 border-4 border-cyan-400/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-cyan-400 rounded-full border-t-transparent animate-spin"></div>
              <Sparkles className="absolute inset-0 m-auto w-8 h-8 text-cyan-400 animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{status}</h2>
            <p className="opacity-50 max-w-xs">Our AI is crafting your personalized study materials. This may take a moment...</p>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
