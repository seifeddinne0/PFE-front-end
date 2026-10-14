"use client";

import { useEffect, useState } from "react";
import { BookOpen, FileText, AlertTriangle, Users, LayoutDashboard, TrendingUp, TrendingDown, Award, CreditCard, PieChart, Clock, MoreVertical } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import RecentNotifications from "@/app/components/RecentNotifications";

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

    const documentsByType = stats?.documentsByType || {};
    const documentsAvgProcessingDays = Number(stats?.documentsAvgProcessingDays ?? 0);
    const documentsAvgProcessingChangePercent = Number(stats?.documentsAvgProcessingChangePercent ?? 0);
    const documentsAvgProcessingTrend = (stats?.documentsAvgProcessingTrend || "stable") as "up" | "down" | "stable";
    const recettesParMois = (stats?.recettesParMois || []) as Array<{ month: string; total: number }>;
    const topClassesAbsences = (stats?.topClassesAbsences || []) as Array<{ classeCode: string; totalAbsences: number }>;

    const docTypeEntries = Object.entries(documentsByType)
        .map(([key, value]) => [key, Number(value || 0)] as [string, number])
        .filter(([, value]) => value > 0);
    const documentsTotal = docTypeEntries.reduce((sum, [, value]) => sum + value, 0);
    const docColors = ["#03a9f4", "#ff9800", "#9c27b0", "#4caf50", "#f44336", "#009688", "#795548"];

    const formatDocType = (value: string) =>
        value
            .toLowerCase()
            .replace(/_/g, " ")
            .replace(/\b\w/g, (l) => l.toUpperCase());

    const buildPieGradient = () => {
        if (documentsTotal === 0) return "#e5e7eb";
        let start = 0;
        const segments = docTypeEntries.map(([, value], index) => {
            const percent = (value / documentsTotal) * 100;
            const end = start + percent;
            const segment = `${docColors[index % docColors.length]} ${start}% ${end}%`;
            start = end;
            return segment;
        });
        return `conic-gradient(${segments.join(", ")})`;
    };

    const buildLinePath = (values: number[], width: number, height: number) => {
        if (values.length === 0) return "";
        const maxValue = Math.max(...values, 1);
        const paddingX = 24;
        const paddingY = 20;
        const usableWidth = width - paddingX * 2;
        const usableHeight = height - paddingY * 2;
        return values
            .map((value, index) => {
                const x = values.length === 1 ? width / 2 : paddingX + (index / (values.length - 1)) * usableWidth;
                const y = height - paddingY - (value / maxValue) * usableHeight;
                return `${index === 0 ? "M" : "L"} ${x} ${y}`;
            })
            .join(" ");
    };

    const formatCurrencyDT = (value: number) => {
        const safeValue = Number.isFinite(value) ? value : 0;
        return `${safeValue.toFixed(2)} DT`;
    };

    const formatMonthLabel = (value: string) => {
        const [yearRaw, monthRaw] = value.split("-");
        const year = Number(yearRaw);
        const month = Number(monthRaw);
        if (!year || !month) return value;
        const date = new Date(year, month - 1, 1);
        return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
    };

    const getDelayTrendLabel = (trend: "up" | "down" | "stable") => {
        if (trend === "up") return "augmente ce mois-ci";
        if (trend === "down") return "diminue ce mois-ci";
        return "stable ce mois-ci";
    };

    const getDelayTrendStyles = (trend: "up" | "down" | "stable") => {
        if (trend === "up") {
            return {
                badge: "bg-red-50 dark:bg-red-900/20 border-red-100/50 dark:border-red-900/30",
                icon: "text-red-500",
                text: "text-red-500"
            };
        }
        if (trend === "down") {
            return {
                badge: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100/50 dark:border-emerald-900/30",
                icon: "text-emerald-500",
                text: "text-emerald-600"
            };
        }
        return {
            badge: "bg-gray-50 dark:bg-slate-800 border-gray-100 dark:border-slate-700",
            icon: "text-gray-400",
            text: "text-gray-500"
        };
    };

    const renderAdminDashboard = () => (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <StatCard title="Étudiants" value={stats?.totalEtudiants || 0} subtitle={`${stats?.etudiantsActifs || 0} Actifs`} icon={Users} color="#03a9f4" />
                <StatCard title="Enseignants" value={stats?.totalEnseignants || 0} subtitle="Inscrits" icon={Award} color="#9c27b0" />
                <StatCard title="Documents" value={stats?.totalDocuments || 0} subtitle={`${stats?.documentsEnAttente || 0} En attente`} icon={FileText} color="#ff9800" />
                <StatCard title="Absences" value={stats?.totalAbsences || 0} subtitle="Enregistrées" icon={AlertTriangle} color="#f44336" />
                <StatCard title="Factures" value={stats?.totalFactures || 0} subtitle={`${stats?.facturesNonPayees || 0} Impayees`} icon={CreditCard} color="#4caf50" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm h-full">
                    <h3 className="text-lg font-bold text-[#042954] dark:text-white mb-6 flex items-center gap-2">
                        <PieChart size={20} className="text-[#03a9f4]" /> Documents par type
                    </h3>
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                        <div
                            className="relative w-40 h-40 rounded-full"
                            style={{ background: buildPieGradient() }}
                            aria-label="Documents par type"
                        >
                            <div className="absolute inset-4 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center text-center">
                                <div>
                                    <div className="text-xs text-gray-500 dark:text-slate-400 font-semibold">Total</div>
                                    <div className="text-2xl font-black text-[#042954] dark:text-white">{documentsTotal}</div>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 w-full space-y-2">
                            {docTypeEntries.length === 0 ? (
                                <div className="text-sm text-gray-500 dark:text-slate-400">Aucune donnée disponible.</div>
                            ) : (
                                docTypeEntries.map(([key, value], index) => (
                                    <div key={key} className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="w-3 h-3 rounded-full"
                                                style={{ backgroundColor: docColors[index % docColors.length] }}
                                            />
                                            <span className="font-semibold text-gray-600 dark:text-slate-300">
                                                {formatDocType(key)}
                                            </span>
                                        </div>
                                        <span className="font-bold text-gray-700 dark:text-slate-200">{value}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm h-full">
                    <h3 className="text-lg font-bold text-[#042954] dark:text-white mb-6">Top 5 classes par absences</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mb-6">Classes avec le plus d'absences</p>
                    {topClassesAbsences.length === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-slate-400">Aucune donnée disponible.</div>
                    ) : (
                        <div className="space-y-3">
                            {topClassesAbsences.map((item, index) => {
                                const maxValue = Math.max(...topClassesAbsences.map((c) => c.totalAbsences), 1);
                                const width = Math.round((item.totalAbsences / maxValue) * 100);
                                return (
                                    <div key={item.classeCode}>
                                        <div className="flex items-center justify-between text-xs font-semibold text-gray-600 dark:text-slate-300 mb-1">
                                            <span>{item.classeCode}</span>
                                            <span>{item.totalAbsences}</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                            <div
                                                className="h-2.5 rounded-full"
                                                style={{ width: `${width}%`, backgroundColor: docColors[index % docColors.length] }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-xl shadow-gray-200/40 dark:shadow-none border border-gray-100 dark:border-slate-700 relative overflow-hidden group hover:shadow-2xl transition-all duration-500 h-full">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30">
                                <Clock size={20} strokeWidth={2.5} />
                            </div>
                            <h3 className="text-lg font-black text-[#042954] dark:text-white tracking-tight">Délai Moyen</h3>
                        </div>
                        <button className="p-2 text-gray-300 hover:text-gray-600 dark:hover:text-gray-100 transition-all rounded-full hover:bg-gray-50 dark:hover:bg-slate-700">
                            <MoreVertical size={18} />
                        </button>
                    </div>

                    {/* Main Value */}
                    <div className="mb-8">
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-[#042954] dark:text-white tracking-tighter">
                                {documentsAvgProcessingDays}
                            </span>
                            <span className="text-xl font-bold text-gray-300 uppercase tracking-widest">jours</span>
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${getDelayTrendStyles(documentsAvgProcessingTrend).badge}`}>
                                {documentsAvgProcessingTrend === "up" ? (
                                    <TrendingUp size={14} strokeWidth={3} className={getDelayTrendStyles(documentsAvgProcessingTrend).icon} />
                                ) : documentsAvgProcessingTrend === "down" ? (
                                    <TrendingDown size={14} strokeWidth={3} className={getDelayTrendStyles(documentsAvgProcessingTrend).icon} />
                                ) : (
                                    <TrendingDown size={14} strokeWidth={3} className={getDelayTrendStyles(documentsAvgProcessingTrend).icon} />
                                )}
                                <span className={`text-xs font-black ${getDelayTrendStyles(documentsAvgProcessingTrend).text}`}>
                                    {documentsAvgProcessingChangePercent}%
                                </span>
                            </div>
                            <span className="text-xs text-gray-400 font-bold">{getDelayTrendLabel(documentsAvgProcessingTrend)}</span>
                        </div>
                    </div>

                    {/* Details Section */}
                    <div className="bg-[#f8f9fa] dark:bg-slate-900/50 rounded-2xl p-5 space-y-4 border border-gray-50 dark:border-slate-800/50">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 dark:text-slate-400 font-extrabold tracking-wide uppercase">Total Traités :</span>
                            <span className="text-[#042954] dark:text-white font-black text-base">{stats?.totalDocuments || 0}</span>
                        </div>
                        <div className="flex justify-between items-center border-t border-gray-200 dark:border-slate-800 pt-4 text-xs">
                            <span className="text-gray-500 dark:text-slate-400 font-extrabold tracking-wide uppercase">En Attente :</span>
                            <span className="text-[#042954] dark:text-white font-black text-base">{stats?.documentsEnAttente || 0}</span>
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm h-full">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-lg font-bold text-[#042954] dark:text-white">Recettes par mois</h3>
                            <p className="text-xs text-gray-500 dark:text-slate-400">Total paye (DT)</p>
                        </div>
                    </div>
                    {recettesParMois.length === 0 ? (
                        <div className="text-sm text-gray-500 dark:text-slate-400">Aucune donnée disponible.</div>
                    ) : (
                        <div className="w-full">
                            <svg viewBox="0 0 420 180" className="w-full h-44">
                                <defs>
                                    <linearGradient id="receiptsLine" x1="0" x2="1" y1="0" y2="0">
                                        <stop offset="0%" stopColor="#03a9f4" />
                                        <stop offset="100%" stopColor="#00c853" />
                                    </linearGradient>
                                </defs>
                                <path
                                    d={buildLinePath(recettesParMois.map((r) => r.total), 420, 180)}
                                    fill="none"
                                    stroke="url(#receiptsLine)"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                                {recettesParMois.map((point, index) => {
                                    const values = recettesParMois.map((r) => r.total);
                                    const maxValue = Math.max(...values, 1);
                                    const paddingX = 24;
                                    const paddingY = 20;
                                    const usableWidth = 420 - paddingX * 2;
                                    const usableHeight = 180 - paddingY * 2;
                                    const x = recettesParMois.length === 1 ? 210 : paddingX + (index / (recettesParMois.length - 1)) * usableWidth;
                                    const y = 180 - paddingY - (point.total / maxValue) * usableHeight;
                                    const label = `${formatMonthLabel(point.month)}: ${formatCurrencyDT(point.total)}`;
                                    return (
                                        <g key={point.month}>
                                            <circle cx={x} cy={y} r="6" fill="#ffffff" stroke="#03a9f4" strokeWidth="3">
                                                <title>{label}</title>
                                            </circle>
                                        </g>
                                    );
                                })}
                            </svg>
                            <div className="grid grid-cols-6 gap-2 text-[10px] text-gray-400 mt-2">
                                {recettesParMois.slice(-6).map((point) => (
                                    <div key={point.month} className="text-center truncate">
                                        {formatMonthLabel(point.month)}
                                    </div>
                                ))}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-3">Survolez un point pour voir le montant.</div>
                        </div>
                    )}
                </div>
            </div>
            <div className="mt-8">
                <RecentNotifications />
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
