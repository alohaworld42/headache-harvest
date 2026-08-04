import React, { useRef, useState } from 'react';
import { Check, Copy, Download, FileSpreadsheet, Sparkles, Trash2, Upload } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { attacksToCsv, downloadFile, timestampedName } from '@/lib/export';
import { buildBackup, parseBackup } from '@/lib/storage';
import { useApp } from '@/store/app-store';
import { APP_VERSION } from '@/lib/version';

function Row({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b py-3.5 last:border-0">
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="surface p-4 sm:p-5">
      <h2 className="mb-1 text-sm font-medium">{title}</h2>
      <div>{children}</div>
    </section>
  );
}

export default function SettingsPage({ onUpgrade }: { onUpgrade: () => void }) {
  const { t, data, attacks, settings, lang, pro, updateSettings, importAttacks, clearAttacks } = useApp();
  const fileInput = useRef<HTMLInputElement>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [copied, setCopied] = useState(false);

  const exportJson = () => {
    if (!attacks.length) {
      toast.error(t('toast.noData'));
      return;
    }
    downloadFile(
      JSON.stringify(buildBackup(data), null, 2),
      timestampedName('kopfweh-backup', 'json'),
      'application/json',
    );
    toast.success(t('toast.exported'));
  };

  const exportCsv = () => {
    if (!pro.active) {
      onUpgrade();
      return;
    }
    if (!attacks.length) {
      toast.error(t('toast.noData'));
      return;
    }
    downloadFile(attacksToCsv(attacks, lang), timestampedName('kopfweh-export', 'csv'), 'text/csv;charset=utf-8');
    toast.success(t('toast.csvExported'));
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseBackup(String(reader.result));
        const count = importAttacks(parsed.attacks, parsed.settings);
        toast.success(t('toast.imported', count));
      } catch {
        toast.error(t('toast.importFailed'));
      }
    };
    reader.readAsText(file);
  };

  const copyLicense = async () => {
    if (!data.license?.token) return;
    await navigator.clipboard.writeText(data.license.token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('settings.subtitle')}</p>
      </header>

      <Card title={t('pro.title')}>
        {pro.active ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-sm text-primary">
              <Sparkles className="h-4 w-4" />
              {pro.source === 'trial' ? t('pro.trialActive', pro.trialDaysLeft) : t('pro.active')}
            </div>
            {data.license?.token && (
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">{t('pro.keyNotice')}</p>
                <div className="flex gap-2">
                  <Input readOnly value={data.license.token} className="font-mono text-xs" />
                  <Button variant="secondary" size="icon" onClick={copyLicense} aria-label={t('pro.copy')}>
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}
            {pro.source === 'trial' && (
              <Button size="sm" onClick={onUpgrade}>
                {t('action.upgrade')}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            <p className="text-sm text-muted-foreground">{t('pro.subtitle')}</p>
            <Button size="sm" onClick={onUpgrade}>
              {t('action.upgrade')}
            </Button>
          </div>
        )}
      </Card>

      <Card title={t('settings.title')}>
        <Row title={t('settings.language')}>
          <Select
            value={settings.language}
            onValueChange={(value) => updateSettings({ language: value as 'de' | 'en' })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="de">Deutsch</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row title={t('settings.theme')}>
          <Select
            value={settings.theme}
            onValueChange={(value) => updateSettings({ theme: value as 'light' | 'dark' | 'system' })}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">{t('settings.theme.system')}</SelectItem>
              <SelectItem value="light">{t('settings.theme.light')}</SelectItem>
              <SelectItem value="dark">{t('settings.theme.dark')}</SelectItem>
            </SelectContent>
          </Select>
        </Row>
        <Row title={t('settings.cycle')} hint={t('settings.cycleHint')}>
          <Switch
            checked={settings.trackCycle}
            onCheckedChange={(checked) => updateSettings({ trackCycle: checked })}
          />
        </Row>
        <Row title={t('settings.reminder')} hint={t('settings.reminderHint')}>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={settings.reminderTime}
              onChange={(event) => updateSettings({ reminderTime: event.target.value })}
              className="w-[110px]"
              disabled={!settings.reminderEnabled}
            />
            <Switch
              checked={settings.reminderEnabled}
              onCheckedChange={async (checked) => {
                if (checked && 'Notification' in window && Notification.permission === 'default') {
                  await Notification.requestPermission();
                }
                updateSettings({ reminderEnabled: checked });
              }}
            />
          </div>
        </Row>
      </Card>

      <Card title={t('settings.profile')}>
        <Row title={t('settings.patientName')}>
          <Input
            value={settings.patientName ?? ''}
            onChange={(event) => updateSettings({ patientName: event.target.value })}
            className="w-[200px]"
            autoComplete="name"
          />
        </Row>
        <Row title={t('settings.patientBirth')}>
          <Input
            type="date"
            value={settings.patientBirthDate ?? ''}
            onChange={(event) => updateSettings({ patientBirthDate: event.target.value })}
            className="w-[170px]"
          />
        </Row>
      </Card>

      <Card title={t('settings.data')}>
        <Row title={t('settings.exportJson')} hint={t('settings.exportJsonHint')}>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportJson}>
            <Download className="h-4 w-4" />
            {t('action.export')}
          </Button>
        </Row>
        <Row title={t('settings.importJson')} hint={t('settings.importJsonHint')}>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => fileInput.current?.click()}>
            <Upload className="h-4 w-4" />
            {t('action.import')}
          </Button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleImport}
          />
        </Row>
        <Row title={t('settings.exportCsv')} hint={t('settings.exportCsvHint')}>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={exportCsv}>
            <FileSpreadsheet className="h-4 w-4" />
            {pro.active ? t('action.export') : t('pro.badge')}
          </Button>
        </Row>
        <Row title={t('settings.danger')} hint={t('settings.dangerHint')}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-destructive hover:text-destructive"
            onClick={() => setConfirmClear(true)}
          >
            <Trash2 className="h-4 w-4" />
            {t('action.delete')}
          </Button>
        </Row>
      </Card>

      <Card title={t('settings.about')}>
        <p className="py-2 text-sm text-muted-foreground">{t('settings.privacyNote')}</p>
        <p className="text-xs text-muted-foreground">
          {t('settings.version')} {APP_VERSION} · {attacks.length} {t('common.entries')}
        </p>
      </Card>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.dangerConfirm')}</AlertDialogTitle>
            <AlertDialogDescription>{t('settings.dangerConfirmBody')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('action.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                clearAttacks();
                setConfirmClear(false);
                toast.success(t('toast.cleared'));
              }}
            >
              {t('action.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
