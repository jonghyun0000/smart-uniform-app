'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDateTime, getOrderStatusColor } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types/database';
import toast from 'react-hot-toast';
import { Search, Filter, RefreshCw, CheckCircle, Edit2, X } from 'lucide-react';
import { Modal } from '@/components/ui';

const ALL_STATUSES: OrderStatus[] = ['접수대기', '접수완료', '결제대기', '결제완료', '준비중', '수령완료', '취소'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<OrderStatus | 'all'>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    let query = supabase
      .from('orders')
      .select('*, customers(*), schools(*), order_items(*)')
      .order('created_at', { ascending: false });

    if (filterStatus !== 'all') query = query.eq('status', filterStatus);

    const { data, error } = await query;
    if (!error) setOrders((data ?? []) as Order[]);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    loadOrders();
    const channel = supabase.channel('admin_orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadOrders)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadOrders]);

  const updateStatus = async (orderId: string, newStatus: OrderStatus) => {
    setUpdatingId(orderId);
    const { error } = await supabase.from('orders').update({ status: newStatus }).eq('id', orderId);
    if (error) toast.error('상태 변경 실패');
    else { toast.success(`${newStatus}으로 변경됐어요`); loadOrders(); }
    setUpdatingId(null);
  };

  // 판매 확정 → 재고 차감
  const confirmSale = async (order: Order) => {
    if (order.is_confirmed) { toast('이미 확정된 주문이에요'); return; }
    setUpdatingId(order.id);
    try {
      // 재고 차감
      for (const item of order.order_items ?? []) {
        if (!item.variant_id) continue;
        const { data: inv } = await supabase.from('inventory').select('quantity').eq('variant_id', item.variant_id).single();
        if (!inv || inv.quantity < item.quantity) {
          toast.error(`${item.product_name} 재고가 부족해요`);
          setUpdatingId(null);
          return;
        }
        await supabase.from('inventory').update({ quantity: inv.quantity - item.quantity }).eq('variant_id', item.variant_id);
        await supabase.from('sales_logs').insert({
          order_id: order.id, variant_id: item.variant_id,
          quantity_change: -item.quantity, reason: '판매확정', admin_user: 'admin',
        });
      }
      await supabase.from('orders').update({
        is_confirmed: true,
        confirmed_at: new Date().toISOString(),
        confirmed_by: 'admin',
        status: '결제완료',
      }).eq('id', order.id);
      toast.success('판매 확정 및 재고 차감 완료!');
      loadOrders();
      setShowDetail(false);
    } catch (err) {
      toast.error('판매 확정 실패');
    } finally {
      setUpdatingId(null);
    }
  };

  const filtered = orders.filter(o => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      o.order_number.toLowerCase().includes(s) ||
      o.customers?.name?.includes(s) ||
      o.customers?.phone?.includes(s) ||
      o.schools?.name?.includes(s)
    );
  });

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">주문 관리</h1>
        <button onClick={loadOrders} className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 검색 + 필터 */}
      <div className="flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full h-11 pl-10 pr-4 rounded-xl border-2 border-gray-200 text-sm focus:border-rose-400 outline-none"
            placeholder="이름, 연락처, 주문번호, 학교"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-11 px-3 rounded-xl border-2 border-gray-200 text-sm focus:border-rose-400 outline-none bg-white"
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as any)}
        >
          <option value="all">전체 상태</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* 상태 빠른 필터 */}
      <div className="flex gap-2 flex-wrap">
        {(['all', ...ALL_STATUSES] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              filterStatus === s ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {s === 'all' ? '전체' : s}
          </button>
        ))}
      </div>

      {/* 주문 테이블 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['주문번호', '주문자', '학교', '주문유형', '금액', '상태', '접수일', '관리'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">로딩 중...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">주문이 없어요</td></tr>
              ) : (
                filtered.map(order => (
                  <tr key={order.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => { setSelectedOrder(order); setShowDetail(true); }}>
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">{order.order_number}</td>
                    <td className="px-4 py-3 font-semibold">{order.customers?.name} <span className="text-xs text-gray-400">{order.customers?.phone}</span></td>
                    <td className="px-4 py-3 text-gray-600">{order.schools?.name ?? '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{order.order_type}</td>
                    <td className="px-4 py-3 font-bold">{formatPrice(order.total_amount)}</td>
                    <td className="px-4 py-3"><span className={`status-chip ${getOrderStatusColor(order.status)}`}>{order.status}</span></td>
                    <td className="px-4 py-3 text-xs text-gray-400">{formatDateTime(order.created_at)}</td>
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <select
                        className="text-xs border rounded-lg px-2 py-1 bg-white focus:border-rose-400 outline-none"
                        value={order.status}
                        onChange={e => updateStatus(order.id, e.target.value as OrderStatus)}
                        disabled={updatingId === order.id}
                      >
                        {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          총 {filtered.length}건
        </div>
      </div>

      {/* 주문 상세 모달 */}
      <Modal open={showDetail} onClose={() => setShowDetail(false)} title="주문 상세">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 bg-gray-50 rounded-2xl p-4 text-sm">
              <div><span className="text-gray-400 text-xs">주문번호</span><p className="font-bold font-mono">{selectedOrder.order_number}</p></div>
              <div><span className="text-gray-400 text-xs">상태</span><p><span className={`status-chip ${getOrderStatusColor(selectedOrder.status)}`}>{selectedOrder.status}</span></p></div>
              <div><span className="text-gray-400 text-xs">주문자</span><p className="font-bold">{selectedOrder.customers?.name}</p></div>
              <div><span className="text-gray-400 text-xs">연락처</span><p className="font-bold">{selectedOrder.customers?.phone}</p></div>
              <div><span className="text-gray-400 text-xs">학교</span><p>{selectedOrder.schools?.name ?? '-'}</p></div>
              <div><span className="text-gray-400 text-xs">유형</span><p>{selectedOrder.order_type}</p></div>
            </div>

            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-500">주문 상품</p>
              {(selectedOrder.order_items ?? []).map((item, i) => (
                <div key={i} className="flex justify-between text-sm bg-gray-50 rounded-xl px-3 py-2">
                  <span>{item.product_name} × {item.quantity}</span>
                  <span className="font-bold">{formatPrice(item.total_price)}</span>
                </div>
              ))}
              <div className="flex justify-between font-bold text-base border-t pt-2">
                <span>합계</span>
                <span className="text-rose-600">{formatPrice(selectedOrder.total_amount)}</span>
              </div>
            </div>

            {selectedOrder.memo && (
              <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700">메모: {selectedOrder.memo}</div>
            )}

            {/* 상태 변경 */}
            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">상태 변경</p>
              <div className="grid grid-cols-2 gap-2">
                {ALL_STATUSES.filter(s => s !== selectedOrder.status).map(s => (
                  <button key={s} onClick={() => { updateStatus(selectedOrder.id, s); setSelectedOrder({ ...selectedOrder, status: s }); }}
                    className="h-10 rounded-xl border-2 border-gray-200 text-xs font-semibold hover:border-rose-400 hover:text-rose-600 transition-all">
                    {s}로 변경
                  </button>
                ))}
              </div>
            </div>

            {/* 판매 확정 */}
            {!selectedOrder.is_confirmed && (
              <button
                onClick={() => confirmSale(selectedOrder)}
                disabled={updatingId === selectedOrder.id}
                className="w-full h-12 bg-emerald-600 text-white rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50"
              >
                <CheckCircle className="w-5 h-5" />
                판매 확정 (재고 차감)
              </button>
            )}
            {selectedOrder.is_confirmed && (
              <div className="bg-emerald-50 rounded-xl p-3 text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                판매 확정 완료 · {selectedOrder.confirmed_at && formatDateTime(selectedOrder.confirmed_at)}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
