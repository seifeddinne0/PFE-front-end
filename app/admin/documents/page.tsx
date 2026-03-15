"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Trash2, CheckCircle, XCircle, Download, FileText, Check, X, Clock, Send, FileCheck, Filter } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Utilisateur {
    id: number;
    nom: string;
    prenom: string;
    matricule?: string;
}

interface Validateur {
    enseignantNom: string;
    enseignantPrenom: string;
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
}

interface DocumentStats {
    enAttente: number;
    enCoursValidation: number;
    validees: number;
    rejetees: number;
    envoyees: number;
}

export default function AdminDocumentsPage() {
    const [documents, setDocuments] = useState<DocumentDemande[]>([]);
    const [stats, setStats] = useState<DocumentStats>({ enAttente: 0, enCoursValidation: 0, validees: 0, rejetees: 0, envoyees: 0 });
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
            const data = await api.get("/api/admin/documents");
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

    const fetchStats = async () => {
        try {
            const data = await api.get("/api/admin/documents/stats");
            if (data) setStats(data);
        } catch (error: any) {
            console.error("Erreur stats documents", error);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        await Promise.all([fetchDocuments(), fetchStats()]);
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
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette demande ?")) return;
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
            
            if (statut === 'VALIDEE') {
                // Si la demande était VALIDEE, on l'envoie (passe à ENVOYEE)
                await api.patch(`/api/admin/documents/${id}/envoyer`, {});
                toast.success("Document envoyé à l'étudiant !");
                loadData();
            }
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du téléchargement du PDF");
        }
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
        switch (statut) {
            case 'EN_ATTENTE': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">EN ATTENTE</span>;
            case 'EN_COURS_VALIDATION': return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">EN COURS VALIDATION</span>;
            case 'VALIDEE': return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">VALIDÉE</span>;
            case 'REJETEE': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">REJETÉE</span>;
            case 'ENVOYEE': return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">ENVOYÉE</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">{statut}</span>;
        }
    };

    const filteredDocuments = documents.filter(d => {
        const matchesSearch = 
            (`${d.etudiantNom || ''} ${d.etudiantPrenom || ''}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (d.etudiantMatricule?.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatut = statutFilter === "Tous" || d.statut === statutFilter;
        return matchesSearch && matchesStatut;
    });

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#042954]">Demandes de Documents</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">En Attente</p>
                        <h3 className="text-2xl font-bold text-orange-600 mt-1">{stats.enAttente}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                        <Clock size={20} />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium leading-tight">En cours<br/>validation</p>
                        <h3 className="text-2xl font-bold text-blue-600 mt-1">{stats.enCoursValidation}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <FileText size={20} />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Validées</p>
                        <h3 className="text-2xl font-bold text-green-600 mt-1">{stats.validees}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <CheckCircle size={20} />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Rejetées</p>
                        <h3 className="text-2xl font-bold text-red-600 mt-1">{stats.rejetees}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                        <XCircle size={20} />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Envoyées</p>
                        <h3 className="text-2xl font-bold text-gray-600 mt-1">{stats.envoyees}</h3>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
                        <Send size={20} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-[#042954]">Liste des Demandes</h2>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-gray-400" />
                            <select 
                                value={statutFilter}
                                onChange={(e) => setStatutFilter(e.target.value)}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffa000] bg-gray-50"
                            >
                                <option value="Tous">Tous les statuts</option>
                                <option value="EN_ATTENTE">En Attente</option>
                                <option value="EN_COURS_VALIDATION">En Cours Validation</option>
                                <option value="VALIDEE">Validée</option>
                                <option value="REJETEE">Rejetée</option>
                                <option value="ENVOYEE">Envoyée</option>
                            </select>
                        </div>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Étudiant, Matricule..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffa000] transition-shadow text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse hidden md:table">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-sm">
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
                                    <td colSpan={8} className="p-8 text-center text-gray-500">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-[#042954] border-t-transparent rounded-full animate-spin"></div>
                                            Chargement en cours...
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredDocuments.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">Aucune demande trouvée.</td>
                                </tr>
                            ) : (
                                filteredDocuments.map((doc) => (
                                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <span className="font-bold text-gray-500 text-sm">#{doc.id}</span>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-sm text-[#042954]">
                                                {doc.etudiantNom} {doc.etudiantPrenom}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold tracking-wide">
                                                {doc.etudiantMatricule || "-"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm font-medium text-gray-800">
                                            {getTypeLabel(doc.typeDocument)}
                                        </td>
                                        <td className="p-4">
                                            {getStatutBadge(doc.statut)}
                                        </td>
                                        <td className="p-4 text-xs text-gray-600">
                                            {doc.typeDocument === "ATTESTATION_PRESENCE" && doc.validateurs && doc.validateurs.length > 0 ? (
                                                <ul className="space-y-1">
                                                    {doc.validateurs.map((v, idx) => (
                                                        <li key={idx} className="flex items-center gap-1">
                                                            <span className={
                                                                v.statut === "VALIDEE" ? "text-green-600 font-bold" :
                                                                v.statut === "REJETEE" ? "text-red-600 font-bold" :
                                                                "text-orange-600"
                                                            }>•</span>
                                                            {v.enseignantPrenom} {v.enseignantNom}
                                                        </li>
                                                    ))}
                                                </ul>
                                            ) : (
                                                <span className="text-gray-400">-</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
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
                                            {doc.statut === 'VALIDEE' && (
                                                <button
                                                    onClick={() => handleDownloadPdf(doc.id, doc.statut, `document_${doc.id}.pdf`)}
                                                    className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1 font-medium shadow-sm"
                                                >
                                                    <Download size={14} /> Générer PDF
                                                </button>
                                            )}
                                            {doc.statut === 'ENVOYEE' && (
                                                <button
                                                    onClick={() => handleDownloadPdf(doc.id, doc.statut, `document_${doc.id}.pdf`)}
                                                    className="px-3 py-1.5 text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors flex items-center gap-1 font-medium shadow-sm"
                                                >
                                                    <Download size={14} /> PDF
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(doc.id)}
                                                className="p-1.5 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors cursor-pointer ml-1"
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
                            <div className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
                                <div className="w-5 h-5 border-2 border-[#042954] border-t-transparent rounded-full animate-spin"></div>
                                Chargement en cours...
                            </div>
                        ) : filteredDocuments.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">Aucune demande trouvée.</div>
                        ) : (
                            filteredDocuments.map((doc) => (
                                <div key={doc.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="font-semibold text-sm text-[#042954]">
                                            {doc.etudiantNom} {doc.etudiantPrenom}
                                        </div>
                                        <div>{getStatutBadge(doc.statut)}</div>
                                    </div>

                                    <div className="space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                        <div className="text-xs text-gray-500 flex justify-between">
                                            <span>Matricule: <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded ml-1">{doc.etudiantMatricule || "-"}</span></span>
                                            <span>#{doc.id}</span>
                                        </div>
                                        <div className="font-bold text-sm text-gray-800 mt-2">{getTypeLabel(doc.typeDocument)}</div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                                            <Clock size={12} />
                                            {formatDate(doc.createdAt)}
                                        </div>
                                        
                                        {doc.typeDocument === "ATTESTATION_PRESENCE" && doc.validateurs && doc.validateurs.length > 0 && (
                                            <div className="mt-3 pt-2 border-t border-gray-200">
                                                <div className="font-semibold mb-1 text-xs text-gray-500">Validateurs:</div>
                                                <ul className="space-y-1 text-xs text-gray-600">
                                                    {doc.validateurs.map((v, idx) => (
                                                        <li key={idx} className="flex items-center gap-1">
                                                            <span className={v.statut === "VALIDEE" ? "text-green-600 font-bold" : v.statut === "REJETEE" ? "text-red-600 font-bold" : "text-orange-600"}>•</span>
                                                            {v.enseignantPrenom} {v.enseignantNom}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-gray-100 mt-1">
                                        {doc.statut === 'EN_ATTENTE' && (
                                            <div className="flex w-full gap-2 mb-2">
                                                <button onClick={() => openValidationModal(doc, "valider")} className="flex-1 px-3 py-2 text-sm text-white bg-green-500 hover:bg-green-600 rounded-md transition-colors flex items-center justify-center gap-1 font-medium shadow-sm"><Check size={16} /> Valider</button>
                                                <button onClick={() => openValidationModal(doc, "rejeter")} className="flex-1 px-3 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors flex items-center justify-center gap-1 font-medium shadow-sm"><X size={16} /> Rejeter</button>
                                            </div>
                                        )}
                                        {doc.statut === 'VALIDEE' && (
                                            <button onClick={() => handleDownloadPdf(doc.id, doc.statut, `document_${doc.id}.pdf`)} className="px-3 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center gap-1 font-medium shadow-sm mr-auto"><Download size={14} /> PDF</button>
                                        )}
                                        {doc.statut === 'ENVOYEE' && (
                                            <button onClick={() => handleDownloadPdf(doc.id, doc.statut, `document_${doc.id}.pdf`)} className="px-3 py-2 text-sm text-gray-700 bg-gray-200 hover:bg-gray-300 rounded-md transition-colors flex items-center justify-center gap-1 font-medium shadow-sm mr-auto"><Download size={14} /> PDF</button>
                                        )}
                                        <button onClick={() => handleDelete(doc.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded transition-colors" title="Supprimer"><Trash2 size={16} /></button>
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
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h2 className="text-lg font-bold text-[#042954]">
                                {validationAction === "valider" ? "Valider la demande" : "Rejeter la demande"}
                            </h2>
                            <button onClick={() => setIsValidationModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleValidationSubmit} className="p-6 space-y-4">
                            <p className="text-sm text-gray-600">
                                Êtes-vous sûr de vouloir <strong className={validationAction === "valider" ? "text-green-600" : "text-red-600"}>
                                    {validationAction === "valider" ? "valider" : "rejeter"}
                                </strong> la demande de type <strong>{getTypeLabel(currentDoc.typeDocument)}</strong> pour l'étudiant <strong>{currentDoc.etudiantNom} {currentDoc.etudiantPrenom}</strong> ?
                            </p>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Commentaire (Optionnel)</label>
                                <textarea 
                                    rows={4}
                                    placeholder="Ajouter un commentaire..."
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
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
