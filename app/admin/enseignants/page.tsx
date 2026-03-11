"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Enseignant {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    specialite: string;
    grade: string;
    statut: string;
}

export default function EnseignantsListPage() {
    const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const fetchEnseignants = async () => {
        setIsLoading(true);
        try {
            const data = await api.get("/api/admin/enseignants");
            if (data && Array.isArray(data.content)) {
                setEnseignants(data.content);
            } else if (Array.isArray(data)) {
                setEnseignants(data);
            } else {
                setEnseignants([]);
            }
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du chargement des enseignants.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEnseignants();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet enseignant ?")) return;

        try {
            await api.delete(`/api/admin/enseignants/${id}`);
            toast.success("Enseignant supprimé avec succès.");
            setEnseignants(enseignants.filter(e => e.id !== id));
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la suppression.");
        }
    };

    // Filtrer les enseignants (recherche)
    const filteredEnseignants = enseignants.filter(e =>
        e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.matricule.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredEnseignants.length / itemsPerPage);
    const paginatedEnseignants = filteredEnseignants.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleExportPdf = () => {
        const token = localStorage.getItem("token");
        fetch("http://localhost:8080/api/admin/enseignants/export/pdf", {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "enseignants.pdf";
                a.click();
            });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header / Actions */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-[#042954]">Liste des Enseignants</h2>
                <button onClick={handleExportPdf} className="px-4 py-2 bg-red-600 text-white rounded-lg">
                    Export PDF
                </button>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher (nom, matricule)..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffa000] transition-shadow text-sm"
                        />
                    </div>

                    <Link
                        href="/admin/enseignants/create"
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap text-sm"
                    >
                        <Plus size={18} />
                        Ajouter Nouveau
                    </Link>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-sm">
                            <th className="p-4 font-semibold text-center w-16">#</th>
                            <th className="p-4 font-semibold">Matricule</th>
                            <th className="p-4 font-semibold">Nom & Prénom</th>
                            <th className="p-4 font-semibold">Email</th>
                            <th className="p-4 font-semibold">Téléphone</th>
                            <th className="p-4 font-semibold">Spécialité</th>
                            <th className="p-4 font-semibold">Grade</th>
                            <th className="p-4 font-semibold text-center">Statut</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={9} className="p-8 text-center text-gray-500">Chargement en cours...</td>
                            </tr>
                        ) : paginatedEnseignants.length === 0 ? (
                            <tr>
                                <td colSpan={9} className="p-8 text-center text-gray-500">Aucun enseignant trouvé.</td>
                            </tr>
                        ) : (
                            paginatedEnseignants.map((enseignant, index) => (
                                <tr key={enseignant.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 text-center text-sm text-gray-400 font-medium">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold tracking-wide">
                                            {enseignant.matricule || "N/A"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-[#333333]">{enseignant.nom} {enseignant.prenom}</div>
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm truncate max-w-[200px]">
                                        {enseignant.email}
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">
                                        {enseignant.telephone || "-"}
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">
                                        {enseignant.specialite || "-"}
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">
                                        {enseignant.grade || "-"}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${enseignant.statut === 'Actif' || enseignant.statut === undefined
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {enseignant.statut || "Actif"}
                                        </span>
                                    </td>
                                    <td className="p-4 flex items-center justify-end gap-2">
                                        <Link
                                            href={`/admin/enseignants/${enseignant.id}/edit`}
                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                            title="Modifier"
                                        >
                                            <Edit2 size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(enseignant.id)}
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
            {!isLoading && totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-medium">
                        Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredEnseignants.length)} sur {filteredEnseignants.length} résultats
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
