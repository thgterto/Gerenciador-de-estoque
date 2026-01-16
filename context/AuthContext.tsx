
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';

interface AuthContextType {
  user: User | null;
  login: (username: string, pass: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Simulação de "Banco de Dados" de usuários
const MOCK_USERS: Record<string, { pass: string, name: string, role: UserRole }> = {
    'admin': { pass: 'admin', name: 'Dr. Administrador', role: 'ADMIN' },
    'operador': { pass: 'operador', name: 'Téc. Operador', role: 'OPERATOR' }
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Restaurar sessão
    const stored = localStorage.getItem('LC_AUTH_USER');
    if (stored) {
        try {
            setUser(JSON.parse(stored));
        } catch (e) {
            localStorage.removeItem('LC_AUTH_USER');
        }
    }
    setIsLoading(false);
  }, []);

  const login = async (username: string, pass: string): Promise<boolean> => {
      // Simula delay de rede
      await new Promise(resolve => setTimeout(resolve, 500));

      const target = MOCK_USERS[username.toLowerCase()];
      
      if (target && target.pass === pass) {
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
