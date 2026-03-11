"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function CreateEtudiantPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        email: "",
        telephone: "",
        dateNaissance: "",
        adresse: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Extraire dateNaissance pour ne pas l'envoyer si c'est vide (évite erreur 500 du Parser Date backend)
            const { dateNaissance, ...restPayload } = formData;
            const payload = dateNaissance ? formData : restPayload;

            await api.post("/api/admin/etudiants", payload);
            toast.success("L'étudiant a été ajouté avec succès.");
            router.push("/admin/etudiants");
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la création de l'étudiant.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/admin/etudiants"
                    className="p-2 bg-white rounded-full border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm text-gray-500"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-[#042954] tracking-tight">Ajouter un étudiant</h1>
                    <p className="text-sm text-gray-500">Renseignez les informations du nouvel étudiant</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                                placeholder="Prenom"
                            />
                        </div>

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
                                placeholder="Nom"
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
                                placeholder="prenom.nom@gmail.com"
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
                                placeholder="ex: +216 99 999 999"
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
                            placeholder="ex: 123 Rue de la République, 75001 Tunis"
                        ></textarea>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                        <Link
                            href="/admin/etudiants"
                            className="px-6 py-3 font-semibold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors text-sm"
                        >
                            Annuler
                        </Link>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className={`px-8 py-3 rounded-lg font-bold text-white transition-all shadow-md flex items-center gap-2 text-sm ${isLoading ? 'bg-[#ffc166] cursor-not-allowed' : 'bg-[#ffa000] hover:bg-[#ff8f00]'
                                }`}
                        >
                            <Save size={18} />
                            {isLoading ? "Création..." : "Créer l'étudiant"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
