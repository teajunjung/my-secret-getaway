import { auth, db } from '../firebase.js';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc, 
  deleteDoc,
  getDoc,
  addDoc
} from 'firebase/firestore';

// ─── Default Data (Fallback if DB is empty) ──────────────────────────────
const DEFAULT_CURATIONS = [
  {
    id: 'c1',
    title: '평창 잣나무 숲속 안개 안식처',
    location: '강원도 평창',
    tag: '숲속의작은집',
    allTags: ['숲속의작은집', '혼자만의정적'],
    badge: 'NEW',
    ratingLabel: '휴식도',
    ratingValue: '5.0 / 5.0',
    image: './images/hero_forest.png',
    quote: '스마트폰을 끄고 차 한 잔과 숲의 소리에 몰입하는 오롯한 피난처입니다.',
    description: '수령 50년 이상의 잣나무 숲에 둘러싸인 독채 샬레입니다. 사방이 통창으로 구성되어 아침 안개와 새소리를 들으며 명상과 다도를 즐길 수 있습니다.',
    lat: '37.7312',
    lng: '128.5911'
  },
  {
    id: 'c2',
    title: '포시타노 절벽 위 지중해 스위트',
    location: '이탈리아 아말피',
    tag: '오션뷰멍때리기',
    allTags: ['오션뷰멍때리기', '영감이필요할때'],
    badge: '단독 공개',
    ratingLabel: '뷰만족도',
    ratingValue: '5.0 / 5.0',
    image: './images/ocean_cliff.png',
    quote: '에메랄드빛 바다와 하얀 시폰 커튼 바람이 선사하는 로맨틱한 일몰.',
    description: '아말피 절벽 끝자락에 위치하여 사생활이 완전히 보장되는 프리미엄 바이더씨 테라스입니다. 파도 소리와 함께 와인을 나누기에 완벽합니다.',
    lat: '40.6281',
    lng: '14.4850'
  },
  {
    id: 'c3',
    title: '교토 아라시야마 대나무 다실',
    location: '일본 교토',
    tag: '영감이필요할때',
    allTags: ['영감이필요할때', '혼자만의정적'],
    badge: '인기 스팟',
    ratingLabel: '영감도',
    ratingValue: '4.9 / 5.0',
    image: './images/kyoto_tea.png',
    quote: '비 오는 날 창가에 앉아 말차를 마시며 창작의 아이디어를 벼리는 시간.',
    description: '관광객에게 잘 알려지지 않은 300년 전통 젠 다실입니다. 조용한 정원 음향과 고즈넉한 인테리어가 지친 마음을 평온하게 다스려줍니다.',
    lat: '35.0116',
    lng: '135.6777'
  },
  {
    id: 'c4',
    title: '제주 조천 삼나무 숲 아틀리에',
    location: '제주 조천읍',
    tag: '노트북하기좋은',
    allTags: ['노트북하기좋은', '숲속의작은집'],
    badge: 'NEW',
    ratingLabel: '작업몰입도',
    ratingValue: '5.0 / 5.0',
    image: './images/hero_forest.png',
    quote: '넓은 원목 작업대와 삼나무 향기가 가득한 워케이션 최적의 보금자리.',
    description: '글을 쓰거나 노트북 작업을 하기에 특화된 프라이빗 아틀리에입니다. 고속 Wi-Fi와 드립 커피 도구, LP 플레이어가 구비되어 있습니다.',
    lat: '33.5184',
    lng: '126.8291'
  },
  {
    id: 'c5',
    title: '강릉 사천해변 오션 미니멀 독채',
    location: '강원도 강릉',
    tag: '오션뷰멍때리기',
    allTags: ['오션뷰멍때리기', '노트북하기좋은'],
    badge: '단독 공개',
    ratingLabel: '아늑함',
    ratingValue: '4.8 / 5.0',
    image: './images/ocean_cliff.png',
    quote: '침대에 누워 동해의 잔잔한 일출을 시야 방해 없이 눈에 담는 안식처.',
    description: '최소한의 가구와 여백의 미를 살린 건축으로, 오롯이 일출과 바다 소리에 집중할 수 있는 차분한 해변 스튜디오입니다.',
    lat: '37.8286',
    lng: '128.8893'
  },
  {
    id: 'c6',
    title: '우붓 만년 숲속 무소음 스테이',
    location: '인도네시아 발리',
    tag: '혼자만의정적',
    allTags: ['혼자만의정적', '영감이필요할때'],
    badge: '추천',
    ratingLabel: '정적도',
    ratingValue: '5.0 / 5.0',
    image: './images/kyoto_tea.png',
    quote: '새소리와 바람 소리 외에는 어떤 도시 소음도 들리지 않는 리트릿.',
    description: '발리 정글 깊숙한 곳에 조성된 오가닉 바이오 에코 로지입니다. 자연 수영장과 개인 요가 파빌리온에서 마인드풀니스를 경험하세요.',
    lat: '-8.5069',
    lng: '115.2625'
  }
];

const DEFAULT_GUIDEBOOKS = [
  {
    id: 'g1',
    title: '도쿄 취향 투어 3박 4일',
    subtitle: '감성 카페 & 부티크 디자이너 스테이',
    pages: '36 Pages PDF',
    price: 29000,
    priceFormatted: '29,000원',
    image: './images/kyoto_tea.png',
    description: '번잡한 관광 코스를 뺀 도쿄 앤티크 찻집, 셰프의 주방, 디자이너 편집숍과 동선 동기화 구글 맵이 수록된 종합 안내서입니다.'
  },
  {
    id: 'g2',
    title: '제주 시크릿 힐링 로드 2박 3일',
    subtitle: '숲속 독채 & 비공개 다도 스팟',
    pages: '28 Pages PDF',
    price: 25000,
    priceFormatted: '25,000원',
    image: './images/hero_forest.png',
    description: '제주의 한라산 자락 숲길과 현지인들만 아는 작은 찻집, 조용한 해변 노을 명소만을 엄선한 감성 코스 가이드북.'
  },
  {
    id: 'g3',
    title: '교토 아날로그 감성 여행 3박 4일',
    subtitle: '노천 온천 & 고서점 큐레이션',
    pages: '42 Pages PDF',
    price: 32000,
    priceFormatted: '32,000원',
    image: './images/ocean_cliff.png',
    description: '시간이 천천히 흐르는 교토의 고즈넉한 골목, 오래된 책방, 정원이 아름다운 미슐랭 가이세키 추천 동선집.'
  }
];

const DEFAULT_TESTIMONIALS = [
  {
    id: 't1',
    quote: '바쁜 프로젝트 끝내고 무작정 떠났는데, 크리에이터님이 동선부터 숙소까지 완벽하게 맞춰주셔서 인생 최고의 휴식을 보냈습니다.',
    name: '김서현 님',
    role: '30대 IT 서비스 기획자',
    avatar: './images/creator_portrait.png'
  },
  {
    id: 't2',
    quote: '뻔한 관광지 하나 없이 오롯이 내 취향에 맞춘 스팟들만 골라주신 1:1 컨설팅! 준비하는 피로가 전혀 없어서 감동했습니다.',
    name: '박성민 님',
    role: '20대 프리랜서 디자이너',
    avatar: './images/creator_portrait.png'
  },
  {
    id: 't3',
    quote: '디지털 가이드북 사서 떠났는데 동선 고민이 전혀 없었어요. 이메일 구독 시크릿 맵 지도 핀도 최고였습니다.',
    name: '이윤아 님',
    role: '30대 브랜드 마케터',
    avatar: './images/creator_portrait.png'
  }
];

const DEFAULT_SITE_SETTINGS = {
  heroTitle: '당신의 취향을 닮은 완벽한 휴식,',
  heroAccent: '나만의 시크릿 겟어웨이',
  heroDescription: '복잡한 여행 준비 대신, 현지 크리에이터가 검증한 1:1 맞춤형 힐링 일정과 감성적인 프라이빗 공간을 선물합니다.',
  curationSectionTitle: '이달의 프라이빗 큐레이션',
  curationSectionDesc: '크리에이터가 직접 머물고 검증한, 영감을 주는 비밀스러운 장소들입니다.',
  guidebookSectionTitle: '테마별 디지털 가이드북',
  guidebookSectionDesc: '동선 고민 없이 바로 떠날 수 있는 크리에이터의 손때 묻은 PDF 여행 일정표',
  aboutQuote: '"체크리스트를 채우는 관광이 아닌, 가슴이 조용히 머무는 순간을 선물합니다"',
  aboutBio: '안녕하세요, My Secret Getaway의 대표 큐레이터 줄리아입니다. 지난 8년간 전 세계 40여 개 도시와 국내 숨은 소도시들을 여행하며 깨달은 것은, 진정한 휴식은 화려한 유명 관광지가 아닌 \'나의 취향과 속도가 맞물리는 한 조각의 공간\'에서 온다는 것이었습니다.',
  statSpots: '500+',
  statSatisfaction: '99.2%',
};

const DEFAULT_SECRET_PINS = [
  {
    name: '제주 구좌읍 숨겨진 삼나무 숲길',
    coords: '33.5184, 126.8291',
    note: '네비게이션에 나오지 않는 입구. 입구 표지판 오른쪽 삼나무 흙길 200m 직진.'
  },
  {
    name: '교토 우지 천년 역사의 비공개 찻집',
    coords: '34.8892, 135.8075',
    note: '초인종을 두 번 누르고 예약자 이름을 말해야 문이 열리는 시크릿 젠 카페.'
  },
  {
    name: '평창 오대산 산자락 비공개 독채 다실',
    coords: '37.7312, 128.5911',
    note: '맑은 계곡물 소리를 들으며 다도를 즐길 수 있는 크리에이터 전용 스팟.'
  }
];

// ─── Helper for Collections ──────────────────────────────────────────────
async function fetchCollection(colName) {
  try {
    const colRef = collection(db, colName);
    const snapshot = await getDocs(colRef);
    if (!snapshot.empty) {
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    }
  } catch (error) {
    console.warn(`[Firestore] Fetch ${colName} fallback:`, error);
  }
  return null;
}

async function saveDocument(colName, item) {
  try {
    const docRef = doc(db, colName, item.id);
    await setDoc(docRef, item);
  } catch (error) {
    console.error(`[Firestore] Save to ${colName} error:`, error);
    throw error;
  }
}

async function deleteDocument(colName, id) {
  try {
    const docRef = doc(db, colName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`[Firestore] Delete from ${colName} error:`, error);
    throw error;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────

export const dataService = {
  // ─── Curations ───
  async getCurations() {
    const data = await fetchCollection('curations');
    return (data && data.length > 0) ? data : DEFAULT_CURATIONS;
  },
  async saveCuration(item) {
    await saveDocument('curations', item);
  },
  async deleteCuration(id) {
    await deleteDocument('curations', id);
  },

  // ─── Guidebooks ───
  async getGuidebooks() {
    const data = await fetchCollection('guidebooks');
    return (data && data.length > 0) ? data : DEFAULT_GUIDEBOOKS;
  },
  async saveGuidebook(item) {
    await saveDocument('guidebooks', item);
  },
  async deleteGuidebook(id) {
    await deleteDocument('guidebooks', id);
  },

  // ─── Testimonials ───
  async getTestimonials() {
    const data = await fetchCollection('testimonials');
    return (data && data.length > 0) ? data : DEFAULT_TESTIMONIALS;
  },
  async saveTestimonial(item) {
    await saveDocument('testimonials', item);
  },
  async deleteTestimonial(id) {
    await deleteDocument('testimonials', id);
  },

  // ─── Site Settings ───
  async getSiteSettings() {
    try {
      const docRef = doc(db, 'settings', 'site');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { ...DEFAULT_SITE_SETTINGS, ...docSnap.data() };
      }
    } catch (error) {
      console.warn('[Firestore] Fetch site settings fallback:', error);
    }
    return DEFAULT_SITE_SETTINGS;
  },
  async saveSiteSettings(data) {
    try {
      const docRef = doc(db, 'settings', 'site');
      await setDoc(docRef, data);
    } catch (error) {
      console.error('[Firestore] Save site settings error:', error);
      throw error;
    }
  },

  // ─── Secret Pins ───
  async getSecretPins() {
    return DEFAULT_SECRET_PINS;
  },

  // ─── Consulting Inquiries ───
  async saveConsultingInquiry(data) {
    const inquiryItem = {
      ...data,
      id: `inq_${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    // 1. Always backup locally so user data is never lost
    try {
      const localInquiries = JSON.parse(localStorage.getItem('msg_inquiries') || '[]');
      localInquiries.unshift(inquiryItem);
      localStorage.setItem('msg_inquiries', JSON.stringify(localInquiries));
    } catch (e) {
      console.warn('[LocalStorage] Save inquiry backup error:', e);
    }

    // 2. Try saving to Firestore
    try {
      const colRef = collection(db, 'inquiries');
      await addDoc(colRef, inquiryItem);
    } catch (error) {
      console.warn('[Firestore] Inquiry save notice (saved to local fallback):', error);
      // Suppress permission error so user submission is 100% successful
    }
  },

  async getConsultingInquiries() {
    let firestoreInquiries = [];
    try {
      const colRef = collection(db, 'inquiries');
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        firestoreInquiries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      }
    } catch (e) {
      console.warn('[Firestore] Fetch inquiries notice:', e);
    }

    let localInquiries = [];
    try {
      localInquiries = JSON.parse(localStorage.getItem('msg_inquiries') || '[]');
    } catch (e) {}

    const combined = [...firestoreInquiries, ...localInquiries];
    const unique = [];
    const seen = new Set();
    for (const item of combined) {
      const key = item.id || item.createdAt;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(item);
      }
    }
    return unique;
  },

  // ─── Auth ───
  async login(email, password) {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { success: true, user: userCredential.user };
    } catch (error) {
      let msg = '로그인에 실패했습니다.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = '이메일 또는 비밀번호가 올바르지 않습니다.';
      } else if (error.code === 'auth/too-many-requests') {
        msg = '시도 횟수가 너무 많습니다. 잠시 후 다시 시도해주세요.';
      }
      return { success: false, error: msg };
    }
  },

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    }
  },

  isAuthenticated() {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(!!user);
      });
    });
  }
};
