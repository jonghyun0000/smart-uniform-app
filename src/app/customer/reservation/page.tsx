'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useCustomer } from '@/app/customer/CustomerContext';
import { Button, Input, TopBar } from '@/components/ui';
import { generateReservationNumber, generateTimeSlots } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Calendar, Clock, ChevronRight, Users } from 'lucide-react';
import type { TimeSlot } from '@/types/database';
import { addDays, format, isWeekend } from 'date-fns';
import { ko } from 'date-fns/locale';

const MAX_PER_SLOT = 5;

// 예약 가능한 날짜 목록 생성 (오늘부터 30일, 주말 제외)
function getAvailableDates(): Date[] {
  const dates: Date[] = [];
  let d = new Date();
  d.setHours(0, 0, 0, 0);
  while (dates.length < 30) {
    if (!isWeekend(d)) dates.push(new Date(d));
    d = addDays(d, 1);
  }
  return dates;
}

export default function ReservationPage() {
  const router = useRouter();
  const { state } = useCustomer();
  const [name, setName] = useState(state.customer.name || '');
  const [phone, setPhone] = useState(state.customer.phone || '');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0); // 0: 날짜, 1: 시간, 2: 확인

  const availableDates = getAvailableDates();

  // 날짜 선택 시 슬롯 로드
  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date);
    setSelectedSlot(null);
    setSlotsLoading(true);
    const dateStr = format(date, 'yyyy-MM-dd');

    // 해당 날짜 예약 현황 조회
    const { data: reservations } = await supabase
      .from('reservations')
      .select('reservation_time')
      .eq('reservation_date', dateStr)
      .neq('status', '취소');

    const counts: Record<string, number> = {};
    (reservations ?? []).forEach(r => {
      const t = r.reservation_time.slice(0, 5);
      counts[t] = (counts[t] ?? 0) + 1;
    });

    const allSlots = generateTimeSlots();
    setSlots(allSlots.map(time => ({
      time,
      display: time,
      current_count: counts[time] ?? 0,
      max_count: MAX_PER_SLOT,
      is_available: (counts[time] ?? 0) < MAX_PER_SLOT,
    })));
    setSlotsLoading(false);
    setTimeout(() => setStep(1), 100);
  };

  // 시간 선택 → 바로 확인 단계
  const handleSlotSelect = (time: string) => {
    setSelectedSlot(time);
    setStep(2);
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = '이름을 입력해주세요';
    if (!phone.trim()) e.phone = '연락처를 입력해주세요';
    if (!selectedDate) e.date = '날짜를 선택해주세요';
    if (!selectedSlot) e.slot = '시간을 선택해주세요';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      // 동시성 체크: 슬롯 재확인
      const dateStr = format(selectedDate!, 'yyyy-MM-dd');
      const { count } = await supabase
        .from('reservations')
        .select('id', { count: 'exact', head: true })
        .eq('reservation_date', dateStr)
        .eq('reservation_time', selectedSlot!)
        .neq('status', '취소');

      if ((count ?? 0) >= MAX_PER_SLOT) {
        toast.error('방금 해당 시간이 마감됐어요. 다른 시간을 선택해주세요.');
        handleDateSelect(selectedDate!);
        setStep(1);
        return;
      }

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

      const resNumber = generateReservationNumber();
      const { error } = await supabase.from('reservations').insert({
        reservation_number: resNumber,
        customer_id: customerId,
        school_id: state.school_id || null,
        reservation_date: dateStr,
        reservation_time: selectedSlot! + ':00',
        status: '예약완료',
        memo: memo || null,
      });
      if (error) throw new Error(error.message);

      toast.success('예약이 완료되었어요!');
      router.push(`/customer/reservation/complete?resNumber=${resNumber}&date=${dateStr}&time=${selectedSlot}`);
    } catch (err: any) {
      toast.error(err.message || '예약 중 오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar
        title="사전 예약"
        onBack={step > 0 ? () => setStep(step - 1) : () => router.push('/customer')}
      />

      {/* 고객 정보 */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-3">
          <Input label="이름 *" placeholder="홍길동" value={name} onChange={e => setName(e.target.value)} error={errors.name} />
          <Input label="연락처 *" placeholder="010-0000-0000" type="tel" value={phone} onChange={e => setPhone(e.target.value)} error={errors.phone} />
        </div>
      </div>

      {/* STEP 0: 날짜 선택 */}
      {step === 0 && (
        <div className="px-4 py-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-green-600" />
            <p className="font-bold text-gray-900">날짜 선택</p>
          </div>
          {errors.date && <p className="text-xs text-red-500 mb-2">{errors.date}</p>}
          <div className="grid grid-cols-3 gap-2">
            {availableDates.slice(0, 21).map(date => (
              <button
                key={date.toISOString()}
                onClick={() => handleDateSelect(date)}
                className={`btn-press rounded-2xl border-2 p-3 text-center transition-all ${
                  selectedDate?.toDateString() === date.toDateString()
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-200 text-gray-700 hover:border-green-300'
                }`}
              >
                <p className="text-xs text-gray-400">{format(date, 'M월', { locale: ko })}</p>
                <p className="text-xl font-bold">{format(date, 'd')}</p>
                <p className="text-xs text-gray-400">{format(date, 'E', { locale: ko })}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 1: 시간 선택 */}
      {step === 1 && (
        <div className="px-4 py-4 animate-fade-in">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-green-600" />
            <p className="font-bold text-gray-900">시간 선택</p>
          </div>
          <p className="text-sm text-gray-500 mb-3">
            {selectedDate && format(selectedDate, 'M월 d일 (E)', { locale: ko })} · 한 타임 최대 {MAX_PER_SLOT}명
          </p>
          {slotsLoading ? (
            <p className="text-center text-gray-400 py-8">시간 확인 중...</p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {slots.map(slot => (
                <button
                  key={slot.time}
                  onClick={() => slot.is_available && handleSlotSelect(slot.time)}
                  disabled={!slot.is_available}
                  className={`btn-press rounded-2xl border-2 p-4 text-left transition-all ${
                    !slot.is_available
                      ? 'border-gray-100 bg-gray-50 opacity-40 cursor-not-allowed'
                      : selectedSlot === slot.time
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-green-300'
                  }`}
                >
                  <p className="font-bold text-gray-900">{slot.display}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Users className="w-3 h-3 text-gray-400" />
                    <span className={`text-xs ${slot.is_available ? 'text-green-600' : 'text-gray-400'}`}>
                      {slot.is_available
                        ? `잔여 ${slot.max_count - slot.current_count}자리`
                        : '마감'}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* STEP 2: 확인 및 제출 */}
      {step === 2 && (
        <div className="px-4 py-4 animate-fade-in space-y-4">
          <div className="card p-5 space-y-3">
            <p className="font-bold text-gray-900">예약 확인</p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">이름</span><span className="font-bold">{name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">연락처</span><span className="font-bold">{phone}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">날짜</span><span className="font-bold">{selectedDate && format(selectedDate, 'yyyy년 M월 d일 (E)', { locale: ko })}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">시간</span><span className="font-bold text-green-600">{selectedSlot}</span></div>
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">메모 (선택)</p>
            <textarea
              className="w-full border-2 border-gray-200 rounded-2xl p-4 text-sm resize-none focus:border-green-400 outline-none"
              rows={3}
              placeholder="방문 목적이나 요청사항을 입력해주세요"
              value={memo}
              onChange={e => setMemo(e.target.value)}
            />
          </div>

          <Button fullWidth size="xl" loading={loading} onClick={handleSubmit}>
            예약 완료하기 <ChevronRight className="w-5 h-5" />
          </Button>
        </div>
      )}
    </div>
  );
}
