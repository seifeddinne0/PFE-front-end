"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Etudiant {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    statut: string; // ex: "Actif", "Inactif"
    photo?: string;
}

export default function EtudiantsListPage() {
    const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const fetchEtudiants = async () => {
        setIsLoading(true);
        try {
            const data = await api.get("/api/admin/etudiants");
            if (data && Array.isArray(data.content)) {
                setEtudiants(data.content);
            } else if (Array.isArray(data)) {
                setEtudiants(data);
            } else {
                setEtudiants([]);
            }
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du chargement des étudiants.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchEtudiants();
    }, []);

    const handleDelete = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cet étudiant ?")) return;

        try {
            await api.delete(`/api/admin/etudiants/${id}`);
            toast.success("Étudiant supprimé avec succès.");
            setEtudiants(etudiants.filter(e => e.id !== id));
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la suppression.");
        }
    };

    // Filtrer les étudiants (recherche)
    const filteredEtudiants = etudiants.filter(e =>
        e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.matricule.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Pagination
    const totalPages = Math.ceil(filteredEtudiants.length / itemsPerPage);
    const paginatedEtudiants = filteredEtudiants.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );
    const handleExportPdf = () => {
        const token = sessionStorage.getItem("token");
        fetch("http://localhost:8080/api/admin/etudiants/export/pdf", {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "etudiants.pdf";
                a.click();
            });
    };

    return (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header / Actions */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-[#042954]">Liste des Étudiants</h2>
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
                        href="/admin/etudiants/create"
                        className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap text-sm"
                    >
                        <Plus size={18} />
                        Ajouter Nouveau
                    </Link>
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse hidden md:table">
                    <thead>
                        <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-sm">
                            <th className="p-4 font-semibold text-center w-16">#</th>
                            <th className="p-4 font-semibold w-16 text-center">Photo</th>
                            <th className="p-4 font-semibold">Matricule</th>
                            <th className="p-4 font-semibold">Nom & Prénom</th>
                            <th className="p-4 font-semibold">Email</th>
                            <th className="p-4 font-semibold">Téléphone</th>
                            <th className="p-4 font-semibold text-center">Statut</th>
                            <th className="p-4 font-semibold text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500">Chargement en cours...</td>
                            </tr>
                        ) : paginatedEtudiants.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-gray-500">Aucun étudiant trouvé.</td>
                            </tr>
                        ) : (
                            paginatedEtudiants.map((etudiant, index) => (
                                <tr key={etudiant.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                    <td className="p-4 text-center text-sm text-gray-400 font-medium">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center">
                                            {etudiant.photo ? (
                                                <img
                                                    src={`http://localhost:8080${etudiant.photo.startsWith('/') ? '' : '/'}${etudiant.photo}`}
                                                    alt={`${etudiant.nom} ${etudiant.prenom}`}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${etudiant.nom}+${etudiant.prenom}&background=042954&color=fff`;
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-[#042954] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                                    {etudiant.nom?.charAt(0)}{etudiant.prenom?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center font-medium">
                                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold tracking-wide">
                                            {etudiant.matricule || "N/A"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-[#333333]">{etudiant.nom} {etudiant.prenom}</div>
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm truncate max-w-[200px]">
                                        {etudiant.email}
                                    </td>
                                    <td className="p-4 text-gray-500 text-sm">
                                        {etudiant.telephone || "-"}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${etudiant.statut === 'Actif' || etudiant.statut === undefined
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {etudiant.statut || "Actif"}
                                        </span>
                                    </td>
                                    <td className="p-4 flex items-center justify-end gap-2">
                                        <Link
                                            href={`/admin/etudiants/${etudiant.id}/edit`}
                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                            title="Modifier"
                                        >
                                            <Edit2 size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(etudiant.id)}
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
                        <div className="p-8 text-center text-gray-500">Chargement en cours...</div>
                    ) : paginatedEtudiants.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">Aucun étudiant trouvé.</div>
                    ) : (
                        paginatedEtudiants.map((etudiant, index) => (
                            <div key={etudiant.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        {etudiant.photo ? (
                                            <img
                                                src={`http://localhost:8080${etudiant.photo.startsWith('/') ? '' : '/'}${etudiant.photo}`}
                                                alt={`${etudiant.nom} ${etudiant.prenom}`}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${etudiant.nom}+${etudiant.prenom}&background=042954&color=fff`;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-[#042954] text-white flex items-center justify-center font-bold text-sm shadow-md">
                                                {etudiant.nom?.charAt(0)}{etudiant.prenom?.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-bold text-[#333333] text-lg leading-tight">{etudiant.nom} {etudiant.prenom}</div>
                                            <div className="text-xs text-blue-600 font-bold mt-0.5">{etudiant.matricule}</div>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${etudiant.statut === 'Actif' || etudiant.statut === undefined ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {etudiant.statut || "Actif"}
                                    </span>
                                </div>

                                <div className="space-y-1 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    <div className="flex justify-between border-b border-gray-200 pb-1">
                                        <span className="text-gray-400">Matricule</span>
                                        <span className="font-bold text-blue-700">{etudiant.matricule || "N/A"}</span>
                                    </div>
                                    <div className="flex justify-between border-b border-gray-200 py-1">
                                        <span className="text-gray-400">Email</span>
                                        <span className="truncate max-w-[150px]" title={etudiant.email}>{etudiant.email || "-"}</span>
                                    </div>
                                    <div className="flex justify-between pt-1">
                                        <span className="text-gray-400">Téléphone</span>
                                        <span>{etudiant.telephone || "-"}</span>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                    <Link href={`/admin/etudiants/${etudiant.id}/edit`} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded" title="Modifier"><Edit2 size={16} /></Link>
                                    <button onClick={() => handleDelete(etudiant.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded" title="Supprimer"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Pagination */}
            {!isLoading && filteredEtudiants.length > 0 && (
                <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-500 font-medium">
                            Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredEtudiants.length)} sur {filteredEtudiants.length}
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
