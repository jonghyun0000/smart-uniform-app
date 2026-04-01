'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { TopBar } from '@/components/ui';
import { formatPrice, formatDate, getOrderStatusColor, getRepairStatusColor, getReservationStatusColor } from '@/lib/utils';
import { Search, ShoppingBag, Calendar, Scissors } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Order, Reservation, RepairRequest } from '@/types/database';

type TabType = '주문' | '예약' | '수선';

export default function MyPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [tab, setTab] = useState<TabType>('주문');
  const [orders, setOrders] = useState<Order[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async () => {
    if (!phone.trim()) { toast.error('연락처를 입력해주세요'); return; }
    setLoading(true);
    try {
      // 고객 조회
      let query = supabase.from('customers').select('id');
      if (name.trim()) query = query.eq('name', name.trim());
      query = query.eq('phone', phone.trim());
      const { data: customers } = await query;
      const ids = (customers ?? []).map(c => c.id);

      if (ids.length === 0) {
        toast.error('해당 정보로 등록된 내역이 없어요');
        setOrders([]); setReservations([]); setRepairs([]);
        setSearched(true);
        setLoading(false);
        return;
      }

      const [ordersRes, resRes, repairsRes] = await Promise.all([
        supabase.from('orders').select('*, schools(*), order_items(*)').in('customer_id', ids).order('created_at', { ascending: false }),
        supabase.from('reservations').select('*, schools(*)').in('customer_id', ids).order('reservation_date', { ascending: false }),
        supabase.from('repair_requests').select('*').in('customer_id', ids).order('created_at', { ascending: false }),
      ]);

      setOrders((ordersRes.data ?? []) as Order[]);
      setReservations((resRes.data ?? []) as Reservation[]);
      setRepairs((repairsRes.data ?? []) as RepairRequest[]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar title="마이페이지" />

      {/* 검색 */}
      <div className="px-4 py-4 space-y-3 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-2">
          <input
            className="h-12 px-4 rounded-2xl border-2 border-gray-200 text-sm focus:border-rose-400 outline-none"
            placeholder="이름 (선택)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
          <input
            className="h-12 px-4 rounded-2xl border-2 border-gray-200 text-sm focus:border-rose-400 outline-none"
            placeholder="연락처 *"
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
        </div>
        <button
          onClick={handleSearch}
          disabled={loading}
          className="w-full h-12 bg-rose-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-50"
        >
          <Search className="w-4 h-4" />
          {loading ? '조회중...' : '내역 조회'}
        </button>
      </div>

      {searched && (
        <>
          {/* 탭 */}
          <div className="flex border-b border-gray-200">
            {([
              ['주문', ShoppingBag, orders.length],
              ['예약', Calendar, reservations.length],
              ['수선', Scissors, repairs.length],
            ] as [TabType, any, number][]).map(([t, Icon, count]) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-1 transition-colors ${tab === t ? 'text-rose-600 border-b-2 border-rose-600' : 'text-gray-400'}`}>
                <Icon className="w-4 h-4" />{t}
                {count > 0 && <span className="bg-rose-100 text-rose-600 text-xs px-1.5 rounded-full">{count}</span>}
              </button>
            ))}
          </div>

          <div className="px-4 py-4 space-y-3">
            {/* 주문 목록 */}
            {tab === '주문' && (
              orders.length === 0 ? <EmptyMsg text="주문 내역이 없어요" /> :
              orders.map(order => (
                <div key={order.id} className="card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-500">{order.order_number}</span>
                    <span className={`status-chip ${getOrderStatusColor(order.status)}`}>{order.status}</span>
                  </div>
                  <div className="text-sm text-gray-600">{order.order_type} · {order.schools?.name}</div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">{formatDate(order.created_at)}</span>
                    <span className="font-bold text-rose-600">{formatPrice(order.total_amount)}</span>
                  </div>
                  {(order.order_items ?? []).length > 0 && (
                    <div className="border-t pt-2 space-y-1">
                      {(order.order_items ?? []).map((item, i) => (
                        <div key={i} className="flex justify-between text-xs text-gray-500">
                          <span>{item.product_name} × {item.quantity}</span>
                          <span>{formatPrice(item.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* 예약 목록 */}
            {tab === '예약' && (
              reservations.length === 0 ? <EmptyMsg text="예약 내역이 없어요" /> :
              reservations.map(r => (
                <div key={r.id} className="card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-500">{r.reservation_number}</span>
                    <span className={`status-chip ${getReservationStatusColor(r.status)}`}>{r.status}</span>
                  </div>
                  <div className="text-base font-bold text-gray-900">
                    {r.reservation_date} {r.reservation_time.slice(0, 5)}
                  </div>
                  <div className="text-sm text-gray-500">{r.schools?.name}</div>
                </div>
              ))
            )}

            {/* 수선 목록 */}
            {tab === '수선' && (
              repairs.length === 0 ? <EmptyMsg text="수선 내역이 없어요" /> :
              repairs.map(r => (
                <div key={r.id} className="card p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-gray-500">{r.repair_number}</span>
                    <span className={`status-chip ${getRepairStatusColor(r.status)}`}>{r.status}</span>
                  </div>
                  <div className="space-y-1">
                    {(r.repair_items ?? []).map((item: any, i: number) => (
                      <div key={i} className="text-sm text-gray-600">{item.item} × {item.quantity}</div>
                    ))}
                  </div>
                  <div className="text-xs text-gray-400">{formatDate(r.created_at)}</div>
                  {r.memo && <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">{r.memo}</div>}
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyMsg({ text }: { text: string }) {
  return <div className="py-12 text-center text-gray-400 font-medium">{text}</div>;
}
