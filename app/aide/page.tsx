import Link from "next/link";
import { GraduationCap, ArrowLeft, Send, Mail, User, BookOpen, MessageSquare } from "lucide-react";

export default function AidePage() {
    return (
        <div className="min-h-screen font-sans bg-[#f0f1f3] text-[#333333] flex flex-col">
            {/* Navigation */}
            <nav className="bg-[#042954] text-white py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50 shadow-md">
                <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
                    <div className="bg-[#ffa000] p-2 rounded shadow-sm">
                        <GraduationCap size={24} className="text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight">Gestion<span className="font-light text-white/80">Ac</span></span>
                </Link>

                <div className="flex items-center gap-4">
                    <Link href="/" className="text-sm font-medium hover:text-[#ffa000] transition-colors flex items-center gap-2">
                        <ArrowLeft size={16} /> Retour à l'accueil
                    </Link>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-grow py-12 px-6">
                <div className="container mx-auto max-w-3xl">
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                        {/* Header section */}
                        <div className="bg-[#042954] p-8 text-center text-white relative overflow-hidden">
                            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#ffa000]/20 blur-[40px]" />
                            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#03a9f4]/20 blur-[40px]" />
                            <div className="relative z-10 flex flex-col items-center">
                                <div className="bg-white/10 p-4 rounded-full mb-4 ring-2 ring-white/20">
                                    <Mail size={32} className="text-[#ffa000]" />
                                </div>
                                <h1 className="text-3xl font-bold mb-2">Besoin d'aide ?</h1>
                                <p className="text-white/80 max-w-md mx-auto">
                                    Vous êtes étudiant ou enseignant et rencontrez un problème ? Remplissez ce formulaire et notre équipe vous répondra dans les plus brefs délais.
                                </p>
                            </div>
                        </div>

                        {/* Form Section */}
                        <div className="p-8">
                            <form className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Nom complet */}
                                    <div className="space-y-2">
                                        <label htmlFor="name" className="block text-sm font-semibold text-[#042954]">Nom Complet</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <User size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="text"
                                                id="name"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffa000]/50 focus:border-[#ffa000] transition-all"
                                                placeholder="nom prenom"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Email */}
                                    <div className="space-y-2">
                                        <label htmlFor="email" className="block text-sm font-semibold text-[#042954]">Adresse Email</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <Mail size={18} className="text-gray-400" />
                                            </div>
                                            <input
                                                type="email"
                                                id="email"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffa000]/50 focus:border-[#ffa000] transition-all"
                                                placeholder="nom.prenom@exemple.com"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* Rôle */}
                                    <div className="space-y-2">
                                        <label htmlFor="role" className="block text-sm font-semibold text-[#042954]">Votre Rôle</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <GraduationCap size={18} className="text-gray-400" />
                                            </div>
                                            <select
                                                id="role"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffa000]/50 focus:border-[#ffa000] transition-all appearance-none"
                                                required
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Sélectionnez votre rôle</option>
                                                <option value="etudiant">Étudiant</option>
                                                <option value="enseignant">Enseignant</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Sujet */}
                                    <div className="space-y-2">
                                        <label htmlFor="subject" className="block text-sm font-semibold text-[#042954]">Sujet</label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                <BookOpen size={18} className="text-gray-400" />
                                            </div>
                                            <select
                                                id="subject"
                                                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffa000]/50 focus:border-[#ffa000] transition-all appearance-none"
                                                required
                                                defaultValue=""
                                            >
                                                <option value="" disabled>Sélectionnez un sujet</option>
                                                <option value="connexion">Problème de connexion</option>
                                                <option value="technique">Bug technique</option>
                                                <option value="autre">Autre question</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Message */}
                                <div className="space-y-2">
                                    <label htmlFor="message" className="block text-sm font-semibold text-[#042954]">Votre Message</label>
                                    <div className="relative">
                                        <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                                            <MessageSquare size={18} className="text-gray-400" />
                                        </div>
                                        <textarea
                                            id="message"
                                            rows={5}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#ffa000]/50 focus:border-[#ffa000] transition-all resize-none"
                                            placeholder="Décrivez votre problème en détail..."
                                            required
                                        ></textarea>
                                    </div>
                                </div>

                                {/* Bouton d'envoi */}
                                <button
                                    type="button"
                                    className="w-full bg-[#042954] text-white py-4 px-6 rounded-lg font-bold hover:bg-[#073266] transition-colors shadow-lg shadow-[#042954]/20 flex items-center justify-center gap-2 text-lg active:scale-[0.98]"
                                >
                                    <Send size={20} />
                                    Envoyer le message
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="bg-[#021f42] text-white/60 py-8 px-6 mt-auto">
                <div className="container mx-auto max-w-6xl flex flex-col items-center gap-2">
                    <div className="flex items-center gap-2 text-white/80">
                        <GraduationCap size={20} className="text-[#ffa000]" />
                        <span className="text-lg font-bold tracking-tight">Gestion<span className="font-light">Ac</span></span>
                    </div>
                    <p className="text-sm text-center">
                        © {new Date().getFullYear()} Gestion Académique. Tous droits réservés.
                    </p>
                </div>
            </footer>
        </div>
    );
}
