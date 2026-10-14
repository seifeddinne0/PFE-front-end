"use client";

import { useEffect, useMemo, useState } from "react";
import { Bell, Clock } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface Notification {
    id: number;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
}

const MAX_ITEMS = 3;

export default function RecentNotifications() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchNotifications = async () => {
            try {
                const data = await api.get("/api/notifications");
                setNotifications(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Failed to fetch notifications", error);
                setNotifications([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchNotifications();
    }, []);

    const latest = useMemo(() => {
        return [...notifications]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, MAX_ITEMS);
    }, [notifications]);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-[#03a9f4]/10 text-[#03a9f4]">
                        <Bell size={18} />
                    </div>
                    <h3 className="text-base font-bold text-[#042954] dark:text-white">Dernieres notifications</h3>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{MAX_ITEMS} max</span>
            </div>

            {isLoading ? (
                <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="h-2.5 w-2.5 rounded-full bg-gray-300 animate-pulse" />
                    Chargement des notifications...
                </div>
            ) : latest.length === 0 ? (
                <div className="text-sm text-gray-500 dark:text-slate-400">Aucune notification pour le moment.</div>
            ) : (
                <div className="space-y-4">
                    {latest.map((item) => (
                        <div key={item.id} className="flex items-start gap-3">
                            <div className={`mt-1 h-2.5 w-2.5 rounded-full ${item.isRead ? "bg-gray-300" : "bg-[#03a9f4]"}`} />
                            <div className="flex-1">
                                <div className="flex items-center justify-between gap-3">
                                    <p className={`text-sm font-bold ${item.isRead ? "text-gray-600 dark:text-slate-400" : "text-gray-900 dark:text-white"}`}>
                                        {item.title}
                                    </p>
                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <Clock size={10} />
                                        {format(new Date(item.createdAt), "HH:mm", { locale: fr })}
                                    </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 line-clamp-2">{item.message}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
