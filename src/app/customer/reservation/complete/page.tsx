'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { CheckCircle, Home } from 'lucide-react';
import { useCustomer } from '@/app/customer/CustomerContext';

function ReservationCompleteContent() {
  const router = useRouter();
  const { dispatch } = useCustomer();
  const params = useSearchParams();
  const resNumber = params.get('resNumber');
  const date = params.get('date');
  const time = params.get('time');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); router.push('/customer'); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <CheckCircle className="w-20 h-20 text-green-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">예약 완료!</h1>
      <p className="text-gray-500 mb-6">방문 예약이 확정되었어요</p>
      <div className="bg-gray-50 rounded-3xl p-6 w-full max-w-sm mb-4 space-y-3">
        <div>
          <p className="text-xs text-gray-400">예약번호</p>
          <p className="text-2xl font-black text-gray-900">{resNumber}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200">
          <div><p className="text-xs text-gray-400">날짜</p><p className="font-bold">{date}</p></div>
          <div><p className="text-xs text-gray-400">시간</p><p className="font-bold text-green-600">{time}</p></div>
        </div>
      </div>
      <p className="text-sm text-gray-400 mb-6">마이페이지에서 예약 내역을 확인할 수 있어요</p>
      <Button fullWidth size="lg" onClick={() => { dispatch({ type: 'RESET' }); router.push('/customer'); }}>
        <Home className="w-5 h-5" /> 홈으로 ({countdown}초)
      </Button>
    </div>
  );
}

export default function ReservationCompletePage() {
  return <Suspense fallback={null}><ReservationCompleteContent /></Suspense>;
}
