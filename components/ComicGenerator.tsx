import React, { useState } from 'react';
import { ComicPanel } from '../types';

interface ComicGeneratorProps {
  panels: ComicPanel[];
  onUpdatePanel: (panelId: number, updatedPanel: ComicPanel) => void;
  onRegenerateImage: (panelId: number) => void;
}

const ComicGenerator: React.FC<ComicGeneratorProps> = ({ panels, onUpdatePanel, onRegenerateImage }) => {
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isRegenerating, setIsRegenerating] = useState<number | null>(null);

  const handleSave = (panel: ComicPanel) => {
    onUpdatePanel(panel.panelId, panel);
    setEditingId(null);
  };

  const handleRegenerateClick = async (panelId: number) => {
    setIsRegenerating(panelId);
    await onRegenerateImage(panelId);
    setIsRegenerating(null);
  };

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
        {panels.map((panel, index) => (
          <div key={panel.panelId} className="bg-white rounded-sm shadow-xl border-4 border-slate-900 overflow-hidden flex flex-col">
             {/* Header Number */}
            <div className="flex justify-between items-center bg-slate-900 px-3 py-1">
              <span className="text-white text-sm font-bold">#{index + 1}</span>
              <div className="space-x-2">
                 <button 
                    onClick={() => setEditingId(editingId === panel.panelId ? null : panel.panelId)}
                    className="text-xs bg-slate-700 text-white px-2 py-0.5 rounded hover:bg-slate-600"
                 >
                   {editingId === panel.panelId ? 'Close' : 'Edit'}
                 </button>
                 <button 
                    onClick={() => handleRegenerateClick(panel.panelId)}
                    disabled={isRegenerating === panel.panelId}
                    className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded hover:bg-indigo-500 disabled:opacity-50"
                 >
                   {isRegenerating === panel.panelId ? '...' : 'Redraw'}
                 </button>
              </div>
            </div>

            {/* Image Area */}
            <div className="aspect-[4/3] bg-slate-200 relative overflow-hidden group">
              {panel.imageUrl ? (
                <img 
                  src={panel.imageUrl} 
                  alt={panel.visualPrompt} 
                  className="w-full h-full object-cover grayscale-[20%] transition-all duration-500"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-slate-400">
                  <div className="animate-pulse flex flex-col items-center">
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span>Drawing...</span>
                  </div>
                </div>
              )}
              
              {/* Dialogue Bubble */}
              {panel.characterDialogue && (
                <div className={`absolute bottom-4 right-4 max-w-[70%] bg-white border-2 border-black rounded-xl rounded-br-none p-3 shadow-lg font-comic text-sm md:text-base leading-snug ${editingId === panel.panelId ? 'hidden' : ''}`}>
                  {panel.characterDialogue}
                </div>
              )}
            </div>

            {/* Content Area */}
            <div className="bg-white p-4 border-t-2 border-slate-100 flex-grow">
              {editingId === panel.panelId ? (
                <EditForm panel={panel} onSave={handleSave} />
              ) : (
                <p className="text-slate-700 text-sm font-medium italic">
                  {panel.caption}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EditForm: React.FC<{ panel: ComicPanel, onSave: (p: ComicPanel) => void }> = ({ panel, onSave }) => {
  const [data, setData] = useState(panel);

  return (
    <div className="space-y-3 animate-fade-in">
      <div>
        <label className="block text-xs text-slate-500 uppercase font-bold">Caption</label>
        <textarea 
          className="w-full border rounded p-1 text-sm"
          rows={2}
          value={data.caption}
          onChange={e => setData({...data, caption: e.target.value})}
        />
      </div>
      <div>
        <label className="block text-xs text-slate-500 uppercase font-bold">Dialogue</label>
        <textarea 
          className="w-full border rounded p-1 text-sm font-comic"
          rows={2}
          value={data.characterDialogue}
          onChange={e => setData({...data, characterDialogue: e.target.value})}
        />
      </div>
      <div className="flex justify-end">
        <button 
          onClick={() => onSave(data)}
          className="bg-green-600 text-white text-xs px-3 py-1 rounded hover:bg-green-700"
        >
          Save Text
        </button>
      </div>
    </div>
  )
}

export default ComicGenerator;