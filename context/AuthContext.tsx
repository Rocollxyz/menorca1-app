import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginAndGetToken, setToken } from '@/services/mediacms-api';

interface AuthState {
  token: string | null;
  username: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({} as AuthState);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          AsyncStorage.getItem('auth_token'),
          AsyncStorage.getItem('auth_username'),
        ]);
        if (storedToken) {
          setTokenState(storedToken);
          setUsername(storedUser);
          setToken(storedToken);
        }
      } catch {
        // silencioso — la app funciona sin auth
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const login = async (user: string, password: string) => {
    const t = await loginAndGetToken(user, password);
    setTokenState(t);
    setUsername(user);
    setToken(t);
    await AsyncStorage.multiSet([
      ['auth_token', t],
      ['auth_username', user],
    ]);
  };

  const logout = async () => {
    setTokenState(null);
    setUsername(null);
    setToken(null);
    await AsyncStorage.multiRemove(['auth_token', 'auth_username']);
  };

  return (
    <AuthContext.Provider value={{ token, username, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
