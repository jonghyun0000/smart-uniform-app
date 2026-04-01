// Database 타입 정의 (Supabase 스키마 기반)

export type SchoolType = '고등학교' | '중학교' | '초등학교';
export type GenderType = '남' | '여' | '공학';
export type ProductCategory = '교복상의' | '교복하의' | '체육복상의' | '체육복하의' | '조끼' | '스웨터' | '셔츠' | '블라우스' | '넥타이' | '리본' | '명찰' | '기타';
export type UniformType = '동복' | '하복' | '체육복' | '명찰' | '기타';
export type OrderType = '교복구매' | '체육복구매' | '명찰구매' | '수선' | '환불교환문의';
export type OrderStatus = '접수대기' | '접수완료' | '결제대기' | '결제완료' | '준비중' | '수령완료' | '취소';
export type ReservationStatus = '예약완료' | '방문완료' | '취소' | '노쇼';
export type RepairStatus = '접수됨' | '진행중' | '완료' | '수령완료';
export type ExchangeStatus = '접수' | '검토중' | '승인' | '반려' | '완료';
export type ExchangeType = '환불' | '교환' | '문의';

export interface School {
  id: string;
  name: string;
  school_type: SchoolType;
  gender_type: GenderType;
  region: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  school_id: string | null;
  name: string;
  category: ProductCategory;
  uniform_type: UniformType;
  gender: '남' | '여' | '공용';
  base_price: number;
  description: string | null;
  is_active: boolean;
  min_order_qty: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // 조인 데이터
  product_variants?: ProductVariant[];
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string;
  price: number;
  sku: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // 조인 데이터
  inventory?: Inventory;
}

export interface Inventory {
  id: string;
  variant_id: string;
  quantity: number;
  reserved_quantity: number;
  low_stock_threshold: number;
  updated_at: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  school_id: string | null;
  grade: string | null;
  class_num: string | null;
  student_num: string | null;
  gender: '남' | '여' | null;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  school_id: string | null;
  order_type: OrderType;
  status: OrderStatus;
  total_amount: number;
  paid_amount: number;
  discount_amount: number;
  memo: string | null;
  is_confirmed: boolean;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
  // 조인
  customers?: Customer;
  schools?: School;
  order_items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id: string | null;
  product_name: string;
  size: string | null;
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

export interface Reservation {
  id: string;
  reservation_number: string;
  customer_id: string;
  school_id: string | null;
  reservation_date: string;
  reservation_time: string;
  status: ReservationStatus;
  memo: string | null;
  created_at: string;
  updated_at: string;
  // 조인
  customers?: Customer;
  schools?: School;
}

export interface RepairItem {
  item: string;
  quantity: number;
  memo?: string;
}

export interface RepairRequest {
  id: string;
  repair_number: string;
  customer_id: string;
  order_id: string | null;
  repair_items: RepairItem[];
  memo: string | null;
  status: RepairStatus;
  estimated_date: string | null;
  created_at: string;
  updated_at: string;
  // 조인
  customers?: Customer;
}

export interface ExchangeRefundRequest {
  id: string;
  request_number: string;
  customer_id: string;
  order_id: string | null;
  request_type: ExchangeType;
  reason: string;
  status: ExchangeStatus;
  admin_memo: string | null;
  created_at: string;
  updated_at: string;
  // 조인
  customers?: Customer;
  orders?: Order;
}

// 장바구니 아이템 (클라이언트 상태)
export interface CartItem {
  product_id: string;
  variant_id: string;
  product_name: string;
  category: string;
  size: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  available_stock: number;
}

// 주문 폼 데이터
export interface OrderFormData {
  customer: {
    name: string;
    phone: string;
    grade: string;
    class_num: string;
    student_num: string;
    gender: '남' | '여' | '';
  };
  school_id: string;
  order_type: OrderType;
  cart: CartItem[];
  memo: string;
}

// 예약 타임슬롯
export interface TimeSlot {
  time: string;
  display: string;
  current_count: number;
  max_count: number;
  is_available: boolean;
}

// 수선 항목 마스터
export const REPAIR_ITEMS_MASTER = [
  '바지 기장 수선',
  '허리 수선 (바지)',
  '치마 길이 수선',
  '소매 수선',
  '재킷 어깨 수선',
  '재킷 기장 수선',
  '블라우스/셔츠 수선',
  '조끼 수선',
  '기타 수선',
];

// Database 타입 (Supabase 자동생성 타입 대체)
export interface Database {
  public: {
    Tables: {
      schools: { Row: School; Insert: Partial<School>; Update: Partial<School> };
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> };
      product_variants: { Row: ProductVariant; Insert: Partial<ProductVariant>; Update: Partial<ProductVariant> };
      inventory: { Row: Inventory; Insert: Partial<Inventory>; Update: Partial<Inventory> };
      customers: { Row: Customer; Insert: Partial<Customer>; Update: Partial<Customer> };
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> };
      order_items: { Row: OrderItem; Insert: Partial<OrderItem>; Update: Partial<OrderItem> };
      reservations: { Row: Reservation; Insert: Partial<Reservation>; Update: Partial<Reservation> };
      repair_requests: { Row: RepairRequest; Insert: Partial<RepairRequest>; Update: Partial<RepairRequest> };
      exchange_refund_requests: { Row: ExchangeRefundRequest; Insert: Partial<ExchangeRefundRequest>; Update: Partial<ExchangeRefundRequest> };
    };
  };
}
