import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DailyCareLog, Pet, BookingStatus, Booking } from '../types';
import { GoogleGenAI } from "@google/genai";
import html2canvas from 'html2canvas';

interface DailyCareLogsProps {
  bookings: Booking[];
  pets: Pet[];
}

const DailyCareLogs: React.FC<DailyCareLogsProps> = ({ bookings, pets }) => {
  const [logs, setLogs] = useState<DailyCareLog[]>(() => JSON.parse(localStorage.getItem('fm_care_logs') || '[]'));
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [sharingLog, setSharingLog] = useState<{ pet: Pet; log: DailyCareLog; booking: Booking } | null>(null);
  const [editingPetId, setEditingPetId] = useState<string | null>(null);
  const [generatingAI, setGeneratingAI] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  // Sharing Card Temporary Editable States
  const [editStayPeriod, setEditStayPeriod] = useState('');
  const [editRoomNumber, setEditRoomNumber] = useState('');

  const [feeding, setFeeding] = useState<DailyCareLog['feedingStatus']>('全部吃完');
  const [litter, setLitter] = useState<DailyCareLog['litterStatus']>('漂亮成型');
  const [mental, setMental] = useState<DailyCareLog['mentalStatus']>('電力滿格');
  const [noteText, setNoteText] = useState('');

  useEffect(() => localStorage.setItem('fm_care_logs', JSON.stringify(logs)), [logs]);

  const activeInHouse = useMemo(() => {
    const relevant = bookings.filter(b => b.status === BookingStatus.CHECKED_IN && selectedDate >= b.checkIn && selectedDate <= b.checkOut);
    const result: { pet: Pet, room: string, booking: Booking }[] = [];
    relevant.forEach(b => b.petIds.forEach(pid => {
      const p = pets.find(item => item.id === pid);
      if (p) result.push({ pet: p, room: b.roomNumber, booking: b });
    }));
    return result;
  }, [bookings, pets, selectedDate]);

  const handleOpenLog = (petId: string) => {
    const exist = logs.find(l => l.petId === petId && l.date === selectedDate);
    setEditingPetId(petId);
    if (exist) {
      setFeeding(exist.feedingStatus); setLitter(exist.litterStatus); setMental(exist.mentalStatus); setNoteText(exist.notes);
    } else {
      setFeeding('全部吃完'); setLitter('漂亮成型'); setMental('電力滿格'); setNoteText('');
    }
    setShowAddModal(true);
  };

  const handleOpenShare = (item: { pet: Pet; log: DailyCareLog; booking: Booking }) => {
    setEditStayPeriod(`${item.booking.checkIn} — ${item.booking.checkOut}`);
    setEditRoomNumber(item.booking.roomNumber);
    setSharingLog(item);
  };

  const generateConversationalAI = async () => {
    if (!editingPetId) return;
    const pet = pets.find(p => p.id === editingPetId);
    setGeneratingAI(true);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    try {
      const prompt = `你是寵物旅館的管家，正在用親切、溫馨、像是在聊天分享趣聞的口氣跟 ${pet?.name} 的家長回報今日狀況。
      數據：食慾 ${feeding}, 精神活力 ${mental}, 排便狀況 ${litter}。
      請寫一段約 60 字的生活化訊息，包含這孩子今天在旅館的小細節或情緒，讓家長聽了會覺得心暖暖的。繁體中文。`;
      const response = await ai.models.generateContent({ model: 'gemini-3-flash-preview', contents: prompt });
      setNoteText(response.text || '');
    } catch (e) { alert("AI 忙碌中，請稍後再試。"); } finally { setGeneratingAI(false); }
  };

  return (
    <div className="animate-fadeIn pb-24 text-left">
      <header className="mb-10 text-left">
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic">Daily Care Logs</h2>
        <div className="flex items-center gap-4 mt-4">
           <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-white px-5 py-3 rounded-2xl border-2 border-slate-100 shadow-sm font-black outline-none focus:border-indigo-600 transition-all" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">當前在館毛孩共 {activeInHouse.length} 位</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {activeInHouse.map(({pet, room, booking}) => {
          const log = logs.find(l => l.petId === pet.id && l.date === selectedDate);
          return (
            <div key={pet.id} className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-sm flex flex-col hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-1 group relative overflow-hidden">
              <div className="flex justify-between items-start mb-8 relative z-10">
                <div className="flex items-center gap-5">
                  <div className="relative">
                    <img src={pet.photoUrl} className="w-20 h-20 rounded-[1.8rem] object-cover shadow-lg border-2 border-white group-hover:scale-110 transition-transform" alt="" />
                    <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white w-7 h-7 rounded-lg flex items-center justify-center text-[10px]">🐾</div>
                  </div>
                  <div className="text-left">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{pet.name}</h3>
                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{room} 房房客</p>
                  </div>
                </div>
                {log && (
                  <button 
                    onClick={() => handleOpenShare({pet, log, booking})} 
                    className="bg-indigo-50 text-indigo-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all shadow-sm flex items-center gap-2"
                  >
                    ✨ 生成分享卡
                  </button>
                )}
              </div>
              <button 
                onClick={() => handleOpenLog(pet.id)} 
                className={`w-full py-8 border-2 border-dashed rounded-[2.5rem] transition-all flex flex-col items-center justify-center gap-2 relative z-10 ${log ? 'bg-emerald-50 border-emerald-100 text-emerald-600 shadow-inner' : 'bg-slate-50 border-slate-100 text-slate-300'}`}
              >
                 <span className="text-2xl">{log ? '✅' : '✏️'}</span>
                 <p className="text-[10px] font-black uppercase tracking-[0.2em]">{log ? '今日觀察已完成' : '填寫今日觀察'}</p>
              </button>
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-50/20 rounded-full blur-3xl -z-0"></div>
            </div>
          );
        })}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[4rem] p-12 max-w-xl w-full shadow-2xl text-left animate-slideUp">
             <h3 className="text-3xl font-black mb-10 tracking-tighter text-slate-900">毛孩日常觀察錄</h3>
             <div className="space-y-8">
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">🍱 今日食慾</label>
                   <div className="grid grid-cols-2 gap-2">
                      {['全部吃完', '剩下一點', '沒啥胃口', '未進食'].map(o => (
                        <button key={o} onClick={() => setFeeding(o as any)} className={`py-3 rounded-2xl text-[11px] font-black border-2 transition-all ${feeding === o ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>{o}</button>
                      ))}
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">⚡ 精神活力</label>
                   <div className="grid grid-cols-2 gap-2">
                      {['電力滿格', '穩重安靜', '懶懶的', '顯得緊張'].map(o => (
                        <button key={o} onClick={() => setMental(o as any)} className={`py-3 rounded-2xl text-[11px] font-black border-2 transition-all ${mental === o ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>{o}</button>
                      ))}
                   </div>
                </div>
                <div className="space-y-4">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">🏜️ 排便觀察</label>
                   <div className="grid grid-cols-2 gap-2">
                      {['漂亮成型', '有點軟便', '拉肚子了', '還沒便便'].map(o => (
                        <button key={o} onClick={() => setLitter(o as any)} className={`py-3 rounded-2xl text-[11px] font-black border-2 transition-all ${litter === o ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}>{o}</button>
                      ))}
                   </div>
                </div>
                <div className="space-y-3">
                   <div className="flex justify-between items-center">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">生活隨手記</label>
                      <button onClick={generateConversationalAI} disabled={generatingAI} className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl hover:bg-indigo-100 transition-all">✨ AI 管家親切聊天</button>
                   </div>
                   <textarea value={noteText} onChange={e => setNoteText(e.target.value)} className="w-full p-8 bg-slate-50 border-2 border-slate-100 rounded-[2.5rem] font-bold outline-none min-h-[160px] text-sm leading-relaxed" placeholder="跟家長分享這孩子今天的小趣事吧..." />
                </div>
                <div className="flex gap-4 pt-4">
                   <button onClick={() => setShowAddModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[11px]">關閉</button>
                   <button onClick={() => { 
                     setLogs(prev => [{ id: Date.now().toString(), petId: editingPetId!, date: selectedDate, feedingStatus: feeding, litterStatus: litter, mentalStatus: mental, mood: '開心', notes: noteText }, ...prev.filter(l => !(l.petId === editingPetId && l.date === selectedDate))]); 
                     setShowAddModal(false); 
                   }} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-[11px] shadow-2xl">儲存並完成紀錄</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {sharingLog && (
        <div className="fixed inset-0 z-[800] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fadeIn">
           <div className="flex flex-col xl:flex-row gap-8 items-start animate-scaleIn">
              
              {/* Premium Fresh Stationery Card */}
              <div ref={shareCardRef} className="w-[460px] bg-[#fdfbf7] rounded-[2.5rem] p-0 text-left relative overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-[#e8e4db]">
                 
                 {/* Top Aesthetic Header */}
                 <div className="px-12 pt-16 pb-8 relative z-10 overflow-hidden">
                    <div className="absolute inset-0 opacity-[0.05] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#8a8a8a 0.5px, transparent 0.5px)', backgroundSize: '18px 18px' }}></div>
                    
                    <div className="flex justify-between items-start relative z-10">
                       <div className="space-y-1">
                          <p className="text-[9px] font-black text-indigo-600 uppercase tracking-[0.4em] mb-3 border-b border-indigo-200 inline-block pb-1">Stay Journal</p>
                          <h1 className="text-4xl font-black text-[#2d3436] tracking-tighter leading-tight">
                             今日的 {sharingLog.pet.name}
                          </h1>
                       </div>
                       <div className="bg-white px-5 py-3 rounded-2xl shadow-sm border border-[#eeebe3] transform rotate-3 flex flex-col items-center">
                          <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest leading-none mb-1">Observation</p>
                          <p className="text-[11px] font-black text-slate-800 font-mono tracking-tighter">{sharingLog.log.date}</p>
                       </div>
                    </div>
                 </div>

                 {/* New Stay Details Section */}
                 <div className="px-12 pb-6 relative z-10">
                    <div className="bg-white/40 p-6 rounded-3xl border border-[#eeebe3] flex flex-col gap-4">
                       <div className="flex justify-between items-center">
                          <div className="space-y-1">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">住宿期間</p>
                             <p className="text-xl font-black text-indigo-600 font-mono tracking-tighter">{editStayPeriod}</p>
                          </div>
                          <div className="text-right space-y-1">
                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">房號</p>
                             <p className="text-xl font-black text-slate-800 font-mono">{editRoomNumber}</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Status Section */}
                 <div className="px-12 pb-14 relative z-10">
                    <div className="grid grid-cols-1 gap-6 mb-12">
                       {[
                         { icon: '🍱', label: 'Appetite Report', value: sharingLog.log.feedingStatus, desc: '飲食與食慾觀察', color: 'text-orange-500', dot: 'bg-orange-400' },
                         { icon: '⚡', label: 'Activity Level', value: sharingLog.log.mentalStatus, desc: '精神與活力狀態', color: 'text-indigo-500', dot: 'bg-indigo-400' },
                         { icon: '🏜️', label: 'Digestive Status', value: sharingLog.log.litterStatus, desc: '排便與消化健康', color: 'text-emerald-500', dot: 'bg-emerald-400' }
                       ].map((item, idx) => (
                         <div key={idx} className="flex items-center gap-6 group">
                            <div className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-[#eeebe3] flex items-center justify-center text-xl transition-transform group-hover:scale-110">
                               {item.icon}
                            </div>
                            <div className="flex-1 flex justify-between items-center border-b border-[#eeebe3] pb-3">
                               <div>
                                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-0.5">{item.label}</p>
                                  <p className="text-[10px] font-bold text-slate-400 italic">{item.desc}</p>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className={`w-1.5 h-1.5 rounded-full ${item.dot} animate-pulse`}></div>
                                  <span className={`text-[13px] font-black ${item.color}`}>{item.value}</span>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>

                    {/* Staff Note */}
                    <div className="relative pt-6">
                       <div className="bg-white/70 p-10 rounded-[2rem] border border-[#eeebe3] relative">
                          <p className="text-[15px] font-bold text-[#636e72] leading-relaxed italic text-left">
                            {sharingLog.log.notes}
                          </p>
                       </div>
                    </div>

                    {/* Branding */}
                    <div className="mt-16 flex justify-between items-end">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-[12px] font-black text-white shadow-lg">F</div>
                          <div>
                             <p className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-0.5">FluffyMoko</p>
                             <p className="text-[8px] font-bold text-slate-300">Premium Stay Certified</p>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Decorative Stamp */}
                 <div className="absolute top-12 right-12 opacity-[0.03] pointer-events-none scale-150">
                    <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z"/></svg>
                 </div>
              </div>

              {/* Sidebar Controls for Sharing Card */}
              <div className="w-[300px] flex flex-col gap-6">
                 <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 space-y-6">
                    <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b pb-4">編輯卡片資訊</h4>
                    <div className="space-y-4 text-left">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">住宿期間 (可手動修改)</label>
                          <input 
                            type="text" 
                            value={editStayPeriod} 
                            onChange={e => setEditStayPeriod(e.target.value)} 
                            className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 text-sm font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all"
                          />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">房號 (可手動修改)</label>
                          <input 
                            type="text" 
                            value={editRoomNumber} 
                            onChange={e => setEditRoomNumber(e.target.value)} 
                            className="w-full bg-slate-50 p-4 rounded-xl border-2 border-slate-100 text-sm font-bold text-slate-700 outline-none focus:border-indigo-600 transition-all"
                          />
                       </div>
                    </div>
                    
                    <div className="pt-4 border-t space-y-4">
                       <button 
                        onClick={async () => { 
                          if(shareCardRef.current) { 
                            const canvas = await html2canvas(shareCardRef.current, { 
                              scale: 4, 
                              backgroundColor: '#fdfbf7',
                              useCORS: true,
                              allowTaint: true,
                              logging: false
                            }); 
                            const link = document.createElement('a'); 
                            link.download = `Diary_${sharingLog.pet.name}_${selectedDate}.png`; 
                            link.href = canvas.toDataURL('image/png', 1.0); 
                            link.click(); 
                            setSharingLog(null); 
                          } 
                        }} 
                        className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-[10px] shadow-xl flex items-center justify-center gap-3 hover:bg-black transition-all transform active:scale-95 group"
                       >
                         <span className="text-xl transition-transform group-hover:scale-125">💾</span> 下載清新日誌小卡
                       </button>
                       <button onClick={() => setSharingLog(null)} className="w-full py-5 bg-slate-100 text-slate-500 rounded-[1.8rem] font-black uppercase text-[10px] hover:bg-slate-200 transition-all">關閉</button>
                    </div>
                 </div>
                 <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-xl text-left">
                    <p className="text-white font-black text-lg leading-tight tracking-tighter mb-2">💡 小提示</p>
                    <p className="text-indigo-100 text-xs font-bold leading-relaxed opacity-80">
                       左側預覽卡片的欄位內容現在可以手動進行微調，方便您針對特殊需求調整呈現文字。
                    </p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DailyCareLogs;