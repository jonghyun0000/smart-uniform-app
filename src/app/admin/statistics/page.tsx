'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { TrendingUp, ShoppingBag, School, Package } from 'lucide-react';

const COLORS = ['#e11d48', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

export default function AdminStatisticsPage() {
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [schoolData, setSchoolData] = useState<any[]>([]);
  const [summary, setSummary] = useState({ totalRevenue: 0, totalOrders: 0, avgOrder: 0, confirmedOrders: 0 });
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadStats();
  }, [year]);

  const loadStats = async () => {
    setLoading(true);

    // 월별 매출 (확정 주문만)
    const { data: orders } = await supabase
      .from('orders')
      .select('total_amount, created_at, status, is_confirmed, order_type, schools(name), order_items(product_name, total_price, quantity)')
      .gte('created_at', `${year}-01-01`)
      .lte('created_at', `${year}-12-31`);

    const allOrders = orders ?? [];
    const confirmed = allOrders.filter(o => o.is_confirmed || o.status === '결제완료' || o.status === '수령완료');

    // 월별 집계
    const monthly: Record<number, { revenue: number; count: number }> = {};
    for (let m = 1; m <= 12; m++) monthly[m] = { revenue: 0, count: 0 };
    confirmed.forEach(o => {
      const m = parseInt(o.created_at.slice(5, 7));
      monthly[m].revenue += o.total_amount;
      monthly[m].count += 1;
    });
    setMonthlyData(Object.entries(monthly).map(([m, d]) => ({
      month: `${m}월`, revenue: d.revenue, count: d.count,
    })));

    // 품목별 집계
    const catMap: Record<string, number> = {};
    confirmed.forEach(o => {
      (o.order_items ?? []).forEach((item: any) => {
        const cat = item.product_name.split(' (')[0].split(' ')[0];
        catMap[cat] = (catMap[cat] ?? 0) + item.total_price;
      });
    });
    setCategoryData(
      Object.entries(catMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([name, value]) => ({ name, value }))
    );

    // 학교별 집계
    const schoolMap: Record<string, { revenue: number; count: number }> = {};
    allOrders.forEach(o => {
      const name = (o.schools as any)?.name ?? '기타';
      if (!schoolMap[name]) schoolMap[name] = { revenue: 0, count: 0 };
      schoolMap[name].count += 1;
      if (o.is_confirmed || o.status === '결제완료' || o.status === '수령완료') {
        schoolMap[name].revenue += o.total_amount;
      }
    });
    setSchoolData(
      Object.entries(schoolMap)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([name, d]) => ({ name, ...d }))
    );

    // 요약
    const totalRevenue = confirmed.reduce((s, o) => s + o.total_amount, 0);
    setSummary({
      totalRevenue,
      totalOrders: allOrders.length,
      confirmedOrders: confirmed.length,
      avgOrder: confirmed.length > 0 ? Math.round(totalRevenue / confirmed.length) : 0,
    });

    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">판매 통계</h1>
        <select
          className="h-10 px-3 rounded-xl border-2 border-gray-200 text-sm font-bold focus:border-rose-400 outline-none"
          value={year}
          onChange={e => setYear(parseInt(e.target.value))}
        >
          {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}년</option>)}
        </select>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: '연간 총매출', value: formatPrice(summary.totalRevenue), icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
          { label: '전체 주문', value: summary.totalOrders + '건', icon: ShoppingBag, color: 'text-blue-600 bg-blue-50' },
          { label: '확정 주문', value: summary.confirmedOrders + '건', icon: Package, color: 'text-rose-600 bg-rose-50' },
          { label: '평균 주문금액', value: formatPrice(summary.avgOrder), icon: School, color: 'text-purple-600 bg-purple-50' },
        ].map(card => (
          <div key={card.label} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className={`w-10 h-10 rounded-xl ${card.color} flex items-center justify-center mb-3`}>
              <card.icon className="w-5 h-5" />
            </div>
            <p className="text-xl font-black text-gray-900">{card.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
          </div>
        ))}
      </div>

      {/* 월별 매출 차트 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900 mb-4">{year}년 월별 매출</h2>
        {loading ? (
          <div className="h-64 flex items-center justify-center text-gray-400">로딩 중...</div>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => v >= 1000000 ? (v / 1000000).toFixed(0) + 'M' : v >= 1000 ? (v / 1000).toFixed(0) + 'K' : v} />
              <Tooltip formatter={(v: any) => formatPrice(v)} labelStyle={{ fontWeight: 'bold' }} />
              <Bar dataKey="revenue" fill="#e11d48" radius={[6, 6, 0, 0]} name="매출액" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 월별 주문 건수 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h2 className="font-bold text-gray-900 mb-4">월별 주문 건수</h2>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={monthlyData} margin={{ top: 5, right: 10, bottom: 5, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v: any) => v + '건'} />
            <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} name="주문건수" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 품목별 매출 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">품목별 매출</h2>
          {categoryData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">데이터 없음</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatPrice(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-2">
                {categoryData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-700">{d.name}</span>
                    </div>
                    <span className="font-bold">{formatPrice(d.value)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* 학교별 주문 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="font-bold text-gray-900 mb-4">학교별 주문 현황</h2>
          {schoolData.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">데이터 없음</p>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={schoolData} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip formatter={(v: any) => v + '건'} />
                  <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} name="주문수" />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 space-y-1.5">
                {schoolData.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700 w-20 truncate">{d.name}</span>
                    <div className="flex-1 mx-3 bg-gray-100 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-blue-400"
                        style={{ width: `${(d.count / (schoolData[0]?.count || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="font-bold text-gray-700 w-10 text-right">{d.count}건</span>
                    <span className="text-gray-400 w-20 text-right">{formatPrice(d.revenue)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* 상세 테이블 - 월별 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">월별 상세 데이터</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['월', '주문 건수', '확정 매출', '평균 주문금액'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-bold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {monthlyData.map((d, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-5 py-3 font-bold">{d.month}</td>
                  <td className="px-5 py-3">{d.count}건</td>
                  <td className="px-5 py-3 font-bold text-rose-600">{formatPrice(d.revenue)}</td>
                  <td className="px-5 py-3 text-gray-600">{d.count > 0 ? formatPrice(Math.round(d.revenue / d.count)) : '-'}</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-bold border-t-2 border-gray-200">
                <td className="px-5 py-3">합계</td>
                <td className="px-5 py-3">{monthlyData.reduce((s, d) => s + d.count, 0)}건</td>
                <td className="px-5 py-3 text-rose-600">{formatPrice(monthlyData.reduce((s, d) => s + d.revenue, 0))}</td>
                <td className="px-5 py-3 text-gray-600">-</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
