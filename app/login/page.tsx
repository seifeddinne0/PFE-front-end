import Link from "next/link";
import { GraduationCap, ArrowRight, BookOpen, Calendar, ArrowLeft } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="min-h-screen font-sans bg-[#f0f1f3] text-[#333333] flex flex-col md:flex-row">
            {/* Left Branding/Info Panel */}
            <div className="hidden md:flex md:w-1/2 bg-[#042954] text-white p-12 flex-col justify-between relative overflow-hidden">
                {/* Abstract shapes from the dashboard theme */}
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#03a9f4]/20 blur-[80px]" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#ffa000]/20 blur-[80px]" />

                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2 mb-16 hover:opacity-90 transition-opacity">
                        <div className="bg-[#ffa000] p-2 rounded shadow-sm">
                            <GraduationCap size={28} className="text-white" />
                        </div>
                        <span className="text-3xl font-bold tracking-tight">Gestion<span className="font-light text-white/80">Ac</span></span>
                    </Link>

                    <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
                        Bienvenue dans votre <span className="text-[#ffa000]">espace numérique</span>
                    </h1>
                    <p className="text-lg text-white/80 max-w-md leading-relaxed mb-12">
                        Gestion Académique relie les étudiants, les enseignants et l&apos;administration sur une seule et même plateforme intuitive.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-start gap-4">
                            <div className="bg-[#4caf50]/20 p-3 rounded-lg text-[#4caf50]">
                                <BookOpen size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Accès en temps réel</h3>
                                <p className="text-white/60 text-sm mt-1">Consultez vos notes, emplois du temps et devoirs où que vous soyez.</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-4">
                            <div className="bg-[#ffa000]/20 p-3 rounded-lg text-[#ffa000]">
                                <Calendar size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">Absences & Justificatifs</h3>
                                <p className="text-white/60 text-sm mt-1">Suivi de l&apos;assiduité et dépôt en ligne des justificatifs d&apos;absence.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="text-sm text-white/40 relative z-10">
                    © {new Date().getFullYear()} Gestion Académique.
                </div>
            </div>

            {/* Right Login Form Panel */}
            <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-24 xl:px-32 bg-white relative">
                <div className="md:hidden flex items-center gap-2 mb-12">
                    <div className="bg-[#ffa000] p-2 rounded shadow-sm">
                        <GraduationCap size={24} className="text-white" />
                    </div>
                    <span className="text-2xl font-bold tracking-tight text-[#042954]">Gestion<span className="font-light text-[#042954]/80">Ac</span></span>
                </div>

                <div className="w-full max-w-md mx-auto">
                    <div className="mb-8 flex justify-center md:justify-start">
                        <Link href="/" className="inline-flex items-center justify-center w-10 h-10 bg-[#ffa000] text-white rounded shadow-sm hover:bg-[#ff8f00] transition-colors">
                            <ArrowLeft size={20} />
                        </Link>
                    </div>

                    <div className="mb-10 text-center md:text-left">
                        <h2 className="text-3xl font-extrabold text-[#042954] mb-2 tracking-tight">Se connecter</h2>
                        <p className="text-gray-600">Entrez vos identifiants pour accéder à votre portail</p>
                    </div>

                    <form className="flex flex-col gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-[#333333]" htmlFor="email">Adresse e-mail</label>
                            <input
                                id="email"
                                type="email"
                                className="w-full bg-[#f0f1f3] border-none rounded px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#ffa000] transition-shadow text-[#333333] placeholder:text-gray-400"
                                placeholder="votre.nom@institut.edu"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-bold text-[#333333]" htmlFor="password">Mot de passe</label>
                                <Link href="#" className="text-xs font-bold text-[#03a9f4] hover:underline">Mot de passe oublié ?</Link>
                            </div>
                            <input
                                id="password"
                                type="password"
                                className="w-full bg-[#f0f1f3] border-none rounded px-4 py-3.5 outline-none focus:ring-2 focus:ring-[#ffa000] transition-shadow text-[#333333] placeholder:text-gray-400"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <div className="flex items-center gap-3 mb-2">
                            <input type="checkbox" id="remember" className="rounded text-[#ffa000] focus:ring-[#ffa000] h-5 w-5 bg-[#f0f1f3] border-none cursor-pointer" />
                            <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer font-medium">Se souvenir de moi</label>
                        </div>

                        <button type="submit" className="w-full bg-[#ffa000] text-white font-bold py-4 rounded hover:bg-[#ff8f00] transition-colors shadow-md flex items-center justify-center gap-2 text-lg">
                            Connexion à l&apos;espace
                            <ArrowRight size={18} />
                        </button>
                    </form>

                    <div className="mt-10 pt-8 border-t border-gray-100 text-center">
                        <p className="text-sm text-gray-600">
                            Besoin d&apos;aide ? <Link href="#" className="font-bold text-[#03a9f4] hover:underline">Contactez le secrétariat</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
