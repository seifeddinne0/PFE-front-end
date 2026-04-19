"use client";

import { useEffect, useState } from "react";
import { Search, CheckCircle, XCircle, FileText, Check, X, Filter } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Utilisateur {
    id: number;
    nom: string;
    prenom: string;
    matricule?: string;
}

interface DocumentDemande {
    id: number;
    typeDocument: string;
    statut: string;
    monStatut?: string;
    matiereNom?: string;
    createdAt: string;
    motif?: string;
    etudiantNom?: string;
    etudiantPrenom?: string;
    etudiantMatricule?: string;
}

export default function EnseignantDocumentsPage() {
    const [documents, setDocuments] = useState<DocumentDemande[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filtres et Recherche
    const [searchTerm, setSearchTerm] = useState("");
    const [statutFilter, setStatutFilter] = useState("Tous");
    
    // Modals
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
    const [currentDoc, setCurrentDoc] = useState<DocumentDemande | null>(null);
    const [validationAction, setValidationAction] = useState<"valider" | "rejeter">("valider");
    const [commentaire, setCommentaire] = useState("");

    const fetchDocuments = async () => {
        try {
            const data = await api.get("/api/enseignant/documents");
            if (Array.isArray(data)) {
                setDocuments(data);
            } else if (data && Array.isArray(data.content)) {
                setDocuments(data.content);
            } else {
                setDocuments([]);
            }
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du chargement des documents.");
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        await fetchDocuments();
        setIsLoading(false);
    };

    useEffect(() => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
            return;
        }
        loadData();
    }, []);

    const openValidationModal = (doc: DocumentDemande, action: "valider" | "rejeter") => {
        setCurrentDoc(doc);
        setValidationAction(action);
        setCommentaire("");
        setIsValidationModalOpen(true);
    };

    const handleValidationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentDoc) return;
        try {
            const payload = { 
                valide: validationAction === "valider" ? "true" : "false",
                commentaire 
            };
            await api.patch(`/api/enseignant/documents/${currentDoc.id}/valider`, payload);
            toast.success(`Attestation ${validationAction === "valider" ? "validée" : "rejetée"} avec succès !`);
            setIsValidationModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'opération.");
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const normalizeTeacherStatus = (doc: DocumentDemande): "EN_ATTENTE" | "VALIDEE" | "REJETEE" => {
        const raw = (doc.monStatut || doc.statut || "").toUpperCase();
        if (raw === "VALIDEE" || raw === "VALIDE") return "VALIDEE";
        if (raw === "REJETEE" || raw === "REJETE") return "REJETEE";
        return "EN_ATTENTE";
    };

    const getStatutBadge = (statut?: string) => {
        switch (statut) {
            case 'EN_ATTENTE': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">EN ATTENTE</span>;
            case 'VALIDEE': return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">VALIDÉE</span>;
            case 'REJETEE': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">REJETÉE</span>;
            default: return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">EN ATTENTE</span>;
        }
    };

    const filteredDocuments = documents.filter(d => {
        const matchesSearch = 
            (`${d.etudiantNom || ''} ${d.etudiantPrenom || ''}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (d.etudiantMatricule?.toLowerCase().includes(searchTerm.toLowerCase()));
            
        const docStatut = normalizeTeacherStatus(d);
        const matchesStatut = statutFilter === "Tous" || docStatut === statutFilter;
        
        return matchesSearch && matchesStatut;
    });

    return (
        <div className="space-y-6">
            <h1 className="text-[#042954] dark:text-whitexl font-bold text-[#042954] dark:text-white">Attestations à Valider</h1>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700/50 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-slate-700/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-[#042954] dark:text-white">Liste des Attestations de Présence</h2>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-gray-400 dark:text-slate-500" />
                            <select 
                                value={statutFilter}
                                onChange={(e) => setStatutFilter(e.target.value)}
                                className="border border-gray-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffa000] bg-gray-50 dark:bg-slate-800/50"
                            >
                                <option value="Tous">Tous les statuts</option>
                                <option value="EN_ATTENTE">En Attente</option>
                                <option value="VALIDEE">Validée</option>
                                <option value="REJETEE">Rejetée</option>
                            </select>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Rechercher un étudiant..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800/50 border border-gray-200 dark:border-slate-700/50 dark:text-slate-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffa000] focus:border-transparent transition-shadow text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse hidden md:table">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-800/50 text-gray-500 dark:text-slate-400 border-b border-gray-200 dark:border-slate-700/50 text-sm">
                                <th className="p-4 font-semibold">Étudiant</th>
                                <th className="p-4 font-semibold">Matricule</th>
                                <th className="p-4 font-semibold">Matière</th>
                                <th className="p-4 font-semibold">Date Demande</th>
                                <th className="p-4 font-semibold min-w-[200px]">Motif</th>
                                <th className="p-4 font-semibold">Mon Statut</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-slate-400 flex justify-center items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-[#042954] border-t-transparent rounded-full animate-spin"></div>
                                        Chargement en cours...
                                    </td>
                                </tr>
                            ) : filteredDocuments.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-slate-400">Aucune attestation à valider.</td>
                                </tr>
                            ) : (
                                filteredDocuments.map((doc) => (
                                    <tr key={doc.id} className="border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50/50 dark:bg-slate-800/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-semibold text-sm text-[#042954] dark:text-white flex gap-2 items-center">
                                                <FileText size={16} className="text-[#ffa000]" />
                                                {doc.etudiantNom} {doc.etudiantPrenom}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold tracking-wide">
                                                {doc.etudiantMatricule || "-"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-slate-300">
                                            {doc.matiereNom || "-"}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-slate-300">
                                            {formatDate(doc.createdAt)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-slate-300 max-w-sm truncate" title={doc.motif}>
                                            {doc.motif || "-"}
                                        </td>
                                        <td className="p-4">
                                            {getStatutBadge(normalizeTeacherStatus(doc))}
                                        </td>
                                        <td className="p-4 flex items-center justify-end gap-2">
                                            {normalizeTeacherStatus(doc) === 'EN_ATTENTE' && (
                                                <>
                                                    <button
                                                        onClick={() => openValidationModal(doc, "valider")}
                                                        title="Valider"
                                                        aria-label="Valider"
                                                        className="h-9 w-9 text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors flex items-center justify-center font-medium shadow-sm"
                                                    >
                                                        <CheckCircle size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => openValidationModal(doc, "rejeter")}
                                                        title="Rejeter"
                                                        aria-label="Rejeter"
                                                        className="h-9 w-9 text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors flex items-center justify-center font-medium shadow-sm"
                                                    >
                                                        <XCircle size={18} />
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>

                    {/* Mobile version (Cards) */}
                    <div className="grid grid-cols-1 gap-4 p-4 md:hidden bg-gray-50 dark:bg-slate-800/50/30">
                        {isLoading ? (
                            <div className="p-8 text-center text-gray-500 dark:text-slate-400 flex justify-center items-center gap-2">
                                <div className="w-5 h-5 border-2 border-[#042954] border-t-transparent rounded-full animate-spin"></div>
                                Chargement en cours...
                            </div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">Aucune attestation à valider.</div>
                        ) : (
                            filteredDocuments.map((doc) => (
                                <div key={doc.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 relative flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText size={16} className="text-[#ffa000]" />
                                                <span className="font-bold text-[#333333] dark:text-slate-100 text-lg">{doc.etudiantNom} {doc.etudiantPrenom}</span>
                                            </div>
                                            <div className="font-semibold text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded inline-block">
                                                {doc.etudiantMatricule || "-"}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            {getStatutBadge(normalizeTeacherStatus(doc))}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700 text-sm">
                                        <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-slate-700">
                                            <span className="text-gray-500 dark:text-slate-400">Matière</span>
                                            <span className="font-medium text-gray-700 text-right">{doc.matiereNom || "-"}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-slate-700">
                                            <span className="text-gray-500 dark:text-slate-400">Demande du</span>
                                            <span className="font-medium text-gray-700 text-right">{formatDate(doc.createdAt)}</span>
                                        </div>
                                        <div>
                                            <span className="block text-gray-500 dark:text-slate-400 text-xs mb-1 mt-1">Motif</span>
                                            <div className="bg-gray-100 p-2 rounded text-xs text-gray-700">
                                                {doc.motif || "Aucun motif précisé"}
                                            </div>
                                        </div>
                                    </div>

                                    {normalizeTeacherStatus(doc) === 'EN_ATTENTE' && (
                                        <div className="flex justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                                            <button
                                                onClick={() => openValidationModal(doc, "valider")}
                                                title="Valider"
                                                aria-label="Valider"
                                                className="h-10 w-10 text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors flex items-center justify-center font-medium shadow-sm"
                                            >
                                                <CheckCircle size={18} />
                                            </button>
                                            <button
                                                onClick={() => openValidationModal(doc, "rejeter")}
                                                title="Rejeter"
                                                aria-label="Rejeter"
                                                className="h-10 w-10 text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors flex items-center justify-center font-medium shadow-sm"
                                            >
                                                <XCircle size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Validation */}
            {isValidationModalOpen && currentDoc && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-slate-700/50 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                            <h2 className="text-lg font-bold text-[#042954] dark:text-white">
                                {validationAction === "valider" ? "Valider la présence" : "Rejeter la présence"}
                            </h2>
                            <button onClick={() => setIsValidationModalOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-300 transition">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleValidationSubmit} className="p-6 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-slate-300">
                                Êtes-vous sûr de vouloir <strong className={validationAction === "valider" ? "text-green-600" : "text-red-600"}>
                                    {validationAction === "valider" ? "valider" : "rejeter"}
                                </strong> l'attestation de présence pour l'étudiant <strong>{currentDoc.etudiantNom} {currentDoc.etudiantPrenom}</strong> ?
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire (Optionnel)</label>
                                <textarea 
                                    rows={4}
                                    placeholder="Ajouter un commentaire..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                    value={commentaire}
                                    onChange={e => setCommentaire(e.target.value)}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsValidationModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className={`px-4 py-2 text-white rounded-lg font-medium transition items-center gap-2 flex ${
                                        validationAction === "valider" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                                    }`}
                                >
                                    {validationAction === "valider" ? <><Check size={18} /> Confirmer Validation</> : <><X size={18} /> Confirmer Rejet</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
