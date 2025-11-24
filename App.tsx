import React, { useState } from 'react';
import InputSection from './components/InputSection';
import ComicGenerator from './components/ComicGenerator';
import LogicGraph from './components/LogicGraph';
import VocabList from './components/VocabCard';
import { analyzeContent, generateImage } from './services/geminiService';
import { AnalysisResult, AppState, ComicPanel, LogicGraphData } from './types';

function App() {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [data, setData] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'comic' | 'logic' | 'vocab'>('comic');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAnalyze = async (text: string, imageBase64: string | undefined, mimeType: string | undefined, vocabCriteria: string) => {
    setAppState(AppState.ANALYZING);
    setErrorMsg(null);
    setData(null);

    try {
      // Step 1: Analyze structure and get text data
      const result = await analyzeContent(text, imageBase64, mimeType, vocabCriteria);
      setData(result);
      setAppState(AppState.GENERATING_IMAGES);

      // Step 2: Generate Images for comic panels
      const comicPromises = result.comicScript.map(async (panel) => {
        try {
          const imageUrl = await generateImage(panel.visualPrompt);
          return { ...panel, imageUrl };
        } catch (e) {
          console.error("Failed to gen image for panel", panel.panelId, e);
          return panel;
        }
      });

      // Step 3: Generate Images for Vocabulary (Parallel with comic to save time, or sequentially to manage rate limits?)
      // Let's do them in parallel but catch errors individually
      const vocabPromises = result.vocabulary.map(async (v) => {
        try {
          const imageUrl = await generateImage(v.visualPrompt || `Illustration of ${v.word}`);
          return { ...v, imageUrl };
        } catch (e) {
          console.error("Failed to gen image for vocab", v.word, e);
          return v;
        }
      });

      // Wait for all
      const [panelsWithImages, vocabWithImages] = await Promise.all([
        Promise.all(comicPromises),
        Promise.all(vocabPromises)
      ]);

      // Update data with images
      setData(prev => prev ? { 
        ...prev, 
        comicScript: panelsWithImages,
        vocabulary: vocabWithImages
      } : null);

      setAppState(AppState.COMPLETE);

    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong. Please check your API key or try simpler content.");
      setAppState(AppState.ERROR);
    }
  };

  // Handler for updating comic text
  const handleUpdatePanel = (panelId: number, updatedPanel: ComicPanel) => {
    if (!data) return;
    const newScript = data.comicScript.map(p => p.panelId === panelId ? updatedPanel : p);
    setData({ ...data, comicScript: newScript });
  };

  // Handler for regenerating comic image
  const handleRegeneratePanelImage = async (panelId: number) => {
    if (!data) return;
    const panel = data.comicScript.find(p => p.panelId === panelId);
    if (!panel) return;

    try {
      const newImageUrl = await generateImage(panel.visualPrompt);
      const newScript = data.comicScript.map(p => p.panelId === panelId ? { ...p, imageUrl: newImageUrl } : p);
      setData({ ...data, comicScript: newScript });
    } catch (e) {
      console.error("Failed to regenerate image", e);
    }
  };

  // Handler for updating logic graph
  const handleUpdateLogic = (newGraphData: LogicGraphData) => {
    if (!data) return;
    setData({ ...data, logicGraph: newGraphData });
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">📚</span>
            <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              LinguaComic
            </h1>
          </div>
          <div className="text-sm text-slate-500 hidden sm:block">
            Learn English visually with GenAI
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow bg-slate-50 py-10 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* Input Section - Only show if idle or error */}
          {(appState === AppState.IDLE || appState === AppState.ERROR) && (
            <div className="animate-fade-in-up">
              <InputSection onAnalyze={handleAnalyze} isLoading={false} />
              {appState === AppState.ERROR && (
                <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-lg text-center border border-red-100">
                  {errorMsg}
                </div>
              )}
            </div>
          )}

          {/* Loading State */}
          {appState === AppState.ANALYZING && (
            <div className="text-center py-20 animate-pulse">
               <div className="text-6xl mb-4">🧠</div>
               <h3 className="text-2xl font-bold text-slate-800">Analyzing Content...</h3>
               <p className="text-slate-500">Extracting logic, vocabulary, and story.</p>
            </div>
          )}

          {appState === AppState.GENERATING_IMAGES && data && (
            <div className="space-y-8">
               <div className="text-center">
                 <h3 className="text-xl font-semibold text-indigo-600 mb-2">Structure Analyzed!</h3>
                 <p className="text-slate-600">Now illustrating your comics and flashcards...</p>
                 <div className="w-full max-w-md mx-auto h-2 bg-slate-200 rounded-full mt-4 overflow-hidden">
                   <div className="h-full bg-indigo-500 animate-progress"></div>
                 </div>
               </div>
            </div>
          )}

          {/* Results View */}
          {appState === AppState.COMPLETE && data && (
            <div className="space-y-8 animate-fade-in">
              
              <div className="flex justify-between items-center flex-wrap gap-4">
                <h2 className="text-2xl font-bold text-slate-900">Result</h2>
                <button 
                  onClick={() => setAppState(AppState.IDLE)}
                  className="text-indigo-600 hover:text-indigo-800 font-medium text-sm flex items-center"
                >
                  ← Start Over
                </button>
              </div>

              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
                 <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wide mb-2">Summary</h3>
                 <p className="text-lg text-slate-700 leading-relaxed">{data.summary}</p>
              </div>

              {/* Tabs */}
              <div className="flex space-x-1 bg-slate-200 p-1 rounded-lg w-fit mx-auto">
                {(['comic', 'logic', 'vocab'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                      activeTab === tab 
                      ? 'bg-white text-indigo-600 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="min-h-[500px]">
                {activeTab === 'comic' && (
                  <ComicGenerator 
                    panels={data.comicScript} 
                    onUpdatePanel={handleUpdatePanel}
                    onRegenerateImage={handleRegeneratePanelImage}
                  />
                )}
                {activeTab === 'logic' && (
                  <div className="space-y-4">
                    <p className="text-center text-slate-500 text-sm">Interactive Logic Map: Drag nodes to explore or click Edit to modify data.</p>
                    <LogicGraph 
                      data={data.logicGraph} 
                      onUpdate={handleUpdateLogic}
                    />
                  </div>
                )}
                {activeTab === 'vocab' && (
                  <VocabList vocabulary={data.vocabulary} />
                )}
              </div>

            </div>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-10">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400 text-sm">
          Powered by Gemini 2.5 • D3.js • Tailwind CSS
        </div>
      </footer>
      
      <style>{`
        @keyframes progress {
          0% { width: 0% }
          50% { width: 70% }
          100% { width: 90% }
        }
        .animate-progress {
          animation: progress 10s ease-out forwards;
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.5s ease-out;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        /* Flip Card Utils */
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        .style-preserve-3d { transform-style: preserve-3d; }
      `}</style>
    </div>
  );
}

export default App;