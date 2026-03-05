import Link from "next/link";
import { GraduationCap, Users, BookOpen, Calendar, ArrowRight, CheckCircle, Monitor, Shield, Award } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen font-sans bg-[#f0f1f3] text-[#333333]">
      {/* Navigation */}
      <nav className="bg-[#042954] text-white py-4 px-6 md:px-12 flex items-center justify-between sticky top-0 z-50 shadow-md">
        <div className="flex items-center gap-2">
          <div className="bg-[#ffa000] p-2 rounded shadow-sm">
            <GraduationCap size={24} className="text-white" />
          </div>
          <span className="text-2xl font-bold tracking-tight">Gestion<span className="font-light text-white/80">Ac</span></span>
        </div>

        <div className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="#accueil" className="hover:text-[#ffa000] transition-colors">Accueil</Link>
          <Link href="#fonctionnalites" className="hover:text-[#ffa000] transition-colors">Fonctionnalités</Link>
          <Link href="#pour-qui" className="hover:text-[#ffa000] transition-colors">Pour Qui ?</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="text-sm font-bold bg-[#ffa000] text-white px-5 py-2.5 rounded hover:bg-[#ff8f00] transition-colors shadow-sm flex items-center gap-2">
            Se Connecter <ArrowRight size={16} />
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="accueil" className="bg-white py-20 px-6 md:px-12 border-b border-gray-200">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center gap-12">
          <div className="flex-1 space-y-8">
            <h1 className="text-4xl md:text-6xl font-extrabold text-[#042954] leading-tight">
              L&apos;excellence éducative <br />pour <span className="text-[#ffa000]">étudiants</span> et <span className="text-[#03a9f4]">professeurs</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-xl leading-relaxed">
              Un système de gestion scolaire complet, intuitif et moderne. Simplifiez la vie de votre établissement avec des outils pensés pour la réussite de tous.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login" className="bg-[#042954] text-white px-8 py-4 rounded font-bold hover:bg-[#073266] transition-colors flex items-center justify-center gap-2 shadow-lg">
                Espace Membre <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          <div className="flex-1 w-full max-w-md mx-auto relative">
            {/* Abstract visual inspired by the dashboard theme */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#4caf50] rounded-lg p-6 text-white shadow-xl transform hover:-translate-y-2 transition-transform duration-300">
                <Users size={32} className="mb-4 opacity-80" />
                <div className="text-3xl font-bold mb-1">1,000+</div>
                <div className="text-sm font-medium opacity-90">Étudiants Actifs</div>
              </div>
              <div className="bg-[#03a9f4] rounded-lg p-6 text-white shadow-xl transform translate-y-20 hover:translate-y-14 transition-transform duration-300">
                <Award size={32} className="mb-4 opacity-80" />
                <div className="text-3xl font-bold mb-1">Excellence</div>
                <div className="text-sm font-medium opacity-90">Suivi des Résultats</div>
              </div>
              <div className="bg-[#ffa000] rounded-lg p-6 text-white shadow-xl transform hover:-translate-y-2 transition-transform duration-300">
                <Shield size={32} className="mb-4 opacity-80" />
                <div className="text-3xl font-bold mb-1">100%</div>
                <div className="text-sm font-medium opacity-90">Sécurisé & Fiable</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="fonctionnalites" className="py-20 px-6 md:px-12 bg-[#f0f1f3]">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-[#042954] mb-4">Fonctionnalités Principales</h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">Tout ce dont votre institut académique a besoin, consolidé dans une interface unique au design épuré.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-white p-8 rounded border-t-4 border-[#4caf50] shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-[#4caf50]/10 w-16 h-16 rounded flex items-center justify-center mb-6 text-[#4caf50]">
                <Calendar size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#333333] mb-3">Absences & Justificatifs</h3>
              <p className="text-gray-600">Suivi de l&apos;assiduité et dépôt en ligne des justificatifs d&apos;absence.</p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-8 rounded border-t-4 border-[#03a9f4] shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-[#03a9f4]/10 w-16 h-16 rounded flex items-center justify-center mb-6 text-[#03a9f4]">
                <Award size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#333333] mb-3">Notes & Bulletins</h3>
              <p className="text-gray-600">Consultation des résultats et téléchargement des bulletins de notes officiels en PDF.</p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-8 rounded border-t-4 border-[#f44336] shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-[#f44336]/10 w-16 h-16 rounded flex items-center justify-center mb-6 text-[#f44336]">
                <BookOpen size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#333333] mb-3">Gestion des Notes</h3>
              <p className="text-gray-600">Saisie rapide et sécurisée des notes par classe et par matière.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Target Audience Section */}
      <section id="pour-qui" className="py-20 px-6 md:px-12 bg-white border-t border-gray-200">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-[#042954] mb-6">Conçu pour unir<br />étudiants et enseignants</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="mt-1 bg-[#ffa000] text-white rounded-full p-1 flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[#333333]">Pour les Étudiants</h4>
                    <p className="text-gray-600 mt-1">Une vue claire sur leur progression académique, un accès facile aux devoirs et une messagerie intégrée pour garder le contact avec leurs professeurs.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 bg-[#4caf50] text-white rounded-full p-1 flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[#333333]">Pour les Enseignants</h4>
                    <p className="text-gray-600 mt-1">Moins de papier, plus de temps pour l&apos;enseignement. Automatisez les calculs de moyennes et publiez les leçons en un clic.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="mt-1 bg-[#03a9f4] text-white rounded-full p-1 flex-shrink-0 w-6 h-6 flex items-center justify-center">
                    <CheckCircle size={14} />
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-[#333333]">Pour l&apos;Administration</h4>
                    <p className="text-gray-600 mt-1">Gérez facilement les classes, les matières, les paiements de frais de scolarité et l&apos;emploi du temps global de l&apos;établissement.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[#042954] rounded-xl p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#ffa000]/20 blur-[60px]" />
              <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#03a9f4]/20 blur-[60px]" />

              <div className="relative z-10">
                <h3 className="text-2xl font-bold mb-4">Rejoignez la révolution numérique</h3>
                <p className="mb-8 text-white/80">
                  Notre mission est de vous offrir la meilleure expérience numérique pour optimiser votre gestion quotidienne.
                </p>
                <div className="space-y-4">
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded flex items-center justify-between border border-white/10">
                    <span className="font-semibold">Bien-être et motivation (Étudiants)</span>
                    <span className="text-[#ffa000] font-bold text-xl">94%</span>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm p-4 rounded flex items-center justify-between border border-white/10">
                    <span className="font-semibold">Sérénité et satisfaction (Enseignants)</span>
                    <span className="text-[#4caf50] font-bold text-xl">98%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6 text-center bg-[#ffa000]">
        <div className="container mx-auto max-w-4xl relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 tracking-tight">Votre espace académique vous attend</h2>
          <p className="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
            Embarquez dans une nouvelle ère de l&apos;éducation. Connectez-vous dès maintenant pour vivre une expérience académique fluide, connectée et enrichissante.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/login" className="bg-[#042954] text-white px-8 py-4 rounded font-bold hover:bg-[#073266] transition-colors shadow-lg shadow-[#042954]/20 flex items-center justify-center gap-2 text-lg">
              Se Connecter <ArrowRight size={20} />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#021f42] text-white/60 py-12 px-6">
        <div className="container mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2 text-white">
            <GraduationCap size={24} className="text-[#ffa000]" />
            <span className="text-xl font-bold tracking-tight">Gestion<span className="font-light">Ac</span></span>
          </div>
          <p className="text-sm text-center md:text-left">
            © {new Date().getFullYear()} Gestion Académique. Tous droits réservés. Système de gestion scolaire.
          </p>
          <div className="flex gap-4 text-sm">
            <Link href="/aide" className="hover:text-white transition-colors">Aide</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}