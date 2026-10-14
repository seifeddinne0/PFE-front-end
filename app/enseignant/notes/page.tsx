"use client";

import { useEffect, useRef, useState } from "react";
import { Save, Filter, Search, CheckCircle, RefreshCw, Users, Edit2 } from "lucide-react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Student {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    classeId: number;
    classeCode?: string;
}

interface Note {
    id: number;
    etudiantId: number;
    matiereId: number;
    valeur: number;
    typeNote: string;
    semestre: string;
    commentaire: string;
}

type NoteValues = {
    CONTROLE: { note: string, id?: number };
    TP: { note: string, id?: number };
    EXAMEN: { note: string, id?: number };
};

const SEMESTRES = ["S1", "S2", "S3", "S4", "S5"];

export default function EnseignantNotesPage() {
    const noteInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

    // Dropdown data
    const [classes, setClasses] = useState<any[]>([]);
    const [filieres, setFilieres] = useState<any[]>([]);
    const [matieres, setMatieres] = useState<any[]>([]);
    const [seances, setSeances] = useState<any[]>([]);
    const [enseignantMatieresId, setEnseignantMatieresId] = useState<number[]>([]);
    const [enseignantId, setEnseignantId] = useState<number | null>(null);
    const [canManageNotes, setCanManageNotes] = useState<boolean>(false);
    
    // Application state
    const [etudiants, setEtudiants] = useState<Student[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Selections
    const [selectedFiliere, setSelectedFiliere] = useState("");
    const [selectedNiveau, setSelectedNiveau] = useState("");
    const [selectedClasse, setSelectedClasse] = useState("");
    const [selectedMatiere, setSelectedMatiere] = useState("");
    const [selectedSemestre, setSelectedSemestre] = useState("S1");

    // Draft form state for bulk editing: Record<etudiantId, NoteValues>
    const [draftNotes, setDraftNotes] = useState<Record<number, NoteValues>>({});

    useEffect(() => {
        const initData = async () => {
            try {
                const [classesData, filieresData, matieresData, etudiantsData, notesData, seancesData, profilData] = await Promise.all([
                    api.get("/api/admin/classes").catch(() => []),
                    api.get("/api/admin/filieres").catch(() => []),
                    api.get("/api/admin/matieres").catch(() => ({ content: [] })),
                    api.get("/api/admin/etudiants?size=1000").catch(() => ({ content: [] })),
                    api.get("/api/admin/notes?page=0&size=5000").catch(() => ({ content: [] })),
                    api.get("/api/enseignant/seances").catch(() => []),
                    api.get("/api/enseignant/profil").catch(() => null)
                ]);

                if (profilData) {
                    setEnseignantId(profilData.id);
                    setCanManageNotes(Boolean(profilData.canManageNotes));
                }

                // Ensure data structures
                setClasses(Array.isArray(classesData) ? classesData : classesData.content || []);
                setFilieres(Array.isArray(filieresData) ? filieresData : filieresData.content || []);
                setMatieres(Array.isArray(matieresData) ? matieresData : matieresData.content || []);
                setEtudiants(Array.isArray(etudiantsData) ? etudiantsData : etudiantsData.content || []);
                setNotes(Array.isArray(notesData) ? notesData : notesData.content || []);
                
                // CRITICAL FIX: The API might return a paginated object { content: [...] } instead of a raw array
                const seancesArray = Array.isArray(seancesData) ? seancesData : (seancesData?.content || []);
                setSeances(seancesArray);
                const seanceMatiereIds = [...new Set(seancesArray.map((s: any) => s.matiereId))] as number[];
                setEnseignantMatieresId(seanceMatiereIds);

            } catch (error) {
                console.error("Erreur de chargement", error);
            } finally {
                setIsLoading(false);
            }
        };
        initData();
    }, []);

    // Derived lists
    const filteredNiveaux = classes
        .filter(c => c.filiereCode === selectedFiliere)
        .map(c => c.niveauCode)
        .filter((v, i, a) => a.indexOf(v) === i);

    const filteredClasses = classes.filter(
        c => c.filiereCode === selectedFiliere && c.niveauCode === selectedNiveau
    );

    // Robust student filtering accommodating missing DB relations
    const classStudents = etudiants.filter(e => {
        if (!selectedClasse) return false;
        const targetClasseObj = classes.find(c => String(c.id) === selectedClasse);
        const codeToMatch = targetClasseObj ? targetClasseObj.code : selectedClasse;
        
        return String(e.classeId) === selectedClasse || 
               (!!e.classeCode && e.classeCode === codeToMatch) ||
               (!!e.matricule && e.matricule.includes(codeToMatch));
    });

    // Matieres restricted strictly by selected Semester
    const semesterMatieres = matieres.filter(m => m.semestre === selectedSemestre);

    // Auto update selectedMatiere implicitly without user select
    useEffect(() => {
        if (!selectedClasse || !selectedSemestre) {
            setSelectedMatiere("");
            return;
        }
        
        // Find matieres assigned to this teacher for this semester AND this specific class
        const teacherMats = matieres.filter(m => {
            if (m.semestre !== selectedSemestre) return false;
            
            const isMine = enseignantMatieresId.includes(m.id) || (enseignantId && m.enseignantId === enseignantId);
            const matchesNiveau = (!selectedNiveau || m.niveauCode === selectedNiveau || String(m.niveauId) === selectedNiveau);
            
            return isMine && matchesNiveau;
        });
        
        if (teacherMats.length > 0) {
            // Find the best match: prioritize the one that has a specific seance for this classe
            const bestMatch = teacherMats.find(m => 
                seances.some(s => String(s.matiereId) === String(m.id) && String(s.classeId) === selectedClasse)
            );
            
            if (bestMatch) {
                setSelectedMatiere(String(bestMatch.id));
            } else {
                setSelectedMatiere(String(teacherMats[0].id));
            }
        } else {
            setSelectedMatiere("");
        }
    }, [selectedSemestre, selectedClasse, selectedNiveau, enseignantMatieresId, enseignantId, matieres, seances]);

    // When selections change, compute initial drafts
    useEffect(() => {
        if (!selectedClasse || !selectedMatiere) return;

        const newDrafts: Record<number, NoteValues> = {};
        
        classStudents.forEach(student => {
            const getNoteData = (type: string) => {
                const existingNote = notes.find(n => 
                    n.etudiantId === student.id &&
                    String(n.matiereId) === selectedMatiere &&
                        n.typeNote === type &&
                    n.semestre === selectedSemestre
                );
                return {
                        note: existingNote ? String(existingNote.valeur) : "",
                    id: existingNote?.id
                };
            };

            newDrafts[student.id] = {
                CONTROLE: getNoteData("CONTROLE"),
                TP: getNoteData("TP"),
                EXAMEN: getNoteData("EXAMEN")
            };
        });

        setDraftNotes(newDrafts);
    }, [selectedClasse, selectedMatiere, selectedSemestre, notes, etudiants]); 

    // Handlers
    const normalizeNoteInput = (rawValue: string): string | null => {
        const normalized = rawValue.replace(",", ".").trim();
        if (normalized === "") return "";

        if (!/^\d{0,2}(\.\d{0,2})?$/.test(normalized)) {
            return null;
        }

        const parsed = Number.parseFloat(normalized);
        if (Number.isNaN(parsed)) return "";
        if (parsed < 0) return "0";
        if (parsed > 20) return "20";
        return normalized;
    };

    const clampOnBlur = (rawValue: string): string => {
        const normalized = rawValue.replace(",", ".").trim();
        if (normalized === "") return "";

        const parsed = Number.parseFloat(normalized);
        if (Number.isNaN(parsed)) return "";

        const clamped = Math.max(0, Math.min(20, parsed));
        return String(clamped);
    };

    const handleNoteChange = (studentId: number, type: keyof NoteValues, value: string) => {
        const nextNote = normalizeNoteInput(value);
        if (nextNote === null) {
            return;
        }

        setDraftNotes(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [type]: { ...prev[studentId][type], note: nextNote }
            }
        }));

        const inputKey = `${studentId}-${type}`;
        requestAnimationFrame(() => {
            const input = noteInputRefs.current[inputKey];
            if (input && document.activeElement !== input) {
                input.focus();
            }
        });
    };

    const handleNoteBlur = (studentId: number, type: keyof NoteValues, value: string) => {
        const clamped = clampOnBlur(value);
        setDraftNotes(prev => ({
            ...prev,
            [studentId]: {
                ...prev[studentId],
                [type]: { ...prev[studentId][type], note: clamped }
            }
        }));
    };

    const handleSaveRow = async (studentId: number) => {
        if (!canManageNotes) {
            toast.error("L'administration ne vous a pas encore autorisé à gérer les notes.");
            return;
        }
        if (!selectedClasse || !selectedMatiere) return;
        setIsSaving(true);
        let successCount = 0;
        let errorCount = 0;

        const types = ["CONTROLE", "TP", "EXAMEN"] as const;
        const studentDrafts = draftNotes[studentId];
        
        if (studentDrafts) {
            for (const type of types) {
                const draft = studentDrafts[type];
                if (!draft) continue;
                
                // Allow saving "0" but skip completely empty ones that are not already saved
                if (draft.note === "" && !draft.id) continue;
                
                const existingNote = notes.find(n => n.id === draft.id);
                if (existingNote && String(existingNote.valeur) === draft.note) continue;

                if (draft.id && draft.note === "") {
                    // Empty means delete
                     try {
                         await api.delete(`/api/admin/notes/${draft.id}`);
                         successCount++;
                     } catch { errorCount++; }
                     continue;
                }

                const payload = {
                    etudiantId: studentId,
                    matiereId: parseInt(selectedMatiere),
                    valeur: parseFloat(draft.note || "0"),
                    typeNote: type,
                    semestre: selectedSemestre,
                    commentaire: ""
                };

                try {
                    if (draft.id) {
                        await api.put(`/api/admin/notes/${draft.id}`, payload);
                    } else {
                        await api.post("/api/enseignant/notes", payload);
                    }
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }
        }

        if (successCount > 0 || errorCount > 0) {
            const newNotesData = await api.get("/api/admin/notes?page=0&size=5000").catch(() => ({ content: [] }));
            setNotes(Array.isArray(newNotesData) ? newNotesData : newNotesData.content || []);
            
            if (errorCount === 0) {
                toast.success(`Notes de l'étudiant enregistrées`);
            } else {
                toast.error(`Erreur(s) lors de l'enregistrement`);
            }
        } else {
            toast("Aucune modification à enregistrer.");
        }
        setIsSaving(false);
    };

    const handleSaveAll = async () => {
        if (!canManageNotes) {
            toast.error("L'administration ne vous a pas encore autorisé à gérer les notes.");
            return;
        }
        if (!selectedClasse || !selectedMatiere) return;
        setIsSaving(true);
        let successCount = 0;
        let errorCount = 0;

        const types = ["CONTROLE", "TP", "EXAMEN"] as const;

        for (const student of classStudents) {
            const studentDrafts = draftNotes[student.id];
            if (!studentDrafts) continue;
            
            for (const type of types) {
                const draft = studentDrafts[type];
                if (!draft) continue;
                if (draft.note === "" && !draft.id) continue;
                
                const existingNote = notes.find(n => n.id === draft.id);
                if (existingNote && String(existingNote.valeur) === draft.note) continue;

                if (draft.id && draft.note === "") {
                     try {
                         await api.delete(`/api/admin/notes/${draft.id}`);
                         successCount++;
                     } catch { errorCount++; }
                     continue;
                }

                const payload = {
                    etudiantId: student.id,
                    matiereId: parseInt(selectedMatiere),
                    valeur: parseFloat(draft.note || "0"),
                    typeNote: type,
                    semestre: selectedSemestre,
                    commentaire: ""
                };

                try {
                    if (draft.id) {
                        await api.put(`/api/admin/notes/${draft.id}`, payload);
                    } else {
                        await api.post("/api/enseignant/notes", payload);
                    }
                    successCount++;
                } catch (error) {
                    errorCount++;
                }
            }
        }

        // Refresh notes
        if (successCount > 0 || errorCount > 0) {
            const newNotesData = await api.get("/api/admin/notes?page=0&size=5000").catch(() => ({ content: [] }));
            setNotes(Array.isArray(newNotesData) ? newNotesData : newNotesData.content || []);
            
            if (errorCount === 0) {
                toast.success(`${successCount} note(s) enregistrée(s) !`);
            } else {
                toast.error(`${successCount} succès, ${errorCount} échec(s)`);
            }
        } else {
            toast("Aucune modification à enregistrer.");
        }
        setIsSaving(false);
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#ffa000]"></div>
            </div>
        );
    }

    const inputCls = "w-full bg-[#f8f9fa] dark:bg-slate-700 border border-gray-200 dark:border-slate-600 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-[#ffa000] focus:bg-white dark:focus:bg-slate-800 transition-all text-sm font-semibold dark:text-white";

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex items-center justify-between">
                <div>
                    <h1 className="text-[#042954] dark:text-whitexl font-bold text-[#042954] dark:text-white mb-2">Saisie des Notes</h1>
                    <p className="text-sm text-gray-500 dark:text-slate-400">Sélectionnez vos critères pour évaluer les étudiants.</p>
                </div>
            </div>

            {/* Filter Panel */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
                <div className="flex items-center gap-2 mb-6 text-[#042954] dark:text-white font-bold">
                    <Filter size={20} className="text-[#ffa000]"/>
                    <span>Critères de sélection</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    {/* Filière */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600 dark:text-slate-300">Filière</label>
                        <select 
                            value={selectedFiliere} 
                            onChange={e => {
                                setSelectedFiliere(e.target.value);
                                setSelectedNiveau("");
                                setSelectedClasse("");
                            }}
                            className={inputCls}
                        >
                            <option value="">-- Sélectionner --</option>
                            {filieres.map(f => <option key={f.id} value={f.code}>{f.code} - {f.nom}</option>)}
                        </select>
                    </div>

                    {/* Niveau */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600 dark:text-slate-300">Niveau</label>
                        <select 
                            value={selectedNiveau} 
                            onChange={e => {
                                const niv = e.target.value;
                                setSelectedNiveau(niv);
                                setSelectedClasse("");
                                if (niv.includes("1")) setSelectedSemestre("S1");
                                else if (niv.includes("2")) setSelectedSemestre("S3");
                                else if (niv.includes("3")) setSelectedSemestre("S5");
                            }}
                            disabled={!selectedFiliere}
                            className={`${inputCls} disabled:opacity-50`}
                        >
                            <option value="">-- Sélectionner --</option>
                            {filteredNiveaux.map(n => <option key={n} value={n}>{n}</option>)}
                        </select>
                    </div>

                    {/* Classe */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600 dark:text-slate-300">Classe</label>
                        <select 
                            value={selectedClasse} 
                            onChange={e => setSelectedClasse(e.target.value)}
                            disabled={!selectedNiveau}
                            className={`${inputCls} disabled:opacity-50`}
                        >
                            <option value="">-- Sélectionner --</option>
                            {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.code}</option>)}
                        </select>
                    </div>

                    {/* Semestre */}
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-600 dark:text-slate-300">Semestre</label>
                        <select value={selectedSemestre} onChange={e => setSelectedSemestre(e.target.value)} className={inputCls} disabled={!selectedNiveau}>
                            {(!selectedNiveau ? ["S1", "S2", "S3", "S4", "S5"] : 
                                selectedNiveau.includes("1") ? ["S1", "S2"] : 
                                selectedNiveau.includes("2") ? ["S3", "S4"] : 
                                selectedNiveau.includes("3") ? ["S5"] : ["S1", "S2", "S3", "S4", "S5"]
                            ).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>

                {!canManageNotes && (
                    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-amber-800 text-sm font-medium dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300">
                        Accès en lecture seule: l'administration doit vous autoriser pour ajouter ou modifier les notes.
                    </div>
                )}
            </div>

            {/* Students List for Grading */}
            {selectedClasse && selectedMatiere ? (
                <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm overflow-hidden animate-in slide-in-from-bottom-4">
                    <div className="p-6 border-b border-gray-100 dark:border-slate-700/50 flex flex-col md:flex-row justify-between items-center bg-gray-50 dark:bg-slate-800/50/50 dark:bg-slate-800/50 gap-4">
                        <h3 className="font-bold tracking-tight text-[#042954] dark:text-white flex items-center gap-2">
                            <Users size={20} className="text-[#03a9f4]" /> 
                            Évaluation : {matieres.find(m => String(m.id) === selectedMatiere)?.nom || "..."} ({classStudents.length} étudiants)
                        </h3>
                        <button 
                            onClick={handleSaveAll}
                            disabled={!canManageNotes || isSaving || classStudents.length === 0}
                            className="bg-[#03a9f4] hover:bg-[#0288d1] text-white px-5 py-2.5 rounded-lg font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            {isSaving ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18} />}
                            Sauvegarder Toute la Classe
                        </button>
                    </div>

                    {classStudents.length === 0 ? (
                        <div className="p-12 text-center text-gray-500 dark:text-slate-400 font-medium">
                            Cette classe ne contient aucun étudiant pour le moment.
                        </div>
                    ) : (
                        <div className="overflow-x-auto p-0">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50 dark:bg-slate-700/50 text-gray-500 dark:text-slate-400 border-b border-gray-100 dark:border-slate-700 text-sm">
                                        <th className="p-4 font-semibold w-16 text-center">N°</th>
                                        <th className="p-4 font-semibold min-w-[200px]">Identité</th>
                                        <th className="p-4 font-semibold text-center w-32">DS (30%)</th>
                                        <th className="p-4 font-semibold text-center w-32">Examen (70%)</th>
                                        <th className="p-4 font-semibold text-center w-32">Moyenne</th>
                                        <th className="p-4 font-semibold text-center w-32">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {classStudents.map((student, index) => {
                                        const drafts = draftNotes[student.id] || { 
                                            CONTROLE: { note: "" }, 
                                            TP: { note: "" }, 
                                            EXAMEN: { note: "" } 
                                        };
                                        
                                        const isSavedAny = !!(drafts.CONTROLE?.id || drafts.TP?.id || drafts.EXAMEN?.id);
                                        const isComplete = !!(drafts.CONTROLE?.id && drafts.TP?.id && drafts.EXAMEN?.id);

                                        // Function to render a note input cell
                                        const NoteInput = ({ type, placeholder }: { type: keyof NoteValues, placeholder: string }) => {
                                            const draft = drafts[type];
                                            const isSaved = !!draft?.id;
                                            return (
                                                <div className="relative">
                                                     <input 
                                                        ref={(el) => {
                                                            noteInputRefs.current[`${student.id}-${type}`] = el;
                                                        }}
                                                        type="number" step="0.25" min="0" max="20"
                                                        value={draft?.note || ""}
                                                        onChange={(e) => handleNoteChange(student.id, type, e.target.value)}
                                                        onBlur={(e) => handleNoteBlur(student.id, type, e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (["e", "E", "+", "-"].includes(e.key)) {
                                                                e.preventDefault();
                                                            }
                                                        }}
                                                        disabled={!canManageNotes}
                                                        placeholder={placeholder}
                                                        className={`w-full text-center font-bold text-base bg-gray-50 dark:bg-slate-900 border ${isSaved ? 'border-green-300 dark:border-green-800' : 'border-gray-300 dark:border-slate-600'} rounded-lg px-2 py-2 outline-none focus:border-[#ffa000] focus:ring-2 focus:ring-[#ffa000]/20 transition-all dark:text-white`}
                                                    />
                                                </div>
                                            );
                                        };

                                        return (
                                            <tr key={student.id} className="border-b border-gray-100 dark:border-slate-700/50 hover:bg-gray-50/50 dark:hover:bg-[#151515] transition-colors dark:text-slate-400">
                                                <td className="p-4 text-center text-gray-400 dark:text-slate-500 font-semibold">{index + 1}</td>
                                                <td className="p-4">
                                                    <div className="font-bold text-[#042954] dark:text-white uppercase text-sm">
                                                        {student.nom} <span className="font-medium capitalize text-[#333333] dark:text-slate-300">{student.prenom}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 dark:text-slate-400 mt-1">{student.matricule}</div>
                                                </td>
                                                <td className="p-4 px-2">
                                                    <NoteInput type="CONTROLE" placeholder="DS /20" />
                                                </td>
                                                <td className="p-4 px-2">
                                                    <NoteInput type="EXAMEN" placeholder="EX /20" />
                                                </td>
                                                <td className="p-4 px-2 text-center">
                                                    {(() => {
                                                        const dsStr = drafts.CONTROLE?.note;
                                                        const exStr = drafts.EXAMEN?.note;
                                                        if (!dsStr && !exStr) return <span className="text-gray-400 font-medium">--</span>;
                                                        
                                                        const ds = parseFloat(dsStr || "0");
                                                        const ex = parseFloat(exStr || "0");
                                                        const moyenne = (ds * 0.3) + (ex * 0.7);
                                                        
                                                        return (
                                                            <div className="flex flex-col items-center justify-center">
                                                                <span className={`font-black text-lg ${moyenne >= 10 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
                                                                    {moyenne.toFixed(2)}
                                                                </span>
                                                            </div>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => handleSaveRow(student.id)}
                                                            disabled={!canManageNotes}
                                                            className={`p-2 rounded-full transition-colors ${isSavedAny ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-gray-100 text-gray-400 dark:text-slate-500 hover:bg-gray-200'}`}
                                                            title={isSavedAny ? "Mettre à jour" : "Sauvegarder"}
                                                        >
                                                            {isSavedAny ? <Edit2 size={18} /> : <CheckCircle size={18} />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            ) : (
                <div className="bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-700 rounded-2xl p-12 text-center flex flex-col items-center gap-4 text-blue-800 dark:text-slate-400">
                    <Search size={48} strokeWidth={1} className="text-blue-300 dark:text-slate-500 opacity-50" />
                    {selectedClasse && !selectedMatiere ? (
                        <p className="font-medium max-w-sm text-red-500">Vous n'avez aucune matière affectée pour ce semestre.</p>
                    ) : (
                        <p className="font-medium max-w-sm">Définissez vos critères (Filière, Niveau, Classe, Semestre) pour afficher la liste des étudiants et procéder à la saisie.</p>
                    )}
                </div>
            )}
        </div>
    );
}
