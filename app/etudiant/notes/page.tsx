"use client";

import { useEffect, useState } from "react";
import { FileText, Award, BookOpen, AlertCircle } from "lucide-react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Note {
    id: number;
    matiere: string;
    note: number;
    type: string;
    semestre: string;
    commentaire: string;
}

export default function EtudiantNotesPage() {
    const router = useRouter();
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNotes = async () => {
            const token = sessionStorage.getItem("token");
            if (!token) {
                router.push("/login");
                return;
            }

            try {
                // Assuming there might be an endpoint for student notes
                // If not, we'll handle the error and show a placeholder
                const data = await api.get("/api/etudiant/notes");
                if (data && Array.isArray(data)) {
                    setNotes(data);
                } else if (data && Array.isArray(data.content)) {
                    setNotes(data.content);
                } else {
                    setNotes([]);
                }
            } catch (error) {
                console.error("Notes non disponibles ou erreur API", error);
                setNotes([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotes();
    }, [router]);

    const getNoteColor = (note: number) => {
        if (note >= 16) return "text-green-600 border-green-200 bg-green-50";
        if (note >= 12) return "text-blue-600 border-blue-200 bg-blue-50";
        if (note >= 10) return "text-yellow-600 border-yellow-200 bg-yellow-50";
        return "text-red-600 border-red-200 bg-red-50";
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-[#042954]"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in">
            <div>
                <h1 className="text-2xl font-bold text-[#042954] tracking-tight">Mes Notes & Résultats</h1>
                <p className="text-sm text-gray-500 mt-1">Consultez vos relevés de notes par matière et semestre</p>
            </div>

            {notes.length === 0 ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center flex flex-col items-center justify-center gap-4">
                    <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center text-blue-500">
                        <FileText size={40} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-[#042954]">Aucune note publiée</h3>
                        <p className="text-gray-500 max-w-sm mx-auto mt-2">
                            Vos notes n&apos;ont pas encore été enregistrées par vos enseignants ou ne sont pas encore publiées par l&apos;administration.
                        </p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {notes.map((note) => (
                        <div key={note.id} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5 border-b border-gray-50 flex justify-between items-start">
                                <div>
                                    <span className="text-[10px] font-bold text-blue-500 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">{note.semestre}</span>
                                    <h3 className="font-bold text-[#042954] mt-1 line-clamp-1">{note.matiere}</h3>
                                </div>
                                <div className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center font-bold text-lg ${getNoteColor(note.note)}`}>
                                    {note.note.toFixed(2)}
                                </div>
                            </div>
                            <div className="p-5 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-400">Type d&apos;évaluation</span>
                                    <span className="font-semibold text-gray-700 uppercase text-xs">{note.type}</span>
                                </div>
                                {note.commentaire && (
                                    <div className="bg-gray-50 rounded-lg p-3 text-xs text-gray-500 italic">
                                        &ldquo;{note.commentaire}&rdquo;
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Disclaimer */}
            <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-xl border border-orange-100 text-orange-700 text-sm">
                <AlertCircle size={20} className="flex-shrink-0" />
                <p>
                    <strong>Note :</strong> Ces résultats sont fournis à titre indicatif. Seuls les relevés de notes officiels délivrés par l&apos;administration font foi.
                </p>
            </div>
        </div>
    );
}
