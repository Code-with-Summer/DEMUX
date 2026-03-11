import { createContext, useContext, useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

const UserContext = createContext();

export const UserContextProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);

    const normalizePhoto = (value) => {
        if (!value) return '';
        return value.startsWith('/uploads/') ? `${API_URL}${value}` : value;
    };

    useEffect(() => {
        if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const baseUser = { id: payload.id, username: payload.username, email: payload.email, role: payload.role || (payload.email === 'admin@gmail.com' ? 'admin' : 'user') };
            setUser(baseUser);
            const loadProfile = async () => {
                try {
                    const res = await fetch(`${API_URL}/api/user/profile`, { headers: { Authorization: `Bearer ${token}` } });
                    if (!res.ok) return;
                    const data = await res.json();
                    setUser((prev) => ({
                        ...prev,
                        ...data,
                        profilePhoto: normalizePhoto(data.profilePhoto),
                        id: prev?.id || data._id || payload.id
                    }));
                } catch (err) {
                    // ignore
                }
            };
            loadProfile();
        }
    }, [token]);

    const login = (newToken, userData) => {
        // Ensure role is set, default to 'user', override for admin
        userData.role = userData.role || 'user';
        if (userData.email === 'admin@gmail.com') {
            userData.role = 'admin';
        }
        userData.profilePhoto = normalizePhoto(userData.profilePhoto);
        setToken(newToken);
        setUser(userData);
        localStorage.setItem('token', newToken);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem('token');
    };

    return (
        <UserContext.Provider value={{ user, token, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => useContext(UserContext);
