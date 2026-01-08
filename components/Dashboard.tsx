
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Booking, BookingStatus } from '../types';

const TREND_DATA = [
  { name: '一月', occupancy: 42, revenue: 45000 },
  { name: '二月', occupancy: 58, revenue: 52000 },
  { name: '三月', occupancy: 35, revenue: 38000 },
  { name: '四月', occupancy: 68, revenue: 65000 },
  { name: '五月', occupancy: 85, revenue: 82000 },
];

interface Todo {
  id: string;
  text: string;
  sub: string;
  completed: boolean;
}

interface DashboardProps {
  bookings: Booking[];
}

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 6h18"></path>
    <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path>
    <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path>
  </svg>
);

const Dashboard: React.FC<DashboardProps> = ({ bookings }) => {
  const [todos, setTodos] = useState<Todo[]>([
    { id: '1', text: '幫「大橘」梳毛', sub: '下午 2:00 預約', completed: false },
    { id: '2', text: '聯繫咪咪的主人', sub: '確認罐頭進食情況', completed: false },
    { id: '3', text: '清理 102 房間砂盆', sub: '預計傍晚有新入住', completed: true },
  ]);
  const [newTodoText, setNewTodoText] = useState('');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "早安";
    if (hour < 18) return "午安";
    return "晚安";
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const currentMonth = now.toISOString().slice(0, 7);
    
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonth = prevMonthDate.toISOString().slice(0, 7);
    
    const occupiedCount = bookings.filter(b => b.status === BookingStatus.CHECKED_IN).length;
    const todayCheckIns = bookings.filter(b => b.checkIn === today).length;
    const todayCheckOuts = bookings.filter(b => b.checkOut === today).length;

    const monthlyRevenue = bookings
      .filter(b => b.checkIn.startsWith(currentMonth) && b.status !== BookingStatus.CANCELLED)
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const prevMonthlyRevenue = bookings
      .filter(b => b.checkIn.startsWith(prevMonth) && b.status !== BookingStatus.CANCELLED)
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    const growthRatio = prevMonthlyRevenue === 0 
      ? (monthlyRevenue > 0 ? 100 : 0) 
      : ((monthlyRevenue - prevMonthlyRevenue) / prevMonthlyRevenue) * 100;

    return {
      occupied: occupiedCount,
      checkIns: todayCheckIns,
      checkOuts: todayCheckOuts,
      revenue: monthlyRevenue,
      growth: growthRatio,
      occupancyRate: Math.min(Math.round((occupiedCount / 15) * 100), 100)
    };
  }, [bookings]);

  // 簡易房況概覽
  const roomGrid = useMemo(() => {
    const allRooms = [
      ...Array.from({ length: 10 }, (_, i) => ({ name: (i + 1).toString(), isVip: false })),
      ...Array.from({ length: 5 }, (_, i) => ({ name: `VIP 0${i + 1}`, isVip: true }))
    ];
    return allRooms.map(r => ({
      ...r,
      isOccupied: bookings.some(b => b.roomNumber === r.name && b.status === BookingStatus.CHECKED_IN)
    }));
  }, [bookings]);

  const addTodo = () => {
    if (!newTodoText.trim()) return;
    const newTodo: Todo = {
      id: Date.now().toString(),
      text: newTodoText,
      sub: '管家備忘錄',
      completed: false,
    };
    setTodos(prev => [newTodo, ...prev]);
    setNewTodoText('');
  };

  const toggleTodo = (id: string) => {
    setTodos(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTodo = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTodos(prev => prev.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-10 animate-fadeIn pb-16">
      {/* Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="text-left">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-2xl animate-bounce">👋</span>
            <h2 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">{greeting}，旅館經理</h2>
          </div>
          <p className="text-slate-500 font-medium tracking-tight">今天的營運表現非常亮眼，毛孩們都住得很開心！</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex -space-x-3">
              {roomGrid.filter(r => r.isOccupied).slice(0, 3).map((_, i) => (
                <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-indigo-100 flex items-center justify-center text-xs font-black text-indigo-600 shadow-sm">🐾</div>
              ))}
           </div>
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">當前有 {stats.occupied} 位小房客</p>
        </div>
      </header>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { 
            label: '當前入住率', 
            value: `${stats.occupancyRate}%`, 
            sub: `${stats.occupied} / 15 房間已佔用`, 
            color: 'text-indigo-600',
            progress: stats.occupancyRate
          },
          { label: '今日進場', value: stats.checkIns.toString(), sub: '預計完成 100%', color: 'text-emerald-600' },
          { label: '今日離場', value: stats.checkOuts.toString(), sub: '目前待處理', color: 'text-rose-500' },
          { 
            label: '本月營收估算', 
            value: `$${stats.revenue.toLocaleString()}`, 
            sub: '不包含取消訂單', 
            color: 'text-slate-900',
            growth: stats.growth 
          },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 hover:shadow-2xl transition-all duration-500 relative overflow-hidden group">
            <div className="relative z-10 text-left">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{stat.label}</p>
              <div className="flex items-baseline gap-2 mb-2">
                <p className={`text-4xl font-black ${stat.color} tracking-tighter`}>{stat.value}</p>
                {stat.growth !== undefined && (
                  <div className={`px-2.5 py-1 rounded-xl text-[10px] font-black flex items-center gap-1 shadow-sm ${stat.growth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {stat.growth >= 0 ? '↗' : '↘'} {Math.abs(stat.growth).toFixed(1)}%
                  </div>
                )}
              </div>
              <p className="text-[11px] text-slate-400 font-bold">{stat.sub}</p>
              
              {stat.progress !== undefined && (
                <div className="mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-indigo-600 rounded-full transition-all duration-1000" 
                    style={{ width: `${stat.progress}%` }}
                  />
                </div>
              )}
            </div>
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50/50 rounded-bl-[100px] -z-0 group-hover:bg-indigo-50/30 transition-colors duration-500"></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Card */}
        <div className="lg:col-span-2 bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 relative overflow-hidden">
          <div className="flex justify-between items-start mb-12">
            <div className="text-left">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">入住趨勢動態</h3>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">Occupancy & Performance Analytics</p>
            </div>
            <div className="flex gap-2">
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 rounded-xl">
                  <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                  <span className="text-[9px] font-black text-indigo-600 uppercase">入住率</span>
               </div>
            </div>
          </div>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TREND_DATA}>
                <defs>
                  <linearGradient id="colorOcc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="10 10" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}}
                  dy={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 800}} 
                  dx={-10}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)', 
                    padding: '20px',
                    fontWeight: 900
                  }}
                  itemStyle={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="occupancy" 
                  stroke="#4f46e5" 
                  strokeWidth={5}
                  fillOpacity={1} 
                  fill="url(#colorOcc)" 
                  animationDuration={2000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sidebar Cards: Rooms & Tasks */}
        <div className="space-y-8 flex flex-col">
          {/* Room Quick Status Map */}
          <div className="bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl text-left relative overflow-hidden">
             <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-bl-[100px] -z-0"></div>
             <h3 className="text-xl font-black text-white mb-8 tracking-tight relative z-10">即時房況地圖</h3>
             <div className="grid grid-cols-5 gap-3 relative z-10">
                {roomGrid.map((room, idx) => (
                  <div 
                    key={idx} 
                    title={`${room.name}: ${room.isOccupied ? '入住中' : '空房'}`}
                    className={`aspect-square rounded-xl flex items-center justify-center text-[9px] font-black transition-all ${
                      room.isOccupied 
                        ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30' 
                        : 'bg-white/10 text-white/40 border border-white/10'
                    }`}
                  >
                    {room.isVip ? 'V' : room.name}
                  </div>
                ))}
             </div>
             <div className="mt-8 flex justify-between items-center text-white/40">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                   <span className="text-[9px] font-black uppercase tracking-widest">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-white/10 border border-white/20"></div>
                   <span className="text-[9px] font-black uppercase tracking-widest">Vacant</span>
                </div>
             </div>
          </div>

          {/* To-Do List Card */}
          <div className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 flex-1 flex flex-col relative overflow-hidden">
            <h3 className="text-xl font-black text-slate-800 mb-8 tracking-tight text-left">今日營運清單</h3>
            
            <div className="flex gap-2 mb-8 relative z-10">
              <input 
                type="text" 
                placeholder="新增任務..."
                value={newTodoText}
                onChange={(e) => setNewTodoText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addTodo()}
                className="flex-1 bg-slate-50 border-2 border-slate-50 px-6 py-4 rounded-2xl text-[13px] font-bold outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300"
              />
              <button onClick={addTodo} className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex items-center justify-center font-black shadow-xl hover:bg-black transition-all">+</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 no-scrollbar max-h-[300px] relative z-10">
              {todos.map((todo) => (
                <div key={todo.id} className="group flex items-center justify-between p-5 bg-slate-50/50 rounded-[2rem] border border-transparent hover:border-slate-200 transition-all">
                  <div className="flex items-start gap-5 flex-1 overflow-hidden">
                    <input 
                      type="checkbox" 
                      checked={todo.completed} 
                      onChange={() => toggleTodo(todo.id)} 
                      className="mt-1 w-6 h-6 rounded-xl border-2 border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer" 
                    />
                    <div className="text-left overflow-hidden flex-1">
                      <p className={`text-[13px] font-black transition-all truncate ${todo.completed ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{todo.text}</p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{todo.sub}</p>
                    </div>
                  </div>
                  <button onClick={(e) => deleteTodo(todo.id, e)} className="ml-2 p-2 text-slate-300 opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-all active:scale-90"><TrashIcon /></button>
                </div>
              ))}
              {todos.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center opacity-20 py-10">
                   <p className="text-4xl mb-2">🎉</p>
                   <p className="text-[10px] font-black uppercase tracking-widest">任務全數達成</p>
                </div>
              )}
            </div>
            {/* Gradient Mask for scroll */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent pointer-events-none z-20"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
