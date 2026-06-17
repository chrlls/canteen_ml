import api from './api';

const authService = {
    login: async (email, password) => {
        try {
            const response = await api.post('/login', { email, password });
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify(response.data.user));
            return response.data;
        } catch (err) {
            throw err;
        }
    },

    logout: async () => {
        try { await api.post('/logout'); } catch (err) { console.error('Logout failed on server, continuing local logout:', err); }
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        try {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        } catch { return null; }
    },

    getToken: () => localStorage.getItem('token')
};

export default authService;