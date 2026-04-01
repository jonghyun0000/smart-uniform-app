'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { formatPrice } from '@/lib/utils';
import type { Product, ProductVariant, School } from '@/types/database';
import toast from 'react-hot-toast';
import { Plus, RefreshCw, Search, Edit2, Save, X, ChevronDown, ChevronUp } from 'lucide-react';
import { SIZE_OPTIONS } from '@/lib/utils';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingVariant, setEditingVariant] = useState<{ id: string; price: number } | null>(null);
  const [editingProduct, setEditingProduct] = useState<{ id: string; base_price: number; name: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [prodRes, schoolRes] = await Promise.all([
      supabase.from('products').select('*, schools(*), product_variants(*, inventory(*))').order('sort_order'),
      supabase.from('schools').select('*').eq('is_active', true).order('sort_order'),
    ]);
    setProducts((prodRes.data ?? []) as Product[]);
    setSchools((schoolRes.data ?? []) as School[]);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveVariantPrice = async (variantId: string, price: number) => {
    setSaving(true);
    const { error } = await supabase.from('product_variants').update({ price }).eq('id', variantId);
    if (error) toast.error('저장 실패');
    else { toast.success('가격 수정됨'); load(); }
    setEditingVariant(null);
    setSaving(false);
  };

  const saveProductPrice = async (productId: string, base_price: number, name: string) => {
    setSaving(true);
    const { error } = await supabase.from('products').update({ base_price, name }).eq('id', productId);
    if (error) toast.error('저장 실패');
    else { toast.success('상품 정보 수정됨'); load(); }
    setEditingProduct(null);
    setSaving(false);
  };

  const toggleActive = async (productId: string, current: boolean) => {
    const { error } = await supabase.from('products').update({ is_active: !current }).eq('id', productId);
    if (!error) { toast.success(!current ? '활성화됨' : '비활성화됨'); load(); }
  };

  const addVariant = async (productId: string, size: string, price: number) => {
    const { error } = await supabase.from('product_variants').insert({ product_id: productId, size, price, is_active: true });
    if (error) toast.error('추가 실패: ' + error.message);
    else {
      toast.success('사이즈 추가됨');
      // 재고 0으로 초기화
      const { data: v } = await supabase.from('product_variants').select('id').eq('product_id', productId).eq('size', size).single();
      if (v) await supabase.from('inventory').insert({ variant_id: v.id, quantity: 0, reserved_quantity: 0 });
      load();
    }
  };

  const filtered = products.filter(p => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.name.toLowerCase().includes(s) || (p as any).schools?.name?.includes(s) || p.category.includes(s);
  });

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gray-900">상품 관리</h1>
        <button onClick={load} className="p-2 rounded-xl hover:bg-gray-100">
          <RefreshCw className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* 검색 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input className="w-full h-11 pl-10 pr-4 rounded-xl border-2 border-gray-200 text-sm focus:border-rose-400 outline-none"
          placeholder="상품명, 학교, 카테고리" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-400">로딩 중...</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(product => (
            <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* 상품 헤더 */}
              <div className="p-4 flex items-center gap-3">
                <div className="flex-1">
                  {editingProduct?.id === product.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        className="border-2 border-rose-400 rounded-lg px-3 py-1.5 text-sm font-bold flex-1 outline-none"
                        value={editingProduct.name}
                        onChange={e => setEditingProduct(p => p ? { ...p, name: e.target.value } : null)}
                      />
                      <input
                        type="number"
                        className="border-2 border-rose-400 rounded-lg px-3 py-1.5 text-sm font-bold w-28 outline-none"
                        value={editingProduct.base_price}
                        onChange={e => setEditingProduct(p => p ? { ...p, base_price: parseInt(e.target.value) || 0 } : null)}
                      />
                      <button onClick={() => saveProductPrice(product.id, editingProduct.base_price, editingProduct.name)}
                        disabled={saving} className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Save className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditingProduct(null)} className="w-9 h-9 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">{product.name}</span>
                      <span className="text-xs text-gray-400">{(product as any).schools?.name ?? '공통'}</span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{product.category}</span>
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full">{product.uniform_type}</span>
                    </div>
                  )}
                  {editingProduct?.id !== product.id && (
                    <p className="text-rose-600 font-bold text-sm mt-0.5">{formatPrice(product.base_price)}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleActive(product.id, product.is_active)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${product.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-400'}`}>
                    {product.is_active ? '활성' : '비활성'}
                  </button>
                  <button onClick={() => setEditingProduct({ id: product.id, base_price: product.base_price, name: product.name })}
                    className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center hover:bg-rose-100 hover:text-rose-600 transition-colors">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                    className="w-9 h-9 rounded-lg bg-gray-100 text-gray-600 flex items-center justify-center">
                    {expandedId === product.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* 사이즈 목록 (확장) */}
              {expandedId === product.id && (
                <div className="border-t border-gray-100 p-4 space-y-2">
                  <p className="text-xs font-bold text-gray-500 mb-2">사이즈별 가격 · 재고</p>
                  <div className="space-y-1.5">
                    {(product.product_variants ?? []).map(v => (
                      <div key={v.id} className="flex items-center gap-3 bg-gray-50 rounded-xl px-3 py-2">
                        <span className="font-mono font-bold w-12 text-sm">{v.size}</span>
                        {editingVariant?.id === v.id ? (
                          <>
                            <input
                              type="number"
                              className="border-2 border-rose-400 rounded-lg px-2 py-1 text-sm w-24 outline-none"
                              value={editingVariant.price}
                              onChange={e => setEditingVariant(ev => ev ? { ...ev, price: parseInt(e.target.value) || 0 } : null)}
                            />
                            <button onClick={() => saveVariantPrice(v.id, editingVariant.price)} disabled={saving}
                              className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-xs font-bold">저장</button>
                            <button onClick={() => setEditingVariant(null)}
                              className="px-3 py-1 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold">취소</button>
                          </>
                        ) : (
                          <>
                            <span className="text-sm font-bold flex-1">{formatPrice(v.price)}</span>
                            <span className={`text-xs font-bold ${(v.inventory?.quantity ?? 0) === 0 ? 'text-red-500' : (v.inventory?.quantity ?? 0) <= 5 ? 'text-orange-500' : 'text-green-600'}`}>
                              재고 {v.inventory?.quantity ?? 0}개
                            </span>
                            <button onClick={() => setEditingVariant({ id: v.id, price: v.price })}
                              className="w-7 h-7 rounded-lg bg-white text-gray-400 flex items-center justify-center border border-gray-200 hover:border-rose-400 hover:text-rose-500 transition-colors">
                              <Edit2 className="w-3 h-3" />
                            </button>
                          </>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* 사이즈 추가 */}
                  <AddVariantRow
                    productId={product.id}
                    category={product.category}
                    basePrice={product.base_price}
                    existingSizes={(product.product_variants ?? []).map(v => v.size)}
                    onAdd={addVariant}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function AddVariantRow({ productId, category, basePrice, existingSizes, onAdd }: {
  productId: string; category: string; basePrice: number; existingSizes: string[]; onAdd: (id: string, size: string, price: number) => void;
}) {
  const [size, setSize] = useState('');
  const [price, setPrice] = useState(basePrice);
  const [open, setOpen] = useState(false);

  const sizes = SIZE_OPTIONS[category] ?? ['FREE'];
  const available = sizes.filter(s => !existingSizes.includes(s));

  if (!open) return (
    <button onClick={() => setOpen(true)} className="flex items-center gap-1 text-xs text-rose-600 font-semibold mt-2">
      <Plus className="w-3 h-3" /> 사이즈 추가
    </button>
  );

  return (
    <div className="flex gap-2 items-center mt-2 bg-rose-50 rounded-xl p-3">
      <select className="border-2 border-rose-300 rounded-lg px-2 py-1.5 text-sm flex-1 outline-none bg-white"
        value={size} onChange={e => setSize(e.target.value)}>
        <option value="">사이즈</option>
        {available.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <input type="number" className="border-2 border-rose-300 rounded-lg px-2 py-1.5 text-sm w-24 outline-none"
        value={price} onChange={e => setPrice(parseInt(e.target.value) || 0)} placeholder="가격" />
      <button onClick={() => { if (size) { onAdd(productId, size, price); setOpen(false); setSize(''); } else toast.error('사이즈 선택'); }}
        className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-bold">추가</button>
      <button onClick={() => setOpen(false)} className="px-3 py-1.5 bg-gray-200 text-gray-600 rounded-lg text-xs font-bold">취소</button>
    </div>
  );
}
