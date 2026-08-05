import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { de as deLocale, enUS } from 'date-fns/locale';
import type { Locale } from 'date-fns';
import { LOCATIONS, RELIEF, SYMPTOMS, TRIGGERS, resolveLabel } from '@/lib/catalog';
import { detectLanguage, translate, type Lang, type TranslationKey } from '@/lib/i18n';
import { createTrial, proStatus, verifyToken, type ProStatus } from '@/lib/pro';
import {
  emptyData,
  loadData,
  mergeAttacks,
  newId,
  normalizeAttack,
  saveData,
} from '@/lib/storage';
import type { AppData, Attack, License, Settings } from '@/lib/types';

type AttackDraft = Omit<Attack, 'id' | 'createdAt' | 'updatedAt'> & { id?: string };

interface AppStore {
  data: AppData;
  attacks: Attack[];
  settings: Settings;
  lang: Lang;
  locale: Locale;
  pro: ProStatus;
  t: (key: TranslationKey, ...args: (string | number)[]) => string;
  labelFor: (kind: 'trigger' | 'symptom' | 'location' | 'relief', id: string) => string;
  saveAttack: (draft: AttackDraft) => Attack;
  deleteAttack: (id: string) => void;
  importAttacks: (attacks: Attack[], settings?: Partial<Settings>) => number;
  clearAttacks: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  startTrial: () => void;
  applyLicense: (license: License) => void;
  removeLicense: () => void;
}

const AppStoreContext = createContext<AppStore | null>(null);

function applyTheme(theme: Settings['theme']): void {
  if (typeof document === 'undefined') return;
  const prefersDark =
    typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
}

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(() => {
    if (typeof window === 'undefined') return emptyData();
    const loaded = loadData();
    // A fresh install follows the browser language instead of defaulting to German.
    if (!loaded.attacks.length && !loaded.settings.onboardingDone) {
      loaded.settings.language = detectLanguage();
    }
    return loaded;
  });
  const licenseChecked = useRef(false);

  const persist = useCallback((updater: (current: AppData) => AppData) => {
    setData((current) => {
      const next = updater(current);
      if (!saveData(next)) {
        // A silent failure here would look like a saved entry that is gone after
        // the next reload, so the user has to hear about it right away.
        toast.error(translate(next.settings.language, 'toast.saveFailed'), { duration: 10_000 });
      }
      return next;
    });
  }, []);

  useEffect(() => {
    applyTheme(data.settings.theme);
    if (data.settings.theme !== 'system' || typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    media.addEventListener('change', handler);
    return () => media.removeEventListener('change', handler);
  }, [data.settings.theme]);

  useEffect(() => {
    document.documentElement.lang = data.settings.language;
  }, [data.settings.language]);

  // Re-check a stored licence once per session so revoked keys eventually stop working.
  useEffect(() => {
    if (licenseChecked.current) return;
    licenseChecked.current = true;
    const token = data.license?.token;
    if (!token) return;
    void verifyToken(token).then((result) => {
      if (result.status === 'valid') {
        persist((current) => ({ ...current, license: result.license }));
      } else if (result.status === 'invalid') {
        persist((current) => ({ ...current, license: undefined }));
      }
      // 'unreachable' keeps the licence; the verifiedAt grace period covers
      // revocation eventually, and an offline user stays a paying user.
    });
  }, [data.license?.token, persist]);

  const lang = data.settings.language;

  const t = useCallback(
    (key: TranslationKey, ...args: (string | number)[]) => translate(lang, key, ...args),
    [lang],
  );

  const labelFor = useCallback(
    (kind: 'trigger' | 'symptom' | 'location' | 'relief', id: string) => {
      const catalog =
        kind === 'trigger' ? TRIGGERS : kind === 'symptom' ? SYMPTOMS : kind === 'location' ? LOCATIONS : RELIEF;
      return resolveLabel(catalog, id, lang);
    },
    [lang],
  );

  const saveAttack = useCallback(
    (draft: AttackDraft) => {
      const now = new Date().toISOString();
      const attack = normalizeAttack({
        ...draft,
        id: draft.id ?? newId(),
        createdAt: now,
        updatedAt: now,
      } as Attack);
      persist((current) => {
        const exists = current.attacks.some((item) => item.id === attack.id);
        const attacks = exists
          ? current.attacks.map((item) =>
              item.id === attack.id ? { ...attack, createdAt: item.createdAt } : item,
            )
          : [attack, ...current.attacks];
        return { ...current, attacks: attacks.sort((a, b) => b.date.localeCompare(a.date)) };
      });
      return attack;
    },
    [persist],
  );

  const deleteAttack = useCallback(
    (id: string) => {
      persist((current) => ({ ...current, attacks: current.attacks.filter((item) => item.id !== id) }));
    },
    [persist],
  );

  const importAttacks = useCallback(
    (incoming: Attack[], settings?: Partial<Settings>) => {
      let added = 0;
      persist((current) => {
        const merged = mergeAttacks(current.attacks, incoming);
        added = merged.length - current.attacks.length;
        return {
          ...current,
          attacks: merged,
          settings: settings ? { ...current.settings, ...settings, onboardingDone: true } : current.settings,
        };
      });
      return incoming.length > 0 ? Math.max(added, 0) || incoming.length : 0;
    },
    [persist],
  );

  const clearAttacks = useCallback(() => {
    persist((current) => ({ ...current, attacks: [] }));
  }, [persist]);

  const updateSettings = useCallback(
    (patch: Partial<Settings>) => {
      persist((current) => ({ ...current, settings: { ...current.settings, ...patch } }));
    },
    [persist],
  );

  const startTrial = useCallback(() => {
    persist((current) => (current.trial ? current : { ...current, trial: createTrial() }));
  }, [persist]);

  const applyLicense = useCallback(
    (license: License) => {
      persist((current) => ({ ...current, license }));
    },
    [persist],
  );

  const removeLicense = useCallback(() => {
    persist((current) => ({ ...current, license: undefined }));
  }, [persist]);

  const value = useMemo<AppStore>(
    () => ({
      data,
      attacks: data.attacks,
      settings: data.settings,
      lang,
      locale: lang === 'de' ? deLocale : enUS,
      pro: proStatus(data),
      t,
      labelFor,
      saveAttack,
      deleteAttack,
      importAttacks,
      clearAttacks,
      updateSettings,
      startTrial,
      applyLicense,
      removeLicense,
    }),
    [
      data,
      lang,
      t,
      labelFor,
      saveAttack,
      deleteAttack,
      importAttacks,
      clearAttacks,
      updateSettings,
      startTrial,
      applyLicense,
      removeLicense,
    ],
  );

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useApp(): AppStore {
  const store = useContext(AppStoreContext);
  if (!store) throw new Error('useApp must be used inside AppStoreProvider');
  return store;
}
