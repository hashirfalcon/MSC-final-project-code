import { createContext, useContext, useEffect, useState } from "react";
import { doc, setDoc, getDoc, query, collection, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Simple hash function for passwords (for demo purposes)
// In production, use a proper backend for password hashing
const hashPassword = async (password) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
};

// Generate a unique user ID
const generateUserId = () => {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          setCurrentUser(user);
          await loadUserProfile(user.uid);
        }
      } catch (error) {
        console.error("Error loading user from storage:", error);
        localStorage.removeItem('currentUser');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  // Sign up with email and password
  const signup = async (email, password, displayName) => {
    try {
      // Check if user already exists
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        throw { code: "auth/email-already-in-use" };
      }

      // Hash password
      const hashedPassword = await hashPassword(password);
      
      // Generate user ID
      const uid = generateUserId();

      // Create user profile in Firestore
      const userData = {
        uid: uid,
        email: email,
        displayName: displayName || "",
        password: hashedPassword,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "users", uid), userData);

      // Set current user (without password)
      const userWithoutPassword = { ...userData };
      delete userWithoutPassword.password;
      
      setCurrentUser(userWithoutPassword);
      setUserProfile(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

      return { user: userWithoutPassword };
    } catch (error) {
      console.error("Signup error:", error);
      throw error;
    }
  };

  // Sign in with email and password
  const login = async (email, password) => {
    try {
      // Find user by email
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        throw { code: "auth/user-not-found" };
      }

      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();

      // Verify password
      const hashedPassword = await hashPassword(password);
      if (userData.password !== hashedPassword) {
        throw { code: "auth/wrong-password" };
      }

      // Set current user (without password)
      const userWithoutPassword = { ...userData };
      delete userWithoutPassword.password;
      
      setCurrentUser(userWithoutPassword);
      setUserProfile(userWithoutPassword);
      localStorage.setItem('currentUser', JSON.stringify(userWithoutPassword));

      return { user: userWithoutPassword };
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  // Sign out
  const logout = async () => {
    setCurrentUser(null);
    setUserProfile(null);
    localStorage.removeItem('currentUser');
  };

  // Update user profile
  const updateUserProfile = async (updates) => {
    if (!currentUser) return;

    try {
      const updatedData = {
        ...updates,
        updatedAt: new Date().toISOString(),
      };

      // Update Firestore profile
      await setDoc(
        doc(db, "users", currentUser.uid),
        updatedData,
        { merge: true }
      );

      // Update local state
      const updatedUser = { ...currentUser, ...updatedData };
      setCurrentUser(updatedUser);
      setUserProfile(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
    } catch (error) {
      console.error("Error updating profile:", error);
      throw error;
    }
  };

  // Load user profile from Firestore
  const loadUserProfile = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        delete userData.password; // Don't store password in state
        setUserProfile(userData);
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    updateUserProfile,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

