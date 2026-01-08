
import React, { useState, useEffect } from 'react';
import { Booking, Pet, PreCheckRecord, BookingStatus } from '../types';
import { GoogleGenAI } from "@google/genai";

interface PreCheckFormProps {
  booking: Booking;
  pet: Pet;
  initialData?: PreCheckRecord;
  onSave: (record: PreCheckRecord) => void;
  onCancel: () => void;
}

const PreCheckForm: React.FC<PreCheckFormProps> = ({ booking, pet, initialData, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<PreCheckRecord>({
    bookingId: booking.id,
    petId: pet.id,
    date: new Date().toISOString().split('T')[0],
    weight: 4.5,
    mentalStatus: '活力',
    skinStatus: '健康',
    earStatus: '乾淨',
    eyeNoseStatus: '正常',
    teethStatus: '健康',
    limbStatus: '正常',
    belongings: '',
    staffNotes: '',
    aiSummary: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      // 確保即使沒傳入 initialData，也能鎖定正確的 ID
      setFormData(prev => ({ ...prev, bookingId: booking.id, petId: pet.id }));
    }
  }, [initialData, booking.id, pet.id]);

  const generateAISummary = async () => {
    setLoading(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const prompt = `你是寵物旅館專業管家。請根據以下檢查數據，為家長 ${pet.ownerName} 寫一段溫馨且專業的入館確認訊息，告訴家長毛孩 ${pet.name} 已經順利接手並完成檢查。
      體重：${formData.weight} kg
      精神：${formData.mentalStatus}
      皮膚：${formData.skinStatus}
      耳朵：${formData.earStatus}
      眼鼻：${formData.eyeNoseStatus}
      牙齒：${formData.teethStatus}
      四肢：${formData.limbStatus}
      攜帶物品：${formData.belongings}
      繁體中文，語氣要讓家長感到安心與專業。請針對「異常項」給予溫馨提醒。150字內。`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setFormData(prev => ({ ...prev, aiSummary: response.text || '' }));
    } catch (e) {
      alert("AI 生成失敗");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    // 基礎有效性檢查
    if (isNaN(formData.weight) || formData.weight <= 0) {
      alert("請輸入有效的體重數值");
      return;
    }

    const finalRecord: PreCheckRecord = {
      ...formData,
      bookingId: booking.id, // 強制確保 ID 匹配
      petId: pet.id
    };

    onSave(finalRecord);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      <div className="bg-white rounded-[4rem] p-12 max-w-4xl w-full shadow-2xl animate-slideUp text-left max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="flex justify-between items-start mb-10">
          <div>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mb-2 block">
              {initialData ? 'View/Update Record' : 'Initial Assessment'}
            </span>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter">
              {initialData ? '檢視/編輯入住檢查報告' : '新入住健康檢查報告'}
            </h3>
          </div>
          <button onClick={onCancel} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">✕</button>
        </div>

        <div className="flex items-center gap-6 p-8 bg-slate-50 rounded-[2.5rem] mb-10 border border-slate-100">
           <img src={pet.photoUrl} className="w-20 h-20 rounded-2xl object-cover shadow-lg" alt="" />
           <div>
              <p className="text-2xl font-black text-slate-900">{pet.name}</p>
              <p className="text-xs font-bold text-slate-400">{pet.breed} | {pet.gender}性</p>
           </div>
           <div className="ml-auto text-right">
              <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">預約編號</span>
              <span className="font-mono font-bold text-slate-700">#{booking.id.slice(-6)}</span>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div className="space-y-8">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
              <span className="text-lg">🩺</span> 生理與外觀檢查
            </h4>
            
            <div className="grid grid-cols-2 gap-6">
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">體重 (KG)</label>
                 <input 
                  type="number" 
                  step="0.1"
                  value={formData.weight || ''}
                  onChange={e => setFormData({...formData, weight: parseFloat(e.target.value) || 0})}
                  className="w-full p-4 bg-white rounded-2xl border-2 border-slate-100 font-black text-sm outline-none focus:border-indigo-600 transition-all" 
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">精神狀態</label>
                 <select 
                   value={formData.mentalStatus}
                   onChange={e => setFormData({...formData, mentalStatus: e.target.value as any})}
                   className="w-full p-4 bg-white rounded-2xl border-2 border-slate-100 font-bold text-sm outline-none focus:border-indigo-600 transition-all"
                 >
                   {['活力', '平靜', '緊張', '恐懼'].map(s => <option key={s}>{s}</option>)}
                 </select>
               </div>
            </div>

            <div className="space-y-6">
              {[
                { label: '皮膚/毛髮', field: 'skinStatus', options: ['健康', '紅腫', '有傷口', '有寄生蟲'] },
                { label: '耳道狀況', field: 'earStatus', options: ['乾淨', '異味', '發炎', '耳垢多'] },
                { label: '眼鼻分泌物', field: 'eyeNoseStatus', options: ['正常', '分泌物多', '打噴嚏'] },
                { label: '牙齒口腔', field: 'teethStatus', options: ['健康', '牙結石', '牙齦紅腫', '有異味'] },
                { label: '四肢/肉球', field: 'limbStatus', options: ['正常', '指甲過長', '肉球異常', '行走異常'] }
              ].map((item) => (
                <div key={item.field} className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{item.label}</label>
                  <div className="flex flex-wrap gap-2">
                    {item.options.map(opt => (
                      <button
                        key={opt}
                        onClick={() => setFormData({...formData, [item.field as keyof PreCheckRecord]: opt as any})}
                        className={`px-5 py-3 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${
                          formData[item.field as keyof PreCheckRecord] === opt 
                          ? (opt === '健康' || opt === '乾淨' || opt === '正常' ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg' : 'bg-rose-500 border-rose-500 text-white shadow-lg')
                          : 'bg-slate-50 border-transparent text-slate-400 hover:border-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-8">
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
              <span className="text-lg">🎒</span> 物品與備註
            </h4>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">家長攜帶物品</label>
              <textarea 
                value={formData.belongings}
                onChange={e => setFormData({...formData, belongings: e.target.value})}
                placeholder="例如：罐頭x5, 小被被, 常用藥..."
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold text-sm min-h-[100px] outline-none" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">管家額外備註</label>
              <textarea 
                value={formData.staffNotes}
                onChange={e => setFormData({...formData, staffNotes: e.target.value})}
                className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold text-sm min-h-[100px] outline-none" 
              />
            </div>

            <div className="bg-indigo-50/50 p-8 rounded-[2.5rem] border border-indigo-100 space-y-4">
               <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">✨ AI 專業安心報告</span>
                  <button 
                    onClick={generateAISummary}
                    disabled={loading}
                    className="text-[9px] font-black bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {loading ? '生成中...' : '重新生成內容'}
                  </button>
               </div>
               <div className="bg-white p-5 rounded-2xl border border-indigo-100 text-sm font-bold text-slate-600 leading-relaxed min-h-[150px] whitespace-pre-wrap">
                 {formData.aiSummary || '點擊上方按鈕生成給家長的入館回報...'}
               </div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex gap-4">
           <button onClick={onCancel} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase tracking-widest text-[11px]">取消</button>
           <button 
            onClick={handleSubmit} 
            className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-black transition-all"
           >
             儲存檢查結果
           </button>
        </div>
      </div>
    </div>
  );
};

export default PreCheckForm;
