'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate, getRepairStatusColor } from '@/lib/utils';
import type { RepairRequest, RepairStatus } from '@/types/database';
import toast from 'react-hot-toast';
import { RefreshCw, Scissors, Search } from 'lucide-react';
import { Modal } from '@/components/ui';

const STATUSES: RepairStatus[] = ['접수됨', '진행중', '완료', '수령완료'];

export default function AdminRepairsPage() {
  const [repairs, setRepairs] = useState<RepairRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<RepairStatus | 'all'>('all');
  const [selected, setSelected] = useState<RepairRequest | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    let q = supabase.from('repair_requests').select('*, customers(*)').order('created_at', { ascending: false });
    if (filterStatus !== 'all') q = q.eq('status', filterStatus);
    const { data } = await q;
    setRepairs((data ?? []) as RepairRequest[]);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => {
    load();
    const ch = supabase.channel('admin_repairs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'repair_requests' }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const updateStatus = async (id: string, status: RepairStatus) => {
    setUpdatingId(id);
    const { error } = await supabase.from('repair_requests').update({ status }).eq('id', id);
    if (error) toast.error('변경 실패');
    else { toast.success(`${status}으로 변경`); load(); if (selected?.id === id) setSelected(s => s ? { ...s, status } : null); }
    setUpdatingId(null);
  };

  const filtered = repairs.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.repair_number.toLowerCase().includes(s) || r.customers?.name?.includes(s) || r.customers?.phone?.includes(s);
  });

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">수선 관리</h1>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-2 flex-wrap">
        {(['all', ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              filterStatus === s ? 'bg-purple-600 text-white border-purple-600' : 'bg-white text-gray-600 border-gray-200'
            }`}
          >
            {s === 'all' ? '전체' : s}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full h-11 pl-10 pr-4 rounded-xl border-2 border-gray-200 text-sm focus:border-purple-400 outline-none"
          placeholder="이름, 연락처, 수선번호" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* 수선 카드 목록 */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <Scissors className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">수선 접수 내역이 없어요</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map(r => (
            <div key={r.id} onClick={() => setSelected(r)}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-black text-gray-900">{r.customers?.name}</span>
                    <span className="text-sm text-gray-500">{r.customers?.phone}</span>
                    <span className="text-xs text-gray-400 font-mono">{r.repair_number}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {(r.repair_items ?? []).map((item: any, i: number) => (
                      <span key={i} className="bg-purple-50 text-purple-700 text-xs px-2 py-0.5 rounded-full">
                        {item.item} {item.quantity > 1 ? `×${item.quantity}` : ''}
                      </span>
                    ))}
                  </div>
                  {r.memo && <p className="text-xs text-gray-500 mt-2 bg-gray-50 rounded-lg px-3 py-1.5">📝 {r.memo}</p>}
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className={`status-chip ${getRepairStatusColor(r.status)}`}>{r.status}</span>
                  <span className="text-xs text-gray-400">{formatDate(r.created_at)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 상세/상태변경 모달 */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="수선 상세">
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">수선번호</span><span className="font-bold font-mono">{selected.repair_number}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">고객명</span><span className="font-bold">{selected.customers?.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">연락처</span><span>{selected.customers?.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">접수일</span><span>{formatDate(selected.created_at)}</span></div>
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">수선 항목</p>
              <div className="space-y-1">
                {(selected.repair_items ?? []).map((item: any, i: number) => (
                  <div key={i} className="flex justify-between bg-purple-50 rounded-xl px-3 py-2 text-sm">
                    <span className="text-purple-800">{item.item}</span>
                    <span className="font-bold text-purple-700">{item.quantity}개</span>
                  </div>
                ))}
              </div>
            </div>

            {selected.memo && (
              <div className="bg-amber-50 rounded-xl p-3 text-sm text-amber-700">📝 {selected.memo}</div>
            )}

            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">상태 변경</p>
              <div className="grid grid-cols-2 gap-2">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)}
                    disabled={updatingId === selected.id}
                    className={`h-11 rounded-xl border-2 text-sm font-semibold transition-all ${
                      selected.status === s
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-700 hover:border-purple-300'
                    }`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
