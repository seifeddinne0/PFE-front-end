"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
import ThemeToggle from "@/app/components/ThemeToggle";
import { api } from "@/lib/api";

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setSuccessMessage(null);
        setErrorMessage(null);

        try {
            await api.forgotPassword(email.trim());
            setSuccessMessage("✅ Vérifiez votre boîte mail. Le lien expire dans 30 minutes.");
        } catch (error: unknown) {
            const message = error instanceof Error
                ? error.message
                : "Erreur lors de l'envoi du lien. Veuillez réessayer.";
            setErrorMessage(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-[#f0f1f3] dark:bg-slate-900 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-md">
                <div className="mb-6 flex items-center justify-between">
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#042954] dark:text-slate-100 hover:opacity-80 transition-opacity"
                    >
                        <ArrowLeft size={16} />
                        Retour
                    </Link>
                    <ThemeToggle />
                </div>

                <div className="rounded-2xl bg-white dark:bg-slate-800 border border-[#e5e7eb] dark:border-slate-700 shadow-xl p-7 sm:p-8">
                    <div className="mb-7">
                        <div className="h-11 w-11 rounded-xl bg-[#042954] flex items-center justify-center mb-4">
                            <Mail className="text-white" size={20} />
                        </div>
                        <h1 className="text-2xl font-extrabold text-[#042954] dark:text-white">Mot de passe oublié</h1>
                        <p className="mt-2 text-sm text-gray-600 dark:text-slate-300">
                            Entrez votre email pour recevoir un lien de réinitialisation valide 30 minutes.
                        </p>
                    </div>

                    {successMessage && (
                        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                            {successMessage}
                        </div>
                    )}

                    {errorMessage && (
                        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                            {errorMessage}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label htmlFor="email" className="block text-sm font-semibold text-[#1e2a45] dark:text-slate-100 mb-2">
                                Adresse email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="votre.nom@institut.edu"
                                className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3.5 text-sm text-[#111827] dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#F97316]"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#F97316] text-white font-bold py-3.5 hover:bg-[#ea580c] transition-colors disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isLoading && (
                                <span className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                            )}
                            {isLoading ? "Envoi en cours..." : "Envoyer le lien"}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <Link href="/login" className="text-sm font-semibold text-[#042954] dark:text-slate-200 hover:underline">
                            ← Retour à la connexion
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
