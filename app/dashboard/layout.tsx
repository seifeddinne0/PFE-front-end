"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, BookOpen, Settings, Bell, LayoutDashboard, FileText, Users, Calendar } from "lucide-react";
import Link from "next/link";
import { Toaster } from 'react-hot-toast';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const userRole = sessionStorage.getItem("role");

        if (!token) {
            router.push("/login");
        } else {
            setRole(userRole);
            setIsLoading(false);
        }
    }, [router]);

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("role");
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

    const navLinks = [
        { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, exact: true },
        ...(role === "ROLE_ADMIN" ? [{ name: "Espace Admin", href: "/admin/dashboard", icon: Users, exact: false }] : []),
        { name: "Cours & Modules", href: "/dashboard/cours", icon: BookOpen, exact: false },
        { name: "Emploi du temps", href: "/dashboard/emploi-du-temps", icon: Calendar, exact: false },
        { name: "Notes & Résultats", href: "/dashboard/notes", icon: FileText, exact: false },
    ];

    return (
        <div className="min-h-screen bg-[#f0f1f3] font-sans text-[#333333] flex">
            <Toaster position="top-right" />

            {/* Sidebar */}
            <aside className="w-64 bg-[#042954] text-white flex-col hidden md:flex shadow-xl z-20">
                <div className="p-6 border-b border-white/10">
                    <span className="text-2xl font-bold tracking-tight">Gestion<span className="font-light text-[#ffa000]">Ac</span></span>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 px-2">Menu Principal</div>

                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = link.exact
                            ? pathname === link.href
                            : pathname.startsWith(link.href);
                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${isActive ? 'bg-[#ffa000] text-white shadow-sm' : 'hover:bg-white/10 text-white/80 hover:text-white'}`}
                            >
                                <Icon size={20} />
                                {link.name}
                            </Link>
                        );
                    })}

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

            {/* Main Content */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header */}
                <header className="bg-white shadow-sm px-8 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-4">
                        <h1 className="text-2xl font-bold text-[#042954]">Vue d&apos;ensemble</h1>
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

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-[#f8f9fa]">
                    {children}
                </div>
            </main>
        </div>
    );
}
