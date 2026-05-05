"use client";

import { useEffect, useState } from "react";
import { Search, Plus, Edit2, Trash2, CheckCircle, XCircle, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, FileText, FileCheck, FileX, Download } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useConfirm } from "@/components/ConfirmProvider";

interface Etudiant {
    id: number;
    nom: string;
    prenom: string;
    matricule: string;
    classeCode?: string;
}

interface FiliereOption {
    id: number;
    code: string;
    nom: string;
}

interface ClasseOption {
    id: number;
    code: string;
    nom: string;
    niveauCode: string;
    filiereCode: string;
}

interface Facture {
    id: number;
    numero: string;
    etudiantId: number;
    etudiantNom: string;
    etudiantPrenom: string;
    etudiantMatricule: string;
    typeFacture: string;
    description?: string;
    montant: number;
    datePaiement?: string;
    statut: string;
    typePaiement?: string;
}

interface FactureStats {
    totalPayee: number;
    totalImpaye: number;
    countPayee: number;
    countNonPayee: number;
}

export default function AdminFacturesPage() {
    const { confirm } = useConfirm();
    const [factures, setFactures] = useState<Facture[]>([]);
    const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
    const [filieres, setFilieres] = useState<FiliereOption[]>([]);
    const [classes, setClasses] = useState<ClasseOption[]>([]);
    const [stats, setStats] = useState<FactureStats>({ totalPayee: 0, totalImpaye: 0, countPayee: 0, countNonPayee: 0 });
    const [isLoading, setIsLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [statutFilter, setStatutFilter] = useState("Tous");

    const statutOptions = ["Tous", "PAYEE", "NON_PAYEE", "REJETEE"];

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentFacture, setCurrentFacture] = useState<Facture | null>(null);

    const [batchFormData, setBatchFormData] = useState({
        filiereCode: "",
        niveauCode: "",
        classeIds: [] as number[],
        montant: "",
        typeFacture: "SCOLARITE",
        typePaiement: "UNE_TRANCHE",
        description: ""
    });

    const [formData, setFormData] = useState({
        etudiantId: "",
        montant: "",
        typeFacture: "SCOLARITE",
        typePaiement: "UNE_TRANCHE",
        description: ""
    });

    const fetchFactures = async () => {
        try {
            const data = await api.get("/api/admin/factures?page=0&size=1000");
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

    const fetchFilieres = async () => {
        try {
            const data = await api.get("/api/admin/filieres");
            if (Array.isArray(data)) {
                setFilieres(data);
            } else {
                setFilieres([]);
            }
        } catch (error: any) {
            console.error("Erreur lors du chargement des filières.", error);
            setFilieres([]);
        }
    };

    const fetchClasses = async () => {
        try {
            const data = await api.get("/api/admin/classes");
            if (Array.isArray(data)) {
                setClasses(data);
            } else {
                setClasses([]);
            }
        } catch (error: any) {
            console.error("Erreur lors du chargement des classes.", error);
            setClasses([]);
        }
    };

    const loadData = async () => {
        setIsLoading(true);
        await Promise.all([fetchFactures(), fetchStats(), fetchEtudiants(), fetchFilieres(), fetchClasses()]);
        setIsLoading(false);
    };

    useEffect(() => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
            return;
        }
        loadData();
    }, []);

    const handleDelete = async (id: number) => {
        const isConfirmed = await confirm({
            title: "Supprimer la facture",
            message: "Voulez-vous vraiment supprimer cette facture ?",
            confirmText: "Supprimer",
            variant: "danger"
        });
        if (!isConfirmed) return;
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
            await api.patch(`/api/admin/factures/${id}/payer`, {});
            toast.success("Facture marquée comme payée!");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la validation du paiement.");
        }
    };

    const handleCancel = async (id: number) => {
        if (!window.confirm("Confirmer l'annulation de cette facture ?")) return;
        try {
            await api.patch(`/api/admin/factures/${id}/annuler`, {});
            toast.success("Facture annulée!");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'annulation.");
        }
    };

    const handleReject = async (id: number) => {
        if (!window.confirm("Confirmer le rejet de cette facture ?")) return;
        try {
            await api.patch(`/api/admin/factures/${id}/rejeter`, {});
            toast.success("Facture rejetée!");
            loadData();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du rejet.");
        }
    };

    const handleSubmitCreate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!batchFormData.filiereCode) {
            toast.error("Veuillez sélectionner une filière.");
            return;
        }

        if (!batchFormData.niveauCode) {
            toast.error("Veuillez sélectionner un niveau.");
            return;
        }

        if (batchFormData.classeIds.length === 0) {
            toast.error("Veuillez sélectionner au moins une classe.");
            return;
        }

        try {
            const payload = {
                classeIds: batchFormData.classeIds,
                montant: parseFloat(batchFormData.montant),
                typeFacture: batchFormData.typeFacture,
                typePaiement: batchFormData.typePaiement,
                description: batchFormData.description
            };

            const res = await api.post("/api/admin/factures/batch", payload);
            toast.success(`Factures créées: ${res?.createdCount ?? 0} étudiant(s), ${res?.classesCount ?? 0} classe(s).`);
            setIsCreateModalOpen(false);
            setBatchFormData({
                filiereCode: "",
                niveauCode: "",
                classeIds: [],
                montant: "",
                typeFacture: "SCOLARITE",
                typePaiement: "UNE_TRANCHE",
                description: ""
            });
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
                etudiantId: parseInt(formData.etudiantId),
                montant: parseFloat(formData.montant),
                typeFacture: formData.typeFacture,
                typePaiement: formData.typePaiement,
                description: formData.description
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
            etudiantId: f.etudiantId ? f.etudiantId.toString() : "",
            montant: f.montant.toString(),
            typeFacture: f.typeFacture || "SCOLARITE",
            typePaiement: f.typePaiement || "UNE_TRANCHE",
            description: f.description || ""
        });
        setIsEditModalOpen(true);
    };

    const niveauxOptions = Array.from(
        new Set(
            classes
                .filter(c => !batchFormData.filiereCode || c.filiereCode === batchFormData.filiereCode)
                .map(c => c.niveauCode)
        )
    ).sort();

    const filteredClassesForBatch = classes.filter(
        c =>
            c.filiereCode === batchFormData.filiereCode
            && c.niveauCode === batchFormData.niveauCode
    );

    const studentsInSelectedClasses = etudiants.filter(
        e => e.classeCode && batchFormData.classeIds.some(id => classes.find(c => c.id === id)?.code === e.classeCode)
    ).length;

    const toggleClasse = (classeId: number) => {
        setBatchFormData(prev => {
            const exists = prev.classeIds.includes(classeId);
            return {
                ...prev,
                classeIds: exists
                    ? prev.classeIds.filter(id => id !== classeId)
                    : [...prev.classeIds, classeId]
            };
        });
    };

    const selectAllFilteredClasses = () => {
        setBatchFormData(prev => ({
            ...prev,
            classeIds: filteredClassesForBatch.map(c => c.id)
        }));
    };

    const clearAllFilteredClasses = () => {
        setBatchFormData(prev => ({
            ...prev,
            classeIds: []
        }));
    };

    const handleExportPdfAll = async () => {
        try {
            const token = sessionStorage.getItem("token");
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
            const token = sessionStorage.getItem("token");
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

    const openCreateModal = () => {
        setBatchFormData({
            filiereCode: "",
            niveauCode: "",
            classeIds: [],
            montant: "",
            typeFacture: "SCOLARITE",
            typePaiement: "UNE_TRANCHE",
            description: ""
        });
        setIsCreateModalOpen(true);
    };

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
            case 'PAYEE': return <span className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 px-2.5 py-1 rounded-full text-xs font-bold">PAYÉE</span>;
            case 'NON_PAYEE': return <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 px-2.5 py-1 rounded-full text-xs font-bold">NON PAYÉE</span>;
            case 'REJETEE': return <span className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 px-2.5 py-1 rounded-full text-xs font-bold">REJETÉE</span>;
            default: return <span className="bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 px-2.5 py-1 rounded-full text-xs font-bold">{statut}</span>;
        }
    };

    const formatTypePaiement = (typePaiement?: string) => {
        if (typePaiement === "DEUX_TRANCHES") return "2 tranches";
        if (typePaiement === "UNE_TRANCHE") return "1 tranche";
        return "1 tranche";
    };

    const filteredFactures = factures.filter(f => {
        const matchesSearch =
            (f.numero && f.numero.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (`${f.etudiantNom} ${f.etudiantPrenom}`.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (f.etudiantMatricule && f.etudiantMatricule.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesStatut = statutFilter === "Tous" || f.statut === statutFilter;
        return matchesSearch && matchesStatut;
    });

    const totalPages = Math.ceil(filteredFactures.length / itemsPerPage);
    const paginatedFactures = filteredFactures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold text-[#042954] dark:text-white">Gestion des Factures</h1>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-100 dark:border-zinc-800/50 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium">Total Payé</p>
                        <h3 className="text-xl font-bold text-green-600 dark:text-green-500 mt-1">{formatMontant(stats.totalPayee)}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/20 flex items-center justify-center text-green-600 dark:text-green-400">
                        <span className="text-base font-black tracking-wide">DT</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-100 dark:border-zinc-800/50 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium">Total Impayé</p>
                        <h3 className="text-xl font-bold text-red-600 dark:text-red-500 mt-1">{formatMontant(stats.totalImpaye)}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center text-red-600 dark:text-red-400">
                        <span className="text-base font-black tracking-wide">DT</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-100 dark:border-zinc-800/50 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium">Factures Payées</p>
                        <h3 className="text-xl font-bold text-blue-600 dark:text-blue-500 mt-1">{stats.countPayee}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                        <FileCheck size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-[#111111] rounded-xl p-6 border border-gray-100 dark:border-zinc-800/50 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-zinc-400 text-sm font-medium">Factures Non Payées</p>
                        <h3 className="text-xl font-bold text-orange-600 dark:text-orange-500 mt-1">{stats.countNonPayee}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
                        <FileX size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-[#111111] rounded-xl border border-gray-100 dark:border-zinc-800/50 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 dark:border-zinc-800/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-[#042954] dark:text-white">Liste des Factures</h2>
                    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2">
                            <Filter size={18} className="text-gray-400 dark:text-slate-500" />
                            <select
                                value={statutFilter}
                                onChange={(e) => { setStatutFilter(e.target.value); setCurrentPage(1); }}
                                className="border border-gray-200 dark:border-zinc-800 dark:text-zinc-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#ffa000] bg-gray-50 dark:bg-[#1a1a1a]"
                            >
                                <option value="Tous">Tous les statuts</option>
                                <option value="PAYEE">Payée</option>
                                <option value="NON_PAYEE">Non Payée</option>
                                <option value="REJETEE">Rejetée</option>
                            </select>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500" size={18} />
                            <input
                                type="text"
                                placeholder="Numéro, Étudiant, Matricule..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-zinc-800 dark:text-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffa000] focus:border-transparent transition-shadow text-sm"
                            />
                        </div>
                        <button
                            onClick={handleExportPdfAll}
                            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap text-sm"
                        >
                            <Download size={18} />
                            Exporter PDF
                        </button>
                        <button
                            onClick={openCreateModal}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm whitespace-nowrap text-sm"
                        >
                            <Plus size={18} />
                            Nouvelle Facture
                        </button>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse hidden md:table">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-[#1a1a1a] text-gray-500 dark:text-zinc-400 border-b border-gray-200 dark:border-zinc-800/50 text-sm">
                                <th className="p-4 font-semibold">Numéro</th>
                                <th className="p-4 font-semibold">Étudiant</th>
                                <th className="p-4 font-semibold">Matricule</th>
                                <th className="p-4 font-semibold">Type</th>
                                <th className="p-4 font-semibold">Paiement</th>
                                <th className="p-4 font-semibold">Montant</th>
                                <th className="p-4 font-semibold text-center">Statut</th>
                                <th className="p-4 font-semibold">Date Paiement</th>
                                <th className="p-4 font-semibold text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500 dark:text-slate-400">
                                        <div className="flex justify-center items-center gap-2">
                                            <div className="w-5 h-5 border-2 border-[#042954] border-t-transparent rounded-full animate-spin"></div>
                                            Chargement en cours...
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedFactures.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="p-8 text-center text-gray-500 dark:text-slate-400">Aucune facture trouvée.</td>
                                </tr>
                            ) : (
                                paginatedFactures.map((facture) => (
                                    <tr
                                        key={facture.id}
                                        className="border-b border-gray-100 dark:border-zinc-800/50 hover:bg-gray-50/50 dark:hover:bg-[#151515] transition-colors dark:text-zinc-300"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <FileText size={16} className="text-[#ffa000]" />
                                                <span className="font-bold text-[#333333] dark:text-slate-100 text-sm">{facture.numero}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-semibold text-sm text-[#042954] dark:text-white">
                                                {facture.etudiantNom} {facture.etudiantPrenom}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded text-xs font-bold tracking-wide">
                                                {facture.etudiantMatricule || "-"}
                                            </span>
                                        </td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-zinc-300">{facture.typeFacture || "-"}</td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-zinc-300">{formatTypePaiement(facture.typePaiement)}</td>
                                        <td className="p-4 font-bold text-gray-800 dark:text-zinc-100">{formatMontant(facture.montant)}</td>
                                        <td className="p-4 text-center">{getStatutBadge(facture.statut)}</td>
                                        <td className="p-4 text-sm text-gray-600 dark:text-zinc-300">{formatDate(facture.datePaiement)}</td>
                                        <td className="p-4">
                                            <div className="flex items-center justify-end gap-2">
                                                {facture.statut === 'NON_PAYEE' && (
                                                    <button onClick={() => handleMarkAsPaid(facture.id)} className="text-green-600 hover:text-green-800" title="Marquer comme payée">
                                                        <CheckCircle size={18} />
                                                    </button>
                                                )}
                                                {(facture.statut === 'NON_PAYEE' || facture.statut === 'PAYEE') && (
                                                    <button onClick={() => handleReject(facture.id)} className="text-red-600 hover:text-red-800" title="Rejeter la facture">
                                                        <XCircle size={18} />
                                                    </button>
                                                )}
                                                <button onClick={() => openEditModal(facture)} className="text-blue-600 hover:text-blue-800" title="Modifier">
                                                    <Edit2 size={18} />
                                                </button>
                                                <button onClick={() => handleDelete(facture.id)} className="text-gray-500 hover:text-gray-700" title="Supprimer">
                                                    <Trash2 size={18} />
                                                </button>
                                                <button onClick={() => handleExportPdfStudent(facture.etudiantId, facture.etudiantMatricule)} className="text-purple-600 hover:text-purple-800" title="Exporter PDF de l'étudiant">
                                                    <Download size={18} />
                                                </button>
                                            </div>
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
                        ) : paginatedFactures.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">Aucune facture trouvée.</div>
                        ) : (
                            paginatedFactures.map((facture) => (
                                <div key={facture.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm relative flex flex-col gap-3 border transition-colors border-gray-200 dark:border-slate-700">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <FileText size={16} className="text-[#ffa000]" />
                                                <span className="font-bold text-[#333333] dark:text-slate-100">{facture.numero}</span>
                                            </div>
                                            <div className="font-semibold text-sm text-[#042954] dark:text-white">
                                                {facture.etudiantNom} {facture.etudiantPrenom}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            {getStatutBadge(facture.statut)}
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-2 bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700 text-sm">
                                        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-slate-400 mb-1">
                                            <span>Matricule: <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded ml-1">{facture.etudiantMatricule || "-"}</span></span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-slate-700">
                                            <span className="text-gray-500 dark:text-slate-400">Type</span>
                                            <span className="font-medium text-gray-700">{facture.typeFacture || "-"}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-slate-700">
                                            <span className="text-gray-500 dark:text-slate-400">Paiement</span>
                                            <span className="font-medium text-gray-700">{formatTypePaiement(facture.typePaiement)}</span>
                                        </div>
                                        <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-slate-700">
                                            <span className="text-gray-500 dark:text-slate-400">Montant</span>
                                            <span className="font-bold text-orange-600 text-base">{formatMontant(facture.montant)}</span>
                                        </div>
                                        <div className="pt-1">
                                            <span className="block text-xs text-gray-400 dark:text-slate-500">Date paiement</span>
                                            <span className="font-medium text-gray-700">{formatDate(facture.datePaiement)}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-gray-100 dark:border-slate-700">
                                        <button onClick={() => handleMarkAsPaid(facture.id)} className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded" title="Marquer Payée"><CheckCircle size={16} /></button>
                                        <button onClick={() => handleCancel(facture.id)} className="p-2 text-gray-600 dark:text-slate-300 bg-gray-100 hover:bg-gray-200 rounded" title="Annuler"><XCircle size={16} /></button>
                                        <button onClick={() => handleExportPdfStudent(facture.etudiantId, facture.etudiantMatricule)} className="mr-auto px-3 py-1.5 text-xs text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors flex items-center gap-1 font-medium shadow-sm"><Download size={12} /> PDF</button>
                                        <button onClick={() => openEditModal(facture)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded" title="Modifier"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDelete(facture.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded" title="Supprimer"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {!isLoading && filteredFactures.length > 0 && (
                    <div className="p-4 border-t border-gray-100 dark:border-zinc-800/50 flex items-center justify-between text-sm">
                        <div className="flex items-center gap-3">
                            <span className="text-gray-500 dark:text-zinc-400 font-medium whitespace-nowrap">
                                Affichage de {(currentPage - 1) * itemsPerPage + 1} à {Math.min(currentPage * itemsPerPage, filteredFactures.length)} sur {filteredFactures.length}
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

                            {Array.from({ length: totalPages }).map((_, i) => {
                                // Afficher un nombre limité de pages pour ne pas déborder
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
            </div>

            {/* Modal Create */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800/50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-[#042954] dark:text-white">Nouvelle Facture</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-300 transition">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitCreate} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Filière *</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                        value={batchFormData.filiereCode}
                                        onChange={e => setBatchFormData({ ...batchFormData, filiereCode: e.target.value, niveauCode: "", classeIds: [] })}
                                    >
                                        <option value="">Sélectionner une filière</option>
                                        {filieres.map(f => (
                                            <option key={f.id} value={f.code}>{f.code} - {f.nom}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Niveau *</label>
                                    <select
                                        required
                                        disabled={!batchFormData.filiereCode}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000] disabled:bg-gray-100"
                                        value={batchFormData.niveauCode}
                                        onChange={e => setBatchFormData({ ...batchFormData, niveauCode: e.target.value, classeIds: [] })}
                                    >
                                        <option value="">Sélectionner un niveau</option>
                                        {niveauxOptions.map(n => (
                                            <option key={n} value={n}>{n}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="block text-sm font-medium text-gray-700">Classes (multi-sélection) *</label>
                                    <div className="flex items-center gap-2 text-xs">
                                        <button type="button" onClick={selectAllFilteredClasses} className="text-blue-700 hover:underline">Tout sélectionner</button>
                                        <button type="button" onClick={clearAllFilteredClasses} className="text-gray-600 dark:text-slate-300 hover:underline">Vider</button>
                                    </div>
                                </div>

                                <div className="max-h-36 overflow-y-auto border border-gray-300 dark:border-slate-600 rounded-lg p-2 bg-gray-50 dark:bg-slate-800/50">
                                    {filteredClassesForBatch.length === 0 ? (
                                        <p className="text-sm text-gray-500 dark:text-slate-400 px-2 py-1">Choisissez d'abord une filière et un niveau.</p>
                                    ) : (
                                        <div className="space-y-1">
                                            {filteredClassesForBatch.map(c => (
                                                <label key={c.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-white dark:bg-slate-800 cursor-pointer text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={batchFormData.classeIds.includes(c.id)}
                                                        onChange={() => toggleClasse(c.id)}
                                                        className="rounded border-gray-300 dark:border-slate-600 text-[#042954] dark:text-white focus:ring-[#ffa000]"
                                                    />
                                                    <span className="font-medium text-[#042954] dark:text-white">{c.code}</span>
                                                    <span className="text-gray-500 dark:text-slate-400">{c.nom}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="mt-2 text-xs text-gray-600 dark:text-slate-300 bg-blue-50 border border-blue-100 rounded-md px-2 py-1">
                                    {batchFormData.classeIds.length} classe(s) sélectionnée(s) • {studentsInSelectedClasses} étudiant(s) ciblé(s)
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
                                    <input
                                        type="number" step="0.01" min="0" required
                                        placeholder="0.00"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                        value={batchFormData.montant}
                                        onChange={e => setBatchFormData({ ...batchFormData, montant: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                        value={batchFormData.typeFacture}
                                        onChange={e => setBatchFormData({ ...batchFormData, typeFacture: e.target.value })}
                                    >
                                        <option value="SCOLARITE">Scolarité</option>
                                        <option value="INSCRIPTION">Inscription</option>
                                        <option value="BIBLIOTHEQUE">Bibliothèque</option>
                                        <option value="AUTRE">Autre</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Paiement *</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                        value={batchFormData.typePaiement}
                                        onChange={e => setBatchFormData({ ...batchFormData, typePaiement: e.target.value })}
                                    >
                                        <option value="UNE_TRANCHE">1 tranche</option>
                                        <option value="DEUX_TRANCHES">2 tranches</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optionnel)</label>
                                <textarea
                                    rows={3}
                                    placeholder="Description optionnelle..."
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                    value={batchFormData.description}
                                    onChange={e => setBatchFormData({ ...batchFormData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Annuler</button>
                                <button type="submit" className="px-4 py-2 text-white bg-[#FFA000] hover:bg-[#e69000] rounded-lg font-medium transition">Créer pour le groupe</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit */}
            {isEditModalOpen && currentFacture && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 dark:border-zinc-800/50 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-[#042954] dark:text-white">Modifier — {currentFacture.numero}</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-300 transition">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmitEdit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Étudiant</label>
                                <div className="w-full px-4 py-2 border border-gray-200 dark:border-slate-700 rounded-lg bg-gray-50 dark:bg-slate-800/50 text-gray-600 dark:text-slate-300 text-sm">
                                    {currentFacture.etudiantNom} {currentFacture.etudiantPrenom} — {currentFacture.etudiantMatricule}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Montant *</label>
                                    <input
                                        type="number" step="0.01" min="0" required
                                        placeholder="0.00"
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                        value={formData.montant}
                                        onChange={e => setFormData({ ...formData, montant: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                        value={formData.typeFacture}
                                        onChange={e => setFormData({ ...formData, typeFacture: e.target.value })}
                                    >
                                        <option value="SCOLARITE">Scolarité</option>
                                        <option value="INSCRIPTION">Inscription</option>
                                        <option value="BIBLIOTHEQUE">Bibliothèque</option>
                                        <option value="AUTRE">Autre</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Paiement *</label>
                                    <select
                                        required
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                        value={formData.typePaiement}
                                        onChange={e => setFormData({ ...formData, typePaiement: e.target.value })}
                                    >
                                        <option value="UNE_TRANCHE">1 tranche</option>
                                        <option value="DEUX_TRANCHES">2 tranches</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optionnel)</label>
                                <textarea
                                    rows={3}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-[#ffa000] focus:border-[#ffa000]"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>
                            <div className="flex justify-end gap-3 mt-6">
                                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition">Annuler</button>
                                <button type="submit" className="px-4 py-2 text-white bg-[#042954] hover:bg-[#031d3d] rounded-lg font-medium transition">Enregistrer</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}