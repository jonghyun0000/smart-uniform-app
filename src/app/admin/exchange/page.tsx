'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatDate } from '@/lib/utils';
import type { ExchangeRefundRequest, ExchangeStatus } from '@/types/database';
import toast from 'react-hot-toast';
import { RefreshCw, RefreshCcw, Search } from 'lucide-react';
import { Modal } from '@/components/ui';

const STATUSES: ExchangeStatus[] = ['접수', '검토중', '승인', '반려', '완료'];
const STATUS_COLORS: Record<ExchangeStatus, string> = {
  접수: 'bg-gray-100 text-gray-700',
  검토중: 'bg-yellow-100 text-yellow-700',
  승인: 'bg-green-100 text-green-700',
  반려: 'bg-red-100 text-red-700',
  완료: 'bg-blue-100 text-blue-700',
};

export default function AdminExchangePage() {
  const [requests, setRequests] = useState<ExchangeRefundRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ExchangeStatus | 'all'>('all');
  const [selected, setSelected] = useState<ExchangeRefundRequest | null>(null);
  const [adminMemo, setAdminMemo] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    let q = supabase.from('exchange_refund_requests')
      .select('*, customers(*), orders(order_number, total_amount)')
      .order('created_at', { ascending: false });
    if (filterStatus !== 'all') q = q.eq('status', filterStatus);
    const { data } = await q;
    setRequests((data ?? []) as ExchangeRefundRequest[]);
    setLoading(false);
  }, [filterStatus]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: ExchangeStatus) => {
    setUpdatingId(id);
    const updates: any = { status };
    if (adminMemo.trim()) updates.admin_memo = adminMemo;
    const { error } = await supabase.from('exchange_refund_requests').update(updates).eq('id', id);
    if (error) toast.error('변경 실패');
    else { toast.success(`${status}으로 변경`); load(); setSelected(s => s ? { ...s, status, admin_memo: adminMemo || s.admin_memo } : null); }
    setUpdatingId(null);
  };

  const filtered = requests.filter(r => {
    if (!search) return true;
    const s = search.toLowerCase();
    return r.request_number.toLowerCase().includes(s) || r.customers?.name?.includes(s) || r.customers?.phone?.includes(s);
  });

  useEffect(() => {
    if (selected) setAdminMemo(selected.admin_memo ?? '');
  }, [selected]);

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">환불/교환 관리</h1>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 상태 필터 */}
      <div className="flex gap-2 flex-wrap">
        {(['all', ...STATUSES] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
              filterStatus === s ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-gray-600 border-gray-200'
            }`}>
            {s === 'all' ? '전체' : s}
          </button>
        ))}
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full h-11 pl-10 pr-4 rounded-xl border-2 border-gray-200 text-sm focus:border-orange-400 outline-none"
          placeholder="이름, 연락처, 접수번호" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* 목록 */}
      {loading ? (
        <div className="text-center py-8 text-gray-400">로딩 중...</div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-gray-100">
          <RefreshCcw className="w-12 h-12 mx-auto text-gray-200 mb-3" />
          <p className="text-gray-400">접수된 문의가 없어요</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['접수번호', '고객', '유형', '관련주문', '상태', '접수일', '상세'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold text-gray-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map(r => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{r.request_number}</td>
                  <td className="px-4 py-3">
                    <p className="font-semibold">{r.customers?.name}</p>
                    <p className="text-xs text-gray-400">{r.customers?.phone}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`status-chip ${r.request_type === '환불' ? 'bg-red-100 text-red-700' : r.request_type === '교환' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                      {r.request_type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">{(r.orders as any)?.order_number ?? '-'}</td>
                  <td className="px-4 py-3"><span className={`status-chip ${STATUS_COLORS[r.status]}`}>{r.status}</span></td>
                  <td className="px-4 py-3 text-xs text-gray-400">{formatDate(r.created_at)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => setSelected(r)}
                      className="text-xs bg-gray-100 text-gray-700 hover:bg-orange-100 hover:text-orange-700 px-3 py-1.5 rounded-lg font-semibold transition-colors">
                      상세
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 상세 모달 */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="환불/교환 상세">
        {selected && (
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-2xl p-4 text-sm space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">접수번호</span><span className="font-mono font-bold">{selected.request_number}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">고객</span><span className="font-bold">{selected.customers?.name} {selected.customers?.phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">유형</span><span className="font-bold">{selected.request_type}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">상태</span><span className={`status-chip ${STATUS_COLORS[selected.status]}`}>{selected.status}</span></div>
            </div>

            <div className="bg-orange-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-orange-700 mb-1">문의 내용</p>
              <p className="text-sm text-orange-900">{selected.reason}</p>
            </div>

            <div>
              <p className="text-sm font-bold text-gray-700 mb-2">관리자 메모</p>
              <textarea
                className="w-full border-2 border-gray-200 rounded-xl p-3 text-sm resize-none focus:border-orange-400 outline-none"
                rows={3}
                placeholder="처리 내용, 사유 등"
                value={adminMemo}
                onChange={e => setAdminMemo(e.target.value)}
              />
            </div>

            <div>
              <p className="text-xs font-bold text-gray-500 mb-2">상태 변경</p>
              <div className="grid grid-cols-3 gap-2">
                {STATUSES.map(s => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)}
                    disabled={updatingId === selected.id}
                    className={`h-10 rounded-xl border-2 text-xs font-semibold transition-all ${
                      selected.status === s ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-700 hover:border-orange-300'
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
