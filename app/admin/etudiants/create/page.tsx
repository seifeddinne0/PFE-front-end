"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function CreateEtudiantPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [classes, setClasses] = useState<any[]>([]);
    const [filieres, setFilieres] = useState<any[]>([]);
    const [selectedFiliere, setSelectedFiliere] = useState("");
    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        email: "",
        password: "",
        telephone: "",
        dateNaissance: "",
        adresse: "",
        classeId: ""
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [classesData, filieresData] = await Promise.all([
                    api.get("/api/admin/classes"),
                    api.get("/api/admin/filieres")
                ]);
                setClasses(classesData);
                setFilieres(filieresData);
            } catch (error) {
                console.error("Erreur lors du chargement des données");
            }
        };
        fetchData();
    }, []);

    const filteredClasses = selectedFiliere 
        ? classes.filter(c => c.filiereCode === selectedFiliere) 
        : [];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Extraire dateNaissance pour ne pas l'envoyer si c'est vide (évite erreur 500 du Parser Date backend)
            const { dateNaissance, classeId, ...restPayload } = formData;
            const payload: any = dateNaissance ? { ...restPayload, dateNaissance } : restPayload;
            if (classeId) {
                payload.classeId = parseInt(classeId);
            }

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
                    className="p-2 bg-white dark:bg-slate-800 rounded-full border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors shadow-sm text-gray-500 dark:text-slate-400"
                >
                    <ArrowLeft size={20} />
                </Link>
                <div>
                    <h1 className="text-[#042954] dark:text-whitexl font-bold text-[#042954] dark:text-white tracking-tight">Ajouter un étudiant</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Renseignez les informations du nouvel étudiant</p>
                </div>
            </div>

            {/* Form */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Prénom */}
                        <div className="space-y-2">
                            <label htmlFor="prenom" className="text-sm font-bold text-[#333333] dark:text-slate-100">Prénom <span className="text-red-500">*</span></label>
                            <input
                                id="prenom"
                                name="prenom"
                                type="text"
                                required
                                value={formData.prenom}
                                onChange={handleChange}
                                className="w-full bg-[#f8f9fa] dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white dark:focus:bg-slate-800 transition-all text-sm dark:text-slate-200"
                                placeholder="Prenom"
                            />
                        </div>

                        {/* Nom */}
                        <div className="space-y-2">
                            <label htmlFor="nom" className="text-sm font-bold text-[#333333] dark:text-slate-200">Nom <span className="text-red-500">*</span></label>
                            <input
                                id="nom"
                                name="nom"
                                type="text"
                                required
                                value={formData.nom}
                                onChange={handleChange}
                                className="w-full bg-[#f8f9fa] dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white dark:focus:bg-slate-800 transition-all text-sm dark:text-slate-200"
                                placeholder="Nom"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <label htmlFor="email" className="text-sm font-bold text-[#333333] dark:text-slate-200">Adresse Email <span className="text-red-500">*</span></label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full bg-[#f8f9fa] dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white dark:focus:bg-slate-800 transition-all text-sm dark:text-slate-200"
                                placeholder="prenom.nom@gmail.com"
                            />
                        </div>

                        {/* Mot de passe */}
                        <div className="space-y-2">
                            <label htmlFor="password" className="text-sm font-bold text-[#333333] dark:text-slate-200">Mot de passe <span className="text-red-500">*</span></label>
                            <div className="relative">
                                <input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="w-full bg-[#f8f9fa] dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white dark:focus:bg-slate-800 transition-all text-sm pr-12 dark:text-slate-200"
                                    placeholder="Minimum 6 caractères"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {/* Téléphone */}
                        <div className="space-y-2">
                            <label htmlFor="telephone" className="text-sm font-bold text-[#333333] dark:text-slate-200">Téléphone</label>
                            <input
                                id="telephone"
                                name="telephone"
                                type="tel"
                                value={formData.telephone}
                                onChange={handleChange}
                                className="w-full bg-[#f8f9fa] dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white dark:focus:bg-slate-800 transition-all text-sm dark:text-slate-200"
                                placeholder="ex: +216 99 999 999"
                            />
                        </div>

                        {/* Date de naissance */}
                        <div className="space-y-2">
                            <label htmlFor="dateNaissance" className="text-sm font-bold text-[#333333] dark:text-slate-200">Date de Naissance</label>
                            <input
                                id="dateNaissance"
                                name="dateNaissance"
                                type="date"
                                value={formData.dateNaissance}
                                onChange={handleChange}
                                className="w-full bg-[#f8f9fa] dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white dark:focus:bg-slate-800 transition-all text-sm text-gray-700 dark:text-slate-200"
                            />
                        </div>

                        {/* Filière */}
                        <div className="space-y-2">
                            <label htmlFor="filiere" className="text-sm font-bold text-[#333333] dark:text-slate-200">Filière</label>
                            <select
                                id="filiere"
                                value={selectedFiliere}
                                onChange={(e) => {
                                    setSelectedFiliere(e.target.value);
                                    setFormData(prev => ({ ...prev, classeId: "" })); // Reset classe
                                }}
                                className="w-full bg-[#f8f9fa] dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white dark:focus:bg-slate-800 transition-all text-sm dark:text-slate-200"
                            >
                                <option value="">-- Sélectionner une filière --</option>
                                {filieres.map((fil) => (
                                    <option key={fil.id} value={fil.code}>
                                        {fil.code} - {fil.nom}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Classe */}
                        <div className="space-y-2">
                            <label htmlFor="classeId" className="text-sm font-bold text-[#333333] dark:text-slate-200">Classe</label>
                            <select
                                id="classeId"
                                name="classeId"
                                value={formData.classeId}
                                onChange={handleChange as any}
                                required
                                disabled={!selectedFiliere}
                                className="w-full bg-[#f8f9fa] dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white dark:focus:bg-slate-800 transition-all text-sm dark:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <option value="">-- Sélectionner une classe --</option>
                                {filteredClasses.map((cls) => (
                                    <option key={cls.id} value={cls.id}>
                                        {cls.code} - {cls.nom}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Adresse */}
                    <div className="space-y-2">
                        <label htmlFor="adresse" className="text-sm font-bold text-[#333333] dark:text-slate-100">Adresse Complète</label>
                        <textarea
                            id="adresse"
                            name="adresse"
                            rows={3}
                            value={formData.adresse}
                            onChange={handleChange}
                            className="w-full bg-[#f8f9fa] dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white dark:focus:bg-slate-800 transition-all text-sm resize-none dark:text-slate-200"
                            placeholder="ex: 123 Rue de la République, 75001 Tunis"
                        ></textarea>
                    </div>

                    {/* Actions */}
                    <div className="pt-6 border-t border-gray-100 dark:border-slate-700 flex items-center justify-end gap-4">
                        <Link
                            href="/admin/etudiants"
                            className="px-6 py-3 font-semibold text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:bg-slate-800/50 rounded-lg transition-colors text-sm"
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
