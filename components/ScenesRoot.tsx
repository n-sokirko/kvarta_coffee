'use client';

import { useEffect, useRef } from 'react';
import { captureSource } from '@/lib/source';
import { getSelectedCoffee } from '@/lib/bus';
// @ts-ignore: обычный JS-модуль без типов
import { createScenes } from '@/lib/scenes';

/** Обёртка страницы: подключает WebGL-сцены и запоминает источник захода. Содержимое остаётся серверным. */
export default function ScenesRoot({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    captureSource();
    if (!ref.current) return;
    const scenes = createScenes(ref.current, getSelectedCoffee);
    const onSel = () => scenes.refreshPreview();
    window.addEventListener('kv:sel', onSel);
    return () => {
      window.removeEventListener('kv:sel', onSel);
      scenes.dispose();
    };
  }, []);
  return (
    <div className="kv" id="kv" ref={ref}>
      {children}
    </div>
  );
}
