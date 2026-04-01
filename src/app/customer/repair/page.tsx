'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCustomer } from '@/app/customer/CustomerContext';
import { Button, Input, TopBar } from '@/components/ui';
import { REPAIR_ITEMS_MASTER } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { generateRepairNumber } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Scissors, ChevronRight, Plus, Minus } from 'lucide-react';

interface RepairSelection {
  item: string;
  quantity: number;
}

export default function RepairPage() {
  const router = useRouter();
  const { state, dispatch } = useCustomer();
  const [name, setName] = useState(state.customer.name || '');
  const [phone, setPhone] = useState(state.customer.phone || '');
  const [schoolName, setSchoolName] = useState(state.school_name || '');
  const [selected, setSelected] = useState<RepairSelection[]>([]);
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const toggleItem = (item: string) => {
    setSelected(prev => {
      const exists = prev.find(s => s.item === item);
      if (exists) return prev.filter(s => s.item !== item);
      return [...prev, { item, quantity: 1 }];
    });
  };

  const changeQty = (item: string, delta: number) => {
    setSelected(prev => prev.map(s =>
      s.item === item ? { ...s, quantity: Math.max(1, s.quantity + delta) } : s
    ));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '이름을 입력해주세요';
    if (!phone.trim()) e.phone = '연락처를 입력해주세요';
    if (selected.length === 0) e.items = '수선 항목을 하나 이상 선택해주세요';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // 고객 처리
      let customerId = '';
      const { data: existing } = await supabase.from('customers').select('id').eq('phone', phone).eq('name', name).maybeSingle();
      if (existing) {
        customerId = existing.id;
      } else {
        const { data: newC, error } = await supabase.from('customers').insert({
          name, phone, school_id: state.school_id || null,
        }).select('id').single();
        if (error || !newC) throw new Error('고객 등록 실패');
        customerId = newC.id;
      }

      const repairNumber = generateRepairNumber();
      const { error } = await supabase.from('repair_requests').insert({
        repair_number: repairNumber,
        customer_id: customerId,
        repair_items: selected,
        memo: memo || null,
        status: '접수됨',
      });
      if (error) throw new Error(error.message);

      toast.success('수선 접수가 완료되었어요!');
      router.push(`/customer/repair/complete?repairNumber=${repairNumber}`);
    } catch (err: any) {
      toast.error(err.message || '접수 중 오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar title="수선 접수" onBack={() => router.push('/customer')} />

      <div className="px-4 py-4 space-y-4">
        {/* 기본 정보 */}
        <div className="space-y-3">
          <Input label="이름 *" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} error={errors.name} />
          <Input label="연락처 *" placeholder="010-0000-0000" type="tel" value={phone} onChange={e => setPhone(e.target.value)} error={errors.phone} />
          <Input label="학교 (선택)" placeholder="춘천중학교" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
        </div>

        {/* 수선 항목 선택 */}
        <div>
          <p className="text-sm font-bold text-gray-700 mb-2">수선 항목 선택 *</p>
          {errors.items && <p className="text-xs text-red-500 mb-2">{errors.items}</p>}
          <div className="space-y-2">
            {REPAIR_ITEMS_MASTER.map(item => {
              const isSelected = selected.some(s => s.item === item);
              const sel = selected.find(s => s.item === item);
              return (
                <div key={item} className={`rounded-2xl border-2 transition-all ${isSelected ? 'border-purple-400 bg-purple-50' : 'border-gray-200 bg-white'}`}>
                  <button onClick={() => toggleItem(item)} className="w-full flex items-center gap-3 p-4 text-left">
                    <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${isSelected ? 'border-purple-500 bg-purple-500' : 'border-gray-300'}`}>
                      {isSelected && <span className="text-white text-xs font-bold">✓</span>}
                    </div>
                    <span className={`flex-1 font-semibold text-sm ${isSelected ? 'text-purple-900' : 'text-gray-700'}`}>{item}</span>
                    <Scissors className={`w-4 h-4 ${isSelected ? 'text-purple-400' : 'text-gray-300'}`} />
                  </button>
                  {isSelected && (
                    <div className="flex items-center justify-between px-4 pb-3 border-t border-purple-100">
                      <span className="text-xs text-purple-600 font-medium">수량</span>
                      <div className="flex items-center gap-3">
                        <button onClick={() => changeQty(item, -1)} className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Minus className="w-3 h-3 text-purple-600" />
                        </button>
                        <span className="font-bold text-purple-900 w-5 text-center">{sel?.quantity}</span>
                        <button onClick={() => changeQty(item, 1)} className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                          <Plus className="w-3 h-3 text-purple-600" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 메모 */}
        <div>
          <p className="text-sm font-bold text-gray-700 mb-2">요청 메모 (선택)</p>
          <textarea
            className="w-full border-2 border-gray-200 rounded-2xl p-4 text-sm resize-none focus:border-purple-400 outline-none"
            rows={4}
            placeholder="수선 요청사항을 상세히 입력해주세요&#10;예: 바지 기장 5cm 줄여주세요"
            value={memo}
            onChange={e => setMemo(e.target.value)}
          />
        </div>

        {/* 선택 요약 */}
        {selected.length > 0 && (
          <div className="bg-purple-50 rounded-2xl p-4">
            <p className="text-xs font-bold text-purple-700 mb-2">선택한 수선 항목 ({selected.length}개)</p>
            {selected.map(s => (
              <div key={s.item} className="flex justify-between text-sm text-purple-800">
                <span>{s.item}</span>
                <span>{s.quantity}개</span>
              </div>
            ))}
          </div>
        )}

        <Button fullWidth size="xl" onClick={handleSubmit} loading={loading}>
          수선 접수하기 <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
