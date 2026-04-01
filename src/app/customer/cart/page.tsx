'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomer, useCartTotal } from '@/app/customer/CustomerContext';
import { Button, TopBar, Modal, QuantityPicker } from '@/components/ui';
import { formatPrice } from '@/lib/utils';
import { Trash2, ShoppingBag, ChevronRight, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';
import { generateOrderNumber } from '@/lib/utils';

export default function CartPage() {
  const router = useRouter();
  const { state, dispatch } = useCustomer();
  const cartTotal = useCartTotal();
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [memo, setMemo] = useState('');

  const cart = state.cart;

  const handleRemove = (variantId: string) => {
    dispatch({ type: 'REMOVE_FROM_CART', payload: variantId });
    toast.success('상품을 삭제했어요');
  };

  const handleQtyChange = (variantId: string, qty: number) => {
    dispatch({ type: 'UPDATE_CART_QTY', payload: { variant_id: variantId, quantity: qty } });
  };

  const handleOrder = async () => {
    if (cart.length === 0) { toast.error('장바구니가 비어있어요'); return; }
    if (!state.customer.name || !state.customer.phone) {
      toast.error('고객 정보가 없습니다. 다시 시작해주세요');
      router.push('/customer/start');
      return;
    }
    setLoading(true);
    try {
      // 1. 고객 등록/조회
      let customerId = '';
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone', state.customer.phone)
        .eq('name', state.customer.name)
        .maybeSingle();

      if (existingCustomer) {
        customerId = existingCustomer.id;
        // 최신 정보 업데이트
        await supabase.from('customers').update({
          school_id: state.school_id || null,
          grade: state.customer.grade || null,
          class_num: state.customer.class_num || null,
          student_num: state.customer.student_num || null,
          gender: state.customer.gender || null,
        }).eq('id', customerId);
      } else {
        const { data: newCustomer, error: custError } = await supabase
          .from('customers')
          .insert({
            name: state.customer.name,
            phone: state.customer.phone,
            school_id: state.school_id || null,
            grade: state.customer.grade || null,
            class_num: state.customer.class_num || null,
            student_num: state.customer.student_num || null,
            gender: state.customer.gender || null,
          })
          .select('id')
          .single();
        if (custError || !newCustomer) throw new Error('고객 등록 실패: ' + custError?.message);
        customerId = newCustomer.id;
      }

      // 2. 주문 생성
      const orderNumber = generateOrderNumber();
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          order_number: orderNumber,
          customer_id: customerId,
          school_id: state.school_id || null,
          order_type: state.order_type || '교복구매',
          status: '접수대기',
          total_amount: cartTotal,
          paid_amount: 0,
          discount_amount: 0,
          memo: memo || null,
          is_confirmed: false,
        })
        .select('id, order_number')
        .single();
      if (orderError || !order) throw new Error('주문 생성 실패: ' + orderError?.message);

      // 3. 주문 항목 생성
      const items = cart.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id.startsWith('fallback') || item.variant_id.startsWith('pe') || item.variant_id.startsWith('nameplate') ? null : item.variant_id,
        product_name: item.product_name,
        size: item.size,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
      }));
      const { error: itemsError } = await supabase.from('order_items').insert(items);
      if (itemsError) throw new Error('주문 항목 저장 실패: ' + itemsError.message);

      // 4. 성공 → 완료 페이지
      dispatch({ type: 'CLEAR_CART' });
      setShowConfirm(false);
      router.push(`/customer/order/complete?orderNumber=${order.order_number}`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || '주문 중 오류가 발생했어요. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <TopBar title="장바구니" onBack={() => router.back()} />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <ShoppingBag className="w-16 h-16 text-gray-200" />
          <p className="text-lg font-bold text-gray-400">장바구니가 비어있어요</p>
          <Button onClick={() => router.push('/customer/start')}>상품 보러 가기</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <TopBar title="장바구니" onBack={() => router.back()} />

      {/* 장바구니 목록 */}
      <div className="px-4 py-4 space-y-3">
        <p className="text-sm font-semibold text-gray-500">{cart.length}개 상품</p>
        {cart.map((item) => (
          <div key={item.variant_id} className="card p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
                {item.category.includes('체육복') ? '🏃' : item.category === '명찰' ? '🏷️' : '👔'}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-900 text-sm leading-tight">{item.product_name}</p>
                <p className="text-rose-600 font-bold mt-1">{formatPrice(item.unit_price)}</p>
              </div>
              <button onClick={() => handleRemove(item.variant_id)} className="w-8 h-8 flex items-center justify-center text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
              <QuantityPicker
                value={item.quantity}
                max={item.available_stock}
                onChange={(qty) => handleQtyChange(item.variant_id, qty)}
              />
              <p className="font-bold text-gray-900 text-base">{formatPrice(item.total_price)}</p>
            </div>
          </div>
        ))}

        {/* 메모 */}
        <div className="card p-4">
          <p className="text-sm font-bold text-gray-700 mb-2">요청사항 (선택)</p>
          <textarea
            className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm resize-none focus:border-rose-400 outline-none"
            rows={3}
            placeholder="특별 요청사항이 있으시면 입력해주세요"
            value={memo}
            onChange={e => setMemo(e.target.value)}
          />
        </div>
      </div>

      {/* 주문 합계 + 버튼 */}
      <div className="fixed bottom-16 left-0 right-0 max-w-2xl mx-auto bg-white border-t border-gray-200 p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-gray-600 font-semibold">총 주문금액</span>
          <span className="text-2xl font-bold text-rose-600">{formatPrice(cartTotal)}</span>
        </div>
        <Button fullWidth size="xl" onClick={() => setShowConfirm(true)}>
          주문하기 <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      {/* 주문 확인 모달 */}
      <Modal open={showConfirm} onClose={() => !loading && setShowConfirm(false)} title="주문 확인">
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">주문자</span>
              <span className="font-bold">{state.customer.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">연락처</span>
              <span className="font-bold">{state.customer.phone}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">학교</span>
              <span className="font-bold">{state.school_name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">상품 수</span>
              <span className="font-bold">{cart.length}종 {cart.reduce((s, i) => s + i.quantity, 0)}개</span>
            </div>
          </div>

          <div className="space-y-1.5">
            {cart.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span className="text-gray-700 truncate flex-1 mr-2">{item.product_name} × {item.quantity}</span>
                <span className="font-semibold flex-shrink-0">{formatPrice(item.total_price)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
              <span>합계</span>
              <span className="text-rose-600">{formatPrice(cartTotal)}</span>
            </div>
          </div>

          <div className="flex items-start gap-2 bg-amber-50 rounded-xl p-3">
            <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">주문 후 직원이 확인 및 접수 처리합니다. 결제는 매장에서 진행됩니다.</p>
          </div>

          <Button fullWidth size="lg" loading={loading} onClick={handleOrder}>
            주문 완료하기
          </Button>
        </div>
      </Modal>
    </div>
  );
}
