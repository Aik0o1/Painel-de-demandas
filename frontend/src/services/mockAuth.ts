export const MOCK_USER = {
    id: "1",
    name: "MATHEUS HENRIQUE SALES CARVALHO",
    email: "matheushsc1999@gmail.com",
    role: "MASTER_ADMIN",
    avatar: undefined
};

export const mockAuthService = {
    signIn: async (email: string, password: string) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        if (email === MOCK_USER.email && password === "123456") {
            const token = "mock-jwt-token-" + Date.now();
            return {
                user: MOCK_USER,
                token
            };
        }
        throw new Error("Invalid credentials");
    },

    signOut: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: () => {
        if (typeof window === 'undefined') return null;
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    }
};
