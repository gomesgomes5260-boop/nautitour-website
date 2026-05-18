'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { uploadBlogImageAction } from '@/app/admin/blog/actions';

type Props = {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
};

export default function CoverImageUpload({ value, onChange, label, hint }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  function pick() {
    inputRef.current?.click();
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setErr(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append('file', file);
      const res = await uploadBlogImageAction(fd);
      if (!res.ok) {
        setErr(res.error);
        return;
      }
      onChange(res.url);
    });
  }

  return (
    <div>
      {label && (
        <label className="block text-xs font-medium text-[var(--color-charcoal-600)] mb-1">
          {label}
        </label>
      )}
      {value ? (
        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden bg-[var(--color-charcoal-100)] border border-[var(--color-charcoal-200)]">
          <Image
            src={value}
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 600px"
            unoptimized
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <button
              type="button"
              onClick={pick}
              disabled={pending}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-[var(--color-charcoal-900)] bg-white/90 hover:bg-white border border-[var(--color-charcoal-200)] disabled:opacity-50 backdrop-blur"
            >
              {pending ? <Loader2 size={12} className="animate-spin" /> : <ImagePlus size={12} />}
              Trocar
            </button>
            <button
              type="button"
              onClick={() => onChange(null)}
              disabled={pending}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium text-white bg-[var(--color-red-600)]/90 hover:bg-[var(--color-red-700)] disabled:opacity-50 backdrop-blur"
            >
              <Trash2 size={12} />
              Remover
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={pick}
          disabled={pending}
          className="w-full aspect-[16/9] flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[var(--color-charcoal-300)] bg-[var(--color-charcoal-50)] hover:bg-[var(--color-charcoal-100)] hover:border-[var(--color-charcoal-400)] text-[var(--color-charcoal-600)] transition-colors disabled:opacity-50"
        >
          {pending ? (
            <>
              <Loader2 size={24} className="animate-spin" />
              <span className="text-sm">Enviando…</span>
            </>
          ) : (
            <>
              <ImagePlus size={24} />
              <span className="text-sm font-medium">Adicionar imagem</span>
              <span className="text-xs">JPG, PNG, WEBP ou AVIF · até 10 MB</span>
            </>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        onChange={handleFile}
        className="hidden"
      />

      {hint && !err && (
        <p className="text-xs text-[var(--color-charcoal-500)] mt-1.5">{hint}</p>
      )}
      {err && (
        <p className="text-xs text-[var(--color-red-700)] mt-1.5">{err}</p>
      )}
    </div>
  );
}
