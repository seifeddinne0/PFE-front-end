"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Download, FileText, FileBadge, CheckCircle, Clock, Send, ChevronRight, Briefcase, GraduationCap, XCircle, Building2, UserCircle2, Filter, Check } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Enseignant {
    id: number;
    nom: string;
    prenom: string;
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
    motif?: string;
    validateurs?: Validateur[];
}

interface DocumentStats {
    enAttente: number;
    enCoursValidation: number;
    validees: number;
    envoyees: number;
}

const DOCUMENT_TYPES = [
    { id: "ATTESTATION_PRESENCE", label: "Attestation de Présence", icon: <FileBadge size={24}/>, desc: "Demander une attestation signée par 2 enseignants" },
    { id: "RELEVE_NOTES", label: "Relevé de Notes", icon: <GraduationCap size={24}/>, desc: "Obtenir votre relevé de notes officiel" },
    { id: "FACTURE_PAIEMENT", label: "Facture de Paiement", icon: <FileText size={24}/>, desc: "Facture pour vos frais de scolarité" },
    { id: "DEMANDE_STAGE", label: "Demande de Stage", icon: <Briefcase size={24}/>, desc: "Initier une procédure de stage" },
    { id: "VALIDATION_STAGE", label: "Validation de Stage", icon: <CheckCircle size={24}/>, desc: "Faire valider votre stage par l'administration" },
    { id: "ATTESTATION_REUSSITE", label: "Attestation de Réussite", icon: <GraduationCap size={24}/>, desc: "Certificat de réussite" },
    { id: "ATTESTATION_AFFECTATION", label: "Attestation d'Affectation", icon: <Building2 size={24}/>, desc: "Certificat d'affectation" },
];

export default function EtudiantDocumentsPage() {
    const [documents, setDocuments] = useState<DocumentDemande[]>([]);
    const [stats, setStats] = useState<DocumentStats>({ enAttente: 0, enCoursValidation: 0, validees: 0, envoyees: 0 });
    const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // Filtre
    const [statutFilter, setStatutFilter] = useState("Tous");
    
    // Create Modal States
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [createStep, setCreateStep] = useState<1 | 2>(1);
    const [selectedType, setSelectedType] = useState<string>("");
    
    // Form States
    const [motif, setMotif] = useState("");
    const [selectedEnseignants, setSelectedEnseignants] = useState<number[]>([]);
    const [nomEntreprise, setNomEntreprise] = useState("");
    const [adresseEntreprise, setAdresseEntreprise] = useState("");
    const [nomEncadrant, setNomEncadrant] = useState("");

    const fetchDocuments = async () => {
        try {
            const data = await api.get("/api/etudiant/documents");
            if (Array.isArray(data)) {
                setDocuments(data);
                
                // Calculer les stats localement si pas d'API /stats pour l'étudiant
                const initialStats = { enAttente: 0, enCoursValidation: 0, validees: 0, envoyees: 0 };
                data.forEach(doc => {
                    if (doc.statut === 'EN_ATTENTE') initialStats.enAttente++;
                    else if (doc.statut === 'EN_COURS_VALIDATION') initialStats.enCoursValidation++;
                    else if (doc.statut === 'VALIDEE') initialStats.validees++;
                    else if (doc.statut === 'ENVOYEE') initialStats.envoyees++;
                });
                setStats(initialStats);
            } else if (data && Array.isArray(data.content)) {
                setDocuments(data.content);
                // Calcul des stats
                const initialStats = { enAttente: 0, enCoursValidation: 0, validees: 0, envoyees: 0 };
                data.content.forEach((doc: any) => {
                    if (doc.statut === 'EN_ATTENTE') initialStats.enAttente++;
                    else if (doc.statut === 'EN_COURS_VALIDATION') initialStats.enCoursValidation++;
                    else if (doc.statut === 'VALIDEE') initialStats.validees++;
                    else if (doc.statut === 'ENVOYEE') initialStats.envoyees++;
                });
                setStats(initialStats);
            } else {
                setDocuments([]);
            }
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du chargement des documents.");
        }
    };

    const fetchEnseignants = async () => {
        try {
            // L'étudiant peut avoir besoin de fetch les enseignants pour l'attestation de présence
            const data = await api.get("/api/admin/enseignants"); // L'utilisateur a mentionné /api/admin/enseignants
            if (Array.isArray(data)) {
                setEnseignants(data);
            } else if (data && Array.isArray(data.content)) {
                setEnseignants(data.content);
            }
        } catch (error) {
            console.error(error);
            // Ignorer l'erreur, l'API peut ne pas être accessible, on gèrera l'absence d'enseignants
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        await Promise.all([fetchDocuments(), fetchEnseignants()]);
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

    const handleCancelDocument = async (id: number) => {
        if (!window.confirm("Êtes-vous sûr de vouloir annuler cette demande ?")) return;
        try {
            // La demande indique PUT, DELETE ou PATCH selon l'API. Vous avez demandé "DELETE /api/admin/documents/{id}"
            await api.delete(`/api/admin/documents/${id}`);
            toast.success("Demande annulée avec succès!");
            loadData();
        } catch (error: any) {
            // Repli vers l'API etudiant si admin echoue
            try {
                await api.delete(`/api/etudiant/documents/${id}`);
                toast.success("Demande annulée avec succès!");
                loadData();
            } catch (fallbackError: any) {
                toast.error(error.message || "Erreur de suppression.");
            }
        }
    };

    const handleDownloadPdf = async (id: number, filename: string) => {
        try {
            const token = sessionStorage.getItem("token") || localStorage.getItem("token");
            const response = await fetch(`http://localhost:8080/api/etudiant/documents/${id}/pdf`, { 
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
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du téléchargement du PDF");
        }
    };

    const resetForm = () => {
        setCreateStep(1);
        setSelectedType("");
        setMotif("");
        setSelectedEnseignants([]);
        setNomEntreprise("");
        setAdresseEntreprise("");
        setNomEncadrant("");
    };

    const openCreateModal = () => {
        resetForm();
        setIsCreateModalOpen(true);
    };

    const handleNextStep = (typeId: string) => {
        setSelectedType(typeId);
        setCreateStep(2);
    };

    const toggleEnseignantSelection = (id: number) => {
        if (selectedEnseignants.includes(id)) {
            setSelectedEnseignants(selectedEnseignants.filter(eId => eId !== id));
        } else {
            if (selectedEnseignants.length < 2) {
                setSelectedEnseignants([...selectedEnseignants, id]);
            } else {
                toast.error("Vous ne pouvez sélectionner que 2 enseignants maximum.");
            }
        }
    };

    const handleSubmitCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (selectedType === "ATTESTATION_PRESENCE" && selectedEnseignants.length !== 2) {
                toast.error("Veuillez sélectionner exactement 2 enseignants.");
                return;
            }

            const payload: any = { type: selectedType, motif };

            if (selectedType === "ATTESTATION_PRESENCE") {
                payload.enseignantsIds = selectedEnseignants;
            } else if (selectedType === "DEMANDE_STAGE" || selectedType === "VALIDATION_STAGE") {
                payload.nomEntreprise = nomEntreprise;
                payload.adresseEntreprise = adresseEntreprise;
                payload.nomEncadrant = nomEncadrant;
            }

            await api.post("/api/etudiant/documents", payload);
            toast.success("Demande créée avec succès !");
            setIsCreateModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la création de la demande.");
        }
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getTypeLabel = (type: string) => {
        const found = DOCUMENT_TYPES.find(t => t.id === type);
        return found ? found.label : type;
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

    const getFilteredDocuments = () => {
        return documents.filter(d => {
            if (statutFilter === "Tous") return true;
            return d.statut === statutFilter;
        });
    };
    const filteredDocuments = getFilteredDocuments();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-bold text-[#042954]">Mes Documents</h1>
                <button
                    onClick={openCreateModal}
                    className="bg-[#ffa000] hover:bg-[#e69000] text-white font-semibold py-2 px-6 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap"
                >
                    <Plus size={18} />
                    Nouvelle Demande
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        <p className="text-gray-500 text-sm font-medium leading-tight">En cours</p>
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
                    <h2 className="text-xl font-bold text-[#042954]">Historique des Demandes</h2>
                    
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
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse hidden md:table">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-sm">
                                <th className="p-4 font-semibold">Type Document</th>
                                <th className="p-4 font-semibold">Statut</th>
                                <th className="p-4 font-semibold max-w-[200px]">Motif / Détails</th>
                                <th className="p-4 font-semibold">Validateurs</th>
                                <th className="p-4 font-semibold">Date</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-[#042954] border-t-transparent rounded-full animate-spin"></div>
                                        Chargement en cours...
                                    </td>
                                </tr>
                            ) : filteredDocuments.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500">Aucune demande trouvée avec ce filtre.</td>
                                </tr>
                            ) : (
                                filteredDocuments.map((doc) => (
                                    <tr key={doc.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-semibold text-sm text-[#042954] flex items-center gap-2">
                                                <FileText size={16} className="text-[#ffa000]" />
                                                {getTypeLabel(doc.typeDocument)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            {getStatutBadge(doc.statut)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 max-w-[200px] truncate" title={doc.motif}>
                                            {doc.motif || "-"}
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
                                            {(doc.statut === 'VALIDEE' || doc.statut === 'ENVOYEE') && (
                                                <button
                                                    onClick={() => handleDownloadPdf(doc.id, `${doc.typeDocument}_${doc.id}.pdf`)}
                                                    className="px-3 py-1.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1 font-medium shadow-sm"
                                                >
                                                    <Download size={14} /> Télécharger PDF
                                                </button>
                                            )}
                                            {doc.statut === 'EN_ATTENTE' && (
                                                <button
                                                    onClick={() => handleCancelDocument(doc.id)}
                                                    className="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors flex items-center gap-1 font-medium shadow-sm ml-1"
                                                >
                                                    <Trash2 size={14} /> Annuler
                                                </button>
                                            )}
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
                            <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">Aucune demande trouvée avec ce filtre.</div>
                        ) : (
                            filteredDocuments.map((doc) => (
                                <div key={doc.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 relative flex flex-col gap-3">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center gap-2 pr-4">
                                            <FileText size={20} className="text-[#ffa000] flex-shrink-0" />
                                            <span className="font-bold text-[#333333] text-base leading-tight">{getTypeLabel(doc.typeDocument)}</span>
                                        </div>
                                        <div className="flex-shrink-0">
                                            {getStatutBadge(doc.statut)}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 bg-gray-50 p-3 rounded-lg border border-gray-100 text-sm">
                                        <div className="flex justify-between items-center py-1 border-b border-gray-200">
                                            <span className="text-gray-500">Date</span>
                                            <span className="font-medium text-gray-700">{formatDate(doc.createdAt)}</span>
                                        </div>
                                        
                                        {doc.typeDocument === "ATTESTATION_PRESENCE" && doc.validateurs && doc.validateurs.length > 0 && (
                                            <div className="py-1 border-b border-gray-200">
                                                <span className="text-gray-500 block mb-1">Validateurs</span>
                                                <ul className="space-y-1 text-xs">
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
                                            </div>
                                        )}
                                        
                                        <div>
                                            <span className="block text-gray-500 text-xs mb-1">Motif / Détails</span>
                                            <div className="bg-gray-100 p-2 rounded text-xs text-gray-700 break-words">
                                                {doc.motif || "Aucun motif précisé"}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                        {(doc.statut === 'VALIDEE' || doc.statut === 'ENVOYEE') && (
                                            <button
                                                onClick={() => handleDownloadPdf(doc.id, `${doc.typeDocument}_${doc.id}.pdf`)}
                                                className="flex-1 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center justify-center gap-1 font-medium shadow-sm"
                                            >
                                                <Download size={16} /> PDF
                                            </button>
                                        )}
                                        {doc.statut === 'EN_ATTENTE' && (
                                            <button
                                                onClick={() => handleCancelDocument(doc.id)}
                                                className="flex-1 py-2 text-sm text-white bg-red-500 hover:bg-red-600 rounded-md transition-colors flex items-center justify-center gap-1 font-medium shadow-sm"
                                            >
                                                <Trash2 size={16} /> Annuler
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#042954] text-white">
                            <h2 className="text-xl font-bold flex items-center gap-2">
                                {createStep === 1 ? "Choisir le type de document" : "Détails de la demande"}
                            </h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-white/80 hover:text-white transition">
                                <XCircle size={26} />
                            </button>
                        </div>
                        
                        <div className="overflow-y-auto p-6 flex-grow bg-gray-50/50">
                            {createStep === 1 && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {DOCUMENT_TYPES.map(type => (
                                        <div 
                                            key={type.id}
                                            onClick={() => handleNextStep(type.id)}
                                            className="bg-white border-2 border-transparent hover:border-[#ffa000] p-5 rounded-xl cursor-pointer shadow-sm hover:shadow-md transition-all group flex items-start gap-4"
                                        >
                                            <div className="text-[#042954] group-hover:text-[#ffa000] transition-colors p-3 bg-blue-50 group-hover:bg-orange-50 rounded-lg">
                                                {type.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-[#042954] text-lg">{type.label}</h3>
                                                <p className="text-gray-500 text-sm mt-1">{type.desc}</p>
                                            </div>
                                            <div className="ml-auto mt-auto mb-auto text-gray-300 group-hover:text-[#ffa000]">
                                                <ChevronRight size={24} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {createStep === 2 && (
                                <form id="create-doc-form" onSubmit={handleSubmitCreate} className="space-y-6 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                                    <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-center gap-3 font-semibold mb-6">
                                        <span className="text-blue-500">{DOCUMENT_TYPES.find(t => t.id === selectedType)?.icon}</span>
                                        Déposer une demande de : {getTypeLabel(selectedType)}
                                    </div>

                                    {/* ATTESTATION_PRESENCE */}
                                    {selectedType === "ATTESTATION_PRESENCE" && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Sélectionner 2 enseignants pour la validation <span className="text-red-500">*</span>
                                                </label>
                                                {enseignants.length === 0 ? (
                                                    <p className="text-red-500 text-sm italic">Aucun enseignant disponible.</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                                                        {enseignants.map(ens => (
                                                            <div 
                                                                key={ens.id}
                                                                onClick={() => toggleEnseignantSelection(ens.id)}
                                                                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${
                                                                    selectedEnseignants.includes(ens.id) 
                                                                    ? 'bg-blue-50 border-blue-400 text-[#042954]' 
                                                                    : 'bg-white border-gray-200 hover:border-gray-300'
                                                                }`}
                                                            >
                                                                <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                                                                    selectedEnseignants.includes(ens.id) ? 'bg-[#ffa000] border-[#ffa000] text-white' : 'border-gray-300'
                                                                }`}>
                                                                    {selectedEnseignants.includes(ens.id) && <Check size={12} />}
                                                                </div>
                                                                <UserCircle2 size={18} className="text-gray-400" />
                                                                <span className="font-medium text-sm">{ens.nom} {ens.prenom}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {selectedEnseignants.length}/2 enseignants sélectionnés
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Motif de l'attestation</label>
                                                <textarea 
                                                    required
                                                    rows={3}
                                                    placeholder="Précisez la raison de votre demande..."
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000] resize-none"
                                                    value={motif}
                                                    onChange={e => setMotif(e.target.value)}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* DEMANDE_STAGE ou VALIDATION_STAGE */}
                                    {(selectedType === "DEMANDE_STAGE" || selectedType === "VALIDATION_STAGE") && (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise *</label>
                                                    <input 
                                                        type="text" required
                                                        placeholder="Ex: Tech Corp"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                                        value={nomEntreprise}
                                                        onChange={e => setNomEntreprise(e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'encadrant *</label>
                                                    <input 
                                                        type="text" required
                                                        placeholder="Ex: M. Dupont"
                                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                                        value={nomEncadrant}
                                                        onChange={e => setNomEncadrant(e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Adresse de l'entreprise *</label>
                                                <input 
                                                    type="text" required
                                                    placeholder="Adresse complète"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                                    value={adresseEntreprise}
                                                    onChange={e => setAdresseEntreprise(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">Motif / Sujet du stage *</label>
                                                <textarea 
                                                    required
                                                    rows={3}
                                                    placeholder="Décrivez brièvement le sujet ou les missions"
                                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000] resize-none"
                                                    value={motif}
                                                    onChange={e => setMotif(e.target.value)}
                                                />
                                            </div>
                                        </>
                                    )}

                                    {/* OTHERS */}
                                    {selectedType !== "ATTESTATION_PRESENCE" && selectedType !== "DEMANDE_STAGE" && selectedType !== "VALIDATION_STAGE" && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Motif (Optionnel)</label>
                                            <textarea 
                                                rows={4}
                                                placeholder="Saisir un motif si nécessaire..."
                                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000] resize-none"
                                                value={motif}
                                                onChange={e => setMotif(e.target.value)}
                                            />
                                        </div>
                                    )}
                                </form>
                            )}
                        </div>

                        <div className="p-4 border-t border-gray-100 flex justify-end gap-3 bg-white">
                            {createStep === 1 ? (
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                                >
                                    Fermer
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={() => setCreateStep(1)}
                                        className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition mr-auto"
                                    >
                                        Retour
                                    </button>
                                    <button
                                        onClick={() => setIsCreateModalOpen(false)}
                                        className="px-6 py-2.5 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                                    >
                                        Annuler
                                    </button>
                                    <button
                                        form="create-doc-form"
                                        type="submit"
                                        className="px-6 py-2.5 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition flex items-center gap-2"
                                    >
                                        <Send size={18} />
                                        Envoyer la demande
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
