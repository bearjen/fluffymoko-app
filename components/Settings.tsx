import React, { useState, useRef } from 'react';
import { supabase, supabaseKey } from '../services/supabaseClient';

interface SettingsProps {
  onExport: () => string;
  onImport: (data: string) => boolean;
}

const Settings: React.FC<SettingsProps> = ({ onExport, onImport }) => {
  const [syncId, setSyncId] = useState(() => localStorage.getItem('fm_sync_id') || '');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFetching, setIsFetching] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 驗證金鑰格式是否看起來正確
  const validateSupabaseConfig = () => {
    if (!supabaseKey || !supabaseKey.startsWith('eyJ')) {
      alert('❌ 設定錯誤：您的 Supabase Anon Key 格式似乎不正確。\n\n正確的金鑰應該是以 "eyJ" 開頭的超長字串。請到 Supabase Dashboard 的 Project Settings > API 重新複製「anon public」金鑰。');
      return false;
    }
    return true;
  };

  const handleCloudSync = async () => {
    const key = syncId.trim();
    if (!key) {
      alert('請先輸入一個「同步金鑰」，這將作為您跨裝置存取的憑證。');
      return;
    }

    if (!validateSupabaseConfig()) return;

    setIsSyncing(true);
    try {
      const base64Data = onExport();
      const rawJson = JSON.parse(decodeURIComponent(escape(atob(base64Data))));
      
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          id: key, 
          data: rawJson,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });

      if (error) throw error;

      localStorage.setItem('fm_sync_id', key);
      setLastSyncTime(new Date().toLocaleTimeString());
      alert('✅ 雲端同步成功！資料已安全存儲。');
    } catch (err: any) {
      console.error('Supabase Sync Error:', err);
      let errorMsg = err.message || '未知錯誤';
      
      if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        errorMsg = '無法連線到 Supabase 伺服器。\n\n可能的解決方案：\n1. 檢查您的 Supabase URL 是否正確。\n2. 檢查 Anon Key 是否正確 (應以 eyJ 開頭)。\n3. 如果您有安裝 AdBlock (廣告阻擋器)，請先對此網站關閉它再試一次。';
      } else if (err.message?.includes('relation "public.settings" does not exist')) {
        errorMsg = '資料庫中找不到 "settings" 資料表。請去 Supabase SQL Editor 執行建表語法。';
      }
      
      alert(`❌ 同步失敗：\n${errorMsg}`);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCloudRestore = async () => {
    const key = syncId.trim();
    if (!key) {
      alert('請輸入您的「同步金鑰」以進行還原。');
      return;
    }

    if (!validateSupabaseConfig()) return;

    if (!confirm('⚠️ 警告：還原操作將會「完全覆蓋」目前設備上的所有資料，確定要繼續嗎？')) {
      return;
    }

    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('data')
        .eq('id', key)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        throw new Error('找不到該金鑰對應的備份資料，請檢查金鑰是否正確。');
      }

      if (data && data.data) {
        const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(data.data))));
        const success = onImport(base64);
        
        if (success) {
          localStorage.setItem('fm_sync_id', key);
          alert('✅ 資料還原成功！');
          window.location.reload();
        } else {
          throw new Error('資料還原失敗：數據格式不符。');
        }
      }
    } catch (err: any) {
      console.error('Supabase Restore Error:', err);
      let errorMsg = err.message || '還原失敗';
      if (err.message === 'Failed to fetch') {
        errorMsg = '無法連線到伺服器，請檢查網路或金鑰設定。';
      }
      alert(`❌ 還原失敗：\n${errorMsg}`);
    } finally {
      setIsFetching(false);
    }
  };

  const handleDownloadFile = () => {
    try {
      const base64Data = onExport();
      const jsonStr = decodeURIComponent(escape(atob(base64Data)));
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `FluffyMoko_Backup_${date}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('檔案產出失敗。');
    }
  };

  return (
    <div className="animate-fadeIn max-w-5xl mx-auto text-left pb-20">
      <header className="mb-12">
        <div className="flex items-center gap-4 mb-2">
          <div className="bg-indigo-600 w-3 h-10 rounded-full"></div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">System Settings</h2>
        </div>
        <p className="text-slate-500 font-bold ml-7">專業雲端同步與數據安全管理中心。</p>
      </header>

      <div className="grid grid-cols-1 gap-10">
        <section className="bg-slate-900 rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
              <div>
                <h3 className="text-3xl font-black text-white flex items-center gap-4">
                  <span className="bg-indigo-500 p-3 rounded-3xl text-2xl">☁️</span> Supabase 雲端引擎
                </h3>
                <p className="text-indigo-200/60 mt-2 font-bold text-sm">輸入您的專屬金鑰，即可在任何裝置間同步全館毛孩與預約數據。</p>
              </div>
              <div className="bg-white/10 px-6 py-3 rounded-2xl border border-white/10 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Active Sync Cloud</span>
              </div>
            </div>

            <div className="bg-white/5 p-10 rounded-[2.5rem] border border-white/10 space-y-10">
              <div className="space-y-4">
                <label className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] ml-2">同步金鑰 (Sync Key)</label>
                <div className="flex flex-col md:flex-row gap-4">
                  <input 
                    type="text" 
                    value={syncId}
                    onChange={(e) => setSyncId(e.target.value)}
                    placeholder="例如：moko-cat-hotel-2025"
                    className="flex-1 bg-white/10 border-2 border-white/10 rounded-2xl px-6 py-5 text-white font-black text-lg outline-none focus:border-indigo-500 focus:bg-white/20 transition-all placeholder:text-white/20"
                  />
                  <div className="flex gap-4">
                    <button 
                      onClick={handleCloudSync}
                      disabled={isSyncing || isFetching}
                      className="flex-1 md:flex-none px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isSyncing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : '📤 同步至雲端'}
                    </button>
                    <button 
                      onClick={handleCloudRestore}
                      disabled={isSyncing || isFetching}
                      className="flex-1 md:flex-none px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-100 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isFetching ? <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div> : '📥 從雲端還原'}
                    </button>
                  </div>
                </div>
                {lastSyncTime && (
                  <p className="text-[10px] font-bold text-emerald-400 ml-2 animate-fadeIn">
                    ✓ 系統已在 {lastSyncTime} 完成最後一次同步作業
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[3.5rem] p-12 border-2 border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 mb-8">
              <span className="bg-emerald-100 p-2 rounded-2xl text-xl">📁</span> 本地數據導出
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between hover:border-emerald-200 transition-colors">
                <button 
                  onClick={handleDownloadFile}
                  className="w-full py-5 bg-white text-slate-900 border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3"
                >
                  📥 匯出資料檔案
                </button>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        try {
                          const content = event.target?.result as string;
                          JSON.parse(content);
                          const base64 = btoa(unescape(encodeURIComponent(content)));
                          if (confirm('確定要從檔案還原嗎？這將覆蓋現有資料。')) {
                            const s = onImport(base64);
                            if (s) { alert('還原成功！'); window.location.reload(); }
                          }
                        } catch (err) { alert('檔案格式不正確'); }
                      };
                      reader.readAsText(file);
                    }
                  }} 
                  accept=".json" 
                  className="hidden" 
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-5 bg-white border-2 border-slate-200 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center gap-3"
                >
                  📤 選擇備份檔案
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="p-10 bg-indigo-50 rounded-[3.5rem] border-2 border-indigo-100 flex items-center gap-8">
           <div className="text-4xl">🛠️</div>
           <div>
              <h4 className="text-lg font-black text-slate-800">故障排除提示 (Failed to fetch)</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1">
                這通常表示瀏覽器無法連線至您的 Supabase。請檢查：<br/>
                1. <strong>金鑰格式</strong>：您的金鑰應該是長度約 400 字元、以 <b>eyJ</b> 開頭的字串。<br/>
                2. <strong>阻擋器</strong>：請關閉 AdBlock 或 uBlock 等廣告攔截插件。<br/>
                3. <strong>網址正確</strong>：確認網址結尾沒有多餘空格。
              </p>
           </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;