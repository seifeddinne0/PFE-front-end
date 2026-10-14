"use client";

import { useEffect, useState } from "react";
import { BookOpen, Calendar, FileText, AlertTriangle, Users, LayoutDashboard, Target, TrendingUp, Award, MapPin } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import RecentNotifications from "@/app/components/RecentNotifications";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";

const DAY_TO_INDEX: Record<string, number> = {
    LUNDI: 1,
    MARDI: 2,
    MERCREDI: 3,
    JEUDI: 4,
    VENDREDI: 5,
    SAMEDI: 6,
};

function formatISODate(value: Date): string {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, "0");
    const day = String(value.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function toTimeHHMM(value: string): string {
    return value.substring(0, 5);
}

function getMonday(date: Date): Date {
    const clone = new Date(date);
    const day = clone.getDay();
    const diff = clone.getDate() - day + (day === 0 ? -6 : 1);
    clone.setDate(diff);
    clone.setHours(0, 0, 0, 0);
    return clone;
}

function addDays(date: Date, days: number): Date {
    const clone = new Date(date);
    clone.setDate(clone.getDate() + days);
    return clone;
}

function toEventDateTime(date: Date, time: string): string {
    const hhmm = toTimeHHMM(time);
    const day = formatISODate(date);
    return `${day}T${hhmm}:00`;
}

export default function EnseignantDashboardPage() {
    const [role, setRole] = useState<string | null>(null);
    const [stats, setStats] = useState<any>(null);
    const [seances, setSeances] = useState<any[]>([]);
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
                    const [data, seancesData] = await Promise.all([
                        api.get("/api/enseignant/dashboard"),
                        api.get("/api/enseignant/seances")
                    ]);
                    setStats(data);
                    setSeances(Array.isArray(seancesData) ? seancesData : []);
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

    const renderEnseignantDashboard = () => {
        const weekAnchor = getMonday(new Date());
        
        const scheduleEvents = seances.map((seance: any) => {
            const dayIndex = DAY_TO_INDEX[seance.jourSemaine] ?? 1;
            const eventDate = addDays(weekAnchor, dayIndex - 1);
            
            let heureDebut = seance.heureDebut;
            let heureFin = seance.heureFin;
            
            if (seance.creneauLabel) {
                const parts = seance.creneauLabel.split(" - ");
                if (parts.length === 2) {
                    heureDebut = parts[0].trim();
                    heureFin = parts[1].trim();
                }
            }

            return {
                id: String(seance.id),
                title: seance.matiereNom,
                start: toEventDateTime(eventDate, heureDebut),
                end: toEventDateTime(eventDate, heureFin),
                backgroundColor: seance.typeSeance === "TD" ? "#eab308" : "#3b82f6",
                borderColor: seance.typeSeance === "TD" ? "#ca8a04" : "#2563eb",
                textColor: "#ffffff",
                extendedProps: {
                    seance,
                },
            };
        });

        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard title="Total Cours" value={stats?.totalMatieres || 0} subtitle="Matières affectées" icon={BookOpen} color="#03a9f4" />
                    <StatCard title="Notes Saisies" value={stats?.notesSaisies || 0} subtitle="Évaluations" icon={FileText} color="#4caf50" />
                    <StatCard title="Absences" value={stats?.absencesRenseignees || 0} subtitle="Renseignées" icon={AlertTriangle} color="#ff9800" />
                    <StatCard title="Documents" value={stats?.totalDocuments || 0} subtitle={`${stats?.documentsEnAttente || 0} En attente`} icon={FileText} color="#ff9800" />
                </div>

                <div className="mt-8 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-[#042954] dark:text-white flex items-center gap-2">
                            <Calendar size={20} className="text-[#ffa000]" /> Emploi du Temps
                        </h3>
                    </div>
                    <div className="p-6">
                        {(!seances || seances.length === 0) ? (
                            <div className="text-gray-500 text-sm text-center py-6">Aucune séance planifiée.</div>
                        ) : (
                            <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                                <FullCalendar
                                    plugins={[timeGridPlugin, interactionPlugin]}
                                    locale={frLocale}
                                    initialView="timeGridWeek"
                                    initialDate={formatISODate(weekAnchor)}
                                    weekends={true}
                                    hiddenDays={[0]} // Masquer le dimanche
                                    allDaySlot={false}
                                    headerToolbar={false}
                                    events={scheduleEvents}
                                    selectable={false}
                                    nowIndicator
                                    dayHeaderFormat={{ weekday: "long" }}
                                    slotMinTime="08:00:00"
                                    slotMaxTime="18:00:00"
                                    slotDuration="00:30:00"
                                    height="auto"
                                    eventContent={(eventInfo) => {
                                        const seance = eventInfo.event.extendedProps.seance;
                                        if (!seance) return <div className="p-1 text-xs">{eventInfo.event.title}</div>;
                                        
                                        const isTD = seance.typeSeance === "TD";
                                        const roomText = seance.salle?.trim() ? seance.salle : "N/A";
                                        const classText = seance.classeCode || "Classe N/A";
                                        
                                        return (
                                            <div className="flex flex-col h-full w-full p-1 overflow-y-auto no-scrollbar font-sans text-[9px] leading-[1.2] text-white/95">
                                                <div className="flex justify-between items-start mb-0.5 shrink-0">
                                                    <div className="font-bold tracking-wide">{eventInfo.timeText}</div>
                                                    <span className={`px-1 py-[1px] text-[7.5px] font-bold uppercase rounded ${isTD ? 'bg-amber-600/40 text-white' : 'bg-blue-800/40 text-white'} border ${isTD ? 'border-amber-400/20' : 'border-blue-400/20'}`}>
                                                        {seance.typeSeance || "COURS"}
                                                    </span>
                                                </div>
                                                
                                                <div className="font-bold mb-1 shrink-0" title={seance.matiereNom}>
                                                    {seance.matiereNom}
                                                </div>
                                                
                                                <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[8.5px] opacity-90 mt-auto shrink-0">
                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                        <Users size={9} className="shrink-0" />
                                                        <span className="truncate max-w-[60px]">{classText}</span>
                                                    </div>
                                                    <div className="flex items-center gap-0.5 shrink-0">
                                                        <MapPin size={9} className="shrink-0" />
                                                        <span className="truncate max-w-[60px]">{roomText}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    }}
                                />
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8">
                    <RecentNotifications />
                </div>
            </div>
        );
    };

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
                                href="/enseignant/profile"
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
