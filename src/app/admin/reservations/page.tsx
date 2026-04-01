'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, getReservationStatusColor } from '@/lib/utils';
import type { Reservation, ReservationStatus } from '@/types/database';
import toast from 'react-hot-toast';
import { RefreshCw, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ko } from 'date-fns/locale';

const STATUSES: ReservationStatus[] = ['예약완료', '방문완료', '취소', '노쇼'];

export default function AdminReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDate, setViewDate] = useState(new Date());
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const dateStr = format(viewDate, 'yyyy-MM-dd');

  const loadReservations = useCallback(async () => {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, customers(*), schools(*)')
      .eq('reservation_date', dateStr)
      .order('reservation_time');
    if (!error) setReservations((data ?? []) as Reservation[]);
    setLoading(false);
  }, [dateStr]);

  useEffect(() => {
    setLoading(true);
    loadReservations();
    const channel = supabase.channel('admin_reservations')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, loadReservations)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [loadReservations]);

  const updateStatus = async (id: string, status: ReservationStatus) => {
    setUpdatingId(id);
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
    if (error) toast.error('상태 변경 실패');
    else { toast.success('변경됨'); loadReservations(); }
    setUpdatingId(null);
  };

  // 시간대별 그룹핑
  const byTime: Record<string, Reservation[]> = {};
  reservations.forEach(r => {
    const t = r.reservation_time.slice(0, 5);
    if (!byTime[t]) byTime[t] = [];
    byTime[t].push(r);
  });

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">예약 관리</h1>
        <button onClick={loadReservations} className="p-2 rounded-xl hover:bg-gray-100">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 날짜 선택 */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-between">
        <button onClick={() => setViewDate(d => subDays(d, 1))} className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="text-center">
          <p className="text-lg font-black text-gray-900">{format(viewDate, 'yyyy년 M월 d일', { locale: ko })}</p>
          <p className="text-sm text-gray-500">{format(viewDate, 'EEEE', { locale: ko })} · 총 {reservations.length}명</p>
        </div>
        <button onClick={() => setViewDate(d => addDays(d, 1))} className="w-10 h-10 rounded-xl hover:bg-gray-100 flex items-center justify-center">
          <ChevronRight className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* 오늘 버튼 */}
      <button onClick={() => setViewDate(new Date())} className="text-sm text-rose-600 font-semibold">
        오늘로 이동
      </button>

      {/* 시간대별 예약 */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">로딩 중...</div>
      ) : Object.keys(byTime).length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center text-gray-400 shadow-sm border border-gray-100">
          <Calendar className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p>이 날짜에 예약이 없어요</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(byTime).sort().map(([time, rsvs]) => (
            <div key={time} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="bg-blue-50 px-5 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black text-blue-700">{time}</span>
                  <span className="bg-blue-200 text-blue-800 text-xs font-bold px-2 py-0.5 rounded-full">{rsvs.length}/5명</span>
                </div>
                <div className="flex gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`w-4 h-4 rounded-full ${i < rsvs.length ? 'bg-blue-500' : 'bg-gray-200'}`} />
                  ))}
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {rsvs.map(r => (
                  <div key={r.id} className="px-5 py-4 flex items-center gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{r.customers?.name}</span>
                        <span className="text-sm text-gray-500">{r.customers?.phone}</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-0.5">
                        {r.schools?.name ?? '미지정'} · {r.reservation_number}
                      </div>
                      {r.memo && <div className="text-xs text-gray-400 mt-1 bg-gray-50 rounded px-2 py-1">{r.memo}</div>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`status-chip ${getReservationStatusColor(r.status)}`}>{r.status}</span>
                      <select
                        className="text-xs border rounded-lg px-2 py-1 bg-white focus:border-blue-400 outline-none"
                        value={r.status}
                        onChange={e => updateStatus(r.id, e.target.value as ReservationStatus)}
                        disabled={updatingId === r.id}
                      >
                        {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 전체 예약 테이블 (날짜 무관) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">모든 예약 목록</h2>
        </div>
        <AllReservationsTable />
      </div>
    </div>
  );
}

function AllReservationsTable() {
  const [all, setAll] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('reservations')
      .select('*, customers(*), schools(*)')
      .order('reservation_date', { ascending: false })
      .order('reservation_time')
      .limit(50)
      .then(({ data }) => { setAll((data ?? []) as Reservation[]); setLoading(false); });
  }, []);

  if (loading) return <div className="text-center py-4 text-gray-400 text-sm">로딩 중...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {['예약번호', '이름', '연락처', '학교', '날짜', '시간', '상태'].map(h => (
              <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {all.map(r => (
            <tr key={r.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.reservation_number}</td>
              <td className="px-4 py-3 font-semibold">{r.customers?.name}</td>
              <td className="px-4 py-3 text-gray-600">{r.customers?.phone}</td>
              <td className="px-4 py-3 text-gray-600">{r.schools?.name ?? '-'}</td>
              <td className="px-4 py-3">{r.reservation_date}</td>
              <td className="px-4 py-3 font-bold text-blue-600">{r.reservation_time.slice(0, 5)}</td>
              <td className="px-4 py-3"><span className={`status-chip ${getReservationStatusColor(r.status)}`}>{r.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
