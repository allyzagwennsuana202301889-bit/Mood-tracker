import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  deleteUser,
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  updateProfile,
  updatePassword as fbUpdatePassword,
  verifyBeforeUpdateEmail,
  Auth,
} from 'firebase/auth';
import * as FirebaseAuth from 'firebase/auth';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  Firestore,
  getFirestore,
  onSnapshot,
  orderBy,
  query,
  setDoc,
} from 'firebase/firestore';
import { ChatMessage, MoodEntry, NoteFolder, NoteItem } from '../models';
import { MoodId } from '../theme';

interface BackendContextValue {
  firebaseEnabled: boolean;
  signedIn: boolean;
  username: string;
  email: string;
  latestMood: MoodId;
  dailyReminder: boolean;
  moods: MoodEntry[];
  messages: ChatMessage[];
  folders: NoteFolder[];
  notes: NoteItem[];
  signIn: (email: string, pass: string) => Promise<string | null>;
  signUp: (email: string, pass: string, name: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  logMood: (mood: MoodId) => Promise<void>;
  addMessage: (text: string, isUser: boolean) => Promise<void>;
  addFolder: (name: string) => Promise<void>;
  saveNote: (note: Omit<NoteItem, 'updatedAt'>) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  updateUsername: (next: string) => Promise<string | null>;
  updateEmail: (next: string) => Promise<string | null>;
  updatePassword: (next: string) => Promise<string | null>;
  deleteAccount: () => Promise<string | null>;
  submitFeedback: (text: string) => Promise<void>;
  setDailyReminder: (v: boolean) => void;
}

const BackendContext = createContext<BackendContextValue | null>(null);

function seedDemo() {
  const now = Date.now();
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  return {
    moods: [
      { id: 'm1', mood: 'happy' as MoodId, createdAt: new Date(now - 10 * min).toISOString() },
      { id: 'm2', mood: 'neutral' as MoodId, createdAt: new Date(now - 20 * min).toISOString() },
      { id: 'm3', mood: 'sad' as MoodId, createdAt: new Date(now - 30 * min).toISOString() },
      { id: 'm4', mood: 'angry' as MoodId, createdAt: new Date(now - day).toISOString() },
      { id: 'm5', mood: 'happy' as MoodId, createdAt: new Date(now - 2 * day).toISOString() },
      { id: 'm6', mood: 'calm' as MoodId, createdAt: new Date(now - 3 * day).toISOString() },
    ],
    messages: [
      {
        id: 'c1',
        text: "You're going through a lot, but I know you're going to be okay.",
        isUser: false,
        createdAt: new Date(now - 2 * hr).toISOString(),
      },
      {
        id: 'c2',
        text: 'Tell me the truth, ok?',
        isUser: true,
        createdAt: new Date(now - 95 * min).toISOString(),
      },
      {
        id: 'c3',
        text: "Always. Take one breath at a time—what's weighing on you most?",
        isUser: false,
        createdAt: new Date(now - 94 * min).toISOString(),
      },
    ],
    folders: [
      { id: 'f1', name: 'Sched' },
      { id: 'f2', name: 'Reminders' },
      { id: 'f3', name: 'Diary' },
      { id: 'f4', name: 'Tips' },
    ],
    notes: [
      {
        id: 'n1',
        title: 'Dear Diary',
        body: 'Today felt lighter after taking a walk outside.',
        folderId: 'f3',
        updatedAt: new Date(now - 3 * day).toISOString(),
      },
      {
        id: 'n2',
        title: 'Doctors Appointment',
        body: 'Check-up at 10:30 AM. Bring prescription list.',
        folderId: 'f1',
        updatedAt: new Date(now - day).toISOString(),
      },
      {
        id: 'n3',
        title: 'Medicine Reminder',
        body: 'Take morning vitamins after breakfast.',
        folderId: 'f2',
        updatedAt: new Date(now - 5 * hr).toISOString(),
      },
      {
        id: 'n4',
        title: 'Meditation',
        body: '4-7-8 breathing for 3 minutes when feeling anxious.',
        folderId: 'f4',
        updatedAt: new Date(now - 2 * hr).toISOString(),
      },
    ],
  };
}

let fbAuth: Auth | null = null;
let fbDb: Firestore | null = null;

function initFirebaseIfConfigured(): boolean {
  const apiKey = (process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '').trim();
  const projectId = (process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '').trim();
  const appId = (process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '').trim();
  if (!apiKey || apiKey.startsWith('your_') || !projectId || projectId.startsWith('your_')) {
    return false;
  }
  try {
    const app =
      getApps()[0] ??
      initializeApp({
        apiKey,
        authDomain: (process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '').trim(),
        projectId,
        storageBucket: (process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '').trim(),
        messagingSenderId: (process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '').trim(),
        appId,
      });
    if (Platform.OS === 'web') {
      fbAuth = getAuth(app);
    } else {
      try {
        const getRNPersistence = (FirebaseAuth as any).getReactNativePersistence;
        fbAuth = getRNPersistence
          ? initializeAuth(app, {
              persistence: getRNPersistence(ReactNativeAsyncStorage),
            })
          : getAuth(app);
      } catch {
        // Fast Refresh: auth already initialized for this app instance.
        fbAuth = getAuth(app);
      }
    }
    fbDb = getFirestore(app);
    return true;
  } catch {
    return false;
  }
}

export function BackendProvider({ children }: { children: React.ReactNode }) {
  const [firebaseEnabled] = useState(() => initFirebaseIfConfigured());
  const demo = seedDemo();

  const [signedIn, setSignedIn] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [username, setUsername] = useState('Friend');
  const [email, setEmail] = useState('');
  const [dailyReminder, setDailyReminder] = useState(true);
  const [moods, setMoods] = useState<MoodEntry[]>(firebaseEnabled ? [] : demo.moods);
  const [messages, setMessages] = useState<ChatMessage[]>(firebaseEnabled ? [] : demo.messages);
  const [folders, setFolders] = useState<NoteFolder[]>(firebaseEnabled ? [] : demo.folders);
  const [notes, setNotes] = useState<NoteItem[]>(firebaseEnabled ? [] : demo.notes);

  useEffect(() => {
    if (!firebaseEnabled || !fbAuth || !fbDb) return;
    let unsubs: Array<() => void> = [];

    const unsubAuth = onAuthStateChanged(fbAuth, (user) => {
      unsubs.forEach((u) => u());
      unsubs = [];
      if (!user) {
        setSignedIn(false);
        setUid(null);
        setEmail('');
        setUsername('Friend');
        setMoods([]);
        setMessages([]);
        setFolders([]);
        setNotes([]);
        return;
      }
      setSignedIn(true);
      setUid(user.uid);
      setEmail(user.email ?? '');
      setUsername(user.displayName?.trim() || (user.email ?? 'Friend').split('@')[0]);

      const db = fbDb!;
      unsubs.push(
        onSnapshot(
          query(collection(db, 'users', user.uid, 'moods'), orderBy('createdAt', 'desc')),
          (snap) => setMoods(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
        ),
        onSnapshot(
          query(collection(db, 'users', user.uid, 'messages'), orderBy('createdAt', 'asc')),
          (snap) => setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
        ),
        onSnapshot(
          query(collection(db, 'users', user.uid, 'folders'), orderBy('name', 'asc')),
          (snap) => {
            const list = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
            setFolders(list);
            if (list.length === 0) {
              ['Sched', 'Reminders', 'Diary', 'Tips'].forEach((name) =>
                addDoc(collection(db, 'users', user.uid, 'folders'), { name })
              );
            }
          }
        ),
        onSnapshot(
          query(collection(db, 'users', user.uid, 'notes'), orderBy('updatedAt', 'desc')),
          (snap) => setNotes(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
        )
      );
    });

    return () => {
      unsubAuth();
      unsubs.forEach((u) => u());
    };
  }, [firebaseEnabled]);

  const value: BackendContextValue = {
    firebaseEnabled,
    signedIn,
    username,
    email,
    latestMood: moods[0]?.mood ?? 'happy',
    dailyReminder,
    moods,
    messages,
    folders,
    notes,
    setDailyReminder,

    async signIn(userEmail, pass) {
      if (!userEmail.trim() || !pass) return 'Enter your email and password.';
      if (!firebaseEnabled || !fbAuth) {
        setEmail(userEmail.trim());
        setUsername(userEmail.trim().split('@')[0] || 'Friend');
        setSignedIn(true);
        return null;
      }
      try {
        await signInWithEmailAndPassword(fbAuth, userEmail.trim(), pass);
        return null;
      } catch (e: any) {
        return e?.message ?? 'Sign in failed.';
      }
    },

    async signUp(userEmail, pass, name) {
      if (!userEmail.trim() || pass.length < 6) {
        return 'Enter a valid email and a password of at least 6 characters.';
      }
      if (!firebaseEnabled || !fbAuth) {
        setEmail(userEmail.trim());
        setUsername(name.trim() || userEmail.trim().split('@')[0] || 'Friend');
        setSignedIn(true);
        return null;
      }
      try {
        const cred = await createUserWithEmailAndPassword(fbAuth, userEmail.trim(), pass);
        if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
        return null;
      } catch (e: any) {
        return e?.message ?? 'Sign up failed.';
      }
    },

    async signOut() {
      if (firebaseEnabled && fbAuth) await fbSignOut(fbAuth);
      else setSignedIn(false);
    },

    async logMood(mood) {
      const entry = { mood, createdAt: new Date().toISOString() };
      if (firebaseEnabled && fbDb && uid) {
        await addDoc(collection(fbDb, 'users', uid, 'moods'), entry);
      } else {
        setMoods((prev) => [{ id: String(Date.now()), ...entry }, ...prev]);
      }
    },

    async addMessage(text, isUser) {
      const msg = { text, isUser, createdAt: new Date().toISOString() };
      if (firebaseEnabled && fbDb && uid) {
        await addDoc(collection(fbDb, 'users', uid, 'messages'), msg);
      } else {
        setMessages((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, ...msg }]);
      }
    },

    async addFolder(name) {
      const clean = name.trim();
      if (!clean) return;
      if (firebaseEnabled && fbDb && uid) {
        await addDoc(collection(fbDb, 'users', uid, 'folders'), { name: clean });
      } else {
        setFolders((prev) => [...prev, { id: String(Date.now()), name: clean }]);
      }
    },

    async saveNote(note) {
      const payload = { ...note, updatedAt: new Date().toISOString() };
      if (firebaseEnabled && fbDb && uid) {
        const { id, ...rest } = payload;
        if (!id) await addDoc(collection(fbDb, 'users', uid, 'notes'), rest);
        else await setDoc(doc(fbDb, 'users', uid, 'notes', id), rest);
      } else {
        const id = note.id || String(Date.now());
        setNotes((prev) => [{ ...payload, id }, ...prev.filter((n) => n.id !== id)]);
      }
    },

    async deleteNote(id) {
      if (firebaseEnabled && fbDb && uid) {
        await deleteDoc(doc(fbDb, 'users', uid, 'notes', id));
      } else {
        setNotes((prev) => prev.filter((n) => n.id !== id));
      }
    },

    async updateUsername(next) {
      const clean = next.trim();
      if (!clean) return 'Username cannot be empty.';
      if (firebaseEnabled && fbAuth?.currentUser) {
        try {
          await updateProfile(fbAuth.currentUser, { displayName: clean });
        } catch (e: any) {
          return e?.message ?? 'Could not update username.';
        }
      }
      setUsername(clean);
      return null;
    },

    async updateEmail(next) {
      const clean = next.trim();
      if (!clean.includes('@')) return 'Enter a valid email.';
      if (firebaseEnabled && fbAuth?.currentUser) {
        try {
          await verifyBeforeUpdateEmail(fbAuth.currentUser, clean);
        } catch (e: any) {
          return e?.message ?? 'Could not update email.';
        }
      }
      setEmail(clean);
      return null;
    },

    async updatePassword(next) {
      if (next.length < 6) return 'Password must be at least 6 characters.';
      if (firebaseEnabled && fbAuth?.currentUser) {
        try {
          await fbUpdatePassword(fbAuth.currentUser, next);
        } catch (e: any) {
          return e?.message ?? 'Could not update password.';
        }
      }
      return null;
    },

    async deleteAccount() {
      if (firebaseEnabled && fbAuth?.currentUser && fbDb && uid) {
        try {
          await deleteDoc(doc(fbDb, 'users', uid));
          await deleteUser(fbAuth.currentUser);
          return null;
        } catch (e: any) {
          return e?.message ?? 'Re-login required before deleting your account.';
        }
      }
      setSignedIn(false);
      return null;
    },

    async submitFeedback(text) {
      if (!text.trim()) return;
      if (firebaseEnabled && fbDb && uid) {
        await addDoc(collection(fbDb, 'feedback'), {
          uid,
          text: text.trim(),
          createdAt: new Date().toISOString(),
        });
      }
    },
  };

  return <BackendContext.Provider value={value}>{children}</BackendContext.Provider>;
}

export function useBackend(): BackendContextValue {
  const ctx = useContext(BackendContext);
  if (!ctx) throw new Error('useBackend must be used inside BackendProvider');
  return ctx;
}
