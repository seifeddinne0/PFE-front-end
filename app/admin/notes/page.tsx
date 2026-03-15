"use client";

import { useEffect, useState } from "react";
import { Search, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, FileDown, Filter } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Note {
    id: number;
    etudiantNom: string;
    etudiantPrenom: string;
    etudiantId: number;
    matiere: string;
    note: number;
    type: string;
    semestre: string;
    enseignantNom: string;
    enseignantPrenom: string;
}

const SEMESTRES = ["Tous", "S1", "S2", "S3", "S4", "S5", "S6"];

export default function AdminNotesListPage() {
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedSemestre, setSelectedSemestre] = useState("Tous");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const fetchNotes = async () => {
        setIsLoading(true);
        try {
            const data = await api.get("/api/admin/notes");
            if (data && Array.isArray(data.content)) {
                setNotes(data.content);
            } else if (Array.isArray(data)) {
                setNotes(data);
            } else {
                setNotes([]);
            }
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du chargement des notes.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette note ?")) return;

        try {
            await api.delete(`/api/admin/notes/${id}`);
            toast.success("Note supprimée avec succès.");
            setNotes(notes.filter(n => n.id !== id));
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la suppression.");
        }
    };

    // Filtrer les notes
    const filteredNotes = notes.filter(n => {
        const matchSearch =
            (n.etudiantNom + " " + n.etudiantPrenom).toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.matiere?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchSemestre = selectedSemestre === "Tous" || n.semestre === selectedSemestre;
        return matchSearch && matchSemestre;
    });

    // Pagination
    const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
    const paginatedNotes = filteredNotes.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

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

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header / Actions */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-[#042954]">Gestion des Notes</h2>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    {/* Filtre semestre */}
                    <div className="relative flex items-center gap-2">
                        <Filter size={16} className="text-gray-400" />
                        <select
                            value={selectedSemestre}
                            onChange={(e) => { setSelectedSemestre(e.target.value); setCurrentPage(1); }}
                            className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffa000] transition-shadow"
                        >
                            {SEMESTRES.map(s => (
                                <option key={s} value={s}>{s === "Tous" ? "Tous les semestres" : `Semestre ${s}`}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher (étudiant, matière)..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffa000] transition-shadow text-sm"
                        />
                    </div>

                    <Link
                        href="/admin/notes/bulletin"
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap text-sm"
                    >
                        <FileDown size={18} />
                        Générer Bulletin
                    </Link>
                </div>
            </div>

            {/* Table */}
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
                            <th className="p-4 font-semibold">Enseignant</th>
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
                        ) : paginatedNotes.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="p-8 text-center text-gray-500">Aucune note trouvée.</td>
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
                                    <td className="p-4 text-gray-500 text-sm">
                                        {note.matiere || "-"}
                                    </td>
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
                                    <td className="p-4 text-gray-500 text-sm">
                                        {note.enseignantNom ? `${note.enseignantNom} ${note.enseignantPrenom || ""}` : "-"}
                                    </td>
                                    <td className="p-4 flex items-center justify-end gap-2">
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
                                        <span className={`px-3 py-1.5 rounded-lg text-lg font-bold shadow-sm ${getNoteColor(note.note)}`}>
                                            {note.note != null ? note.note.toFixed(2) : "-"}
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                    <div className="flex justify-between items-center py-1 border-b border-gray-200">
                                        <span className="text-gray-500">Matière</span>
                                        <span className="font-bold text-[#042954] text-right">{note.matiere || "-"}</span>
                                    </div>
                                    <div className="flex justify-between items-center py-1">
                                        <span className="text-gray-500">Enseignant</span>
                                        <span className="text-gray-700 text-right">{note.enseignantNom ? `${note.enseignantNom} ${note.enseignantPrenom || ""}` : "-"}</span>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2 border-t border-gray-100">
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
            {!isLoading && filteredNotes.length > 0 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-medium">
                            Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredNotes.length)} sur {filteredNotes.length}
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
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(1)}
                            className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Première page"
                        >
                            <ChevronsLeft size={18} />
                        </button>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Page précédente"
                        >
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

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Page suivante"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Dernière page"
                        >
                            <ChevronsRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
