"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, BookOpen, Settings, Bell, LayoutDashboard, FileText, Users, Calendar, UserX, CreditCard, Files, Menu, X } from "lucide-react";
import Link from "next/link";
import { Toaster } from 'react-hot-toast';
import { api } from "@/lib/api";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const pathname = usePathname();
    const [isLoading, setIsLoading] = useState(true);
    const [userEmail, setUserEmail] = useState<string>("");
    const [userName, setUserName] = useState<string>("");
    const [userPhoto, setUserPhoto] = useState<string | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Close mobile menu on route change
    useEffect(() => {
        setIsMobileMenuOpen(false);
    }, [pathname]);

    const [role, setRole] = useState<string | null>(null);

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        const userRole = sessionStorage.getItem("role");

        if (!token) {
            router.push("/login");
            return;
        } 
        
        setRole(userRole);
        const resolvedRole = userRole ? userRole.replace("ROLE_", "") : "UTILISATEUR";

        const fetchUserData = async () => {
            if (!userRole) {
                setIsLoading(false);
                return;
            }

            try {
                let endpoint = "";
                if (userRole === "ROLE_ADMIN") endpoint = "/api/admin/dashboard";
                else if (userRole === "ROLE_ENSEIGNANT") endpoint = "/api/enseignant/dashboard";
                else if (userRole === "ROLE_ETUDIANT") endpoint = "/api/etudiant/dashboard";

                if (endpoint) {
                    const data = await api.get(endpoint);
                    if (data) {
                        setUserName(`${data.prenom || ""} ${data.nom || ""}`.trim() || resolvedRole);
                        setUserEmail(data.email || "");
                        setUserPhoto(data.photo || null);
                    }
                }
            } catch (error) {
                console.error("Erreur chargement profil", error);
                setUserName(resolvedRole);
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
            <div className="min-h-screen flex items-center justify-center bg-[#f0f1f3]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffa000]"></div>
            </div>
        );
    }

    const displayRole = role ? role.replace("ROLE_", "") : "UTILISATEUR";

    const adminLinks = [
        { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, exact: true },
        { name: "Étudiants", href: "/admin/etudiants", icon: Users, exact: false },
        { name: "Enseignants", href: "/admin/enseignants", icon: User, exact: false },
        { name: "Classes", href: "/admin/classes", icon: Calendar, exact: false },
        { name: "Notes & Résultats", href: "/admin/notes", icon: FileText, exact: false },
        { name: "Absences", href: "/admin/absences", icon: UserX, exact: false },
        { name: "Factures", href: "/admin/factures", icon: CreditCard, exact: false },
        { name: "Documents", href: "/admin/documents", icon: Files, exact: false },
    ];

    const defaultLinks = [
        { name: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard, exact: true },
        { name: "Notes & Résultats", href: role === "ROLE_ENSEIGNANT" ? "/enseignant/notes" : role === "ROLE_ETUDIANT" ? "/etudiant/notes" : "/dashboard/notes", icon: FileText, exact: false },
        { name: "Absences", href: role ? `/${role.replace("ROLE_", "").toLowerCase()}/absences` : "/absences", icon: UserX, exact: false },
        ...(role === "ROLE_ETUDIANT" ? [{ name: "Factures", href: `/${role.replace("ROLE_", "").toLowerCase()}/factures`, icon: CreditCard, exact: false }] : []),
        { name: "Documents", href: role ? `/${role.replace("ROLE_", "").toLowerCase()}/documents` : "/documents", icon: Files, exact: false },
    ];

    const navLinks = role === "ROLE_ADMIN" ? adminLinks : defaultLinks;

    const allLinks = [
        ...navLinks,
        { name: "Mon Profil", href: "/dashboard/profile", icon: User, exact: true },
        { name: "Configuration", href: "/dashboard/settings", icon: Settings, exact: true },
    ];

    const activeLink = allLinks.find(link => 
        link.exact ? pathname === link.href : pathname.startsWith(link.href)
    );
    const pageTitle = activeLink ? activeLink.name : "Vue d'ensemble";

    return (
        <div className="min-h-screen bg-[#f0f1f3] font-sans text-[#333333] flex relative">
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
                w-64 bg-[#042954] text-white flex flex-col shadow-xl z-50
            `}>
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <span className="text-2xl font-bold tracking-tight">Gestion<span className="font-light text-[#ffa000]">Ac</span></span>
                    <button className="md:hidden text-white/50 hover:text-white" onClick={() => setIsMobileMenuOpen(false)}>
                        <X size={24} />
                    </button>
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

                    {[
                        ...(role !== "ROLE_ADMIN" ? [{ name: "Mon Profil", href: "/dashboard/profile", icon: User }] : []),
                        { name: "Configuration", href: "/dashboard/settings", icon: Settings },
                    ].map((link) => {
                        const Icon = link.icon;
                        const isActive = pathname === link.href;
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
                <header className="bg-white shadow-sm px-4 md:px-8 py-4 flex items-center justify-between z-10">
                    <div className="flex items-center gap-3 md:gap-4">
                        <button 
                            className="md:hidden p-2 -ml-2 text-gray-600 hover:text-[#042954] transition-colors"
                            onClick={() => setIsMobileMenuOpen(true)}
                        >
                            <Menu size={24} />
                        </button>
                        <h1 className="text-lg md:text-2xl font-bold text-[#042954] truncate max-w-[150px] sm:max-w-max">{pageTitle}</h1>
                        <span className="hidden sm:inline-block px-3 py-1 bg-[#e3f2fd] text-[#03a9f4] text-xs font-bold rounded-full">
                            Espace {displayRole}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button className="p-2 text-gray-400 hover:text-[#ffa000] transition-colors relative">
                            <Bell size={20} />
                            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-400 border-2 border-white rounded-full"></span>
                        </button>
                         {role === "ROLE_ADMIN" ? (
                             <div className="flex items-center gap-3 border-l pl-4">
                                <div className="hidden sm:block text-right">
                                    <p className="text-sm font-bold text-[#333333]">{userName}</p>
                                    <p className="text-xs text-gray-500 font-medium">{displayRole}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-[#042954] flex items-center justify-center text-white font-bold shadow-md uppercase overflow-hidden border-2 border-white">
                                    {userPhoto ? (
                                        <img src={`http://localhost:8080${userPhoto}`} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        userName.charAt(0) || displayRole.charAt(0)
                                    )}
                                </div>
                            </div>
                         ) : (
                            <Link href="/dashboard/profile" className="flex items-center gap-3 border-l pl-4 hover:opacity-80 transition-opacity">
                                <div className="hidden sm:block text-right">
                                    <p className="text-sm font-bold text-[#333333]">{userName}</p>
                                    <p className="text-xs text-gray-500 font-medium">{displayRole}</p>
                                </div>
                                <div className="w-10 h-10 rounded-full bg-[#042954] flex items-center justify-center text-white font-bold shadow-md cursor-pointer hover:bg-[#03a9f4] transition-colors uppercase overflow-hidden border-2 border-white">
                                {userPhoto ? (
                                    <img 
                                        src={userPhoto.startsWith('http') ? userPhoto : `http://localhost:8080${userPhoto.startsWith('/') ? '' : '/'}${userPhoto}`} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover" 
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).style.display = 'none';
                                            (e.target as HTMLImageElement).parentElement!.innerText = userName.charAt(0) || displayRole.charAt(0);
                                        }}
                                    />
                                ) : (
                                    userName.charAt(0) || displayRole.charAt(0)
                                )}
                            </div>
                            </Link>
                         )}
                    </div>
                </header>

                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-[#f8f9fa]">
                    {children}
                </div>
            </main>
        </div>
    );
}
