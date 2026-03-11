"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Clock, CalendarDays, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Absence {
    id: number;
    etudiantId: number;
    etudiantNom: string;
    etudiantPrenom: string;
    matiereId: number;
    matiere: string;
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
            case "JUSTIFIEE": return "bg-green-100 text-green-700";
            case "NON_JUSTIFIEE": return "bg-red-100 text-red-700";
            case "EN_ATTENTE": return "bg-orange-100 text-orange-700";
            default: return "bg-gray-100 text-gray-700";
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

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#042954]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h1 className="text-2xl font-bold text-[#042954] tracking-tight">Mes Absences</h1>
                <p className="text-sm text-gray-500 mt-1">Consultez l&apos;historique de vos absences et leur statut</p>
            </div>

            {/* ─── Summary Cards ─── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Absences */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
                        <CalendarDays size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Total Absences</p>
                        <h3 className="text-2xl font-bold text-[#042954]">{totalAbsences}</h3>
                    </div>
                </div>

                {/* Justifiées */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-50 text-green-600 rounded-lg flex items-center justify-center">
                        <CheckCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Justifiées</p>
                        <h3 className="text-2xl font-bold text-[#042954]">{totalJustifiees}</h3>
                    </div>
                </div>

                {/* Non Justifiées */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-lg flex items-center justify-center">
                        <XCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Non Justifiées</p>
                        <h3 className="text-2xl font-bold text-[#042954]">{totalNonJustifiees}</h3>
                    </div>
                </div>

                {/* Alertes */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 flex items-center gap-4">
                    <div className="w-12 h-12 bg-orange-50 text-orange-500 rounded-lg flex items-center justify-center">
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Avertissements (Alertes)</p>
                        <h3 className="text-2xl font-bold text-[#042954]">{totalAlertes}</h3>
                    </div>
                </div>
            </div>

            {/* ─── Absences Table ─── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-[#042954]">Historique Détaillé</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-sm">
                                <th className="p-4 font-semibold text-center w-16">#</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold">Matière</th>
                                <th className="p-4 font-semibold text-center">Statut</th>
                                <th className="p-4 font-semibold">Motif Initial</th>
                                <th className="p-4 font-semibold">Justification</th>
                                <th className="p-4 font-semibold text-center">Alerte</th>
                            </tr>
                        </thead>
                        <tbody>
                            {absences.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center">
                                                <CheckCircle className="text-green-500" size={32} />
                                            </div>
                                            <p className="text-lg font-medium text-gray-700">Aucune absence enregistrée</p>
                                            <p className="text-sm">Vous avez assisté à tous vos cours. Continuez comme ça !</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedAbsences.map((absence, index) => (
                                    <tr key={absence.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-center text-sm text-gray-400 font-medium">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="p-4 text-gray-800 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Clock size={16} className="text-gray-400" />
                                                {formatDate(absence.dateAbsence)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-[#042954] font-medium">{absence.matiere || "-"}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatutBadge(absence.statut)}`}>
                                                {absence.statut.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm truncate max-w-[200px]" title={absence.motif || ""}>
                                            {absence.motif || "-"}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 max-w-[250px]">
                                            {absence.statut === "JUSTIFIEE" && absence.justification ? (
                                                <div className="truncate text-green-700 font-medium" title={absence.justification}>
                                                    {absence.justification}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
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
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {absences.length > 0 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-medium whitespace-nowrap">
                                Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, absences.length)} sur {absences.length}
                            </span>
                            <div className="flex items-center gap-2 border-l pl-3 hidden sm:flex">
                                <span className="text-gray-500">Afficher:</span>
                                <select
                                    value={itemsPerPage}
                                    onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffa000]"
                                >
                                    {[5, 10, 25, 50].map(n => (
                                        <option key={n} value={n}>{n}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Première page">
                                <ChevronsLeft size={18} />
                            </button>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Page précédente">
                                <ChevronLeft size={18} />
                            </button>

                            {Array.from({ length: totalPages }).map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setCurrentPage(i + 1)}
                                    className={`w-8 h-8 rounded border transition-colors font-medium flex items-center justify-center ${currentPage === i + 1
                                        ? 'bg-[#042954] text-white border-[#042954]'
                                        : 'border-gray-300 text-gray-500 hover:bg-gray-50'
                                        }`}
                                >
                                    {i + 1}
                                </button>
                            ))}

                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Page suivante">
                                <ChevronRight size={18} />
                            </button>
                            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(totalPages)} className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Dernière page">
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
