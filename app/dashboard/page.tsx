"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, BookOpen, Settings, Bell, LayoutDashboard, FileText, Users, Calendar } from "lucide-react";

export default function DashboardPage() {
    const router = useRouter();
    const [role, setRole] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Vérifier si l'utilisateur est connecté
        const token = localStorage.getItem("token");
        const userRole = localStorage.getItem("role");

        if (!token) {
            router.push("/login"); // Redirige vers la page de login s'il n'y a pas de token
        } else {
            setRole(userRole);
            setIsLoading(false);
        }
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("role");
        router.push("/login");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f1f3]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffa000]"></div>
            </div>
        );
    }

    const displayRole = role ? role.replace("ROLE_", "") : "UTILISATEUR";

    return (
        <div className="min-h-screen bg-[#f0f1f3] font-sans text-[#333333] flex">
            {/* Sidebar (Menu Latéral) */}
            <aside className="w-64 bg-[#042954] text-white flex-col hidden md:flex shadow-xl z-20">
                <div className="p-6 border-b border-white/10">
                    <span className="text-2xl font-bold tracking-tight">Gestion<span className="font-light text-[#ffa000]">Ac</span></span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 px-2">Menu Principal</div>

                    <a href="#" className="flex items-center gap-3 bg-[#ffa000] text-white px-4 py-3 rounded-lg font-medium transition-colors shadow-sm">
                        <LayoutDashboard size={20} />
                        Tableau de bord
                    </a>

                    {role === "ROLE_ADMIN" && (
                        <a href="/admin/dashboard" className="flex items-center gap-3 hover:bg-white/10 text-white/80 hover:text-white px-4 py-3 rounded-lg font-medium transition-colors">
                            <Users size={20} />
                            Espace Admin
                        </a>
                    )}

                    <a href="#" className="flex items-center gap-3 hover:bg-white/10 text-white/80 hover:text-white px-4 py-3 rounded-lg font-medium transition-colors">
                        <BookOpen size={20} />
                        Cours & Modules
                    </a>
                    <a href="#" className="flex items-center gap-3 hover:bg-white/10 text-white/80 hover:text-white px-4 py-3 rounded-lg font-medium transition-colors">
                        <Calendar size={20} />
                        Emploi du temps
                    </a>
                    <a href="#" className="flex items-center gap-3 hover:bg-white/10 text-white/80 hover:text-white px-4 py-3 rounded-lg font-medium transition-colors">
                        <FileText size={20} />
                        Notes & Résultats
                    </a>

                    <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mt-8 mb-4 px-2">Paramètres</div>

                    <a href="#" className="flex items-center gap-3 hover:bg-white/10 text-white/80 hover:text-white px-4 py-3 rounded-lg font-medium transition-colors">
                        <User size={20} />
                        Mon Profil
                    </a>
                    <a href="#" className="flex items-center gap-3 hover:bg-white/10 text-white/80 hover:text-white px-4 py-3 rounded-lg font-medium transition-colors">
                        <Settings size={20} />
                        Configuration
                    </a>
                </nav>

                <div className="p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full hover:bg-red-500/20 text-red-400 hover:text-red-300 px-4 py-3 rounded-lg font-medium transition-colors"
                    >
                        <LogOut size={20} />
                        Déconnexion
                    </button>
                </div>
            </aside>

            {/* Main Content (Contenu Principal) */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Top Header */}
                <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-[#042954]">Vue d'ensemble</h1>
                        <span className="px-3 py-1 bg-[#e3f2fd] text-[#03a9f4] text-xs font-bold rounded-full">
                            Espace {displayRole}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-[#ffa000] transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-400 border-2 border-white rounded-full"></span>
                        </button>
                        <div className="flex items-center gap-3 border-l pl-4">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-bold text-[#333333]">Utilisateur Connecté</p>
                                <p className="text-xs text-gray-500">{displayRole}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#042954] flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:bg-[#03a9f4] transition-colors">
                                {displayRole.charAt(0)}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Dashboard Content area */}
                <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">

                    {/* Welcome Banner */}
                    <div className="mb-8 relative overflow-hidden rounded-2xl bg-[#042954] text-white p-8 shadow-lg">
                        <div className="absolute top-[-20%] right-[-5%] w-[40%] h-[150%] rounded-full bg-[#03a9f4]/20 blur-[60px]" />
                        <div className="absolute bottom-[-20%] left-[-5%] w-[30%] h-[100%] rounded-full bg-[#ffa000]/20 blur-[60px]" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div>
                                <h2 className="text-3xl font-extrabold mb-2">Bienvenue sur votre espace ! 👋</h2>
                                <p className="text-white/80 max-w-xl">
                                    Ceci est votre tableau de bord principal. Vous pouvez retrouver ici un aperçu de vos activités récentes, vos cours et vos notifications.
                                </p>
                            </div>
                            <button className="bg-[#ffa000] hover:bg-[#ff8f00] text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md whitespace-nowrap">
                                Voir mon profil
                            </button>
                        </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Total Cours</h3>
                                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><BookOpen size={18} /></div>
                            </div>
                            <div className="flex items-end gap-3">
                                <span className="text-3xl font-extrabold text-[#042954]">12</span>
                                <span className="text-sm text-gray-400 font-medium mb-1">Inscrits</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Prochain Cours</h3>
                                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={18} /></div>
                            </div>
                            <div className="flex items-end gap-3">
                                <span className="text-3xl font-extrabold text-[#042954]">10h30</span>
                                <span className="text-sm text-gray-400 font-medium mb-1">Salle B12</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Évaluations</h3>
                                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><FileText size={18} /></div>
                            </div>
                            <div className="flex items-end gap-3">
                                <span className="text-3xl font-extrabold text-[#042954]">2</span>
                                <span className="text-sm text-orange-500 font-medium mb-1">À venir</span>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-gray-500 text-sm font-medium">Moyenne</h3>
                                <div className="p-2 bg-green-50 text-green-600 rounded-lg"><BookOpen size={18} /></div>
                            </div>
                            <div className="flex items-end gap-3">
                                <span className="text-3xl font-extrabold text-[#042954]">14.5</span>
                                <span className="text-sm text-[#4caf50] font-medium mb-1">/20</span>
                            </div>
                        </div>
                    </div>

                    {/* Recent Activity Section */}
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-bold text-[#042954]">Activités récentes</h3>
                            <button className="text-sm font-semibold text-[#03a9f4] hover:underline">Tout voir</button>
                        </div>

                        <div className="space-y-4">
                            {[1, 2, 3].map((item) => (
                                <div key={item} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                    <div className="w-10 h-10 rounded-full bg-[#e3f2fd] flex items-center justify-center text-[#03a9f4] flex-shrink-0 mt-1">
                                        <Bell size={18} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-[#333333]">Nouvelle note ajoutée en Mathématiques.</p>
                                        <p className="text-xs text-gray-500 mt-1">Il y a {item * 2} heures</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </main>
        </div>
    );
}
