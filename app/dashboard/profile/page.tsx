"use client";

import { useEffect, useState, useRef } from "react";
import { 
    User, Camera, Phone, Mail, Lock, Eye, EyeOff, 
    Save, X, Loader2, BadgeCheck, ShieldCheck 
} from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

const API_URL = "http://localhost:8080";

interface UserProfile {
    id: number;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    role: string;
    roles?: string[];
    photo?: string;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imgError, setImgError] = useState(false);

    // Form states for personal info
    const [formData, setFormData] = useState({
        nom: "",
        prenom: "",
        telephone: ""
    });

    // Form states for password
    const [passwordData, setPasswordData] = useState({
        ancienPassword: "",
        nouveauPassword: "",
        confirmPassword: ""
    });
    const [showPasswords, setShowPasswords] = useState({
        ancien: false,
        nouveau: false,
        confirm: false
    });

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchProfile = async () => {
        const token = sessionStorage.getItem("token");
        if (!token) {
            router.push("/login");
            return;
        }

        try {
            const role = sessionStorage.getItem("role");
            if (role === "ROLE_ADMIN") {
                router.push("/dashboard");
                return;
            }

            const data = await api.get("/api/profile");
            setUser(data);
            setImgError(false); // Reset error on fetch
            setFormData({
                nom: data.nom || "",
                prenom: data.prenom || "",
                telephone: data.telephone || ""
            });
        } catch (error: any) {
            toast.error("Erreur lors du chargement du profil.");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // --- Personal Info Handlers ---
    const handleInfoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleInfoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await api.put("/api/profile", {
                nom: formData.nom,
                prenom: formData.prenom,
                telephone: formData.telephone
            });
            toast.success("Profil mis à jour avec succès !");
            setIsEditing(false);
            // Update local user state
            if (user) {
                setUser({ ...user, ...formData });
            }
        } catch (error: any) {
            toast.error(error.message || "Erreur lors de la mise à jour.");
        } finally {
            setIsSaving(false);
        }
    };

    const cancelEditing = () => {
        if (user) {
            setFormData({
                nom: user.nom || "",
                prenom: user.prenom || "",
                telephone: user.telephone || ""
            });
        }
        setIsEditing(false);
    };

    // --- Photo Handlers ---
    const handlePhotoClick = () => {
        fileInputRef.current?.click();
    };

    const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith("image/")) {
            toast.error("Veuillez sélectionner une image.");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("L'image est trop lourde (max 5 Mo).");
            return;
        }

        setIsUploading(true);
        const token = sessionStorage.getItem("token");
        const formData = new FormData();
        formData.append("photo", file);

        try {
            const response = await fetch(`${API_URL}/api/profile/photo`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`
                },
                body: formData
            });

            if (!response.ok) throw new Error("Erreur upload photo");

            const data = await response.json();
            toast.success("Photo de profil mise à jour !");
            if (user) {
                setUser({ ...user, photo: data.photo });
            }
            // Optional: refresh to ensure links everywhere are updated
            // window.location.reload(); 
        } catch (error) {
            toast.error("Erreur lors de l'upload de la photo.");
            console.error(error);
        } finally {
            setIsUploading(false);
        }
    };

    // --- Password Handlers ---
    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setPasswordData(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (passwordData.nouveauPassword.length < 6) {
            toast.error("Le nouveau mot de passe doit faire au moins 6 caractères.");
            return;
        }
        if (passwordData.nouveauPassword !== passwordData.confirmPassword) {
            toast.error("Les nouveaux mots de passe ne correspondent pas.");
            return;
        }

        setIsSaving(true);
        try {
            await api.put("/api/profile/password", {
                ancienPassword: passwordData.ancienPassword,
                nouveauPassword: passwordData.nouveauPassword
            });
            toast.success("Mot de passe modifié avec succès !");
            // Clear form
            setPasswordData({
                ancienPassword: "",
                nouveauPassword: "",
                confirmPassword: ""
            });
        } catch (error: any) {
            toast.error(error.message || "Erreur : vérifiez votre ancien mot de passe.");
        } finally {
            setIsSaving(false);
        }
    };

    const getInitials = () => {
        if (!user) return "??";
        const f = user.prenom?.charAt(0) || "";
        const l = user.nom?.charAt(0) || "";
        return (f + l).toUpperCase() || "U";
    };

    const getDisplayRole = () => {
        if (!user) return "";
        const role = user.role || (user.roles && user.roles[0]) || "";
        return role.replace("ROLE_", "");
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-[#042954]" />
                <p className="text-gray-500 font-medium">Chargement de votre profil...</p>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-extrabold text-[#042954] tracking-tight">Mon Profil</h1>
                <p className="text-gray-500 mt-1">Gérez vos informations personnelles et la sécurité de votre compte.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* ─── LEFT: PHOTO SECTION ─── */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 flex flex-col items-center text-center">
                        <div className="relative group cursor-pointer mb-6" onClick={handlePhotoClick}>
                            <div className={`w-[140px] h-[140px] rounded-full border-4 border-white shadow-xl overflow-hidden flex items-center justify-center transition-transform group-hover:scale-105 ${!user?.photo ? 'bg-[#042954]' : ''}`}>
                                {isUploading ? (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                                        <Loader2 className="w-8 h-8 animate-spin text-white" />
                                    </div>
                                ) : null}
                                
                                {user?.photo && !imgError ? (
                                    <img 
                                        src={user.photo.startsWith('http') ? user.photo : `${API_URL}${user.photo.startsWith('/') ? '' : '/'}${user.photo}`} 
                                        alt="Profile" 
                                        className="w-full h-full object-cover"
                                        onError={() => setImgError(true)}
                                    />
                                ) : (
                                    <span className="text-4xl font-black text-white">{getInitials()}</span>
                                )}

                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Camera className="text-white w-8 h-8" />
                                </div>
                            </div>
                            
                            <button className="absolute bottom-1 right-1 bg-[#ffa000] p-2.5 rounded-full text-white border-2 border-white shadow-lg hover:bg-[#ff8f00] transition-colors">
                                <Camera size={16} />
                            </button>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*" 
                                onChange={handlePhotoChange}
                            />
                        </div>

                        <h2 className="text-2xl font-bold text-[#042954] mb-1">{user?.prenom} {user?.nom}</h2>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                            <ShieldCheck size={14} />
                            Espace {getDisplayRole()}
                        </div>
                        <p className="text-gray-400 text-sm mb-6">{user?.email}</p>

                        <button 
                            onClick={handlePhotoClick}
                            disabled={isUploading}
                            className="text-sm font-bold text-[#03a9f4] hover:underline flex items-center gap-2 disabled:opacity-50"
                        >
                            {isUploading ? "Envoi en cours..." : "Changer la photo de profil"}
                        </button>
                    </div>

                    <div className="bg-gradient-to-br from-[#042954] to-[#03a9f4] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2">
                            <BadgeCheck className="text-[#ffa000]" />
                            Compte Vérifié
                        </h3>
                        <p className="text-white/80 text-sm leading-relaxed">
                            Votre compte est rattaché à l&apos;institution académique. Pour toute modification d&apos;email ou de rôle, veuillez contacter l&apos;administration.
                        </p>
                    </div>
                </div>

                {/* ─── RIGHT: INFO + PASSWORD ─── */}
                <div className="lg:col-span-2 space-y-8">
                    
                    {/* Section 2: Informations personnelles */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                                    <User size={24} />
                                </div>
                                <h3 className="text-xl font-bold text-[#042954]">Informations personnelles</h3>
                            </div>
                            {!isEditing && (
                                <button 
                                    onClick={() => setIsEditing(true)}
                                    className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors"
                                >
                                    Modifier
                                </button>
                            )}
                        </div>

                        <form onSubmit={handleInfoSubmit} className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        Nom
                                    </label>
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            name="nom"
                                            value={formData.nom}
                                            onChange={handleInfoChange}
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all"
                                        />
                                    ) : (
                                        <p className="text-gray-900 font-medium px-4 py-3 bg-gray-50 rounded-xl border border-transparent">{user?.nom}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Prénom</label>
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            name="prenom"
                                            value={formData.prenom}
                                            onChange={handleInfoChange}
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all"
                                        />
                                    ) : (
                                        <p className="text-gray-900 font-medium px-4 py-3 bg-gray-50 rounded-xl border border-transparent">{user?.prenom}</p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                                        Téléphone
                                    </label>
                                    {isEditing ? (
                                        <input 
                                            type="text" 
                                            name="telephone"
                                            value={formData.telephone}
                                            onChange={handleInfoChange}
                                            placeholder="Ex: 21 000 000"
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all"
                                        />
                                    ) : (
                                        <p className="text-gray-900 font-medium px-4 py-3 bg-gray-50 rounded-xl border border-transparent">
                                            {user?.telephone || <span className="text-gray-400 italic font-normal">Non renseigné</span>}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Adresse Email (lecture seule)</label>
                                    <p className="flex items-center gap-2 text-gray-500 font-medium px-4 py-3 bg-gray-100 rounded-xl border border-gray-100 cursor-not-allowed">
                                        <Mail size={16} />
                                        {user?.email}
                                    </p>
                                </div>
                            </div>

                            {isEditing && (
                                <div className="mt-10 pt-6 border-t border-gray-100 flex items-center justify-end gap-4">
                                    <button 
                                        type="button" 
                                        onClick={cancelEditing}
                                        className="px-6 py-2.5 font-bold text-gray-500 hover:bg-gray-50 rounded-lg transition-colors"
                                    >
                                        Annuler
                                    </button>
                                    <button 
                                        type="submit"
                                        disabled={isSaving}
                                        className="bg-[#042954] hover:bg-[#0a3a71] text-white px-8 py-2.5 rounded-lg font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                        {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Save size={18} />}
                                        Enregistrer
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>

                    {/* Section 3: Changer mot de passe */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                            <div className="p-3 bg-orange-50 text-orange-600 rounded-xl">
                                <Lock size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-[#042954]">Sécurité & Mot de passe</h3>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2 space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Ancien mot de passe</label>
                                    <div className="relative">
                                        <input 
                                            type={showPasswords.ancien ? "text" : "password"}
                                            name="ancienPassword"
                                            value={passwordData.ancienPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all pr-12"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPasswords({...showPasswords, ancien: !showPasswords.ancien})}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.ancien ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Nouveau mot de passe</label>
                                    <div className="relative">
                                        <input 
                                            type={showPasswords.nouveau ? "text" : "password"}
                                            name="nouveauPassword"
                                            value={passwordData.nouveauPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all pr-12"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPasswords({...showPasswords, nouveau: !showPasswords.nouveau})}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.nouveau ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-wider font-bold">Minimum 6 caractères</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Confirmer le nouveau mot de passe</label>
                                    <div className="relative">
                                        <input 
                                            type={showPasswords.confirm ? "text" : "password"}
                                            name="confirmPassword"
                                            value={passwordData.confirmPassword}
                                            onChange={handlePasswordChange}
                                            required
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white transition-all pr-12"
                                        />
                                        <button 
                                            type="button"
                                            onClick={() => setShowPasswords({...showPasswords, confirm: !showPasswords.confirm})}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button 
                                    type="submit"
                                    disabled={isSaving}
                                    className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="animate-spin w-5 h-5" /> : <Lock size={18} />}
                                    Mettre à jour le mot de passe
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
