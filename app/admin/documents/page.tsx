"use client";

import { useEffect, useState } from "react";
import { Search, Trash2, CheckCircle, XCircle, Download, FileText, Check, X, Clock, Filter } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/ConfirmProvider";

interface Utilisateur {
    id: number;
    nom: string;
    prenom: string;
    matricule?: string;
}

interface Validateur {
    nom: string;
    prenom: string;
    statut: string;
}

interface DocumentDemande {
    id: number;
    typeDocument: string;
    statut: string;
    createdAt: string;
    validateurs?: Validateur[];
    motif?: string;
    etudiantNom?: string;
    etudiantPrenom?: string;
    etudiantMatricule?: string;
    nomEntrepriseStage?: string;
    adresseEntreprise?: string;
    nomEncadrant?: string;
}

interface DocumentStats {
    enAttente: number;
    validees: number;
    rejetees: number;
}

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState<DocumentDemande[]>([]);
    const [stats, setStats] = useState<DocumentStats>({ enAttente: 0, validees: 0, rejetees: 0 });
    const [documentConfigs, setDocumentConfigs] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    // Filtres et Recherche
    const [searchTerm, setSearchTerm] = useState("");
    const [statutFilter, setStatutFilter] = useState("Tous");
    
    // Modals
    const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);
    const [currentDoc, setCurrentDoc] = useState<DocumentDemande | null>(null);
    const [validationAction, setValidationAction] = useState<"valider" | "rejeter">("valider");
    const [commentaire, setCommentaire] = useState("");

    const { confirm } = useConfirm();

    const fetchDocuments = async () => {
        try {
            const data = await api.get("/api/admin/documents?page=0&size=1000");
            if (Array.isArray(data)) {
                setDocuments(data);
                setStats(computeStats(data));
            } else if (data && Array.isArray(data.content)) {
                setDocuments(data.content);
                setStats(computeStats(data.content));
            }
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du chargement des documents.");
        }
    };

    const fetchConfigs = async () => {
        try {
            const data = await api.get("/api/admin/document-configs");
            setDocumentConfigs(data);
        } catch (error: any) {
            console.error("Erreur configs", error);
        }
    };

    const handleToggleConfig = async (id: number) => {
        try {
            await api.patch(`/api/admin/document-configs/${id}/toggle`, {});
            toast.success("Paramètre mis à jour");
            fetchConfigs();
        } catch (error: any) {
            toast.error("Erreur lors de la mise à jour");
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        await Promise.all([fetchDocuments(), fetchConfigs()]);
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

    const handleDelete = async (id: number) => {
        const isConfirmed = await confirm({
            title: "Supprimer le document",
            message: "Voulez-vous vraiment supprimer cette demande de document ?",
            confirmText: "Supprimer",
            variant: "danger"
        });
        if (!isConfirmed) return;
        try {
            await api.delete(`/api/admin/documents/${id}`);
            toast.success("Demande supprimée!");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Erreur de suppression.");
        }
    };

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
            await api.patch(`/api/admin/documents/${currentDoc.id}/valider`, payload);
            toast.success(`Demande ${validationAction === "valider" ? "validée" : "rejetée"} avec succès!`);
            setIsValidationModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'opération.");
        }
    };

    const handleDownloadPdf = async (id: number, statut: string, filename: string) => {
        try {
            const token = sessionStorage.getItem("token") || localStorage.getItem("token");
            const response = await fetch(`http://localhost:8080/api/admin/documents/${id}/pdf`, { 
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Erreur de téléchargement");
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            a.click();
            window.URL.revokeObjectURL(url);

            toast.success(statut === 'VALIDEE' ? "PDF généré avec succès." : "PDF téléchargé.");
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du téléchargement du PDF");
        }
    };

    const normalizeStatut = (statut: string) => {
        if (statut === "ENVOYEE") return "VALIDEE";
        if (statut === "EN_COURS_VALIDATION") return "EN_ATTENTE";
        return statut;
    };

    const computeStats = (items: DocumentDemande[]): DocumentStats => {
        const computed: DocumentStats = { enAttente: 0, validees: 0, rejetees: 0 };
        items.forEach((doc) => {
            const normalized = normalizeStatut(doc.statut);
            if (normalized === "EN_ATTENTE") computed.enAttente++;
            else if (normalized === "VALIDEE") computed.validees++;
            else if (normalized === "REJETEE") computed.rejetees++;
        });
        return computed;
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getTypeLabel = (type: string) => {
        const labels: Record<string, string> = {
            "ATTESTATION_PRESENCE": "Attestation de Présence",
            "RELEVE_NOTES": "Relevé de Notes",
            "FACTURE_PAIEMENT": "Facture de Paiement",
            "DEMANDE_STAGE": "Demande de Stage",
            "VALIDATION_STAGE": "Validation de Stage",
            "ATTESTATION_REUSSITE": "Attestation de Réussite",
            "ATTESTATION_AFFECTATION": "Attestation d'Affectation"
        };
        return labels[type] || type;
    };

    const getStatutBadge = (statut: string) => {
        const normalized = normalizeStatut(statut);
        switch (normalized) {
            case 'EN_ATTENTE': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">EN ATTENTE</span>;
            case 'VALIDEE': return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">VALIDÉE</span>;
            case 'REJETEE': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">REJETÉE</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">{normalized}</span>;
        }
    };

    const filteredDocuments = documents.filter(d => {
        const matchesSearch = 
            (`${d.etudiantNom || ''} ${d.etudiantPrenom || ''}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (d.etudiantMatricule?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatut = statutFilter === "Tous" || normalizeStatut(d.statut) === statutFilter;
        return matchesSearch && matchesStatut;
    });

    return (
        <div className="space-y-6">
            <h1 className="text-[#042954] dark:text-whitexl font-bold text-[#042954] dark:text-white">Demandes de Documents</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
                <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-100 dark:border-zinc-800/50 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium">En Attente</p>
                        <h3 className="text-xl font-bold text-orange-600 dark:text-orange-500 mt-1">{stats.enAttente}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <Clock size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-100 dark:border-zinc-800/50 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium">Validées</p>
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-500 mt-1">{stats.validees}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                        <CheckCircle size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-100 dark:border-zinc-800/50 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium">Rejetées</p>
                        <h3 className="text-xl font-bold text-red-600 dark:text-red-500 mt-1">{stats.rejetees}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                        <XCircle size={24} />
                    </div>
                </div>
            </div>

            {/* Document Access Management */}
            <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-100 dark:border-zinc-800/50 shadow-sm overflow-hidden mb-6">
                <div className="p-4 border-b border-gray-100 dark:border-zinc-800/50 bg-gray-50/50 dark:bg-zinc-900/50">
                    <h2 className="text-sm font-bold text-[#042954] dark:text-[#ffa000] uppercase tracking-wider">Gestion des Accès Étudiants</h2>
                </div>
                <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documentConfigs.map(config => (
                        <div key={config.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 dark:border-zinc-800 bg-gray-50/30 dark:bg-zinc-900/30">
                            <div>
                                <p className="text-sm font-bold text-gray-800 dark:text-zinc-200">{getTypeLabel(config.typeDocument)}</p>
                            </div>
                            <button
                                onClick={() => handleToggleConfig(config.id)}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                    config.enabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-zinc-700'
                                }`}
                            >
                                <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                        config.enabled ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-[#042954] dark:text-white">Liste des Demandes</h2>

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
                                placeholder="Étudiant, Matricule..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-zinc-800 dark:text-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffa000] focus:border-transparent transition-shadow text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse hidden md:table">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800/50 text-sm">
                                <th className="p-4 font-semibold">ID</th>
                                <th className="p-4 font-semibold">Étudiant</th>
                                <th className="p-4 font-semibold">Matricule</th>
                                <th className="p-4 font-semibold">Type Document</th>
                                <th className="p-4 font-semibold">Statut</th>
                                <th className="p-4 font-semibold">Validateurs</th>
                                <th className="p-4 font-semibold">Date Demande</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-slate-400">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-[#042954] border-t-transparent rounded-full animate-spin"></div>
                                            Chargement en cours...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredDocuments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500 dark:text-slate-400">Aucune demande trouvée.</td>
                                </tr>
                            ) : (
                                filteredDocuments.map((doc) => (
                                    <tr key={doc.id} className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-[#151515] transition-colors dark:text-zinc-300">
                                        <td className="p-4">
                                            <span className="font-bold text-gray-500 dark:text-zinc-500 text-sm">#{doc.id}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-bold text-[#333333] dark:text-zinc-100">{doc.etudiantNom} {doc.etudiantPrenom}</div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold tracking-wide">
                                                {doc.etudiantMatricule || "-"}
                                            </span>
                                        </td>

                                        <td className="p-4 text-sm font-medium text-gray-800 dark:text-zinc-300">
                                            {getTypeLabel(doc.typeDocument)}
                                        </td>
                                        <td className="p-4">
                                            {getStatutBadge(doc.statut)}
                                        </td>
                                        <td className="p-4 text-xs text-gray-600 dark:text-slate-300">
                                            {doc.typeDocument === "ATTESTATION_PRESENCE" && doc.validateurs && doc.validateurs.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {doc.validateurs.map((v, idx) => (
                                                        <li key={idx} className="flex items-center gap-1">
                                                            <span className={
                                                                v.statut === "VALIDEE" ? "text-green-600 font-bold" :
                                                                v.statut === "REJETEE" ? "text-red-600 font-bold" :
                                                                "text-orange-600"
                                                            }>•</span>
                                                            {v.prenom} {v.nom}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-gray-400 dark:text-slate-500">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-zinc-300">
                                            {formatDate(doc.createdAt)}
                                        </td>
                                        <td className="p-4 flex items-center justify-end gap-2">
                                            {doc.statut === 'EN_ATTENTE' && (
                                                <>
                                                    <button
                                                        onClick={() => openValidationModal(doc, "valider")}
                                                        className="px-3 py-1.5 text-sm text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors flex items-center gap-1 font-medium shadow-sm"
                                                    >
                                                        <Check size={14} /> Valider
                                                    </button>
                                                    <button
                                                        onClick={() => openValidationModal(doc, "rejeter")}
                                                        className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors flex items-center gap-1 font-medium shadow-sm"
                                                    >
                                                        <X size={14} /> Rejeter
                                                    </button>
                                                </>
                                            )}
                                            {(doc.statut === 'VALIDEE' || doc.statut === 'ENVOYEE') && (
                                                <button
                                                    onClick={() => handleDownloadPdf(doc.id, doc.statut, `document_${doc.id}.pdf`)}
                                                    className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1 font-medium shadow-sm"
                                                >
                                                    <Download size={14} /> Générer PDF
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded transition-colors cursor-pointer ml-1"
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
                            <div className="p-8 text-center text-gray-500 dark:text-slate-400 flex justify-center items-center gap-2">
                                <div className="w-5 h-5 border-2 border-[#042954] border-t-transparent rounded-full animate-spin"></div>
                                Chargement en cours...
                            </div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">Aucune demande trouvée.</div>
                        ) : (
                            filteredDocuments.map((doc) => (
                                <div key={doc.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm relative flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="font-semibold text-sm text-[#042954] dark:text-white">
                                            {doc.etudiantNom} {doc.etudiantPrenom}
                                        </div>
                                        <div>{getStatutBadge(doc.statut)}</div>
                                    </div>

                                    <div className="space-y-1 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700">
                                        <div className="text-xs text-gray-500 dark:text-slate-400 flex justify-between">
                                            <span>Matricule: <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded ml-1">{doc.etudiantMatricule || "-"}</span></span>
                                            <span>#{doc.id}</span>
                                        </div>
                                        <div className="font-bold text-sm text-gray-800 mt-2">{getTypeLabel(doc.typeDocument)}</div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-slate-400 mt-2">
                                            <Clock size={12} />
                                            {formatDate(doc.createdAt)}
                                        </div>
                                        
                                        {doc.typeDocument === "ATTESTATION_PRESENCE" && doc.validateurs && doc.validateurs.length > 0 && (
                                            <div className="mt-3 pt-2 border-t border-gray-200 dark:border-slate-700">
                                                <div className="font-semibold mb-1 text-xs text-gray-500 dark:text-slate-400">Validateurs:</div>
                                                <ul className="space-y-1 text-xs text-gray-600 dark:text-slate-300">
                                                    {doc.validateurs.map((v, idx) => (
                                                        <li key={idx} className="flex items-center gap-1">
                                                            <span className={v.statut === "VALIDEE" ? "text-green-600 font-bold" : v.statut === "REJETEE" ? "text-red-600 font-bold" : "text-orange-600"}>•</span>
                                                            {v.prenom} {v.nom}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-700 mt-1">
                                        {doc.statut === 'EN_ATTENTE' && (
                                            <div className="flex w-full gap-2 mb-2">
                                                <button onClick={() => openValidationModal(doc, "valider")} className="flex-1 px-3 py-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors flex items-center justify-center gap-1 font-medium shadow-sm"><Check size={16} /> Valider</button>
                                                <button onClick={() => openValidationModal(doc, "rejeter")} className="flex-1 px-3 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors flex items-center justify-center gap-1 font-medium shadow-sm"><X size={16} /> Rejeter</button>
                                            </div>
                                        )}
                                        {(doc.statut === 'VALIDEE' || doc.statut === 'ENVOYEE') && (
                                            <button onClick={() => handleDownloadPdf(doc.id, doc.statut, `document_${doc.id}.pdf`)} className="px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center gap-1 font-medium shadow-sm mr-auto"><Download size={14} /> PDF</button>
                                        )}
                                        <button onClick={() => handleDelete(doc.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 rounded transition-colors" title="Supprimer"><Trash2 size={16} /></button>
                                    </div>
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
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800/50 flex justify-between items-center bg-gray-50 dark:bg-slate-800/50">
                            <h2 className="text-lg font-bold text-[#042954] dark:text-white">
                                {validationAction === "valider" ? "Valider la demande" : "Rejeter la demande"}
                            </h2>
                            <button onClick={() => setIsValidationModalOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-300 transition">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleValidationSubmit} className="p-6 space-y-4">
                            <p className="text-sm text-gray-600 dark:text-slate-300">
                                Êtes-vous sûr de vouloir <strong className={validationAction === "valider" ? "text-green-600" : "text-red-600"}>
                                    {validationAction === "valider" ? "valider" : "rejeter"}
                                </strong> la demande de type <strong>{getTypeLabel(currentDoc.typeDocument)}</strong> pour l'étudiant <strong>{currentDoc.etudiantNom} {currentDoc.etudiantPrenom}</strong> ?
                            </p>

                            {(currentDoc.typeDocument === "DEMANDE_STAGE" || currentDoc.typeDocument === "VALIDATION_STAGE") && (
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg space-y-2 text-sm border border-blue-100 dark:border-blue-800/30">
                                    <h3 className="font-bold text-blue-800 dark:text-blue-300 mb-1 flex items-center gap-2">
                                        Détails du Stage
                                    </h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-gray-500 dark:text-slate-400 block text-[10px] uppercase">Entreprise</span>
                                            <span className="font-semibold text-gray-800 dark:text-slate-200">{currentDoc.nomEntrepriseStage || "-"}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 dark:text-slate-400 block text-[10px] uppercase">Encadrant</span>
                                            <span className="font-semibold text-gray-800 dark:text-slate-200">{currentDoc.nomEncadrant || "-"}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500 dark:text-slate-400 block text-[10px] uppercase">Adresse</span>
                                            <span className="font-semibold text-gray-800 dark:text-slate-200">{currentDoc.adresseEntreprise || "-"}</span>
                                        </div>
                                        <div className="col-span-2">
                                            <span className="text-gray-500 dark:text-slate-400 block text-[10px] uppercase">Motif / Sujet</span>
                                            <span className="font-semibold text-gray-800 dark:text-slate-200">{currentDoc.motif || "-"}</span>
                                        </div>
                                    </div>
                                </div>
                            )}
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
