"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, AlertCircle, Download } from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Note {
    id: number;
    matiereId: number;
    matiereNom: string;
    matiereCoefficient: number;
    valeur: number;
    typeNote: string;
    semestre: string;
    commentaire: string;
    enseignantNom?: string;
}

interface BulletinRow {
    key: string;
    matiereNom: string;
    coeff: number;
    ds: number | null;
    tp: number | null;
    examen: number | null;
    moyenne: number;
}

function semestreOrder(semestre?: string): number {
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

export default function EtudiantNotesPage() {
    const router = useRouter();
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchNotes = async () => {
            const token = sessionStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const data = await api.get("/api/etudiant/notes");
                const list = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.content)
                        ? data.content
                        : [];
                setNotes(list);
            } catch (error: any) {
                toast.error(error.message || "Erreur lors du chargement des notes");
                setNotes([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotes();
    }, [router]);

    const bulletinRows = useMemo<BulletinRow[]>(() => {
        type Acc = {
            semestre: string;
            matiereNom: string;
            coeff: number;
            dsValues: number[];
            tpValues: number[];
            examValues: number[];
        };

        const map = new Map<string, Acc>();

        for (const n of notes) {
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
            .map(([key, acc]) => {
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
    }, [notes]);

    const moyenneGenerale = useMemo(() => {
        if (bulletinRows.length === 0) return 0;

        const totalCoeff = bulletinRows.reduce((sum, row) => sum + (row.coeff || 1), 0);
        if (totalCoeff === 0) return 0;

        const total = bulletinRows.reduce((sum, row) => sum + row.moyenne * (row.coeff || 1), 0);
        return total / totalCoeff;
    }, [bulletinRows]);

    const handleDownloadMyBulletin = async () => {
        setIsDownloading(true);
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch("http://localhost:8080/api/etudiant/notes/bulletin", {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) {
                throw new Error("Le bulletin n'est pas disponible pour le moment.");
            }

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "mon_bulletin_complet.pdf";
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Bulletin téléchargé avec succès");
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du téléchargement du bulletin");
        } finally {
            setIsDownloading(false);
        }
    };

    const getNoteColor = (note: number) => {
        if (note >= 16) return "text-green-700 bg-green-50 dark:text-green-300 dark:bg-green-900/30";
        if (note >= 12) return "text-blue-700 bg-blue-50 dark:text-blue-300 dark:bg-blue-900/30";
        if (note >= 10) return "text-yellow-700 bg-yellow-50 dark:text-yellow-300 dark:bg-yellow-900/30";
        return "text-red-700 bg-red-50 dark:text-red-300 dark:bg-red-900/30";
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#042954] dark:border-slate-200"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-[#042954] dark:text-white tracking-tight">Mes Notes & Résultats</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Tableau complet de vos matières</p>
                </div>

                <button
                    onClick={handleDownloadMyBulletin}
                    disabled={isDownloading || notes.length === 0}
                    className="px-4 py-2 rounded-lg text-sm font-semibold bg-[#ffa000] text-white hover:bg-[#ff8f00] disabled:opacity-60 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                    <Download size={16} />
                    {isDownloading ? "Téléchargement..." : "Télécharger mon bulletin PDF"}
                </button>
            </div>

            {notes.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700 p-12 text-center flex flex-col items-center justify-center gap-4">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                        <FileText size={40} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#042954] dark:text-white">Aucune note publiée</h3>
                        <p className="text-gray-500 dark:text-slate-400 max-w-sm mx-auto mt-2">
                            Vos notes ne sont pas encore disponibles.
                        </p>
                    </div>
                </div>
            ) : (
                <>
                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-4">
                        <span className="text-sm text-gray-500 dark:text-slate-400">Moyenne générale</span>
                        <div className={`inline-block ml-3 px-3 py-1 rounded-full font-bold ${getNoteColor(moyenneGenerale)}`}>
                            {moyenneGenerale.toFixed(2)} / 20
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700/50 text-sm">
                                        <th className="p-3 font-semibold">Matière</th>
                                        <th className="p-3 font-semibold text-center">Coeff</th>
                                        <th className="p-3 font-semibold text-center">DS</th>
                                        <th className="p-3 font-semibold text-center">TP</th>
                                        <th className="p-3 font-semibold text-center">EXAMEN</th>
                                        <th className="p-3 font-semibold text-center">Moyenne</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bulletinRows.map((row) => (
                                        <tr key={row.key} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-[#151515] transition-colors dark:text-slate-300">
                                            <td className="p-3 font-medium text-[#333333] dark:text-slate-100">{row.matiereNom || "-"}</td>
                                            <td className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-slate-200">
                                                {row.coeff.toFixed(2)}
                                            </td>
                                            <td className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-slate-200">
                                                {row.ds != null ? row.ds.toFixed(2) : "-"}
                                            </td>
                                            <td className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-slate-200">
                                                {row.tp != null ? row.tp.toFixed(2) : "-"}
                                            </td>
                                            <td className="p-3 text-center text-sm font-semibold text-gray-700 dark:text-slate-200">
                                                {row.examen != null ? row.examen.toFixed(2) : "-"}
                                            </td>
                                            <td className="p-3 text-center">
                                                <span className={`text-xs px-2 py-1 rounded-full font-bold ${getNoteColor(row.moyenne)}`}>
                                                    {row.moyenne.toFixed(2)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            <div className="flex items-start gap-3 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-100 dark:border-orange-800/40 text-orange-700 dark:text-orange-300 text-sm">
                <AlertCircle size={20} className="flex-shrink-0 text-orange-600 dark:text-orange-300" />
                <p>
                    <strong>Formule :</strong> Moyenne matière = EXAMEN × 0.7 + DS × 0.15 + TP × 0.15.
                </p>
            </div>
        </div>
    );
}
