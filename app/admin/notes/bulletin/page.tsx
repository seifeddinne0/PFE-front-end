"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Download, Award } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Etudiant {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
}

interface MoyenneData {
    moyenne: number;
    mention?: string;
    totalNotes?: number;
}

const SEMESTRES = ["S1", "S2", "S3", "S4", "S5", "S6"];

export default function BulletinPage() {
    const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
    const [isFetchingData, setIsFetchingData] = useState(true);
    const [selectedEtudiant, setSelectedEtudiant] = useState<string>("");
    const [selectedSemestre, setSelectedSemestre] = useState<string>("S1");
    const [moyenneData, setMoyenneData] = useState<MoyenneData | null>(null);
    const [isFetchingMoyenne, setIsFetchingMoyenne] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchEtudiants = async () => {
            try {
                const data = await api.get("/api/admin/etudiants");
                if (data && Array.isArray(data.content)) {
                    setEtudiants(data.content);
                } else if (Array.isArray(data)) {
                    setEtudiants(data);
                }
            } catch (error: any) {
                toast.error("Erreur lors du chargement des étudiants.");
            } finally {
                setIsFetchingData(false);
            }
        };

        fetchEtudiants();
    }, []);

    // Fetch moyenne when selection changes
    useEffect(() => {
        if (!selectedEtudiant || !selectedSemestre) {
            setMoyenneData(null);
            return;
        }

        const fetchMoyenne = async () => {
            setIsFetchingMoyenne(true);
            setMoyenneData(null);
            try {
                const data = await api.get(`/api/admin/notes/etudiant/${selectedEtudiant}/moyenne/${selectedSemestre}`);
                setMoyenneData(data);
            } catch (error: any) {
                toast.error("Impossible de calculer la moyenne pour cette sélection.");
                setMoyenneData(null);
            } finally {
                setIsFetchingMoyenne(false);
            }
        };

        fetchMoyenne();
    }, [selectedEtudiant, selectedSemestre]);

    const handleDownloadPdf = async () => {
        if (!selectedEtudiant || !selectedSemestre) {
            toast.error("Veuillez sélectionner un étudiant et un semestre.");
            return;
        }

        setIsDownloading(true);
        try {
            const token = sessionStorage.getItem("token");
            const res = await fetch(`http://localhost:8080/api/admin/notes/bulletin/${selectedEtudiant}/${selectedSemestre}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!res.ok) throw new Error("Erreur lors du téléchargement du bulletin.");

            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;

            const etudiant = etudiants.find(e => e.id === parseInt(selectedEtudiant));
            const filename = etudiant
                ? `bulletin_${etudiant.nom}_${etudiant.prenom}_${selectedSemestre}.pdf`
                : `bulletin_${selectedSemestre}.pdf`;

            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success("Bulletin téléchargé avec succès.");
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du téléchargement du bulletin.");
        } finally {
            setIsDownloading(false);
        }
    };

    const getMoyenneColor = (moyenne: number) => {
        if (moyenne >= 16) return "text-green-600";
        if (moyenne >= 12) return "text-blue-600";
        if (moyenne >= 10) return "text-yellow-600";
        return "text-red-600";
    };

    const getMoyenneBg = (moyenne: number) => {
        if (moyenne >= 16) return "bg-green-50 border-green-200";
        if (moyenne >= 12) return "bg-blue-50 border-blue-200";
        if (moyenne >= 10) return "bg-yellow-50 border-yellow-200";
        return "bg-red-50 border-red-200";
    };

    const getMention = (moyenne: number) => {
        if (moyenne >= 16) return "Très Bien";
        if (moyenne >= 14) return "Bien";
        if (moyenne >= 12) return "Assez Bien";
        if (moyenne >= 10) return "Passable";
        return "Insuffisant";
    };

    const selectedEtudiantObj = etudiants.find(e => e.id === parseInt(selectedEtudiant));

    if (isFetchingData) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#ffa000]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin/notes"
                    className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm text-gray-500"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-[#042954] tracking-tight">Génération de Bulletins</h1>
                    <p className="text-sm text-gray-500">Sélectionnez un étudiant et un semestre pour générer le bulletin</p>
                </div>
            </div>

            {/* Selection Form */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Étudiant */}
                    <div className="space-y-2">
                        <label htmlFor="etudiant" className="text-sm font-bold text-[#333333]">Étudiant <span className="text-red-500">*</span></label>
                        <select
                            id="etudiant"
                            value={selectedEtudiant}
                            onChange={(e) => setSelectedEtudiant(e.target.value)}
                            className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all text-sm"
                        >
                            <option value="">Sélectionner un étudiant</option>
                            {etudiants.map(e => (
                                <option key={e.id} value={e.id}>{e.nom} {e.prenom} ({e.matricule})</option>
                            ))}
                        </select>
                    </div>

                    {/* Semestre */}
                    <div className="space-y-2">
                        <label htmlFor="semestre" className="text-sm font-bold text-[#333333]">Semestre <span className="text-red-500">*</span></label>
                        <select
                            id="semestre"
                            value={selectedSemestre}
                            onChange={(e) => setSelectedSemestre(e.target.value)}
                            className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all text-sm"
                        >
                            {SEMESTRES.map(s => (
                                <option key={s} value={s}>Semestre {s}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Moyenne Result Card */}
            {isFetchingMoyenne && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 mb-6">
                    <div className="flex items-center justify-center gap-3 text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#ffa000]"></div>
                        Calcul de la moyenne en cours...
                    </div>
                </div>
            )}

            {moyenneData && !isFetchingMoyenne && (
                <div className={`rounded-xl border shadow-sm p-8 mb-6 ${getMoyenneBg(moyenneData.moyenne)}`}>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${moyenneData.moyenne >= 10 ? 'bg-green-100' : 'bg-red-100'}`}>
                                <Award size={32} className={moyenneData.moyenne >= 10 ? 'text-green-600' : 'text-red-600'} />
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 font-medium">
                                    {selectedEtudiantObj ? `${selectedEtudiantObj.nom} ${selectedEtudiantObj.prenom}` : "Étudiant"} — Semestre {selectedSemestre}
                                </p>
                                <div className="flex items-baseline gap-2 mt-1">
                                    <span className={`text-4xl font-bold ${getMoyenneColor(moyenneData.moyenne)}`}>
                                        {moyenneData.moyenne.toFixed(2)}
                                    </span>
                                    <span className="text-gray-400 text-lg">/ 20</span>
                                </div>
                                <p className={`text-sm font-bold mt-1 ${getMoyenneColor(moyenneData.moyenne)}`}>
                                    Mention : {moyenneData.mention || getMention(moyenneData.moyenne)}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleDownloadPdf}
                            disabled={isDownloading}
                            className={`px-8 py-3 rounded-lg font-bold text-white transition-all shadow-md flex items-center gap-2 text-sm ${isDownloading ? 'bg-[#ffc166] cursor-not-allowed' : 'bg-[#ffa000] hover:bg-[#ff8f00]'
                                }`}
                        >
                            <Download size={18} />
                            {isDownloading ? "Téléchargement..." : "Télécharger le Bulletin PDF"}
                        </button>
                    </div>
                </div>
            )}

            {/* Prompt when no selection */}
            {!selectedEtudiant && (
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-12">
                    <div className="text-center text-gray-400">
                        <Award size={48} className="mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-semibold text-gray-500">Sélectionnez un étudiant</p>
                        <p className="text-sm mt-1">Choisissez un étudiant et un semestre ci-dessus pour voir la moyenne et générer le bulletin.</p>
                    </div>
                </div>
            )}
        </div>
    );
}
