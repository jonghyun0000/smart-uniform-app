import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// 가격 포맷
export function formatPrice(price: number): string {
  return price.toLocaleString('ko-KR') + '원';
}

// 날짜 포맷
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

// 주문번호 생성 (클라이언트 폴백)
export function generateOrderNumber(): string {
  const now = new Date();
  const prefix = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `ORD${prefix}${rand}`;
}

export function generateReservationNumber(): string {
  const now = new Date();
  const prefix = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `RSV${prefix}${rand}`;
}

export function generateRepairNumber(): string {
  const now = new Date();
  const prefix = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `REP${prefix}${rand}`;
}

export function generateExchangeNumber(): string {
  const now = new Date();
  const prefix = now.toISOString().slice(2, 10).replace(/-/g, '');
  const rand = Math.floor(Math.random() * 9000 + 1000);
  return `EXC${prefix}${rand}`;
}

// 전화번호 포맷
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// 30분 단위 타임슬롯 생성
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  const startHour = 9;
  const endHour = 18;
  for (let h = startHour; h < endHour; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
}

// 상태 색상
export function getOrderStatusColor(status: string): string {
  const map: Record<string, string> = {
    '접수대기': 'bg-gray-100 text-gray-700',
    '접수완료': 'bg-blue-100 text-blue-700',
    '결제대기': 'bg-yellow-100 text-yellow-700',
    '결제완료': 'bg-green-100 text-green-700',
    '준비중': 'bg-purple-100 text-purple-700',
    '수령완료': 'bg-emerald-100 text-emerald-700',
    '취소': 'bg-red-100 text-red-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

export function getRepairStatusColor(status: string): string {
  const map: Record<string, string> = {
    '접수됨': 'bg-blue-100 text-blue-700',
    '진행중': 'bg-yellow-100 text-yellow-700',
    '완료': 'bg-green-100 text-green-700',
    '수령완료': 'bg-emerald-100 text-emerald-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

export function getReservationStatusColor(status: string): string {
  const map: Record<string, string> = {
    '예약완료': 'bg-blue-100 text-blue-700',
    '방문완료': 'bg-green-100 text-green-700',
    '취소': 'bg-red-100 text-red-700',
    '노쇼': 'bg-orange-100 text-orange-700',
  };
  return map[status] || 'bg-gray-100 text-gray-600';
}

// 사이즈 목록 (상품 카테고리별)
export const SIZE_OPTIONS: Record<string, string[]> = {
  '교복상의': ['85', '90', '95', '100', '105', '110', '115', '120', '125'],
  '교복하의': ['55', '60', '65', '70', '75', '80', '85', '90'],
  '체육복상의': ['S', 'M', 'L', 'XL', 'XXL', '100', '105', '110'],
  '체육복하의': ['S', 'M', 'L', 'XL', 'XXL', '60', '65', '70', '75'],
  '조끼': ['85', '90', '95', '100', '105', '110'],
  '스웨터': ['85', '90', '95', '100', '105', '110'],
  '셔츠': ['85', '90', '95', '100', '105'],
  '블라우스': ['85', '90', '95', '100', '105'],
  '넥타이': ['FREE'],
  '리본': ['FREE'],
  '명찰': ['FREE'],
  '기타': ['FREE', 'S', 'M', 'L', 'XL'],
};
