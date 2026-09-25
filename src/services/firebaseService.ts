import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  onSnapshot,
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { CalendarEvent } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

const EVENTS_COLLECTION = 'events';

// Fetch all patrol events from Firestore
export async function getFirestoreEvents(): Promise<CalendarEvent[]> {
  try {
    const snapshot = await getDocs(collection(db, EVENTS_COLLECTION));
    return snapshot.docs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || '',
        description: data.description,
        location: data.location,
        start: data.start,
        end: data.end,
        hasTime: data.hasTime,
        category: data.category || 'adunare',
      } as CalendarEvent;
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, EVENTS_COLLECTION);
  }
}

// Save or sync event to Firestore
export async function saveFirestoreEvent(event: CalendarEvent): Promise<void> {
  const eventRef = doc(db, EVENTS_COLLECTION, event.id);
  const data: Record<string, any> = {
    title: event.title,
    start: event.start,
    category: event.category || 'adunare',
    createdAt: new Date().toISOString(),
  };

  if (event.description) data.description = event.description;
  if (event.location) data.location = event.location;
  if (event.end) data.end = event.end;
  if (event.hasTime !== undefined) data.hasTime = event.hasTime;

  try {
    await setDoc(eventRef, data, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${EVENTS_COLLECTION}/${event.id}`);
  }
}

// Delete event from Firestore
export async function deleteFirestoreEvent(eventId: string): Promise<void> {
  const eventRef = doc(db, EVENTS_COLLECTION, eventId);
  try {
    await deleteDoc(eventRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${EVENTS_COLLECTION}/${eventId}`);
  }
}

// Real-time listener for events
export function subscribeToFirestoreEvents(
  callback: (events: CalendarEvent[]) => void
): () => void {
  const colRef = collection(db, EVENTS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      const events = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          title: data.title || '',
          description: data.description,
          location: data.location,
          start: data.start,
          end: data.end,
          hasTime: data.hasTime,
          category: data.category || 'adunare',
        } as CalendarEvent;
      });
      callback(events);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, EVENTS_COLLECTION);
    }
  );
}
