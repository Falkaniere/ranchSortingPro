import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../../firebase';

export type UserType = 'competitor' | 'organizer';

export async function signUp(
  name: string,
  email: string,
  password: string,
  userType: UserType = 'organizer'
): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName: name });
  await setDoc(doc(db, 'users', credential.user.uid), {
    displayName: name,
    email,
    role: 'basic',
    userType,
    createdAt: serverTimestamp(),
  });
  return credential.user;
}

export async function signIn(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(auth, googleProvider);
  const { user } = credential;
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  if (!snap.exists()) {
    // First Google login — create profile with basic role.
    // Default persona is 'organizer' (safe default; can be refined later).
    await setDoc(userRef, {
      displayName: user.displayName,
      email: user.email,
      role: 'basic',
      userType: 'organizer' as UserType,
      createdAt: serverTimestamp(),
    });
  } else {
    // Existing user — update display info only, never touch role
    await updateDoc(userRef, {
      displayName: user.displayName,
      email: user.email,
    });
  }
  return user;
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export function onAuthChange(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}
