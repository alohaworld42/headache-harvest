import React, { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { passphraseStrength } from '@/lib/crypto';
import { useApp } from '@/store/app-store';
import { cn } from '@/lib/utils';

type Mode = 'create' | 'restore';

interface BackupDialogProps {
  open: boolean;
  mode: Mode;
  onOpenChange: (open: boolean) => void;
  /** Rejects with a message to display; resolves when the operation succeeded. */
  onSubmit: (passphrase: string) => Promise<void>;
}

const MIN_LENGTH = 8;

export function BackupDialog({ open, mode, onOpenChange, onSubmit }: BackupDialogProps) {
  const { t } = useApp();
  const [passphrase, setPassphrase] = useState('');
  const [repeat, setRepeat] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPassphrase('');
      setRepeat('');
      setError(null);
      setBusy(false);
    }
  }, [open]);

  const strength = passphraseStrength(passphrase);
  const strengthLabel = t(`backup.strength.${strength}` as const);

  const submit = async () => {
    setError(null);
    if (passphrase.length < MIN_LENGTH) {
      setError(t('backup.passphraseTooShort'));
      return;
    }
    if (mode === 'create' && passphrase !== repeat) {
      setError(t('backup.passphraseMismatch'));
      return;
    }
    setBusy(true);
    try {
      await onSubmit(passphrase);
      onOpenChange(false);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : String(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle>{mode === 'create' ? t('backup.encrypted') : t('backup.restoreTitle')}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? t('backup.encryptedHint') : t('backup.restoreHint')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="backup-passphrase">{t('backup.passphrase')}</Label>
            <Input
              id="backup-passphrase"
              type="password"
              autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
              value={passphrase}
              onChange={(event) => setPassphrase(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && mode === 'restore') void submit();
              }}
            />
            {mode === 'create' && passphrase.length > 0 && (
              <p
                className={cn(
                  'text-xs',
                  strength === 'weak'
                    ? 'text-destructive'
                    : strength === 'ok'
                      ? 'text-muted-foreground'
                      : 'text-primary',
                )}
              >
                {strengthLabel}
              </p>
            )}
          </div>

          {mode === 'create' && (
            <div className="space-y-1.5">
              <Label htmlFor="backup-repeat">{t('backup.passphraseRepeat')}</Label>
              <Input
                id="backup-repeat"
                type="password"
                autoComplete="new-password"
                value={repeat}
                onChange={(event) => setRepeat(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void submit();
                }}
              />
            </div>
          )}

          {mode === 'create' && (
            <p className="rounded-xl border bg-muted/40 p-3 text-xs leading-relaxed text-muted-foreground">
              {t('backup.passphraseHint')}
            </p>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {t('action.cancel')}
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy && <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />}
            {mode === 'create' ? t('backup.create') : t('backup.restore')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
