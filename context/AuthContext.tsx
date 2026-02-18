
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { db } from '../db';
import { hashPassword } from '../utils/security';

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('LC_AUTH_USER');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch (e) {
            localStorage.removeItem('LC_AUTH_USER');
        }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(true);

  // Initialize DB with default admin if empty
  useEffect(() => {
    const initAuth = async () => {
        try {
            const count = await db.rawDb.users.count();
            if (count === 0) {
                console.log("First run detected. Creating default admin.");
                const hashedPassword = await hashPassword('admin');
                await db.rawDb.users.add({
                    id: crypto.randomUUID(),
                    username: 'admin',
                    password: hashedPassword,
                    name: 'Administrador',
                    role: 'ADMIN',
                    active: true,
                    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Admin'
                });
            }
        } catch (e) {
            console.error("Auth init error", e);
        } finally {
            setIsLoading(false);
        }
    };
    initAuth();
  }, []);

  const login = async (username: string, pass: string): Promise<boolean> => {
      // Simula delay para feedback visual
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
          // Case insensitive login
          const userFound = await db.rawDb.users
            .where('username')
            .equalsIgnoreCase(username)
            .first();

          const inputHash = await hashPassword(pass);

          if (userFound && userFound.active && userFound.password === inputHash) {
              // Remove password from state for security
              const { password, ...safeUser } = userFound;

              setUser(safeUser as User);
              localStorage.setItem('LC_AUTH_USER', JSON.stringify(safeUser));
              return true;
          }
      } catch (e) {
          console.error("Login error", e);
      }
      
      return false;
  };

  const logout = () => {
      setUser(null);
      localStorage.removeItem('LC_AUTH_USER');
      localStorage.removeItem('LC_SESSION_TAB');
  };

  const hasRole = (role: UserRole) => {
      if (!user) return false;
      if (user.role === 'ADMIN') return true;
      return user.role === role;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
