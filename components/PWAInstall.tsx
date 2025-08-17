'use client';
import { useEffect, useState } from 'react';

export default function PWAInstall() {
  const [deferred, setDeferred] = useState<any>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      // evita o mini-infobar padrão e guarda o evento
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const onInstall = async () => {
    if (!deferred) return;
    deferred.prompt();
    await deferred.userChoice; // 'accepted' | 'dismissed'
    setDeferred(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <button
      onClick={onInstall}
      className="fixed bottom-4 right-4 z-50 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 shadow-lg"
    >
      Instalar app
    </button>
  );
}
