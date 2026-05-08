"use client";

import { useEffect, useRef, useState } from "react";
import { api, API_URL } from "@/lib/api";
import {
  Send, Search, MessageSquare, Bot, Phone, Video,
  MoreVertical, ArrowLeft, Smile, Paperclip, Trash2, Edit2
} from "lucide-react";
import { useConfirm } from "@/components/ConfirmProvider";

interface Contact {
  userId?: number; entityId?: number;
  nom: string; prenom?: string; email?: string; photo?: string; role?: string;
  lastMessage?: string; lastMessageTime?: string; unreadCount?: number;
  classeId?: number; classeCode?: string; classeNom?: string; memberCount?: number;
}
interface Msg {
  id: number; senderId: number;
  senderNom: string; senderPrenom: string; senderPhoto?: string; senderRole?: string;
  content: string; sentAt: string; isRead: boolean;
  receiverId?: number; classeId?: number;
  isDeleted?: boolean; isEdited?: boolean;
  deleted?: boolean; edited?: boolean;
}
interface ChatMsg { role: "user" | "bot"; text: string; time: string }
interface SeanceItem {
  jourSemaine?: string;
  heureDebut?: string;
  heureFin?: string;
  matiereNom?: string;
  semestre?: string;
  classeCode?: string;
  typeSeance?: string;
  niveauCode?: string;
  creneauLabel?: string;
}

const fmt = (iso: string) => {
  try { return new Date(iso).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }); }
  catch { return ""; }
};
const avatar = (nom: string, prenom?: string) =>
  `${(prenom || "")[0] || ""}${(nom || "")[0] || ""}`.toUpperCase() || "?";
const photoUrl = (p?: string | null) =>
  p ? (p.startsWith("http") ? p : `${API_URL}${p.startsWith("/") ? "" : "/"}${p}`) : null;

const dayNamesFr = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];

const isSeanceRequest = (text: string) => /seance|séance/i.test(text);

const parseSeanceDate = (text: string) => {
  const lower = text.toLowerCase();
  const base = new Date();

  if (lower.includes("demain")) return new Date(base.getFullYear(), base.getMonth(), base.getDate() + 1);
  if (lower.includes("hier")) return new Date(base.getFullYear(), base.getMonth(), base.getDate() - 1);
  if (lower.includes("aujourd")) return base;

  const match = lower.match(/(\d{2})[\/.-](\d{2})[\/.-](\d{4})/);
  if (!match) return base;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const parsed = new Date(year, month - 1, day);
  return Number.isNaN(parsed.getTime()) ? base : parsed;
};

const normalizeClasseCode = (classeCode?: string) => {
  if (!classeCode) return "CLASSE";
  const normalized = classeCode.trim().toUpperCase();
  return /^[A-Z]{3}[1-3][A-D]$/.test(normalized) ? normalized.slice(0, 4) : normalized;
};

const normalizeSeanceLine = (s: SeanceItem) => {
  const scope = s.typeSeance || "";
  const classe = normalizeClasseCode(s.classeCode);
  const time = s.creneauLabel || `${s.heureDebut || ""} - ${s.heureFin || ""}`;
  return `${scope} ${classe} ${s.semestre || ""} ${s.matiereNom || ""} ${time}`.replace(/\s+/g, " ").trim();
};

const formatSeances = (seances: SeanceItem[]) => {
  if (!seances.length) return "Aucune seance";
  return seances.map(s => {
    return normalizeSeanceLine(s);
  }).join("\n");
};

const toSeanceList = (data: unknown) => Array.isArray(data) ? data as SeanceItem[] : [];

const filterSeancesByDay = (list: SeanceItem[], dayName: string) =>
  list.filter(s => (s.jourSemaine || "").toUpperCase() === dayName);

const GROQ_API_KEY = process.env.NEXT_PUBLIC_GROQ_API_KEY || "";

async function getGroqResponse(text: string, context: any): Promise<string> {
  try {
    const daysFr = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
    const now = new Date();
    const todayFr = daysFr[now.getDay()];
    const dateFr = now.toLocaleDateString('fr-FR');

    const contextStr = JSON.stringify(context);
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          {
            role: "system",
            content: `Tu es un assistant académique. NOUS SOMMES AUJOURD'HUI : ${todayFr} ${dateFr}.
            
            CONSIGNES CRITIQUES :
            1. Si l'utilisateur demande ses séances d' "aujourd'hui", tu dois UNIQUEMENT lister les séances où 'jourSemaine' est "${todayFr}".
            2. Si l'utilisateur demande ses séances de "demain", tu dois UNIQUEMENT lister les séances du jour suivant.
            3. RÈGLE DE SEMESTRE : Comme nous sommes après le 15 Janvier, tu ne dois JAMAIS afficher de séances dont le 'semestre' est S1, S3 ou S5. Affiche uniquement S2, S4 ou S6.
            4. FORMAT : Affiche toujours le code de la classe (ex: LCS2A) pour chaque séance.
            5. Si aucune séance ne correspond, dis-le explicitement.
            
            Données contextuelles : ${contextStr}`
          },
          { role: "user", content: text }
        ],
        temperature: 0.2,
        max_tokens: 1024
      })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      console.error(`Groq API Error (Status ${res.status}):`, data);
      if (res.status === 401) return "Clé API Groq invalide. Veuillez vérifier votre configuration.";
      if (res.status === 429) return "Trop de requêtes. Veuillez patienter un instant.";
      if (data?.error?.message?.includes("quota")) {
        return "Désolé, le quota de l'assistant IA est épuisé. Veuillez réessayer plus tard.";
      }
      return `Erreur assistante IA (${res.status}). Veuillez réessayer.`;
    }

    if (data?.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }

    return "L'assistant n'a pas pu générer de réponse.";
  } catch (err) {
    console.error("Groq connection error:", err);
    return "Désolé, je rencontre une erreur de connexion. Veuillez réessayer plus tard.";
  }
}

export default function EtudiantChatPage() {
  const [tab, setTab] = useState<"chat" | "groups" | "contacts" | "bot">("chat");
  const [search, setSearch] = useState("");
  const [conversations, setConversations] = useState<Contact[]>([]);
  const [myClasse, setMyClasse] = useState<Contact[]>([]);
  const [enseignants, setEnseignants] = useState<Contact[]>([]);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [currentUserId, setCurrentUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [localEdits, setLocalEdits] = useState<Record<number, string>>({});
  const [localDeletes, setLocalDeletes] = useState<Set<number>>(new Set());
  const bottomRef = useRef<HTMLDivElement>(null);
  const { confirm } = useConfirm();

  const [botMsgs, setBotMsgs] = useState<ChatMsg[]>([
    { role: "bot", text: "Bonjour ! Je suis votre assistant académique. Comment puis-je vous aider ?", time: fmt(new Date().toISOString()) }
  ]);
  const [botInput, setBotInput] = useState("");
  const [botLoading, setBotLoading] = useState(false);
  const [academicContext, setAcademicContext] = useState<any>(null);
  const botBottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.get("/api/chat/me").then((d: any) => {
      if (d?.id) setCurrentUserId(d.id);
    }).catch(() => { });
  }, []);

  const loadAcademicContext = async () => {
    try {
      const [dash, abs, notes, factures, docs, seances] = await Promise.all([
        api.get("/api/etudiant/dashboard"),
        api.get("/api/etudiant/absences"),
        api.get("/api/etudiant/notes"),
        api.get("/api/etudiant/factures"),
        api.get("/api/etudiant/documents"),
        api.get("/api/etudiant/seances")
      ]);
      const daysFr = ["DIMANCHE", "LUNDI", "MARDI", "MERCREDI", "JEUDI", "VENDREDI", "SAMEDI"];
      const now = new Date();
      setAcademicContext({
        INFORMATION_TEMPORELLE: {
          aujourd_hui_est_le: now.toLocaleDateString('fr-FR'),
          jour_de_la_semaine: daysFr[now.getDay()],
          heure_actuelle: now.toLocaleTimeString('fr-FR')
        },
        dashboard: dash,
        absences: abs,
        notes: notes,
        factures: factures,
        documents: docs,
        seances: seances
      });
    } catch (err) {
      console.error("Failed to load context:", err);
    }
  };

  const loadSidebar = () => {
    api.get("/api/chat/conversations").then((d: Contact[]) => setConversations(d)).catch(() => { });
    api.get("/api/chat/my-classe").then((d: Contact[]) => setMyClasse(d)).catch(() => { });
    api.get("/api/chat/enseignants").then((d: Contact[]) => setEnseignants(d)).catch(() => { });
  };

  useEffect(() => {
    loadSidebar();
    loadAcademicContext();
    const interval = setInterval(loadSidebar, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const fetch = async () => {
      setLoading(true);
      try {
        if (selected.classeId) {
          const d = await api.get(`/api/chat/group/${selected.classeId}`);
          setMessages(d);
        } else if (selected.userId) {
          const d = await api.get(`/api/chat/direct/${selected.userId}`);
          setMessages(d);
          api.post(`/api/chat/read/${selected.userId}`, {}).catch(() => { });
        }
      } catch (err) {
        console.error("Failed to load chat messages:", err);
        setMessages([]);
      } finally { setLoading(false); }
    };
    fetch();
    const interval = setInterval(fetch, 5000);
    return () => clearInterval(interval);
  }, [selected]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { botBottom.current?.scrollIntoView({ behavior: "smooth" }); }, [botMsgs]);

  const sendMessage = async () => {
    if (!input.trim() || !selected) return;
    const body: any = { content: input.trim() };
    if (selected.classeId) body.classeId = selected.classeId;
    else body.receiverId = selected.userId;
    try {
      const msg = await api.post("/api/chat/send", body);
      setMessages(prev => [...prev, msg]);
      setInput("");
      loadSidebar();
    } catch { }
  };

  const handleDeleteMessage = async (msgId: number) => {
    const isConfirmed = await confirm({
      title: "Supprimer le message",
      message: "Voulez-vous vraiment supprimer ce message ?",
      confirmText: "Supprimer",
      variant: "danger"
    });
    if (!isConfirmed) return;
    try {
      await api.delete(`/api/chat/message/${msgId}`);
      setLocalDeletes(prev => new Set(prev).add(msgId));
      setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isDeleted: true } : m));
    } catch (e) { console.error(e); }
  };

  const handleEditMessage = async (msgId: number, currentContent: string) => {
    const newContent = prompt("Modifier le message :", currentContent);
    if (newContent && newContent.trim() !== "" && newContent !== currentContent) {
      try {
        await api.put(`/api/chat/message/${msgId}`, { content: newContent });
        setLocalEdits(prev => ({ ...prev, [msgId]: newContent }));
        setMessages(prev => prev.map(m => m.id === msgId ? { ...m, content: newContent, isEdited: true } : m));
      } catch (e) { console.error(e); }
    }
  };

  const sendBotMessage = async () => {
    if (!botInput.trim() || botLoading) return;
    const userText = botInput.trim();
    const now = fmt(new Date().toISOString());

    setBotInput("");
    setBotLoading(true);

    setBotMsgs(prev => [...prev, { role: "user", text: userText, time: now }]);

    if (isSeanceRequest(userText)) {
      try {
        const targetDate = parseSeanceDate(userText);
        const isoDate = targetDate.toISOString().slice(0, 10);
        const dayName = dayNamesFr[targetDate.getDay()];
        let list = toSeanceList(await api.get(`/api/etudiant/seances?referenceDate=${isoDate}`));
        if (!list.length && academicContext?.seances) {
          list = toSeanceList(academicContext.seances);
        }
        const reply = formatSeances(list);
        const replyTime = fmt(new Date().toISOString());
        setBotMsgs(prev => [...prev, { role: "bot", text: reply, time: replyTime }]);
      } catch {
        const replyTime = fmt(new Date().toISOString());
        const dayName = dayNamesFr[parseSeanceDate(userText).getDay()];
        const cached = toSeanceList(academicContext?.seances);
        const reply = formatSeances(cached);
        setBotMsgs(prev => [...prev, { role: "bot", text: reply, time: replyTime }]);
      } finally {
        setBotLoading(false);
      }
      return;
    }

    const reply = await getGroqResponse(userText, academicContext);
    const replyTime = fmt(new Date().toISOString());

    setBotMsgs(prev => [...prev, { role: "bot", text: reply, time: replyTime }]);
    setBotLoading(false);
  };

  const selectContact = (c: Contact) => {
    setSelected(c);
    setMessages([]);
    setMobileShowChat(true);
    // Reset unread count locally for better UX
    setConversations(prev => prev.map(conv =>
      conv.userId === c.userId ? { ...conv, unreadCount: 0 } : conv
    ));
    setEnseignants(prev => prev.map(conv =>
      conv.userId === c.userId ? { ...conv, unreadCount: 0 } : conv
    ));
    // Call API to mark as read
    if (!c.classeId) {
      api.post(`/api/chat/read/${c.userId}`, {}).catch(() => { });
    }
  };

  const filterList = (list: Contact[]) => list.filter(c =>
    `${c.prenom || ""} ${c.nom}`.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.classeCode || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-80px)] bg-white dark:bg-zinc-900 rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-zinc-800">
      {/* Sidebar */}
      <div className={`w-full md:w-80 lg:w-96 border-r border-gray-100 dark:border-zinc-800 flex flex-col bg-white dark:bg-zinc-900 ${mobileShowChat ? "hidden md:flex" : "flex"}`}>
        <div className="p-4 border-b border-gray-100 dark:border-zinc-800 bg-gradient-to-r from-[#042954] to-[#03a9f4]">
          <div className="flex items-center justify-between">
            <span className="text-white font-bold text-lg">Messagerie</span>
            <button onClick={() => { setTab("bot"); setMobileShowChat(true); }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors">
              <Bot size={18} className="text-white" />
            </button>
          </div>
        </div>

        <div className="flex flex-col h-full">
          <div className="flex border-b border-gray-100 dark:border-zinc-800">
            {(["chat", "groups", "contacts", "bot"] as const).map(t => (
              <button key={t}
                onClick={() => { setTab(t); setSelected(null); setMobileShowChat(false); }}
                className={`flex-1 py-2.5 text-[10px] font-semibold uppercase tracking-wider transition-colors ${tab === t
                  ? "border-b-2 border-[#ffa000] text-[#ffa000]"
                  : "text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"}`}>
                {t === "chat" ? "Chat" : t === "groups" ? "Groupes" : t === "contacts" ? "Contacts" : "IA"}
              </button>
            ))}
          </div>

          {tab !== "bot" && (
            <div className="p-3">
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher..."
                  className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-lg focus:outline-none focus:border-[#ffa000]" />
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            {/* Chat tab: all conversations */}
            {tab === "chat" && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase px-4 py-2">Conversations récentes</p>
                {filterList(conversations).length === 0
                  ? <p className="text-center text-sm text-gray-400 mt-8 px-4">Aucune conversation. Contactez un enseignant via l'onglet Contacts.</p>
                  : filterList(conversations).map(c => (
                    <button key={c.userId} onClick={() => selectContact(c)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left ${selected?.userId === c.userId ? "bg-[#fff8e1] dark:bg-[#ffa000]/10 border-r-2 border-[#ffa000]" : ""}`}>
                      <div className="relative flex-shrink-0">
                        {photoUrl(c.photo)
                          ? <img src={photoUrl(c.photo)!} alt="" className="w-11 h-11 rounded-full object-cover" />
                          : <div className="w-11 h-11 rounded-full bg-[#042954] text-white flex items-center justify-center text-sm font-bold">{avatar(c.nom, c.prenom)}</div>}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm text-gray-800 dark:text-zinc-100 truncate">{c.prenom || ""} {c.nom}</span>
                          <span className="text-xs text-gray-400 ml-1">{c.lastMessageTime}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{c.lastMessage || "Démarrer une conversation"}</p>
                      </div>
                      {(c.unreadCount ?? 0) > 0 && (
                        <span className="bg-[#ffa000] text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{c.unreadCount}</span>
                      )}
                    </button>
                  ))}
              </>
            )}

            {/* Groups tab: only my classe */}
            {tab === "groups" && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase px-4 py-2">Ma classe</p>
                {myClasse.length === 0
                  ? <p className="text-center text-sm text-gray-400 mt-8 px-4">Vous n'êtes affecté à aucune classe pour le moment.</p>
                  : myClasse.map(g => (
                    <button key={g.classeId} onClick={() => selectContact(g)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left ${selected?.classeId === g.classeId ? "bg-[#fff8e1] dark:bg-[#ffa000]/10 border-r-2 border-[#ffa000]" : ""}`}>
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#042954] to-[#03a9f4] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                        {(g.classeCode || "G").slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-sm text-gray-800 dark:text-zinc-100 truncate">{g.classeCode}</span>
                          <span className="text-xs text-gray-400">{g.lastMessageTime}</span>
                        </div>
                        <p className="text-xs text-gray-500 truncate">{g.lastMessage || `${g.memberCount ?? 0} membres`}</p>
                      </div>
                    </button>
                  ))}
              </>
            )}

            {/* Contacts tab: all enseignants */}
            {tab === "contacts" && (
              <>
                <p className="text-xs font-semibold text-gray-400 uppercase px-4 py-2">Enseignants</p>
                {filterList(enseignants).length === 0
                  ? <p className="text-center text-sm text-gray-400 mt-8">Aucun enseignant trouvé</p>
                  : filterList(enseignants).map(e => (
                    <button key={e.userId} onClick={() => selectContact(e)}
                      className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left ${selected?.userId === e.userId ? "bg-[#fff8e1] dark:bg-[#ffa000]/10 border-r-2 border-[#ffa000]" : ""}`}>
                      <div className="relative flex-shrink-0">
                        {photoUrl(e.photo)
                          ? <img src={photoUrl(e.photo)!} alt="" className="w-11 h-11 rounded-full object-cover" />
                          : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#042954] to-[#ffa000] text-white flex items-center justify-center text-sm font-bold">{avatar(e.nom, e.prenom)}</div>}
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 border-2 border-white rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold text-sm text-gray-800 dark:text-zinc-100 block truncate">{e.prenom || ""} {e.nom}</span>
                        <p className="text-xs text-[#03a9f4]">Enseignant</p>
                      </div>
                    </button>
                  ))}
              </>
            )}

            {tab === "bot" && (
              <div className="p-4 flex flex-col items-center gap-3 mt-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#042954] to-[#ffa000] flex items-center justify-center shadow-lg">
                  <Bot size={32} className="text-white" />
                </div>
                <p className="font-bold text-gray-800 dark:text-zinc-100">Assistant Académique</p>
                <p className="text-xs text-gray-500 text-center">Posez vos questions sur vos cours, notes et absences.</p>
                <button onClick={() => setMobileShowChat(true)}
                  className="md:hidden mt-2 px-4 py-2 bg-[#ffa000] text-white rounded-lg text-sm font-semibold">
                  Ouvrir le chat
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={`flex-1 flex flex-col ${!mobileShowChat && "hidden md:flex"}`}>
        {tab === "bot" ? (
          <div className="flex flex-col h-full">
            <div className="flex items-center gap-3 px-6 py-4 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800">
              <button className="md:hidden mr-1 text-gray-500" onClick={() => setMobileShowChat(false)}><ArrowLeft size={20} /></button>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#042954] to-[#ffa000] flex items-center justify-center"><Bot size={20} className="text-white" /></div>
              <div>
                <p className="font-bold text-gray-800 dark:text-zinc-100">Assistant Académique IA</p>
                <p className="text-xs text-green-500">● En ligne</p>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50 dark:bg-zinc-950">
              {botMsgs.map((m, i) => (
                <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                  {m.role === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#042954] to-[#ffa000] flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                      <Bot size={14} className="text-white" />
                    </div>
                  )}
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 shadow-sm ${m.role === "user"
                    ? "bg-[#ffa000] text-white rounded-br-sm"
                    : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 rounded-bl-sm"}`}>
                    <p className="text-sm leading-relaxed">{m.text}</p>
                    <p className={`text-xs mt-1 ${m.role === "user" ? "text-white/70" : "text-gray-400"}`}>{m.time}</p>
                  </div>
                </div>
              ))}
              {botLoading && (
                <div className="flex justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#042954] to-[#ffa000] flex items-center justify-center mr-2 flex-shrink-0 animate-pulse">
                    <Bot size={14} className="text-white" />
                  </div>
                  <div className="bg-white dark:bg-zinc-800 text-gray-400 rounded-2xl px-4 py-2.5 shadow-sm rounded-bl-sm italic text-xs">
                    L'assistant réfléchit...
                  </div>
                </div>
              )}
              <div ref={botBottom} />
            </div>
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <input value={botInput} onChange={e => setBotInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendBotMessage()}
                  placeholder="Posez votre question..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-[#ffa000]" />
                <button onClick={sendBotMessage} disabled={!botInput.trim()}
                  className="w-10 h-10 rounded-full bg-[#ffa000] flex items-center justify-center shadow-md disabled:opacity-50 hover:bg-[#ff8f00] transition-colors">
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        ) : !selected ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
              <MessageSquare size={36} className="text-gray-300" />
            </div>
            <p className="font-semibold text-gray-500">Sélectionnez une conversation</p>
            <p className="text-sm text-center max-w-xs">Choisissez un enseignant ou votre groupe de classe pour commencer à discuter.</p>
          </div>
        ) : (
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 md:px-6 py-4 bg-white dark:bg-zinc-900 border-b border-gray-100 dark:border-zinc-800 shadow-sm">
              <div className="flex items-center gap-3">
                <button className="md:hidden mr-1 text-gray-500" onClick={() => { setSelected(null); setMobileShowChat(false); }}><ArrowLeft size={20} /></button>
                {selected.classeId
                  ? <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#042954] to-[#03a9f4] flex items-center justify-center text-white text-sm font-bold">{(selected.classeCode || "G").slice(0, 2)}</div>
                  : photoUrl(selected.photo)
                    ? <img src={photoUrl(selected.photo)!} alt="" className="w-10 h-10 rounded-full object-cover" />
                    : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#042954] to-[#ffa000] flex items-center justify-center text-white text-sm font-bold">{avatar(selected.nom, selected.prenom)}</div>}
                <div>
                  <p className="font-bold text-gray-800 dark:text-zinc-100 text-sm">
                    {selected.classeId ? `${selected.classeCode || ""} — ${selected.classeNom || ""}` : `${selected.prenom || ""} ${selected.nom}`}
                  </p>
                  <p className="text-xs text-gray-500">{selected.classeId ? `${selected.memberCount ?? 0} membres` : "Enseignant"}</p>
                </div>
              </div>
              <div className="relative flex items-center gap-2 text-gray-400">
                <button onClick={() => setShowMenu(!showMenu)} className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-full transition-colors"><MoreVertical size={18} /></button>
                {showMenu && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 py-1 z-50">
                    {!selected.classeId && (
                      <button onClick={async () => {
                        const isConfirmed = await confirm({
                          title: "Supprimer la conversation",
                          message: "Voulez-vous vraiment supprimer cette conversation pour vous ?",
                          confirmText: "Supprimer",
                          variant: "danger"
                        });
                        if (!isConfirmed) return;
                        try {
                          await api.delete(`/api/chat/conversation/${selected.userId}`);
                          setShowMenu(false);
                          setMessages([]);
                          setSelected(null);
                          setMobileShowChat(false);
                          loadSidebar();
                        } catch (e) { console.error(e); }
                      }} className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20">
                        Supprimer le chat
                      </button>
                    )}
                    <button onClick={() => { setShowMenu(false); setSelected(null); setMobileShowChat(false); }} className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-zinc-700">Fermer la conversation</button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-3 bg-gray-50 dark:bg-zinc-950">
              {loading && <p className="text-center text-sm text-gray-400 animate-pulse">Chargement...</p>}
              {messages.map(originalMsg => {
                const m = { ...originalMsg };
                // Fix for Jackson stripping "is" prefix
                if (m.deleted) m.isDeleted = true;
                if (m.edited) m.isEdited = true;

                if (localDeletes.has(m.id)) m.isDeleted = true;
                if (localEdits[m.id]) { m.content = localEdits[m.id]; m.isEdited = true; }
                const isMine = m.senderId === currentUserId;
                return (
                  <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"} items-end gap-2`}>
                    {!isMine && (
                      photoUrl(m.senderPhoto)
                        ? <img src={photoUrl(m.senderPhoto)!} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        : <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#042954] to-[#ffa000] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{avatar(m.senderNom, m.senderPrenom)}</div>
                    )}
                    <div className={`max-w-[75%] ${isMine ? "items-end" : "items-start"} flex flex-col group`}>
                      {selected.classeId && !isMine && <p className="text-xs text-[#042954] dark:text-[#ffa000] font-semibold mb-0.5 ml-1">{m.senderPrenom} {m.senderNom}</p>}
                      <div className="flex items-center gap-2">
                        {isMine && !m.isDeleted && (
                          <div className="hidden group-hover:flex items-center gap-1 opacity-50 hover:opacity-100 transition-opacity">
                            <button onClick={() => handleEditMessage(m.id, m.content)} className="p-1 hover:text-blue-500"><Edit2 size={14} /></button>
                            <button onClick={() => handleDeleteMessage(m.id)} className="p-1 hover:text-red-500"><Trash2 size={14} /></button>
                          </div>
                        )}
                        <div className={`px-4 py-2.5 rounded-2xl shadow-sm ${m.isDeleted ? "bg-gray-100 dark:bg-zinc-800 text-gray-400 italic rounded-br-sm" : (isMine ? "bg-[#ffa000] text-white rounded-br-sm" : "bg-white dark:bg-zinc-800 text-gray-800 dark:text-zinc-100 rounded-bl-sm")}`}>
                          {m.isDeleted ? (
                            <p className="text-sm leading-relaxed">{`${m.senderPrenom || ''} ${m.senderNom || ''} a supprimé ce message`}</p>
                          ) : (
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{m.content}</p>
                          )}
                          <p className={`text-xs mt-1 flex items-center justify-end gap-1 ${isMine && !m.isDeleted ? "text-white/70" : "text-gray-400"}`}>
                            {fmt(m.sentAt)}
                            {m.isEdited && !m.isDeleted && <span className="text-[10px] italic">(modifié)</span>}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {messages.length === 0 && !loading && (
                <p className="text-center text-sm text-gray-400 mt-8">Aucun message. Soyez le premier à écrire !</p>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <label className="p-2 text-gray-400 hover:text-[#ffa000] transition-colors cursor-pointer">
                  <Paperclip size={20} />
                  <input type="file" className="hidden" onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setInput(prev => prev + ` [Fichier: ${file.name}] `);
                  }} />
                </label>
                <input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && sendMessage()}
                  placeholder="Écrivez un message..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 text-sm focus:outline-none focus:border-[#ffa000] transition-colors" />
                <button onClick={sendMessage} disabled={!input.trim()}
                  className="w-10 h-10 rounded-full bg-[#ffa000] flex items-center justify-center shadow-md disabled:opacity-50 hover:bg-[#ff8f00] transition-colors">
                  <Send size={16} className="text-white" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

