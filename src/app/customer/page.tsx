'use client';

import { useRouter } from 'next/navigation';
import { ShoppingBag, Calendar, Scissors, RefreshCw, ChevronRight, Star } from 'lucide-react';
import { useCustomer } from './CustomerContext';

const MENU_ITEMS = [
  { label: '교복 구매', icon: ShoppingBag, color: 'bg-red-50 text-red-600', href: '/customer/order?type=교복구매', desc: '동복·하복 교복 주문' },
  { label: '체육복 구매', icon: ShoppingBag, color: 'bg-blue-50 text-blue-600', href: '/customer/order?type=체육복구매', desc: '체육복 주문' },
  { label: '명찰 구매', icon: Star, color: 'bg-yellow-50 text-yellow-600', href: '/customer/order?type=명찰구매', desc: '명찰 주문' },
  { label: '수선 접수', icon: Scissors, color: 'bg-purple-50 text-purple-600', href: '/customer/repair', desc: '교복 수선 신청' },
  { label: '사전 예약', icon: Calendar, color: 'bg-green-50 text-green-600', href: '/customer/reservation', desc: '방문 예약 (30분 단위)' },
  { label: '환불/교환 문의', icon: RefreshCw, color: 'bg-orange-50 text-orange-600', href: '/customer/exchange', desc: '환불·교환 신청' },
];

export default function CustomerHomePage() {
  const router = useRouter();
  const { dispatch } = useCustomer();

  const handleMenuClick = (href: string, type?: string) => {
    if (type) {
      dispatch({ type: 'SET_ORDER_TYPE', payload: type as any });
    }
    router.push(href);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* 헤더 */}
      <div className="bg-gradient-to-b from-rose-600 to-rose-500 text-white px-5 pt-10 pb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-white/80 text-sm font-medium tracking-widest uppercase">Smart</span>
        </div>
        <h1 className="text-2xl font-bold leading-tight">스마트학생복</h1>
        <p className="text-white/80 text-sm mt-1">춘천점 셀프 주문 시스템</p>
      </div>

      {/* 시작하기 버튼 - 가장 위, 크게 */}
      <div className="px-4 -mt-5">
        <button
          onClick={() => router.push('/customer/start')}
          className="btn-press w-full bg-white rounded-2xl shadow-lg px-6 py-5 flex items-center justify-between border-2 border-rose-500 active:scale-95 transition-transform"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-500 flex items-center justify-center">
              <ShoppingBag className="w-7 h-7 text-white" />
            </div>
            <div className="text-left">
              <div className="text-xl font-bold text-gray-900">주문 시작하기</div>
              <div className="text-sm text-gray-500 mt-0.5">교복·체육복·명찰 주문/예약</div>
            </div>
          </div>
          <ChevronRight className="w-6 h-6 text-rose-500 flex-shrink-0" />
        </button>
      </div>

      {/* 메뉴 그리드 */}
      <div className="px-4 mt-5">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">서비스 선택</p>
        <div className="grid grid-cols-2 gap-3">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.label}
              onClick={() => handleMenuClick(item.href, item.href.includes('type=') ? item.href.split('type=')[1] : undefined)}
              className="btn-press card p-4 text-left active:scale-95 transition-transform"
            >
              <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center mb-3`}>
                <item.icon className="w-5 h-5" />
              </div>
              <div className="font-semibold text-gray-900 text-sm">{item.label}</div>
              <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 가격표 안내 */}
      <div className="mx-4 mt-5 mb-4 bg-rose-50 rounded-2xl p-4">
        <p className="text-xs font-semibold text-rose-700 mb-2">📋 2026 가격 안내</p>
        <div className="text-xs text-rose-600 space-y-1">
          <div className="flex justify-between">
            <span>동복 세트 (상+하+조끼+셔츠+넥타이)</span>
            <span className="font-bold">309,000원~</span>
          </div>
          <div className="flex justify-between">
            <span>하복 세트 (상+하)</span>
            <span className="font-bold">116,000원~</span>
          </div>
          <div className="flex justify-between">
            <span>체육복</span>
            <span className="font-bold">89,000원~</span>
          </div>
        </div>
      </div>

      {/* 공지 */}
      <div className="mx-4 mb-6 bg-amber-50 rounded-2xl p-4">
        <p className="text-xs font-semibold text-amber-700">📢 안내사항</p>
        <p className="text-xs text-amber-600 mt-1">
          교복·체육복 이월제품 20% 할인<br/>
          천명찰 2,000원 / 리본·타이류 별도 5,000원
        </p>
      </div>
    </div>
  );
}
