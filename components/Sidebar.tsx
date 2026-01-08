import React from 'react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const menuItems = [
    { id: 'dashboard', label: '儀表板', icon: '📊' },
    { id: 'rooms', label: '房間配置', icon: '🏠' },
    { id: 'care-logs', label: '每日照護', icon: '📝' },
    { id: 'bookings', label: '預約管理', icon: '📅' },
    { id: 'pets', label: '毛孩檔案', icon: '🐾' },
    { id: 'ai-assistant', label: 'AI 照護助理', icon: '✨' },
    { id: 'settings', label: '系統設定', icon: '⚙️' },
  ];

  return (
    <div className="w-64 bg-white border-r h-screen sticky top-0 flex flex-col">
      <div className="p-6 border-b flex items-center gap-2">
        <div className="bg-indigo-600 p-2 rounded-lg text-white font-bold">M</div>
        <h1 className="text-xl font-bold text-gray-800 tracking-tighter">FluffyMoko</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeTab === item.id
                ? 'bg-indigo-50 text-indigo-600 font-semibold shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="text-lg">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>
      <div className="p-4 border-t">
        <div className="bg-gray-50 rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">當前用戶</p>
          <p className="font-medium text-sm">旅館管理員</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;