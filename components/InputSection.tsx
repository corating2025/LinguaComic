import React, { useState, useRef } from 'react';

interface InputSectionProps {
  onAnalyze: (text: string, imageBase64: string | undefined, mimeType: string | undefined, vocabCriteria: string) => void;
  isLoading: boolean;
}

const InputSection: React.FC<InputSectionProps> = ({ onAnalyze, isLoading }) => {
  const [text, setText] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [vocabCriteria, setVocabCriteria] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async () => {
    if (!text.trim() && !selectedFile) return;

    let imageBase64: string | undefined;
    let mimeType: string | undefined;

    if (selectedFile) {
      mimeType = selectedFile.type;
      imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Extract base64 part
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(selectedFile);
      });
    }

    onAnalyze(text, imageBase64, mimeType, vocabCriteria);
  };

  return (
    <div className="w-full max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-6 md:p-8 space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-bold text-slate-800">What do you want to learn today?</h2>
        <p className="text-slate-500">Paste your English text or upload a screenshot of your textbook.</p>
      </div>

      <div className="space-y-4">
        {/* Text Area */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Text Content</label>
          <textarea
            className="w-full h-32 p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
            placeholder="e.g. A paragraph about photosynthesis or a conversation between two friends..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={isLoading}
          />
        </div>

        {/* Vocab Options */}
        <div className="border border-slate-100 rounded-lg p-3 bg-slate-50">
          <button 
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-700"
          >
             <svg className={`w-4 h-4 mr-1 transform transition-transform ${showAdvanced ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
             Vocabulary Settings
          </button>
          
          {showAdvanced && (
            <div className="mt-3 animate-fade-in">
              <label className="block text-xs font-medium text-slate-600 mb-1">Custom Criteria (Optional)</label>
              <input 
                type="text" 
                value={vocabCriteria}
                onChange={(e) => setVocabCriteria(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded text-sm"
                placeholder="e.g. 'Focus on medical verbs', 'Only adjectives', 'Business English'"
              />
              <p className="text-xs text-slate-400 mt-1">Leave empty for automatic selection.</p>
            </div>
          )}
        </div>

        {/* Separator */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="px-2 bg-white text-sm text-slate-500">OR / AND</span>
          </div>
        </div>

        {/* Image Upload */}
        <div className="flex flex-col items-center justify-center">
          {!previewUrl ? (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-300 border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <svg className="w-8 h-8 mb-4 text-slate-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 16">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"/>
                </svg>
                <p className="text-sm text-slate-500"><span className="font-semibold">Click to upload</span> a screenshot</p>
                <p className="text-xs text-slate-500">PNG, JPG (MAX. 5MB)</p>
              </div>
              <input 
                ref={fileInputRef}
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileChange}
                disabled={isLoading} 
              />
            </label>
          ) : (
            <div className="relative w-full h-48 bg-slate-100 rounded-lg overflow-hidden flex items-center justify-center border border-slate-200">
              <img src={previewUrl} alt="Preview" className="h-full object-contain" />
              <button
                onClick={handleRemoveImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors shadow-sm"
                title="Remove image"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          )}
        </div>

        {/* Action Button */}
        <button
          onClick={handleSubmit}
          disabled={isLoading || (!text && !selectedFile)}
          className={`w-full py-4 px-6 rounded-lg text-white font-bold text-lg shadow-md transition-all
            ${isLoading 
              ? 'bg-indigo-300 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow-lg transform hover:-translate-y-0.5'
            }`}
        >
          {isLoading ? (
            <span className="flex items-center justify-center space-x-2">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Thinking...
            </span>
          ) : (
            "Transform to Manga"
          )}
        </button>
      </div>
    </div>
  );
};

export default InputSection;