"use client";

import { useEffect, useState } from "react";
import { BookOpen, Calendar, FileText, AlertTriangle, Users, LayoutDashboard, Target, TrendingUp, Award } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";

export default function AdminDashboardPage() {
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

    const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
        <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 relative overflow-hidden group`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-10 transition-transform group-hover:scale-150 duration-500`} style={{ backgroundColor: color }}></div>
            <div className="flex items-center justify-between mb-4 relative z-10">
                <h3 className="text-gray-500 dark:text-slate-400 text-sm font-bold uppercase tracking-wider">{title}</h3>
                <div className="p-3 rounded-xl shadow-sm" style={{ backgroundColor: `${color}15`, color: color }}>
                    <Icon size={22} strokeWidth={2.5} />
                </div>
            </div>
            <div className="flex items-end gap-3 relative z-10">
                <span className="text-[#042954] dark:text-whitexl font-black text-[#042954] dark:text-white tracking-tight">{value}</span>
                {subtitle && <span className="text-sm font-semibold mb-1" style={{ color: color }}>{subtitle}</span>}
            </div>
        </div>
    );

    const renderAdminDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Étudiants" value={stats?.totalEtudiants || 0} subtitle={`${stats?.etudiantsActifs || 0} Actifs`} icon={Users} color="#03a9f4" />
                <StatCard title="Enseignants" value={stats?.totalEnseignants || 0} subtitle="Inscrits" icon={Award} color="#9c27b0" />
                <StatCard title="Documents" value={stats?.totalDocuments || 0} subtitle={`${stats?.documentsEnAttente || 0} En attente`} icon={FileText} color="#ff9800" />
                <StatCard title="Absences" value={stats?.totalAbsences || 0} subtitle="Enregistrées" icon={AlertTriangle} color="#f44336" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                    <h3 className="text-lg font-bold text-[#042954] dark:text-white mb-6 flex items-center gap-2">
                        <TrendingUp size={20} className="text-[#ffa000]"/> Statistiques Globales
                    </h3>
                    <div className="space-y-6">
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-bold text-gray-600 dark:text-slate-300">Taux de présence estimé</span>
                                <span className="text-sm font-bold text-green-500">92%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5">
                                <div className="bg-green-500 h-2.5 rounded-full" style={{ width: '92%' }}></div>
                            </div>
                        </div>
                        <div>
                            <div className="flex justify-between mb-2">
                                <span className="text-sm font-bold text-gray-600 dark:text-slate-300">Résolution des documents</span>
                                <span className="text-sm font-bold text-[#03a9f4]">85%</span>
                            </div>
                            <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5">
                                <div className="bg-[#03a9f4] h-2.5 rounded-full" style={{ width: '85%' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gradient-to-br from-[#042954] to-[#021833] p-8 rounded-2xl shadow-sm text-white relative overflow-hidden">
                    <div className="absolute -right-10 -bottom-10 opacity-10"><Target size={150}/></div>
                    <h3 className="text-lg font-bold mb-2">Objectifs de session</h3>
                    <p className="text-blue-200 mb-6 text-sm">Progression vers la fin du semestre d'automne</p>
                    <div className="flex items-end gap-2 mb-2">
                        <span className="text-[#042954] dark:text-whitexl font-black text-[#ffa000]">75</span>
                        <span className="text-xl font-bold text-blue-200 mb-1">%</span>
                    </div>
                    <p className="text-sm text-blue-100 italic">Semaines complétées: 10 sur 14</p>
                </div>
            </div>
        </div>
    );

    const renderEnseignantDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Total Cours" value={stats?.totalMatieres || 0} subtitle="Matières affectées" icon={BookOpen} color="#03a9f4" />
                <StatCard title="Notes Saisies" value={stats?.notesSaisies || 0} subtitle="Évaluations" icon={FileText} color="#4caf50" />
                <StatCard title="Absences" value={stats?.absencesRenseignees || 0} subtitle="Renseignées" icon={AlertTriangle} color="#ff9800" />
            </div>
            <div className="grid grid-cols-1 gap-6 mt-8">
                 <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center gap-6">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-full">
                        <Target size={32} className="text-blue-500" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#042954] dark:text-white mb-1">Espace Opérationnel</h3>
                        <p className="text-gray-500 dark:text-slate-400">Vos statistiques montrent une excellente réactivité ce mois-ci. Assurez-vous de vérifier la page "Notes & Résultats" pour complétez vos saisies en retard éventuelles.</p>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderEtudiantDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Mes Cours" value={stats?.totalMatieres || 0} subtitle="Inscrits" icon={BookOpen} color="#03a9f4" />
                <StatCard title="Absences" value={stats?.totalAbsences || 0} subtitle="Justifiées / Non" icon={AlertTriangle} color="#f44336" />
                <StatCard title="Évaluations" value={stats?.totalEvaluations || 0} subtitle="Notes reçues" icon={Award} color="#9c27b0" />
            </div>
        </div>
    );

    return (
        <div className="animate-in fade-in space-y-8">
            {/* Professional Welcome Banner */}
            <div className="relative overflow-hidden rounded-3xl bg-[#042954] text-white p-10 shadow-2xl">
                <div className="absolute top-[-50%] right-[-10%] w-[50%] h-[200%] rounded-full bg-gradient-to-b from-[#03a9f4]/30 to-[#ffa000]/10 blur-[80px] pointer-events-none" />
                <div className="absolute bottom-[-50%] left-[-10%] w-[40%] h-[150%] rounded-full bg-gradient-to-t from-[#ffa000]/20 to-transparent blur-[60px] pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="max-w-2xl">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 dark:bg-slate-800/50 rounded-full text-xs font-bold uppercase tracking-widest text-[#ffa000] mb-4 backdrop-blur-sm">
                            <LayoutDashboard size={14} /> Tableau de Gestion
                        </div>
                        <h2 className="text-white text-3xl font-black mb-4 leading-tight">
                            Bonjour, {stats?.prenom ? stats.prenom : (stats?.email || "Utilisateur")} !
                        </h2>
                        <p className="text-blue-100/80 text-lg leading-relaxed">
                            Bienvenue sur votre espace de pilotage académique. Suivez vos indicateurs de performance, analysez l'assiduité et gérez vos activités de manière centralisée.
                        </p>
                    </div>
                    {role !== "ROLE_ADMIN" && (
                        <div className="flex-shrink-0">
                            <Link 
                                href="/dashboard/profile"
                                className="group relative inline-flex items-center justify-center bg-[#ffa000] text-[#042954] dark:text-white font-black py-4 px-8 rounded-xl transition-all shadow-xl hover:shadow-[#ffa000]/30 hover:scale-105 overflow-hidden"
                            >
                                <span className="relative z-10">Mon Profil</span>
                                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                            </Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Statistics Section */}
            {role === "ROLE_ADMIN" && renderAdminDashboard()}
            {role === "ROLE_ENSEIGNANT" && renderEnseignantDashboard()}
            {role === "ROLE_ETUDIANT" && renderEtudiantDashboard()}
        </div>
    );
}
