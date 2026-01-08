import React, { useState } from 'react';
import { Room, RoomStatus, Booking, Pet, BookingStatus } from '../types';

interface RoomManagementProps {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  pets: Pet[];
  rooms: Room[];
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>;
}

const RoomManagement: React.FC<RoomManagementProps> = ({ bookings, pets, rooms, setRooms }) => {
  const [viewDate, setViewDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [detailRoom, setDetailRoom] = useState<{roomName: string, booking: Booking, bookingPets: Pet[]} | null>(null);

  const getActiveData = (roomName: string, dateStr: string) => {
    const b = bookings.find(item => 
      item.roomNumber === roomName && 
      dateStr >= item.checkIn && 
      dateStr < item.checkOut && 
      (item.status === BookingStatus.CHECKED_IN || item.status === BookingStatus.CONFIRMED)
    );
    const bookingPets = b ? b.petIds.map(pid => pets.find(p => p.id === pid)).filter(Boolean) as Pet[] : [];
    return { booking: b, bookingPets };
  };

  const getInterlockStatus = (roomName: string, dateStr: string) => {
    let partnerRoomNames: string[] = [];
    if (roomName.startsWith('VIP')) {
      const num = parseInt(roomName.replace('VIP 0', ''));
      partnerRoomNames = [num.toString(), (num + 5).toString()];
    } else {
      const num = parseInt(roomName);
      if (num >= 1 && num <= 5) partnerRoomNames = [`VIP 0${num}`];
      else if (num >= 6 && num <= 10) partnerRoomNames = [`VIP 0${num - 5}`];
    }

    const lockedByPartner = bookings.find(item => 
      partnerRoomNames.includes(item.roomNumber) && 
      dateStr >= item.checkIn && 
      dateStr < item.checkOut && 
      (item.status === BookingStatus.CHECKED_IN || item.status === BookingStatus.CONFIRMED)
    );

    return !!lockedByPartner;
  };

  const setMaintenanceStatus = (roomName: string, status: RoomStatus) => {
    setRooms(prev => prev.map(r => r.name === roomName ? { ...r, status } : r));
  };

  const renderRoomCard = (roomName: string) => {
    const { booking, bookingPets } = getActiveData(roomName, viewDate);
    const roomObj = rooms.find(r => r.name === roomName);
    const isMaintenance = roomObj?.status === RoomStatus.MAINTENANCE;
    const isOccupied = !!booking;
    const isLockedByInterlock = !isOccupied && getInterlockStatus(roomName, viewDate);
    const isVip = roomName.startsWith('VIP');
    const displayRoomId = isVip ? `VIP ${roomName.replace('VIP 0', '')}` : roomName;

    // Status Colors (Single Tone)
    const statusColor = isOccupied ? 'indigo' : isLockedByInterlock ? 'slate' : isMaintenance ? 'amber' : 'emerald';
    const borderClasses = {
      indigo: 'border-indigo-600 bg-white shadow-indigo-100',
      slate: 'border-slate-200 bg-slate-50 opacity-80',
      amber: 'border-amber-400 bg-amber-50 border-dashed',
      emerald: 'border-emerald-500 bg-white'
    }[statusColor];

    return (
      <div 
        key={roomName}
        onClick={() => booking && setDetailRoom({ roomName, booking, bookingPets })}
        className={`relative rounded-[2.5rem] border-[3px] p-7 transition-all duration-300 flex flex-col h-[480px] group ${borderClasses} ${isOccupied ? 'cursor-pointer hover:shadow-2xl' : 'cursor-default'}`}
      >
        <div className="flex justify-between items-start mb-6">
          <div>
            <span className={`text-[11px] font-black uppercase tracking-widest ${isOccupied ? 'text-indigo-600' : 'text-slate-400'}`}>
              {isVip ? 'Premium Suite' : 'Standard Room'}
            </span>
            <h3 className="text-4xl font-black text-slate-900 tracking-tighter mt-1">{displayRoomId}</h3>
          </div>
          <div className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-wider text-white ${
            isOccupied ? 'bg-indigo-600' : isLockedByInterlock ? 'bg-slate-400' : isMaintenance ? 'bg-amber-500' : 'bg-emerald-500'
          }`}>
            {isOccupied ? 'Occupied' : isLockedByInterlock ? 'Locked' : isMaintenance ? 'Cleaning' : 'Vacant'}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          {isLockedByInterlock ? (
            <div className="h-full flex flex-col items-center justify-center opacity-30">
               <span className="text-5xl mb-3">🔒</span>
               <p className="text-[12px] font-black uppercase tracking-widest">Shared Space Locked</p>
            </div>
          ) : isMaintenance ? (
            <div className="h-full flex flex-col items-center justify-center">
               <span className="text-5xl mb-3 animate-bounce">🧹</span>
               <p className="text-[12px] font-black text-amber-600 uppercase tracking-widest text-center">Under Maintenance</p>
               <button 
                onClick={(e) => { e.stopPropagation(); setMaintenanceStatus(roomName, RoomStatus.VACANT); }}
                className="mt-6 px-10 py-4 bg-amber-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg"
               >
                 Mark Ready
               </button>
            </div>
          ) : isOccupied ? (
            <div className="h-full flex flex-col overflow-y-auto no-scrollbar space-y-6 pr-1">
              {bookingPets.map(pet => (
                <div key={pet.id} className="space-y-4 border-b border-slate-50 pb-5 last:border-0 last:pb-0">
                  <div className="text-left">
                    <p className="text-lg font-black text-slate-800 leading-none">{pet.name}</p>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mt-1.5 tracking-wide">{pet.breed}</p>
                  </div>
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                       <span className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-[11px] font-black text-indigo-600 shrink-0 shadow-sm">砂</span>
                       <p className="text-[13px] font-bold text-slate-600 truncate">{pet.litterType || '未紀錄'}</p>
                    </div>
                    <div className="flex items-center gap-4">
                       <span className="w-8 h-8 rounded-xl bg-emerald-50 flex items-center justify-center text-[11px] font-black text-emerald-600 shrink-0 shadow-sm">食</span>
                       <p className="text-[13px] font-bold text-slate-600 truncate">{pet.feedingHabit || '未紀錄'}</p>
                    </div>
                    {pet.allergens && (
                      <div className="flex items-center gap-4">
                         <span className="w-8 h-8 rounded-xl bg-rose-50 flex items-center justify-center text-[11px] font-black text-rose-600 shrink-0 shadow-sm">敏</span>
                         <p className="text-[13px] font-black text-rose-500 truncate">{pet.allergens}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center opacity-20">
               <span className="text-5xl mb-3">🐾</span>
               <p className="text-[12px] font-black uppercase tracking-widest">Available for Guests</p>
               <button 
                onClick={(e) => { e.stopPropagation(); setMaintenanceStatus(roomName, RoomStatus.MAINTENANCE); }}
                className="mt-6 px-10 py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-lg opacity-100"
               >
                 Maintenance
               </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8 animate-fadeIn text-left pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter">全館即時房態</h2>
          <p className="text-slate-500 font-medium">即時掌握每位毛孩房客的照顧細節與房況動態。</p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
           <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-4">檢視日期</span>
           <input 
            type="date" 
            value={viewDate} 
            onChange={(e) => setViewDate(e.target.value)} 
            className="px-5 py-3 rounded-xl border-0 font-black text-slate-900 outline-none cursor-pointer text-sm"
           />
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-8">
        {rooms.map(room => renderRoomCard(room.name))}
      </div>

      {detailRoom && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/70 backdrop-blur-xl animate-fadeIn">
          <div className="bg-white rounded-[3.5rem] p-12 max-w-4xl w-full shadow-2xl text-left border-2 border-indigo-600 animate-slideUp overflow-y-auto max-h-[90vh] custom-scrollbar">
            <div className="flex justify-between items-start mb-10">
                <div>
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-2 block">Premium Stay Dashboard</span>
                  <h3 className="text-4xl font-black text-slate-900 tracking-tighter">房號 {detailRoom.roomName} 住宿詳情</h3>
                </div>
                <button onClick={() => setDetailRoom(null)} className="p-4 bg-slate-50 rounded-2xl text-slate-400 hover:text-slate-900 transition-all">✕</button>
            </div>
            
            <div className="space-y-10">
                {/* 房客清單與照護核心 */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">入住貓咪與照護細節</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {detailRoom.bookingPets.map(pet => (
                            <div key={pet.id} className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                                <div className="flex items-center gap-5 mb-6">
                                    <img src={pet.photoUrl} className="w-20 h-20 rounded-[1.5rem] object-cover shadow-xl border-4 border-white transition-transform group-hover:scale-110" alt="" />
                                    <div>
                                      <p className="text-2xl font-black text-slate-900 leading-tight">{pet.name}</p>
                                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">{pet.breed}</p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-3">
                                   <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-indigo-50">
                                      <span className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">廁所偏好 (貓砂)</span>
                                      <span className="text-xs font-bold text-slate-700">{pet.litterType || '未填寫'}</span>
                                   </div>
                                   <div className="flex justify-between items-center p-3 bg-white rounded-xl border border-indigo-50">
                                      <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">飲食偏好 (餵食)</span>
                                      <span className="text-xs font-bold text-slate-700">{pet.feedingHabit || '未填寫'}</span>
                                   </div>
                                   <div className={`flex justify-between items-center p-3 rounded-xl border ${pet.allergens ? 'bg-rose-50 border-rose-100' : 'bg-white border-indigo-50'}`}>
                                      <span className={`text-[9px] font-black uppercase tracking-widest ${pet.allergens ? 'text-rose-500' : 'text-indigo-400'}`}>過敏原限制</span>
                                      <span className={`text-xs font-black ${pet.allergens ? 'text-rose-600' : 'text-slate-700'}`}>{pet.allergens || 'None'}</span>
                                   </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 緊急聯絡與醫院 */}
                <div className="space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">緊急聯絡與醫療支援</h4>
                    <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] -z-0"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
                            <div className="space-y-6">
                                <div className="flex items-start gap-4">
                                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl">👤</div>
                                   <div>
                                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">緊急聯絡人</p>
                                      <p className="text-xl font-black">{detailRoom.bookingPets[0]?.emergencyContactName || 'N/A'}</p>
                                   </div>
                                </div>
                                <div className="flex items-start gap-4">
                                   <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-xl">📞</div>
                                   <div>
                                      <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">聯絡電話</p>
                                      <p className="text-xl font-mono font-bold tracking-tight">{detailRoom.bookingPets[0]?.emergencyContactPhone || 'N/A'}</p>
                                   </div>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 border-l border-white/10 pl-10">
                               <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-xl text-rose-400">🏥</div>
                               <div>
                                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1">熟識動物醫院</p>
                                  <p className="text-xl font-black leading-snug">{detailRoom.bookingPets[0]?.familiarHospital || '未提供醫院資訊'}</p>
                                  <p className="text-[10px] font-bold text-slate-400 mt-2 italic">* 遇緊急狀況將優先聯繫此醫院</p>
                               </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 訂單與金額統計 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-2 bg-indigo-50 p-10 rounded-[3rem] border border-indigo-100 flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                           <div>
                              <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4">住宿期間與備註</p>
                              <div className="space-y-2">
                                 <p className="text-sm font-bold text-slate-700 flex gap-4"><span>入住:</span> <span className="font-mono text-indigo-600">{detailRoom.booking.checkIn}</span></p>
                                 <p className="text-sm font-bold text-slate-700 flex gap-4"><span>退房:</span> <span className="font-mono text-indigo-600">{detailRoom.booking.checkOut}</span></p>
                              </div>
                           </div>
                           <div className="bg-white p-6 rounded-[2rem] border border-indigo-100 max-w-[240px]">
                              <p className="text-[9px] font-black text-amber-500 uppercase tracking-widest mb-2">管家特別叮嚀</p>
                              <p className="text-[11px] font-bold text-slate-600 italic leading-relaxed">"{detailRoom.booking.notes || '無備註資訊。'}"</p>
                           </div>
                        </div>
                    </div>
                    <div className="bg-indigo-600 text-white p-10 rounded-[3rem] shadow-2xl flex flex-col justify-center items-center text-center">
                        <p className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.3em] mb-4">Total Amount</p>
                        <p className="text-5xl font-black tracking-tighter mb-2">${detailRoom.booking.totalPrice?.toLocaleString()}</p>
                        <p className="text-[10px] font-bold text-white/50 uppercase">已確認之結算金額</p>
                    </div>
                </div>
            </div>

            <div className="mt-12 flex gap-4">
              <button onClick={() => setDetailRoom(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-3xl font-black uppercase text-xs tracking-widest transition-all hover:bg-slate-200">
                返回房態圖
              </button>
              <button 
                onClick={() => { setDetailRoom(null); }} 
                className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase text-xs tracking-widest shadow-2xl hover:bg-indigo-700 transition-all"
              >
                前往預約管理修改訂單
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomManagement;