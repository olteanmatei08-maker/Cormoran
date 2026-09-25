import { doc, getDoc, setDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';

export interface ScoutBadge {
  id: string;
  name: string;
  category: 'supravietuire' | 'orientare' | 'comunitate' | 'natura' | 'patrula';
  earnedDate?: string;
  status: 'obtinut' | 'in_lucru' | 'neinceput';
}

export interface UserProgressData {
  uid: string;
  email: string;
  displayName: string;
  stage: string; // Ex: Cercetaș, Explorator, etc.
  patrolRole?: string;
  completedTasks: string[]; // List of completed task/skill IDs
  badges: ScoutBadge[];
  scoutRankPoints: number;
  personalNotes?: string;
  updatedAt: string;
}

const DEFAULT_BADGES: ScoutBadge[] = [
  { id: 'orientare_harta', name: 'Orientare cu Harta și Busola', category: 'orientare', status: 'neinceput' },
  { id: 'noduri_pionierat', name: 'Noduri și Pionierat', category: 'supravietuire', status: 'neinceput' },
  { id: 'foc_adapost', name: 'Foc și Construcție Adăpost', category: 'supravietuire', status: 'neinceput' },
  { id: 'prim_ajutor_baza', name: 'Prim Ajutor de Bază', category: 'comunitate', status: 'neinceput' },
  { id: 'flora_fauna', name: 'Flora și Fauna Deltei / Pădurii', category: 'natura', status: 'neinceput' },
  { id: 'spirit_patrula', name: 'Spirit de Patrulă Cormoran', category: 'patrula', status: 'neinceput' },
];

function getCacheKey(uid: string): string {
  return `cormo_user_progress_${uid}`;
}

export function getDefaultProgress(uid: string, email = '', displayName = ''): UserProgressData {
  return {
    uid,
    email,
    displayName: displayName || email.split('@')[0] || 'Cercetaș',
    stage: 'Cercetaș',
    patrolRole: 'Membru Patrula Cormoran',
    completedTasks: [],
    badges: DEFAULT_BADGES,
    scoutRankPoints: 0,
    personalNotes: '',
    updatedAt: new Date().toISOString(),
  };
}

/**
 * Reads user progress from local cache if present
 */
export function getCachedUserProgress(uid: string): UserProgressData | null {
  try {
    const raw = localStorage.getItem(getCacheKey(uid));
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read cached progress:', err);
  }
  return null;
}

/**
 * Saves user progress to Firestore and local cache
 */
export async function saveUserProgress(
  uid: string,
  progressUpdates: Partial<UserProgressData>,
  fallbackEmail = '',
  fallbackName = ''
): Promise<UserProgressData> {
  const existing = getCachedUserProgress(uid) || getDefaultProgress(uid, fallbackEmail, fallbackName);
  
  const merged: UserProgressData = {
    ...existing,
    ...progressUpdates,
    uid,
    updatedAt: new Date().toISOString(),
  };

  // 1. Save to local cache immediately
  try {
    localStorage.setItem(getCacheKey(uid), JSON.stringify(merged));
  } catch (err) {
    console.warn('Could not cache user progress:', err);
  }

  // 2. Persist to Firestore /user_progress/{uid}
  try {
    const progressRef = doc(db, 'user_progress', uid);
    await setDoc(progressRef, merged, { merge: true });
  } catch (err) {
    console.error('Error saving progress to Firestore:', err);
  }

  return merged;
}

/**
 * Fetches user progress from Firestore with fallback to cache or default
 */
export async function fetchUserProgress(
  uid: string,
  email = '',
  displayName = ''
): Promise<UserProgressData> {
  const cached = getCachedUserProgress(uid);

  try {
    const progressRef = doc(db, 'user_progress', uid);
    const snap = await getDoc(progressRef);

    if (snap.exists()) {
      const data = snap.data() as UserProgressData;
      const combined: UserProgressData = {
        ...getDefaultProgress(uid, email, displayName),
        ...data,
      };
      localStorage.setItem(getCacheKey(uid), JSON.stringify(combined));
      return combined;
    } else {
      // Document does not exist yet -> create initial progress in Firestore
      const initial = cached || getDefaultProgress(uid, email, displayName);
      await setDoc(progressRef, initial, { merge: true });
      localStorage.setItem(getCacheKey(uid), JSON.stringify(initial));
      return initial;
    }
  } catch (err) {
    console.warn('Error fetching progress from Firestore, falling back to local cache:', err);
    return cached || getDefaultProgress(uid, email, displayName);
  }
}

/**
 * Subscribes to real-time changes of the user's progress across devices
 */
export function subscribeToUserProgress(
  uid: string,
  email = '',
  displayName = '',
  onUpdate: (progress: UserProgressData) => void
): Unsubscribe {
  // Immediately emit cached or default data so UI does not wait
  const cached = getCachedUserProgress(uid) || getDefaultProgress(uid, email, displayName);
  onUpdate(cached);

  const progressRef = doc(db, 'user_progress', uid);
  return onSnapshot(
    progressRef,
    (snap) => {
      if (snap.exists()) {
        const data = snap.data() as UserProgressData;
        const combined: UserProgressData = {
          ...getDefaultProgress(uid, email, displayName),
          ...data,
        };
        try {
          localStorage.setItem(getCacheKey(uid), JSON.stringify(combined));
        } catch (e) {
          // ignore cache error
        }
        onUpdate(combined);
      } else {
        // If not in firestore yet, save initial state
        const initial = getDefaultProgress(uid, email, displayName);
        setDoc(progressRef, initial, { merge: true }).catch(console.warn);
        onUpdate(initial);
      }
    },
    (err) => {
      console.warn('Real-time progress subscription error:', err);
    }
  );
}
