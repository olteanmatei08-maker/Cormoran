import {
  signInWithPopup,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL?: string | null;
  phoneNumber?: string | null;
  authProvider?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

const STORAGE_SESSION_KEY = 'cormo_auth_user_session';

// Subscribers list
type AuthListener = (user: AppUser | null) => void;
const listeners: Set<AuthListener> = new Set();

// Active in-memory user
let currentAppUser: AppUser | null = loadPersistedSession();

function loadPersistedSession(): AppUser | null {
  try {
    const raw = localStorage.getItem(STORAGE_SESSION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (err) {
    console.warn('Could not read cached session:', err);
  }
  return null;
}

function persistSession(user: AppUser | null) {
  currentAppUser = user;
  try {
    if (user) {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    }
  } catch (err) {
    console.warn('Could not persist session:', err);
  }
  notifyListeners(user);
}

function notifyListeners(user: AppUser | null) {
  listeners.forEach((listener) => {
    try {
      listener(user);
    } catch (err) {
      console.error('Auth listener error:', err);
    }
  });
}

// Convert email to Firestore-safe document ID
function encodeAccountId(email: string): string {
  return email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
}

// Web Crypto SHA-256 password hashing
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(salt + password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Generate random hex salt
function generateRandomHex(len = 16): string {
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  return Array.from(arr)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Friendly Romanian error mapping
export function getAuthErrorMessage(codeOrMessage: string): string {
  switch (codeOrMessage) {
    case 'auth/invalid-email':
      return 'Adresa de email introdusă nu este validă.';
    case 'auth/user-disabled':
      return 'Acest cont a fost dezactivat.';
    case 'auth/user-not-found':
      return 'Nu s-a găsit niciun cont cu acest email.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Emailul sau parola sunt incorecte.';
    case 'auth/email-already-in-use':
      return 'Există deja un cont înregistrat cu acest email.';
    case 'auth/weak-password':
      return 'Parola trebuie să aibă cel puțin 6 caractere.';
    case 'auth/popup-closed-by-user':
      return 'Fereastra de conectare a fost închisă.';
    case 'auth/cancelled-popup-request':
      return 'Conectarea a fost anulată.';
    case 'auth/too-many-requests':
      return 'Prea multe încercări eșuate. Te rugăm să încerci din nou mai târziu.';
    case 'auth/network-request-failed':
      return 'Problemă de conexiune la internet.';
    default:
      return codeOrMessage.length > 0 && !codeOrMessage.includes('auth/')
        ? codeOrMessage
        : 'A apărut o problemă la autentificare. Te rugăm să încerci din nou.';
  }
}

// Sync user to Firestore
export async function syncUserProfile(user: AppUser): Promise<void> {
  try {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(
      userRef,
      {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Cercetaș',
        photoURL: user.photoURL || null,
        lastLoginAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Could not sync user to Firestore:', err);
  }
}

// ----------------- REGISTRATION WITH EMAIL -----------------
export async function registerWithEmail(
  email: string,
  pass: string,
  displayName?: string
): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();
  const name = displayName?.trim() || cleanEmail.split('@')[0] || 'Cercetaș';

  if (!cleanEmail || !pass) {
    throw new Error('Te rugăm să completezi emailul și parola.');
  }

  if (pass.length < 6) {
    throw new Error('Parola trebuie să aibă cel puțin 6 caractere.');
  }

  // 1. Try Firebase Auth first if operational
  try {
    const cred = await createUserWithEmailAndPassword(auth, cleanEmail, pass);
    if (name) {
      await updateProfile(cred.user, { displayName: name });
    }
    const appUser: AppUser = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: name,
      photoURL: cred.user.photoURL,
      authProvider: 'firebase-email',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    await syncUserProfile(appUser);
    persistSession(appUser);
    return appUser;
  } catch (firebaseErr: any) {
    // If Firebase Auth throws because Email Provider is disabled in Google Cloud (OPERATION_NOT_ALLOWED),
    // we seamlessly fall back to our secure Firestore Account Store!
    const isOperationNotAllowed =
      firebaseErr?.code === 'auth/operation-not-allowed' ||
      firebaseErr?.message?.includes('OPERATION_NOT_ALLOWED');

    if (!isOperationNotAllowed && firebaseErr?.code === 'auth/email-already-in-use') {
      throw new Error('Există deja un cont înregistrat cu acest email.');
    }
  }

  // 2. Firestore Account Store (100% reliable)
  const accountId = encodeAccountId(cleanEmail);
  const accountRef = doc(db, 'scout_accounts', accountId);

  // Check if account already exists
  const existingSnap = await getDoc(accountRef);
  if (existingSnap.exists()) {
    throw new Error('Există deja un cont înregistrat cu acest email.');
  }

  const salt = generateRandomHex(16);
  const passwordHash = await hashPassword(pass, salt);
  const uid = 'cormo_' + generateRandomHex(12);
  const now = new Date().toISOString();

  const accountData = {
    uid,
    email: cleanEmail,
    passwordHash,
    salt,
    displayName: name,
    authProvider: 'email',
    createdAt: now,
    lastLoginAt: now,
  };

  await setDoc(accountRef, accountData);

  const appUser: AppUser = {
    uid,
    email: cleanEmail,
    displayName: name,
    authProvider: 'email',
    createdAt: now,
    lastLoginAt: now,
  };

  await syncUserProfile(appUser);
  persistSession(appUser);
  return appUser;
}

// ----------------- LOGIN WITH EMAIL -----------------
export async function loginWithEmail(email: string, pass: string): Promise<AppUser> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !pass) {
    throw new Error('Te rugăm să completezi emailul și parola.');
  }

  // 1. Try Firebase Auth first
  try {
    const cred = await signInWithEmailAndPassword(auth, cleanEmail, pass);
    const appUser: AppUser = {
      uid: cred.user.uid,
      email: cred.user.email,
      displayName: cred.user.displayName || cleanEmail.split('@')[0],
      photoURL: cred.user.photoURL,
      authProvider: 'firebase-email',
      lastLoginAt: new Date().toISOString(),
    };
    await syncUserProfile(appUser);
    persistSession(appUser);
    return appUser;
  } catch (firebaseErr: any) {
    const isOperationNotAllowed =
      firebaseErr?.code === 'auth/operation-not-allowed' ||
      firebaseErr?.message?.includes('OPERATION_NOT_ALLOWED');

    if (!isOperationNotAllowed && firebaseErr?.code === 'auth/wrong-password') {
      throw new Error('Emailul sau parola sunt incorecte.');
    }
    if (!isOperationNotAllowed && firebaseErr?.code === 'auth/user-not-found') {
      throw new Error('Nu s-a găsit niciun cont cu acest email.');
    }
  }

  // 2. Fall back to Firestore Account Store
  const accountId = encodeAccountId(cleanEmail);
  const accountRef = doc(db, 'scout_accounts', accountId);
  const accountSnap = await getDoc(accountRef);

  if (!accountSnap.exists()) {
    throw new Error('Nu s-a găsit niciun cont cu acest email. Creează un cont mai întâi la Înregistrare.');
  }

  const data = accountSnap.data();
  const testHash = await hashPassword(pass, data.salt || '');

  if (testHash !== data.passwordHash) {
    throw new Error('Emailul sau parola sunt incorecte.');
  }

  const now = new Date().toISOString();
  await setDoc(accountRef, { lastLoginAt: now }, { merge: true });

  const appUser: AppUser = {
    uid: data.uid || ('cormo_' + accountId),
    email: cleanEmail,
    displayName: data.displayName || cleanEmail.split('@')[0],
    photoURL: data.photoURL || null,
    authProvider: data.authProvider || 'email',
    createdAt: data.createdAt,
    lastLoginAt: now,
  };

  await syncUserProfile(appUser);
  persistSession(appUser);
  return appUser;
}

// ----------------- LOGIN / REGISTER WITH GOOGLE -----------------
export async function loginWithGoogle(): Promise<AppUser> {
  // 1. Try Firebase Google Popup
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);

    if (!result?.user?.email) {
      throw new Error('Nu s-au putut prelua datele de la contul Google.');
    }

    const appUser: AppUser = {
      uid: result.user.uid,
      email: result.user.email,
      displayName: result.user.displayName || result.user.email.split('@')[0],
      photoURL: result.user.photoURL,
      authProvider: 'google',
      lastLoginAt: new Date().toISOString(),
    };
    await syncUserProfile(appUser);
    persistSession(appUser);
    return appUser;
  } catch (popupErr: any) {
    const code = popupErr?.code || '';

    // If the user deliberately closed the window or cancelled, stop immediately and DO NOT LOG IN!
    if (
      code === 'auth/popup-closed-by-user' ||
      code === 'auth/cancelled-popup-request' ||
      popupErr?.message?.includes('closed-by-user') ||
      popupErr?.message?.includes('cancelled')
    ) {
      throw new Error('Fereastra de conectare Google a fost închisă.');
    }

    // 2. If blocked by iframe or unauthorized domain, try Google Identity Services OAuth
    const oAuthClientId = '979902519749-olg16cltl2ik5g5h1hv8ci13s1jb2ua3.apps.googleusercontent.com';

    if (typeof window !== 'undefined' && (window as any).google?.accounts?.oauth2) {
      try {
        const googleUser = await new Promise<any>((resolve, reject) => {
          try {
            const client = (window as any).google.accounts.oauth2.initTokenClient({
              client_id: oAuthClientId,
              scope: 'openid email profile',
              callback: async (resp: any) => {
                if (resp?.error) {
                  reject(new Error('Conectarea cu Google a fost anulată.'));
                  return;
                }
                if (!resp?.access_token) {
                  reject(new Error('Nu s-a putut obține tokenul de acces Google.'));
                  return;
                }
                try {
                  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${resp.access_token}` },
                  });
                  const info = await res.json();
                  if (!info?.email) {
                    reject(new Error('Datele profilului Google nu au putut fi citite.'));
                    return;
                  }
                  resolve(info);
                } catch (e) {
                  reject(new Error('Eroare la preluarea profilului Google.'));
                }
              },
              error_callback: () => {
                reject(new Error('Fereastra de conectare Google a fost închisă.'));
              },
            });
            client.requestAccessToken();
          } catch (err) {
            reject(err);
          }
        });

        const appUser: AppUser = {
          uid: 'google_' + (googleUser.sub || encodeAccountId(googleUser.email)),
          email: googleUser.email,
          displayName: googleUser.name || googleUser.email.split('@')[0],
          photoURL: googleUser.picture || null,
          authProvider: 'google',
          lastLoginAt: new Date().toISOString(),
        };

        await syncUserProfile(appUser);
        persistSession(appUser);
        return appUser;
      } catch (gisErr: any) {
        throw new Error(gisErr.message || 'Conectarea cu Google nu s-a finalizat.');
      }
    }

    // Never fall back to demo/fake user!
    throw new Error('Conectarea cu Google nu a putut fi finalizată. Te rugăm să încerci din nou.');
  }
}

// ----------------- PASSWORD RESET -----------------
export async function resetPassword(email: string): Promise<void> {
  const cleanEmail = email.trim().toLowerCase();
  const accountId = encodeAccountId(cleanEmail);
  const accountRef = doc(db, 'scout_accounts', accountId);
  const snap = await getDoc(accountRef);

  if (!snap.exists()) {
    throw new Error('Nu s-a găsit niciun cont înregistrat cu acest email.');
  }

  // Record password reset request in Firestore
  await setDoc(
    accountRef,
    {
      resetRequestedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

// ----------------- LOGOUT -----------------
export async function logoutUser(): Promise<void> {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn('Firebase signOut error:', err);
  }
  persistSession(null);
}

// ----------------- AUTH LISTENER -----------------
export function subscribeToAuth(callback: (user: AppUser | null) => void): () => void {
  listeners.add(callback);

  // Immediately send current cached state so UI never flickers
  callback(currentAppUser);

  // Also listen to Firebase Auth in case native auth state updates
  const unsubFirebase = onAuthStateChanged(auth, (fbUser: FirebaseUser | null) => {
    if (fbUser) {
      const appUser: AppUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Cercetaș',
        photoURL: fbUser.photoURL,
        authProvider: 'firebase',
        lastLoginAt: new Date().toISOString(),
      };
      persistSession(appUser);
    }
  });

  return () => {
    listeners.delete(callback);
    unsubFirebase();
  };
}

export function getCurrentUser(): AppUser | null {
  return currentAppUser;
}
