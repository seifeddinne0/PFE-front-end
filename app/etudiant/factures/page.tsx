"use client";

import { useEffect, useState } from "react";
import { api, API_URL } from "@/lib/api";
import toast from "react-hot-toast";
import { FileText, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, Filter, AlertCircle, Upload, X } from "lucide-react";

interface Facture {
    id: number;
    numero: string;
    typeFacture?: string;
    description?: string;
    montant: number;
    datePaiement?: string;
    dateEcheance?: string;
    preuvePaiement?: string;
    statut: string;
    etudiantId?: number;
}

interface PaiementResult {
    statut: "VALIDE" | "REJETE" | "EN_ATTENTE";
    motifRejet?: string;
    datePaiement?: string;
    montant?: number;
}

export default function EtudiantFacturesPage() {
    const [factures, setFactures] = useState<Facture[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [etudiantId, setEtudiantId] = useState<number | null>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [statutFilter, setStatutFilter] = useState("Tous");
    const statutOptions = ["Tous", "PAYEE", "NON_PAYEE", "REJETEE"];

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isPayModalOpen, setIsPayModalOpen] = useState(false);
    const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
    const [receiptFile, setReceiptFile] = useState<File | null>(null);
    const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paiementResult, setPaiementResult] = useState<PaiementResult | null>(null);

    const fetchFactures = async () => {
        setIsLoading(true);
        try {
            const data = await api.get("/api/etudiant/factures");
            if (Array.isArray(data)) {
                setFactures(data);
            } else if (data && Array.isArray(data.content)) {
                setFactures(data.content);
            } else {
                setFactures([]);
            }
        } catch (error: any) {
            toast.error(error.message || "Erreur lors du chargement de vos factures.");
        } finally {
            setIsLoading(false);
        }
    };

    const fetchEtudiantId = async () => {
        try {
            const profile = await api.get("/api/etudiant/profil");
            if (profile?.id) setEtudiantId(profile.id);
        } catch (error: any) {
            toast.error(error.message || "Impossible de récupérer le profil étudiant.");
        }
    };

    useEffect(() => {
        const token = localStorage.getItem("token") || sessionStorage.getItem("token");
        if (!token) {
            window.location.href = "/login";
            return;
        }
        fetchFactures();
        fetchEtudiantId();
    }, []);

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
            case 'ANNULEE': return <span className="bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300 px-2.5 py-1 rounded-full text-xs font-bold">ANNULÉE</span>;
            default: return <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 px-2.5 py-1 rounded-full text-xs font-bold">{statut}</span>;
        }
    };

    const buildUploadUrl = (path?: string) => {
        if (!path) return "#";
        if (path.startsWith("http://") || path.startsWith("https://")) return path;
        return `${API_URL}${path}`;
    };

    const resetPaymentModal = () => {
        if (receiptPreviewUrl) {
            URL.revokeObjectURL(receiptPreviewUrl);
        }
        setReceiptFile(null);
        setReceiptPreviewUrl(null);
        setPaiementResult(null);
    };

    const openPayModal = (facture: Facture) => {
        setSelectedFacture(facture);
        setIsPayModalOpen(true);
        resetPaymentModal();
    };

    const closePayModal = () => {
        setIsPayModalOpen(false);
        setSelectedFacture(null);
        resetPaymentModal();
    };

    const handleReceiptFileChange = (file: File | null) => {
        if (receiptPreviewUrl) {
            URL.revokeObjectURL(receiptPreviewUrl);
        }
        setReceiptFile(file);
        if (file && file.type.startsWith("image/")) {
            setReceiptPreviewUrl(URL.createObjectURL(file));
        } else {
            setReceiptPreviewUrl(null);
        }
    };

    const handleSubmitReceipt = async () => {
        if (!selectedFacture) return;
        if (!receiptFile) {
            toast.error("Veuillez uploader un reçu.");
            return;
        }
        if (!etudiantId) {
            toast.error("Profil étudiant introuvable.");
            return;
        }

        try {
            setIsSubmitting(true);
            setPaiementResult(null);
            const formData = new FormData();
            formData.append("factureId", selectedFacture.id.toString());
            formData.append("etudiantId", etudiantId.toString());
            formData.append("receipt", receiptFile);

            const token = sessionStorage.getItem("token") || localStorage.getItem("token");
            const res = await fetch(`${API_URL}/api/paiements/soumettre`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData
            });

            const payload = await res.json();
            if (!res.ok) {
                throw new Error(payload?.message || "Erreur lors de l'envoi du reçu.");
            }

            setPaiementResult({
                statut: payload?.statut,
                motifRejet: payload?.motifRejet,
                datePaiement: payload?.datePaiement,
                montant: payload?.montant
            });

            await fetchFactures();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'envoi du reçu.");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Derived Statistics
    const totalAPayer = factures.filter(f => f.statut === 'NON_PAYEE').reduce((acc, f) => acc + f.montant, 0);
    const totalPaye = factures.filter(f => f.statut === 'PAYEE').reduce((acc, f) => acc + f.montant, 0);
    const countTotal = factures.length;

    // Filtration
    const filteredFactures = factures.filter(f => {
        const matchesSearch = 
            (f.numero && f.numero.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (f.typeFacture && f.typeFacture.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (f.description && f.description.toLowerCase().includes(searchTerm.toLowerCase()));
            
        const matchesStatut = statutFilter === "Tous" || f.statut === statutFilter;
        return matchesSearch && matchesStatut;
    });

    const totalPages = Math.ceil(filteredFactures.length / itemsPerPage);
    const paginatedFactures = filteredFactures.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const pageNumbers = [...Array(currentPage).keys()].map(() => currentPage - 1);
    if (!pageNumbers.includes(totalPages)) {
        pageNumbers.push(totalPages);
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-[#042954] dark:text-white">Mes Factures</h1>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Total à payer</p>
                        <h3 className="text-2xl font-bold text-red-600 dark:text-red-300 mt-1">{formatMontant(totalAPayer)}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center text-red-600 dark:text-red-300">
                        <AlertCircle size={24} />
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Total payé</p>
                        <h3 className="text-2xl font-bold text-green-600 dark:text-green-300 mt-1">{formatMontant(totalPaye)}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-green-50 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-300">
                        <span className="text-base font-black tracking-wide">DT</span>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-xl p-6 border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-gray-500 dark:text-slate-400 text-sm font-medium">Nombre de factures</p>
                        <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-300 mt-1">{countTotal}</h3>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-300">
                        <FileText size={24} />
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-bold text-[#042954]">Historique des factures</h2>

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
                                <option value="REJETEE">Rejetée</option>
                            </select>
                        </div>
                        <div className="relative">
                            <button onClick={() => {
                                const dropdown = document.getElementById("statut-dropdown-etudiant");
                                dropdown?.classList.toggle("hidden");
                            }} className="flex items-center justify-between w-full md:w-48 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <span>{statutFilter === "Tous" ? "Tous les statuts" : statutFilter.replace('_', ' ')}</span>
                                <Filter size={16} className="text-gray-500" />
                            </button>
                            <div id="statut-dropdown-etudiant" className="hidden absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                                {statutOptions.map(option => (
                                    <a key={option} href="#" onClick={(e) => {
                                        e.preventDefault();
                                        setStatutFilter(option);
                                        document.getElementById("statut-dropdown-etudiant")?.classList.add("hidden");
                                    }} className="block px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-600">
                                        {option === "Tous" ? "Tous les statuts" : option.replace('_', ' ')}
                                    </a>
                                ))}
                            </div>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Numéro, Type..."
                                value={searchTerm}
                                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                                className="w-full sm:w-64 pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ffa000] transition-shadow text-sm"
                            />
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse hidden md:table">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 border-b border-gray-200 text-sm">
                                <th className="p-4 font-semibold">Numéro</th>
                                <th className="p-4 font-semibold">Type</th>
                                <th className="p-4 font-semibold">Description</th>
                                <th className="p-4 font-semibold">Montant</th>
                                <th className="p-4 font-semibold">Reçu</th>
                                <th className="p-4 font-semibold">Paiement</th>
                                <th className="p-4 font-semibold">Statut</th>
                                <th className="p-4 font-semibold">Date Paiement</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500 flex justify-center items-center gap-2">
                                        <div className="w-5 h-5 border-2 border-[#042954] border-t-transparent rounded-full animate-spin"></div>
                                        Chargement en cours...
                                    </td>
                                </tr>
                            ) : paginatedFactures.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="p-8 text-center text-gray-500">Aucune facture trouvée.</td>
                                </tr>
                            ) : (
                                paginatedFactures.map((facture) => {
                                    return (
                                        <tr key={facture.id} className="border-b border-gray-100 transition-colors hover:bg-gray-50/50">
                                            <td className="p-4">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={16} className="text-[#ffa000]"/>
                                                    <span className="font-bold text-[#333333] text-sm">{facture.numero}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="font-semibold text-sm text-[#042954]">
                                                    {facture.typeFacture || "-"}
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <span className="text-sm text-gray-600 truncate max-w-[200px] block">
                                                    {facture.description || "-"}
                                                </span>
                                            </td>
                                            <td className="p-4 font-bold text-gray-800">
                                                {formatMontant(facture.montant)}
                                            </td>
                                            <td className="p-4 text-sm">
                                                {facture.preuvePaiement ? (
                                                    <a
                                                        href={buildUploadUrl(facture.preuvePaiement)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="text-blue-700 hover:underline font-medium"
                                                    >
                                                        Voir le reçu
                                                    </a>
                                                ) : (
                                                    <span className="text-gray-500">Non envoyé</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm">
                                                {(facture.statut === "NON_PAYEE" || facture.statut === "EN_ATTENTE" || facture.statut === "REJETEE") && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openPayModal(facture)}
                                                        className="px-3 py-1.5 text-xs rounded bg-[#042954] text-white hover:bg-[#031f40]"
                                                    >
                                                        Payer
                                                    </button>
                                                )}
                                            </td>
                                            <td className="p-4">
                                                {getStatutBadge(facture.statut)}
                                            </td>
                                            <td className="p-4 text-sm text-gray-600">
                                                {formatDate(facture.datePaiement)}
                                            </td>
                                        </tr>
                                    );
                                })
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
                        ) : paginatedFactures.length === 0 ? (
                            <div className="p-8 text-center text-gray-500 bg-white rounded-xl border border-gray-100">Aucune facture trouvée.</div>
                        ) : (
                            paginatedFactures.map((facture) => {
                                return (
                                    <div key={facture.id} className="bg-white p-4 rounded-xl shadow-sm border relative flex flex-col gap-3 transition-colors border-gray-200">
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex flex-col gap-1 pr-2">
                                                <div className="flex items-center gap-2">
                                                    <FileText size={18} className="text-[#ffa000]"/>
                                                    <span className="font-bold text-[#333333] text-base">{facture.numero}</span>
                                                </div>
                                                <div className="font-semibold text-sm text-[#042954]">{facture.typeFacture || "-"}</div>
                                            </div>
                                            <div className="flex flex-col items-end gap-1 shrink-0">
                                                <span className="font-bold text-xl text-gray-800 tracking-tight">{formatMontant(facture.montant)}</span>
                                                {getStatutBadge(facture.statut)}
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-2 bg-white/60 p-3 rounded-lg border border-gray-100 text-sm">
                                            <div className="flex justify-between items-center py-1 border-b border-gray-200">
                                                <span className="text-gray-500">Reçu</span>
                                                {facture.preuvePaiement ? (
                                                    <a
                                                        href={buildUploadUrl(facture.preuvePaiement)}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="font-medium text-blue-700 hover:underline"
                                                    >
                                                        Voir reçu
                                                    </a>
                                                ) : (
                                                    <span className="font-medium text-gray-700">Non envoyée</span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center py-1 border-b border-gray-200">
                                                <span className="text-gray-500">Date paiement</span>
                                                <span className="font-medium text-gray-700">{formatDate(facture.datePaiement)}</span>
                                            </div>
                                            <div>
                                                <span className="block text-gray-500 text-xs mb-1 mt-1">Description</span>
                                                <div className="bg-gray-100 p-2 rounded text-xs text-gray-700">
                                                    {facture.description || "Aucune description"}
                                                </div>
                                            </div>
                                            {(facture.statut === "NON_PAYEE" || facture.statut === "EN_ATTENTE" || facture.statut === "REJETEE") && (
                                                <div className="pt-2 border-t border-gray-200">
                                                    <button
                                                        type="button"
                                                        onClick={() => openPayModal(facture)}
                                                        className="w-full px-3 py-2 text-xs rounded bg-[#042954] text-white hover:bg-[#031f40]"
                                                    >
                                                        Payer
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
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

            {isPayModalOpen && selectedFacture && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-lg font-bold text-[#042954]">Paiement — {selectedFacture.numero}</h2>
                            <button onClick={closePayModal} className="text-gray-400 hover:text-gray-600">
                                <X size={20} />
                            </button>
                        </div>
                        <div className="p-5 space-y-4 overflow-y-auto flex-1">
                            <div className="bg-gray-50 border border-gray-100 rounded-lg p-4 text-sm text-gray-700">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Montant</span>
                                    <span className="font-semibold">{formatMontant(selectedFacture.montant)}</span>
                                </div>
                                <div className="flex justify-between mt-2">
                                    <span className="text-gray-500">Date d'échéance</span>
                                    <span className="font-medium">{formatDate(selectedFacture.dateEcheance)}</span>
                                </div>
                            </div>

                            <div
                                className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-sm text-gray-600 hover:border-[#ffa000] transition-colors"
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    const file = e.dataTransfer.files?.[0] || null;
                                    handleReceiptFileChange(file);
                                }}
                            >
                                <input
                                    id="receipt-upload"
                                    type="file"
                                    accept=".jpg,.jpeg,.png,.pdf"
                                    className="hidden"
                                    onChange={(e) => handleReceiptFileChange(e.target.files?.[0] || null)}
                                />
                                <label htmlFor="receipt-upload" className="cursor-pointer flex flex-col items-center gap-2">
                                    <Upload size={22} className="text-[#042954]" />
                                    <span>Glissez-déposez ou cliquez pour uploader (JPG, PNG, PDF)</span>
                                </label>
                            </div>

                            {receiptFile && (
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-700">
                                    <div className="font-medium">Fichier sélectionné</div>
                                    <div className="mt-1">{receiptFile.name}</div>
                                    {receiptPreviewUrl && (
                                        <img src={receiptPreviewUrl} alt="Reçu" className="mt-3 max-h-60 mx-auto rounded" />
                                    )}
                                </div>
                            )}

                            {isSubmitting && (
                                <div className="text-sm text-orange-700 bg-orange-50 border border-orange-200 px-3 py-2 rounded">
                                    ⏳ Analyse du reçu en cours...
                                </div>
                            )}

                            {paiementResult && (
                                <div className={`border rounded-lg p-4 text-sm ${paiementResult.statut === "VALIDE" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"}`}>
                                    {paiementResult.statut === "VALIDE" ? (
                                        <>
                                            <div className="font-bold">✅ Paiement validé avec succès</div>
                                            <div>Votre paiement a été vérifié et accepté.</div>
                                            <div className="mt-2">Date de paiement: {paiementResult.datePaiement ? formatDate(paiementResult.datePaiement) : "-"}</div>
                                            <div>Montant: {paiementResult.montant != null ? formatMontant(paiementResult.montant) : "-"}</div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="font-bold">❌ Paiement rejeté</div>
                                            <div className="mt-2 text-sm text-red-800">Raisons du rejet :</div>
                                            <ul className="list-disc pl-5 mt-1">
                                                {(paiementResult.motifRejet || "Reçu invalide").split(' + ').map((motif, idx) => (
                                                    <li key={idx} className="text-xs text-red-700 mt-1">{motif}</li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="p-5 border-t border-gray-100 flex justify-end gap-3">
                            {paiementResult?.statut === "REJETE" && (
                                <button onClick={() => { resetPaymentModal(); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
                                    Réessayer
                                </button>
                            )}
                            <button onClick={closePayModal} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm">
                                Fermer
                            </button>
                            <button
                                onClick={handleSubmitReceipt}
                                disabled={isSubmitting}
                                className="px-4 py-2 text-white bg-[#042954] hover:bg-[#031f40] rounded-lg text-sm disabled:opacity-60"
                            >
                                Soumettre le reçu
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
