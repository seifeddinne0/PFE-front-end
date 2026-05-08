"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Calendar, Filter, Clock, MapPin, User, Search, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

interface Creneau {
    id: number;
    ordre: number;
    heureDebut: string;
    heureFin: string;
    label: string;
}

interface Seance {
    id: number;
    jourSemaine: string;
    heureDebut: string;
    heureFin: string;
    salle: string;
    typeSeance: string;
    semestre: string;
    niveauId: number;
    niveauCode: string;
    creneauId: number;
    creneauLabel: string;
    matiereId: number;
    matiereNom: string;
    matiereCode: string;
    classeId: number | null;
    classeCode: string | null;
    enseignantId: number | null;
    enseignantNom: string | null;
}

export default function EmploiDuTempsPage() {
    const [seances, setSeances] = useState<Seance[]>([]);
    const [creneaux, setCreneaux] = useState<Creneau[]>([]);
    const [loading, setLoading] = useState(true);
    const [conflits, setConflits] = useState<any[]>([]);
    
    const [filterFiliere, setFilterFiliere] = useState("ALL");
    const [filterSemestre, setFilterSemestre] = useState("ALL");
    const [filterNiveau, setFilterNiveau] = useState("ALL");
    const [filterClasse, setFilterClasse] = useState("ALL");
    const [filterEnseignant, setFilterEnseignant] = useState("ALL");

    const JOURS = ["LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [seancesRes, creneauxRes, conflitsRes] = await Promise.all([
                api.get("/api/seances"),
                api.get("/api/admin/creneaux"),
                api.get("/api/vue-conflits").catch(() => []) // Optional if not created yet
            ]);
            setSeances(seancesRes);
            setCreneaux(creneauxRes.sort((a: Creneau, b: Creneau) => a.ordre - b.ordre));
            setConflits(conflitsRes || []);
        } catch (error) {
            toast.error("Erreur lors du chargement de l'emploi du temps");
        } finally {
            setLoading(false);
        }
    };

    // Derived filter options based on existing data
    const filieresMap = new Map();
    seances.forEach(s => {
        if (s.niveauCode) {
            const fCode = s.niveauCode.match(/^[A-Za-z]+/)?.[0];
            if (fCode) filieresMap.set(fCode, fCode);
        }
    });
    const filieres = Array.from(filieresMap.values());
    
    const niveaux = Array.from(new Set(seances
        .filter(s => filterFiliere === "ALL" || s.niveauCode?.startsWith(filterFiliere))
        .map(s => s.niveauCode).filter(Boolean)));
        
    const classes = Array.from(new Set(seances
        .filter(s => filterFiliere === "ALL" || s.niveauCode?.startsWith(filterFiliere))
        .filter(s => filterNiveau === "ALL" || s.niveauCode === filterNiveau)
        .map(s => s.classeCode).filter(Boolean)));
        
    const enseignantsMap = new Map();
    seances.forEach(s => {
        if (s.enseignantId) {
            enseignantsMap.set(s.enseignantId, s.enseignantNom);
        }
    });
    const enseignants = Array.from(enseignantsMap.entries());

    // Get dynamic semesters based on selected Niveau
    const getSemestresOptions = () => {
        if (filterNiveau === "ALL") {
            return ["S1", "S2", "S3", "S4", "S5"];
        }
        
        const match = filterNiveau.match(/\d+$/);
        if (match) {
            const num = parseInt(match[0], 10);
            if (num === 1) return ["S1", "S2"];
            if (num === 2) return ["S3", "S4"];
            if (num === 3) return ["S5"]; // User specifically requested ONLY S5 for the 3rd year
        }
        
        return ["S1", "S2", "S3", "S4", "S5"];
    };

    // Apply filters
    const filteredSeances = seances.filter(s => {
        if (filterFiliere !== "ALL") {
            const fCode = s.niveauCode?.match(/^[A-Za-z]+/)?.[0];
            if (fCode !== filterFiliere) return false;
        }
        if (filterSemestre !== "ALL" && s.semestre !== filterSemestre) return false;
        if (filterNiveau !== "ALL" && s.niveauCode !== filterNiveau) return false;
        if (filterClasse !== "ALL" && s.classeCode !== filterClasse && s.typeSeance === 'TD') return false; // COURS don't have classes usually
        if (filterEnseignant !== "ALL" && s.enseignantId?.toString() !== filterEnseignant) return false;
        return true;
    });

    const getSeancesForCell = (jour: string, creneauId: number) => {
        return filteredSeances.filter(s => s.jourSemaine === jour && s.creneauId === creneauId);
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-[#042954] dark:text-zinc-100 flex items-center gap-2">
                        <Calendar className="text-[#ffa000]" />
                        Emploi du temps
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-400 mt-1">
                        Consultez et vérifiez les plannings académiques
                    </p>
                </div>
                
                {conflits.length > 0 && (
                    <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-r-lg max-w-md">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-red-500 mt-0.5" size={20} />
                            <div>
                                <h3 className="text-red-800 dark:text-red-300 font-bold text-sm">Conflits détectés ({conflits.length})</h3>
                                <p className="text-red-600 dark:text-red-400 text-xs mt-1">
                                    Des enseignants ou classes sont affectés à plusieurs séances simultanées. Veuillez vérifier l'onglet des affectations.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <div className="bg-white dark:bg-[#111111] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800/50 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Filière</label>
                        <select 
                            className="w-full p-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-[#ffa000]/50"
                            value={filterFiliere} onChange={e => { setFilterFiliere(e.target.value); setFilterNiveau("ALL"); setFilterClasse("ALL"); setFilterSemestre("ALL"); }}
                        >
                            <option value="ALL">Toutes</option>
                            {filieres.map(f => <option key={f as string} value={f as string}>{f as string}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Niveau</label>
                        <select 
                            className="w-full p-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-[#ffa000]/50"
                            value={filterNiveau} onChange={e => { setFilterNiveau(e.target.value); setFilterClasse("ALL"); setFilterSemestre("ALL"); }}
                        >
                            <option value="ALL">Tous</option>
                            {niveaux.map(n => <option key={n as string} value={n as string}>{n as string}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Classe</label>
                        <select 
                            className="w-full p-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-[#ffa000]/50"
                            value={filterClasse} onChange={e => setFilterClasse(e.target.value)}
                        >
                            <option value="ALL">Toutes</option>
                            {classes.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
                        </select>
                    </div>
                    <div className="flex-1 min-w-[150px]">
                        <label className="block text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1.5 uppercase tracking-wide">Semestre</label>
                        <select 
                            className="w-full p-2.5 bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-xl text-sm focus:ring-2 focus:ring-[#ffa000]/50"
                            value={filterSemestre} onChange={e => setFilterSemestre(e.target.value)}
                        >
                            <option value="ALL">Tous</option>
                            {getSemestresOptions().map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#111111] p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800/50 flex flex-wrap gap-4">
                    <div className="flex-1 min-w-[200px]">
                        <label className="block text-xs font-semibold text-blue-500 mb-1.5 uppercase tracking-wide flex items-center gap-1.5">
                            <User size={14} className="text-blue-500" />
                            Emploi du temps par Enseignant
                        </label>
                        <select 
                            className="w-full p-2.5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/50 rounded-xl text-sm font-medium focus:ring-2 focus:ring-blue-500/50 text-blue-900 dark:text-blue-100"
                            value={filterEnseignant} onChange={e => setFilterEnseignant(e.target.value)}
                        >
                            <option value="ALL">Tous les enseignants (Vue globale)</option>
                            {enseignants.map(([id, nom]) => <option key={id} value={id}>{nom}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffa000]"></div>
                </div>
            ) : (
                <div className="overflow-x-auto bg-white dark:bg-[#111111] rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800/50">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr>
                                <th className="p-4 bg-gray-50 dark:bg-zinc-900 border-b border-r border-gray-100 dark:border-zinc-800/50 w-32 font-bold text-center text-gray-500 dark:text-zinc-400 rounded-tl-2xl">
                                    <Clock className="mx-auto mb-1" size={18} />
                                    Créneau
                                </th>
                                {JOURS.map(jour => (
                                    <th key={jour} className="p-4 bg-gray-50 dark:bg-zinc-900 border-b border-r last:border-r-0 border-gray-100 dark:border-zinc-800/50 font-bold text-center text-[#042954] dark:text-zinc-100">
                                        {jour}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {creneaux.map(creneau => (
                                <tr key={creneau.id}>
                                    <td className="p-4 bg-gray-50 dark:bg-zinc-900 border-b border-r border-gray-100 dark:border-zinc-800/50 text-center font-medium text-sm text-gray-700 dark:text-zinc-300">
                                        {creneau.label}
                                    </td>
                                    {JOURS.map(jour => {
                                        const seancesCell = getSeancesForCell(jour, creneau.id);
                                        return (
                                            <td key={`${jour}-${creneau.id}`} className="p-2 border-b border-r last:border-r-0 border-gray-100 dark:border-zinc-800/50 bg-white dark:bg-[#0a0a0a] align-top min-h-[120px] w-1/6">
                                                <div className="flex flex-col gap-2">
                                                    {seancesCell.map(seance => (
                                                        <div 
                                                            key={seance.id} 
                                                            className={`p-3 rounded-xl border flex flex-col gap-1.5 transition-all hover:shadow-md
                                                                ${seance.typeSeance === 'COURS' 
                                                                    ? 'bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/50' 
                                                                    : 'bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/50'}
                                                            `}
                                                        >
                                                            <div className="flex justify-between items-start gap-1">
                                                                <span className="font-bold text-sm text-[#042954] dark:text-zinc-100 leading-tight">
                                                                    {seance.matiereNom}
                                                                </span>
                                                                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase
                                                                    ${seance.typeSeance === 'COURS' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'}
                                                                `}>
                                                                    {seance.typeSeance}
                                                                </span>
                                                            </div>
                                                            
                                                            <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400 font-medium mt-1">
                                                                <MapPin size={12} className="shrink-0" />
                                                                <span className="truncate">{seance.salle || 'N/A'}</span>
                                                                {seance.classeCode && (
                                                                    <>
                                                                        <span className="opacity-50">•</span>
                                                                        <span>{seance.classeCode}</span>
                                                                    </>
                                                                )}
                                                            </div>

                                                            <div className={`flex items-center gap-1.5 text-xs font-semibold px-2 py-1.5 rounded-lg mt-0.5
                                                                ${seance.enseignantId ? 'bg-white/60 dark:bg-black/20 text-[#333333] dark:text-zinc-300' : 'bg-orange-100/80 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400'}
                                                            `}>
                                                                {seance.enseignantId ? (
                                                                    <>
                                                                        <User size={12} className="shrink-0" />
                                                                        <span className="truncate">{seance.enseignantNom}</span>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <AlertTriangle size={12} className="shrink-0" />
                                                                        <span>Non assigné</span>
                                                                    </>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {seancesCell.length === 0 && (
                                                        <div className="h-full min-h-[80px] flex items-center justify-center">
                                                            <span className="text-gray-300 dark:text-zinc-700 text-xs">-</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
