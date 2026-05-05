"use client";

import { useEffect, useState } from "react";
import { Trash2, CheckCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertTriangle, X, Save } from "lucide-react";
import { api, API_URL } from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Eye, Download, XCircle as XCircleIcon } from "lucide-react";
import { useConfirm } from "@/components/ConfirmProvider";

interface Absence {
    id: number;
    etudiantId: number;
    etudiantNom: string;
    etudiantPrenom: string;
    etudiantMatricule: string;
    matiereId: number;
    matiereNom: string;
    dateAbsence: string;
    statut: string;
    motif: string;
    justification: string;
    preuveJustification?: string;
    alerte: boolean;
    filiereNom?: string;
    niveauCode?: string;
    classeCode?: string;
}

export default function AdminAbsencesPage() {
    const router = useRouter();
    const { confirm } = useConfirm();
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

    // Hierarchical Filters
    const [filieres, setFilieres] = useState<any[]>([]);
    const [niveaux, setNiveaux] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [matieres, setMatieres] = useState<any[]>([]);

    const [selectedFiliere, setSelectedFiliere] = useState("");
    const [selectedNiveau, setSelectedNiveau] = useState("");
    const [selectedClasse, setSelectedClasse] = useState("");
    const [selectedMatiere, setSelectedMatiere] = useState("");

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

    const fetchMetadata = async () => {
        try {
            const [f, n, c, m] = await Promise.all([
                api.get("/api/admin/filieres"),
                api.get("/api/admin/niveaux"),
                api.get("/api/admin/classes"),
                api.get("/api/admin/matieres")
            ]);
            setFilieres(Array.isArray(f) ? f : []);
            setNiveaux(Array.isArray(n) ? n : (n.content || []));
            setClasses(Array.isArray(c) ? c : (c.content || []));
            setMatieres(Array.isArray(m) ? m : (m.content || []));
        } catch (error) {
            console.error("Erreur chargement metadonnées", error);
        }
    };

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }
        fetchAbsences();
        fetchMetadata();
    }, [router]);

    const handleDelete = async (id: number) => {
        const isConfirmed = await confirm({
            title: "Supprimer l'absence",
            message: "Voulez-vous vraiment supprimer cette absence ?",
            confirmText: "Supprimer",
            variant: "danger"
        });
        if (!isConfirmed) return;

        try {
            await api.delete(`/api/admin/absences/${id}`);
            toast.success("Absence supprimée avec succès.");
            await fetchAbsences();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la suppression.");
        }
    };

    const handleDecision = async (id: number, approved: boolean) => {
        if (!window.confirm(approved ? "Accepter cette justification ?" : "Rejeter cette justification ?")) return;

        try {
            const endpoint = approved ? 'approve' : 'reject';
            await api.patch(`/api/admin/absences/${id}/${endpoint}`, {});
            toast.success(approved ? "Justification acceptée." : "Justification rejetée.");
            await fetchAbsences();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la mise à jour.");
        }
    };

    const handleJustifierSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!justification.trim() || !justifyingAbsence) return;

        setIsSubmitting(true);
        try {
            await api.patch(`/api/admin/absences/${justifyingAbsence.id}/justifier`, { justification: justification });
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

    const buildUploadUrl = (path?: string) => {
        if (!path) return "#";
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return `${API_URL}${path}`;
    };

    const getStatutBadge = (statut: string) => {
        switch (statut) {
            case "JUSTIFIEE": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            case "NON_JUSTIFIEE": return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400";
            case "EN_ATTENTE": return "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400";
            case "ACTIF": return "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400";
            default: return "bg-gray-100 text-gray-700 dark:bg-[#1a1a1a] dark:text-zinc-400";
        }
    };

    const formatDate = (dateString: string) => {
        if (!dateString) return "-";
        const date = new Date(dateString);
        return date.toLocaleDateString('fr-FR');
    };

    const filteredAbsences = absences.filter(abs => {
        const matchesStatut = filterStatut === "TOUS" || abs.statut === filterStatut;
        const matchesFiliere = !selectedFiliere || abs.filiereNom === selectedFiliere;
        const matchesNiveau = !selectedNiveau || abs.niveauCode === selectedNiveau;
        const matchesClasse = !selectedClasse || abs.classeCode === selectedClasse;
        const matchesMatiere = !selectedMatiere || abs.matiereNom === selectedMatiere;
        
        return matchesStatut && matchesFiliere && matchesNiveau && matchesClasse && matchesMatiere;
    });

    const totalPages = Math.ceil(filteredAbsences.length / itemsPerPage);
    const paginatedAbsences = filteredAbsences.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const inputCls = "w-full bg-[#f8f9fa] dark:bg-[#0a0a0a] border border-gray-200 dark:border-slate-700 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white dark:bg-slate-800 transition-all text-sm";

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-[#042954] dark:text-white">Liste des Absences</h2>
                        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Gestion et suivi des absences des étudiants</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        {/* Filière */}
                        <select
                            value={selectedFiliere}
                            onChange={(e) => { setSelectedFiliere(e.target.value); setSelectedNiveau(""); setSelectedClasse(""); setCurrentPage(1); }}
                            className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-700 text-xs rounded-lg focus:ring-[#ffa000] p-2 outline-none min-w-[120px]"
                        >
                            <option value="">Toutes les Filières</option>
                            {filieres.map(f => <option key={f.id} value={f.nom}>{f.nom}</option>)}
                        </select>

                        {/* Niveau */}
                        <select
                            value={selectedNiveau}
                            onChange={(e) => { setSelectedNiveau(e.target.value); setSelectedClasse(""); setCurrentPage(1); }}
                            className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-700 text-xs rounded-lg focus:ring-[#ffa000] p-2 outline-none min-w-[100px]"
                        >
                            <option value="">Tous les Niveaux</option>
                            {niveaux
                                .filter(n => !selectedFiliere || n.filiereNom === selectedFiliere)
                                .map(n => <option key={n.id} value={n.code}>{n.code}</option>)}
                        </select>

                        {/* Classe */}
                        <select
                            value={selectedClasse}
                            onChange={(e) => { setSelectedClasse(e.target.value); setCurrentPage(1); }}
                            className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-700 text-xs rounded-lg focus:ring-[#ffa000] p-2 outline-none min-w-[100px]"
                        >
                            <option value="">Toutes les Classes</option>
                            {classes
                                .filter(c => !selectedNiveau || c.code.startsWith(selectedNiveau))
                                .map(c => <option key={c.id} value={c.code}>{c.code}</option>)}
                        </select>

                        {/* Matière */}
                        <select
                            value={selectedMatiere}
                            onChange={(e) => { setSelectedMatiere(e.target.value); setCurrentPage(1); }}
                            className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-700 text-xs rounded-lg focus:ring-[#ffa000] p-2 outline-none min-w-[120px]"
                        >
                            <option value="">Toutes les Matières</option>
                            {matieres.map(m => <option key={m.id} value={m.nom}>{m.nom}</option>)}
                        </select>

                        <div className="h-8 w-[1px] bg-gray-200 dark:bg-slate-700 mx-1 hidden lg:block"></div>

                        <select
                            value={filterStatut}
                            onChange={(e) => { setFilterStatut(e.target.value); setCurrentPage(1); }}
                            className="bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700 text-gray-700 text-xs rounded-lg font-bold focus:ring-[#ffa000] p-2 outline-none"
                        >
                            <option value="TOUS">Tous les statuts</option>
                            <option value="JUSTIFIEE">Justifiée</option>
                            <option value="NON_JUSTIFIEE">Non Justifiée</option>
                            <option value="EN_ATTENTE">En Attente</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse hidden md:table">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800/50 text-sm">
                                <th className="p-4 font-semibold">Étudiant</th>
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
                                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-slate-400">
                                        <div className="flex items-center justify-center gap-3">
                                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#ffa000]"></div>
                                            Chargement des absences...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredAbsences.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-slate-400">
                                        Aucune absence trouvée.
                                    </td>
                                </tr>
                            ) : (
                                paginatedAbsences.map((absence) => (
                                    <tr key={absence.id} className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-[#151515] transition-colors dark:text-zinc-300">
                                        <td className="p-4">
                                            <div className="font-bold text-[#333333] dark:text-zinc-100 text-lg leading-tight">{absence.etudiantNom} {absence.etudiantPrenom}</div>
                                            <div className="text-xs text-amber-600 dark:text-amber-400 font-bold mt-0.5">{absence.etudiantMatricule}</div>
                                        </td>
                                        <td className="p-4 text-[#042954] dark:text-white font-medium">{absence.matiereNom || "-"}</td>
                                        <td className="p-4 text-gray-600 dark:text-slate-300 truncate">{formatDate(absence.dateAbsence)}</td>
                                        <td className="p-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatutBadge(absence.statut)}`}>
                                                {absence.statut.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm max-w-[250px]">
                                            <div className="flex flex-col gap-2">
                                                {absence.justification && (
                                                    <div className="text-gray-600 dark:text-slate-300 italic text-xs">
                                                        &quot;{absence.justification}&quot;
                                                    </div>
                                                )}
                                                {absence.preuveJustification ? (
                                                    <a
                                                        href={buildUploadUrl(absence.preuveJustification)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-700 dark:text-blue-400 font-bold text-xs"
                                                    >
                                                        <Eye size={14} />
                                                        Voir le justificatif
                                                    </a>
                                                ) : (
                                                    <div className="text-gray-400 italic text-xs">{absence.motif || "Aucun motif"}</div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            {absence.alerte && (
                                                <div className="flex flex-col items-center justify-center gap-1" title="Élimination: Plus de 3 absences non justifiées dans cette matière">
                                                    <AlertTriangle size={20} className="text-red-500" />
                                                    <span className="text-[10px] font-bold text-red-600 dark:text-red-500 uppercase tracking-tighter">ÉLIMINÉ</span>
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4 flex items-center justify-end gap-2">
                                            {absence.statut === "EN_ATTENTE" && (
                                                <>
                                                    <button
                                                        onClick={() => handleDecision(absence.id, true)}
                                                        className="p-2 text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/40 rounded transition-colors"
                                                        title="Approuver"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDecision(absence.id, false)}
                                                        className="p-2 text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded transition-colors"
                                                        title="Rejeter"
                                                    >
                                                        <XCircleIcon size={16} />
                                                    </button>
                                                </>
                                            )}
                                            {absence.statut === "NON_JUSTIFIEE" && (
                                                <button
                                                    onClick={() => { setJustifyingAbsence(absence); setJustification(""); }}
                                                    className="p-2 text-green-600 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/40 rounded transition-colors"
                                                    title="Justifier manuellement"
                                                >
                                                    <CheckCircle size={16} />
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(absence.id)}
                                                className="p-2 text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded transition-colors"
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
                            <div className="p-8 text-center text-gray-500 dark:text-slate-400 flex justify-center items-center gap-3">
                                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#ffa000]"></div>
                                Chargement des absences...
                            </div>
                        ) : paginatedAbsences.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">Aucune absence trouvée.</div>
                        ) : (
                            paginatedAbsences.map((absence) => (
                                <div key={absence.id} className={`bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm relative flex flex-col gap-3 border transition-colors ${absence.alerte ? 'border-red-200' : 'border-gray-200 dark:border-slate-700'}`}>
                                    {absence.alerte && (
                                        <div className="absolute top-4 right-4 animate-pulse">
                                            <AlertTriangle size={20} className="text-red-500" />
                                        </div>
                                    )}
                                    <div className="flex flex-col pr-8">
                                        <div className="font-bold text-[#333333] dark:text-slate-100 text-lg mb-1">{absence.etudiantNom} {absence.etudiantPrenom}</div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatutBadge(absence.statut)}`}>
                                                {absence.statut.replace('_', ' ')}
                                            </span>
                                            <span className="text-xs font-bold text-amber-700 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300 px-2 py-0.5 rounded">{absence.etudiantMatricule}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700 text-sm">
                                        <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-slate-700">
                                            <span className="text-gray-500 dark:text-slate-400">Matière</span>
                                            <span className="font-bold text-[#042954] dark:text-white text-right">{absence.matiereNom || "-"}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-slate-700">
                                            <span className="text-gray-500 dark:text-slate-400">Date</span>
                                            <span className="font-medium text-gray-700 text-right">{formatDate(absence.dateAbsence)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 dark:text-slate-400 mb-1">Motif / Justification</span>
                                            <div className="space-y-2">
                                                {absence.justification && (
                                                    <div className="text-xs italic text-gray-600 dark:text-slate-400">&quot;{absence.justification}&quot;</div>
                                                )}
                                                {absence.preuveJustification ? (
                                                    <a
                                                        href={buildUploadUrl(absence.preuveJustification)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="flex items-center gap-1.5 text-blue-600 font-bold text-xs"
                                                    >
                                                        <Eye size={14} /> Voir le justificatif
                                                    </a>
                                                ) : (
                                                    <div className="bg-gray-100 dark:bg-slate-900 p-2 rounded text-[10px]">
                                                        {absence.motif || "Aucun motif"}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                                        {absence.statut === "EN_ATTENTE" && (
                                            <>
                                                <button onClick={() => handleDecision(absence.id, true)} className="flex-1 py-2 text-xs font-bold text-green-600 bg-green-50 rounded select-none">Accepter</button>
                                                <button onClick={() => handleDecision(absence.id, false)} className="flex-1 py-2 text-xs font-bold text-red-600 bg-red-50 rounded select-none">Rejeter</button>
                                            </>
                                        )}
                                        {absence.statut === "NON_JUSTIFIEE" && (
                                            <button onClick={() => { setJustifyingAbsence(absence); setJustification(""); }} className="flex-1 py-2 text-xs font-bold text-green-600 bg-green-50 rounded select-none">Justifier manuellement</button>
                                        )}
                                        <button onClick={() => handleDelete(absence.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Pagination */}
                {!isLoading && filteredAbsences.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-zinc-800/50 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                                Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredAbsences.length)} sur {filteredAbsences.length}
                            </span>
                            <div className="flex items-center gap-2 border-l border-gray-200 dark:border-zinc-800/50 pl-3 hidden sm:flex">
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
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-1 border border-gray-300 dark:border-zinc-700 dark:bg-[#111111] dark:text-zinc-400 dark:hover:bg-[#1a1a1a] rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Première page">
                                <ChevronsLeft size={18} />
                            </button>
                            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="p-1 border border-gray-300 dark:border-zinc-700 dark:bg-[#111111] dark:text-zinc-400 dark:hover:bg-[#1a1a1a] rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Page précédente">
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
                                                ? 'bg-[#042954] text-white border-[#042954] dark:bg-[#ffa000] dark:border-[#ffa000] dark:text-[#111111]'
                                                : 'border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-zinc-700 dark:bg-[#111111] dark:text-zinc-400 dark:hover:bg-[#1a1a1a]'
                                                }`}
                                        >
                                            {i + 1}
                                        </button>
                                    );
                                } else if (
                                    (i === 1 && currentPage > 3) ||
                                    (i === totalPages - 2 && currentPage < totalPages - 2)
                                ) {
                                    return <span key={i} className="px-1 text-gray-400 dark:text-zinc-500">...</span>;
                                }
                                return null;
                            })}

                            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="p-1 border border-gray-300 dark:border-zinc-700 dark:bg-[#111111] dark:text-zinc-400 dark:hover:bg-[#1a1a1a] rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Page suivante">
                                <ChevronRight size={18} />
                            </button>
                            <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)} className="p-1 border border-gray-300 dark:border-zinc-700 dark:bg-[#111111] dark:text-zinc-400 dark:hover:bg-[#1a1a1a] rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" title="Dernière page">
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

                    <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden animate-in fade-in zoom-in">
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
                                <label className="text-sm font-bold text-[#333333] dark:text-slate-100">Détails de justification <span className="text-red-500">*</span></label>
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

                            <div className="pt-4 border-t border-gray-100 dark:border-slate-700 flex items-center justify-end gap-3">
                                <button type="button" onClick={() => setJustifyingAbsence(null)} className="px-5 py-2.5 font-semibold text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:bg-slate-800/50 rounded-lg transition-colors text-sm">
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
