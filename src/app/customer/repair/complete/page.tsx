'use client';
import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { CheckCircle, Home } from 'lucide-react';
import { useCustomer } from '@/app/customer/CustomerContext';

function RepairCompleteContent() {
  const router = useRouter();
  const { dispatch } = useCustomer();
  const searchParams = useSearchParams();
  const repairNumber = searchParams.get('repairNumber');
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    const t = setInterval(() => setCountdown(c => {
      if (c <= 1) { clearInterval(t); router.push('/customer'); return 0; }
      return c - 1;
    }), 1000);
    return () => clearInterval(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <CheckCircle className="w-20 h-20 text-purple-500 mb-4" />
      <h1 className="text-2xl font-bold text-gray-900 mb-2">수선 접수 완료!</h1>
      <p className="text-gray-500 mb-6">직원이 확인 후 연락드립니다</p>
      <div className="bg-gray-50 rounded-2xl p-6 w-full max-w-sm mb-6">
        <p className="text-sm text-gray-500">접수번호</p>
        <p className="text-2xl font-black text-gray-900 mt-1">{repairNumber}</p>
        <p className="text-xs text-gray-400 mt-2">마이페이지에서 상태를 확인할 수 있어요</p>
      </div>
      <Button fullWidth size="lg" onClick={() => { dispatch({ type: 'RESET' }); router.push('/customer'); }}>
        <Home className="w-5 h-5" /> 홈으로 ({countdown}초)
      </Button>
    </div>
  );
}

export default function RepairCompletePage() {
  return <Suspense fallback={null}><RepairCompleteContent /></Suspense>;
}
