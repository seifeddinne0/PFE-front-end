"use client";

import { useEffect, useState } from "react";
import { BookOpen, Calendar, FileText, Bell, AlertTriangle, Users, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function DashboardPage() {
    const [role, setRole] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const userRole = sessionStorage.getItem("role");
        setRole(userRole);

        const fetchStats = async () => {
            try {
                if (userRole === "ROLE_ADMIN") {
                    const [dashData, statsData] = await Promise.all([
                        api.get("/api/admin/dashboard"),
                        api.get("/api/admin/statistiques/dashboard")
                    ]);
                    setStats({ ...dashData, ...statsData });
                } else if (userRole === "ROLE_ENSEIGNANT") {
                    const data = await api.get("/api/enseignant/dashboard");
                    setStats(data);
                } else if (userRole === "ROLE_ETUDIANT") {
                    const data = await api.get("/api/etudiant/dashboard");
                    setStats(data);
                }
            } catch (error) {
                console.error("Erreur chargement dashboard", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (userRole) {
            fetchStats();
        } else {
            setIsLoading(false);
        }
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffa000]"></div>
            </div>
        );
    }

    const renderAdminDashboard = () => (
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
    );

    const renderEnseignantDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Total Cours</h3>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><BookOpen size={18} /></div>
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-3xl font-extrabold text-[#042954]">{stats?.totalMatieres || 0}</span>
                    <span className="text-sm text-gray-400 font-medium mb-1">Matières</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Saisies de Notes</h3>
                    <div className="p-2 bg-green-50 text-green-600 rounded-lg"><FileText size={18} /></div>
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-3xl font-extrabold text-[#042954]">{stats?.notesSaisies || 0}</span>
                    <span className="text-sm text-gray-400 font-medium mb-1">Évaluations</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Absences Renseignées</h3>
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle size={18} /></div>
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-3xl font-extrabold text-[#042954]">{stats?.absencesRenseignees || 0}</span>
                    <span className="text-sm text-orange-500 font-medium mb-1">Total</span>
                </div>
            </div>
        </div>
    );

    const renderEtudiantDashboard = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Mes Cours</h3>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><BookOpen size={18} /></div>
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-3xl font-extrabold text-[#042954]">{stats?.totalMatieres || 0}</span>
                    <span className="text-sm text-gray-400 font-medium mb-1">Matières</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Total Absences</h3>
                    <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle size={18} /></div>
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-3xl font-extrabold text-[#042954]">{stats?.totalAbsences || 0}</span>
                    <span className="text-sm text-gray-400 font-medium mb-1">Séances</span>
                </div>
            </div>

            <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-gray-500 text-sm font-medium">Total Évaluations</h3>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><FileText size={18} /></div>
                </div>
                <div className="flex items-end gap-3">
                    <span className="text-3xl font-extrabold text-[#042954]">{stats?.totalEvaluations || 0}</span>
                    <span className="text-sm text-purple-500 font-medium mb-1">Notes reçues</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in">
            {/* Welcome Banner */}
            <div className="mb-8 relative overflow-hidden rounded-2xl bg-[#042954] text-white p-8 shadow-lg">
                <div className="absolute top-[-20%] right-[-5%] w-[40%] h-[150%] rounded-full bg-[#03a9f4]/20 blur-[60px]" />
                <div className="absolute bottom-[-20%] left-[-5%] w-[30%] h-[100%] rounded-full bg-[#ffa000]/20 blur-[60px]" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-extrabold mb-2">Bienvenue {stats?.prenom ? stats.prenom : (stats?.email || "sur votre espace")} ! 👋</h2>
                        <p className="text-white/80 max-w-xl">
                            Ceci est votre tableau de bord principal. Vous pouvez retrouver ici un aperçu de vos activités récentes, vos cours et vos statistiques.
                        </p>
                    </div>
                    <button className="bg-[#ffa000] hover:bg-[#ff8f00] text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md whitespace-nowrap">
                        Voir mon profil
                    </button>
                </div>
            </div>

            {/* Statistics Cards based on Role */}
            {role === "ROLE_ADMIN" && renderAdminDashboard()}
            {role === "ROLE_ENSEIGNANT" && renderEnseignantDashboard()}
            {role === "ROLE_ETUDIANT" && renderEtudiantDashboard()}

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
                                <p className="text-sm font-medium text-[#333333]">Vérifiez vos emails pour plus d'informations à propos de votre compte.</p>
                                <p className="text-xs text-gray-500 mt-1">Il y a {item * 2} heures</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
