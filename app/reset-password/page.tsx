"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Clock3, Eye, EyeOff, TriangleAlert } from "lucide-react";
import ThemeToggle from "@/app/components/ThemeToggle";
import { api } from "@/lib/api";

type TokenStatus = "checking" | "invalid" | "valid";

type FormErrors = {
    password?: string;
    confirmPassword?: string;
};

const TEN_MINUTES_MS = 10 * 60 * 1000;
const ONE_MINUTE_MS = 60 * 1000;

export default function ResetPasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [tokenStatus, setTokenStatus] = useState<TokenStatus>("checking");
    const [expiresAtMs, setExpiresAtMs] = useState<number | null>(null);
    const [remainingMs, setRemainingMs] = useState<number>(0);
    const [isExpired, setIsExpired] = useState(false);

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [formErrors, setFormErrors] = useState<FormErrors>({});
    const [apiError, setApiError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const token = searchParams.get("token")?.trim() || "";

    useEffect(() => {
        let isMounted = true;

        const validateToken = async () => {
            if (!token) {
                setTokenStatus("invalid");
                return;
            }

            setTokenStatus("checking");
            setApiError(null);

            try {
                const data = await api.validateResetToken(token);
                if (!isMounted) {
                    return;
                }

                if (!data?.valid || !data?.expiresAt) {
                    setTokenStatus("invalid");
                    return;
                }

                const expiryDateMs = new Date(data.expiresAt).getTime();
                if (Number.isNaN(expiryDateMs) || expiryDateMs <= Date.now()) {
                    setTokenStatus("invalid");
                    return;
                }

                setExpiresAtMs(expiryDateMs);
                setRemainingMs(Math.max(expiryDateMs - Date.now(), 0));
                setIsExpired(false);
                setTokenStatus("valid");
            } catch {
                if (isMounted) {
                    setTokenStatus("invalid");
                }
            }
        };

        validateToken();

        return () => {
            isMounted = false;
        };
    }, [token]);

    useEffect(() => {
        if (tokenStatus !== "valid" || !expiresAtMs) {
            return;
        }

        const intervalId = setInterval(() => {
            const nextRemaining = Math.max(expiresAtMs - Date.now(), 0);
            setRemainingMs(nextRemaining);

            if (nextRemaining <= 0) {
                setIsExpired(true);
                clearInterval(intervalId);
            }
        }, 1000);

        return () => clearInterval(intervalId);
    }, [tokenStatus, expiresAtMs]);

    const timerLabel = useMemo(() => {
        const totalSeconds = Math.floor(remainingMs / 1000);
        const minutes = Math.floor(totalSeconds / 60)
            .toString()
            .padStart(2, "0");
        const seconds = (totalSeconds % 60)
            .toString()
            .padStart(2, "0");
        return `${minutes}:${seconds}`;
    }, [remainingMs]);

    const timerColorClass = useMemo(() => {
        if (remainingMs > TEN_MINUTES_MS) {
            return "text-green-600";
        }
        if (remainingMs > ONE_MINUTE_MS) {
            return "text-orange-500";
        }
        return "text-red-600";
    }, [remainingMs]);

    const validateForm = () => {
        const nextErrors: FormErrors = {};

        if (password.length < 8) {
            nextErrors.password = "Le mot de passe doit contenir au moins 8 caractères.";
        }

        if (confirmPassword !== password) {
            nextErrors.confirmPassword = "Les mots de passe ne correspondent pas.";
        }

        setFormErrors(nextErrors);
        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (isExpired || tokenStatus !== "valid") {
            return;
        }

        setApiError(null);

        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        try {
            await api.resetPassword(token, password);
            router.push("/login?reset=success");
        } catch (error: unknown) {
            const message = error instanceof Error
                ? error.message
                : "Erreur lors de la réinitialisation du mot de passe.";
            setApiError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (tokenStatus === "checking") {
        return (
            <main className="min-h-screen bg-[#f0f1f3] dark:bg-slate-900 flex items-center justify-center px-4">
                <div className="rounded-2xl bg-white dark:bg-slate-800 shadow-xl p-8 w-full max-w-md text-center">
                    <div className="mx-auto h-8 w-8 rounded-full border-2 border-[#F97316]/30 border-t-[#F97316] animate-spin" />
                    <p className="mt-4 text-sm text-gray-600 dark:text-slate-300">Validation du lien en cours...</p>
                </div>
            </main>
        );
    }

    if (tokenStatus === "invalid") {
        return (
            <main className="min-h-screen bg-[#f0f1f3] dark:bg-slate-900 flex items-center justify-center px-4 py-10">
                <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 border border-red-200 dark:border-red-900/40 shadow-xl p-8 text-center">
                    <div className="mx-auto h-12 w-12 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <TriangleAlert className="text-red-600" size={22} />
                    </div>
                    <h1 className="mt-4 text-xl font-extrabold text-[#042954] dark:text-white">❌ Lien invalide ou expiré.</h1>
                    <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                        Demandez un nouveau lien pour réinitialiser votre mot de passe.
                    </p>
                    <Link
                        href="/forgot-password"
                        className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#F97316] text-white font-bold px-5 py-3 hover:bg-[#ea580c] transition-colors"
                    >
                        Demander un nouveau lien
                    </Link>
                </div>
            </main>
        );
    }

    const formDisabled = isSubmitting || isExpired;

    return (
        <main className="min-h-screen bg-[#f0f1f3] dark:bg-slate-900 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href="/login"
                        className="text-sm font-semibold text-[#042954] dark:text-slate-100 hover:opacity-80"
                    >
                        ← Retour à la connexion
                    </Link>
                    <ThemeToggle />
                </div>

                <div className="rounded-2xl bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-slate-700 shadow-xl p-7 sm:p-8">
                    <div className="mb-6 flex items-center justify-between rounded-xl border border-gray-200 dark:border-slate-600 bg-[#fff7ed] dark:bg-slate-900 px-4 py-3">
                        <div className="flex items-center gap-2 text-sm font-semibold text-[#1e2a45] dark:text-slate-200">
                            <Clock3 size={16} />
                            Temps restant
                        </div>
                        <span className={`text-lg font-extrabold ${timerColorClass}`}>{timerLabel}</span>
                    </div>

                    {isExpired && (
                        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            ⏱️ Ce lien a expiré. Demandez un nouveau.
                            <Link href="/forgot-password" className="ml-2 font-semibold underline">
                                Nouveau lien
                            </Link>
                        </div>
                    )}

                    {apiError && (
                        <div className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {apiError}
                        </div>
                    )}

                    <h1 className="text-2xl font-extrabold text-[#042954] dark:text-white mb-2">Réinitialiser le mot de passe</h1>
                    <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">
                        Saisissez un nouveau mot de passe sécurisé pour votre compte.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="password" className="block text-sm font-semibold text-[#1e2a45] dark:text-slate-100 mb-2">
                                Nouveau mot de passe
                            </label>
                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    disabled={formDisabled}
                                    className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3.5 pr-12 text-sm text-[#111827] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-70"
                                    placeholder="Minimum 8 caractères"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-60"
                                    disabled={formDisabled}
                                    aria-label="Afficher/masquer le mot de passe"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {formErrors.password && (
                                <p className="mt-1 text-xs text-red-600">{formErrors.password}</p>
                            )}
                        </div>

                        <div>
                            <label htmlFor="confirm-password" className="block text-sm font-semibold text-[#1e2a45] dark:text-slate-100 mb-2">
                                Confirmer le mot de passe
                            </label>
                            <div className="relative">
                                <input
                                    id="confirm-password"
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    disabled={formDisabled}
                                    className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3.5 pr-12 text-sm text-[#111827] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F97316] disabled:opacity-70"
                                    placeholder="Retapez le mot de passe"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-60"
                                    disabled={formDisabled}
                                    aria-label="Afficher/masquer la confirmation"
                                >
                                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {formErrors.confirmPassword && (
                                <p className="mt-1 text-xs text-red-600">{formErrors.confirmPassword}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={formDisabled}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] text-white font-bold py-3.5 hover:bg-[#ea580c] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isSubmitting && (
                                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            )}
                            {isSubmitting ? "Réinitialisation en cours..." : "Réinitialiser le mot de passe"}
                        </button>
                    </form>
                </div>
            </div>
        </main>
    );
}
