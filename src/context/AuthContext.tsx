
import React, { createContext, useContext, useState } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Hashed Passwords (SHA-256)
// admin -> 8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918
// operador -> e257b110509437aaceddbd342bc63d05e74221d6bac056ed279d752ff8d3afcb
const MOCK_USERS: Record<string, { hash: string, name: string, role: UserRole }> = {
    'admin': { hash: '8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918', name: 'Dr. Administrador', role: 'ADMIN' },
    'operador': { hash: 'e257b110509437aaceddbd342bc63d05e74221d6bac056ed279d752ff8d3afcb', name: 'Téc. Operador', role: 'OPERATOR' }
};

/**
 * Hash password using SHA-256
 */
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

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
  const [isLoading] = useState(false);

  const login = async (username: string, pass: string): Promise<boolean> => {
      // Simula delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));

      const target = MOCK_USERS[username.toLowerCase()];
      
      if (target) {
          const inputHash = await hashPassword(pass);
          if (target.hash === inputHash) {
              const newUser: User = {
                  id: Math.random().toString(36).substr(2, 9),
                  username: username,
                  name: target.name,
                  role: target.role,
                  avatar: target.role === 'ADMIN' ? 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix' : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka',
                  active: true
              };

              setUser(newUser);
              localStorage.setItem('LC_AUTH_USER', JSON.stringify(newUser));
              return true;
          }
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
      if (user.role === 'ADMIN') return true; // Admin pode tudo
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
