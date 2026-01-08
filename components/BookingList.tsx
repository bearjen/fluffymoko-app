import React, { useState, useMemo, useCallback } from 'react';
import { Booking, BookingStatus, Pet, PetType, Room, RoomStatus, PreCheckRecord } from '../types';
import PreCheckForm from './PreCheckForm';

interface BookingListProps {
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  pets: Pet[];
  setPets: React.Dispatch<React.SetStateAction<Pet[]>>;
  setRooms: React.Dispatch<React.SetStateAction<Room[]>>; 
  preCheckRecords: PreCheckRecord[];
  setPreCheckRecords: React.Dispatch<React.SetStateAction<PreCheckRecord[]>>;
}

const STATUS_OPTIONS = Object.values(BookingStatus);

const STATUS_BG: Record<BookingStatus, string> = {
  [BookingStatus.PENDING]: 'bg-amber-50 text-amber-600 border-amber-200',
  [BookingStatus.CONFIRMED]: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  [BookingStatus.CHECKED_IN]: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  [BookingStatus.CHECKED_OUT]: 'bg-slate-100 text-slate-500 border-slate-200',
  [BookingStatus.CANCELLED]: 'bg-rose-50 text-rose-400 border-rose-100',
};

const BookingList: React.FC<BookingListProps> = ({ bookings, setBookings, pets, setPets, setRooms, preCheckRecords, setPreCheckRecords }) => {
  const [viewMode, setViewMode] = useState<'list' | 'schedule'>('list');
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [preCheckTarget, setPreCheckTarget] = useState<{booking: Booking, pet: Pet, existingRecord?: PreCheckRecord} | null>(null);
  const [petPickerTarget, setPetPickerTarget] = useState<Booking | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [petSearchTerm, setPetSearchTerm] = useState('');

  const allRoomNames = useMemo(() => {
    const std = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
    const vip = Array.from({ length: 5 }, (_, i) => `VIP 0${i + 1}`);
    return [...std, ...vip];
  }, []);

  const daysInMonth = useMemo(() => {
    const [year, month] = selectedMonth.split('-').map(Number);
    return new Date(year, month, 0).getDate();
  }, [selectedMonth]);

  const monthlyTotal = useMemo(() => {
    return bookings
      .filter(b => (b.checkIn.startsWith(selectedMonth) || b.checkOut.startsWith(selectedMonth)) && b.status !== BookingStatus.CANCELLED)
      .reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0);
  }, [bookings, selectedMonth]);

  const isRoomLockedOnDate = useCallback((roomName: string, dateStr: string) => {
    let partners: string[] = [];
    if (roomName.startsWith('VIP')) {
      const num = parseInt(roomName.replace('VIP 0', ''));
      partners = [num.toString(), (num + 5).toString()];
    } else {
      const num = parseInt(roomName);
      if (num >= 1 && num <= 5) partners = [`VIP 0${num}`];
      else if (num >= 6 && num <= 10) partners = [`VIP 0${num - 5}`];
    }

    return bookings.some(b => 
      partners.includes(b.roomNumber) && 
      dateStr >= b.checkIn && 
      dateStr < b.checkOut && 
      b.status !== BookingStatus.CANCELLED
    );
  }, [bookings]);

  const getUnavailableRooms = useCallback((checkIn: string, checkOut: string, excludeId?: string) => {
    if (!checkIn || !checkOut) return [];
    const conflicts = bookings
      .filter(b => b.id !== excludeId && b.status !== BookingStatus.CANCELLED)
      .filter(b => checkIn < b.checkOut && b.checkIn < checkOut);
    const unavailable = new Set<string>();
    conflicts.forEach(b => {
      const room = b.roomNumber;
      unavailable.add(room);
      if (room.startsWith('VIP')) {
        const num = parseInt(room.replace('VIP 0', ''));
        unavailable.add(num.toString());
        unavailable.add((num + 5).toString());
      } else {
        const num = parseInt(room);
        if (num >= 1 && num <= 5) unavailable.add(`VIP 0${num}`);
        else if (num >= 6 && num <= 10) unavailable.add(`VIP 0${num - 5}`);
      }
    });
    return Array.from(unavailable);
  }, [bookings]);

  const currentUnavailable = useMemo(() => {
    if (!editingBooking) return [];
    return getUnavailableRooms(editingBooking.checkIn, editingBooking.checkOut, editingBooking.id);
  }, [editingBooking, bookings, getUnavailableRooms]);

  const handleCheckInClick = (booking: Booking) => {
    if (booking.petIds.length > 1) {
      setPetPickerTarget(booking);
    } else {
      const pet = pets.find(p => p.id === booking.petIds[0]);
      if (pet) {
        const existingRecord = preCheckRecords.find(r => r.bookingId === booking.id && r.petId === pet.id);
        setPreCheckTarget({ booking, pet, existingRecord });
      }
    }
  };

  const updateBookingField = (id: string, field: keyof Booking, value: any) => {
    setBookings(prev => prev.map(b => b.id === id ? { ...b, [field]: value } : b));
  };

  const handleSaveBooking = () => {
    if (!editingBooking) return;
    if (editingBooking.petIds.length === 0) { alert("請至少選擇一隻毛孩"); return; }
    if (editingBooking.roomNumber === '未分配') { alert("請分配房號"); return; }
    setBookings(prev => {
      const exists = prev.find(b => b.id === editingBooking.id);
      if (exists) return prev.map(b => b.id === editingBooking.id ? editingBooking : b);
      return [editingBooking, ...prev];
    });
    setEditingBooking(null);
    setPetSearchTerm('');
  };

  const handleQuickAddPet = () => {
    if (!petSearchTerm.trim()) return;
    const newPet: Pet = {
      id: `p${Date.now()}`, name: petSearchTerm.trim(), type: PetType.CAT, gender: '未知', breed: '米克斯', age: 0, chipNumber: '', ownerName: '快速預約建立', ownerPhone: '', emergencyContactName: '', emergencyContactPhone: '', familiarHospital: '', medicalNotes: '', dietaryNeeds: '', photoUrl: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=200&h=200', litterType: '', feedingHabit: '', allergens: ''
    };
    setPets(prev => [newPet, ...prev]);
    if (editingBooking) { setEditingBooking({ ...editingBooking, petIds: [...editingBooking.petIds, newPet.id] }); }
    setPetSearchTerm('');
  };

  const filteredPetsForForm = useMemo(() => {
    const term = petSearchTerm.toLowerCase();
    return pets.filter(p => p.name.toLowerCase().includes(term) || p.breed.toLowerCase().includes(term));
  }, [pets, petSearchTerm]);

  return (
    <div className="animate-fadeIn pb-24 text-left">
      {/* Header */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end mb-8 gap-4">
        <div className="text-left flex-1">
          <div className="flex items-center gap-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">Booking Center</h2>
            <div className="bg-white border-2 border-indigo-600 px-6 py-2 rounded-2xl shadow-xl shadow-indigo-50 flex items-center gap-4">
               <div className="w-1 h-8 bg-indigo-600 rounded-full"></div>
               <div>
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block leading-none mb-1">本月營收預計 (非取消)</span>
                  <span className="text-xl font-black text-indigo-700 tracking-tight leading-none">${monthlyTotal.toLocaleString()}</span>
               </div>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap items-center gap-4">
            <div className="bg-slate-100 p-1 rounded-2xl flex shadow-inner">
               <button onClick={() => setViewMode('list')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'list' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>清單模式</button>
               <button onClick={() => setViewMode('schedule')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${viewMode === 'schedule' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400'}`}>排程檢視</button>
            </div>
            <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="bg-white px-4 py-2 rounded-xl border-2 border-slate-100 shadow-sm text-xs font-black outline-none focus:border-indigo-600 transition-all" />
          </div>
        </div>
        <button 
          onClick={() => setEditingBooking({ id: `b${Date.now()}`, petIds: [], checkIn: new Date().toISOString().split('T')[0], checkOut: '', status: BookingStatus.PENDING, roomNumber: '未分配', totalPrice: 0, notes: '' })} 
          className="bg-indigo-600 text-white px-8 py-5 rounded-[2rem] font-black uppercase tracking-widest text-[11px] shadow-2xl hover:bg-indigo-500 transition-all transform hover:scale-105 active:scale-95 flex items-center gap-3"
        >
          <span className="text-xl">+</span> 建立預約訂單
        </button>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-[3rem] shadow-sm border-2 border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b-2 border-slate-100 font-black text-[10px] text-slate-400 uppercase tracking-widest">
              <tr>
                <th className="px-8 py-5">毛孩房客</th>
                <th className="px-8 py-5">住宿期間</th>
                <th className="px-8 py-5 text-center">指派房號</th>
                <th className="px-8 py-5">結帳金額</th>
                <th className="px-8 py-5 text-center">目前狀態</th>
                <th className="px-8 py-5 text-right">管理操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-bold text-slate-600">
              {bookings.filter(b => b.checkIn.startsWith(selectedMonth) || b.checkOut.startsWith(selectedMonth)).map(b => {
                const unavailableRooms = getUnavailableRooms(b.checkIn, b.checkOut, b.id);
                return (
                  <tr key={b.id} className="hover:bg-slate-50/50 transition-all group">
                    <td className="px-8 py-5">
                      <span className="font-black text-lg text-slate-900 tracking-tight group-hover:text-indigo-600 transition-colors">
                        {b.petIds.map(pid => pets.find(p => p.id === pid)?.name).join(' & ') || '未指派'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex flex-col gap-1.5">
                        <input 
                          type="date" 
                          value={b.checkIn} 
                          onChange={(e) => updateBookingField(b.id, 'checkIn', e.target.value)}
                          className="bg-transparent border-0 font-mono text-[13px] font-black text-slate-500 outline-none p-0 focus:text-indigo-600 w-full"
                        />
                        <input 
                          type="date" 
                          value={b.checkOut} 
                          onChange={(e) => updateBookingField(b.id, 'checkOut', e.target.value)}
                          className="bg-transparent border-0 font-mono text-[13px] font-black text-slate-500 outline-none p-0 focus:text-indigo-600 w-full"
                        />
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <select 
                        value={b.roomNumber}
                        onChange={(e) => updateBookingField(b.id, 'roomNumber', e.target.value)}
                        className={`px-4 py-1.5 rounded-xl font-mono text-[11px] font-black shadow-sm inline-block border bg-white cursor-pointer outline-none focus:border-indigo-600 transition-all ${b.roomNumber.startsWith('VIP') ? 'text-amber-700 border-amber-200' : 'text-indigo-700 border-indigo-100'}`}
                      >
                        <option value="未分配">未分配</option>
                        {allRoomNames.map(name => {
                          const isOccupied = unavailableRooms.includes(name);
                          return (
                            <option key={name} value={name} disabled={isOccupied}>
                              {name} {isOccupied ? '🔒 (衝突中)' : ''}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-300 font-black text-[10px]">$</span>
                        <input 
                          type="number" 
                          value={b.totalPrice} 
                          onChange={(e) => updateBookingField(b.id, 'totalPrice', Number(e.target.value))}
                          className="w-24 bg-transparent border-b-2 border-dashed border-slate-100 outline-none font-black text-slate-900 focus:border-indigo-600 text-sm transition-all text-right pr-1"
                        />
                      </div>
                    </td>
                    <td className="px-8 py-5 text-center">
                      <select 
                        value={b.status}
                        onChange={(e) => updateBookingField(b.id, 'status', e.target.value)}
                        className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase border-2 cursor-pointer outline-none transition-all shadow-sm ${STATUS_BG[b.status]}`}
                      >
                        {STATUS_OPTIONS.map(opt => <option key={opt} value={opt} className="bg-white text-slate-900 font-bold">{opt}</option>)}
                      </select>
                    </td>
                    <td className="px-8 py-5 text-right space-x-2 whitespace-nowrap">
                      {b.status === BookingStatus.CHECKED_IN ? (
                        <button onClick={() => handleCheckInClick(b)} className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase shadow-lg hover:bg-black transition-all">檢視報告</button>
                      ) : (
                        <button onClick={() => handleCheckInClick(b)} className="px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-100 hover:bg-emerald-700 transition-all">Check-in</button>
                      )}
                      <button onClick={() => setEditingBooking(b)} className="p-3 text-indigo-600 bg-indigo-50 rounded-xl hover:bg-indigo-100 transition-all text-xs font-black">✎</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Schedule View - Compact Mode */
        <div className="bg-white rounded-[3rem] shadow-sm border-2 border-slate-100 overflow-x-auto no-scrollbar">
          <div className="min-w-[2200px]">
            <div className="flex bg-slate-50 border-b-2 border-slate-100 sticky top-0 z-30">
              <div className="w-48 px-8 py-5 font-black text-[11px] text-slate-400 uppercase tracking-widest border-r bg-white shrink-0">Room Map</div>
              {Array.from({ length: daysInMonth }, (_, i) => {
                const day = i + 1;
                const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
                const dateObj = new Date(dateStr);
                const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;
                return (
                  <div key={day} className={`flex-1 min-w-[64px] px-2 py-5 text-center border-r font-black text-[11px] transition-colors ${isWeekend ? 'bg-indigo-50/40 text-indigo-500' : 'text-slate-400'}`}>
                    {day}
                  </div>
                );
              })}
            </div>
            {allRoomNames.map(roomName => (
              <div key={roomName} className="flex border-b border-slate-100 hover:bg-slate-50/30 transition-colors">
                <div className="w-48 px-8 py-5 font-black text-[13px] text-slate-800 border-r bg-white shrink-0 flex items-center gap-3 sticky left-0 z-20 shadow-[5px_0_10px_-5px_rgba(0,0,0,0.1)]">
                   <div className={`w-2 h-2 rounded-full shadow-sm ${roomName.startsWith('VIP') ? 'bg-amber-400 ring-4 ring-amber-50' : 'bg-indigo-500 ring-4 ring-indigo-50'}`}></div>
                   {roomName}
                </div>
                {Array.from({ length: daysInMonth }, (_, i) => {
                  const day = i + 1;
                  const dateStr = `${selectedMonth}-${String(day).padStart(2, '0')}`;
                  const booking = bookings.find(b => 
                    b.roomNumber === roomName && 
                    dateStr >= b.checkIn && 
                    dateStr < b.checkOut && 
                    b.status !== BookingStatus.CANCELLED
                  );
                  const isLocked = !booking && isRoomLockedOnDate(roomName, dateStr);

                  return (
                    <div key={day} className="flex-1 min-w-[64px] border-r h-16 relative group">
                      {booking && (
                        <div 
                          onClick={() => setEditingBooking(booking)}
                          className={`absolute inset-0 m-0.5 rounded-xl cursor-pointer transition-all hover:scale-[1.02] hover:z-20 shadow-md flex flex-col items-center justify-center p-1 text-center overflow-hidden border-2 ${STATUS_BG[booking.status]}`}
                        >
                          <span className="text-[11px] font-black leading-tight whitespace-nowrap uppercase tracking-tighter w-full px-1">
                            {pets.filter(p => booking.petIds.includes(p.id)).map(p => p.name).join(' & ')}
                          </span>
                        </div>
                      )}
                      {isLocked && (
                        <div className="absolute inset-0 m-0.5 rounded-xl bg-slate-100/40 flex items-center justify-center opacity-60 border border-dashed border-slate-200 pointer-events-none group-hover:opacity-100 transition-opacity">
                           <span className="text-sm filter drop-shadow-sm">🔒</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Form Modal */}
      {editingBooking && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[4rem] p-12 max-w-2xl w-full shadow-2xl animate-slideUp text-left max-h-[90vh] overflow-y-auto no-scrollbar">
              <h3 className="text-3xl font-black text-slate-900 mb-10 tracking-tighter">預約詳細資訊</h3>
              <div className="space-y-8">
                 {/* Pet Picker */}
                 <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">選擇住宿毛孩</label>
                    <div className="flex gap-2 mb-4">
                       <input 
                         type="text" 
                         placeholder="快速搜尋或新增毛孩姓名..." 
                         value={petSearchTerm} 
                         onChange={(e) => setPetSearchTerm(e.target.value)}
                         className="flex-1 bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl font-bold outline-none focus:border-indigo-600 transition-all text-sm"
                       />
                       {petSearchTerm && !pets.some(p => p.name === petSearchTerm) && (
                         <button onClick={handleQuickAddPet} className="bg-indigo-600 text-white px-6 rounded-2xl font-black text-[10px] uppercase">快速建立</button>
                       )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto no-scrollbar p-1">
                       {filteredPetsForForm.map(p => {
                         const isSelected = editingBooking.petIds.includes(p.id);
                         return (
                           <button 
                             key={p.id} 
                             onClick={() => setEditingBooking(prev => prev ? ({ ...prev, petIds: isSelected ? prev.petIds.filter(id => id !== p.id) : [...prev.petIds, p.id] }) : null)}
                             className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all ${isSelected ? 'border-indigo-600 bg-indigo-50' : 'border-slate-50 bg-slate-50 opacity-60 hover:opacity-100'}`}
                           >
                             <img src={p.photoUrl} className="w-10 h-10 rounded-xl object-cover" alt="" />
                             <div className="text-left">
                               <p className="text-xs font-black text-slate-800 leading-none">{p.name}</p>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-1">{p.breed}</p>
                             </div>
                           </button>
                         );
                       })}
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">入住日期</label>
                       <input type="date" value={editingBooking.checkIn} onChange={e => setEditingBooking({...editingBooking, checkIn: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-indigo-600" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">退房日期</label>
                       <input type="date" value={editingBooking.checkOut} onChange={e => setEditingBooking({...editingBooking, checkOut: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-indigo-600" />
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">指派房號 (不含衝突)</label>
                       <select 
                         value={editingBooking.roomNumber} 
                         onChange={e => setEditingBooking({...editingBooking, roomNumber: e.target.value})}
                         className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold outline-none focus:border-indigo-600"
                       >
                          <option value="未分配">未分配</option>
                          {allRoomNames.map(name => {
                            const isTaken = currentUnavailable.includes(name);
                            return <option key={name} value={name} disabled={isTaken}>{name} {isTaken ? '🔒 (衝突中)' : ''}</option>;
                          })}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">總結帳金額</label>
                       <div className="relative">
                          <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-300">$</span>
                          <input type="number" value={editingBooking.totalPrice} onChange={e => setEditingBooking({...editingBooking, totalPrice: Number(e.target.value)})} className="w-full p-4 pl-8 bg-slate-50 rounded-2xl border-2 border-slate-100 font-black outline-none focus:border-indigo-600" />
                       </div>
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest">管家備註</label>
                    <textarea value={editingBooking.notes} onChange={e => setEditingBooking({...editingBooking, notes: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border-2 border-slate-100 font-bold text-sm min-h-[100px]" placeholder="貓咪特殊性格或藥物叮嚀..." />
                 </div>

                 <div className="flex gap-4 pt-6">
                    <button onClick={() => setEditingBooking(null)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs tracking-widest">取消</button>
                    <button onClick={handleSaveBooking} className="flex-1 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-2xl shadow-slate-200">儲存預約資訊</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Pre-Check Form Modal */}
      {preCheckTarget && (
        <PreCheckForm 
          booking={preCheckTarget.booking} 
          pet={preCheckTarget.pet} 
          initialData={preCheckTarget.existingRecord}
          onSave={(record) => {
            setPreCheckRecords(prev => {
              const other = prev.filter(r => !(r.bookingId === record.bookingId && r.petId === record.petId));
              return [record, ...other];
            });
            updateBookingField(record.bookingId, 'status', BookingStatus.CHECKED_IN);
            setPreCheckTarget(null);
          }}
          onCancel={() => setPreCheckTarget(null)}
        />
      )}

      {/* Multi-Pet Selection for Pre-Check */}
      {petPickerTarget && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <div className="bg-white rounded-[3.5rem] p-10 max-w-md w-full shadow-2xl animate-scaleIn">
              <h3 className="text-2xl font-black text-slate-900 mb-6">請選擇欲檢查的毛孩</h3>
              <div className="space-y-3">
                 {petPickerTarget.petIds.map(pid => {
                   const pet = pets.find(p => p.id === pid);
                   if (!pet) return null;
                   return (
                     <button 
                      key={pid}
                      onClick={() => {
                        const existingRecord = preCheckRecords.find(r => r.bookingId === petPickerTarget.id && r.petId === pet.id);
                        setPreCheckTarget({ booking: petPickerTarget, pet, existingRecord });
                        setPetPickerTarget(null);
                      }}
                      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border-2 border-slate-100 hover:border-indigo-600 transition-all group"
                     >
                        <img src={pet.photoUrl} className="w-12 h-12 rounded-xl object-cover" alt="" />
                        <div className="text-left">
                          <p className="font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{pet.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{pet.breed}</p>
                        </div>
                     </button>
                   );
                 })}
              </div>
              <button onClick={() => setPetPickerTarget(null)} className="w-full mt-8 py-4 text-slate-400 font-black uppercase text-xs">取消</button>
           </div>
        </div>
      )}
    </div>
  );
};

export default BookingList;