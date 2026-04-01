'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomer } from '@/app/customer/CustomerContext';
import { Button, Input, TopBar } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { MISC_PRICES } from '@/lib/localData';

export default function NameplatePage() {
  const router = useRouter();
  const { state, dispatch } = useCustomer();
  const [nameType, setNameType] = useState<'auto' | 'custom'>('auto');
  const [customName, setCustomName] = useState('');
  const [tagType, setTagType] = useState<'천' | '부착'>('천');
  const [qty, setQty] = useState(1);

  const price = tagType === '천' ? MISC_PRICES.천명찰 : MISC_PRICES.부착명찰;
  const displayName = nameType === 'auto'
    ? `${state.customer.name} ${state.customer.grade ? state.customer.grade + '학년' : ''} ${state.customer.class_num ? state.customer.class_num + '반' : ''} ${state.customer.student_num ? state.customer.student_num + '번' : ''}`.trim()
    : customName;

  const handleAddToCart = () => {
    if (!displayName.trim()) { toast.error('명찰에 새길 이름/정보를 입력해주세요'); return; }
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        product_id: `nameplate-${tagType}`,
        variant_id: `nameplate-${tagType}-${Date.now()}`,
        product_name: `명찰(${tagType}) - ${displayName}`,
        category: '명찰',
        size: tagType,
        quantity: qty,
        unit_price: price,
        total_price: price * qty,
        available_stock: 999,
      },
    });
    toast.success('명찰을 담았어요! 🏷️');
    router.push('/customer/cart');
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar title="명찰 구매" onBack={() => router.push('/customer/start')} />

      <div className="px-4 py-4 space-y-4">
        {/* 명찰 종류 */}
        <div>
          <p className="text-sm font-bold text-gray-700 mb-2">명찰 종류</p>
          <div className="grid grid-cols-2 gap-3">
            {(['천', '부착'] as const).map(t => (
              <button key={t} onClick={() => setTagType(t)}
                className={`h-16 rounded-2xl border-2 font-bold text-base transition-all ${
                  tagType === t ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-700'
                }`}>
                {t === '천' ? '🏷️ 천명찰' : '📌 부착명찰'}
                <div className="text-sm font-normal mt-0.5">{formatPrice(t === '천' ? MISC_PRICES.천명찰 : MISC_PRICES.부착명찰)}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 이름 유형 */}
        <div>
          <p className="text-sm font-bold text-gray-700 mb-2">명찰 정보 입력 방식</p>
          <div className="grid grid-cols-2 gap-3">
            {([['auto', '자동 입력'], ['custom', '직접 입력']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setNameType(v)}
                className={`h-12 rounded-2xl border-2 font-semibold text-sm transition-all ${
                  nameType === v ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-700'
                }`}>{l}</button>
            ))}
          </div>
        </div>

        {/* 미리보기 / 직접 입력 */}
        {nameType === 'auto' ? (
          <div className="bg-gray-50 rounded-2xl p-4">
            <p className="text-xs text-gray-500 mb-1">명찰에 새겨질 내용</p>
            <p className="text-lg font-bold text-gray-900">
              {displayName || <span className="text-gray-300">이름 정보가 없습니다</span>}
            </p>
            <p className="text-xs text-gray-400 mt-1">앞 단계에서 입력한 이름/학년/반/번호가 사용됩니다</p>
          </div>
        ) : (
          <Input
            label="명찰 내용 직접 입력"
            placeholder="예: 홍길동 1학년 3반 15번"
            value={customName}
            onChange={e => setCustomName(e.target.value)}
          />
        )}

        {/* 수량 */}
        <div className="flex items-center justify-between card p-4">
          <p className="font-bold text-gray-700">수량</p>
          <div className="flex items-center gap-3">
            <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold">−</button>
            <span className="w-8 text-center font-bold text-lg">{qty}</span>
            <button onClick={() => setQty(Math.min(10, qty + 1))} className="w-11 h-11 rounded-xl border-2 border-gray-200 flex items-center justify-center text-xl font-bold">+</button>
          </div>
        </div>

        {/* 합계 */}
        <div className="bg-rose-50 rounded-2xl p-4 flex justify-between items-center">
          <span className="font-semibold text-gray-700">합계</span>
          <span className="text-xl font-bold text-rose-600">{formatPrice(price * qty)}</span>
        </div>

        <Button fullWidth size="xl" onClick={handleAddToCart}>
          장바구니 담기
        </Button>
      </div>
    </div>
  );
}
