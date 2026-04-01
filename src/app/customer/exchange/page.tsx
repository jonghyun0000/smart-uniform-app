'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCustomer } from '@/app/customer/CustomerContext';
import { Button, Input, TopBar } from '@/components/ui';
import { generateExchangeNumber } from '@/lib/utils';
import toast from 'react-hot-toast';
import { ChevronRight, Search } from 'lucide-react';
import type { ExchangeType, Order } from '@/types/database';

export default function ExchangePage() {
  const router = useRouter();
  const { state } = useCustomer();
  const [name, setName] = useState(state.customer.name || '');
  const [phone, setPhone] = useState(state.customer.phone || '');
  const [orderNumber, setOrderNumber] = useState('');
  const [foundOrder, setFoundOrder] = useState<Order | null>(null);
  const [requestType, setRequestType] = useState<ExchangeType>('환불');
  const [reason, setReason] = useState('');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const searchOrder = async () => {
    if (!orderNumber.trim() && (!phone.trim() || !name.trim())) {
      toast.error('주문번호 또는 이름+연락처를 입력해주세요');
      return;
    }
    setSearching(true);
    try {
      let query = supabase.from('orders').select('*, customers(*), order_items(*), schools(*)');
      if (orderNumber.trim()) {
        query = query.eq('order_number', orderNumber.trim());
      } else {
        const { data: customer } = await supabase.from('customers').select('id').eq('name', name).eq('phone', phone).maybeSingle();
        if (!customer) { toast.error('고객 정보를 찾을 수 없어요'); setSearching(false); return; }
        query = query.eq('customer_id', customer.id);
      }
      const { data, error } = await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
      if (error || !data) { toast.error('주문을 찾을 수 없어요'); setFoundOrder(null); }
      else setFoundOrder(data as Order);
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '이름을 입력해주세요';
    if (!phone.trim()) e.phone = '연락처를 입력해주세요';
    if (!reason.trim()) e.reason = '문의 내용을 입력해주세요';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    setLoading(true);
    try {
      let customerId = '';
      const { data: existing } = await supabase.from('customers').select('id').eq('phone', phone).eq('name', name).maybeSingle();
      if (existing) { customerId = existing.id; }
      else {
        const { data: newC, error } = await supabase.from('customers').insert({ name, phone }).select('id').single();
        if (error || !newC) throw new Error('고객 등록 실패');
        customerId = newC.id;
      }

      const reqNumber = generateExchangeNumber();
      const { error } = await supabase.from('exchange_refund_requests').insert({
        request_number: reqNumber,
        customer_id: customerId,
        order_id: foundOrder?.id ?? null,
        request_type: requestType,
        reason,
        status: '접수',
      });
      if (error) throw new Error(error.message);

      toast.success('문의가 접수되었어요!');
      router.push(`/customer/exchange/complete?reqNumber=${reqNumber}`);
    } catch (err: any) {
      toast.error(err.message || '접수 실패');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar title="환불/교환 문의" onBack={() => router.push('/customer')} />

      <div className="px-4 py-4 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Input label="이름 *" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} error={errors.name} />
          <Input label="연락처 *" placeholder="010-0000-0000" type="tel" value={phone} onChange={e => setPhone(e.target.value)} error={errors.phone} />
        </div>

        {/* 주문 조회 */}
        <div className="card p-4">
          <p className="text-sm font-bold text-gray-700 mb-2">주문 조회 (선택)</p>
          <div className="flex gap-2">
            <input
              className="flex-1 h-12 px-4 rounded-xl border-2 border-gray-200 text-sm focus:border-rose-400 outline-none"
              placeholder="주문번호 (예: ORD250401xxxx)"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
            />
            <button onClick={searchOrder} disabled={searching} className="h-12 px-4 bg-gray-100 rounded-xl flex items-center gap-1 text-sm font-semibold text-gray-700 whitespace-nowrap">
              <Search className="w-4 h-4" />{searching ? '조회중' : '조회'}
            </button>
          </div>
          {foundOrder && (
            <div className="mt-3 bg-green-50 rounded-xl p-3 text-sm">
              <p className="font-bold text-green-700">✓ 주문 확인됨: {foundOrder.order_number}</p>
              <p className="text-green-600">{foundOrder.order_type} · {foundOrder.total_amount.toLocaleString()}원</p>
            </div>
          )}
        </div>

        {/* 문의 유형 */}
        <div>
          <p className="text-sm font-bold text-gray-700 mb-2">문의 유형 *</p>
          <div className="grid grid-cols-3 gap-2">
            {(['환불', '교환', '문의'] as ExchangeType[]).map(t => (
              <button key={t} onClick={() => setRequestType(t)}
                className={`h-12 rounded-2xl border-2 font-bold text-sm transition-all ${
                  requestType === t ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-700'
                }`}>{t}</button>
            ))}
          </div>
        </div>

        {/* 내용 */}
        <div>
          <p className="text-sm font-bold text-gray-700 mb-2">문의 내용 *</p>
          <textarea
            className={`w-full border-2 rounded-2xl p-4 text-sm resize-none focus:border-orange-400 outline-none ${errors.reason ? 'border-red-400 bg-red-50' : 'border-gray-200'}`}
            rows={5}
            placeholder="환불/교환 사유를 자세히 적어주세요"
            value={reason}
            onChange={e => setReason(e.target.value)}
          />
          {errors.reason && <p className="text-xs text-red-500 mt-1">{errors.reason}</p>}
        </div>

        <Button fullWidth size="xl" loading={loading} onClick={handleSubmit}>
          문의 접수하기 <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
