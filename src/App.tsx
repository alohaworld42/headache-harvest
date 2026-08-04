import React, { useCallback, useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { format } from 'date-fns';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppShell } from '@/components/layout/AppShell';
import { Onboarding } from '@/components/Onboarding';
import { EntryDialog } from '@/components/entry/EntryDialog';
import { ProDialog } from '@/components/pro/ProDialog';
import CalendarPage from '@/pages/CalendarPage';
import Dashboard from '@/pages/Dashboard';
import InsightsPage from '@/pages/InsightsPage';
import Legal from '@/pages/Legal';
import NotFound from '@/pages/NotFound';
import ProSuccess from '@/pages/ProSuccess';
import ReportPage from '@/pages/ReportPage';
import SettingsPage from '@/pages/SettingsPage';
import { ISO } from '@/lib/analytics';
import { AppStoreProvider, useApp } from '@/store/app-store';
import type { Attack } from '@/lib/types';

/** Fires the daily reminder while the app is open; no push server involved. */
function useReminder() {
  const { settings, attacks } = useApp();
  useEffect(() => {
    if (!settings.reminderEnabled || typeof window === 'undefined' || !('Notification' in window)) return;
    const key = 'kopfweh.lastReminder';

    const tick = () => {
      if (Notification.permission !== 'granted') return;
      const now = new Date();
      const today = format(now, ISO);
      if (window.localStorage.getItem(key) === today) return;
      const [hour, minute] = settings.reminderTime.split(':').map(Number);
      if (now.getHours() < hour || (now.getHours() === hour && now.getMinutes() < minute)) return;
      if (attacks.some((attack) => attack.date === today)) return;
      window.localStorage.setItem(key, today);
      new Notification('Kopfweh', {
        body:
          settings.language === 'de'
            ? 'Wie war dein Tag? Trage deinen Kopfschmerz ein.'
            : 'How was your day? Log your headache.',
      });
    };

    tick();
    const timer = window.setInterval(tick, 60_000);
    return () => window.clearInterval(timer);
  }, [settings.reminderEnabled, settings.reminderTime, settings.language, attacks]);
}

function AppInner() {
  const { settings, updateSettings } = useApp();
  const [entryOpen, setEntryOpen] = useState(false);
  const [editing, setEditing] = useState<Attack | undefined>();
  const [entryDate, setEntryDate] = useState<string | undefined>();
  const [proOpen, setProOpen] = useState(false);

  useReminder();

  const openNew = useCallback((date?: string) => {
    setEditing(undefined);
    setEntryDate(date ?? format(new Date(), ISO));
    setEntryOpen(true);
  }, []);

  const openEdit = useCallback((attack: Attack) => {
    setEditing(attack);
    setEntryDate(attack.date);
    setEntryOpen(true);
  }, []);

  const openPro = useCallback(() => setProOpen(true), []);

  return (
    <>
      <AppShell onNewEntry={() => openNew()}>
        <Routes>
          <Route
            path="/"
            element={<Dashboard onNewEntry={() => openNew()} onEditEntry={openEdit} onUpgrade={openPro} />}
          />
          <Route
            path="/calendar"
            element={<CalendarPage onNewEntry={openNew} onEditEntry={openEdit} onUpgrade={openPro} />}
          />
          <Route path="/insights" element={<InsightsPage onUpgrade={openPro} />} />
          <Route path="/report" element={<ReportPage onUpgrade={openPro} />} />
          <Route path="/settings" element={<SettingsPage onUpgrade={openPro} />} />
          <Route path="/pro/success" element={<ProSuccess />} />
          <Route path="/legal/privacy" element={<Legal kind="privacy" />} />
          <Route path="/legal/terms" element={<Legal kind="terms" />} />
          <Route path="/legal/imprint" element={<Legal kind="imprint" />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AppShell>

      <EntryDialog
        open={entryOpen}
        onOpenChange={setEntryOpen}
        attack={editing}
        defaultDate={entryDate}
        onUpgrade={openPro}
      />
      <ProDialog open={proOpen} onOpenChange={setProOpen} />
      <Onboarding open={!settings.onboardingDone} onDone={() => updateSettings({ onboardingDone: true })} />
    </>
  );
}

export default function App() {
  return (
    <AppStoreProvider>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <AppInner />
        </BrowserRouter>
        <Sonner position="top-center" />
      </TooltipProvider>
    </AppStoreProvider>
  );
}
