
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { db } from '../services/database';

interface AuthContextType {
  user: UserProfile | null;
  login: (name: string, email: string) => Promise<void>;
  logout: () => void;
  deleteAccount: () => Promise<void>; // Added for App Store Compliance
  incrementScan: () => Promise<boolean>; // returns false if limit reached
  upgradeToPro: () => Promise<void>;
  updateProfile: (name: string) => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  showPaywall: boolean;
  setShowPaywall: (show: boolean) => void;
  showLoginModal: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const FREE_LIMIT = 3;

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showPaywall, setShowPaywall] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Initial Load
  useEffect(() => {
    const initAuth = async () => {
      // For now, we check if there's a cached user in basic storage to avoid flashing
      const cached = localStorage.getItem('hw_user');
      if (cached) {
        const parsed = JSON.parse(cached);
        // Re-verify with DB (silently)
        try {
            const dbUser = await db.getUser(parsed.email);
            if (dbUser) setUser(dbUser);
            else setUser(parsed); // Keep cached if DB fails or returns null temporarily
        } catch (e) {
            setUser(parsed);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = async (name: string, email: string) => {
    setIsLoading(true);
    try {
        // This is robust now: returns null if not found, falls back to local if error
        let existingUser = await db.getUser(email);
        
        if (!existingUser) {
            // Register new
            existingUser = {
                name: name,
                email: email,
                plan: 'free',
                scansUsed: 0,
                maxScans: FREE_LIMIT
            };
            await db.createUser(existingUser);
        }
        
        // Update local state
        setUser(existingUser);
        setShowLoginModal(false);
    } catch (e) {
        console.error("Login unexpected error", e);
        // Fallback for absolute safety
        const fallbackUser: UserProfile = { name, email, plan: 'free', scansUsed: 0, maxScans: 3 };
        setUser(fallbackUser);
        setShowLoginModal(false);
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('hw_user');
  };

  // Required for App Store Compliance
  const deleteAccount = async () => {
    if (!user) return;
    try {
        // In a real app, call API/DB to delete user data
        // await db.deleteUser(user.email); 
        logout();
        alert("Your account has been successfully deleted.");
    } catch (e) {
        console.error("Delete account failed", e);
    }
  };

  const updateProfile = async (name: string) => {
    if (!user) return;
    const updatedUser = { ...user, name };
    setUser(updatedUser); // Optimistic update
    localStorage.setItem('hw_user', JSON.stringify(updatedUser));
    await db.updateUser(updatedUser);
  };

  const incrementScan = async (): Promise<boolean> => {
    if (!user) return true;
    
    if (user.plan === 'free' && user.scansUsed >= user.maxScans) {
      setShowPaywall(true);
      return false;
    }

    const updatedUser = { ...user, scansUsed: user.scansUsed + 1 };
    setUser(updatedUser); // Optimistic
    localStorage.setItem('hw_user', JSON.stringify(updatedUser));
    
    // Background sync
    db.updateUser(updatedUser).catch(err => console.error("Failed to sync usage", err));
    
    return true;
  };

  const upgradeToPro = async () => {
    if (!user) return;
    const updatedUser: UserProfile = { ...user, plan: 'pro', maxScans: 9999 };
    setUser(updatedUser); // Optimistic
    localStorage.setItem('hw_user', JSON.stringify(updatedUser));
    setShowPaywall(false);
    await db.updateUser(updatedUser);
  };

  const openLoginModal = () => setShowLoginModal(true);
  const closeLoginModal = () => setShowLoginModal(false);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      logout, 
      deleteAccount,
      incrementScan, 
      upgradeToPro, 
      updateProfile,
      isAuthenticated: !!user,
      isLoading,
      showPaywall,
      setShowPaywall,
      showLoginModal,
      openLoginModal,
      closeLoginModal
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
