import React, { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, Check, Copy, Loader2, PartyPopper } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { redeemSession, verifyToken } from '@/lib/pro';
import { useApp } from '@/store/app-store';

export default function ProSuccess() {
  const { t, applyLicense } = useApp();
  const [params] = useSearchParams();
  const [state, setState] = useState<'loading' | 'done' | 'error'>('loading');
  const [token, setToken] = useState('');
  const [copied, setCopied] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const sessionId = params.get('session_id');
    if (!sessionId) {
      setState('error');
      return;
    }
    void (async () => {
      const redeemed = await redeemSession(sessionId);
      if (!redeemed?.token) {
        setState('error');
        return;
      }
      const license = (await verifyToken(redeemed.token)) ?? {
        token: redeemed.token,
        email: redeemed.email,
        plan: 'pro' as const,
        verifiedAt: new Date().toISOString(),
      };
      applyLicense(license);
      setToken(redeemed.token);
      setState('done');
    })();
  }, [params, applyLicense]);

  const copy = async () => {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 py-20 text-center">
      {state === 'loading' && (
        <>
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">{t('pro.processing')}</p>
        </>
      )}

      {state === 'done' && (
        <>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <PartyPopper className="h-6 w-6 text-primary" />
          </span>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">{t('pro.thanksTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('pro.thanksBody')}</p>
          </div>
          <div className="w-full space-y-1.5 text-left">
            <p className="text-xs text-muted-foreground">{t('pro.keyNotice')}</p>
            <div className="flex gap-2">
              <Input readOnly value={token} className="font-mono text-xs" />
              <Button variant="secondary" size="icon" onClick={copy} aria-label={t('pro.copy')}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <Button asChild>
            <Link to="/">{t('legal.backHome')}</Link>
          </Button>
        </>
      )}

      {state === 'error' && (
        <>
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertCircle className="h-6 w-6 text-destructive" />
          </span>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">{t('pro.failedTitle')}</h1>
            <p className="text-sm text-muted-foreground">{t('pro.restoreHint')}</p>
          </div>
          <Button asChild variant="outline">
            <Link to="/settings">{t('nav.settings')}</Link>
          </Button>
        </>
      )}
    </div>
  );
}
