-- =============================================
-- 스마트 학생복 매장 자동화 DB 스키마 (Supabase)
-- =============================================

-- 확장 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- 1. 학교 테이블
-- =============================================
CREATE TABLE schools (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  school_type TEXT NOT NULL CHECK (school_type IN ('고등학교', '중학교', '초등학교')),
  gender_type TEXT NOT NULL CHECK (gender_type IN ('남', '여', '공학')),
  region TEXT DEFAULT '춘천',
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_schools_type ON schools(school_type, is_active);

-- =============================================
-- 2. 상품 테이블
-- =============================================
CREATE TABLE products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('교복상의', '교복하의', '체육복상의', '체육복하의', '조끼', '스웨터', '셔츠', '블라우스', '넥타이', '리본', '명찰', '기타')),
  uniform_type TEXT NOT NULL CHECK (uniform_type IN ('동복', '하복', '체육복', '명찰', '기타')),
  gender TEXT NOT NULL CHECK (gender IN ('남', '여', '공용')),
  base_price INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  min_order_qty INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_school ON products(school_id, is_active);
CREATE INDEX idx_products_category ON products(category, uniform_type);

-- =============================================
-- 3. 상품 변형 (사이즈별)
-- =============================================
CREATE TABLE product_variants (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, size)
);

CREATE INDEX idx_variants_product ON product_variants(product_id, is_active);

-- =============================================
-- 4. 재고 테이블
-- =============================================
CREATE TABLE inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE UNIQUE,
  quantity INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_variant ON inventory(variant_id);

-- =============================================
-- 5. 고객 테이블
-- =============================================
CREATE TABLE customers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  grade TEXT,
  class_num TEXT,
  student_num TEXT,
  gender TEXT CHECK (gender IN ('남', '여')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_school ON customers(school_id);

-- =============================================
-- 6. 주문 테이블
-- =============================================
CREATE TABLE orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('교복구매', '체육복구매', '명찰구매', '수선', '환불교환문의')),
  status TEXT NOT NULL DEFAULT '접수대기' CHECK (status IN ('접수대기','접수완료','결제대기','결제완료','준비중','수령완료','취소')),
  total_amount INTEGER NOT NULL DEFAULT 0,
  paid_amount INTEGER DEFAULT 0,
  discount_amount INTEGER DEFAULT 0,
  memo TEXT,
  is_confirmed BOOLEAN DEFAULT false,
  confirmed_at TIMESTAMPTZ,
  confirmed_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_school ON orders(school_id);

-- =============================================
-- 7. 주문 항목 테이블
-- =============================================
CREATE TABLE order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  variant_id UUID REFERENCES product_variants(id) ON DELETE RESTRICT,
  product_name TEXT NOT NULL,
  size TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  total_price INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- =============================================
-- 8. 예약 테이블
-- =============================================
CREATE TABLE reservations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  reservation_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  school_id UUID REFERENCES schools(id) ON DELETE SET NULL,
  reservation_date DATE NOT NULL,
  reservation_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT '예약완료' CHECK (status IN ('예약완료','방문완료','취소','노쇼')),
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservations_date ON reservations(reservation_date, reservation_time);
CREATE INDEX idx_reservations_customer ON reservations(customer_id);
CREATE INDEX idx_reservations_number ON reservations(reservation_number);

-- =============================================
-- 9. 수선 접수 테이블
-- =============================================
CREATE TABLE repair_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  repair_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  repair_items JSONB NOT NULL DEFAULT '[]',
  memo TEXT,
  status TEXT NOT NULL DEFAULT '접수됨' CHECK (status IN ('접수됨','진행중','완료','수령완료')),
  estimated_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_repair_customer ON repair_requests(customer_id);
CREATE INDEX idx_repair_status ON repair_requests(status);
CREATE INDEX idx_repair_number ON repair_requests(repair_number);

-- =============================================
-- 10. 환불/교환 문의 테이블
-- =============================================
CREATE TABLE exchange_refund_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  request_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('환불','교환','문의')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT '접수' CHECK (status IN ('접수','검토중','승인','반려','완료')),
  admin_memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_exchange_customer ON exchange_refund_requests(customer_id);
CREATE INDEX idx_exchange_status ON exchange_refund_requests(status);

-- =============================================
-- 11. 판매 로그 (재고 차감 추적)
-- =============================================
CREATE TABLE sales_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE RESTRICT,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity_change INTEGER NOT NULL,
  reason TEXT,
  admin_user TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sales_logs_order ON sales_logs(order_id);
CREATE INDEX idx_sales_logs_created ON sales_logs(created_at DESC);

-- =============================================
-- 12. 관리자 테이블
-- =============================================
CREATE TABLE admin_users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('super', 'manager', 'staff')),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- updated_at 자동 갱신 함수
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_schools_updated_at BEFORE UPDATE ON schools FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_variants_updated_at BEFORE UPDATE ON product_variants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_repair_updated_at BEFORE UPDATE ON repair_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_exchange_updated_at BEFORE UPDATE ON exchange_refund_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- RLS (Row Level Security)
-- =============================================
ALTER TABLE schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE repair_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE exchange_refund_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (손님도 읽기 가능한 테이블)
CREATE POLICY "schools_read" ON schools FOR SELECT USING (true);
CREATE POLICY "products_read" ON products FOR SELECT USING (is_active = true);
CREATE POLICY "variants_read" ON product_variants FOR SELECT USING (is_active = true);
CREATE POLICY "inventory_read" ON inventory FOR SELECT USING (true);

-- 삽입 정책 (누구나 주문/예약 등록 가능)
CREATE POLICY "customers_insert" ON customers FOR INSERT WITH CHECK (true);
CREATE POLICY "customers_select" ON customers FOR SELECT USING (true);
CREATE POLICY "orders_insert" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "orders_select" ON orders FOR SELECT USING (true);
CREATE POLICY "orders_update" ON orders FOR UPDATE USING (true);
CREATE POLICY "order_items_insert" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (true);
CREATE POLICY "reservations_insert" ON reservations FOR INSERT WITH CHECK (true);
CREATE POLICY "reservations_select" ON reservations FOR SELECT USING (true);
CREATE POLICY "reservations_update" ON reservations FOR UPDATE USING (true);
CREATE POLICY "repair_insert" ON repair_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "repair_select" ON repair_requests FOR SELECT USING (true);
CREATE POLICY "repair_update" ON repair_requests FOR UPDATE USING (true);
CREATE POLICY "exchange_insert" ON exchange_refund_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "exchange_select" ON exchange_refund_requests FOR SELECT USING (true);
CREATE POLICY "exchange_update" ON exchange_refund_requests FOR UPDATE USING (true);
CREATE POLICY "inventory_update" ON inventory FOR UPDATE USING (true);
CREATE POLICY "sales_logs_insert" ON sales_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "sales_logs_select" ON sales_logs FOR SELECT USING (true);
CREATE POLICY "admin_select" ON admin_users FOR SELECT USING (true);

-- 관리자 전용 쓰기
CREATE POLICY "products_admin_write" ON products FOR ALL USING (true);
CREATE POLICY "variants_admin_write" ON product_variants FOR ALL USING (true);
CREATE POLICY "schools_admin_write" ON schools FOR ALL USING (true);

-- =============================================
-- 샘플 데이터 - 학교
-- =============================================
INSERT INTO schools (name, school_type, gender_type, sort_order) VALUES
-- 고등학교 남고
('춘천고', '고등학교', '남', 1),
('성수고', '고등학교', '남', 2),
('기계공고', '고등학교', '남', 3),
-- 고등학교 공학
('사대부고', '고등학교', '공학', 4),
('봉의고', '고등학교', '공학', 5),
('한샘고', '고등학교', '공학', 6),
('강원생명과학고', '고등학교', '공학', 7),
-- 고등학교 여고
('춘천여고', '고등학교', '여', 8),
('유봉여고', '고등학교', '여', 9),
('성수여고', '고등학교', '여', 10),
-- 중학교 남중
('남춘천중', '중학교', '남', 11),
-- 중학교 공학
('춘천중', '중학교', '공학', 12),
('봄내중', '중학교', '공학', 13),
('후평중', '중학교', '공학', 14),
('소양중', '중학교', '공학', 15),
('대룡중', '중학교', '공학', 16),
('우석중', '중학교', '공학', 17),
('봉의중', '중학교', '공학', 18),
('강원중', '중학교', '공학', 19),
('퇴계중', '중학교', '공학', 20),
-- 중학교 여중
('유봉여중', '중학교', '여', 21),
('남춘천여중', '중학교', '여', 22),
-- 기타 지역
('가평화천양구', '고등학교', '공학', 23),
-- 초등학교
('교대부설초교', '초등학교', '공학', 24);

-- =============================================
-- Realtime 활성화
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;
ALTER PUBLICATION supabase_realtime ADD TABLE reservations;
ALTER PUBLICATION supabase_realtime ADD TABLE repair_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- =============================================
-- 주문번호 생성 함수
-- =============================================
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_seq TEXT;
BEGIN
  v_prefix := TO_CHAR(NOW(), 'YYMMDD');
  v_seq := LPAD(CAST(FLOOR(RANDOM() * 9000 + 1000) AS TEXT), 4, '0');
  RETURN 'ORD' || v_prefix || v_seq;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_reservation_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'RSV' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(CAST(FLOOR(RANDOM() * 9000 + 1000) AS TEXT), 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_repair_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'REP' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(CAST(FLOOR(RANDOM() * 9000 + 1000) AS TEXT), 4, '0');
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_exchange_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'EXC' || TO_CHAR(NOW(), 'YYMMDD') || LPAD(CAST(FLOOR(RANDOM() * 9000 + 1000) AS TEXT), 4, '0');
END;
$$ LANGUAGE plpgsql;
