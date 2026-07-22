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

// ─── Default Data (used for initial seeding if DB is empty) ────────────
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
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error(`Error fetching collection ${colName}:`, error);
    return [];
  }
}

async function saveDocument(colName, item) {
  try {
    const docRef = doc(db, colName, item.id);
    await setDoc(docRef, item);
  } catch (error) {
    console.error(`Error saving to ${colName}:`, error);
  }
}

async function deleteDocument(colName, id) {
  try {
    const docRef = doc(db, colName, id);
    await deleteDoc(docRef);
  } catch (error) {
    console.error(`Error deleting from ${colName}:`, error);
  }
}

// ─── Public API ─────────────────────────────────────────────────────────

export const dataService = {
  // ─── Curations ───
  async getCurations() {
    return await fetchCollection('curations');
  },
  async saveCuration(item) {
    await saveDocument('curations', item);
  },
  async deleteCuration(id) {
    await deleteDocument('curations', id);
  },

  // ─── Guidebooks ───
  async getGuidebooks() {
    return await fetchCollection('guidebooks');
  },
  async saveGuidebook(item) {
    await saveDocument('guidebooks', item);
  },
  async deleteGuidebook(id) {
    await deleteDocument('guidebooks', id);
  },

  // ─── Testimonials ───
  async getTestimonials() {
    return await fetchCollection('testimonials');
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
        return docSnap.data();
      } else {
        // Return default if empty
        return DEFAULT_SITE_SETTINGS;
      }
    } catch (error) {
      console.error('Error fetching site settings:', error);
      return DEFAULT_SITE_SETTINGS;
    }
  },
  async saveSiteSettings(data) {
    try {
      const docRef = doc(db, 'settings', 'site');
      await setDoc(docRef, data);
    } catch (error) {
      console.error('Error saving site settings:', error);
    }
  },

  // ─── Secret Pins ───
  async getSecretPins() {
    return DEFAULT_SECRET_PINS; // Keeping this static or load from DB if needed
  },

  // ─── Consulting Inquiries ───
  async saveConsultingInquiry(data) {
    try {
      const colRef = collection(db, 'inquiries');
      data.createdAt = new Date().toISOString();
      await addDoc(colRef, data);
    } catch (error) {
      console.error('Error saving inquiry:', error);
      throw error;
    }
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
      }
      return { success: false, error: msg };
    }
  },

  async logout() {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error logging out:', error);
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
