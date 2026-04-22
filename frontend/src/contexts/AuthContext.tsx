import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService } from '@/services/auth';
import { UserProfile, UserLogin, UserSignup } from '@/types/auth'; // Import from our new types file

interface AuthContextType {
  user: UserProfile | null; // Changed from Supabase User to our UserProfile
  isAuthenticated: boolean;
  loading: boolean;
  signUp: (data: UserSignup) => Promise<{ error: Error | null }>;
  signIn: (data: UserLogin) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  profile: UserProfile | null; // Kept for backward compatibility, mapped to user
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async () => {
    try {
      const profileData = await authService.getProfile();
      setUser(profileData);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      // If profile fetch fails (e.g., 401), we should probably log out locally
      localStorage.removeItem('token');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const signUp = async (data: UserSignup) => {
    try {
      const response = await authService.signup(data);
      localStorage.setItem('token', response.access_token);
      await fetchProfile();
      return { error: null };
    } catch (error: any) {
      console.error("Signup error:", error);
      return { error: error };
    }
  };

  const signIn = async (data: UserLogin) => {
    try {
      const response = await authService.login(data);
      console.log("[AuthContext] Login response:", response);
      if (response && response.access_token) {
        localStorage.setItem('token', response.access_token);
        console.log("[AuthContext] Token stored in localStorage:", response.access_token.substring(0, 10) + "...");
        await fetchProfile();
        return { error: null };
      } else {
        console.error("[AuthContext] Login successful but no access_token in response");
        return { error: new Error("Login failed: No access token received") };
      }
    } catch (error: any) {
      console.error("Signin error:", error);
      return { error: error };
    }
  };

  const signOut = async () => {
    try {
      // Optional: call backend logout if needed, but JWTs are usually stateless
      // await authService.logout(); 
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      await authService.updateProfile(updates);
      await fetchProfile(); // Refresh to get latest data
      return { error: null };
    } catch (error: any) {
      return { error: error };
    }
  };

  const refreshProfile = async () => {
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      profile: user, // Mapping user to profile for compatibility
      loading,
      signUp,
      signIn,
      signOut,
      updateProfile,
      refreshProfile,
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
