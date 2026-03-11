"use client";

import { BookOpen, Calendar, FileText, Bell, AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function EnseignantDashboardPage() {
    return (
        <div className="animate-in fade-in space-y-8">
            {/* Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-[#042954] text-white p-8 shadow-lg">
                <div className="absolute top-[-20%] right-[-5%] w-[40%] h-[150%] rounded-full bg-[#03a9f4]/20 blur-[60px]" />
                <div className="absolute bottom-[-20%] left-[-5%] w-[30%] h-[100%] rounded-full bg-[#ffa000]/20 blur-[60px]" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h2 className="text-3xl font-extrabold mb-2">Bienvenue sur votre espace ! 👋</h2>
                        <p className="text-white/80 max-w-xl">
                            Ceci est votre tableau de bord principal. Vous pouvez retrouver ici un aperçu de vos activités récentes, vos cours et vos notifications.
                        </p>
                    </div>
                    <button className="bg-[#ffa000] hover:bg-[#ff8f00] text-white font-bold py-3 px-6 rounded-lg transition-colors shadow-md whitespace-nowrap">
                        Voir mon profil
                    </button>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Total Cours</h3>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><BookOpen size={18} /></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-extrabold text-[#042954]">12</span>
                        <span className="text-sm text-gray-400 font-medium mb-1">Inscrits</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Saisies de Notes</h3>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><FileText size={18} /></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-extrabold text-[#042954]">142</span>
                        <span className="text-sm text-gray-400 font-medium mb-1">Effectuées</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Absences Renseignées</h3>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle size={18} /></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-extrabold text-[#042954]">38</span>
                        <span className="text-sm text-orange-500 font-medium mb-1">Ce mois</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Prochain Cours</h3>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={18} /></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-extrabold text-[#042954]">10h30</span>
                        <span className="text-sm text-purple-500 font-medium mb-1">Salle B12</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity Section */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-[#042954]">Activités récentes</h3>
                        <button className="text-sm font-semibold text-[#03a9f4] hover:underline">Tout voir</button>
                    </div>

                    <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                            <div key={item} className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100">
                                <div className="w-10 h-10 rounded-full bg-[#e3f2fd] flex items-center justify-center text-[#03a9f4] flex-shrink-0 mt-1">
                                    <Bell size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-[#333333]">Rappel de saisie des notes : DS Mathématiques.</p>
                                    <p className="text-xs text-gray-500 mt-1">Il y a {item * 2} heures</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Actions Rapides */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-[#042954]">Actions Rapides</h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Link href="/enseignant/notes/create" className="p-4 border rounded-lg hover:border-[#ffa000] hover:bg-orange-50 transition-colors flex flex-col items-center justify-center gap-2 text-[#333333] group">
                            <div className="p-3 bg-orange-100 rounded-full group-hover:bg-[#ffa000] transition-colors">
                                <FileText className="text-[#ffa000] group-hover:text-white" size={24} />
                            </div>
                            <span className="font-semibold text-sm mt-2">Saisir une Note</span>
                        </Link>

                        <Link href="/enseignant/absences" className="p-4 border rounded-lg hover:border-[#03a9f4] hover:bg-blue-50 transition-colors flex flex-col items-center justify-center gap-2 text-[#333333] group">
                            <div className="p-3 bg-blue-100 rounded-full group-hover:bg-[#03a9f4] transition-colors">
                                <AlertTriangle className="text-[#03a9f4] group-hover:text-white" size={24} />
                            </div>
                            <span className="font-semibold text-sm mt-2">Signaler Absence</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
