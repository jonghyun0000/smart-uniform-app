'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { Button } from '@/components/ui';
import { CheckCircle, Printer, Home } from 'lucide-react';
import type { Order } from '@/types/database';
import { useCustomer } from '@/app/customer/CustomerContext';

function OrderCompleteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderNumber = searchParams.get('orderNumber');
  const { dispatch } = useCustomer();
  const [order, setOrder] = useState<Order | null>(null);
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!orderNumber) return;
    supabase
      .from('orders')
      .select('*, customers(*), order_items(*), schools(*)')
      .eq('order_number', orderNumber)
      .single()
      .then(({ data }) => { if (data) setOrder(data as Order); });
  }, [orderNumber]);

  // 10초 카운트다운 후 홈으로
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) {
          clearInterval(interval);
          dispatch({ type: 'RESET' });
          router.push('/customer');
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [dispatch, router]);

  const handlePrint = () => window.print();

  const handleGoHome = () => {
    dispatch({ type: 'RESET' });
    router.push('/customer');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* 성공 헤더 */}
      <div className="bg-emerald-500 text-white px-5 pt-12 pb-8 text-center no-print">
        <CheckCircle className="w-16 h-16 mx-auto mb-3 animate-bounce-soft" />
        <h1 className="text-2xl font-bold">주문이 완료되었어요!</h1>
        <p className="text-emerald-100 mt-1 text-sm">직원이 곧 확인하여 접수 처리합니다</p>
      </div>

      {/* 주문 정보 (영수증) */}
      <div className="flex-1 px-4 py-5 receipt-container">
        {/* 주문 번호 - 크게 강조 */}
        <div className="text-center mb-6 bg-gray-50 rounded-3xl p-6">
          <p className="text-sm text-gray-500 mb-1">주문번호</p>
          <p className="text-3xl font-black text-gray-900 tracking-wider">{orderNumber}</p>
          <p className="text-xs text-gray-400 mt-2">이 번호를 기억해두세요</p>
        </div>

        {order && (
          <div className="space-y-4">
            <div className="card p-4 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">주문자 정보</p>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">이름</span>
                <span className="font-bold">{order.customers?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">연락처</span>
                <span className="font-bold">{order.customers?.phone}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">학교</span>
                <span className="font-bold">{order.schools?.name ?? '-'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">접수일시</span>
                <span className="font-bold">{formatDateTime(order.created_at)}</span>
              </div>
            </div>

            <div className="card p-4 space-y-2">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">주문 상품</p>
              {(order.order_items ?? []).map((item, i) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-gray-700 flex-1 mr-2">{item.product_name} × {item.quantity}</span>
                  <span className="font-semibold flex-shrink-0">{formatPrice(item.total_price)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base border-t pt-2 mt-1">
                <span>합계</span>
                <span className="text-rose-600">{formatPrice(order.total_amount)}</span>
              </div>
            </div>

            <div className="bg-blue-50 rounded-2xl p-4 text-sm text-blue-700">
              <p className="font-bold mb-1">📋 안내</p>
              <p>결제는 매장 직원에게 문의해주세요.<br />상태 확인: 마이페이지 → 주문번호 조회</p>
            </div>
          </div>
        )}
      </div>

      {/* 하단 버튼 no-print */}
      <div className="px-4 pb-24 space-y-3 no-print">
        <Button variant="secondary" fullWidth onClick={handlePrint}>
          <Printer className="w-5 h-5" /> 영수증 인쇄
        </Button>
        <Button fullWidth size="lg" onClick={handleGoHome}>
          <Home className="w-5 h-5" /> 홈으로 가기 ({countdown}초)
        </Button>
      </div>
    </div>
  );
}

export default function OrderCompletePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="text-gray-400">로딩중...</div></div>}>
      <OrderCompleteContent />
    </Suspense>
  );
}
