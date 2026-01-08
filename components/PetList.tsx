import React, { useState, useMemo, useRef } from 'react';
import { Pet, PetType } from '../types';
import { GoogleGenAI } from "@google/genai";

interface PetListProps {
  pets: Pet[];
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
);

const PetList: React.FC<PetListProps> = ({ pets, setPets }) => {
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [isAiMode, setIsAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiFilteredIds, setAiFilteredIds] = useState<string[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 全方位關鍵字過濾
  const filteredPets = useMemo(() => {
    // 如果處於 AI 模式且有過濾結果
    if (isAiMode && aiFilteredIds !== null) {
      return pets.filter(p => aiFilteredIds.includes(p.id));
    }

    const term = searchTerm.trim().toLowerCase();
    if (!term) return pets;
    
    return pets.filter(pet => 
      pet.name.toLowerCase().includes(term) || 
      pet.ownerName.toLowerCase().includes(term) ||
      pet.chipNumber.includes(term) ||
      pet.breed.toLowerCase().includes(term) ||
      pet.allergens?.toLowerCase().includes(term) ||
      pet.medicalNotes?.toLowerCase().includes(term) ||
      pet.dietaryNeeds?.toLowerCase().includes(term)
    );
  }, [searchTerm, pets, isAiMode, aiFilteredIds]);

  const handleAiSearch = async () => {
    if (!aiQuery.trim()) {
      setAiFilteredIds(null);
      return;
    }
    
    setAiLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      // 構建精簡的數據給 AI 判斷
      const petContext = pets.map(p => ({
        id: p.id,
        name: p.name,
        breed: p.breed,
        gender: p.gender,
        medical: p.medicalNotes,
        allergens: p.allergens,
        diet: p.dietaryNeeds
      }));

      const prompt = `你是一個專業的寵物管理助手。請根據以下毛孩清單，找出符合描述「${aiQuery}」的所有毛孩 ID。
      
      毛孩數據：${JSON.stringify(petContext)}
      
      請僅返回一個包含符合條件 ID 的 JSON 陣列，例如：["p1", "p3"]。如果沒有符合條件的，請返回空陣列 []。不要包含任何解釋文字。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const result = JSON.parse(response.text || '[]');
      setAiFilteredIds(result);
    } catch (e) {
      console.error("AI Search Error:", e);
      alert("AI 智慧篩選暫時不可用，請稍後再試。");
    } finally {
      setAiLoading(false);
    }
  };

  const handleDeletePet = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (confirm('確定要永久刪除此毛孩檔案嗎？這會連動影響到所有相關紀錄。')) {
      setPets(prev => prev.filter(p => p.id !== id));
    }
  };

  const startEdit = (pet: Pet, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPet(pet);
  };

  const handleUpdatePet = () => {
    if (!editingPet) return;
    setPets(prev => {
      const exists = prev.some(p => p.id === editingPet.id);
      if (exists) {
        return prev.map(p => p.id === editingPet.id ? editingPet : p);
      } else {
        return [editingPet, ...prev];
      }
    });
    setEditingPet(null);
  };

  const handleAddNew = () => {
    const newPet: Pet = {
      id: Date.now().toString(),
      name: '新毛孩',
      type: PetType.CAT,
      gender: '未知',
      breed: '米克斯',
      age: 1,
      chipNumber: '',
      ownerName: '家長姓名',
      ownerPhone: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      familiarHospital: '',
      medicalNotes: '',
      dietaryNeeds: '',
      photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200&h=200',
      litterType: '',
      feedingHabit: '',
      allergens: ''
    };
    setEditingPet(newPet);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingPet) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditingPet({ ...editingPet, photoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="animate-fadeIn pb-10 text-left">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-12 gap-8">
        <div className="flex-1 w-full">
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">毛孩檔案庫</h2>
          <p className="text-slate-500 font-medium mt-1">完整管理所有小房客的生理資訊與家長聯絡管道。</p>
          
          <div className="mt-8 flex flex-col md:flex-row gap-4 items-stretch">
            {/* 標準搜尋列 */}
            <div className="relative flex-1 group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                <span className="text-xl">🔍</span>
              </div>
              <input 
                type="text" 
                placeholder="搜尋姓名、品種、過敏原、醫療備註..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsAiMode(false);
                }}
                className="w-full bg-white border-2 border-slate-100 py-5 pl-16 pr-6 rounded-[2rem] text-sm font-bold text-slate-700 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-50/50 transition-all shadow-sm"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')} 
                  className="absolute inset-y-0 right-6 text-slate-300 hover:text-slate-500 font-black"
                >✕</button>
              )}
            </div>

            {/* AI 智慧搜尋按鈕與切換 */}
            <div className="flex gap-2">
              <div className={`flex items-center gap-2 p-1.5 rounded-[2rem] border-2 transition-all ${isAiMode ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-100'}`}>
                {isAiMode && (
                  <input 
                    type="text"
                    placeholder="例如：過敏的布偶貓"
                    value={aiQuery}
                    onChange={(e) => setAiQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
                    className="bg-white/10 px-6 py-3 rounded-full text-white placeholder:text-white/50 text-xs font-bold outline-none border-0 w-48"
                  />
                )}
                <button 
                  onClick={() => {
                    if (isAiMode && aiQuery) {
                      handleAiSearch();
                    } else {
                      setIsAiMode(!isAiMode);
                      if (!isAiMode) setAiFilteredIds(null);
                    }
                  }}
                  disabled={aiLoading}
                  className={`px-6 py-3 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isAiMode ? 'bg-white text-indigo-600 shadow-lg' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                >
                  {aiLoading ? (
                    <div className="w-3 h-3 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  ) : '✨ AI 語意篩選'}
                </button>
              </div>
            </div>
          </div>
          
          {isAiMode && aiFilteredIds !== null && (
            <p className="mt-4 text-[10px] font-black text-indigo-500 uppercase tracking-widest bg-indigo-50 inline-block px-4 py-1.5 rounded-full animate-fadeIn">
              💡 AI 找到 {filteredPets.length} 個符合描述的結果
              <button onClick={() => { setIsAiMode(false); setAiFilteredIds(null); }} className="ml-3 text-indigo-300 hover:text-indigo-600 underline">清除結果</button>
            </p>
          )}
        </div>

        <button 
          onClick={handleAddNew}
          className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl flex items-center gap-3 shrink-0"
        >
          <span className="text-2xl">+</span> 新增檔案
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-8">
        {filteredPets.map((pet) => (
          <div 
            key={pet.id} 
            className="bg-white rounded-[3rem] shadow-sm border border-slate-100 flex flex-col hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 group overflow-hidden"
          >
            <div className="p-8 pb-4 flex items-center gap-6">
              <div className="relative shrink-0">
                <img 
                  src={pet.photoUrl} 
                  alt={pet.name} 
                  className="w-24 h-24 rounded-[2.2rem] object-cover border-4 border-white shadow-xl"
                />
                <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1.5 rounded-xl text-xs">🐾</div>
              </div>
              <div className="text-left overflow-hidden">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter truncate">{pet.name}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${
                    pet.gender === '公' ? 'text-indigo-500 bg-indigo-50' : 
                    pet.gender === '母' ? 'text-rose-500 bg-rose-50' : 
                    'text-slate-500 bg-slate-50'
                  }`}>
                    {pet.gender === '公' ? '♂ ' : pet.gender === '母' ? '♀ ' : ''}{pet.gender}
                  </span>
                  <span className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full">{pet.breed}</span>
                  <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-3 py-1 rounded-full">{pet.age} 歲</span>
                </div>
              </div>
            </div>
            
            <div className="px-8 pb-4 space-y-4">
              <div className="p-5 bg-indigo-50/30 rounded-3xl border border-indigo-100/50 text-left">
                 <div className="flex justify-between items-center mb-3">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">家長姓名 / 電話</span>
                    <span className="text-xs font-black text-slate-800 truncate ml-2">{pet.ownerName} | {pet.ownerPhone}</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">晶片號碼</span>
                    <span className="text-[11px] font-mono font-bold text-slate-600 truncate ml-2">{pet.chipNumber || '未登錄'}</span>
                 </div>
              </div>

              <div className="p-5 bg-slate-50 rounded-3xl border border-slate-200/50 space-y-3 text-left">
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">餵食習慣</span>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{pet.feedingHabit || '暫無資訊'}</p>
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">習慣貓砂</span>
                    <p className="text-[11px] font-bold text-slate-600 leading-relaxed">{pet.litterType || '暫無資訊'}</p>
                 </div>
              </div>

              <div className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-3 text-left">
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">緊急聯絡 / 電話</span>
                    <span className="text-[11px] font-bold text-slate-700 truncate ml-2">{pet.emergencyContactName} ({pet.emergencyContactPhone})</span>
                 </div>
                 <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">熟識獸醫 / 醫院</span>
                    <span className="text-[11px] font-bold text-slate-700 truncate ml-2">{pet.familiarHospital || '未填寫'}</span>
                 </div>
              </div>

              <div className={`p-5 rounded-3xl border text-left space-y-2 ${pet.allergens ? 'bg-rose-50/50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
                 <div className="flex flex-col">
                    <span className={`text-[9px] font-black uppercase tracking-widest mb-1 ${pet.allergens ? 'text-rose-400' : 'text-slate-400'}`}>🚫 過敏原限制</span>
                    <p className={`text-[11px] font-black truncate ${pet.allergens ? 'text-rose-700' : 'text-slate-400'}`}>{pet.allergens || 'None'}</p>
                 </div>
                 <div className={`pt-2 border-t flex flex-col ${pet.allergens ? 'border-rose-100' : 'border-slate-200'}`}>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">🩺 過往病史 / 備註</span>
                    <p className="text-[11px] font-bold text-slate-600 italic leading-relaxed">{pet.medicalNotes || '無特殊病史'}</p>
                 </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex gap-3">
              <button 
                onClick={(e) => startEdit(pet, e)}
                className="flex-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 py-3 rounded-xl hover:bg-white transition-all border border-transparent hover:border-indigo-100"
              >
                編輯詳情
              </button>
              <button 
                onClick={(e) => handleDeletePet(pet.id, e)}
                className="flex-1 text-[10px] font-black uppercase tracking-widest text-slate-400 py-3 rounded-xl hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <TrashIcon /> 刪除
              </button>
            </div>
          </div>
        ))}
        {filteredPets.length === 0 && (
          <div className="col-span-full py-32 flex flex-col items-center justify-center bg-white rounded-[4rem] border-2 border-dashed border-slate-100">
             <p className="text-6xl mb-6">🏜️</p>
             <h4 className="text-xl font-black text-slate-900 tracking-tighter">找不到符合條件的毛孩</h4>
             <p className="text-slate-400 font-bold mt-2">請嘗試簡化搜尋關鍵字，或使用 AI 智慧篩選功能。</p>
             <button onClick={() => { setSearchTerm(''); setIsAiMode(false); }} className="mt-8 text-indigo-600 font-black uppercase text-xs tracking-widest bg-indigo-50 px-8 py-4 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all">重置搜尋條件</button>
          </div>
        )}
      </div>

      {editingPet && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
          <div className="bg-white rounded-[4rem] p-12 max-w-4xl w-full shadow-2xl animate-slideUp text-left max-h-[90vh] overflow-y-auto custom-scrollbar">
            <h3 className="text-4xl font-black text-slate-900 mb-10 tracking-tighter">編輯毛孩檔案</h3>
            
            <div className="mb-12 flex flex-col md:flex-row items-center gap-8 bg-slate-50 p-8 rounded-[3rem] border-2 border-dashed border-slate-200">
               <div className="relative group shrink-0">
                  <img 
                    src={editingPet.photoUrl} 
                    className="w-40 h-40 rounded-[3rem] object-cover border-8 border-white shadow-2xl transition-transform group-hover:scale-105" 
                    alt="Preview" 
                  />
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 rounded-[3rem] flex flex-col items-center justify-center transition-opacity"
                  >
                    <span className="text-2xl mb-1">📸</span>
                    <span className="text-[10px] font-black uppercase tracking-widest">更換照片</span>
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
               </div>
               <div className="flex-1 space-y-4 w-full">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">照片網址 (URL)</label>
                    <input 
                      type="text" 
                      value={editingPet.photoUrl} 
                      onChange={e => setEditingPet({...editingPet, photoUrl: e.target.value})} 
                      className="w-full p-4 bg-white rounded-2xl border-2 border-slate-100 font-bold text-sm outline-none focus:border-indigo-600 transition-all" 
                      placeholder="請貼上圖片連結或點擊左側圖片上傳..."
                    />
                  </div>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] border-b pb-2">身分與飼主資訊</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">毛孩姓名</label>
                      <input type="text" value={editingPet.name} onChange={e => setEditingPet({...editingPet, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">性別</label>
                      <div className="flex gap-2">
                        {['公', '母', '未知'].map((g) => (
                          <button
                            key={g}
                            onClick={() => setEditingPet({...editingPet, gender: g as any})}
                            className={`flex-1 py-3 rounded-xl text-xs font-black transition-all border-2 ${
                              editingPet.gender === g 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' 
                                : 'bg-white border-slate-100 text-slate-400 hover:border-slate-200'
                            }`}
                          >
                            {g}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">品種</label>
                      <input type="text" value={editingPet.breed} onChange={e => setEditingPet({...editingPet, breed: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">年齡</label>
                      <input type="number" value={editingPet.age} onChange={e => setEditingPet({...editingPet, age: Number(e.target.value)})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">晶片號碼</label>
                    <input type="text" value={editingPet.chipNumber} onChange={e => setEditingPet({...editingPet, chipNumber: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-mono font-bold outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">家長姓名</label>
                      <input type="text" value={editingPet.ownerName} onChange={e => setEditingPet({...editingPet, ownerName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">家長電話</label>
                      <input type="text" value={editingPet.ownerPhone} onChange={e => setEditingPet({...editingPet, ownerPhone: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">緊急聯絡人</label>
                      <input type="text" value={editingPet.emergencyContactName} onChange={e => setEditingPet({...editingPet, emergencyContactName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">緊急聯絡電話</label>
                      <input type="text" value={editingPet.emergencyContactPhone} onChange={e => setEditingPet({...editingPet, emergencyContactPhone: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none" />
                    </div>
                  </div>
               </div>

               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-[0.3em] border-b pb-2">照護、獸醫與病史</h4>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">熟識獸醫 / 醫院</label>
                    <input type="text" value={editingPet.familiarHospital} onChange={e => setEditingPet({...editingPet, familiarHospital: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">餵食習慣</label>
                      <input type="text" value={editingPet.feedingHabit} onChange={e => setEditingPet({...editingPet, feedingHabit: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">習慣貓砂</label>
                      <input type="text" value={editingPet.litterType} onChange={e => setEditingPet({...editingPet, litterType: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">過敏原 (限制)</label>
                    <input type="text" value={editingPet.allergens} onChange={e => setEditingPet({...editingPet, allergens: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">過往病史 / 備註</label>
                    <textarea value={editingPet.medicalNotes} onChange={e => setEditingPet({...editingPet, medicalNotes: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold text-sm min-h-[120px] outline-none" />
                  </div>
               </div>
            </div>
            <div className="flex gap-4 mt-12">
               <button onClick={() => setEditingPet(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-xs">取消</button>
               <button onClick={handleUpdatePet} className="flex-1 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl">儲存變更</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PetList;