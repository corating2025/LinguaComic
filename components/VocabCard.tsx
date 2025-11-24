import React, { useState } from 'react';
import { Vocabulary } from '../types';

interface VocabListProps {
  vocabulary: Vocabulary[];
}

const VocabList: React.FC<VocabListProps> = ({ vocabulary }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {vocabulary.map((vocab, idx) => (
        <FlipCard key={idx} vocab={vocab} />
      ))}
    </div>
  );
};

const FlipCard: React.FC<{ vocab: Vocabulary }> = ({ vocab }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className="group h-80 perspective-1000 cursor-pointer"
      onClick={() => setIsFlipped(!isFlipped)}
    >
      <div className={`relative w-full h-full transition-all duration-500 transform style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
        
        {/* Front Face (Word Only) */}
        <div className="absolute w-full h-full bg-white rounded-xl shadow-md border-2 border-slate-100 p-6 flex flex-col items-center justify-center backface-hidden hover:shadow-xl hover:border-indigo-200 transition-all">
          <h3 className="text-4xl font-bold text-indigo-600 mb-4 text-center">{vocab.word}</h3>
          <p className="text-slate-400 text-xs mt-auto font-semibold uppercase tracking-wider flex items-center gap-1">
            <span>Tap to reveal</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
          </p>
        </div>

        {/* Back Face (Image + Meaning) */}
        <div className="absolute w-full h-full bg-white rounded-xl shadow-md border-2 border-indigo-100 overflow-hidden backface-hidden rotate-y-180 flex flex-col">
          
          {/* Image Half */}
          <div className="h-1/2 bg-slate-100 w-full relative overflow-hidden">
            {vocab.imageUrl ? (
               <img src={vocab.imageUrl} alt={vocab.word} className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs p-4 text-center">
                 {vocab.visualPrompt ? "Generating Image..." : "No image available"}
               </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
            <h3 className="absolute bottom-2 left-3 text-white font-bold text-xl shadow-sm">{vocab.word}</h3>
          </div>

          {/* Text Half */}
          <div className="h-1/2 p-4 flex flex-col justify-between bg-indigo-50/50">
             <div>
               <p className="text-slate-800 text-sm font-medium leading-relaxed mb-2">{vocab.definition}</p>
             </div>
             <div className="bg-white p-2 rounded border border-indigo-100 shadow-sm">
               <p className="text-indigo-600 text-xs italic">"{vocab.example}"</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VocabList;