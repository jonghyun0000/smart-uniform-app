'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'smart2026!';

export default function AdminLoginPage() {
  const router = useRouter();
  const [pw, setPw] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!pw) { toast.error('비밀번호를 입력해주세요'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem('admin_auth', 'true');
      sessionStorage.setItem('admin_auth_time', Date.now().toString());
      toast.success('로그인 성공!');
      router.push('/admin/dashboard');
    } else {
      toast.error('비밀번호가 틀렸습니다');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-rose-950 flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">관리자 로그인</h1>
          <p className="text-white/60 mt-1 text-sm">스마트학생복 관리자 전용</p>
        </div>
        <div className="bg-white/10 backdrop-blur rounded-3xl p-6 space-y-4">
          <div className="relative">
            <input
              type={show ? 'text' : 'password'}
              placeholder="비밀번호"
              value={pw}
              onChange={e => setPw(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()}
              className="w-full h-14 bg-white/20 border border-white/30 rounded-2xl px-4 pr-12 text-white placeholder-white/50 text-base outline-none focus:border-rose-400 focus:bg-white/25"
            />
            <button onClick={() => setShow(!show)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60">
              {show ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full h-14 bg-rose-600 text-white font-bold text-lg rounded-2xl active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </div>
        <p className="text-center text-white/30 text-xs mt-4">
          기본 비밀번호: smart2026!
        </p>
      </div>
    </div>
  );
}
