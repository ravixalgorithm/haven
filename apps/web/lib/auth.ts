export const getToken = () => {
    if (typeof window !== "undefined") {
        return localStorage.getItem("token");
    }
    return null;
};

export const setToken = (token: string) => {
    if (typeof window !== "undefined") {
        localStorage.setItem("token", token);
        document.cookie = `token=${token}; path=/; max-age=31536000; SameSite=Strict`;
    }
};

export const logout = () => {
    if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        document.cookie = "token=; path=/; max-age=0";
    }
};
