
import React, { useState } from 'react';
import { generatePetCareTips, generateWelcomeMessage } from '../services/geminiService';
import { Pet } from '../types';

interface GeminiAssistantProps {
  pets: Pet[];
}

const GeminiAssistant: React.FC<GeminiAssistantProps> = ({ pets }) => {
  const [selectedPetId, setSelectedPetId] = useState(pets.length > 0 ? pets[0].id : '');
  const [loading, setLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);
  const [mode, setMode] = useState<'tips' | 'welcome'>('tips');

  const handleGenerate = async () => {
    if (!selectedPetId) return;
    setLoading(true);
    setAiResult(null);
    const pet = pets.find(p => p.id === selectedPetId);
    if (!pet) return;

    let result = "";
    if (mode === 'tips') {
      const petInfo = `品種: ${pet.breed}, 年齡: ${pet.age}, 醫療紀錄: ${pet.medicalNotes}, 飲食需求: ${pet.dietaryNeeds}, 餵食習慣: ${pet.feedingHabit}, 貓砂偏好: ${pet.litterType}`;
      result = await generatePetCareTips(petInfo);
    } else {
      result = await generateWelcomeMessage(pet.ownerName, pet.name);
    }
    
    setAiResult(result);
    setLoading(false);
  };

  return (
    <div className="animate-fadeIn max-w-4xl mx-auto text-left">
      <header className="mb-8">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter">AI 照護助理</h2>
        <p className="text-slate-500">使用 Gemini AI 提供的專業建議與個性化訊息生成。</p>
      </header>

      <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">選擇毛孩</label>
            <select 
              className="w-full p-4 rounded-2xl border-2 border-slate-50 bg-slate-50 focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
              value={selectedPetId}
              onChange={(e) => setSelectedPetId(e.target.value)}
            >
              {pets.map(p => (
                <option key={p.id} value={p.id}>{p.name} ({p.breed})</option>
              ))}
              {pets.length === 0 && <option value="">無毛孩資料</option>}
            </select>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">功能模式</label>
            <div className="flex gap-3">
              <button 
                onClick={() => setMode('tips')}
                className={`flex-1 py-4 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${mode === 'tips' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}
              >
                照護建議
              </button>
              <button 
                onClick={() => setMode('welcome')}
                className={`flex-1 py-4 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${mode === 'welcome' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}
              >
                歡迎訊息
              </button>
            </div>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={loading || !selectedPetId}
          className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl disabled:opacity-50 transition-all flex justify-center items-center gap-3"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            '✨ 立即生成建議'
          )}
        </button>

        {aiResult && (
          <div className="mt-8 pt-8 border-t border-slate-50 animate-fadeIn">
            <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
              ✨ AI 建議內容
            </h3>
            <div className="bg-slate-50 rounded-[2rem] p-8 text-slate-700 font-bold leading-relaxed whitespace-pre-wrap text-sm">
              {aiResult}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GeminiAssistant;
