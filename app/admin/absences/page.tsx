"use client";

import { useEffect, useState } from "react";
import { Trash2, CheckCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle, X, Save } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Absence {
    id: number;
    etudiantId: number;
    etudiantNom: string;
    etudiantPrenom: string;
    etudiantMatricule: string;
    matiereId: number;
    matiere: string;
    dateAbsence: string;
    statut: string;
    motif: string;
    justification: string;
    alerte: boolean;
}

export default function AdminAbsencesPage() {
    const router = useRouter();
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filterStatut, setFilterStatut] = useState<string>("TOUS");

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    // Justifier modal
    const [justifyingAbsence, setJustifyingAbsence] = useState<Absence | null>(null);
    const [justification, setJustification] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchAbsences = async () => {
        setIsLoading(true);
        try {
            const data = await api.get("/api/admin/absences");
            if (data && Array.isArray(data.content)) {
                setAbsences(data.content);
            } else if (Array.isArray(data)) {
                setAbsences(data);
            } else {
                setAbsences([]);
            }
        } catch {
            toast.error("Erreur lors du chargement des absences.");
            setAbsences([]);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }
        fetchAbsences();
    }, [router]);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette absence ?")) return;

        try {
            await api.delete(`/api/admin/absences/${id}`);
            toast.success("Absence supprimée avec succès.");
            await fetchAbsences();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la suppression.");
        }
    };

    const handleJustifierSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!justifyingAbsence) return;

        if (!justification.trim()) {
            toast.error("La justification est requise.");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.patch(`/api/admin/absences/${justifyingAbsence.id}/justifier`, {
                justification: justification
            });
            toast.success("Absence justifiée avec succès.");
            setJustifyingAbsence(null);
            setJustification("");
            await fetchAbsences();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la justification.");
        } finally {
            setIsSubmitting(false);
        }
    };

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

    const filteredAbsences = absences.filter(abs => {
        if (filterStatut === "TOUS") return true;
        return abs.statut === filterStatut;
    });

    const totalPages = Math.ceil(filteredAbsences.length / itemsPerPage);
    const paginatedAbsences = filteredAbsences.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const inputCls = "w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all text-sm";

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-[#042954]">Liste des Absences</h2>
                        <p className="text-sm text-gray-500 mt-1">Gestion et suivi des absences des étudiants</p>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-500">Filtrer par statut:</span>
                        <select
                            value={filterStatut}
                            onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}
                            className="bg-gray-50 border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-[#ffa000] focus:border-[#ffa000] block p-2 outline-none"
                        >
                            <option value="TOUS">Tous les statuts</option>
                            <option value="JUSTIFIEE">Justifiée</option>
                            <option value="NON_JUSTIFIEE">Non Justifiée</option>
                            <option value="EN_ATTENTE">En Attente</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-sm">
                                <th className="p-4 font-semibold">Étudiant</th>
                                <th className="p-4 font-semibold">Matricule</th>
                                <th className="p-4 font-semibold">Matière</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold text-center">Statut</th>
                                <th className="p-4 font-semibold">Motif / Justif.</th>
                                <th className="p-4 font-semibold text-center">Alerte</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#ffa000]"></div>
                                            Chargement des absences...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAbsences.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">
                                        Aucune absence trouvée.
                                    </td>
                                </tr>
                            ) : (
                                paginatedAbsences.map((absence) => (
                                    <tr key={absence.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-bold text-[#333333] whitespace-nowrap">{absence.etudiantNom} {absence.etudiantPrenom}</div>
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm">{absence.etudiantMatricule}</td>
                                        <td className="p-4 text-[#042954] font-medium">{absence.matiere}</td>
                                        <td className="p-4 text-gray-600 truncate">{formatDate(absence.dateAbsence)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatutBadge(absence.statut)}`}>
                                                {absence.statut.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 max-w-[200px]">
                                            {absence.statut === "JUSTIFIEE" && absence.justification ? (
                                                <div className="truncate" title={absence.justification}>
                                                    <span className="font-medium text-green-700">Justification: </span>
                                                    {absence.justification}
                                                </div>
                                            ) : (
                                                <div className="truncate" title={absence.motif || "Aucun motif"}>{absence.motif || "-"}</div>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {absence.alerte && (
                                                <div className="flex justify-center" title="Alerte dépassement de seuil d'absences">
                                                    <AlertTriangle size={20} className="text-red-500" />
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 flex items-center justify-end gap-2">
                                            {absence.statut !== "JUSTIFIEE" && (
                                                <button
                                                    onClick={() => { setJustifyingAbsence(absence); setJustification(""); }}
                                                    className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors cursor-pointer"
                                                    title="Justifier l'absence"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(absence.id)}
                                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors cursor-pointer"
                                                title="Supprimer"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {!isLoading && filteredAbsences.length > 0 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-medium whitespace-nowrap">
                                Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredAbsences.length)} sur {filteredAbsences.length}
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

                            {Array.from({ length: totalPages }).map((_, i) => {
                                // Show limited pages to prevent overflow
                                if (
                                    i === 0 ||
                                    i === totalPages - 1 ||
                                    (i >= currentPage - 2 && i <= currentPage)
                                ) {
                                    return (
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
                                    );
                                } else if (
                                    (i === 1 && currentPage > 3) ||
                                    (i === totalPages - 2 && currentPage < totalPages - 2)
                                ) {
                                    return <span key={i} className="px-1 text-gray-400">...</span>;
                                }
                                return null;
                            })}

                            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Page suivante">
                                <ChevronRight size={18} />
                            </button>
                            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)} className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Dernière page">
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ─── Justifier Modal ─── */}
            {justifyingAbsence && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setJustifyingAbsence(null)} />

                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in">
                        <div className="bg-[#042954] px-6 py-4 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Justifier l&apos;absence</h3>
                                <p className="text-sm text-white/60 mt-0.5 whitespace-nowrap">
                                    {justifyingAbsence.etudiantNom} {justifyingAbsence.etudiantPrenom} — {formatDate(justifyingAbsence.dateAbsence)}
                                </p>
                            </div>
                            <button onClick={() => setJustifyingAbsence(null)} className="text-white/60 hover:text-white transition-colors p-1">
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleJustifierSubmit} className="p-6 space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#333333]">Détails de justification <span className="text-red-500">*</span></label>
                                <textarea
                                    required
                                    rows={4}
                                    value={justification}
                                    onChange={(e) => setJustification(e.target.value)}
                                    className={`${inputCls} resize-none`}
                                    placeholder="Certificat médical n°..., motif familial, etc."
                                    autoFocus
                                ></textarea>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
                                <button type="button" onClick={() => setJustifyingAbsence(null)} className="px-5 py-2.5 font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors text-sm">
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting || !justification.trim()}
                                    className={`px-5 py-2.5 rounded-lg font-bold text-white transition-all shadow-md flex items-center gap-2 text-sm ${isSubmitting || !justification.trim() ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                                >
                                    <Save size={18} />
                                    {isSubmitting ? "Enregistrement..." : "Valider la justification"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
