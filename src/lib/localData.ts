// 이미지에서 추출한 가격표 데이터 (Supabase 미연결 시 폴백용)
// 2026 스마트 가격표 기준

export const SCHOOLS_DATA = [
  // 고등학교
  { name: '춘천고', school_type: '고등학교', gender_type: '남' },
  { name: '성수고', school_type: '고등학교', gender_type: '남' },
  { name: '기계공고', school_type: '고등학교', gender_type: '남' },
  { name: '사대부고', school_type: '고등학교', gender_type: '공학' },
  { name: '봉의고', school_type: '고등학교', gender_type: '공학' },
  { name: '한샘고', school_type: '고등학교', gender_type: '공학' },
  { name: '강원생명과학고', school_type: '고등학교', gender_type: '공학' },
  { name: '춘천여고', school_type: '고등학교', gender_type: '여' },
  { name: '유봉여고', school_type: '고등학교', gender_type: '여' },
  { name: '성수여고', school_type: '고등학교', gender_type: '여' },
  // 중학교
  { name: '남춘천중', school_type: '중학교', gender_type: '남' },
  { name: '춘천중', school_type: '중학교', gender_type: '공학' },
  { name: '봄내중', school_type: '중학교', gender_type: '공학' },
  { name: '후평중', school_type: '중학교', gender_type: '공학' },
  { name: '소양중', school_type: '중학교', gender_type: '공학' },
  { name: '대룡중', school_type: '중학교', gender_type: '공학' },
  { name: '우석중', school_type: '중학교', gender_type: '공학' },
  { name: '봉의중', school_type: '중학교', gender_type: '공학' },
  { name: '강원중', school_type: '중학교', gender_type: '공학' },
  { name: '퇴계중', school_type: '중학교', gender_type: '공학' },
  { name: '유봉여중', school_type: '중학교', gender_type: '여' },
  { name: '남춘천여중', school_type: '중학교', gender_type: '여' },
  // 기타
  { name: '가평화천양구', school_type: '고등학교', gender_type: '공학' },
  { name: '교대부설초교', school_type: '초등학교', gender_type: '공학' },
];

// 동복(신제품) 가격표
export const WINTER_PRICE_TABLE: Record<string, {
  top: number | null;
  bottom: number | null;
  vest: number | null;
  shirt: number | null;
  tie: number | null;
  set: number | null;
  pe: number | null;
  note?: string;
}> = {
  '춘천고':       { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000 },
  '성수고':       { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000 },
  '기계공고':     { top: 116000, bottom: 75000, vest: null,  shirt: 75000, tie: null,  set: 266000, pe: null  },
  '사대부고':     { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000 },
  '봉의고':       { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000, note: '명찰2' },
  '한샘고':       { top: 116000, bottom: 75000, vest: null,  shirt: 59000, tie: null,  set: 250000, pe: 89000 },
  '강원생명과학고': { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000 },
  '춘천여고':     { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000 },
  '유봉여고':     { top: null,   bottom: 75000, vest: null,  shirt: 59000, tie: null,  set: 134000, pe: 89000 },
  '성수여고':     { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000 },
  '남춘천중':     { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: null,  set: 299000, pe: 89000, note: '명찰2' },
  '춘천중':       { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000, note: '명찰2' },
  '봄내중':       { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000, note: '명찰2' },
  '후평중':       { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000, note: '명찰2' },
  '소양중':       { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000, note: '명찰2' },
  '대룡중':       { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000, note: '명찰2' },
  '우석중':       { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000, note: '명찰2' },
  '봉의중':       { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000, note: '명찰2' },
  '강원중':       { top: 116000, bottom: null,  vest: 60000, shirt: 54000, tie: null,  set: 230000, pe: null  },
  '퇴계중':       { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000 },
  '유봉여중':     { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: 89000, note: '명찰2' },
  '남춘천여중':   { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: null,  set: 299000, pe: 89000, note: '명찰2' },
  '가평화천양구': { top: 116000, bottom: 75000, vest: 54000, shirt: 54000, tie: 10000, set: 309000, pe: null  },
  '교대부설초교': { top: 120000, bottom: 65000, vest: 62000, shirt: 48000, tie: null,  set: 344000, pe: 72000, note: '코트, 가디건, 조끼49000' },
};

// 하복(생활복) 가격표
export const SUMMER_PRICE_TABLE: Record<string, {
  top: number | null;
  bottom: number | null;
  tie: number | null;
  setPrice: number | null;
  peTop: number | null;
  peBottom: number | null;
  peSet: number | null;
  nameTag: number | null;
  totalSet: number | null;
  totalSet2: number | null;
}> = {
  '춘천고':       { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: null, peBottom: null, peSet: 79000, nameTag: null, totalSet: 195000, totalSet2: 249000 },
  '성수고':       { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: null, peBottom: null, peSet: 79000, nameTag: null, totalSet: 195000, totalSet2: 249000 },
  '기계공고':     { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: null, peBottom: null, peSet: 79000, nameTag: null, totalSet: 195000, totalSet2: 249000 },
  '사대부고':     { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: null, peBottom: 40000, peSet: 40000, nameTag: null, totalSet: 156000, totalSet2: 210000 },
  '봉의고':       { top: 54000, bottom: 62000, tie: 5000, setPrice: 116000, peTop: 46000, peBottom: 40000, peSet: 79000, nameTag: 4000, totalSet: 199000, totalSet2: 253000 },
  '한샘고':       { top: 55000, bottom: 62000, tie: null, setPrice: 117000, peTop: 46000, peBottom: 40000, peSet: 79000, nameTag: null, totalSet: 196000, totalSet2: 251000 },
  '강원생명과학고': { top: 54000, bottom: 62000, tie: 5000, setPrice: 116000, peTop: 54000, peBottom: 40000, peSet: 94000, nameTag: null, totalSet: 210000, totalSet2: 264000 },
  '춘천여고':     { top: 54000, bottom: 62000, tie: 5000, setPrice: 116000, peTop: 49000, peBottom: 40000, peSet: 87000, nameTag: null, totalSet: 203000, totalSet2: 257000 },
  '유봉여고':     { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: 46000, peBottom: 40000, peSet: 79000, nameTag: null, totalSet: 195000, totalSet2: 249000 },
  '성수여고':     { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: null, peBottom: 42000, peSet: 42000, nameTag: null, totalSet: 158000, totalSet2: 212000 },
  '남춘천중':     { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: 46000, peBottom: 40000, peSet: 79000, nameTag: 4000, totalSet: 199000, totalSet2: 253000 },
  '춘천중':       { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: 46000, peBottom: 40000, peSet: 79000, nameTag: 4000, totalSet: 199000, totalSet2: 253000 },
  '봄내중':       { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: 46000, peBottom: 40000, peSet: 79000, nameTag: 4000, totalSet: 199000, totalSet2: 253000 },
  '후평중':       { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: 46000, peBottom: 40000, peSet: 79000, nameTag: 4000, totalSet: 199000, totalSet2: 253000 },
  '소양중':       { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: null, peBottom: null, peSet: 79000, nameTag: 4000, totalSet: 199000, totalSet2: 253000 },
  '대룡중':       { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: 46000, peBottom: 40000, peSet: 79000, nameTag: 4000, totalSet: 199000, totalSet2: 253000 },
  '우석중':       { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: 46000, peBottom: 40000, peSet: 79000, nameTag: 4000, totalSet: 199000, totalSet2: 253000 },
  '봉의중':       { top: 54000, bottom: 45000, tie: null, setPrice: 99000, peTop: null, peBottom: null, peSet: null, nameTag: null, totalSet: 99000, totalSet2: 153000 },
  '강원중':       { top: 54000, bottom: null, tie: null, setPrice: 54000, peTop: null, peBottom: null, peSet: null, nameTag: null, totalSet: 54000, totalSet2: 108000 },
  '퇴계중':       { top: 54000, bottom: 45000, tie: null, setPrice: 99000, peTop: null, peBottom: null, peSet: null, nameTag: null, totalSet: 99000, totalSet2: 153000 },
  '유봉여중':     { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: null, peBottom: null, peSet: 79000, nameTag: 4000, totalSet: 199000, totalSet2: 253000 },
  '남춘천여중':   { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: 46000, peBottom: 40000, peSet: 79000, nameTag: 4000, totalSet: 199000, totalSet2: 253000 },
  '가평화천양구': { top: 54000, bottom: 62000, tie: null, setPrice: 116000, peTop: null, peBottom: null, peSet: null, nameTag: null, totalSet: 116000, totalSet2: 170000 },
};

// 기타 단품 가격
export const MISC_PRICES = {
  가디건: 69000,
  브이넥긴팔: 65000,
  기모바지: 79000,
  기모바지초교: 74000,
  기모체육복: 96000,
  기모체육복초교: 79000,
  천명찰: 2000,
  부착명찰: 2000,
  리본타이: 5000,
};
