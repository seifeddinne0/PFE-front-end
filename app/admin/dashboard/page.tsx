"use client";

import { BookOpen, Users, Calendar, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function AdminDashboardPage() {
    const [userEmail, setUserEmail] = useState("admin@institut.edu");
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const [dashData, statsData] = await Promise.all([
                    api.get("/api/admin/dashboard"),
                    api.get("/api/admin/statistiques/dashboard")
                ]);
                if (dashData && dashData.email) {
                    setUserEmail(dashData.email);
                }
                if (statsData) {
                    setStats(statsData);
                }
            } catch (error) {
                console.error("Erreur lors de la récupération des données du dashboard", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div>
            {/* Welcome Banner */}
            <div className="mb-8 relative overflow-hidden rounded-2xl bg-[#042954] text-white p-8 shadow-lg">
                <div className="absolute top-[-20%] right-[-5%] w-[40%] h-[150%] rounded-full bg-[#03a9f4]/20 blur-[60px]" />
                <div className="absolute bottom-[-20%] left-[-5%] w-[30%] h-[100%] rounded-full bg-[#ffa000]/20 blur-[60px]" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-extrabold mb-2">Bienvenue sur votre espace Admin ! 👋</h2>
                        <p className="text-white/80 max-w-xl">
                            Connecté en tant que <strong className="text-white">{userEmail}</strong>. <br />
                            Ceci est votre tableau de bord principal. Vous pouvez gérer les étudiants, les enseignants, les classes et visualiser les statistiques.
                        </p>
                    </div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Total Étudiants</h3>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Users size={18} /></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-extrabold text-[#042954]">{stats?.totalEtudiants || 0}</span>
                        <span className="text-sm text-[#4caf50] font-medium mb-1">{stats?.etudiantsActifs || 0} Actifs</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Total Enseignants</h3>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Users size={18} /></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-extrabold text-[#042954]">{stats?.totalEnseignants || 0}</span>
                        <span className="text-sm text-gray-400 font-medium mb-1">Inscrits</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Total Documents</h3>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><BookOpen size={18} /></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-extrabold text-[#042954]">{stats?.totalDocuments || 0}</span>
                        <span className="text-sm text-orange-500 font-medium mb-1">{stats?.documentsEnAttente || 0} En attente</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Total Absences</h3>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Calendar size={18} /></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-extrabold text-[#042954]">{stats?.totalAbsences || 0}</span>
                        <span className="text-sm text-[#4caf50] font-medium mb-1">Enregistrées</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Quick Actions */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-[#042954]">Actions Rapides</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Link href="/admin/etudiants/create" className="p-4 border rounded-lg hover:border-[#ffa000] hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-2 text-[#333333]">
                            <Users className="text-[#ffa000]" size={24} />
                            <span className="font-semibold text-sm">Ajouter Étudiant</span>
                        </Link>
                        <Link href="/admin/enseignants" className="p-4 border rounded-lg hover:border-[#03a9f4] hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-2 text-[#333333]">
                            <Users className="text-[#03a9f4]" size={24} />
                            <span className="font-semibold text-sm">Gérer Enseignants</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
