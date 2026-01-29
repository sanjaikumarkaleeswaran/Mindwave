import { createContext, useState, useEffect, useContext } from 'react';
import api from '../lib/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadUser = async () => {
            const token = localStorage.getItem('token');
            if (token) {
                try {
                    const res = await api.get('/auth/user');
                    setUser(res.data);
                } catch (err) {
                    console.error("Failed to load user", err);
                    localStorage.removeItem('token');
                    setUser(null);
                }
            }
            setLoading(false);
        };
        loadUser();
    }, []);

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', res.data.token);
        const userRes = await api.get('/auth/user');
        setUser(userRes.data);
    };

    const register = async (name, email, password) => {
        await api.post('/auth/register', { name, email, password });
        // Don't auto-login, wait for verification
    };

    const updateProfile = async (data) => {
        const res = await api.put('/auth/profile', data);
        setUser(res.data);
    };

    const uploadAvatar = async (file) => {
        const formData = new FormData();
        formData.append('avatar', file);
        const res = await api.post('/auth/upload-avatar', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        // Update user state with new avatar from server response, preserving other fields if needed, 
        // though the server typically ensures the user object is returned or we just patch it.
        // Our server returns { avatar: url }, so we need to merge it or re-fetch.
        // Let's re-fetch to be safe or patch if we trust the current state.
        setUser(prev => ({ ...prev, avatar: res.data.avatar }));
        return res.data.avatar;
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, updateProfile, uploadAvatar }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
