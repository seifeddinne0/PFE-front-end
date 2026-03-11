"use client";

import { useEffect, useState } from "react";
import { Save, Edit2, Trash2, X, AlertTriangle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Etudiant {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
}

interface Matiere {
    id: number;
    nom: string;
    code: string;
}

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
    alerte: boolean;
}

const emptyForm = {
    etudiantId: "",
    matiereId: "",
    dateAbsence: new Date().toISOString().split('T')[0], // Default today
    statut: "NON_JUSTIFIEE",
    motif: ""
};

export default function EnseignantAbsencesPage() {
    const router = useRouter();
    const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
    const [matieres, setMatieres] = useState<Matiere[]>([]);
    const [absences, setAbsences] = useState<Absence[]>([]);
    const [isFetchingData, setIsFetchingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Forms
    const [formData, setFormData] = useState({ ...emptyForm });

    // Edit Modal
    const [editingAbsence, setEditingAbsence] = useState<Absence | null>(null);
    const [editForm, setEditForm] = useState({ ...emptyForm });
    const [isEditing, setIsEditing] = useState(false);

    // --- Data fetching ---
    const fetchDropdowns = async () => {
        try {
            const [etudiantsData, matieresData] = await Promise.all([
                api.get("/api/admin/etudiants"),
                api.get("/api/admin/matieres")
            ]);

            if (etudiantsData && Array.isArray(etudiantsData.content)) {
                setEtudiants(etudiantsData.content);
            } else if (Array.isArray(etudiantsData)) {
                setEtudiants(etudiantsData);
            }

            if (matieresData && Array.isArray(matieresData.content)) {
                setMatieres(matieresData.content);
            } else if (Array.isArray(matieresData)) {
                setMatieres(matieresData);
            }
        } catch {
            toast.error("Erreur lors du chargement des données.");
        }
    };

    const fetchAbsences = async () => {
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
            setAbsences([]);
        }
    };

    useEffect(() => {
        const init = async () => {
            const token = sessionStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }
            await Promise.all([fetchDropdowns(), fetchAbsences()]);
            setIsFetchingData(false);
        };
        init();
    }, [router]);

    // --- Create ---
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await api.post("/api/enseignant/absences", {
                etudiantId: parseInt(formData.etudiantId),
                matiereId: parseInt(formData.matiereId),
                dateAbsence: formData.dateAbsence,
                statut: formData.statut,
                motif: formData.motif
            });
            toast.success("Absence enregistrée avec succès.");
            setFormData({ ...emptyForm });
            await fetchAbsences();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'enregistrement de l'absence.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // --- Edit ---
    const openEditModal = (absence: Absence) => {
        setEditingAbsence(absence);
        setEditForm({
            etudiantId: String(absence.etudiantId || ""),
            matiereId: String(absence.matiereId || ""),
            dateAbsence: absence.dateAbsence ? absence.dateAbsence.split('T')[0] : emptyForm.dateAbsence,
            statut: absence.statut || "NON_JUSTIFIEE",
            motif: absence.motif || ""
        });
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingAbsence) return;

        setIsEditing(true);
        try {
            await api.put(`/api/admin/absences/${editingAbsence.id}`, {
                etudiantId: parseInt(editForm.etudiantId),
                matiereId: parseInt(editForm.matiereId),
                dateAbsence: editForm.dateAbsence,
                statut: editForm.statut,
                motif: editForm.motif
            });
            toast.success("Absence modifiée avec succès.");
            setEditingAbsence(null);
            await fetchAbsences();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la modification.");
        } finally {
            setIsEditing(false);
        }
    };

    // --- Delete ---
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

    // --- Helpers ---
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

    // Pagination
    const totalPages = Math.ceil(absences.length / itemsPerPage);
    const paginatedAbsences = absences.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (isFetchingData) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#ffa000]"></div>
            </div>
        );
    }

    const inputCls = "w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all text-sm";

    return (
        <div className="space-y-8 animate-in fade-in">
            {/* ─── Create Form Card ─── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-[#042954] px-8 py-5">
                    <h2 className="text-xl font-bold text-white">Saisir une Absence</h2>
                    <p className="text-sm text-white/60 mt-1">Enregistrez l&apos;absence d&apos;un étudiant d&apos;un cours</p>
                </div>

                <div className="p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Étudiant */}
                            <div className="space-y-2">
                                <label htmlFor="etudiantId" className="text-sm font-bold text-[#333333]">Étudiant <span className="text-red-500">*</span></label>
                                <select id="etudiantId" name="etudiantId" required value={formData.etudiantId} onChange={handleChange} className={inputCls}>
                                    <option value="">Sélectionner un étudiant</option>
                                    {etudiants.map(e => (
                                        <option key={e.id} value={e.id}>{e.nom} {e.prenom} ({e.matricule})</option>
                                    ))}
                                </select>
                            </div>

                            {/* Matière */}
                            <div className="space-y-2">
                                <label htmlFor="matiereId" className="text-sm font-bold text-[#333333]">Matière <span className="text-red-500">*</span></label>
                                <select id="matiereId" name="matiereId" required value={formData.matiereId} onChange={handleChange} className={inputCls}>
                                    <option value="">Sélectionner une matière</option>
                                    {matieres.map(m => (
                                        <option key={m.id} value={m.id}>{m.nom} {m.code ? `(${m.code})` : ""}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Date absence */}
                            <div className="space-y-2">
                                <label htmlFor="dateAbsence" className="text-sm font-bold text-[#333333]">Date de l&apos;absence <span className="text-red-500">*</span></label>
                                <input id="dateAbsence" name="dateAbsence" type="date" required value={formData.dateAbsence} onChange={handleChange} className={inputCls} />
                            </div>

                            {/* Statut */}
                            <div className="space-y-2">
                                <label htmlFor="statut" className="text-sm font-bold text-[#333333]">Statut <span className="text-red-500">*</span></label>
                                <select id="statut" name="statut" required value={formData.statut} onChange={handleChange} className={inputCls}>
                                    <option value="NON_JUSTIFIEE">Non Justifiée</option>
                                    <option value="EN_ATTENTE">En Attente</option>
                                </select>
                            </div>
                        </div>

                        {/* Motif */}
                        <div className="space-y-2">
                            <label htmlFor="motif" className="text-sm font-bold text-[#333333]">Motif (optionnel)</label>
                            <textarea id="motif" name="motif" rows={2} value={formData.motif} onChange={handleChange} className={`${inputCls} resize-none`} placeholder="Motif de l'absence..."></textarea>
                        </div>

                        {/* Submit */}
                        <div className="pt-6 border-t border-gray-100 flex items-center justify-end">
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className={`px-8 py-3 rounded-lg font-bold text-white transition-all shadow-md flex items-center gap-2 text-sm ${isSubmitting ? 'bg-[#ffc166] cursor-not-allowed' : 'bg-[#ffa000] hover:bg-[#ff8f00]'}`}
                            >
                                <Save size={18} />
                                {isSubmitting ? "Enregistrement..." : "Enregistrer l'absence"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ─── Absences Table ─── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-[#042954]">Absences Enregistrées</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-sm">
                                <th className="p-4 font-semibold text-center w-16">#</th>
                                <th className="p-4 font-semibold">Étudiant</th>
                                <th className="p-4 font-semibold">Matière</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold text-center">Statut</th>
                                <th className="p-4 font-semibold">Motif</th>
                                <th className="p-4 font-semibold text-center">Alerte</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {absences.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">Aucune absence enregistrée.</td>
                                </tr>
                            ) : (
                                paginatedAbsences.map((absence, index) => (
                                    <tr key={absence.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-center text-sm text-gray-400 font-medium">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-[#333333] whitespace-nowrap">{absence.etudiantNom} {absence.etudiantPrenom}</div>
                                        </td>
                                        <td className="p-4 text-[#042954] font-medium text-sm">{absence.matiere || "-"}</td>
                                        <td className="p-4 text-gray-600 truncate">{formatDate(absence.dateAbsence)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatutBadge(absence.statut)}`}>
                                                {absence.statut.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm truncate max-w-[200px]" title={absence.motif || ""}>{absence.motif || "-"}</td>
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
                                        <td className="p-4 flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(absence)}
                                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                                                title="Modifier"
                                            >
                                                <Edit2 size={16} />
                                            </button>
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

            {/* ─── Edit Modal ─── */}
            {editingAbsence && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingAbsence(null)} />

                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden animate-in fade-in zoom-in">
                        <div className="bg-[#042954] px-8 py-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Modifier l&apos;Absence</h3>
                                <p className="text-sm text-white/60 mt-0.5">{editingAbsence.etudiantNom} {editingAbsence.etudiantPrenom} — {editingAbsence.matiere}</p>
                            </div>
                            <button onClick={() => setEditingAbsence(null)} className="text-white/60 hover:text-white transition-colors p-1">
                                <X size={22} />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#333333]">Étudiant <span className="text-red-500">*</span></label>
                                    <select name="etudiantId" required value={editForm.etudiantId} onChange={handleEditChange} className={inputCls}>
                                        <option value="">Sélectionner un étudiant</option>
                                        {etudiants.map(e => (
                                            <option key={e.id} value={e.id}>{e.nom} {e.prenom} ({e.matricule})</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#333333]">Matière <span className="text-red-500">*</span></label>
                                    <select name="matiereId" required value={editForm.matiereId} onChange={handleEditChange} className={inputCls}>
                                        <option value="">Sélectionner une matière</option>
                                        {matieres.map(m => (
                                            <option key={m.id} value={m.id}>{m.nom} {m.code ? `(${m.code})` : ""}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#333333]">Date de l&apos;absence <span className="text-red-500">*</span></label>
                                    <input name="dateAbsence" type="date" required value={editForm.dateAbsence} onChange={handleEditChange} className={inputCls} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#333333]">Statut <span className="text-red-500">*</span></label>
                                    <select name="statut" required value={editForm.statut} onChange={handleEditChange} className={inputCls}>
                                        <option value="NON_JUSTIFIEE">Non Justifiée</option>
                                        <option value="JUSTIFIEE">Justifiée</option>
                                        <option value="EN_ATTENTE">En Attente</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#333333]">Motif</label>
                                <textarea name="motif" rows={3} value={editForm.motif} onChange={handleEditChange} className={`${inputCls} resize-none`} placeholder="Motif de l'absence..."></textarea>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                                <button type="button" onClick={() => setEditingAbsence(null)} className="px-6 py-3 font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors text-sm">
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    disabled={isEditing}
                                    className={`px-8 py-3 rounded-lg font-bold text-white transition-all shadow-md flex items-center gap-2 text-sm ${isEditing ? 'bg-[#ffc166] cursor-not-allowed' : 'bg-[#03a9f4] hover:bg-[#0288d1]'}`}
                                >
                                    <Save size={18} />
                                    {isEditing ? "Enregistrement..." : "Mettre à jour"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
