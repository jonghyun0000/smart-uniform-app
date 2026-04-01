'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCustomer } from '@/app/customer/CustomerContext';
import { Button, Input, Select, StepIndicator, TopBar } from '@/components/ui';
import type { School, OrderType } from '@/types/database';
import { SCHOOLS_DATA } from '@/lib/localData';
import toast from 'react-hot-toast';
import { ChevronRight } from 'lucide-react';

const ORDER_TYPES: { value: OrderType; label: string; desc: string; emoji: string }[] = [
  { value: '교복구매', label: '교복 구매', desc: '동복·하복 교복 구매', emoji: '👔' },
  { value: '체육복구매', label: '체육복 구매', desc: '체육복 상·하의 구매', emoji: '🏃' },
  { value: '명찰구매', label: '명찰 구매', desc: '천명찰·부착명찰', emoji: '🏷️' },
  { value: '수선', label: '수선 접수', desc: '교복 수선 신청', emoji: '✂️' },
  { value: '환불교환문의', label: '환불/교환 문의', desc: '환불·교환 신청', emoji: '🔄' },
];

const STEPS = ['학교선택', '기본정보', '주문유형'];

export default function StartPage() {
  const router = useRouter();
  const { state, dispatch } = useCustomer();
  const [step, setStep] = useState(0);
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 학교 목록 로드
  useEffect(() => {
    async function loadSchools() {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (data && !error) {
        setSchools(data as School[]);
      } else {
        // 폴백: 로컬 데이터
        setSchools(SCHOOLS_DATA.map((s, i) => ({
          ...s,
          id: `local-${i}`,
          region: '춘천',
          is_active: true,
          sort_order: i,
          created_at: '',
          updated_at: '',
        } as School)));
      }
    }
    loadSchools();
  }, []);

  // 학교 그룹핑
  const grouped: Record<string, School[]> = {};
  schools.forEach(s => {
    const key = s.school_type;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(s);
  });

  // Step 0: 학교 선택
  const handleSchoolSelect = (school: School) => {
    dispatch({ type: 'SET_SCHOOL', payload: { school_id: school.id, school_name: school.name } });
    setTimeout(() => setStep(1), 150); // 자연스럽게 다음 단계
  };

  // Step 1 유효성 검사
  const validateInfo = () => {
    const e: Record<string, string> = {};
    if (!state.customer.name.trim()) e.name = '이름을 입력해주세요';
    if (!state.customer.phone.trim()) e.phone = '연락처를 입력해주세요';
    if (state.customer.phone.replace(/\D/g, '').length < 10) e.phone = '올바른 연락처를 입력해주세요';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleInfoNext = () => {
    if (validateInfo()) setStep(2);
  };

  // Step 2: 주문 유형 선택 → 해당 페이지로 이동
  const handleOrderTypeSelect = (type: OrderType) => {
    dispatch({ type: 'SET_ORDER_TYPE', payload: type });
    setLoading(true);
    const routes: Record<OrderType, string> = {
      '교복구매': '/customer/order/products',
      '체육복구매': '/customer/order/pe',
      '명찰구매': '/customer/order/nameplate',
      '수선': '/customer/repair',
      '환불교환문의': '/customer/exchange',
    };
    router.push(routes[type]);
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar
        title={['학교 선택', '기본 정보 입력', '주문 유형 선택'][step]}
        onBack={step > 0 ? () => setStep(step - 1) : () => router.push('/customer')}
      />
      <StepIndicator steps={STEPS} current={step} />

      {/* STEP 0 - 학교 선택 */}
      {step === 0 && (
        <div className="px-4 py-4 animate-fade-in">
          <p className="text-sm text-gray-500 mb-4">학교를 선택해주세요</p>
          {Object.entries(grouped).map(([type, list]) => (
            <div key={type} className="mb-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">{type}</p>
              <div className="grid grid-cols-2 gap-2">
                {list.map(school => (
                  <button
                    key={school.id}
                    onClick={() => handleSchoolSelect(school)}
                    className={`btn-press rounded-2xl border-2 p-4 text-left transition-all active:scale-95 ${
                      state.school_id === school.id
                        ? 'border-rose-500 bg-rose-50'
                        : 'border-gray-200 bg-white hover:border-rose-300'
                    }`}
                  >
                    <div className="font-semibold text-gray-900 text-sm">{school.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {school.gender_type === '남' ? '👨' : school.gender_type === '여' ? '👩' : '👫'}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* STEP 1 - 기본 정보 */}
      {step === 1 && (
        <div className="px-4 py-4 animate-fade-in">
          <p className="text-sm text-gray-500 mb-4">
            선택한 학교: <strong className="text-gray-900">{state.school_name}</strong>
          </p>
          <div className="space-y-4">
            <Input
              label="이름 *"
              placeholder="홍길동"
              value={state.customer.name}
              onChange={e => dispatch({ type: 'SET_CUSTOMER', payload: { name: e.target.value } })}
              error={errors.name}
              autoComplete="name"
            />
            <Input
              label="연락처 (학부모) *"
              placeholder="010-0000-0000"
              type="tel"
              inputMode="tel"
              value={state.customer.phone}
              onChange={e => dispatch({ type: 'SET_CUSTOMER', payload: { phone: e.target.value } })}
              error={errors.phone}
              autoComplete="tel"
            />
            <div className="grid grid-cols-3 gap-3">
              <Select
                label="학년"
                value={state.customer.grade}
                onChange={e => dispatch({ type: 'SET_CUSTOMER', payload: { grade: e.target.value } })}
                placeholder="학년"
                options={['1', '2', '3'].map(v => ({ value: v, label: `${v}학년` }))}
              />
              <Select
                label="반"
                value={state.customer.class_num}
                onChange={e => dispatch({ type: 'SET_CUSTOMER', payload: { class_num: e.target.value } })}
                placeholder="반"
                options={Array.from({ length: 15 }, (_, i) => ({ value: String(i + 1), label: `${i + 1}반` }))}
              />
              <Input
                label="번호"
                placeholder="번호"
                type="number"
                inputMode="numeric"
                value={state.customer.student_num}
                onChange={e => dispatch({ type: 'SET_CUSTOMER', payload: { student_num: e.target.value } })}
              />
            </div>
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-2">성별</label>
              <div className="grid grid-cols-2 gap-3">
                {(['남', '여'] as const).map(g => (
                  <button
                    key={g}
                    onClick={() => dispatch({ type: 'SET_CUSTOMER', payload: { gender: g } })}
                    className={`btn-press h-14 rounded-2xl border-2 font-semibold text-lg transition-all ${
                      state.customer.gender === g
                        ? 'border-rose-500 bg-rose-50 text-rose-700'
                        : 'border-gray-200 text-gray-700 hover:border-rose-300'
                    }`}
                  >
                    {g === '남' ? '👨 남자' : '👩 여자'}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="mt-6">
            <Button fullWidth size="xl" onClick={handleInfoNext}>
              다음 단계 <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2 - 주문 유형 */}
      {step === 2 && (
        <div className="px-4 py-4 animate-fade-in">
          <p className="text-sm text-gray-500 mb-4">무엇을 도와드릴까요?</p>
          <div className="space-y-3">
            {ORDER_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => handleOrderTypeSelect(type.value)}
                disabled={loading}
                className="btn-press w-full card p-5 flex items-center gap-4 text-left active:scale-[0.98] transition-all hover:border-rose-200 border-2 border-transparent"
              >
                <span className="text-3xl">{type.emoji}</span>
                <div className="flex-1">
                  <div className="font-bold text-gray-900 text-base">{type.label}</div>
                  <div className="text-sm text-gray-500 mt-0.5">{type.desc}</div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
