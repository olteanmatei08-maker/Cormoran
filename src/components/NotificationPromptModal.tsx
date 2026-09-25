import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Clock, Calendar, X } from 'lucide-react';
import {
  isNotificationSupported,
  getNotificationPermission,
  requestNotificationPermission,
  isPromptDismissed,
  setPromptDismissed,
  sendTestNotification,
} from '../services/notificationService';

export const NotificationPromptModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [activatedSuccess, setActivatedSuccess] = useState(false);

  useEffect(() => {
    if (!isNotificationSupported()) return;

    const currentPermission = getNotificationPermission();
    setPermission(currentPermission);

    // Show prompt on first visit if permission is 'default' and not dismissed
    if (currentPermission === 'default' && !isPromptDismissed()) {
      // Small timeout so user sees the app load first
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleEnable = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
    setPromptDismissed(true);

    if (res === 'granted') {
      setActivatedSuccess(true);
      await sendTestNotification();
      setTimeout(() => {
        setIsOpen(false);
      }, 2200);
    } else {
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    setPromptDismissed(true);
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#0c1017] border border-slate-800 rounded-3xl p-6 sm:p-7 shadow-2xl space-y-6 relative overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-emerald-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-950/70 border border-emerald-800/60 flex items-center justify-center text-emerald-400 shrink-0">
            <Bell className="w-6 h-6 animate-pulse" />
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-900 border border-slate-800 cursor-pointer transition-colors"
            title="Închide"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {activatedSuccess ? (
          <div className="text-center py-4 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Notificări Activate cu Succes!</h3>
            <p className="text-xs text-slate-400">
              Vei fi anunțat automat cu 7 zile și cu o zi înainte de fiecare activitate sau adunare din calendar.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-white font-serif-title">
                Activează Notificările Patrulei
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Fii la curent cu toate activitățile, adunările și taberele Patrulei Cormoran prin alerte automate directe:
              </p>
            </div>

            <div className="space-y-2.5 bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800/80 text-xs text-slate-300">
              <div className="flex items-center gap-2.5">
                <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Cu 7 zile înainte:</strong> Notificare pentru pregătire și echipament.
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>Cu o zi înainte (mâine):</strong> Alertă cu ora exactă a adunării.
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleEnable}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-900 hover:bg-emerald-800 border border-emerald-600/50 text-white font-bold text-xs sm:text-sm transition-all shadow-lg shadow-emerald-950/70 cursor-pointer flex items-center justify-center gap-2 active:scale-95"
              >
                <Bell className="w-4 h-4" />
                <span>Activează Notificările</span>
              </button>

              <button
                onClick={handleDismiss}
                className="py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all cursor-pointer"
              >
                Mai târziu
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
