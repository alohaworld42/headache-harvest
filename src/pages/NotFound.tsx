import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useApp } from '@/store/app-store';

export default function NotFound() {
  const { t } = useApp();

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <p className="text-5xl font-semibold tracking-tight text-muted-foreground">404</p>
      <p className="text-sm text-muted-foreground">{t('common.notFound')}</p>
      <Button asChild variant="outline">
        <Link to="/">{t('legal.backHome')}</Link>
      </Button>
    </div>
  );
}
