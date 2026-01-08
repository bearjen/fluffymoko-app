import React, { useState, useRef } from 'react';
import { supabase } from '../services/supabaseClient';

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

  // 執行雲端備份 (Sync to Cloud)
  const handleCloudSync = async () => {
    if (!syncId.trim()) {
      alert('請先輸入一個「同步金鑰」，這將作為您跨裝置存取的憑證。');
      return;
    }

    setIsSyncing(true);
    try {
      // 取得目前的 base64 資料並轉回 JSON 物件
      const base64Data = onExport();
      const rawJson = JSON.parse(decodeURIComponent(escape(atob(base64Data))));
      
      const { error } = await supabase
        .from('settings')
        .upsert({ 
          id: syncId.trim(), 
          data: rawJson,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      localStorage.setItem('fm_sync_id', syncId.trim());
      setLastSyncTime(new Date().toLocaleTimeString());
      alert('✅ 雲端同步成功！資料已安全存儲在 Supabase 資料庫。');
    } catch (err: any) {
      console.error('Sync error:', err);
      alert(`❌ 同步失敗：${err.message || '請確認網路連線或資料庫權限'}`);
    } finally {
      setIsSyncing(false);
    }
  };

  // 執行雲端還原 (Restore from Cloud)
  const handleCloudRestore = async () => {
    if (!syncId.trim()) {
      alert('請輸入您的「同步金鑰」以進行還原。');
      return;
    }

    if (!confirm('⚠️ 警告：還原操作將會「完全覆蓋」目前設備上的所有資料，確定要繼續嗎？')) {
      return;
    }

    setIsFetching(true);
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('data')
        .eq('id', syncId.trim())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          throw new Error('找不到該金鑰對應的備份資料，請檢查金鑰是否輸入正確。');
        }
        throw error;
      }

      if (data && data.data) {
        // 將 JSON 轉回 base64 以適配現有的 onImport 邏輯
        const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(data.data))));
        const success = onImport(base64);
        
        if (success) {
          localStorage.setItem('fm_sync_id', syncId.trim());
          alert('✅ 資料還原成功！系統將自動重新整理以應用新數據。');
          window.location.reload();
        } else {
          throw new Error('資料格式校驗失敗。');
        }
      }
    } catch (err: any) {
      console.error('Restore error:', err);
      alert(`❌ 還原失敗：${err.message}`);
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
        <p className="text-slate-500 font-bold ml-7">專業雲端同步與數據安全管理。</p>
      </header>

      <div className="grid grid-cols-1 gap-10">
        {/* Supabase Cloud Sync Section */}
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
                <span className="text-[10px] font-black text-white uppercase tracking-widest">Connected to Services</span>
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
                    placeholder="例如：my-secret-key-2025"
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
                    ✓ 系統已在 {lastSyncTime} 完成最後一次同步
                  </p>
                )}
              </div>

              <div className="pt-8 border-t border-white/10">
                <div className="flex flex-col md:flex-row gap-6">
                   <div className="flex-1">
                      <p className="text-[10px] text-white/40 font-bold leading-relaxed mb-1 italic">同步邏輯說明</p>
                      <p className="text-[10px] text-white/60 leading-relaxed">
                        「同步至雲端」會將您目前的「毛孩檔案、預約紀錄、房間狀態與日誌」打包上傳。
                        「從雲端還原」則會從資料庫抓取該金鑰的最新存檔並覆蓋本地儲存。
                      </p>
                   </div>
                   <div className="flex-1">
                      <p className="text-[10px] text-white/40 font-bold leading-relaxed mb-1 italic">安全性提示</p>
                      <p className="text-[10px] text-white/60 leading-relaxed">
                        您的金鑰即為密鑰，請確保其複雜度且不要與他人分享。
                        建議在每次完成重大資料更動後手動執行「同步至雲端」。
                      </p>
                   </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] -z-0"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] -z-0"></div>
        </section>

        {/* Physical Backup Section */}
        <section className="bg-white rounded-[3.5rem] p-12 border-2 border-slate-100 shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3 mb-8">
              <span className="bg-emerald-100 p-2 rounded-2xl text-xl">📁</span> 本地數據導出
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between hover:border-emerald-200 transition-colors">
                <div>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">下載離線 JSON</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6">將全館數據匯出為檔案存放在您的電腦或隨身碟。</p>
                </div>
                <button 
                  onClick={handleDownloadFile}
                  className="w-full py-5 bg-white text-slate-900 border-2 border-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all flex items-center justify-center gap-3"
                >
                  📥 匯出資料檔案
                </button>
              </div>

              <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
                <div>
                  <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">手動上傳還原</h4>
                  <p className="text-xs text-slate-500 leading-relaxed mb-6">選取先前下載的 .json 檔案來還原所有歷史紀錄。</p>
                </div>
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

        {/* Security Info Card */}
        <section className="p-10 bg-indigo-50 rounded-[3.5rem] flex items-center gap-8">
           <div className="text-4xl">🛡️</div>
           <div>
              <h4 className="text-lg font-black text-slate-800">隱私與數據權益</h4>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1">
                本系統優先採用加密後的雲端存儲。如果您不希望資料留在雲端，您可以定期清理資料庫紀錄，並改用「本地數據導出」功能。
              </p>
           </div>
        </section>
      </div>
    </div>
  );
};

export default Settings;