"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, BookOpen, Settings, Bell, LayoutDashboard, FileText, Users, Calendar, UserX, CreditCard, Files, Menu, X } from "lucide-react";
import Link from "next/link";
import { Toaster } from 'react-hot-toast';
import { api } from "@/lib/api";
import ThemeToggle from "@/app/components/ThemeToggle";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string>("");
    const [userName, setUserName] = useState<string>("");
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const getDashboardPathByRole = (userRole: string | null) => {
        if (userRole === "ROLE_ADMIN") return "/admin/dashboard";
        if (userRole === "ROLE_ENSEIGNANT") return "/enseignant/dashboard";
        if (userRole === "ROLE_ETUDIANT") return "/etudiant/dashboard";
        return "/login";
    };

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const userRole = sessionStorage.getItem("role");

        if (!token) {
            router.push("/login");
            return;
        } 
        
        if (userRole !== "ROLE_ADMIN") {
            router.push(getDashboardPathByRole(userRole));
            return;
        }

        const fetchUserData = async () => {
            try {
                const data = await api.get("/api/admin/dashboard");
                setUserName(`${data.prenom || ""} ${data.nom || ""}`.trim() || "Administrateur");
                setUserEmail(data.email || "admin@institut.edu");
            } catch (error) {
                console.error("Erreur chargement profil", error);
                setUserName("Administrateur");
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [router]);

    const handleLogout = () => {
        sessionStorage.removeItem("token");
        sessionStorage.removeItem("role");
        router.push("/login");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#f0f1f3] dark:bg-[#050505]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffa000]"></div>
            </div>
        );
    }

    const navLinks = [
        { name: "Tableau de bord", href: "/admin/dashboard", icon: LayoutDashboard },
        { name: "Étudiants", href: "/admin/etudiants", icon: Users },
        { name: "Enseignants", href: "/admin/enseignants", icon: User },
        { name: "Notes & Résultats", href: "/admin/notes", icon: FileText },
        { name: "Absences", href: "/admin/absences", icon: UserX },
        { name: "Factures", href: "/admin/factures", icon: CreditCard },
        { name: "Documents", href: "/admin/documents", icon: Files },
    ];

    const allLinks = [
        ...navLinks,
    ];

    const activeLink = allLinks.find(link => pathname.startsWith(link.href));
    const pageTitle = activeLink ? activeLink.name : "Administration";

    return (
        <div className="min-h-screen bg-[#f0f1f3] dark:bg-[#050505] font-sans text-[#333333] dark:text-zinc-100 flex relative">
            <Toaster position="top-right" />

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`
                fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
                md:relative md:translate-x-0 transition duration-200 ease-in-out
                w-64 bg-[#042954] dark:bg-[#111111] dark:border-r dark:border-zinc-800/50 text-white flex flex-col shadow-xl z-50
            `}>
                <div className="p-6 border-b border-white/10 dark:border-zinc-800/50 flex items-center justify-between">
                    <span className="text-2xl font-bold tracking-tight text-white">Gestion<span className="font-light text-[#ffa000]">Ac</span></span>
                    <button className="md:hidden text-white/50 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                        <X size={24} />
                    </button>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                    <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-4 px-2">Menu Principal</div>

                    {navLinks.map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname.startsWith(link.href);
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
            <main className="flex-1 flex flex-col h-screen overflow-hidden w-full">
                {/* Header */}
                <header className="bg-white dark:bg-[#111111] shadow-sm dark:shadow-none dark:border-b dark:border-zinc-800/50 px-4 md:px-8 py-4 flex items-center justify-between z-10 transition-colors">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button 
                            className="md:hidden p-2 -ml-2 text-gray-600 dark:text-zinc-400 hover:text-[#042954] dark:hover:text-white transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-lg md:text-2xl font-bold text-[#042954] dark:text-zinc-100 truncate max-w-[150px] sm:max-w-max">{pageTitle}</h1>
                        <span className="hidden sm:inline-block px-3 py-1 bg-[#e3f2fd] dark:bg-blue-900/30 text-[#03a9f4] dark:text-blue-400 text-xs font-bold rounded-full">
                            Espace ADMINISTRATION
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                         <div className="flex items-center gap-3 border-l pl-4 border-gray-200 dark:border-zinc-800/50">
                            <div className="hidden sm:block text-right">
                                <p className="text-sm font-bold text-[#333333] dark:text-zinc-100">{userName}</p>
                                <p className="text-xs text-gray-500 dark:text-zinc-400 font-medium">ADMINISTRATEUR</p>
                            </div>
                            <div className="w-10 h-10 rounded-full bg-[#042954] dark:bg-zinc-800 flex items-center justify-center text-white dark:text-zinc-100 font-bold shadow-md cursor-pointer hover:bg-[#03a9f4] dark:hover:bg-zinc-700 transition-colors uppercase">
                                {userName.charAt(0) || "A"}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f9fa] dark:bg-[#0a0a0a] transition-colors">
                    {children}
                </div>
            </main>
        </div>
    );
}
