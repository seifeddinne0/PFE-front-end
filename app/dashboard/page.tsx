"use client";

import { BookOpen, Calendar, FileText, Bell } from "lucide-react";

export default function DashboardPage() {
    return (
        <>
            {/* Welcome Banner */}
            <div className="mb-8 relative overflow-hidden rounded-2xl bg-[#042954] text-white p-8 shadow-lg">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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
                        <h3 className="text-gray-500 text-sm font-medium">Prochain Cours</h3>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Calendar size={18} /></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-extrabold text-[#042954]">10h30</span>
                        <span className="text-sm text-gray-400 font-medium mb-1">Salle B12</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Évaluations</h3>
                        <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><FileText size={18} /></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-extrabold text-[#042954]">2</span>
                        <span className="text-sm text-orange-500 font-medium mb-1">À venir</span>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-gray-500 text-sm font-medium">Moyenne</h3>
                        <div className="p-2 bg-green-50 text-green-600 rounded-lg"><BookOpen size={18} /></div>
                    </div>
                    <div className="flex items-end gap-3">
                        <span className="text-3xl font-extrabold text-[#042954]">14.5</span>
                        <span className="text-sm text-[#4caf50] font-medium mb-1">/20</span>
                    </div>
                </div>
            </div>

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
                                <p className="text-sm font-medium text-[#333333]">Nouvelle note ajoutée en Mathématiques.</p>
                                <p className="text-xs text-gray-500 mt-1">Il y a {item * 2} heures</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}
