import React, { createContext, useContext, useEffect, useState } from "react";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithPopup,
  User as FirebaseUser 
} from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "../firebase";

export interface UserData {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'faculty' | 'admin';
  createdAt: any;
  photoURL?: string;
}

interface AuthContextType {
  user: FirebaseUser | null;
  userData: UserData | null;
  loading: boolean;
  loginWithEmail: (email: string, password: string) => Promise<any>;
  registerWithEmail: (email: string, password: string, displayName: string, role: 'student' | 'faculty' | 'admin') => Promise<any>;
  loginWithGoogle: () => Promise<any>;
  logout: () => Promise<void>;
  setUserRole: (uid: string, role: 'student' | 'faculty' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // Sync auth user with Firestore user doc
  const fetchUserData = async (firebaseUser: FirebaseUser) => {
    try {
      const userRef = doc(db, "users", firebaseUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        setUserData(userSnap.data() as UserData);
      } else {
        // If Google sign-in is used and no doc exists yet, we create a student record by default
        // The user can change or we prompt them, or admin can re-assign.
        const defaultRole: 'student' | 'faculty' | 'admin' = 
          firebaseUser.email?.endsWith("@admin.com") ? "admin" : 
          firebaseUser.email?.endsWith("@faculty.edu") ? "faculty" : "student";

        const newUserData: UserData = {
          uid: firebaseUser.uid,
          email: firebaseUser.email || "",
          displayName: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "User",
          role: defaultRole,
          createdAt: serverTimestamp(),
          photoURL: firebaseUser.photoURL || ""
        };

        await setDoc(userRef, newUserData);
        setUserData(newUserData);
      }
    } catch (err) {
      console.error("Error fetching user data from Firestore:", err);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchUserData(firebaseUser);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  const registerWithEmail = async (
    email: string, 
    password: string, 
    displayName: string, 
    role: 'student' | 'faculty' | 'admin'
  ) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, "users", cred.user.uid);
    const newUserData: UserData = {
      uid: cred.user.uid,
      email,
      displayName,
      role,
      createdAt: serverTimestamp(),
      photoURL: ""
    };
    await setDoc(userRef, newUserData);
    setUserData(newUserData);
    return cred;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await fetchUserData(cred.user);
    return cred;
  };

  const logout = () => {
    return signOut(auth);
  };

  const setUserRole = async (uid: string, role: 'student' | 'faculty' | 'admin') => {
    const userRef = doc(db, "users", uid);
    await setDoc(userRef, { role }, { merge: true });
    if (user?.uid === uid && userData) {
      setUserData({ ...userData, role });
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      userData,
      loading,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      logout,
      setUserRole
    }}>
      {children}
    </AuthContext.Provider>
  );
};
