'use client';
import { createContext, useContext, useMemo, useCallback, useEffect, useState } from 'react';
import { useUser, useClerk, useAuth as useClerkAuth } from '@clerk/nextjs';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  return (
    <AuthContext.Provider value={{}}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const { user, isLoaded, isSignedIn } = useUser();
  const { signOut } = useClerk();
  const { getToken } = useClerkAuth();
  const [dbUser, setDbUser] = useState(null);
  const [token, setToken] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  const mappedUser = useMemo(() => {
    if (!user) return null;
    return {
      id: user.id,
      clerkId: user.id,
      email: user.primaryEmailAddress?.emailAddress,
      name: user.firstName || user.username,
      loading: !isLoaded,
    };
  }, [user, isLoaded]);

  const updateUser = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setDbUser(null);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    try {
      const res = await fetch('/api/users/profile', { cache: 'no-store' });
      const data = await res.json();
      if (res.ok) {
        setDbUser(data.user || null);
      } else {
        setDbUser(null);
      }
    } catch {
      setDbUser(null);
    } finally {
      setProfileLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    updateUser();
  }, [updateUser]);

  useEffect(() => {
    let mounted = true;
    const loadToken = async () => {
      if (!isLoaded || !isSignedIn) {
        if (mounted) setToken(null);
        return;
      }
      try {
        const t = await getToken();
        if (mounted) setToken(t || null);
      } catch {
        if (mounted) setToken(null);
      }
    };
    loadToken();
    return () => {
      mounted = false;
    };
  }, [getToken, isLoaded, isSignedIn]);

  return {
    user: dbUser || mappedUser,
    token,
    loading: !isLoaded || profileLoading,
    isSignedIn,
    updateUser,
    logout: signOut,
  };
};
