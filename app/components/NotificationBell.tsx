"use client";

import { useEffect, useState, useRef } from "react";
import { Bell, Check, Trash2, Clock, Info } from "lucide-react";
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

export default function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchNotifications = async () => {
        try {
            const data = await api.get("/api/notifications");
            setNotifications(data);
            const count = await api.get("/api/notifications/unread-count");
            setUnreadCount(count.count);
        } catch (error) {
            console.error("Failed to fetch notifications", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const markAsRead = async (id: number) => {
        try {
            await api.post(`/api/notifications/${id}/read`, {});
            setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error("Failed to mark notification as read", error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.post("/api/notifications/read-all", {});
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error("Failed to mark all as read", error);
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700/50 rounded-full transition-colors"
            >
                <Bell size={22} />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-800">
                        {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-gray-100 dark:border-slate-700 overflow-hidden z-[9999]">
                    <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/20">
                        <h3 className="font-bold text-gray-800 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={markAllAsRead}
                                className="text-xs font-semibold text-[#03a9f4] hover:text-[#042954] dark:hover:text-blue-400 transition-colors"
                            >
                                Tout marquer comme lu
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto scrollbar-thin">
                        {notifications.length === 0 ? (
                            <div className="p-10 text-center">
                                <div className="w-12 h-12 bg-gray-50 dark:bg-slate-900/50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Bell size={24} className="text-gray-300" />
                                </div>
                                <p className="text-sm text-gray-500 dark:text-slate-400">Aucune notification pour le moment</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
                                {notifications.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`p-4 flex gap-3 transition-colors ${n.isRead ? 'opacity-70' : 'bg-blue-50/30 dark:bg-blue-900/5'}`}
                                    >
                                        <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${n.isRead ? 'bg-gray-300' : 'bg-[#03a9f4]'}`} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className={`text-sm font-bold truncate ${n.isRead ? 'text-gray-600 dark:text-slate-400' : 'text-gray-900 dark:text-white'}`}>
                                                    {n.title}
                                                </p>
                                                <span className="text-[10px] text-gray-400 dark:text-slate-500 flex items-center gap-1 flex-shrink-0">
                                                    <Clock size={10} />
                                                    {format(new Date(n.createdAt), 'HH:mm', { locale: fr })}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 line-clamp-2">
                                                {n.message}
                                            </p>
                                            {!n.isRead && (
                                                <button
                                                    onClick={() => markAsRead(n.id)}
                                                    className="mt-2 text-[10px] font-bold text-[#03a9f4] hover:underline"
                                                >
                                                    Marquer comme lu
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="p-3 bg-gray-50/50 dark:bg-slate-900/20 text-center border-t border-gray-100 dark:border-slate-700">
                            <p className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-widest font-bold">Fin des notifications</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
