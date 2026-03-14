"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, FileText, FileCheck, FileX, DollarSign, Download } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Etudiant {
    id: number;
    nom: string;
    prenom: string;
    matricule: string;
}

interface Facture {
    id: number;
    numero: string;
    etudiant: Etudiant;
    type: string;
    description?: string;
    montant: number;
    dateEcheance: string;
    datePaiement?: string;
    statut: string;
}

interface FactureStats {
    totalPayee: number;
    totalImpaye: number;
    countPayee: number;
    countNonPayee: number;
}

export default function AdminFacturesPage() {
    const [factures, setFactures] = useState<Facture[]>([]);
    const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
    const [stats, setStats] = useState<FactureStats>({ totalPayee: 0, totalImpaye: 0, countPayee: 0, countNonPayee: 0 });
    const [isLoading, setIsLoading] = useState(true);
    
    // Filtres et Recherche
    const [searchTerm, setSearchTerm] = useState("");
    const [statutFilter, setStatutFilter] = useState("Tous");
    
    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    
    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentFacture, setCurrentFacture] = useState<Facture | null>(null);

    // Form
    const [formData, setFormData] = useState({
        etudiantId: "",
        montant: "",
        type: "SCOLARITE",
        description: "",
        dateEcheance: ""
    });

    const fetchFactures = async () => {
        try {
            const data = await api.get("/api/admin/factures");
            if (Array.isArray(data)) {
                setFactures(data);
            } else if (data && Array.isArray(data.content)) {
                setFactures(data.content);
            } else {
                setFactures([]);
            }
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du chargement des factures.");
        }
    };

    const fetchStats = async () => {
        try {
            const data = await api.get("/api/admin/factures/stats");
            if (data) setStats(data);
        } catch (error: any) {
            console.error("Erreur stats factures", error);
        }
    };

    const fetchEtudiants = async () => {
        try {
            const data = await api.get("/api/admin/etudiants");
            if (Array.isArray(data)) {
                setEtudiants(data);
            } else if (data && Array.isArray(data.content)) {
                setEtudiants(data.content);
            }
        } catch (error: any) {
            console.error("Erreur lors du chargement des étudiants.", error);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        await Promise.all([fetchFactures(), fetchStats(), fetchEtudiants()]);
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
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette facture ?")) return;
        try {
            await api.delete(`/api/admin/factures/${id}`);
            toast.success("Facture supprimée!");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Erreur de suppression.");
        }
    };

    const handleMarkAsPaid = async (id: number) => {
        if (!window.confirm("Confirmer le paiement de cette facture ?")) return;
        try {
            await api.patch(`/api/admin/factures/${id}/payer`);
            toast.success("Facture marquée comme payée!");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la validation du paiement.");
        }
    };

    const handleCancel = async (id: number) => {
        if (!window.confirm("Confirmer l'annulation de cette facture ?")) return;
        try {
            await api.patch(`/api/admin/factures/${id}/annuler`);
            toast.success("Facture annulée!");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'annulation.");
        }
    };

    const handleSubmitCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                etudiant: { id: parseInt(formData.etudiantId) },
                montant: parseFloat(formData.montant),
                type: formData.type,
                description: formData.description,
                dateEcheance: formData.dateEcheance
            };
            const res = await api.post("/api/admin/factures", payload);
            toast.success(`Facture ${res.numero || 'créée'} avec succès!`);
            setIsCreateModalOpen(false);
            setFormData({ etudiantId: "", montant: "", type: "SCOLARITE", description: "", dateEcheance: "" });
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la création.");
        }
    };

    const handleSubmitEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentFacture) return;
        try {
            const payload = {
                etudiant: { id: parseInt(formData.etudiantId) },
                montant: parseFloat(formData.montant),
                type: formData.type,
                description: formData.description,
                dateEcheance: formData.dateEcheance
            };
            await api.put(`/api/admin/factures/${currentFacture.id}`, payload);
            toast.success("Facture mise à jour!");
            setIsEditModalOpen(false);
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la mise à jour.");
        }
    };

    const openEditModal = (f: Facture) => {
        setCurrentFacture(f);
        setFormData({
            etudiantId: f.etudiant && f.etudiant.id ? f.etudiant.id.toString() : "",
            montant: f.montant.toString(),
            type: f.type,
            description: f.description || "",
            dateEcheance: f.dateEcheance ? f.dateEcheance.substring(0, 10) : ""
        });
        setIsEditModalOpen(true);
    };

    const handleExportPdfAll = async () => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch('http://localhost:8080/api/admin/factures/export/pdf', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Erreur lors de l'exportation");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'factures.pdf';
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'exportation PDF");
        }
    };

    const handleExportPdfStudent = async (etudiantId: number, matricule: string) => {
        try {
            const token = localStorage.getItem("token");
            const response = await fetch(`http://localhost:8080/api/admin/factures/export/pdf/${etudiantId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error("Erreur lors de l'exportation");
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `factures-${matricule}.pdf`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'exportation PDF");
        }
    };

    // Formatters
    const formatMontant = (mnt?: number) => {
        if (mnt === undefined || mnt === null) return "0,00 DT";
        return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(mnt) + " DT";
    };

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return "-";
        return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const getStatutBadge = (statut: string) => {
        switch (statut) {
            case 'PAYEE': return <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold">PAYÉE</span>;
            case 'NON_PAYEE': return <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-bold">NON PAYÉE</span>;
            case 'EN_ATTENTE': return <span className="bg-orange-100 text-orange-700 px-2.5 py-1 rounded-full text-xs font-bold">EN ATTENTE</span>;
            case 'ANNULEE': return <span className="bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full text-xs font-bold">ANNULÉE</span>;
            default: return <span className="bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-bold">{statut}</span>;
        }
    };

    // Filters
    const filteredFactures = factures.filter(f => {
        const matchesSearch = 
            (f.numero && f.numero.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (f.etudiant && `${f.etudiant.nom} ${f.etudiant.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (f.etudiant && f.etudiant.matricule.toLowerCase().includes(searchTerm.toLowerCase()));
        
        const matchesStatut = statutFilter === "Tous" || f.statut === statutFilter;
        return matchesSearch && matchesStatut;
    });

    const totalPages = Math.ceil(filteredFactures.length / itemsPerPage);
    const paginatedFactures = filteredFactures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#042954]">Gestion des Factures</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Total Payé</p>
                        <h3 className="text-2xl font-bold text-green-600 mt-1">{formatMontant(stats.totalPayee)}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-50 flex items-center justify-center text-green-600">
                        <DollarSign size={24} />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Total Impayé</p>
                        <h3 className="text-2xl font-bold text-red-600 mt-1">{formatMontant(stats.totalImpaye)}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
                        <DollarSign size={24} />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Factures Payées</p>
                        <h3 className="text-2xl font-bold text-blue-600 mt-1">{stats.countPayee}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
                        <FileCheck size={24} />
                    </div>
                </div>
                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 text-sm font-medium">Factures Non Payées</p>
                        <h3 className="text-2xl font-bold text-orange-600 mt-1">{stats.countNonPayee}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-50 flex items-center justify-center text-orange-600">
                        <FileX size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-[#042954]">Liste des Factures</h2>

                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-gray-400" />
                            <select 
                                value={statutFilter}
                                onChange={(e) => { setStatutFilter(e.target.value); setCurrentPage(1); }}
                                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffa000] bg-gray-50"
                            >
                                <option value="Tous">Tous les statuts</option>
                                <option value="PAYEE">Payée</option>
                                <option value="NON_PAYEE">Non Payée</option>
                                <option value="EN_ATTENTE">En Attente</option>
                                <option value="ANNULEE">Annulée</option>
                            </select>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Numéro, Étudiant, Matricule..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffa000] transition-shadow text-sm"
                            />
                        </div>

                        <button
                            onClick={handleExportPdfAll}
                            className="bg-[#042954] hover:bg-[#031d3d] text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap text-sm"
                        >
                            <Download size={18} />
                            Exporter tout en PDF
                        </button>
                        <button
                            onClick={() => setIsCreateModalOpen(true)}
                            className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap text-sm"
                        >
                            <Plus size={18} />
                            Nouvelle Facture
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-sm">
                                <th className="p-4 font-semibold">Numéro</th>
                                <th className="p-4 font-semibold">Étudiant</th>
                                <th className="p-4 font-semibold">Matricule</th>
                                <th className="p-4 font-semibold">Type</th>
                                <th className="p-4 font-semibold">Montant</th>
                                <th className="p-4 font-semibold">Échéance</th>
                                <th className="p-4 font-semibold">Statut</th>
                                <th className="p-4 font-semibold">Date Paiement</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-[#042954] border-t-transparent rounded-full animate-spin"></div>
                                        Chargement en cours...
                                    </td>
                                </tr>
                            ) : paginatedFactures.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500">Aucune facture trouvée.</td>
                                </tr>
                            ) : (
                                paginatedFactures.map((facture) => (
                                    <tr key={facture.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <FileText size={16} className="text-[#ffa000]"/>
                                                <span className="font-bold text-[#333333] text-sm">{facture.numero}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-sm text-[#042954]">
                                                {facture.etudiant?.nom} {facture.etudiant?.prenom}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold tracking-wide">
                                                {facture.etudiant?.matricule || "-"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {facture.type}
                                        </td>
                                        <td className="p-4 font-bold text-gray-800">
                                            {formatMontant(facture.montant)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {formatDate(facture.dateEcheance)}
                                        </td>
                                        <td className="p-4">
                                            {getStatutBadge(facture.statut)}
                                        </td>
                                        <td className="p-4 text-sm text-gray-600">
                                            {formatDate(facture.datePaiement)}
                                        </td>
                                        <td className="p-4 flex items-center justify-end gap-2">
                                            {(facture.statut === 'NON_PAYEE' || facture.statut === 'EN_ATTENTE') && (
                                                <>
                                                    <button
                                                        onClick={() => handleMarkAsPaid(facture.id)}
                                                        className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded transition-colors"
                                                        title="Marquer Payée"
                                                    >
                                                        <CheckCircle size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleCancel(facture.id)}
                                                        className="p-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                                                        title="Annuler"
                                                    >
                                                        <XCircle size={16} />
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={() => facture.etudiant && handleExportPdfStudent(facture.etudiant.id, facture.etudiant.matricule)}
                                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                                title="PDF Étudiant"
                                            >
                                                <Download size={16} />
                                            </button>
                                            <button
                                                onClick={() => openEditModal(facture)}
                                                className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                                                title="Modifier"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(facture.id)}
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
                {!isLoading && filteredFactures.length > 0 && (
                    <div className="p-4 border-t border-gray-100 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 font-medium">
                                Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredFactures.length)} sur {filteredFactures.length}
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
                                className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                <ChevronsLeft size={18} />
                            </button>
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
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
                                className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                <ChevronRight size={18} />
                            </button>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(totalPages)}
                                className="p-1 border border-gray-300 rounded text-gray-500 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                            >
                                <ChevronsRight size={18} />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Create */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-[#042954]">Nouvelle Facture</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitCreate} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Étudiant</label>
                                <select 
                                    required 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                    value={formData.etudiantId}
                                    onChange={e => setFormData({ ...formData, etudiantId: e.target.value })}
                                >
                                    <option value="">Sélectionner un étudiant</option>
                                    {etudiants.map(etud => (
                                        <option key={etud.id} value={etud.id}>{etud.nom} {etud.prenom} - {etud.matricule}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                                    <input 
                                        type="number" step="0.01" min="0" required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                        value={formData.montant}
                                        onChange={e => setFormData({ ...formData, montant: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select 
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="SCOLARITE">Scolarité</option>
                                        <option value="INSCRIPTION">Inscription</option>
                                        <option value="BIBLIOTHEQUE">Bibliothèque</option>
                                        <option value="AUTRE">Autre</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date Échéance</label>
                                <input 
                                    type="date" required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                    value={formData.dateEcheance}
                                    onChange={e => setFormData({ ...formData, dateEcheance: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optionnel)</label>
                                <textarea 
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-green-600 hover:bg-green-700 rounded-lg font-medium transition"
                                >
                                    Créer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit */}
            {isEditModalOpen && currentFacture && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-[#042954]">Modifier Facture {currentFacture.numero}</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Étudiant</label>
                                <select 
                                    required 
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                    value={formData.etudiantId}
                                    onChange={e => setFormData({ ...formData, etudiantId: e.target.value })}
                                >
                                    <option value="">Sélectionner un étudiant</option>
                                    {etudiants.map(etud => (
                                        <option key={etud.id} value={etud.id}>{etud.nom} {etud.prenom} - {etud.matricule}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant</label>
                                    <input 
                                        type="number" step="0.01" min="0" required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                        value={formData.montant}
                                        onChange={e => setFormData({ ...formData, montant: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                                    <select 
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="SCOLARITE">Scolarité</option>
                                        <option value="INSCRIPTION">Inscription</option>
                                        <option value="BIBLIOTHEQUE">Bibliothèque</option>
                                        <option value="AUTRE">Autre</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Date Échéance</label>
                                <input 
                                    type="date" required
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                    value={formData.dateEcheance}
                                    onChange={e => setFormData({ ...formData, dateEcheance: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optionnel)</label>
                                <textarea 
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setIsEditModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition"
                                >
                                    Annuler
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 text-white bg-[#042954] hover:bg-[#031d3d] rounded-lg font-medium transition"
                                >
                                    Enregistrer
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
