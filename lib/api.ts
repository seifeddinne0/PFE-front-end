export const API_URL = "http://localhost:8080";

const extractErrorMessage = async (res: Response, fallback: string) => {
    try {
        const payload = await res.json();
        return payload?.message || fallback;
    } catch {
        return fallback;
    }
};

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

    forgotPassword: async (email: string) => {
        const res = await fetch(`${API_URL}/api/auth/forgot-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
        });

        if (!res.ok) {
            const message = await extractErrorMessage(
                res,
                "Erreur lors de l'envoi du lien de réinitialisation"
            );
            throw new Error(message);
        }

        return res.json();
    },

    validateResetToken: async (token: string) => {
        const res = await fetch(
            `${API_URL}/api/auth/validate-token?token=${encodeURIComponent(token)}`,
            {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            }
        );

        if (!res.ok) {
            return { valid: false };
        }

        return res.json();
    },

    resetPassword: async (token: string, newPassword: string) => {
        const res = await fetch(`${API_URL}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token, newPassword }),
        });

        if (!res.ok) {
            const message = await extractErrorMessage(
                res,
                "Erreur lors de la réinitialisation du mot de passe"
            );
            throw new Error(message);
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
            let backendMessage = "";
            try {
                const payload = await res.json();
                backendMessage = payload?.message || "";
            } catch {
                backendMessage = "";
            }

            const message = backendMessage || `Erreur API (${res.status}) sur ${endpoint}`;
            const error: Error & { status?: number } = new Error(message);
            error.status = res.status;
            throw error;
        }

        return res.json();
    },

    post: async (endpoint: string, data: unknown) => {
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
            let backendMessage = "";
            try {
                const payload = await res.json();
                backendMessage = payload?.message || "";
            } catch {
                backendMessage = "";
            }

            const message = backendMessage || `Erreur API (${res.status}) sur ${endpoint}`;
            const error: Error & { status?: number } = new Error(message);
            error.status = res.status;
            throw error;
        }

        if (res.status === 204) {
            return null;
        }

        const contentType = res.headers.get("content-type") || "";
        if (!contentType.includes("application/json")) {
            return null;
        }

        return res.json();
    },

    postFormData: async (endpoint: string, formData: FormData) => {
        const token = sessionStorage.getItem("token");
        const res = await fetch(`${API_URL}${endpoint}`, {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${token}`,
            },
            body: formData,
        });

        if (!res.ok) {
            throw new Error("Erreur lors de l'envoi du formulaire");
        }

        return res.json();
    },

    put: async (endpoint: string, data: unknown) => {
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
            let backendMessage = "";
            try {
                const payload = await res.json();
                backendMessage = payload?.message || "";
            } catch {
                backendMessage = "";
            }

            const message = backendMessage || "Erreur lors de la mise à jour des données";
            const error: Error & { status?: number } = new Error(message);
            error.status = res.status;
            throw error;
        }

        return res.json();
    },

    patch: async (endpoint: string, data: unknown) => {
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
            let backendMessage = "";
            try {
                const payload = await res.json();
                backendMessage = payload?.message || "";
            } catch {
                backendMessage = "";
            }

            const message = backendMessage || "Erreur lors de la mise à jour des données";
            const error: Error & { status?: number } = new Error(message);
            error.status = res.status;
            throw error;
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
