'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCustomer } from '@/app/customer/CustomerContext';
import { Button, TopBar, QuantityPicker, Modal } from '@/components/ui';
import type { Product, ProductVariant } from '@/types/database';
import { formatPrice } from '@/lib/utils';
import { WINTER_PRICE_TABLE, SUMMER_PRICE_TABLE } from '@/lib/localData';
import toast from 'react-hot-toast';
import { ShoppingCart, Info, AlertTriangle } from 'lucide-react';
import { useCartCount, useCartTotal } from '@/app/customer/CustomerContext';

type UniformTab = '동복' | '하복';

export default function ProductsPage() {
  const router = useRouter();
  const { state, dispatch } = useCustomer();
  const cartCount = useCartCount();
  const cartTotal = useCartTotal();
  const [tab, setTab] = useState<UniformTab>('동복');
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [showModal, setShowModal] = useState(false);

  const schoolName = state.school_name;

  // 해당 학교 상품 로드
  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_variants(
            *,
            inventory(*)
          )
        `)
        .eq('school_id', state.school_id)
        .eq('is_active', true)
        .in('uniform_type', ['동복', '하복'])
        .order('sort_order');

      if (data && !error && data.length > 0) {
        setProducts(data as Product[]);
      } else {
        // 폴백: 가격표에서 상품 생성
        setProducts(buildFallbackProducts(schoolName, tab));
      }
      setLoading(false);
    }
    if (state.school_id) loadProducts();
  }, [state.school_id, schoolName]);

  // 탭 변경 시 상품 필터
  const filteredProducts = products.filter(p => p.uniform_type === tab);

  // 장바구니 담기
  const handleAddToCart = () => {
    if (!selectedVariant || !selectedProduct) return;
    const stock = selectedVariant.inventory?.quantity ?? 99;
    if (stock <= 0) {
      toast.error('재고가 부족합니다');
      return;
    }
    dispatch({
      type: 'ADD_TO_CART',
      payload: {
        product_id: selectedProduct.id,
        variant_id: selectedVariant.id,
        product_name: `${selectedProduct.name} (${selectedVariant.size})`,
        category: selectedProduct.category,
        size: selectedVariant.size,
        quantity,
        unit_price: selectedVariant.price,
        total_price: selectedVariant.price * quantity,
        available_stock: stock,
      },
    });
    toast.success(`장바구니에 담았어요! 🛒`);
    setShowModal(false);
    setSelectedProduct(null);
    setSelectedVariant(null);
    setQuantity(1);
  };

  const openProductModal = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariant(null);
    setQuantity(1);
    setShowModal(true);
  };

  if (!state.school_id) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">학교를 먼저 선택해주세요</p>
        <Button onClick={() => router.push('/customer/start')} className="mt-4">학교 선택하러 가기</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <TopBar
        title="교복 구매"
        onBack={() => router.push('/customer/start')}
        rightElement={
          cartCount > 0 ? (
            <button onClick={() => router.push('/customer/cart')} className="relative w-10 h-10 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-gray-700" />
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
                {cartCount}
              </span>
            </button>
          ) : undefined
        }
      />

      {/* 학교 + 탭 */}
      <div className="bg-rose-50 px-4 py-3">
        <p className="text-sm font-semibold text-rose-700">🏫 {schoolName}</p>
      </div>
      <div className="flex border-b border-gray-200">
        {(['동복', '하복'] as UniformTab[]).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3.5 text-base font-bold transition-colors ${
              tab === t ? 'text-rose-600 border-b-2 border-rose-600' : 'text-gray-400'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* 가격표 요약 */}
      <PriceInfoBanner schoolName={schoolName} tab={tab} />

      {/* 상품 목록 */}
      {loading ? (
        <div className="p-8 text-center text-gray-400">상품을 불러오는 중...</div>
      ) : filteredProducts.length > 0 ? (
        <div className="px-4 py-4 space-y-3">
          {filteredProducts.map(product => (
            <ProductCard key={product.id} product={product} onAdd={() => openProductModal(product)} />
          ))}
        </div>
      ) : (
        <FallbackProductList schoolName={schoolName} tab={tab} onAdd={openProductModal} />
      )}

      {/* 장바구니 플로팅 버튼 */}
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

      {/* 상품 선택 모달 */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={selectedProduct?.name ?? ''}>
        {selectedProduct && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-sm text-gray-500">{selectedProduct.category}</p>
              <p className="text-xl font-bold text-gray-900 mt-1">{formatPrice(selectedProduct.base_price)}</p>
            </div>

            {/* 사이즈 선택 */}
            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">사이즈 선택 *</p>
              <div className="grid grid-cols-4 gap-2">
                {(selectedProduct.product_variants ?? []).map(v => {
                  const stock = v.inventory?.quantity ?? 0;
                  const isSoldOut = stock === 0;
                  return (
                    <button
                      key={v.id}
                      onClick={() => !isSoldOut && setSelectedVariant(v)}
                      disabled={isSoldOut}
                      className={`h-12 rounded-xl border-2 font-semibold text-sm transition-all ${
                        selectedVariant?.id === v.id
                          ? 'border-rose-500 bg-rose-50 text-rose-700'
                          : isSoldOut
                          ? 'border-gray-100 bg-gray-50 text-gray-300 line-through'
                          : 'border-gray-200 text-gray-700 hover:border-rose-300'
                      }`}
                    >
                      {v.size}
                      {stock <= 3 && stock > 0 && (
                        <span className="block text-[9px] text-orange-500">잔여 {stock}</span>
                      )}
                      {isSoldOut && <span className="block text-[9px]">품절</span>}
                    </button>
                  );
                })}
              </div>
              {(selectedProduct.product_variants ?? []).length === 0 && (
                <p className="text-sm text-gray-400 text-center py-4">사이즈 정보가 없습니다. 직원에게 문의해주세요.</p>
              )}
            </div>

            {/* 수량 */}
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-gray-700">수량</p>
              <QuantityPicker
                value={quantity}
                min={1}
                max={selectedVariant?.inventory?.quantity ?? 10}
                onChange={setQuantity}
              />
            </div>

            {/* 합계 */}
            {selectedVariant && (
              <div className="bg-rose-50 rounded-2xl p-4 flex justify-between items-center">
                <span className="font-semibold text-gray-700">합계</span>
                <span className="text-xl font-bold text-rose-600">{formatPrice(selectedVariant.price * quantity)}</span>
              </div>
            )}

            <Button
              fullWidth
              size="lg"
              onClick={handleAddToCart}
              disabled={!selectedVariant}
              className="mt-2"
            >
              <ShoppingCart className="w-5 h-5" />
              장바구니 담기
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}

// 가격 정보 배너
function PriceInfoBanner({ schoolName, tab }: { schoolName: string; tab: UniformTab }) {
  const [open, setOpen] = useState(false);
  const winterData = WINTER_PRICE_TABLE[schoolName];
  const summerData = SUMMER_PRICE_TABLE[schoolName];

  if (!winterData && !summerData) return null;

  return (
    <div className="mx-4 mt-3">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 text-sm text-blue-600 font-semibold"
      >
        <Info className="w-4 h-4" />
        {schoolName} {tab} 가격표 보기
      </button>
      {open && tab === '동복' && winterData && (
        <div className="mt-2 bg-blue-50 rounded-2xl p-4 text-sm space-y-1.5 animate-fade-in">
          {winterData.top && <div className="flex justify-between"><span className="text-gray-600">상의</span><strong>{formatPrice(winterData.top)}</strong></div>}
          {winterData.bottom && <div className="flex justify-between"><span className="text-gray-600">하의</span><strong>{formatPrice(winterData.bottom)}</strong></div>}
          {winterData.vest && <div className="flex justify-between"><span className="text-gray-600">조끼/스웨터</span><strong>{formatPrice(winterData.vest)}</strong></div>}
          {winterData.shirt && <div className="flex justify-between"><span className="text-gray-600">셔츠/T</span><strong>{formatPrice(winterData.shirt)}</strong></div>}
          {winterData.tie && <div className="flex justify-between"><span className="text-gray-600">타이/리본</span><strong>{formatPrice(winterData.tie)}</strong></div>}
          {winterData.set && (
            <div className="flex justify-between border-t pt-1.5 mt-1">
              <span className="font-bold text-rose-700">1세트</span>
              <strong className="text-rose-700 text-base">{formatPrice(winterData.set)}</strong>
            </div>
          )}
          {winterData.pe && <div className="flex justify-between"><span className="text-gray-600">체육복</span><strong>{formatPrice(winterData.pe)}</strong></div>}
          {winterData.note && <p className="text-xs text-gray-400 mt-1">※ {winterData.note}</p>}
        </div>
      )}
      {open && tab === '하복' && summerData && (
        <div className="mt-2 bg-blue-50 rounded-2xl p-4 text-sm space-y-1.5 animate-fade-in">
          {summerData.top && <div className="flex justify-between"><span className="text-gray-600">상의</span><strong>{formatPrice(summerData.top)}</strong></div>}
          {summerData.bottom && <div className="flex justify-between"><span className="text-gray-600">하의</span><strong>{formatPrice(summerData.bottom)}</strong></div>}
          {summerData.setPrice && (
            <div className="flex justify-between border-t pt-1.5 mt-1">
              <span className="font-bold text-rose-700">상+하 세트</span>
              <strong className="text-rose-700 text-base">{formatPrice(summerData.setPrice)}</strong>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// 상품 카드
function ProductCard({ product, onAdd }: { product: Product; onAdd: () => void }) {
  const inCart = false; // TODO: check cart
  const hasStock = (product.product_variants ?? []).some(v => (v.inventory?.quantity ?? 0) > 0);

  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
        {product.category.includes('상의') ? '👕' :
         product.category.includes('하의') ? '👖' :
         product.category === '넥타이' || product.category === '리본' ? '👔' :
         product.category === '조끼' || product.category === '스웨터' ? '🧥' :
         product.category === '셔츠' || product.category === '블라우스' ? '👔' : '👕'}
      </div>
      <div className="flex-1">
        <p className="font-bold text-gray-900">{product.name}</p>
        <p className="text-sm text-gray-500 mt-0.5">{product.category}</p>
        <p className="text-base font-bold text-rose-600 mt-1">{formatPrice(product.base_price)}</p>
      </div>
      <Button
        size="sm"
        variant={hasStock ? 'primary' : 'secondary'}
        onClick={onAdd}
        disabled={!hasStock}
      >
        {hasStock ? '선택' : '품절'}
      </Button>
    </div>
  );
}

// DB에 상품 없을 때 가격표 기반 폴백 UI
function FallbackProductList({
  schoolName, tab, onAdd,
}: {
  schoolName: string;
  tab: UniformTab;
  onAdd: (p: Product) => void;
}) {
  const winterData = WINTER_PRICE_TABLE[schoolName];
  const summerData = SUMMER_PRICE_TABLE[schoolName];

  const items = tab === '동복' ? [
    winterData?.top && { name: '상의(동복)', price: winterData.top, category: '교복상의', uniform_type: '동복' },
    winterData?.bottom && { name: '하의(동복)', price: winterData.bottom, category: '교복하의', uniform_type: '동복' },
    winterData?.vest && { name: '조끼/스웨터', price: winterData.vest, category: '조끼', uniform_type: '동복' },
    winterData?.shirt && { name: '셔츠/T', price: winterData.shirt, category: '셔츠', uniform_type: '동복' },
    winterData?.tie && { name: '넥타이/리본', price: winterData.tie, category: '넥타이', uniform_type: '동복' },
  ].filter(Boolean) : [
    summerData?.top && { name: '상의(하복)', price: summerData.top, category: '교복상의', uniform_type: '하복' },
    summerData?.bottom && { name: '하의(하복)', price: summerData.bottom, category: '교복하의', uniform_type: '하복' },
    summerData?.tie && { name: '타이/리본', price: summerData.tie, category: '넥타이', uniform_type: '하복' },
  ].filter(Boolean);

  if (!items.length) {
    return (
      <div className="p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500">상품 정보가 없습니다.<br />직원에게 문의해주세요.</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3">
      <div className="bg-amber-50 rounded-2xl p-3 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <p className="text-xs text-amber-700">사이즈 재고는 직원에게 확인해주세요. 가격표 기준으로 표시됩니다.</p>
      </div>
      {items.map((item: any, i) => (
        <div key={i} className="card p-4 flex items-center gap-4">
          <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center text-2xl">
            {item.category.includes('상의') ? '👕' : item.category.includes('하의') ? '👖' : '👔'}
          </div>
          <div className="flex-1">
            <p className="font-bold text-gray-900">{item.name}</p>
            <p className="text-base font-bold text-rose-600 mt-1">{formatPrice(item.price)}</p>
          </div>
          <Button
            size="sm"
            onClick={() => onAdd({
              id: `fallback-${i}`,
              school_id: null,
              name: item.name,
              category: item.category as any,
              uniform_type: item.uniform_type as any,
              gender: '공용',
              base_price: item.price,
              description: null,
              is_active: true,
              min_order_qty: 1,
              sort_order: i,
              created_at: '',
              updated_at: '',
              product_variants: [],
            })}
          >
            담기
          </Button>
        </div>
      ))}
    </div>
  );
}

// 폴백 상품 빌더
function buildFallbackProducts(schoolName: string, tab: UniformTab): Product[] {
  return [];
}
