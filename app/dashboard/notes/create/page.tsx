"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Etudiant {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
}

interface Matiere {
    id: number;
    nom: string;
    code: string;
}

const TYPES_NOTE = [
    { value: "EXAMEN", label: "Examen" },
    { value: "CONTROLE", label: "Contrôle Continu (CC)" },
    { value: "TP", label: "Travaux Pratiques (TP)" },
    { value: "PROJET", label: "Projet" },
];

const SEMESTRES = ["S1", "S2", "S3", "S4", "S5", "S6"];

export default function CreateNotePage() {
    const router = useRouter();
    const [etudiants, setEtudiants] = useState<Etudiant[]>([]);
    const [matieres, setMatieres] = useState<Matiere[]>([]);
    const [isFetchingData, setIsFetchingData] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        etudiantId: "",
        matiereId: "",
        note: "",
        type: "EXAMEN",
        semestre: "S1",
        commentaire: ""
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [etudiantsData, matieresData] = await Promise.all([
                    api.get("/api/admin/etudiants"),
                    api.get("/api/admin/matieres")
                ]);

                if (etudiantsData && Array.isArray(etudiantsData.content)) {
                    setEtudiants(etudiantsData.content);
                } else if (Array.isArray(etudiantsData)) {
                    setEtudiants(etudiantsData);
                }

                if (matieresData && Array.isArray(matieresData.content)) {
                    setMatieres(matieresData.content);
                } else if (Array.isArray(matieresData)) {
                    setMatieres(matieresData);
                }
            } catch {
                toast.error("Erreur lors du chargement des données.");
            } finally {
                setIsFetchingData(false);
            }
        };

        fetchData();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const noteValue = parseFloat(formData.note);
        if (isNaN(noteValue) || noteValue < 0 || noteValue > 20) {
            toast.error("La note doit être comprise entre 0 et 20.");
            return;
        }

        setIsSubmitting(true);
        try {
            await api.post("/api/enseignant/notes", {
                etudiantId: parseInt(formData.etudiantId),
                matiereId: parseInt(formData.matiereId),
                note: noteValue,
                type: formData.type,
                semestre: formData.semestre,
                commentaire: formData.commentaire
            });
            toast.success("Note enregistrée avec succès.");
            router.push("/dashboard/notes");
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de l'enregistrement de la note.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isFetchingData) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#ffa000]"></div>
            </div>
        );
    }

    const inputCls = "w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all text-sm";

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/dashboard/notes"
                    className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm text-gray-500"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-[#042954] tracking-tight">Saisir une Note</h1>
                    <p className="text-sm text-gray-500">Enregistrez les résultats d&apos;un étudiant</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Étudiant */}
                        <div className="space-y-2">
                            <label htmlFor="etudiantId" className="text-sm font-bold text-[#333333]">Étudiant <span className="text-red-500">*</span></label>
                            <select id="etudiantId" name="etudiantId" required value={formData.etudiantId} onChange={handleChange} className={inputCls}>
                                <option value="">Sélectionner un étudiant</option>
                                {etudiants.map(e => (
                                    <option key={e.id} value={e.id}>{e.nom} {e.prenom} ({e.matricule})</option>
                                ))}
                            </select>
                        </div>

                        {/* Matière */}
                        <div className="space-y-2">
                            <label htmlFor="matiereId" className="text-sm font-bold text-[#333333]">Matière <span className="text-red-500">*</span></label>
                            <select id="matiereId" name="matiereId" required value={formData.matiereId} onChange={handleChange} className={inputCls}>
                                <option value="">Sélectionner une matière</option>
                                {matieres.map(m => (
                                    <option key={m.id} value={m.id}>{m.nom} {m.code ? `(${m.code})` : ""}</option>
                                ))}
                            </select>
                        </div>

                        {/* Note */}
                        <div className="space-y-2">
                            <label htmlFor="note" className="text-sm font-bold text-[#333333]">Note (0 - 20) <span className="text-red-500">*</span></label>
                            <input id="note" name="note" type="number" step="0.5" min="0" max="20" required value={formData.note} onChange={handleChange} className={inputCls} placeholder="15.5" />
                        </div>

                        {/* Type */}
                        <div className="space-y-2">
                            <label htmlFor="type" className="text-sm font-bold text-[#333333]">Type de Note <span className="text-red-500">*</span></label>
                            <select id="type" name="type" required value={formData.type} onChange={handleChange} className={inputCls}>
                                {TYPES_NOTE.map(t => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Semestre */}
                        <div className="space-y-2">
                            <label htmlFor="semestre" className="text-sm font-bold text-[#333333]">Semestre <span className="text-red-500">*</span></label>
                            <select id="semestre" name="semestre" required value={formData.semestre} onChange={handleChange} className={inputCls}>
                                {SEMESTRES.map(s => (
                                    <option key={s} value={s}>Semestre {s}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Commentaire */}
                    <div className="space-y-2">
                        <label htmlFor="commentaire" className="text-sm font-bold text-[#333333]">Commentaire</label>
                        <textarea id="commentaire" name="commentaire" rows={3} value={formData.commentaire} onChange={handleChange} className={`${inputCls} resize-none`} placeholder="Commentaire optionnel sur la note..."></textarea>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                        <Link
                            href="/dashboard/notes"
                            className="px-6 py-3 font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className={`px-8 py-3 rounded-lg font-bold text-white transition-all shadow-md flex items-center gap-2 text-sm ${isSubmitting ? 'bg-[#ffc166] cursor-not-allowed' : 'bg-[#ffa000] hover:bg-[#ff8f00]'}`}
                        >
                            <Save size={18} />
                            {isSubmitting ? "Enregistrement..." : "Enregistrer la note"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
