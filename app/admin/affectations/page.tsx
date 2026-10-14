"use client";

import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { AlertCircle, CheckCircle2, Search, Filter } from "lucide-react";
import toast from "react-hot-toast";

interface Enseignant {
    id: number;
    nom: string;
    prenom: string;
    email: string;
}

interface Seance {
    id: number;
    matiereId: number;
    matiereNom: string;
    matiereCode: string;
    semestre: string;
    niveauCode: string;
    enseignantId: number | null;
    enseignantNom: string | null;
}

interface MatiereGroup {
    matiereId: number;
    matiereNom: string;
    matiereCode: string;
    semestre: string;
    niveauCode: string;
    nbSeances: number;
    enseignantId: number | null;
    enseignantNom: string | null;
}

export default function AffectationsPage() {
    const [seances, setSeances] = useState<Seance[]>([]);
    const [enseignants, setEnseignants] = useState<Enseignant[]>([]);
    const [loading, setLoading] = useState(true);
    const [semestreFilter, setSemestreFilter] = useState("ALL");
    const [filiereFilter, setFiliereFilter] = useState("ALL");
    const [searchTerm, setSearchTerm] = useState("");
    const [processingId, setProcessingId] = useState<number | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [seancesRes, enseignantsRes] = await Promise.all([
                api.get("/api/seances"),
                api.get("/api/admin/enseignants?size=500")
            ]);
            setSeances(seancesRes);
            setEnseignants(enseignantsRes.content || enseignantsRes || []);
        } catch (error) {
            toast.error("Erreur lors du chargement des données");
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (matiereId: number, semestre: string, enseignantId: number) => {
        setProcessingId(matiereId);
        try {
            // One call handles both matieres + seances ✅
            await api.patch(
                `/api/admin/matieres/${matiereId}/enseignant?enseignantId=${enseignantId}`,
                {}
            );
            toast.success("Affectation mise à jour !");
            await fetchData();
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'affectation");
        } finally {
            setProcessingId(null);
        }
    };

    // Group seances by matiereId + semestre
    const matiereGroups: MatiereGroup[] = [];
    const grouped = new Map<string, MatiereGroup>();

    seances.forEach(s => {
        const key = `${s.matiereId}-${s.semestre}`;
        if (!grouped.has(key)) {
            grouped.set(key, {
                matiereId: s.matiereId,
                matiereNom: s.matiereNom,
                matiereCode: s.matiereCode,
                semestre: s.semestre,
                niveauCode: s.niveauCode || "-",
                nbSeances: 0,
                enseignantId: s.enseignantId,
                enseignantNom: s.enseignantNom
            });
        }
        const group = grouped.get(key)!;
        group.nbSeances += 1;
        // In case different seances have different teachers (should not happen based on rules),
        // we just take the first assigned one.
        if (!group.enseignantId && s.enseignantId) {
            group.enseignantId = s.enseignantId;
            group.enseignantNom = s.enseignantNom;
        }
    });

    const filieresMap = new Map();
    seances.forEach(s => {
        if (s.niveauCode) {
            const fCode = s.niveauCode.match(/^[A-Za-z]+/)?.[0];
            if (fCode) filieresMap.set(fCode, fCode);
        }
    });
    const filieres = Array.from(filieresMap.values());

    const groups = Array.from(grouped.values()).filter(g => {
        if (semestreFilter !== "ALL" && g.semestre !== semestreFilter) return false;
        if (filiereFilter !== "ALL") {
            const fCode = g.niveauCode?.match(/^[A-Za-z]+/)?.[0];
            if (fCode !== filiereFilter) return false;
        }
        if (searchTerm && !g.matiereNom.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !(g.enseignantNom && g.enseignantNom.toLowerCase().includes(searchTerm.toLowerCase()))) {
            return false;
        }
        return true;
    }).sort((a, b) => a.semestre.localeCompare(b.semestre) || a.matiereNom.localeCompare(b.matiereNom));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-[#042954] dark:text-zinc-100">Gestion des Affectations</h1>
                <p className="text-gray-500 dark:text-zinc-400 mt-1">
                    Assignez les enseignants aux matières pour générer l'emploi du temps complet.
                </p>
            </div>

            <div className="bg-white dark:bg-[#111111] rounded-2xl shadow-sm border border-gray-100 dark:border-zinc-800/50 p-6">
                <div className="flex flex-col md:flex-row gap-4 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Rechercher une matière ou un enseignant..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-900/50 text-[#333333] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#ffa000]/50"
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <select
                            value={filiereFilter}
                            onChange={(e) => setFiliereFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-900/50 text-[#333333] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#ffa000]/50 appearance-none"
                        >
                            <option value="ALL">Toutes les filières</option>
                            {filieres.map(f => (
                                <option key={f as string} value={f as string}>{f as string}</option>
                            ))}
                        </select>
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <select
                            value={semestreFilter}
                            onChange={(e) => setSemestreFilter(e.target.value)}
                            className="pl-10 pr-8 py-2 border border-gray-200 dark:border-zinc-800 rounded-xl bg-gray-50 dark:bg-zinc-900/50 text-[#333333] dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#ffa000]/50 appearance-none"
                        >
                            <option value="ALL">Tous les semestres</option>
                            <option value="S1">Semestre 1</option>
                            <option value="S2">Semestre 2</option>
                            <option value="S3">Semestre 3</option>
                            <option value="S4">Semestre 4</option>
                            <option value="S5">Semestre 5</option>
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-zinc-900/50 text-gray-500 dark:text-zinc-400 text-sm border-b border-gray-100 dark:border-zinc-800/50">
                                <th className="p-4 font-semibold rounded-tl-xl">Matière</th>
                                <th className="p-4 font-semibold">Semestre</th>
                                <th className="p-4 font-semibold">Niveau</th>
                                <th className="p-4 font-semibold text-center">Séances</th>
                                <th className="p-4 font-semibold">Statut</th>
                                <th className="p-4 font-semibold rounded-tr-xl">Enseignant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-zinc-400">
                                        <div className="animate-spin inline-block w-6 h-6 border-2 border-[#ffa000] border-t-transparent rounded-full"></div>
                                        <p className="mt-2">Chargement des données...</p>
                                    </td>
                                </tr>
                            ) : groups.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-gray-500 dark:text-zinc-400">
                                        Aucune matière trouvée.
                                    </td>
                                </tr>
                            ) : (
                                groups.map((g, idx) => (
                                    <tr key={`${g.matiereId}-${g.semestre}`} className="border-b border-gray-50 dark:border-zinc-800/50 hover:bg-gray-50 dark:hover:bg-zinc-900/50 transition-colors">
                                        <td className="p-4">
                                            <p className="font-bold text-[#042954] dark:text-zinc-100">{g.matiereNom}</p>
                                            <p className="text-xs text-gray-500 dark:text-zinc-400">{g.matiereCode}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold rounded-lg">
                                                {g.semestre}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-medium text-gray-700 dark:text-zinc-300">
                                                {g.niveauCode}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-zinc-800 text-sm font-bold text-[#333333] dark:text-zinc-300">
                                                {g.nbSeances}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            {g.enseignantId ? (
                                                <div className="flex items-center gap-1.5 text-green-600 dark:text-green-400 text-sm font-medium bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-md w-max">
                                                    <CheckCircle2 size={16} /> Assigné
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 text-sm font-medium bg-orange-50 dark:bg-orange-900/20 px-2 py-1 rounded-md w-max">
                                                    <AlertCircle size={16} /> Non assigné
                                                </div>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <select
                                                className={`w-full p-2 border rounded-xl text-sm transition-colors ${g.enseignantId ? 'border-gray-200 dark:border-zinc-700 bg-white dark:bg-zinc-800' : 'border-orange-200 dark:border-orange-900/50 bg-orange-50 dark:bg-orange-900/10'}`}
                                                value={g.enseignantId || ""}
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        handleAssign(g.matiereId, g.semestre, parseInt(e.target.value));
                                                    }
                                                }}
                                                disabled={processingId === g.matiereId}
                                            >
                                                <option value="" disabled>Sélectionner un enseignant</option>
                                                {enseignants.map(ens => (
                                                    <option key={ens.id} value={ens.id}>
                                                        {ens.nom} {ens.prenom}
                                                    </option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
