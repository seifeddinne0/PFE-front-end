"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function EditEnseignantPage() {
    const router = useRouter();
    const params = useParams();
    const enseignantId = params.id;

    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(true);
    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        dateNaissance: "",
        adresse: "",
        specialite: "",
        grade: ""
    });

    useEffect(() => {
        const fetchEnseignant = async () => {
            try {
                const data = await api.get(`/api/admin/enseignants/${enseignantId}`);
                setFormData({
                    nom: data.nom || "",
                    prenom: data.prenom || "",
                    email: data.email || "",
                    telephone: data.telephone || "",
                    dateNaissance: data.dateNaissance || "",
                    adresse: data.adresse || "",
                    specialite: data.specialite || "",
                    grade: data.grade || ""
                });
            } catch (error: any) {
                toast.error("Impossible de charger les données de l'enseignant.");
                router.push("/admin/enseignants");
            } finally {
                setIsFetching(false);
            }
        };

        if (enseignantId) {
            fetchEnseignant();
        }
    }, [enseignantId, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const { dateNaissance, ...restPayload } = formData;
            const payload = dateNaissance ? formData : restPayload;

            await api.put(`/api/admin/enseignants/${enseignantId}`, payload);
            toast.success("Les informations ont été mises à jour.");
            router.push("/admin/enseignants");
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la modification.");
        } finally {
            setIsLoading(false);
        }
    };

    if (isFetching) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#ffa000]"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin/enseignants"
                    className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm text-gray-500"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-[#042954] tracking-tight">Modifier un enseignant</h1>
                    <p className="text-sm text-gray-500">Mettez à jour les informations du profil ({formData.prenom} {formData.nom})</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Nom */}
                        <div className="space-y-2">
                            <label htmlFor="nom" className="text-sm font-bold text-[#333333]">Nom <span className="text-red-500">*</span></label>
                            <input
                                id="nom"
                                name="nom"
                                type="text"
                                required
                                value={formData.nom}
                                onChange={handleChange}
                                className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all text-sm"
                            />
                        </div>

                        {/* Prénom */}
                        <div className="space-y-2">
                            <label htmlFor="prenom" className="text-sm font-bold text-[#333333]">Prénom <span className="text-red-500">*</span></label>
                            <input
                                id="prenom"
                                name="prenom"
                                type="text"
                                required
                                value={formData.prenom}
                                onChange={handleChange}
                                className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all text-sm"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-bold text-[#333333]">Adresse Email <span className="text-red-500">*</span></label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all text-sm"
                            />
                        </div>

                        {/* Téléphone */}
                        <div className="space-y-2">
                            <label htmlFor="telephone" className="text-sm font-bold text-[#333333]">Téléphone</label>
                            <input
                                id="telephone"
                                name="telephone"
                                type="tel"
                                value={formData.telephone}
                                onChange={handleChange}
                                className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all text-sm"
                            />
                        </div>

                        {/* Date de naissance */}
                        <div className="space-y-2">
                            <label htmlFor="dateNaissance" className="text-sm font-bold text-[#333333]">Date de Naissance</label>
                            <input
                                id="dateNaissance"
                                name="dateNaissance"
                                type="date"
                                value={formData.dateNaissance}
                                onChange={handleChange}
                                className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all text-sm text-gray-700"
                            />
                        </div>

                        {/* Spécialité */}
                        <div className="space-y-2">
                            <label htmlFor="specialite" className="text-sm font-bold text-[#333333]">Spécialité</label>
                            <input
                                id="specialite"
                                name="specialite"
                                type="text"
                                value={formData.specialite}
                                onChange={handleChange}
                                className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all text-sm"
                                placeholder="ex: Informatique, Mathématiques..."
                            />
                        </div>

                        {/* Grade */}
                        <div className="space-y-2">
                            <label htmlFor="grade" className="text-sm font-bold text-[#333333]">Grade</label>
                            <input
                                id="grade"
                                name="grade"
                                type="text"
                                value={formData.grade}
                                onChange={handleChange}
                                className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all text-sm"
                                placeholder="ex: Professeur, Maître de conférences..."
                            />
                        </div>
                    </div>

                    {/* Adresse */}
                    <div className="space-y-2">
                        <label htmlFor="adresse" className="text-sm font-bold text-[#333333]">Adresse Complète</label>
                        <textarea
                            id="adresse"
                            name="adresse"
                            rows={3}
                            value={formData.adresse}
                            onChange={handleChange}
                            className="w-full bg-[#f8f9fa] border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all text-sm resize-none"
                        ></textarea>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                        <Link
                            href="/admin/enseignants"
                            className="px-6 py-3 font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-8 py-3 rounded-lg font-bold text-white transition-all shadow-md flex items-center gap-2 text-sm ${isLoading ? 'bg-[#ffc166] cursor-not-allowed' : 'bg-[#03a9f4] hover:bg-[#0288d1]'
                                }`}
                        >
                            <Save size={18} />
                            {isLoading ? "Enregistrement..." : "Mettre à jour"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
