"use client";

import { useEffect, useMemo, useState } from "react";
import FullCalendar from "@fullcalendar/react";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import frLocale from "@fullcalendar/core/locales/fr";
import {
    Calendar,
    AlertTriangle,
    Users,
    Check,
    Save,
    X,
    Clock,
    Filter,
} from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Seance {
    id: number;
    jourSemaine: "LUNDI" | "MARDI" | "MERCREDI" | "JEUDI" | "VENDREDI" | "SAMEDI";
    heureDebut: string;
    heureFin: string;
    salle?: string;
    matiereId: number;
    matiereNom: string;
    matiereCode?: string;
    classeId: number;
    classeCode: string;
    classeNom?: string;
    enseignantId: number;
    enseignantNom: string;
}

interface Etudiant {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    email: string;
    classeCode: string;
}

interface AbsenceRecord {
    id: number;
    etudiantId: number;
    seanceId: number;
    dateAbsence: string;
}

interface FiliereItem {
    id: number;
    code: string;
    nom: string;
}

interface ClasseItem {
    id: number;
    code: string;
    nom: string;
    niveauCode: string;
    filiereCode: string;
}

interface AgendaAbsenceResponse {
    filiereCode?: string;
    niveauCode?: string;
    semestreActif?: string;
    blocked: boolean;
    message?: string;
    seances: Seance[];
}

interface CalendarEvent {
    id: string;
    title: string;
    start: string;
    end: string;
    extendedProps: {
        seance: Seance;
    };
}

interface VacationBackgroundEvent {
    id: string;
    start: string;
    end: string;
    display: "background";
    backgroundColor: string;
    borderColor: string;
}

const DAY_TO_INDEX: Record<Seance["jourSemaine"], number> = {
    LUNDI: 1,
    MARDI: 2,
    MERCREDI: 3,
    JEUDI: 4,
    VENDREDI: 5,
    SAMEDI: 6,
};

const NIVEAUX_LCS = ["LCS1", "LCS2", "LCS3"];

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

function formatSemestreLabel(semestre?: string): string {
    if (!semestre) return "-";
    if (semestre === "STAGE_PFE") return "Stage PFE";
    return semestre;
}

function isVacationDate(value: Date): boolean {
    const year = value.getFullYear();

    const janStart = new Date(year, 0, 1);
    const janEnd = new Date(year, 0, 15);

    const marStart = new Date(year, 2, 15);
    const marEnd = new Date(year, 2, 31);

    const mayStart = new Date(year, 4, 30);
    const sepEnd = new Date(year, 8, 12);

    const day = new Date(value);
    day.setHours(0, 0, 0, 0);

    const inJanVacation = day >= janStart && day <= janEnd;
    const inMarVacation = day >= marStart && day <= marEnd;
    const inSummerVacation = day >= mayStart && day <= sepEnd;

    return inJanVacation || inMarVacation || inSummerVacation;
}

export default function EnseignantAbsencesPage() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [filieres, setFilieres] = useState<FiliereItem[]>([]);
    const [classes, setClasses] = useState<ClasseItem[]>([]);

    const [selectedFiliere, setSelectedFiliere] = useState("LCS");
    const [selectedNiveau, setSelectedNiveau] = useState("LCS1");

    const [agenda, setAgenda] = useState<AgendaAbsenceResponse | null>(null);
    const [weekAnchor, setWeekAnchor] = useState<Date>(getMonday(new Date()));

    const [selectedSeance, setSelectedSeance] = useState<Seance | null>(null);
    const [selectedDate, setSelectedDate] = useState("");
    const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
    const [absentIds, setAbsentIds] = useState<Set<number>>(new Set());
    const [existingAbsences, setExistingAbsences] = useState<AbsenceRecord[]>([]);

    const [loadingModal, setLoadingModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const availableNiveaux = useMemo(() => {
        return NIVEAUX_LCS;
    }, []);

    const scheduleEvents: CalendarEvent[] = useMemo(() => {
        if (!agenda?.seances?.length) return [];

        const baseMonday = getMonday(weekAnchor);

        return agenda.seances.flatMap((seance) => {
            const dayIndex = DAY_TO_INDEX[seance.jourSemaine] ?? 1;
            const eventDate = addDays(baseMonday, dayIndex - 1);

            // Ne pas afficher les seances pendant les jours de vacances.
            if (isVacationDate(eventDate)) {
                return [];
            }

            const roomLabel = seance.salle?.trim() ? seance.salle.trim() : "Salle N/A";
            return [{
                id: String(seance.id),
                title: `${seance.matiereNom} • ${seance.classeCode} • ${roomLabel}`,
                start: toEventDateTime(eventDate, seance.heureDebut),
                end: toEventDateTime(eventDate, seance.heureFin),
                extendedProps: {
                    seance,
                },
            }];
        });
    }, [agenda?.seances, weekAnchor]);

    const vacationBackgroundEvents: VacationBackgroundEvent[] = useMemo(() => {
        const baseMonday = getMonday(weekAnchor);
        const events: VacationBackgroundEvent[] = [];

        for (let index = 0; index < 6; index += 1) {
            const day = addDays(baseMonday, index);
            if (!isVacationDate(day)) {
                continue;
            }

            const isoDay = formatISODate(day);
            events.push({
                id: `vac-${isoDay}`,
                start: `${isoDay}T08:00:00`,
                end: `${isoDay}T18:00:00`,
                display: "background",
                backgroundColor: "rgba(239, 68, 68, 0.34)",
                borderColor: "rgba(185, 28, 28, 0.55)",
            });
        }

        return events;
    }, [weekAnchor]);

    const calendarEvents = useMemo(
        () => [...vacationBackgroundEvents, ...scheduleEvents],
        [vacationBackgroundEvents, scheduleEvents]
    );

    const weekLabel = useMemo(() => {
        const end = addDays(weekAnchor, 5);
        const startText = weekAnchor.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
        });
        const endText = end.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric",
        });
        return `${startText} — ${endText}`;
    }, [weekAnchor]);

    useEffect(() => {
        const bootstrap = async () => {
            const token = sessionStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const [filieresData, classesData] = await Promise.all([
                    api.get("/api/admin/filieres"),
                    api.get("/api/admin/classes"),
                ]);

                setFilieres(Array.isArray(filieresData) ? filieresData : []);
                setClasses(Array.isArray(classesData) ? classesData : []);
            } catch {
                toast.error("Impossible de charger les filtres de calendrier.");
            } finally {
                setLoading(false);
            }
        };

        bootstrap();
    }, [router]);

    useEffect(() => {
        if (!selectedNiveau) return;

        const loadAgenda = async () => {
            try {
                const data = await api.get(
                    `/api/enseignant/agenda-absences?filiereCode=${encodeURIComponent(selectedFiliere)}&niveauCode=${encodeURIComponent(selectedNiveau)}&referenceDate=${encodeURIComponent(formatISODate(weekAnchor))}`
                );

                setAgenda(data as AgendaAbsenceResponse);
            } catch {
                toast.error("Erreur lors du chargement de l'agenda.");
                setAgenda({ blocked: false, seances: [] });
            }
        };

        loadAgenda();
    }, [selectedFiliere, selectedNiveau, weekAnchor]);

    const openAbsenceModal = async (seance: Seance, date: Date) => {
        const dateStr = formatISODate(date);

        setSelectedSeance(seance);
        setSelectedDate(dateStr);
        setLoadingModal(true);

        try {
            const [studentsData, absencesData] = await Promise.all([
                api.get(`/api/enseignant/classes/${seance.classeId}/etudiants`),
                api.get(`/api/enseignant/absences/seance/${seance.id}?date=${dateStr}`),
            ]);

            const students = Array.isArray(studentsData) ? studentsData : [];
            const absences = Array.isArray(absencesData) ? absencesData : [];

            setEtudiants(students);
            setExistingAbsences(absences);

            const absentSet = new Set<number>();
            absences.forEach((a: AbsenceRecord) => absentSet.add(a.etudiantId));
            setAbsentIds(absentSet);
        } catch {
            toast.error("Erreur lors du chargement de la liste d'appel.");
            setSelectedSeance(null);
        } finally {
            setLoadingModal(false);
        }
    };

    const toggleAbsent = (etudiantId: number) => {
        setAbsentIds((prev) => {
            const next = new Set(prev);
            if (next.has(etudiantId)) next.delete(etudiantId);
            else next.add(etudiantId);
            return next;
        });
    };

    const toggleAll = () => {
        if (absentIds.size === etudiants.length) {
            setAbsentIds(new Set());
        } else {
            setAbsentIds(new Set(etudiants.map((e) => e.id)));
        }
    };

    const handleSubmitAbsences = async () => {
        if (!selectedSeance) return;

        setSubmitting(true);
        try {
            if (existingAbsences.length > 0) {
                await api.delete(
                    `/api/enseignant/absences/seance/${selectedSeance.id}?date=${selectedDate}`
                );
            }

            if (absentIds.size > 0) {
                await api.post("/api/enseignant/absences/batch", {
                    seanceId: selectedSeance.id,
                    dateAbsence: selectedDate,
                    etudiantIds: Array.from(absentIds),
                });
            }

            toast.success(
                absentIds.size > 0
                    ? `${absentIds.size} absence(s) enregistree(s).`
                    : "Aucune absence: tous presents."
            );
            setSelectedSeance(null);
        } catch {
            toast.error("Erreur pendant l'enregistrement des absences.");
        } finally {
            setSubmitting(false);
        }
    };

    const onCalendarEventClick = (arg: any) => {
        const seance = arg?.event?.extendedProps?.seance as Seance | undefined;
        if (!seance) return;
        const clickedDate = arg.event.start;
        if (!clickedDate) return;

        openAbsenceModal(seance, clickedDate);
    };

    const filteredClassesByFiliere = useMemo(() => {
        return classes.filter((c) => c.filiereCode === selectedFiliere);
    }, [classes, selectedFiliere]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#ffa000]" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
                <div className="enseignant-absences-top-band bg-gradient-to-r from-[#042954] to-[#0a3d7a] px-6 md:px-8 py-5">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                                <Calendar size={24} className="text-[#ffa000]" />
                                Prise d'Absence Hebdomadaire
                            </h2>
                            <p className="text-sm text-white/60 mt-1">
                                Regle semestre automatique (15 janvier) appliquee.
                            </p>
                        </div>
                        <div className="text-right text-white/90 text-sm">
                            <div className="font-semibold">{weekLabel}</div>
                            <div className="text-white/60">
                                Semestre actif: {formatSemestreLabel(agenda?.semestreActif)}
                            </div>
                            <div className="mt-2 flex justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setWeekAnchor((prev) => addDays(prev, -7))}
                                    className="px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 text-xs font-semibold"
                                >
                                    Semaine -1
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWeekAnchor(getMonday(new Date()))}
                                    className="px-2.5 py-1 rounded bg-[#ffa000] hover:bg-[#ff8f00] text-xs font-semibold text-white"
                                >
                                    Aujourd'hui
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setWeekAnchor((prev) => addDays(prev, 7))}
                                    className="px-2.5 py-1 rounded bg-white/15 hover:bg-white/25 text-xs font-semibold"
                                >
                                    Semaine +1
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50/60">
                    <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider mb-4">
                        <Filter size={14} />
                        Filtres d'affichage
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2">Filiere</label>
                            <select
                                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#ffa000]"
                                value={selectedFiliere}
                                onChange={(e) => {
                                    const next = e.target.value;
                                    setSelectedFiliere(next);
                                    setSelectedNiveau("LCS1");
                                }}
                            >
                                {filieres.length === 0 && (
                                    <option value="LCS">LCS</option>
                                )}
                                {filieres.map((f) => (
                                    <option key={f.id} value={f.code}>
                                        {f.code} - {f.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2">Niveau</label>
                            <select
                                className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#ffa000]"
                                value={selectedNiveau}
                                onChange={(e) => setSelectedNiveau(e.target.value)}
                            >
                                {availableNiveaux.map((n) => (
                                    <option key={n} value={n}>
                                        {n}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 mb-2">Classes concernees</label>
                            <div className="w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-2.5 text-sm text-gray-600 dark:text-slate-300">
                                {filteredClassesByFiliere
                                    .filter((c) => c.niveauCode === selectedNiveau)
                                    .map((c) => c.code)
                                    .slice(0, 4)
                                    .join(", ") || "-"}
                            </div>
                        </div>
                    </div>
                </div>

                {agenda?.blocked ? (
                    <div className="p-8 md:p-10">
                        <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 flex items-start gap-3">
                            <AlertTriangle className="text-red-600 mt-0.5" size={20} />
                            <div>
                                <h3 className="font-bold text-red-700">Annee universitaire terminee pour ce niveau</h3>
                                <p className="text-sm text-red-700/90 mt-1">
                                    {agenda.message || "Le calendrier est desactive pour ce niveau apres le 15 janvier."}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="p-4 md:p-6">
                        {agenda?.message && (
                            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                                {agenda.message}
                            </div>
                        )}

                        {vacationBackgroundEvents.length > 0 && (
                            <div className="mb-3 text-xs font-semibold text-red-700 dark:text-red-300">
                                Les zones rouges indiquent les periodes de vacances (seances masquees).
                            </div>
                        )}

                        <div className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden">
                            <FullCalendar
                                key={`${selectedFiliere}-${selectedNiveau}-${formatISODate(weekAnchor)}`}
                                plugins={[timeGridPlugin, interactionPlugin]}
                                locale={frLocale}
                                initialView="timeGridWeek"
                                initialDate={formatISODate(weekAnchor)}
                                weekends
                                hiddenDays={[0]}
                                allDaySlot={false}
                                headerToolbar={false}
                                events={calendarEvents}
                                eventClick={onCalendarEventClick}
                                selectable={false}
                                nowIndicator
                                dayHeaderFormat={{ weekday: "long", day: "2-digit", month: "2-digit" }}
                                slotMinTime="08:00:00"
                                slotMaxTime="18:00:00"
                                slotDuration="00:30:00"
                                height="auto"
                            />
                        </div>

                        {scheduleEvents.length === 0 && (
                            <div className="text-center text-sm text-gray-500 dark:text-slate-400 py-6">
                                {agenda?.semestreActif === "STAGE_PFE"
                                    ? "Periode Stage PFE: pas de seances d'absence a planifier."
                                    : "Aucune seance trouvee pour ces filtres et ce semestre."}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {selectedSeance && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => !submitting && setSelectedSeance(null)} />

                    <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col animate-in fade-in zoom-in">
                        <div className="enseignant-absences-top-band bg-gradient-to-r from-[#042954] to-[#0a3d7a] px-6 py-5">
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <h3 className="text-lg font-bold text-white">Liste d'appel</h3>
                                    <p className="text-sm text-white/80 mt-1">
                                        {selectedSeance.matiereNom} • {selectedSeance.classeCode} • {selectedDate}
                                    </p>
                                    <p className="text-xs text-white/70 mt-1 flex items-center gap-1">
                                        <Clock size={12} /> {toTimeHHMM(selectedSeance.heureDebut)} - {toTimeHHMM(selectedSeance.heureFin)}
                                    </p>
                                    <p className="text-xs text-white/70 mt-1">
                                        Salle: {selectedSeance.salle?.trim() ? selectedSeance.salle : "N/A"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => !submitting && setSelectedSeance(null)}
                                    className="text-white/70 hover:text-white"
                                >
                                    <X size={22} />
                                </button>
                            </div>
                        </div>

                        <div className="px-6 py-3 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                                <span className="flex items-center gap-1.5 text-gray-700">
                                    <Users size={14} /> {etudiants.length} etudiants
                                </span>
                                <span className="text-red-600 font-semibold">{absentIds.size} absents</span>
                                <span className="text-green-600 font-semibold">{etudiants.length - absentIds.size} presents</span>
                            </div>
                            <button
                                onClick={toggleAll}
                                className="text-xs font-bold text-[#042954] dark:text-white hover:text-[#ffa000]"
                            >
                                {absentIds.size === etudiants.length ? "Tout decocher" : "Tout cocher"}
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto px-6 py-3">
                            {loadingModal ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#ffa000]" />
                                </div>
                            ) : etudiants.length === 0 ? (
                                <div className="py-12 text-center text-gray-500 dark:text-slate-400">Aucun etudiant trouve pour cette classe.</div>
                            ) : (
                                <div className="space-y-1">
                                    {etudiants.map((etudiant, idx) => {
                                        const isAbsent = absentIds.has(etudiant.id);
                                        return (
                                            <button
                                                key={etudiant.id}
                                                onClick={() => toggleAbsent(etudiant.id)}
                                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all ${isAbsent
                                                        ? "border-red-200 bg-red-50"
                                                        : "border-transparent bg-white dark:bg-slate-800 hover:bg-gray-50 dark:bg-slate-800/50 hover:border-gray-200 dark:border-slate-700"
                                                    }`}
                                            >
                                                <div
                                                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${isAbsent ? "bg-red-500 border-red-500" : "border-gray-300 dark:border-slate-600"
                                                        }`}
                                                >
                                                    {isAbsent && <Check size={12} className="text-white" strokeWidth={3} />}
                                                </div>
                                                <span className="text-xs text-gray-400 dark:text-slate-500 font-bold w-6 text-center">{idx + 1}</span>
                                                <div className="flex-1 min-w-0">
                                                    <div className={`text-sm font-bold truncate ${isAbsent ? "text-red-700 dark:text-red-400" : "text-[#333] dark:text-green-500"}`}>
                                                        {etudiant.nom} {etudiant.prenom}
                                                    </div>
                                                    <div className="text-[11px] text-gray-400 dark:text-slate-500 font-mono">{etudiant.matricule}</div>
                                                </div>
                                                <span
                                                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${isAbsent ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-500"
                                                        }`}
                                                >
                                                    {isAbsent ? "Absent" : "Present"}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => !submitting && setSelectedSeance(null)}
                                className="px-5 py-2.5 font-semibold text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:bg-slate-800/50 rounded-lg text-sm"
                                disabled={submitting}
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSubmitAbsences}
                                disabled={submitting || loadingModal}
                                className={`px-6 py-2.5 rounded-lg font-bold text-white transition-all shadow-md flex items-center gap-2 text-sm ${submitting ? "bg-[#ffc166] cursor-not-allowed" : "bg-[#ffa000] hover:bg-[#ff8f00]"
                                    }`}
                            >
                                <Save size={16} />
                                {submitting
                                    ? "Enregistrement..."
                                    : `Enregistrer (${absentIds.size} absent${absentIds.size > 1 ? "s" : ""})`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
