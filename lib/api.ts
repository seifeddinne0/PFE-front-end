const API_URL = "http://localhost:8080";

export const api = {
    login: async (email: string, password: string) => {
        const res = await fetch(`${API_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
            throw new Error("Identifiants incorrects");
        }

        return res.json();
    },

    get: async (endpoint: string) => {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`${API_URL}${endpoint}`, {
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        if (!res.ok) {
            throw new Error("Erreur lors de la récupération des données");
        }

        return res.json();
    },

    post: async (endpoint: string, data: any) => {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            throw new Error("Erreur lors de l'envoi des données");
        }

        return res.json();
    },

    put: async (endpoint: string, data: any) => {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            throw new Error("Erreur lors de la mise à jour des données");
        }

        return res.json();
    },

    patch: async (endpoint: string, data: any) => {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: "PATCH",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (!res.ok) {
            throw new Error("Erreur lors de la mise à jour des données");
        }

        return res.json();
    },

    delete: async (endpoint: string) => {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
        });

        if (!res.ok) {
            throw new Error("Erreur lors de la suppression des données");
        }

        // Certaines API DELETE ne retournent pas de JSON, juste un status 204
        if (res.status === 204) return null;

        try {
            return await res.json();
        } catch {
            return null;
        }
    },
};
