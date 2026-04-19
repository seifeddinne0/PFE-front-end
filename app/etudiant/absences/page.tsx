"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, CalendarDays, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Absence {
    id: number;
    etudiantId: number;
    etudiantNom: string;
    etudiantPrenom: string;
    matiereId: number;
    matiereNom: string;
    dateAbsence: string;
    statut: string;
    motif: string;
    justification: string;
    alerte: boolean;
}

export default function EtudiantAbsencesPage() {
    const router = useRouter();
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [commentaires, setCommentaires] = useState<Record<number, string>>({});
    const [filesByAbsence, setFilesByAbsence] = useState<Record<number, File | null>>({});
    const [uploadingId, setUploadingId] = useState<number | null>(null);

    useEffect(() => {
        const fetchAbsences = async () => {
            const token = sessionStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                const data = await api.get("/api/etudiant/absences");
                if (data && Array.isArray(data.content)) {
                    setAbsences(data.content);
                } else if (Array.isArray(data)) {
                    setAbsences(data);
                } else {
                    setAbsences([]);
                }
            } catch {
                toast.error("Erreur lors du chargement de vos absences.");
                setAbsences([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchAbsences();
    }, [router]);

    // Helpers
    const getStatutBadge = (statut: string) => {
        switch (statut) {
            case "JUSTIFIEE": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300";
            case "NON_JUSTIFIEE": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
            case "EN_ATTENTE": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300";
            default: return "bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300";
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    };

    // Calculate Summary Stats
    const totalAbsences = absences.length;
    const totalJustifiees = absences.filter(a => a.statut === "JUSTIFIEE").length;
    const totalNonJustifiees = absences.filter(a => a.statut === "NON_JUSTIFIEE").length;
    // An alerte is usually derived implicitly from `alerte: true` OR we can just sum up the `alerte` fields
    const totalAlertes = absences.filter(a => a.alerte).length;

    // Pagination
    const totalPages = Math.ceil(absences.length / itemsPerPage);
    const paginatedAbsences = absences.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleFileChange = (absenceId: number, file: File | null) => {
        setFilesByAbsence(prev => ({ ...prev, [absenceId]: file }));
    };

    const handleCommentChange = (absenceId: number, commentaire: string) => {
        setCommentaires(prev => ({ ...prev, [absenceId]: commentaire }));
    };

    const handleSubmitJustification = async (absenceId: number) => {
        const file = filesByAbsence[absenceId];
        if (!file) {
            toast.error("Veuillez choisir une image de justification.");
            return;
        }

        const formData = new FormData();
        formData.append("image", file);
        formData.append("commentaire", commentaires[absenceId] || "");

        setUploadingId(absenceId);
        try {
            await api.postFormData(`/api/etudiant/absences/${absenceId}/demande-justification`, formData);
            toast.success("Demande de justification envoyee.");

            const data = await api.get("/api/etudiant/absences");
            if (data && Array.isArray(data.content)) {
                setAbsences(data.content);
            } else if (Array.isArray(data)) {
                setAbsences(data);
            }

            setFilesByAbsence(prev => ({ ...prev, [absenceId]: null }));
            setCommentaires(prev => ({ ...prev, [absenceId]: "" }));
        } catch {
            toast.error("Erreur lors de l'envoi de la justification.");
        } finally {
            setUploadingId(null);
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#042954] dark:border-slate-200"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h1 className="text-2xl font-bold text-[#042954] dark:text-white tracking-tight">Mes Absences</h1>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Consultez l&apos;historique de vos absences et leur statut</p>
            </div>

            {/* ─── Summary Cards ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Absences */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-300 rounded-lg flex items-center justify-center">
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Absences</p>
                        <h3 className="text-2xl font-bold text-[#042954] dark:text-white">{totalAbsences}</h3>
                    </div>
                </div>

                {/* Justifiées */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-300 rounded-lg flex items-center justify-center">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Justifiées</p>
                        <h3 className="text-2xl font-bold text-[#042954] dark:text-white">{totalJustifiees}</h3>
                    </div>
                </div>

                {/* Non Justifiées */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 rounded-lg flex items-center justify-center">
                        <XCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Non Justifiées</p>
                        <h3 className="text-2xl font-bold text-[#042954] dark:text-white">{totalNonJustifiees}</h3>
                    </div>
                </div>

                {/* Alertes */}
                <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 dark:bg-orange-900/30 text-orange-500 dark:text-orange-300 rounded-lg flex items-center justify-center">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 dark:text-slate-400">Avertissements (Alertes)</p>
                        <h3 className="text-2xl font-bold text-[#042954] dark:text-white">{totalAlertes}</h3>
                    </div>
                </div>
            </div>

            {/* ─── Absences Table ─── */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                    <h2 className="text-xl font-bold text-[#042954] dark:text-white">Historique des Absences</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[800px] md:min-w-full hidden md:table">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-300 border-b border-gray-200 dark:border-slate-700 text-sm">
                                <th className="p-4 font-semibold text-center w-16">#</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Matière</th>
                                <th className="p-4 font-semibold text-center">Statut</th>
                                <th className="p-4 font-semibold text-center">Alerte</th>
                                <th className="p-4 font-semibold">Demande de justification</th>
                            </tr>
                        </thead>
                        <tbody>
                            {absences.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-gray-500 dark:text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                                <CheckCircle className="text-green-500 dark:text-green-300" size={32} />
                                            </div>
                                            <p className="text-lg font-medium text-gray-700 dark:text-slate-200">Aucune absence enregistrée</p>
                                            <p className="text-sm">Vous avez assisté à tous vos cours. Continuez comme ça !</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedAbsences.map((absence, index) => (
                                    <tr key={absence.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-[#151515] transition-colors">
                                        <td className="p-4 text-center text-sm text-gray-400 dark:text-slate-400 font-medium">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="p-4 text-gray-800 dark:text-slate-200 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-gray-400 dark:text-slate-500" />
                                                {formatDate(absence.dateAbsence)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-[#042954] dark:text-slate-100 font-medium">{absence.matiereNom || "-"}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatutBadge(absence.statut)}`}>
                                                {absence.statut.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            {absence.alerte && (
                                                <div className="flex justify-center flex-col items-center group relative cursor-help">
                                                    <AlertTriangle size={20} className="text-red-500" />
                                                    <div className="opacity-0 w-48 bg-black text-white text-xs rounded py-1 px-2 absolute z-10 bottom-full mb-2 pointer-events-none group-hover:opacity-100 transition-opacity">
                                                        Alerte dépassement seuil
                                                    </div>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 min-w-[290px]">
                                            {absence.statut === "JUSTIFIEE" ? (
                                                <span className="text-green-700 text-sm font-semibold">Justification acceptee</span>
                                            ) : absence.statut === "EN_ATTENTE" ? (
                                                <span className="text-amber-700 text-sm font-semibold">Demande en attente</span>
                                            ) : (
                                                <div className="space-y-2">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => handleFileChange(absence.id, e.target.files?.[0] || null)}
                                                        className="block w-full text-xs text-gray-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                                                    />
                                                    <input
                                                        type="text"
                                                        value={commentaires[absence.id] || ""}
                                                        onChange={(e) => handleCommentChange(absence.id, e.target.value)}
                                                        placeholder="Commentaire (optionnel)"
                                                        className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 rounded px-2 py-1.5 text-xs"
                                                    />
                                                    <button
                                                        onClick={() => handleSubmitJustification(absence.id)}
                                                        disabled={uploadingId === absence.id}
                                                        className="inline-flex items-center gap-1.5 bg-[#03a9f4] hover:bg-[#0288d1] disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded"
                                                    >
                                                        <Upload size={12} />
                                                        {uploadingId === absence.id ? "Envoi..." : "Demander"}
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Mobile version (Cards) */}
                    <div className="grid grid-cols-1 gap-4 p-4 md:hidden bg-gray-50/30 dark:bg-slate-900/30">
                        {absences.length === 0 ? (
                            <div className="p-8 border border-dashed border-gray-200 dark:border-slate-700 rounded-xl text-center flex flex-col items-center justify-center gap-3">
                                <div className="w-16 h-16 bg-green-50 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                                    <CheckCircle className="text-green-500 dark:text-green-300" size={32} />
                                </div>
                                <p className="text-lg font-medium text-gray-700 dark:text-slate-200">Aucune absence enregistrée</p>
                                <p className="text-sm">Vous avez assisté à tous vos cours.</p>
                            </div>
                        ) : (
                            paginatedAbsences.map((absence, index) => (
                                <div key={absence.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm relative overflow-hidden">
                                    {absence.alerte && (
                                        <div className="absolute top-0 right-0 w-2 h-full bg-red-400"></div>
                                    )}
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-2 text-gray-500 dark:text-slate-400 text-sm">
                                            <Clock size={16} />
                                            <span className="font-semibold text-gray-800 dark:text-slate-200">{formatDate(absence.dateAbsence)}</span>
                                        </div>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${getStatutBadge(absence.statut)}`}>
                                            {absence.statut.replace('_', ' ')}
                                        </span>
                                    </div>
                                    
                                    <h3 className="font-bold text-[#042954] dark:text-slate-100 mb-3 text-lg leading-tight">
                                        {absence.matiereNom || "-"}
                                    </h3>

                                    <div className="mt-3 bg-gray-50 dark:bg-slate-900/60 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                                        {absence.statut === "JUSTIFIEE" ? (
                                            <span className="text-sm text-green-700 font-semibold">Justification acceptee</span>
                                        ) : absence.statut === "EN_ATTENTE" ? (
                                            <span className="text-sm text-amber-700 font-semibold">Demande en attente</span>
                                        ) : (
                                            <div className="space-y-2">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleFileChange(absence.id, e.target.files?.[0] || null)}
                                                    className="block w-full text-xs text-gray-600 dark:text-slate-300 file:mr-3 file:py-1.5 file:px-2.5 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 dark:file:bg-blue-900/30 dark:file:text-blue-300 hover:file:bg-blue-100 dark:hover:file:bg-blue-900/50"
                                                />
                                                <input
                                                    type="text"
                                                    value={commentaires[absence.id] || ""}
                                                    onChange={(e) => handleCommentChange(absence.id, e.target.value)}
                                                    placeholder="Commentaire (optionnel)"
                                                    className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 rounded px-2 py-1.5 text-xs"
                                                />
                                                <button
                                                    onClick={() => handleSubmitJustification(absence.id)}
                                                    disabled={uploadingId === absence.id}
                                                    className="inline-flex items-center gap-1.5 bg-[#03a9f4] hover:bg-[#0288d1] disabled:opacity-50 text-white text-xs font-bold px-3 py-1.5 rounded"
                                                >
                                                    <Upload size={12} />
                                                    {uploadingId === absence.id ? "Envoi..." : "Demander"}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {absences.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 dark:text-slate-400 font-medium whitespace-nowrap">
                                Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, absences.length)} sur {absences.length}
                            </span>
                            <div className="flex items-center gap-2 border-l pl-3 hidden sm:flex">
                                <span className="text-gray-500 dark:text-slate-400">Afficher:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-700 dark:text-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffa000]"
                                >
                                    {[5, 10, 25, 50].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-1 border border-gray-300 dark:border-slate-600 rounded text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Première page">
                                <ChevronsLeft size={18} />
                            </button>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 border border-gray-300 dark:border-slate-600 rounded text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Page précédente">
                                <ChevronLeft size={18} />
                            </button>

                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded border transition-colors font-medium flex items-center justify-center ${currentPage === i + 1
                                        ? 'bg-[#042954] text-white border-[#042954] dark:bg-blue-700 dark:border-blue-700'
                                        : 'border-gray-300 dark:border-slate-600 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 border border-gray-300 dark:border-slate-600 rounded text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Page suivante">
                                <ChevronRight size={18} />
                            </button>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="p-1 border border-gray-300 dark:border-slate-600 rounded text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700/50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Dernière page">
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
