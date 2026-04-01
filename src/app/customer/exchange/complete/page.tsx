'use client';
import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui';
import { CheckCircle, Home } from 'lucide-react';
import { useCustomer } from '@/app/customer/CustomerContext';

function ExchangeCompleteContent() {
  const router = useRouter();
  const { dispatch } = useCustomer();
  const params = useSearchParams();
  const reqNumber = params.get('reqNumber');
  const [cd, setCd] = useState(8);

  useEffect(() => {
    const t = setInterval(() => setCd(c => { if (c <= 1) { clearInterval(t); router.push('/customer'); return 0; } return c - 1; }), 1000);
    return () => clearInterval(t);
  }, [router]);

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 text-center">
      <CheckCircle className="w-20 h-20 text-orange-500 mb-4" />
      <h1 className="text-2xl font-bold mb-2">문의 접수 완료!</h1>
      <p className="text-gray-500 mb-6">담당자가 확인 후 연락드립니다</p>
      <div className="bg-gray-50 rounded-3xl p-6 w-full max-w-sm mb-6">
        <p className="text-xs text-gray-400">접수번호</p>
        <p className="text-2xl font-black">{reqNumber}</p>
      </div>
      <Button fullWidth size="lg" onClick={() => { dispatch({ type: 'RESET' }); router.push('/customer'); }}>
        <Home className="w-5 h-5" /> 홈으로 ({cd}초)
      </Button>
    </div>
  );
}

export default function ExchangeCompletePage() {
  return <Suspense fallback={null}><ExchangeCompleteContent /></Suspense>;
}
