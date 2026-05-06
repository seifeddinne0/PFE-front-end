"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, BookOpen } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/ConfirmProvider";

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
    canManageNotes?: boolean;
    photo?: string;
    filiereId?: number;
    filiereNom?: string;
    filiereCode?: string;
}

export default function EnseignantsListPage() {
    const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
    const { confirm } = useConfirm();
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);
    
    const [filieres, setFilieres] = useState<any[]>([]);
    const [niveaux, setNiveaux] = useState<any[]>([]);
    
    // Subject management state
    const [isMatieresModalOpen, setIsMatieresModalOpen] = useState(false);
    const [selectedEnseignant, setSelectedEnseignant] = useState<Enseignant | null>(null);
    const [allMatieres, setAllMatieres] = useState<any[]>([]);
    const [teacherMatieres, setTeacherMatieres] = useState<number[]>([]);
    const [isSavingMatieres, setIsSavingMatieres] = useState(false);
    
    const [modalFilterFiliere, setModalFilterFiliere] = useState("");
    const [modalFilterLevel, setModalFilterLevel] = useState("");

    const allHaveNotesAccess = enseignants.length > 0 && enseignants.every(e => Boolean(e.canManageNotes));

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [ensData, filData, nivData] = await Promise.all([
                    api.get("/api/admin/enseignants?size=1000"),
                    api.get("/api/admin/filieres"),
                    api.get("/api/admin/niveaux")
                ]);
                
                // Handle paginated or direct array responses
                setEnseignants(Array.isArray(ensData) ? ensData : (ensData?.content || []));
                setFilieres(Array.isArray(filData) ? filData : (filData?.content || []));
                setNiveaux(Array.isArray(nivData) ? nivData : (nivData?.content || []));
                
                setIsLoading(false);
            } catch (error: any) {
                toast.error("Erreur lors du chargement des données.");
                setIsLoading(false);
            }
        };
        fetchData();
    }, []);

    const handleOpenMatieresModal = async (enseignant: Enseignant) => {
        setSelectedEnseignant(enseignant);
        setIsMatieresModalOpen(true);
        try {
            const [all, mine] = await Promise.all([
                api.get("/api/admin/matieres"),
                api.get(`/api/admin/enseignants/${enseignant.id}/matieres`)
            ]);
            setAllMatieres(all);
            setTeacherMatieres(mine.map((m: any) => m.id));
        } catch (err) {
            toast.error("Erreur lors du chargement des matières.");
        }
    };

    const handleSaveMatieres = async () => {
        if (!selectedEnseignant) return;
        setIsSavingMatieres(true);
        try {
            await api.post(`/api/admin/enseignants/${selectedEnseignant.id}/matieres`, teacherMatieres);
            toast.success("Matières mises à jour avec succès.");
            setIsMatieresModalOpen(false);
        } catch (err: any) {
            toast.error(err.message || "Erreur lors de la sauvegarde.");
        } finally {
            setIsSavingMatieres(false);
        }
    };

    const toggleMatiere = (id: number) => {
        setTeacherMatieres(prev => 
            prev.includes(id) ? prev.filter(mid => mid !== id) : [...prev, id]
        );
    };

    const handleDelete = async (id: number) => {
        const isConfirmed = await confirm({
            title: "Supprimer l'enseignant",
            message: "Êtes-vous sûr de vouloir supprimer cet enseignant ?",
            confirmText: "Supprimer",
            variant: "danger"
        });
        if (!isConfirmed) return;

        try {
            await api.delete(`/api/admin/enseignants/${id}`);
            toast.success("Enseignant supprimé avec succès.");
            setEnseignants(enseignants.filter(e => e.id !== id));
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la suppression.");
        }
    };

    const handleToggleNotesAccessToAll = async () => {
        const enableAccess = !allHaveNotesAccess;
        const confirmText = enableAccess
            ? "Voulez-vous donner l'accès de gestion des notes à tous les enseignants ?"
            : "Voulez-vous retirer l'accès de gestion des notes à tous les enseignants ?";

        const isConfirmed = await confirm({
            title: enableAccess ? "Donner acces notes" : "Retirer acces notes",
            message: confirmText,
            confirmText: enableAccess ? "Donner acces" : "Retirer acces",
            cancelText: "Annuler",
            variant: enableAccess ? "info" : "warning"
        });
        if (!isConfirmed) return;

        try {
            const response = await api.patch(`/api/admin/enseignants/notes-access/all?enabled=${enableAccess}`, {});
            setEnseignants(prev => prev.map(e => ({ ...e, canManageNotes: enableAccess })));
            const updated = response?.updated ?? 0;
            toast.success(
                enableAccess
                    ? `Accès notes accordé à tous (${updated} mise(s) à jour).`
                    : `Accès notes retiré pour tous (${updated} mise(s) à jour).`
            );
        } catch (error: any) {
            toast.error(error.message || "Impossible de modifier l'accès pour tous.");
        }
    };

    // Filtrer les enseignants (recherche)
    const filteredEnseignants = enseignants.filter(e => {
        const matchesSearch = 
            e.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.prenom.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
            e.email.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
    });

    // Pagination
    const totalPages = Math.ceil(filteredEnseignants.length / itemsPerPage);
    const paginatedEnseignants = filteredEnseignants.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleExportPdf = () => {
        const token = sessionStorage.getItem("token");
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

            const isActiveStatus = (statut?: string) => (statut || "").toUpperCase() === "ACTIF";

    return (
        <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
            {/* Header / Actions */}
            <div className="p-6 border-b border-gray-100 dark:border-zinc-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h2 className="text-xl font-bold text-[#042954] dark:text-white">Liste des Enseignants</h2>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={handleToggleNotesAccessToAll}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${allHaveNotesAccess
                            ? "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400"
                            : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400"
                            }`}
                    >
                        {allHaveNotesAccess ? "Retirer accès notes à tous" : "Donner accès notes à tous"}
                    </button>
                    <button onClick={handleExportPdf} className="px-4 py-2 bg-red-600 text-white rounded-lg">
                        Export PDF
                    </button>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
                        <input
                            type="text"
                            placeholder="Rechercher (nom, matricule)..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                            className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-zinc-800 dark:text-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffa000] focus:border-transparent transition-shadow text-sm"
                        />
                    </div>

                    <Link
                        href="/admin/enseignants/create"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap text-sm"
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
                        <tr className="bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800/50 text-sm">
                            <th className="p-4 font-semibold text-center w-16">#</th>
                            <th className="p-4 font-semibold w-16 text-center">Photo</th>
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
                                <td colSpan={10} className="p-8 text-center text-gray-500 dark:text-slate-400">Chargement en cours...</td>
                            </tr>
                        ) : paginatedEnseignants.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="p-8 text-center text-gray-500 dark:text-slate-400">Aucun enseignant trouvé.</td>
                            </tr>
                        ) : (
                            paginatedEnseignants.map((enseignant, index) => (
                                <tr key={enseignant.id} className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-[#151515] transition-colors dark:text-zinc-300">
                                    <td className="p-4 text-center text-sm text-gray-400 dark:text-slate-500 font-medium">
                                        {(currentPage - 1) * itemsPerPage + index + 1}
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex justify-center">
                                            {enseignant.photo ? (
                                                <img
                                                    src={`http://localhost:8080${enseignant.photo.startsWith('/') ? '' : '/'}${enseignant.photo}`}
                                                    alt={`${enseignant.nom} ${enseignant.prenom}`}
                                                    className="w-10 h-10 rounded-full object-cover border-2 border-white dark:border-[#111111] shadow-sm"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${enseignant.nom}+${enseignant.prenom}&background=042954&color=fff`;
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-[#042954] text-white flex items-center justify-center font-bold text-xs shadow-sm">
                                                    {enseignant.nom?.charAt(0)}{enseignant.prenom?.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center font-medium">
                                        <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold tracking-wide">
                                            {enseignant.matricule || "N/A"}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="font-bold text-[#333333] dark:text-zinc-100">{enseignant.nom} {enseignant.prenom}</div>
                                    </td>
                                    <td className="p-4 text-gray-500 dark:text-zinc-400 text-sm truncate max-w-[200px]">
                                        {enseignant.email}
                                    </td>
                                    <td className="p-4 text-gray-500 dark:text-zinc-400 text-sm">
                                        {enseignant.telephone || "-"}
                                    </td>
                                    <td className="p-4 text-gray-500 dark:text-zinc-400 text-sm">
                                        {enseignant.specialite || "-"}
                                    </td>
                                    <td className="p-4 text-gray-500 dark:text-zinc-400 text-sm">
                                        {enseignant.grade || "-"}
                                    </td>
                                    <td className="p-4 text-center">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${isActiveStatus(enseignant.statut) || enseignant.statut === undefined
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                            }`}>
                                            {enseignant.statut || "Actif"}
                                        </span>
                                    </td>
                                    <td className="p-4 flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleOpenMatieresModal(enseignant)}
                                            className="p-2 text-[#ffa000] bg-orange-50 hover:bg-orange-100 dark:text-[#ffa000] dark:bg-orange-900/20 dark:hover:bg-orange-900/40 rounded transition-colors"
                                            title="Gérer les matières"
                                        >
                                            <BookOpen size={16} />
                                        </button>
                                        <Link
                                            href={`/admin/enseignants/${enseignant.id}/edit`}
                                            className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded transition-colors"
                                            title="Modifier"
                                        >
                                            <Edit2 size={16} />
                                        </Link>
                                        <button
                                            onClick={() => handleDelete(enseignant.id)}
                                            className="p-2 text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded transition-colors cursor-pointer"
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
                <div className="grid grid-cols-1 gap-4 p-4 md:hidden bg-gray-50 dark:bg-slate-800/50/30">
                    {isLoading ? (
                        <div className="p-8 text-center text-gray-500 dark:text-slate-400">Chargement en cours...</div>
                    ) : paginatedEnseignants.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">Aucun enseignant trouvé.</div>
                    ) : (
                        paginatedEnseignants.map((enseignant, index) => (
                            <div key={enseignant.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm relative flex flex-col gap-3">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-3">
                                        {enseignant.photo ? (
                                            <img
                                                src={`http://localhost:8080${enseignant.photo.startsWith('/') ? '' : '/'}${enseignant.photo}`}
                                                alt={`${enseignant.nom} ${enseignant.prenom}`}
                                                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${enseignant.nom}+${enseignant.prenom}&background=042954&color=fff`;
                                                }}
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-[#042954] text-white flex items-center justify-center font-bold text-sm shadow-md">
                                                {enseignant.nom?.charAt(0)}{enseignant.prenom?.charAt(0)}
                                            </div>
                                        )}
                                        <div>
                                            <div className="font-bold text-[#333333] dark:text-slate-100 text-lg leading-tight">{enseignant.nom} {enseignant.prenom}</div>
                                            <div className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block mt-1">{enseignant.matricule || "N/A"}</div>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${isActiveStatus(enseignant.statut) || enseignant.statut === undefined ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {enseignant.statut || "Actif"}
                                    </span>
                                </div>

                                <div className="space-y-1 text-sm text-gray-600 dark:text-slate-300 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                        <div><span className="block text-xs text-gray-400 dark:text-slate-500">Spécialité</span><span className="font-medium">{enseignant.specialite || "-"}</span></div>
                                        <div><span className="block text-xs text-gray-400 dark:text-slate-500">Grade</span><span className="font-medium">{enseignant.grade || "-"}</span></div>
                                    </div>
                                    <div className="flex justify-between border-t border-gray-200 dark:border-slate-700 pt-2">
                                        <span className="text-gray-400 dark:text-slate-500">Contact</span>
                                        <div className="text-right">
                                            <div className="truncate max-w-[150px]" title={enseignant.email}>{enseignant.email || "-"}</div>
                                            <div>{enseignant.telephone || "-"}</div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                                    <Link href={`/admin/enseignants/${enseignant.id}/edit`} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded" title="Modifier"><Edit2 size={16} /></Link>
                                    <button onClick={() => handleDelete(enseignant.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded" title="Supprimer"><Trash2 size={16} /></button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Pagination */}
            {!isLoading && filteredEnseignants.length > 0 && (
                <div className="p-4 border-t border-gray-100 dark:border-zinc-800/50 flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                        <span className="text-gray-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                            Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredEnseignants.length)} sur {filteredEnseignants.length}
                        </span>
                        <div className="flex items-center gap-2 border-l border-gray-200 dark:border-zinc-800/50 pl-3">
                            <span className="text-gray-500 dark:text-zinc-400">Afficher:</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                className="border border-gray-300 dark:border-zinc-700 dark:bg-[#111111] dark:text-zinc-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffa000] focus:border-transparent"
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
                            className="p-1 border border-gray-300 dark:border-zinc-700 dark:bg-[#111111] dark:text-zinc-400 dark:hover:bg-[#1a1a1a] rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Première page"
                        >
                            <ChevronsLeft size={18} />
                        </button>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            className="p-1 border border-gray-300 dark:border-zinc-700 dark:bg-[#111111] dark:text-zinc-400 dark:hover:bg-[#1a1a1a] rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Page précédente"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        {Array.from({ length: totalPages }).map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`w-8 h-8 rounded border transition-colors font-medium flex items-center justify-center ${currentPage === i + 1
                                    ? 'bg-[#042954] text-white border-[#042954] dark:bg-[#ffa000] dark:border-[#ffa000] dark:text-[#111111]'
                                    : 'border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-zinc-700 dark:bg-[#111111] dark:text-zinc-400 dark:hover:bg-[#1a1a1a]'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}

                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            className="p-1 border border-gray-300 dark:border-zinc-700 dark:bg-[#111111] dark:text-zinc-400 dark:hover:bg-[#1a1a1a] rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Page suivante"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            disabled={currentPage === totalPages}
                            onClick={() => setCurrentPage(totalPages)}
                            className="p-1 border border-gray-300 dark:border-zinc-700 dark:bg-[#111111] dark:text-zinc-400 dark:hover:bg-[#1a1a1a] rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title="Dernière page"
                        >
                            <ChevronsRight size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Matières Modal */}
            {isMatieresModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#111111] rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800">
                            <h3 className="text-xl font-bold text-[#042954] dark:text-white">
                                Matières de {selectedEnseignant?.prenom} {selectedEnseignant?.nom}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">Sélectionnez les matières enseignées par cet intervenant.</p>
                            
                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1 block">Filière</label>
                                    <select 
                                        value={modalFilterFiliere}
                                        onChange={(e) => {
                                            setModalFilterFiliere(e.target.value);
                                            setModalFilterLevel(""); // Reset level when filiere changes
                                        }}
                                        className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#ffa000] outline-none"
                                    >
                                        <option value="">Toutes les filières</option>
                                        {filieres.map(f => (
                                            <option key={f.id} value={f.code}>{f.nom}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-400 dark:text-zinc-500 uppercase mb-1 block">Niveau</label>
                                    <select 
                                        value={modalFilterLevel}
                                        onChange={(e) => setModalFilterLevel(e.target.value)}
                                        className="w-full bg-gray-50 dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 rounded-lg px-3 py-2 text-xs focus:ring-2 focus:ring-[#ffa000] outline-none"
                                        disabled={!modalFilterFiliere}
                                    >
                                        <option value="">Tous les niveaux</option>
                                        {niveaux
                                            .filter(n => !modalFilterFiliere || n.filiereNom === modalFilterFiliere || n.filiereCode === modalFilterFiliere)
                                            .map(n => (
                                                <option key={n.id} value={n.code}>{n.code} - {n.nom}</option>
                                            ))
                                        }
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 max-h-[500px] overflow-y-auto">
                            {allMatieres.length === 0 ? (
                                <p className="text-center text-gray-500 py-8">Aucune matière disponible.</p>
                            ) : (
                                // Triple Grouping: Filiere > Level > Semester
                                Object.entries(
                                    allMatieres
                                    .filter(m => !modalFilterFiliere || m.filiereCode === modalFilterFiliere)
                                    .filter(m => !modalFilterLevel || m.niveauCode === modalFilterLevel)
                                    .reduce((acc: any, m: any) => {
                                        const filiere = m.filiereNom || "Sans Filière";
                                        if (!acc[filiere]) acc[filiere] = {};
                                        
                                        const level = m.niveauCode || "Sans Niveau";
                                        if (!acc[filiere][level]) acc[filiere][level] = [];
                                        
                                        acc[filiere][level].push(m);
                                        return acc;
                                    }, {})
                                ).sort((a, b) => {
                                    // Keep "Sans Filière" at the end
                                    if (a[0] === "Sans Filière") return 1;
                                    if (b[0] === "Sans Filière") return -1;
                                    return a[0].localeCompare(b[0]);
                                }).map(([filiere, levels]: [string, any]) => (
                                    <div key={filiere} className="mb-8 last:mb-0 bg-gray-50/50 dark:bg-zinc-800/20 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800">
                                        <h4 className="text-sm font-black text-[#042954] dark:text-[#ffa000] uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-[#ffa000] rounded-full"></div>
                                            Filière: {filiere}
                                        </h4>
                                        
                                        {Object.entries(levels).sort().map(([level, matieres]: [string, any]) => (
                                            <div key={level} className="mb-6 last:mb-0 ml-4">
                                                <h5 className="text-xs font-bold text-gray-500 dark:text-zinc-400 uppercase mb-3 flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full border-2 border-blue-500"></span>
                                                    Niveau: {level}
                                                </h5>
                                                
                                                <div className="grid grid-cols-1 gap-2">
                                                    {Object.entries(
                                                        matieres.reduce((acc: any, m: any) => {
                                                            const sem = m.semestre || "S1";
                                                            if (!acc[sem]) acc[sem] = [];
                                                            acc[sem].push(m);
                                                            return acc;
                                                        }, {})
                                                    ).sort().map(([sem, semMatieres]: [string, any]) => (
                                                        <div key={sem} className="ml-4 mb-2">
                                                            <div className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-2 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md inline-block">
                                                                Semestre {sem}
                                                            </div>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                                {semMatieres.map((m: any) => (
                                                                    <label key={m.id} className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                                                                        teacherMatieres.includes(m.id) 
                                                                            ? 'bg-white border-blue-400 shadow-sm ring-1 ring-blue-400 dark:bg-zinc-800 dark:border-blue-600' 
                                                                            : 'bg-white border-gray-100 dark:bg-[#111111] dark:border-zinc-800 hover:border-gray-300'
                                                                    }`}>
                                                                        <div className="flex flex-col">
                                                                            <span className="font-semibold text-xs dark:text-zinc-200">{m.nom}</span>
                                                                            <span className="text-[9px] text-gray-500">{m.code} — Coeff: {m.coefficient}</span>
                                                                        </div>
                                                                        <input 
                                                                            type="checkbox" 
                                                                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                                                            checked={teacherMatieres.includes(m.id)}
                                                                            onChange={() => toggleMatiere(m.id)}
                                                                        />
                                                                    </label>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ))
                            )}
                        </div>
                        <div className="p-6 bg-gray-50 dark:bg-[#1a1a1a] flex justify-end gap-3">
                            <button 
                                onClick={() => setIsMatieresModalOpen(false)}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-zinc-400 hover:text-gray-800"
                            >
                                Annuler
                            </button>
                            <button 
                                onClick={handleSaveMatieres}
                                disabled={isSavingMatieres}
                                className="px-6 py-2 bg-[#042954] dark:bg-[#ffa000] text-white dark:text-[#111111] rounded-lg text-sm font-bold shadow-lg disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSavingMatieres ? "Enregistrement..." : "Enregistrer"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
