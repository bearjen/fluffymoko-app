import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import BookingList from './components/BookingList';
import PetList from './components/PetList';
import GeminiAssistant from './components/GeminiAssistant';
import RoomManagement from './components/RoomManagement';
import DailyCareLogs from './components/DailyCareLogs';
import Settings from './components/Settings';
import Login from './components/Login';
import { MOCK_BOOKINGS, MOCK_PETS } from './constants';
import { Booking, Pet, Room, RoomStatus, PreCheckRecord } from './types';

const ADMIN_PASSWORD = 'moko2025';

const App: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('fm_logged_in') === 'true');
  
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('fm_bookings');
    return saved ? JSON.parse(saved) : MOCK_BOOKINGS;
  });

  const [pets, setPets] = useState<Pet[]>(() => {
    const saved = localStorage.getItem('fm_pets');
    return saved ? JSON.parse(saved) : MOCK_PETS;
  });

  const [preCheckRecords, setPreCheckRecords] = useState<PreCheckRecord[]>(() => {
    const saved = localStorage.getItem('fm_precheck_records');
    return saved ? JSON.parse(saved) : [];
  });

  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('fm_rooms');
    if (saved) return JSON.parse(saved);
    
    const standardRooms = Array.from({ length: 10 }, (_, i) => {
      const isLower = i >= 5;
      const col = (i % 5) + 1;
      return {
        id: `r${i + 1}`,
        name: `${i + 1}`,
        status: RoomStatus.VACANT,
        isLarge: false,
        floor: isLower ? 'lower' : 'upper',
        column: col,
        tags: [],
      } as Room;
    });

    const vipRooms = Array.from({ length: 5 }, (_, i) => ({
      id: `vip${i + 1}`,
      name: `VIP 0${i + 1}`,
      status: RoomStatus.VACANT,
      isLarge: true,
      floor: 'upper',
      column: i + 1,
      tags: ['VIP'],
    } as Room));

    return [...standardRooms, ...vipRooms];
  });

  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    localStorage.setItem('fm_bookings', JSON.stringify(bookings));
    localStorage.setItem('fm_pets', JSON.stringify(pets));
    localStorage.setItem('fm_rooms', JSON.stringify(rooms));
    localStorage.setItem('fm_precheck_records', JSON.stringify(preCheckRecords));
  }, [bookings, pets, rooms, preCheckRecords]);

  const handleLogin = (password: string) => {
    if (password === ADMIN_PASSWORD) {
      setIsLoggedIn(true);
      localStorage.setItem('fm_logged_in', 'true');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('fm_logged_in');
  };

  const exportAllData = () => {
    const data = {
      bookings,
      pets,
      rooms,
      preCheckRecords,
      careLogs: JSON.parse(localStorage.getItem('fm_care_logs') || '[]'),
      timestamp: new Date().toISOString()
    };
    return btoa(unescape(encodeURIComponent(JSON.stringify(data))));
  };

  const importAllData = (base64: string) => {
    try {
      const json = decodeURIComponent(escape(atob(base64)));
      const data = JSON.parse(json);
      
      if (data.bookings && data.pets && data.rooms) {
        setBookings(data.bookings);
        setPets(data.pets);
        setRooms(data.rooms);
        setPreCheckRecords(data.preCheckRecords || []);
        localStorage.setItem('fm_care_logs', JSON.stringify(data.careLogs || []));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard bookings={bookings} />;
      case 'rooms':
        return <RoomManagement bookings={bookings} setBookings={setBookings} pets={pets} rooms={rooms} setRooms={setRooms} />;
      case 'care-logs':
        return <DailyCareLogs bookings={bookings} pets={pets} />;
      case 'bookings':
        return <BookingList bookings={bookings} setBookings={setBookings} pets={pets} setPets={setPets} setRooms={setRooms} preCheckRecords={preCheckRecords} setPreCheckRecords={setPreCheckRecords} />;
      case 'pets':
        return <PetList pets={pets} setPets={setPets} />;
      case 'ai-assistant':
        return <GeminiAssistant pets={pets} />;
      case 'settings':
        return <Settings onExport={exportAllData} onImport={importAllData} />;
      default:
        return <Dashboard bookings={bookings} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="flex-1 p-8 overflow-y-auto relative">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-end mb-4">
            <button onClick={handleLogout} className="text-[10px] font-black text-slate-400 hover:text-rose-500 uppercase tracking-widest transition-colors">登出管理員身分</button>
          </div>
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;