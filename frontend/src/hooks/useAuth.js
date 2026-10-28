import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    return {
      user: null,
      token: null,
      login: async () => {},
      register: async () => {},
      logout: () => {},
      updateUser: () => {}
    };
  }
  return context;
};
