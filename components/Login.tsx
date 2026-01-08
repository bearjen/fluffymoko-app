
import React, { useState } from 'react';

interface LoginProps {
  onLogin: (password: string) => boolean;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    // 模擬網路延遲
    setTimeout(() => {
      const success = onLogin(password);
      if (!success) {
        setError(true);
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 relative overflow-hidden">
      {/* 背景裝飾 */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-600/10 rounded-full blur-[120px]"></div>

      <div className="w-full max-w-md p-8 relative z-10">
        <div className="bg-white/10 backdrop-blur-2xl border border-white/10 rounded-[3.5rem] p-12 shadow-2xl animate-fadeIn">
          <div className="text-center mb-10">
            <div className="bg-indigo-600 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-600/20">
              <span className="text-3xl">🐾</span>
            </div>
            <h1 className="text-3xl font-black text-white tracking-tighter">FluffyMoko</h1>
            <p className="text-slate-400 text-sm font-bold mt-2 uppercase tracking-widest">管理端系統入口</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-2">管理員密碼</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="請輸入存取密碼"
                className={`w-full bg-white/5 border-2 rounded-2xl py-5 px-6 text-white font-bold outline-none transition-all placeholder:text-slate-600 ${
                  error ? 'border-rose-500 bg-rose-500/10' : 'border-white/10 focus:border-indigo-500'
                }`}
              />
              {error && (
                <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest mt-2 ml-2 animate-pulse">
                  密碼錯誤，請重新輸入
                </p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                '確認登入'
              )}
            </button>
          </form>

          <div className="mt-10 text-center">
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">
              建議使用個人電腦以確保資料安全
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
