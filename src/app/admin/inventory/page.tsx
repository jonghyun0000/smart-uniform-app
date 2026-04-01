'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Search, RefreshCw, AlertTriangle } from 'lucide-react';

interface InventoryRow {
  product_id: string;
  product_name: string;
  school_name: string | null;
  category: string;
  variant_id: string;
  size: string;
  price: number;
  quantity: number;
  low_stock_threshold: number;
  inventory_id: string;
}

type InventoryUpdatePayload = {
  quantity: number;
};

type InventoryInsertPayload = {
  variant_id: string;
  quantity: number;
  reserved_quantity: number;
};

export default function AdminInventoryPage() {
  const [rows, setRows] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState(0);
  const [saving, setSaving] = useState(false);

  const loadInventory = useCallback(async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        id, size, price, product_id,
        products(id, name, category, schools(name)),
        inventory(id, quantity, low_stock_threshold)
      `)
      .eq('is_active', true)
      .order('product_id');

    if (error) {
      toast.error('재고 로딩 실패');
      setRows([]);
      setLoading(false);
      return;
    }

    const mapped: InventoryRow[] = ((data ?? []) as any[]).map((v) => {
      const product = Array.isArray(v.products) ? v.products[0] : v.products;
      const school = product?.schools
        ? Array.isArray(product.schools)
          ? product.schools[0]
          : product.schools
        : null;
      const inventory = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;

      return {
        product_id: String(v.product_id ?? ''),
        product_name: String(product?.name ?? '알 수 없음'),
        school_name: school?.name ?? null,
        category: String(product?.category ?? ''),
        variant_id: String(v.id ?? ''),
        size: String(v.size ?? ''),
        price: Number(v.price ?? 0),
        quantity: Number(inventory?.quantity ?? 0),
        low_stock_threshold: Number(inventory?.low_stock_threshold ?? 5),
        inventory_id: String(inventory?.id ?? ''),
      };
    });

    setRows(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadInventory();

    const channel = supabase
      .channel('admin_inventory')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'inventory' },
        () => {
          loadInventory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadInventory]);

  const startEdit = (row: InventoryRow) => {
    setEditingId(row.variant_id);
    setEditQty(row.quantity);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditQty(0);
  };

  const saveQty = async (row: InventoryRow) => {
    if (!Number.isFinite(editQty) || editQty < 0 || !Number.isInteger(editQty)) {
      toast.error('재고 수량은 0 이상의 정수만 입력 가능합니다.');
      return;
    }

    setSaving(true);

    try {
      if (row.inventory_id) {
        const payload: InventoryUpdatePayload = {
          quantity: editQty,
        };

        const { error } = await supabase
          .from('inventory')
          .update(payload as never)
          .eq('id', row.inventory_id);

        if (error) {
          toast.error('저장 실패');
          return;
        }

        toast.success('재고 수정됨');
      } else {
        const payload: InventoryInsertPayload = {
          variant_id: row.variant_id,
          quantity: editQty,
          reserved_quantity: 0,
        };

        const { error } = await supabase
          .from('inventory')
          .insert(payload as never);

        if (error) {
          toast.error('저장 실패');
          return;
        }

        toast.success('재고 등록됨');
      }

      await loadInventory();
      cancelEdit();
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return rows;

    const s = search.toLowerCase().trim();

    return rows.filter((r) => {
      return (
        r.product_name.toLowerCase().includes(s) ||
        (r.school_name ?? '').toLowerCase().includes(s) ||
        r.category.toLowerCase().includes(s) ||
        r.size.toLowerCase().includes(s)
      );
    });
  }, [rows, search]);

  const lowStock = useMemo(() => {
    return filtered.filter((r) => r.quantity <= r.low_stock_threshold);
  }, [filtered]);

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">재고 관리</h1>
        <button
          type="button"
          onClick={loadInventory}
          className="p-2 rounded-xl hover:bg-gray-100"
        >
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {lowStock.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-orange-700 text-sm">
              재고 부족 알림 ({lowStock.length}개 항목)
            </p>
            <div className="flex flex-wrap gap-1 mt-1">
              {lowStock.slice(0, 5).map((r) => (
                <span
                  key={r.variant_id}
                  className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded-full"
                >
                  {r.product_name} {r.size} ({r.quantity}개)
                </span>
              ))}
              {lowStock.length > 5 && (
                <span className="text-xs text-orange-500">
                  +{lowStock.length - 5}개 더
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full h-11 pl-10 pr-4 rounded-xl border-2 border-gray-200 text-sm focus:border-rose-400 outline-none"
          placeholder="상품명, 학교, 카테고리, 사이즈"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['학교', '상품명', '카테고리', '사이즈', '가격', '재고', '수정'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-bold text-gray-500 whitespace-nowrap"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    로딩 중...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-gray-400">
                    항목 없음
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr
                    key={row.variant_id}
                    className={
                      row.quantity === 0
                        ? 'bg-red-50'
                        : row.quantity <= row.low_stock_threshold
                        ? 'bg-orange-50'
                        : ''
                    }
                  >
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {row.school_name ?? '공통'}
                    </td>
                    <td className="px-4 py-3 font-semibold">{row.product_name}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{row.category}</td>
                    <td className="px-4 py-3 font-mono">{row.size}</td>
                    <td className="px-4 py-3 font-bold text-gray-700">
                      {formatPrice(row.price)}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === row.variant_id ? (
                        <input
                          type="number"
                          className="w-20 h-8 px-2 rounded-lg border-2 border-rose-400 text-sm font-bold text-center outline-none"
                          value={editQty}
                          min={0}
                          onChange={(e) => setEditQty(parseInt(e.target.value, 10) || 0)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              void saveQty(row);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <span
                          className={`font-bold ${
                            row.quantity === 0
                              ? 'text-red-600'
                              : row.quantity <= row.low_stock_threshold
                              ? 'text-orange-600'
                              : 'text-gray-900'
                          }`}
                        >
                          {row.quantity}개
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {editingId === row.variant_id ? (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => void saveQty(row)}
                            disabled={saving}
                            className="h-8 px-3 bg-emerald-500 text-white rounded-lg text-xs font-bold disabled:opacity-60"
                          >
                            저장
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={saving}
                            className="h-8 px-3 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold disabled:opacity-60"
                          >
                            취소
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="h-8 px-3 bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold hover:bg-rose-100 hover:text-rose-700 transition-colors"
                        >
                          수정
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
          총 {filtered.length}개 항목 · 재고부족 {lowStock.length}개
        </div>
      </div>
    </div>
  );
}
