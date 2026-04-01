-- =============================================
-- 샘플 상품 데이터 (가격표 이미지 기준)
-- 이 파일은 스키마 생성 후 실행하세요
-- =============================================

-- 춘천고 동복 (남, 교복)
WITH school AS (
  SELECT id
  FROM schools
  WHERE name = '춘천고'
  LIMIT 1
)
INSERT INTO products (
  school_id,
  name,
  category,
  uniform_type,
  gender,
  base_price,
  sort_order
)
SELECT school.id, '상의(동복)', '교복상의', '동복', '남', 116000, 1 FROM school
UNION ALL
SELECT school.id, '하의(동복)', '교복하의', '동복', '남', 75000, 2 FROM school
UNION ALL
SELECT school.id, '조끼/스웨터', '조끼', '동복', '남', 54000, 3 FROM school
UNION ALL
SELECT school.id, '셔츠', '셔츠', '동복', '남', 54000, 4 FROM school
UNION ALL
SELECT school.id, '넥타이', '넥타이', '동복', '남', 10000, 5 FROM school
UNION ALL
SELECT school.id, '상의(하복)', '교복상의', '하복', '남', 54000, 6 FROM school
UNION ALL
SELECT school.id, '하의(하복)', '교복하의', '하복', '남', 62000, 7 FROM school
UNION ALL
SELECT school.id, '체육복 상의', '체육복상의', '체육복', '공용', 89000, 8 FROM school;

-- 춘천중 동복 (공학)
WITH school AS (
  SELECT id
  FROM schools
  WHERE name = '춘천중'
  LIMIT 1
)
INSERT INTO products (
  school_id,
  name,
  category,
  uniform_type,
  gender,
  base_price,
  sort_order
)
SELECT school.id, '상의(동복)', '교복상의', '동복', '공용', 116000, 1 FROM school
UNION ALL
SELECT school.id, '하의(동복)', '교복하의', '동복', '공용', 75000, 2 FROM school
UNION ALL
SELECT school.id, '조끼/스웨터', '조끼', '동복', '공용', 54000, 3 FROM school
UNION ALL
SELECT school.id, '셔츠/블라우스', '셔츠', '동복', '공용', 54000, 4 FROM school
UNION ALL
SELECT school.id, '넥타이/리본', '넥타이', '동복', '공용', 10000, 5 FROM school
UNION ALL
SELECT school.id, '상의(하복)', '교복상의', '하복', '공용', 54000, 6 FROM school
UNION ALL
SELECT school.id, '하의(하복)', '교복하의', '하복', '공용', 62000, 7 FROM school
UNION ALL
SELECT school.id, '체육복 상의', '체육복상의', '체육복', '공용', 89000, 8 FROM school
UNION ALL
SELECT school.id, '명찰(천)', '명찰', '명찰', '공용', 2000, 9 FROM school;

-- 공통 명찰 상품 (학교 무관)
INSERT INTO products (
  school_id,
  name,
  category,
  uniform_type,
  gender,
  base_price,
  sort_order
)
VALUES
  (NULL, '천명찰', '명찰', '명찰', '공용', 2000, 1),
  (NULL, '부착명찰', '명찰', '명찰', '공용', 2000, 2),
  (NULL, '가디건', '기타', '동복', '공용', 69000, 3),
  (NULL, '브이넥긴팔', '기타', '동복', '공용', 65000, 4),
  (NULL, '기모바지', '교복하의', '동복', '공용', 79000, 5),
  (NULL, '기모체육복', '체육복하의', '체육복', '공용', 96000, 6);

-- 사이즈 변형 생성 (상의 기준 공통 사이즈)
-- 춘천고 상의(동복)에 사이즈 추가 예시
WITH product AS (
  SELECT p.id
  FROM products p
  JOIN schools s
    ON p.school_id = s.id
  WHERE s.name = '춘천고'
    AND p.name = '상의(동복)'
  LIMIT 1
)
INSERT INTO product_variants (
  product_id,
  size,
  price,
  sort_order
)
SELECT
  product.id,
  sizes.size_name,
  116000,
  sizes.ord
FROM product,
(
  VALUES
    ('85', 1),
    ('90', 2),
    ('95', 3),
    ('100', 4),
    ('105', 5),
    ('110', 6),
    ('115', 7)
) AS sizes(size_name, ord);

-- 재고 초기화 (사이즈별 10개씩)
INSERT INTO inventory (
  variant_id,
  quantity,
  reserved_quantity
)
SELECT
  id,
  10,
  0
FROM product_variants
ON CONFLICT (variant_id) DO NOTHING;

-- =============================================
-- 수선 항목 마스터 (코드에서 직접 사용)
-- =============================================
-- repair_items 예시:
-- [
--   {"item": "바지 기장 수선", "quantity": 1},
--   {"item": "허리 수선", "quantity": 1}
-- ]

-- =============================================
-- 관리자 계정 (bcrypt는 앱에서 처리)
-- 초기 비밀번호: smart2026!
-- =============================================
INSERT INTO admin_users (
  username,
  password_hash,
  role
)
VALUES (
  'admin',
  'smart2026!',
  'super'
)
ON CONFLICT (username) DO NOTHING;