"use client";

import { useEffect, useMemo, useState } from "react";
import {
    Search,
    Filter,
    Send,
    AlertTriangle,
    BookOpen,
} from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Note {
    id: number;
    etudiantNom: string;
    etudiantPrenom: string;
    etudiantId: number;
    matiereId: number;
    matiereNom: string;
    matiereCoefficient: number;
    valeur: number;
    typeNote: string;
    semestre: string;
    enseignantNom: string;
}

interface BulletinRow {
    key: string;
    semestre: string;
    matiereNom: string;
    coeff: number;
    ds: number | null;
    tp: number | null;
    examen: number | null;
    moyenne: number;
}

interface EtudiantMeta {
    id: number;
    nom: string;
    prenom: string;
    matricule: string;
    classeCode: string;
}

interface StudentSummary {
    id: number;
    nomComplet: string;
    matricule: string;
    classeCode: string;
    totalNotes: number;
    moyenne: number;
}

const SEMESTRES = ["Tous", "S1", "S2", "S3", "S4", "S5"];

function normalizeNote(raw: any): Note {
    return {
        id: raw?.id,
        etudiantNom: raw?.etudiantNom ?? "",
        etudiantPrenom: raw?.etudiantPrenom ?? "",
        etudiantId: raw?.etudiantId,
        matiereId: raw?.matiereId,
        matiereNom: raw?.matiereNom ?? raw?.matiere ?? "",
        matiereCoefficient: raw?.matiereCoefficient ?? 1,
        valeur: raw?.valeur ?? raw?.note,
        typeNote: raw?.typeNote ?? raw?.type ?? "",
        semestre: raw?.semestre ?? "",
        enseignantNom: raw?.enseignantNom ?? "",
    };
}

function parseFiliere(classeCode?: string): string {
    if (!classeCode) return "";
    const match = classeCode.toUpperCase().match(/^([A-Z]+)\d/);
    return match ? match[1] : "";
}

function parseNiveau(classeCode?: string): string {
    if (!classeCode) return "";
    const match = classeCode.toUpperCase().match(/^([A-Z]+\d)/);
    return match ? match[1] : "";
}

function semestreOrder(semestre?: string): number {
    if (!semestre) return 99;
    if (semestre === "S1") return 1;
    if (semestre === "S2") return 2;
    if (semestre === "S3") return 3;
    if (semestre === "S4") return 4;
    if (semestre === "S5") return 5;
    return 99;
}

function toTypeForFormula(typeNote?: string): "DS" | "TP" | "EXAMEN" | null {
    if (!typeNote) return null;
    if (typeNote === "CONTROLE" || typeNote === "DS") return "DS";
    if (typeNote === "TP") return "TP";
    if (typeNote === "EXAMEN") return "EXAMEN";
    return null;
}

function computeMatiereMoyenne(ds: number | null, tp: number | null, examen: number | null): number {
    return (examen ?? 0) * 0.7 + (ds ?? 0) * 0.15 + (tp ?? 0) * 0.15;
}

export default function AdminNotesListPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [etudiantsById, setEtudiantsById] = useState<Record<number, EtudiantMeta>>({});
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [selectedFiliere, setSelectedFiliere] = useState("Tous");
    const [selectedNiveau, setSelectedNiveau] = useState("Tous");
    const [selectedSemestre, setSelectedSemestre] = useState("Tous");

    const [selectedEtudiantId, setSelectedEtudiantId] = useState<number | null>(null);
    const [isSendingBulletins, setIsSendingBulletins] = useState(false);
    const [showSendConfirm, setShowSendConfirm] = useState(false);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [notesData, etudiantsData] = await Promise.all([
                api.get("/api/admin/notes?page=0&size=5000"),
                api.get("/api/admin/etudiants?page=0&size=5000"),
            ]);

            const notesArray = Array.isArray(notesData)
                ? notesData
                : Array.isArray(notesData?.content)
                    ? notesData.content
                    : [];

            const etudiantsArray = Array.isArray(etudiantsData)
                ? etudiantsData
                : Array.isArray(etudiantsData?.content)
                    ? etudiantsData.content
                    : [];

            const map: Record<number, EtudiantMeta> = {};
            for (const e of etudiantsArray) {
                map[e.id] = {
                    id: e.id,
                    nom: e.nom ?? "",
                    prenom: e.prenom ?? "",
                    matricule: e.matricule ?? "",
                    classeCode: e.classeCode ?? "",
                };
            }

            setEtudiantsById(map);
            setNotes(notesArray.map(normalizeNote));
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du chargement des notes.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filiereOptions = useMemo(() => {
        const values = Object.values(etudiantsById)
            .map((e) => parseFiliere(e.classeCode))
            .filter(Boolean);
        return ["Tous", ...Array.from(new Set(values)).sort()];
    }, [etudiantsById]);

    const niveauOptions = useMemo(() => {
        const values = Object.values(etudiantsById)
            .filter((e) => selectedFiliere === "Tous" || parseFiliere(e.classeCode) === selectedFiliere)
            .map((e) => parseNiveau(e.classeCode))
            .filter(Boolean);
        return ["Tous", ...Array.from(new Set(values)).sort()];
    }, [etudiantsById, selectedFiliere]);

    const filteredNotes = useMemo(() => {
        const q = searchTerm.trim().toLowerCase();

        return notes.filter((n) => {
            const etudiant = etudiantsById[n.etudiantId];
            const classeCode = etudiant?.classeCode ?? "";
            const filiere = parseFiliere(classeCode);
            const niveau = parseNiveau(classeCode);

            const matchFiliere = selectedFiliere === "Tous" || filiere === selectedFiliere;
            const matchNiveau = selectedNiveau === "Tous" || niveau === selectedNiveau;
            const matchSemestre = selectedSemestre === "Tous" || n.semestre === selectedSemestre;

            const text = [
                n.etudiantNom,
                n.etudiantPrenom,
                etudiant?.matricule,
                n.matiereNom,
                n.enseignantNom,
                classeCode,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const matchSearch = !q || text.includes(q);
            return matchFiliere && matchNiveau && matchSemestre && matchSearch;
        });
    }, [notes, etudiantsById, selectedFiliere, selectedNiveau, selectedSemestre, searchTerm]);

    const studentSummaries = useMemo(() => {
        const grouped = new Map<number, StudentSummary>();

        for (const n of filteredNotes) {
            const current = grouped.get(n.etudiantId);
            const e = etudiantsById[n.etudiantId];
            const nomComplet = e
                ? `${e.nom} ${e.prenom}`.trim()
                : `${n.etudiantNom} ${n.etudiantPrenom}`.trim();

            if (!current) {
                grouped.set(n.etudiantId, {
                    id: n.etudiantId,
                    nomComplet,
                    matricule: e?.matricule ?? "-",
                    classeCode: e?.classeCode ?? "-",
                    totalNotes: 1,
                    moyenne: n.valeur ?? 0,
                });
            } else {
                current.totalNotes += 1;
                current.moyenne += n.valeur ?? 0;
            }
        }

        const out = Array.from(grouped.values()).map((s) => ({
            ...s,
            moyenne: s.totalNotes > 0 ? s.moyenne / s.totalNotes : 0,
        }));

        out.sort((a, b) => a.nomComplet.localeCompare(b.nomComplet));
        return out;
    }, [filteredNotes, etudiantsById]);

    useEffect(() => {
        if (studentSummaries.length === 0) {
            setSelectedEtudiantId(null);
            return;
        }
        const exists = selectedEtudiantId != null && studentSummaries.some((s) => s.id === selectedEtudiantId);
        if (!exists) {
            setSelectedEtudiantId(studentSummaries[0].id);
        }
    }, [studentSummaries, selectedEtudiantId]);

    const selectedStudent = selectedEtudiantId != null ? etudiantsById[selectedEtudiantId] : null;

    const selectedStudentNotes = useMemo(() => {
        if (selectedEtudiantId == null) return [];
        return filteredNotes
            .filter((n) => n.etudiantId === selectedEtudiantId)
            .sort((a, b) => {
                const semDiff = semestreOrder(a.semestre) - semestreOrder(b.semestre);
                if (semDiff !== 0) return semDiff;
                return a.matiereNom.localeCompare(b.matiereNom);
            });
    }, [filteredNotes, selectedEtudiantId]);

    const selectedStudentRows = useMemo(() => {
        type Acc = {
            semestre: string;
            matiereNom: string;
            coeff: number;
            dsValues: number[];
            tpValues: number[];
            examValues: number[];
        };

        const map = new Map<string, Acc>();

        for (const n of selectedStudentNotes) {
            const key = `${n.semestre || "-"}::${n.matiereId || n.matiereNom}`;
            if (!map.has(key)) {
                map.set(key, {
                    semestre: n.semestre || "-",
                    matiereNom: n.matiereNom || "-",
                    coeff: n.matiereCoefficient ?? 1,
                    dsValues: [],
                    tpValues: [],
                    examValues: [],
                });
            }

            const row = map.get(key)!;
            const mappedType = toTypeForFormula(n.typeNote);
            if (mappedType === "DS") row.dsValues.push(n.valeur ?? 0);
            if (mappedType === "TP") row.tpValues.push(n.valeur ?? 0);
            if (mappedType === "EXAMEN") row.examValues.push(n.valeur ?? 0);
        }

        return Array.from(map.entries())
            .map(([key, acc]): BulletinRow => {
                const ds = acc.dsValues.length > 0 ? acc.dsValues.reduce((s, v) => s + v, 0) / acc.dsValues.length : null;
                const tp = acc.tpValues.length > 0 ? acc.tpValues.reduce((s, v) => s + v, 0) / acc.tpValues.length : null;
                const examen = acc.examValues.length > 0 ? acc.examValues.reduce((s, v) => s + v, 0) / acc.examValues.length : null;
                return {
                    key,
                    semestre: acc.semestre,
                    matiereNom: acc.matiereNom,
                    coeff: acc.coeff,
                    ds,
                    tp,
                    examen,
                    moyenne: computeMatiereMoyenne(ds, tp, examen),
                };
            })
            .sort((a, b) => {
                const semDiff = semestreOrder(a.semestre) - semestreOrder(b.semestre);
                if (semDiff !== 0) return semDiff;
                return a.matiereNom.localeCompare(b.matiereNom);
            });
    }, [selectedStudentNotes]);

    const openSendLevelBulletinsConfirm = () => {
        if (selectedNiveau === "Tous") {
            toast.error("Veuillez sélectionner un niveau spécifique pour l'envoi.");
            return;
        }

        setShowSendConfirm(true);
    };

    const handleSendLevelBulletins = async () => {
        setShowSendConfirm(false);

        setIsSendingBulletins(true);
        try {
            const result = await api.post(`/api/admin/notes/bulletins/envoyer?niveauCode=${encodeURIComponent(selectedNiveau)}`, {});
            toast.success(
                `Envoi terminé (${selectedNiveau}) : ${result?.sent ?? 0} envoyés, ${result?.failed ?? 0} échecs, ${result?.skipped ?? 0} ignorés.`
            );
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'envoi des bulletins.");
        } finally {
            setIsSendingBulletins(false);
        }
    };

    const getNoteColor = (note: number) => {
        if (note >= 16) return "text-green-700 bg-green-50";
        if (note >= 12) return "text-blue-700 bg-blue-50";
        if (note >= 10) return "text-yellow-700 bg-yellow-50";
        return "text-red-700 bg-red-50";
    };

    return (
        <div className="space-y-5">
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-5">
                <h2 className="text-xl font-bold text-[#042954] dark:text-white mb-4">Notes & Résultats</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-3">
                    <div className="relative xl:col-span-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Rechercher étudiant, matière, matricule..."
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffa000] text-sm"
                        />
                    </div>

                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={16} />
                        <select
                            value={selectedFiliere}
                            onChange={(e) => {
                                setSelectedFiliere(e.target.value);
                                setSelectedNiveau("Tous");
                            }}
                            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffa000] text-sm"
                        >
                            {filiereOptions.map((f) => (
                                <option key={f} value={f}>
                                    {f === "Tous" ? "Toutes les filières" : f}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <select
                            value={selectedNiveau}
                            onChange={(e) => setSelectedNiveau(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffa000] text-sm"
                        >
                            {niveauOptions.map((n) => (
                                <option key={n} value={n}>
                                    {n === "Tous" ? "Tous les niveaux" : n}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <select
                            value={selectedSemestre}
                            onChange={(e) => setSelectedSemestre(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffa000] text-sm"
                        >
                            {SEMESTRES.map((s) => (
                                <option key={s} value={s}>
                                    {s === "Tous" ? "Tous les semestres" : s}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {isLoading ? (
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-12 text-center text-gray-500 dark:text-slate-400">
                    Chargement des notes...
                </div>
            ) : (
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                    <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
                            <h3 className="font-bold text-[#042954] dark:text-white">Liste des étudiants</h3>
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-bold">
                                {studentSummaries.length}
                            </span>
                        </div>

                        <div className="max-h-[560px] overflow-y-auto">
                            {studentSummaries.length === 0 ? (
                                <div className="p-6 text-center text-gray-500 dark:text-slate-400 text-sm">
                                    Aucun étudiant trouvé pour ces filtres.
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                                    {studentSummaries.map((s) => {
                                        const active = s.id === selectedEtudiantId;
                                        return (
                                            <button
                                                key={s.id}
                                                onClick={() => setSelectedEtudiantId(s.id)}
                                                className={`w-full text-left p-4 transition-colors ${active ? "bg-orange-50 dark:bg-[#ffa000]/10 border-l-4 border-[#ffa000]" : "hover:bg-gray-50/50 dark:hover:bg-[#151515] border-l-4 border-transparent"}`}
                                            >
                                                <div className="font-bold text-[#333333] dark:text-zinc-100">{s.nomComplet}</div>
                                                <div className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                                                    {s.matricule} • {s.classeCode}
                                                </div>
                                                <div className="mt-2 flex items-center gap-3 text-xs">
                                                    <span className="px-2 py-0.5 rounded bg-gray-100 dark:bg-zinc-800 text-gray-700 dark:text-zinc-300 font-semibold">
                                                        {s.totalNotes} notes
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded font-semibold ${getNoteColor(s.moyenne)}`}>
                                                        Moy: {s.moyenne.toFixed(2)}
                                                    </span>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="xl:col-span-2 bg-white dark:bg-[#111111] rounded-xl border border-gray-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                        {!selectedStudent ? (
                            <div className="p-10 text-center text-gray-500 dark:text-slate-400">
                                Sélectionnez un étudiant pour afficher son relevé de notes.
                            </div>
                        ) : (
                            <>
                                <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <div>
                                        <h3 className="font-bold text-[#042954] dark:text-white text-lg">
                                            {selectedStudent.nom} {selectedStudent.prenom}
                                        </h3>
                                        <p className="text-sm text-gray-500 dark:text-slate-400">
                                            {selectedStudent.matricule} • {selectedStudent.classeCode}
                                        </p>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-2">
                                        <button
                                            onClick={openSendLevelBulletinsConfirm}
                                            disabled={isSendingBulletins || selectedNiveau === "Tous"}
                                            className="px-3 py-2 rounded-lg text-sm font-semibold bg-[#ffa000] text-white hover:bg-[#ff8f00] transition-colors flex items-center gap-2"
                                        >
                                            <Send size={16} />
                                            {isSendingBulletins ? "Envoi..." : "Envoyer bulletins du niveau"}
                                        </button>
                                    </div>
                                </div>

                                {selectedStudentRows.length === 0 ? (
                                    <div className="p-10 text-center text-gray-500 dark:text-slate-400">Aucune note pour cet étudiant avec les filtres actuels.</div>
                                ) : (
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800/50 text-sm">
                                                    <th className="p-3 font-semibold">Semestre</th>
                                                    <th className="p-3 font-semibold">Matière</th>
                                                    <th className="p-3 font-semibold text-center">Coeff</th>
                                                    <th className="p-3 font-semibold text-center">DS</th>
                                                    <th className="p-3 font-semibold text-center">TP</th>
                                                    <th className="p-3 font-semibold text-center">EXAMEN</th>
                                                    <th className="p-3 font-semibold text-center">Moyenne</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedStudentRows.map((n) => (
                                                    <tr key={n.key} className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-[#151515] transition-colors dark:text-zinc-300">
                                                        <td className="p-3">
                                                            <span className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded font-bold">
                                                                {n.semestre}
                                                            </span>
                                                        </td>
                                                        <td className="p-3 font-bold text-[#333333] dark:text-zinc-100">{n.matiereNom || "-"}</td>
                                                        <td className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-zinc-400">
                                                            {n.coeff.toFixed(2)}
                                                        </td>
                                                        <td className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-zinc-300">
                                                            {n.ds != null ? n.ds.toFixed(2) : "-"}
                                                        </td>
                                                        <td className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-zinc-300">
                                                            {n.tp != null ? n.tp.toFixed(2) : "-"}
                                                        </td>
                                                        <td className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-zinc-300">
                                                            {n.examen != null ? n.examen.toFixed(2) : "-"}
                                                        </td>
                                                        <td className="p-3 text-center">
                                                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${getNoteColor(n.moyenne)}`}>
                                                                {n.moyenne.toFixed(2)}
                                                            </span>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}

                                {selectedStudentRows.length > 0 && (
                                    <div className="p-4 border-t border-gray-100 dark:border-zinc-800/50 bg-gray-50 dark:bg-[#1a1a1a] text-sm text-gray-600 dark:text-zinc-400 flex items-center gap-2">
                                        <BookOpen size={16} className="text-[#042954] dark:text-white" />
                                        Tableau bulletin: Moyenne matière = EXAMEN × 0.7 + DS × 0.15 + TP × 0.15.
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}

            {showSendConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-800 shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                                <AlertTriangle size={18} />
                            </div>
                            <div>
                                <h4 className="font-bold text-[#042954] dark:text-white">Confirmer l'envoi</h4>
                                <p className="text-xs text-gray-500 dark:text-slate-400">Action groupée pour le niveau sélectionné</p>
                            </div>
                        </div>

                        <div className="px-5 py-4 text-sm text-gray-700 leading-relaxed">
                            Envoyer les bulletins PDF à tous les étudiants du niveau
                            <span className="mx-1 inline-flex rounded-md bg-blue-50 text-blue-700 px-2 py-0.5 font-bold">
                                {selectedNiveau}
                            </span>
                            ?
                        </div>

                        <div className="px-5 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-100 dark:border-slate-700 flex items-center justify-end gap-2">
                            <button
                                onClick={() => setShowSendConfirm(false)}
                                className="px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-gray-700 text-sm font-semibold hover:bg-gray-100 transition-colors"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleSendLevelBulletins}
                                className="px-4 py-2 rounded-lg bg-[#ffa000] text-white text-sm font-semibold hover:bg-[#ff8f00] transition-colors"
                            >
                                Confirmer l'envoi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
