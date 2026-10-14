"use client";

import { useMemo } from "react";

interface SeanceItem {
    id?: number;
    jourSemaine?: string;
    heureDebut?: string;
    heureFin?: string;
    matiereNom?: string;
    salle?: string;
    classeCode?: string;
    typeSeance?: string;
    semestre?: string;
    niveauCode?: string;
    creneauLabel?: string;
    creneauId?: number;
}

const DAY_ORDER = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"] as const;
const DAY_LABELS = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"] as const;
const START_HOUR = 8;
const END_HOUR = 17;
const HOUR_HEIGHT = 60;

const toMinutes = (time?: string) => {
    if (!time) return null;
    const parts = time.split(":").map(Number);
    if (parts.length < 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
    return parts[0] * 60 + parts[1];
};

const formatTime = (time?: string) => {
    if (!time) return "";
    const [h, m] = time.split(":");
    if (!h || !m) return time;
    return `${h.padStart(2, "0")}:${m.padStart(2, "0")}`;
};

const getWeekDates = () => {
    const today = new Date();
    const dayIndex = (today.getDay() + 6) % 7; // Monday as 0
    const monday = new Date(today);
    monday.setDate(today.getDate() - dayIndex);
    return DAY_ORDER.map((_, idx) => {
        const d = new Date(monday);
        d.setDate(monday.getDate() + idx);
        return d;
    });
};

const normalizeDay = (day?: string) => (day || "").trim().toUpperCase();

interface EtudiantScheduleProps {
    seances: SeanceItem[];
    classeLabel?: string | null;
}

export default function EtudiantSchedule({ seances, classeLabel }: EtudiantScheduleProps) {
    const weekDates = useMemo(getWeekDates, []);

    const seancesByDay = useMemo(() => {
        const map: Record<string, SeanceItem[]> = {};
        DAY_ORDER.forEach((day) => {
            map[day] = [];
        });
        seances.forEach((seance) => {
            const dayKey = normalizeDay(seance.jourSemaine);
            if (map[dayKey]) {
                map[dayKey].push(seance);
            }
        });
        return map;
    }, [seances]);
    const collapseBySlot = (daySeances: SeanceItem[]) => {
        const preferredClasse = classeLabel?.trim().toUpperCase();
        const groups = new Map<string, SeanceItem[]>();

        daySeances.forEach((seance) => {
            const key = seance.creneauId
                ? `cr-${seance.creneauId}`
                : `${seance.heureDebut || ""}-${seance.heureFin || ""}`;
            if (!groups.has(key)) groups.set(key, []);
            groups.get(key)!.push(seance);
        });

        const pickBest = (items: SeanceItem[]) => {
            if (preferredClasse) {
                const exactClasse = items.find(
                    (item) => item.classeCode?.trim().toUpperCase() === preferredClasse
                );
                if (exactClasse) return exactClasse;
            }
            const withClasse = items.find((item) => item.classeCode);
            return withClasse || items[0];
        };

        return Array.from(groups.values()).map(pickBest);
    };

    const hasSeances = seances.length > 0;
    const totalMinutes = (END_HOUR - START_HOUR) * 60;
    const scheduleHeight = (END_HOUR - START_HOUR) * HOUR_HEIGHT;
    const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between gap-4 mb-5">
                <div>
                    <h3 className="text-lg font-bold text-[#042954] dark:text-white">Emploi du temps</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Votre planning de seances de la semaine</p>
                </div>
                <div className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest bg-[#042954]/10 text-[#042954] dark:bg-slate-700 dark:text-white">
                    {classeLabel || "Niveau / Classe"}
                </div>
            </div>

            {!hasSeances ? (
                <div className="text-sm text-gray-500 dark:text-slate-400">Aucune seance disponible pour votre classe.</div>
            ) : (
                <div className="overflow-x-auto">
                    <div className="min-w-[900px]">
                        <div className="grid grid-cols-[80px_repeat(6,minmax(0,1fr))]">
                            <div />
                            {DAY_ORDER.map((day, idx) => (
                                <div
                                    key={day}
                                    className="text-center text-sm font-bold text-gray-700 dark:text-slate-200 border-b border-gray-200 dark:border-slate-700 py-2"
                                >
                                    {DAY_LABELS[idx]} {weekDates[idx].toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                                </div>
                            ))}
                        </div>

                        <div className="grid grid-cols-[80px_repeat(6,minmax(0,1fr))]">
                            <div className="flex flex-col" style={{ height: `${scheduleHeight}px` }}>
                                {hours.map((hour) => (
                                    <div key={hour} className="h-[60px] text-xs font-bold text-gray-500 dark:text-slate-400 border-r border-gray-200 dark:border-slate-700 flex items-start justify-center pt-1">
                                        {String(hour).padStart(2, "0")} h
                                    </div>
                                ))}
                            </div>

                            {DAY_ORDER.map((day) => (
                                <div key={day} className="relative border-l border-gray-200 dark:border-slate-700" style={{ height: `${scheduleHeight}px` }}>
                                    <div
                                        className="absolute inset-0"
                                        style={{
                                            backgroundImage: "repeating-linear-gradient(to bottom, rgba(148,163,184,0.25) 0, rgba(148,163,184,0.25) 1px, transparent 1px, transparent 60px)"
                                        }}
                                    />
                                    {collapseBySlot(seancesByDay[day] || []).map((seance, index) => {
                                        const start = toMinutes(seance.heureDebut);
                                        const end = toMinutes(seance.heureFin);
                                        if (start === null || end === null) return null;
                                        const clampedStart = Math.max(start, START_HOUR * 60);
                                        const clampedEnd = Math.min(end, END_HOUR * 60);
                                        if (clampedEnd <= clampedStart) return null;
                                        const topPct = ((clampedStart - START_HOUR * 60) / totalMinutes) * 100;
                                        const heightPct = ((clampedEnd - clampedStart) / totalMinutes) * 100;
                                        const isTD = seance.typeSeance?.trim().toUpperCase() === "TD";

                                        return (
                                            <div
                                                key={`${seance.id ?? seance.matiereNom}-${index}`}
                                                className={`absolute left-2 right-2 rounded-lg text-white text-xs shadow-md px-2 py-1.5 ${
                                                    isTD ? "bg-[#facc15] text-[#1f2937]" : "bg-[#3b82f6]"
                                                }`}
                                                style={{ top: `${topPct}%`, height: `${heightPct}%` }}
                                            >
                                                <div className="font-semibold">{seance.creneauLabel || `${formatTime(seance.heureDebut)} - ${formatTime(seance.heureFin)}`}</div>
                                                <div className="font-bold">{seance.matiereNom || "Seance"}</div>
                                                <div className="opacity-90 text-[11px]">{seance.typeSeance || ""}{seance.classeCode ? ` • ${seance.classeCode}` : ""}{seance.salle ? ` • ${seance.salle}` : ""}</div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
