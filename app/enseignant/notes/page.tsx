"use client";

import { useEffect, useState } from "react";
import { Plus, Edit2, Trash2, Save, X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

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

interface Note {
    id: number;
    etudiantId: number;
    etudiantNom: string;
    etudiantPrenom: string;
    matiereId: number;
    matiere: string;
    note: number;
    type: string;
    semestre: string;
    commentaire: string;
}

const TYPES_NOTE = [
    { value: "EXAMEN", label: "Examen" },
    { value: "CONTROLE", label: "Contrôle Continu (CC)" },
    { value: "TP", label: "Travaux Pratiques (TP)" },
    { value: "PROJET", label: "Projet" },
];

const SEMESTRES = ["S1", "S2", "S3", "S4", "S5", "S6"];

export default function EnseignantNotesPage() {
    const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
    const [matieres, setMatieres] = useState<Matiere[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Edit modal
    const [editingNote, setEditingNote] = useState<Note | null>(null);
    const [editForm, setEditForm] = useState({
        etudiantId: "",
        matiereId: "",
        note: "",
        type: "EXAMEN",
        semestre: "S1",
        commentaire: ""
    });
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
            // dropdowns might fail silently
        }
    };

    const fetchNotes = async () => {
        try {
            const data = await api.get("/api/admin/notes");
            if (data && Array.isArray(data.content)) {
                setNotes(data.content);
            } else if (Array.isArray(data)) {
                setNotes(data);
            } else {
                setNotes([]);
            }
        } catch {
            setNotes([]);
        }
    };

    useEffect(() => {
        const init = async () => {
            await Promise.all([fetchDropdowns(), fetchNotes()]);
            setIsLoading(false);
        };
        init();
    }, []);

    // --- Edit ---
    const openEditModal = (note: Note) => {
        setEditingNote(note);
        setEditForm({
            etudiantId: String(note.etudiantId || ""),
            matiereId: String(note.matiereId || ""),
            note: String(note.note ?? ""),
            type: note.type || "EXAMEN",
            semestre: note.semestre || "S1",
            commentaire: note.commentaire || ""
        });
    };

    const handleEditChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    const handleEditSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingNote) return;

        const noteValue = parseFloat(editForm.note);
        if (isNaN(noteValue) || noteValue < 0 || noteValue > 20) {
            toast.error("La note doit être comprise entre 0 et 20.");
            return;
        }

        setIsEditing(true);
        try {
            await api.put(`/api/admin/notes/${editingNote.id}`, {
                etudiantId: parseInt(editForm.etudiantId),
                matiereId: parseInt(editForm.matiereId),
                note: noteValue,
                type: editForm.type,
                semestre: editForm.semestre,
                commentaire: editForm.commentaire
            });
            toast.success("Note modifiée avec succès.");
            setEditingNote(null);
            await fetchNotes();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la modification.");
        } finally {
            setIsEditing(false);
        }
    };

    // --- Delete ---
    const handleDelete = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) return;

        try {
            await api.delete(`/api/admin/notes/${id}`);
            toast.success("Note supprimée avec succès.");
            await fetchNotes();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la suppression.");
        }
    };

    // --- Helpers ---
    const getNoteColor = (note: number) => {
        if (note >= 16) return "bg-green-100 text-green-700";
        if (note >= 12) return "bg-blue-100 text-blue-700";
        if (note >= 10) return "bg-yellow-100 text-yellow-700";
        return "bg-red-100 text-red-700";
    };

    const getTypeBadge = (type: string) => {
        switch (type) {
            case "EXAMEN": return "bg-purple-100 text-purple-700";
            case "CONTROLE": return "bg-orange-100 text-orange-700";
            case "TP": return "bg-cyan-100 text-cyan-700";
            case "PROJET": return "bg-indigo-100 text-indigo-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    // Pagination
    const totalPages = Math.ceil(notes.length / itemsPerPage);
    const paginatedNotes = notes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const inputCls = "w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all text-sm";

    return (
        <div className="space-y-8">
            {/* ─── Notes Table ─── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Header with Ajouter button */}
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-[#042954]">Notes & Résultats</h2>

                    <Link
                        href="/enseignant/notes/create"
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap text-sm"
                    >
                        <Plus size={18} />
                        Ajouter Note
                    </Link>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse hidden md:table">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-sm">
                                <th className="p-4 font-semibold text-center w-16">#</th>
                                <th className="p-4 font-semibold">Étudiant</th>
                                <th className="p-4 font-semibold">Matière</th>
                                <th className="p-4 font-semibold text-center">Note / 20</th>
                                <th className="p-4 font-semibold text-center">Type</th>
                                <th className="p-4 font-semibold text-center">Semestre</th>
                                <th className="p-4 font-semibold">Commentaire</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#ffa000]"></div>
                                            Chargement en cours...
                                        </div>
                                    </td>
                                </tr>
                            ) : notes.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">Aucune note enregistrée.</td>
                                </tr>
                            ) : (
                                paginatedNotes.map((note, index) => (
                                    <tr key={note.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-center text-sm text-gray-400 font-medium">
                                            {(currentPage - 1) * itemsPerPage + index + 1}
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-[#333333]">{note.etudiantNom} {note.etudiantPrenom}</div>
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm">{note.matiere || "-"}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getNoteColor(note.note)}`}>
                                                {note.note != null ? note.note.toFixed(2) : "-"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getTypeBadge(note.type)}`}>
                                                {note.type || "-"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold tracking-wide">
                                                {note.semestre || "-"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-500 text-sm truncate max-w-[200px]">{note.commentaire || "-"}</td>
                                        <td className="p-4 flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(note)}
                                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors cursor-pointer"
                                                title="Modifier"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(note.id)}
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

                    {/* Mobile version (Cards) */}
                    <div className="grid grid-cols-1 gap-4 p-4 md:hidden bg-gray-50/30">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#ffa000]"></div>
                                Chargement en cours...
                            </div>
                        ) : paginatedNotes.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">Aucune note trouvée.</div>
                        ) : (
                            paginatedNotes.map((note) => (
                                <div key={note.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-bold text-[#333333] text-lg mb-1">{note.etudiantNom} {note.etudiantPrenom}</div>
                                            <div className="flex gap-2 mb-2">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${getTypeBadge(note.type)}`}>{note.type || "-"}</span>
                                                <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">{note.semestre || "-"}</span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className={`px-3 py-1.5 rounded-lg text-xl font-bold shadow-sm ${getNoteColor(note.note)}`}>
                                                {note.note != null ? note.note.toFixed(2) : "-"}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                        <div className="flex justify-between items-center py-1 border-b border-gray-200">
                                            <span className="text-gray-500">Matière</span>
                                            <span className="font-bold text-[#042954] text-right">{note.matiere || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 text-xs mb-1 mt-1">Commentaire</span>
                                            <div className="bg-gray-100 p-2 rounded text-xs text-gray-700">
                                                {note.commentaire || "Aucun commentaire"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                        <button onClick={() => openEditModal(note)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded" title="Modifier">
                                            <Edit2 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(note.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded" title="Supprimer">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {!isLoading && notes.length > 0 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-medium">
                                Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, notes.length)} sur {notes.length}
                            </span>
                            <div className="flex items-center gap-2 border-l pl-3">
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
            {editingNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setEditingNote(null)} />

                    <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
                        <div className="bg-[#042954] px-8 py-5 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white">Modifier la Note</h3>
                                <p className="text-sm text-white/60 mt-0.5">{editingNote.etudiantNom} {editingNote.etudiantPrenom} — {editingNote.matiere}</p>
                            </div>
                            <button onClick={() => setEditingNote(null)} className="text-white/60 hover:text-white transition-colors p-1">
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
                                    <label className="text-sm font-bold text-[#333333]">Note (0 - 20) <span className="text-red-500">*</span></label>
                                    <input name="note" type="number" step="0.5" min="0" max="20" required value={editForm.note} onChange={handleEditChange} className={inputCls} />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#333333]">Type de Note <span className="text-red-500">*</span></label>
                                    <select name="type" required value={editForm.type} onChange={handleEditChange} className={inputCls}>
                                        {TYPES_NOTE.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-[#333333]">Semestre <span className="text-red-500">*</span></label>
                                    <select name="semestre" required value={editForm.semestre} onChange={handleEditChange} className={inputCls}>
                                        {SEMESTRES.map(s => (
                                            <option key={s} value={s}>Semestre {s}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-[#333333]">Commentaire</label>
                                <textarea name="commentaire" rows={3} value={editForm.commentaire} onChange={handleEditChange} className={`${inputCls} resize-none`} placeholder="Commentaire optionnel..."></textarea>
                            </div>

                            <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                                <button type="button" onClick={() => setEditingNote(null)} className="px-6 py-3 font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors text-sm">
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
