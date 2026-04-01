'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomer } from '@/app/customer/CustomerContext';
import { Button, TopBar, QuantityPicker } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';
import { WINTER_PRICE_TABLE, MISC_PRICES } from '@/lib/localData';
import toast from 'react-hot-toast';
import { useCartCount, useCartTotal } from '@/app/customer/CustomerContext';

const PE_SIZES = ['S', 'M', 'L', 'XL', 'XXL', '100', '105', '110', '115'];

export default function PEPage() {
  const router = useRouter();
  const { state, dispatch } = useCustomer();
  const cartCount = useCartCount();
  const cartTotal = useCartTotal();

  const [topSize, setTopSize] = useState('');
  const [bottomSize, setBottomSize] = useState('');
  const [topQty, setTopQty] = useState(1);
  const [bottomQty, setBottomQty] = useState(1);

  const schoolName = state.school_name;
  const winterData = WINTER_PRICE_TABLE[schoolName];
  const pePrice = winterData?.pe ?? 89000;
  const furPePrice = MISC_PRICES.기모체육복;

  const addToCart = (type: '상의' | '하의') => {
    const size = type === '상의' ? topSize : bottomSize;
    if (!size) { toast.error('사이즈를 선택해주세요'); return; }
    const qty = type === '상의' ? topQty : bottomQty;
    const price = type === '상의' ? pePrice : pePrice;
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        product_id: `pe-${type}`,
        variant_id: `pe-${type}-${size}`,
        product_name: `체육복 ${type} (${size})`,
        category: `체육복${type}`,
        size,
        quantity: qty,
        unit_price: price,
        total_price: price * qty,
        available_stock: 99,
      },
    });
    toast.success(`체육복 ${type} 담았어요! 🛒`);
    if (type === '상의') setTopSize('');
    else setBottomSize('');
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar title="체육복 구매" onBack={() => router.push('/customer/start')} />
      <div className="bg-blue-50 px-4 py-3">
        <p className="text-sm font-semibold text-blue-700">🏫 {schoolName}</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* 체육복 상의 */}
        <PECard
          title="체육복 상의"
          price={pePrice}
          sizes={PE_SIZES}
          selectedSize={topSize}
          qty={topQty}
          onSizeChange={setTopSize}
          onQtyChange={setTopQty}
          onAdd={() => addToCart('상의')}
        />
        {/* 체육복 하의 */}
        <PECard
          title="체육복 하의"
          price={pePrice}
          sizes={PE_SIZES}
          selectedSize={bottomSize}
          qty={bottomQty}
          onSizeChange={setBottomSize}
          onQtyChange={setBottomQty}
          onAdd={() => addToCart('하의')}
        />
        {/* 기모 체육복 */}
        <div className="card p-4 border-2 border-blue-100">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🧥</span>
            <div>
              <p className="font-bold text-gray-900">기모 체육복</p>
              <p className="text-sm text-rose-600 font-bold">{formatPrice(furPePrice)}</p>
            </div>
          </div>
          <p className="text-xs text-gray-500">기모 체육복은 직원에게 직접 문의해주세요.</p>
        </div>

        <div className="bg-amber-50 rounded-2xl p-3 text-xs text-amber-700">
          ※ 교복·체육복 이월제품 20% 할인 적용 가능<br/>
          ※ 기모바지 {formatPrice(MISC_PRICES.기모바지)}, 기모체육복 {formatPrice(MISC_PRICES.기모체육복)}
        </div>
      </div>

      {cartCount > 0 && (
        <div className="fixed bottom-20 left-0 right-0 max-w-2xl mx-auto px-4">
          <button
            onClick={() => router.push('/customer/cart')}
            className="w-full bg-rose-600 text-white rounded-2xl h-14 flex items-center justify-between px-5 shadow-lg font-bold text-base active:scale-95 transition-transform"
          >
            <span className="bg-white/20 rounded-xl px-2.5 py-1 text-sm font-bold">{cartCount}개</span>
            <span>장바구니 보기</span>
            <span>{formatPrice(cartTotal)}</span>
          </button>
        </div>
      )}
    </div>
  );
}

function PECard({ title, price, sizes, selectedSize, qty, onSizeChange, onQtyChange, onAdd }: {
  title: string; price: number; sizes: string[]; selectedSize: string;
  qty: number; onSizeChange: (s: string) => void; onQtyChange: (q: number) => void; onAdd: () => void;
}) {
  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-900">{title}</p>
          <p className="text-rose-600 font-bold">{formatPrice(price)}</p>
        </div>
        <span className="text-2xl">🏃</span>
      </div>
      <div>
        <p className="text-xs font-bold text-gray-500 mb-2">사이즈 선택</p>
        <div className="grid grid-cols-5 gap-1.5">
          {sizes.map(s => (
            <button key={s} onClick={() => onSizeChange(s)}
              className={`h-10 rounded-xl border-2 text-sm font-semibold transition-all ${
                selectedSize === s ? 'border-rose-500 bg-rose-50 text-rose-700' : 'border-gray-200 text-gray-700'
              }`}>{s}</button>
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm font-bold text-gray-700">수량</p>
        <QuantityPicker value={qty} onChange={onQtyChange} />
      </div>
      {selectedSize && (
        <div className="bg-rose-50 rounded-xl p-3 flex justify-between">
          <span className="text-sm text-gray-600">합계</span>
          <span className="font-bold text-rose-600">{formatPrice(price * qty)}</span>
        </div>
      )}
      <Button fullWidth onClick={onAdd} disabled={!selectedSize}>
        <ShoppingCart className="w-4 h-4" /> 장바구니 담기
      </Button>
    </div>
  );
}
