import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, Sparkles, ArrowRight, LayoutDashboard, User, 
  Settings, BrainCircuit, Hammer, Paperclip, FileText, 
  CircleDashed, CheckCircle2, ChevronLeft, ArrowUpRight
} from 'lucide-react';

type Message = { role: 'user' | 'ai'; content: string; };
type ViewState = 'onboarding' | 'dashboard' | 'build_chat';

// Mock Data for the Dashboard
const MOCK_SKILLS = ["React Novice", "UX Enthusiast", "Fearless Break-er", "Prompt Tinkerer"];
const MOCK_TASKS = [
  { id: 1, title: "Personal Portfolio V1", status: "Drafting layout", progress: 25 },
  { id: 2, title: "Figma Plugin Prototype", status: "Stuck on API", progress: 60 },
];

export default function App() {
  const [view, setView] = useState<ViewState>('onboarding');
  
  // Onboarding Chat State
  const [onboardingInput, setOnboardingInput] = useState('');
  const [onboardingMessages, setOnboardingMessages] = useState<Message[]>([]);
  const [isOnboardingTyping, setIsOnboardingTyping] = useState(false);
  const onboardingEndRef = useRef<HTMLDivElement>(null);

  // Dashboard State
  const [dashboardPrompt, setDashboardPrompt] = useState('');

  // Build Chat State
  const [activeProject, setActiveProject] = useState('');
  const [buildInput, setBuildInput] = useState('');
  const [buildMessages, setBuildMessages] = useState<Message[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const buildEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll Helpers
  useEffect(() => {
    if (view === 'onboarding') onboardingEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    if (view === 'build_chat') buildEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [onboardingMessages, isOnboardingTyping, buildMessages, view]);

  // Handlers
  const handleOnboardingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onboardingInput.trim()) return;
    const userMsg = onboardingInput.trim();
    setOnboardingInput('');
    setOnboardingMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsOnboardingTyping(true);
    setTimeout(() => {
      setOnboardingMessages(prev => [
        ...prev,
        { role: 'ai', content: "That's a really interesting direction! I can definitely help you with that. What's the biggest challenge you're facing with it right now?" }
      ]);
      setIsOnboardingTyping(false);
    }, 1500);
  };

  const handleStartBuilding = (projectName: string) => {
    setActiveProject(projectName || "New Idea");
    setBuildMessages([
      { role: 'ai', content: "Build it. (Make mistakes, run into walls, that's how we learn how to ride bikes, drive cars, it's how we learn AI)." }
    ]);
    setView('build_chat');
  };

  const handleDashboardPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dashboardPrompt.trim()) return;
    handleStartBuilding(dashboardPrompt);
    setDashboardPrompt('');
  };

  const handleBuildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buildInput.trim()) return;
    const msg = buildInput.trim();
    setBuildInput('');
    setBuildMessages(prev => [...prev, { role: 'user', content: msg }]);
    setTimeout(() => {
      setBuildMessages(prev => [...prev, { role: 'ai', content: "Let's wire that up. Have you tried looking at the documentation for that specific hook?" }]);
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const fileNames = Array.from(e.target.files).map(f => f.name);
      setUploadedFiles(prev => [...prev, ...fileNames]);
    }
  };

  // ---------------------------------------------------------------------------
  // VIEW: ONBOARDING
  // ---------------------------------------------------------------------------
  if (view === 'onboarding') {
    const showContinue = onboardingMessages.length > 0 && onboardingMessages[onboardingMessages.length - 1].role === 'ai' && !isOnboardingTyping;
    return (
      <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-royal selection:text-paper relative font-sans">
        {onboardingMessages.length === 0 && (
          <>
            <div className="absolute top-12 left-12 text-royal opacity-20 -rotate-12 pointer-events-none">
              <Sparkles size={48} strokeWidth={1} />
            </div>
            <div className="absolute bottom-48 right-16 text-ink opacity-10 rotate-12 pointer-events-none">
              <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 50 C 30 10, 70 10, 90 50 C 70 90, 30 90, 10 50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </>
        )}
        <main className="flex-grow flex flex-col items-center overflow-y-auto pt-12 pb-40 px-4 md:px-8 w-full scroll-smooth">
          <div className={`flex flex-col items-center text-center max-w-4xl w-full z-10 transition-all duration-1000 ease-in-out ${onboardingMessages.length === 0 ? 'my-auto scale-100 opacity-100' : 'mt-4 mb-16 scale-75 opacity-40 origin-top'}`}>
            <h1 className="text-6xl md:text-8xl lg:text-9xl font-display text-ink mb-12 -rotate-2">
              who are <span className="text-royal scribble-underline">YOU?</span>
            </h1>
            <p className="text-xl md:text-2xl font-sans opacity-80 leading-relaxed max-w-2xl mx-auto">
              what do you do, what are your goals, we will give you the space to learn ai while being <span className="font-display text-4xl text-royal ml-1 -rotate-3 inline-block">you.</span>
            </p>
          </div>
          {onboardingMessages.length > 0 && (
            <div className="flex flex-col gap-6 w-full max-w-3xl mx-auto z-10 animate-in fade-in slide-in-from-bottom-12 duration-700 fill-mode-both">
              {onboardingMessages.map((msg, idx) => (
                <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`p-5 md:p-6 max-w-[85%] md:max-w-[75%] leading-relaxed text-lg animate-in fade-in slide-in-from-bottom-4 duration-500 ${msg.role === 'user' ? 'bg-royal text-paper rough-border-blue' : 'bg-paper text-ink rough-border sketch-box-shadow'}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {isOnboardingTyping && (
                <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-4 duration-300">
                  <div className="p-5 md:p-6 bg-paper text-ink rough-border sketch-box-shadow flex gap-2 items-center">
                    <div className="w-2 h-2 bg-royal rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                    <div className="w-2 h-2 bg-royal rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 bg-royal rounded-full animate-bounce"></div>
                  </div>
                </div>
              )}
              {showContinue && (
                <div className="flex w-full justify-center mt-6 mb-8 animate-in fade-in zoom-in duration-500 delay-300 fill-mode-both">
                  <button onClick={() => setView('dashboard')} className="px-6 py-4 md:px-8 md:py-5 rough-button font-bold text-lg flex items-center gap-3 sketch-box-shadow hover:-translate-y-1 hover:shadow-none transition-all group">
                    "I think you've got it" 
                    <span className="text-royal group-hover:text-paper ml-2 flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-all">
                      Go to Dashboard <ArrowRight size={20} />
                    </span>
                  </button>
                </div>
              )}
              <div ref={onboardingEndRef} className="h-4" />
            </div>
          )}
        </main>
        <div className="fixed bottom-0 left-0 w-full p-4 md:p-8 bg-gradient-to-t from-paper via-paper to-transparent z-50">
          <div className="max-w-3xl mx-auto">
            <form onSubmit={handleOnboardingSubmit} className="flex gap-2 sm:gap-4 p-2 bg-paper rough-border sketch-box-shadow-blue items-center focus-within:-translate-y-1 focus-within:-translate-x-1 focus-within:shadow-none transition-transform">
              <input type="text" value={onboardingInput} onChange={e => setOnboardingInput(e.target.value)} placeholder="I am a designer trying to build a..." className="flex-grow bg-transparent outline-none p-4 font-sans text-lg placeholder-ink placeholder-opacity-40" autoFocus disabled={isOnboardingTyping} />
              <button type="submit" disabled={!onboardingInput.trim() || isOnboardingTyping} className={`p-4 md:px-8 rough-button-blue font-bold flex items-center justify-center gap-2 transition-all mr-1 my-1 ${(!onboardingInput.trim() || isOnboardingTyping) ? 'opacity-50 cursor-not-allowed hover:bg-royal hover:text-paper hover:translate-y-0 hover:translate-x-0' : ''}`}>
                <span className="hidden sm:inline">Send</span><Send size={20} className="sm:ml-2" />
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: DASHBOARD
  // ---------------------------------------------------------------------------
  if (view === 'dashboard') {
    return (
      <div className="h-screen bg-paper text-ink flex overflow-hidden font-sans selection:bg-royal selection:text-paper">
        
        {/* SIDEBAR: Intentional placement for global/meta navigation. Keeps the main area focused on action. */}
        <aside className="w-72 border-r-2 border-ink flex flex-col p-6 hidden md:flex shrink-0 relative h-full">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 bg-royal rounded-full flex items-center justify-center text-paper rough-border-blue -rotate-6">
              <User size={24} />
            </div>
            <div>
              <h2 className="font-display text-2xl font-bold">You.</h2>
              <p className="text-sm opacity-60">Learner & Builder</p>
            </div>
          </div>

          <nav className="flex flex-col gap-4 flex-grow">
            <button className="flex items-center gap-3 text-lg font-bold text-royal hover:translate-x-1 transition-transform w-full text-left">
              <LayoutDashboard size={20} /> Dashboard
            </button>
            <button className="flex items-center gap-3 text-lg font-bold opacity-60 hover:opacity-100 hover:translate-x-1 transition-transform w-full text-left">
              <Settings size={20} /> Settings
            </button>
          </nav>

          {/* AI MEMORY: Placed at the bottom of the nav to act as a grounded reflective space. */}
          <div className="mt-auto pt-4 border-t-2 border-ink border-dashed">
            <div className="flex items-center gap-2 mb-2 text-royal font-bold">
              <BrainCircuit size={20} /> AI Memory
            </div>
            <p className="text-xs opacity-80 mb-4 leading-relaxed">
              Any updates? Wanna talk about your growth since we first met?
            </p>
            <button 
              onClick={() => setView('onboarding')}
              className="w-full py-2 rough-button text-sm font-bold sketch-box-shadow hover:-translate-y-1 hover:shadow-none transition-all"
            >
              Update Memory
            </button>
          </div>
        </aside>

        {/* MAIN DASHBOARD CONTENT */}
        <main className="flex-grow overflow-y-auto p-6 md:p-8 scroll-smooth h-full">
          <div className="max-w-4xl mx-auto flex flex-col gap-8 pb-12">
            
            {/* Header & Skills */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h1 className="text-4xl md:text-5xl font-display mb-4 -rotate-1">
                Your <span className="text-royal scribble-underline">Toolkit</span>
              </h1>
              <p className="opacity-60 mb-4 font-mono text-sm uppercase tracking-wider">AI-Identified Core Skills</p>
              <div className="flex flex-wrap gap-2">
                {MOCK_SKILLS.map((skill, i) => (
                  <span key={i} className="px-3 py-1.5 rough-border border-ink bg-transparent text-ink text-sm font-bold rotate-1 hover:-rotate-1 transition-transform cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {/* The Chat Bar - Placed prominently in the middle as the primary catalyst for new action */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150 fill-mode-both">
              <h2 className="text-xl md:text-2xl font-display mb-3 text-royal rotate-1">Something else in mind? Let's build.</h2>
              <form onSubmit={handleDashboardPromptSubmit} className="flex gap-2 p-2 bg-paper rough-border sketch-box-shadow items-center focus-within:-translate-y-1 focus-within:-translate-x-1 focus-within:shadow-none transition-transform">
                <input 
                  type="text" 
                  value={dashboardPrompt}
                  onChange={e => setDashboardPrompt(e.target.value)}
                  placeholder="Describe what you want to make..." 
                  className="flex-grow bg-transparent outline-none p-3 md:p-4 font-sans text-base md:text-lg placeholder-ink placeholder-opacity-40"
                />
                <button 
                  type="submit"
                  disabled={!dashboardPrompt.trim()}
                  className="p-3 md:p-4 rough-button font-bold flex items-center justify-center gap-2 hover:bg-ink hover:text-paper disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Hammer size={20} /> <span className="hidden sm:inline">Start</span>
                </button>
              </form>
            </section>

            {/* Task List - Placed below the prompt bar because existing tasks flow downwards from new creations */}
            <section className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-both flex-grow">
              <h2 className="text-xl md:text-2xl font-display mb-4 -rotate-1">Active Projects</h2>
              <div className="grid gap-4">
                {MOCK_TASKS.map((task, i) => (
                  <div key={task.id} className={`p-4 md:p-6 rough-border bg-paper sketch-box-shadow flex flex-col md:flex-row md:items-center justify-between gap-4 transition-transform hover:translate-x-1 ${i % 2 === 0 ? 'rotate-1' : '-rotate-1'}`}>
                    <div className="flex-grow">
                      <h3 className="text-lg md:text-xl font-bold mb-2">{task.title}</h3>
                      <div className="flex items-center gap-4 text-sm opacity-80">
                        <span className="flex items-center gap-1"><CircleDashed size={16} /> {task.status}</span>
                        <span className="flex items-center gap-1"><CheckCircle2 size={16} /> {task.progress}%</span>
                      </div>
                      {/* Simple progress bar */}
                      <div className="w-full h-2 bg-ink bg-opacity-10 rounded-full mt-3 overflow-hidden">
                        <div className="h-full bg-royal" style={{ width: `${task.progress}%` }}></div>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleStartBuilding(task.title)}
                      className="whitespace-nowrap px-4 py-3 md:px-6 md:py-4 rough-button-blue font-bold flex items-center gap-2 sketch-box-shadow-blue hover:-translate-y-1 hover:shadow-none transition-all shrink-0"
                    >
                      Build it <ArrowUpRight size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

          </div>
        </main>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // VIEW: BUILD CHAT
  // ---------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink selection:bg-royal selection:text-paper font-sans">
      {/* Header */}
      <header className="p-4 md:p-6 border-b-2 border-ink border-dashed flex items-center justify-between sticky top-0 bg-paper z-40">
        <button 
          onClick={() => setView('dashboard')}
          className="flex items-center gap-2 font-bold hover:text-royal transition-colors"
        >
          <ChevronLeft size={20} /> Back to Dashboard
        </button>
        <div className="font-display text-xl text-royal truncate max-w-[50%] -rotate-1">
          Building: <span className="scribble-underline">{activeProject}</span>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-grow flex flex-col overflow-y-auto p-4 md:p-8 scroll-smooth pb-48">
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
          {buildMessages.map((msg, idx) => (
            <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-5 md:p-6 max-w-[85%] md:max-w-[75%] leading-relaxed text-lg animate-in fade-in slide-in-from-bottom-2 duration-300 ${msg.role === 'user' ? 'bg-royal text-paper rough-border-blue' : 'bg-paper text-ink rough-border sketch-box-shadow'}`}>
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={buildEndRef} className="h-4" />
        </div>
      </main>

      {/* Input Area (Bottom Fixed) */}
      <div className="fixed bottom-0 left-0 w-full p-4 md:p-8 bg-gradient-to-t from-paper via-paper to-transparent z-50">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          
          {/* Uploaded Files Bar */}
          {uploadedFiles.length > 0 && (
            <div className="flex gap-2 flex-wrap mb-2 animate-in fade-in slide-in-from-bottom-2">
              {uploadedFiles.map((file, i) => (
                <div key={i} className="px-3 py-1 bg-ink text-paper text-sm font-mono rough-border flex items-center gap-2">
                  <FileText size={14} /> {file}
                </div>
              ))}
            </div>
          )}

          <form onSubmit={handleBuildSubmit} className="flex gap-2 sm:gap-4 p-2 bg-paper rough-border sketch-box-shadow items-center focus-within:-translate-y-1 focus-within:-translate-x-1 focus-within:shadow-none transition-transform relative">
            
            {/* File Upload Button */}
            <input 
              type="file" 
              multiple 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
            />
            <button 
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-4 text-ink hover:text-royal transition-colors shrink-0"
              title="Upload files"
            >
              <Paperclip size={24} />
            </button>

            <input 
              type="text" 
              value={buildInput}
              onChange={e => setBuildInput(e.target.value)}
              placeholder="What are we doing next?" 
              className="flex-grow bg-transparent outline-none py-4 font-sans text-lg placeholder-ink placeholder-opacity-40"
              autoFocus
            />
            
            <button 
              type="submit"
              disabled={!buildInput.trim()}
              className="p-4 md:px-8 rough-button font-bold flex items-center justify-center gap-2 hover:bg-ink hover:text-paper transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="hidden sm:inline">Send</span><Send size={20} className="sm:ml-2" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
