'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice, formatDateTime, getOrderStatusColor } from '@/lib/utils';
import { ShoppingBag, Calendar, Scissors, RefreshCw, TrendingUp, Users } from 'lucide-react';
import type { Order, Reservation, RepairRequest } from '@/types/database';
import Link from 'next/link';

interface DashboardStats {
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  todayReservations: number;
  pendingRepairs: number;
  pendingExchanges: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    todayOrders: 0, todayRevenue: 0, pendingOrders: 0,
    todayReservations: 0, pendingRepairs: 0, pendingExchanges: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [todayReservations, setTodayReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().slice(0, 10);

  const loadData = async () => {
    const [ordersRes, todayResRes, repairsRes, exchangeRes] = await Promise.all([
      supabase.from('orders').select('*, customers(*), schools(*)').gte('created_at', today).order('created_at', { ascending: false }),
      supabase.from('reservations').select('*, customers(*), schools(*)').eq('reservation_date', today).order('reservation_time'),
      supabase.from('repair_requests').select('id, status').neq('status', '수령완료'),
      supabase.from('exchange_refund_requests').select('id, status').in('status', ['접수', '검토중']),
    ]);

    const orders = (ordersRes.data ?? []) as Order[];
    setRecentOrders(orders.slice(0, 10));
    setTodayReservations((todayResRes.data ?? []) as Reservation[]);

    setStats({
      todayOrders: orders.length,
      todayRevenue: orders.filter(o => o.status === '결제완료' || o.status === '수령완료').reduce((s, o) => s + o.total_amount, 0),
      pendingOrders: orders.filter(o => o.status === '접수대기' || o.status === '접수완료').length,
      todayReservations: (todayResRes.data ?? []).length,
      pendingRepairs: (repairsRes.data ?? []).length,
      pendingExchanges: (exchangeRes.data ?? []).length,
    });
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    // 실시간 구독
    const channel = supabase
      .channel('dashboard')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, loadData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, loadData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) return <div className="flex items-center justify-center h-48"><div className="text-gray-400 animate-pulse">데이터 로딩 중...</div></div>;

  const statCards = [
    { label: '오늘 주문', value: stats.todayOrders + '건', icon: ShoppingBag, color: 'bg-rose-50 text-rose-600', href: '/admin/orders' },
    { label: '오늘 매출', value: formatPrice(stats.todayRevenue), icon: TrendingUp, color: 'bg-green-50 text-green-600', href: '/admin/statistics' },
    { label: '처리 대기', value: stats.pendingOrders + '건', icon: Users, color: 'bg-orange-50 text-orange-600', href: '/admin/orders' },
    { label: '오늘 예약', value: stats.todayReservations + '명', icon: Calendar, color: 'bg-blue-50 text-blue-600', href: '/admin/reservations' },
    { label: '수선 진행중', value: stats.pendingRepairs + '건', icon: Scissors, color: 'bg-purple-50 text-purple-600', href: '/admin/repairs' },
    { label: '환불/교환', value: stats.pendingExchanges + '건', icon: RefreshCw, color: 'bg-amber-50 text-amber-600', href: '/admin/exchange' },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-black text-gray-900">대시보드</h1>
        <p className="text-gray-500 text-sm mt-1">{today} 기준</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map(card => (
          <Link key={card.label} href={card.href}
            className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-black text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 최근 주문 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">오늘 주문 목록</h2>
            <Link href="/admin/orders" className="text-sm text-rose-600 font-semibold">전체 보기</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentOrders.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">오늘 주문이 없어요</p>
            ) : (
              recentOrders.map(order => (
                <div key={order.id} className="p-4 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-900">{order.customers?.name}</span>
                      <span className="text-xs text-gray-400">{order.order_number}</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{order.schools?.name} · {order.order_type}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="font-bold text-sm text-gray-900">{formatPrice(order.total_amount)}</div>
                    <span className={`status-chip text-xs ${getOrderStatusColor(order.status)}`}>{order.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 오늘 예약 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-bold text-gray-900">오늘 예약 현황</h2>
            <Link href="/admin/reservations" className="text-sm text-rose-600 font-semibold">전체 보기</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {todayReservations.length === 0 ? (
              <p className="text-center text-gray-400 py-8 text-sm">오늘 예약이 없어요</p>
            ) : (
              todayReservations.map(r => (
                <div key={r.id} className="p-4 flex items-center gap-3">
                  <div className="w-16 text-center bg-blue-50 rounded-xl py-2">
                    <p className="text-lg font-black text-blue-700">{r.reservation_time.slice(0, 5)}</p>
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-gray-900">{r.customers?.name}</p>
                    <p className="text-xs text-gray-500">{r.customers?.phone} · {r.schools?.name}</p>
                  </div>
                  <span className={`status-chip text-xs ${r.status === '예약완료' ? 'bg-blue-100 text-blue-700' : r.status === '방문완료' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
