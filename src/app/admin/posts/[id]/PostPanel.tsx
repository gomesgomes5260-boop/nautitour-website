'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Check, Download, Trash2, Upload, Film } from 'lucide-react';
import ConfirmModal from '@/components/ConfirmModal';
import { STATUS_META, type SocialStatus } from '../redes';
import { uploadAssetsAction, deleteAssetAction, setStatusAction, deletePostAction } from '../actions';

type AssetView = {
  id: string;
  nome: string;
  formato: string | null;
  mime: string | null;
  largura: number | null;
  altura: number | null;
  viewUrl: string | null;
  downloadUrl: string | null;
};

export default function PostPanel({
  postId, status, legenda, hashtags, assets, isOwner,
}: {
  postId: string;
  status: SocialStatus;
  legenda: string;
  hashtags: string[];
  assets: AssetView[];
  isOwner: boolean;
}) {
  const router = useRouter();
  const [err, setErr] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [confirmaApagarPost, setConfirmaApagarPost] = useState(false);
  const [apagarAsset, setApagarAsset] = useState<AssetView | null>(null);
  const [pending, startTransition] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function roda(fn: () => Promise<{ ok: boolean; error?: string }>, aposOk?: () => void) {
    setErr(null);
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) { setErr(res.error ?? 'Erro'); return; }
      aposOk?.();
      router.refresh();
    });
  }

  async function copiar() {
    const texto = [legenda.trim(), hashtags.join(' ')].filter(Boolean).join('\n\n');
    try {
      await navigator.clipboard.writeText(texto);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setErr('Não consegui copiar — selecione e copie manualmente.');
    }
  }

  function enviarArquivos(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fd = new FormData();
    for (const f of Array.from(files)) fd.append('files', f);
    roda(() => uploadAssetsAction(postId, fd), () => { if (fileRef.current) fileRef.current.value = ''; });
  }

  return (
    <section className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-5 md:p-6">
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <h2 className="font-display text-lg font-semibold text-[var(--color-charcoal-900)]">
          Arquivos da peça
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={copiar}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-charcoal-200)] bg-white text-[var(--color-charcoal-900)] text-xs font-bold px-3 py-1.5 hover:border-[var(--color-charcoal-400)] transition-colors"
          >
            {copied ? <Check size={13} className="text-[var(--color-success)]" /> : <Copy size={13} />}
            {copied ? 'Copiado!' : 'Copiar legenda + hashtags'}
          </button>
          <label className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-charcoal-900)] text-white text-xs font-bold px-3 py-1.5 cursor-pointer hover:bg-black transition-colors">
            <Upload size={13} />
            {pending ? 'Enviando…' : 'Adicionar arquivos'}
            <input
              ref={fileRef}
              type="file"
              multiple
              accept="image/png,image/jpeg,image/webp,video/mp4"
              className="hidden"
              onChange={enviarArquivos}
              disabled={pending}
            />
          </label>
        </div>
      </div>

      {assets.length === 0 ? (
        <p className="text-sm text-[var(--color-charcoal-500)]">
          Nenhum arquivo ainda — suba os PNG/MP4 exportados (no carrossel, na ordem dos quadros).
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {assets.map((a) => (
            <div key={a.id} className="group relative rounded-xl border border-[var(--color-charcoal-100)] overflow-hidden bg-[var(--color-charcoal-50)]">
              <div className="aspect-[4/5] relative">
                {a.mime === 'video/mp4' && a.viewUrl ? (
                  <video src={a.viewUrl} controls preload="metadata" className="absolute inset-0 w-full h-full object-contain bg-black" />
                ) : a.viewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- URL assinada temporária
                  <img src={a.viewUrl} alt={a.nome} className="absolute inset-0 w-full h-full object-contain" loading="lazy" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-[var(--color-charcoal-400)]">
                    <Film size={24} />
                  </div>
                )}
              </div>
              <div className="p-2 text-[11px] text-[var(--color-charcoal-500)] flex items-center justify-between gap-2">
                <span className="truncate" title={a.nome}>
                  {a.formato ?? '—'}{a.largura ? ` · ${a.largura}×${a.altura}` : ''}
                </span>
                <span className="flex items-center gap-1 shrink-0">
                  {a.downloadUrl && (
                    <a
                      href={a.downloadUrl}
                      className="inline-flex items-center gap-1 rounded-full bg-[var(--color-charcoal-900)] text-white px-2 py-1 font-bold hover:bg-black transition-colors"
                      title={`Baixar ${a.nome}`}
                    >
                      <Download size={11} />
                      {a.mime === 'video/mp4' ? 'MP4' : 'PNG'}
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => setApagarAsset(a)}
                    className="inline-flex items-center rounded-full border border-[var(--color-charcoal-200)] text-[var(--color-charcoal-500)] px-1.5 py-1 hover:text-[var(--color-red-700)] hover:border-[var(--color-red-200)] transition-colors"
                    title="Remover arquivo"
                  >
                    <Trash2 size={11} />
                  </button>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status (owner) + apagar peça (owner) */}
      <div className="mt-5 pt-5 border-t border-[var(--color-charcoal-100)] flex items-center justify-between flex-wrap gap-3">
        {isOwner ? (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-charcoal-500)]">
              Status
            </span>
            {(Object.keys(STATUS_META) as SocialStatus[]).map((s) => (
              <button
                key={s}
                type="button"
                disabled={pending || s === status}
                onClick={() => roda(() => setStatusAction(postId, s))}
                className={`rounded-full border px-2.5 py-1 text-[10px] font-bold transition-colors disabled:cursor-default ${
                  s === status
                    ? STATUS_META[s].cls
                    : 'bg-white border-[var(--color-charcoal-200)] text-[var(--color-charcoal-500)] hover:border-[var(--color-charcoal-400)]'
                }`}
              >
                {STATUS_META[s].label}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-[var(--color-charcoal-500)]">
            Mudança de status e exclusão são do owner.
          </p>
        )}
        {isOwner && (
          <button
            type="button"
            onClick={() => setConfirmaApagarPost(true)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--color-red-700)] hover:underline"
          >
            <Trash2 size={13} />
            Apagar peça
          </button>
        )}
      </div>

      {err && <p className="mt-3 text-xs font-semibold text-[var(--color-red-700)]">{err}</p>}

      <ConfirmModal
        open={apagarAsset !== null}
        onClose={() => setApagarAsset(null)}
        onConfirm={() => {
          const alvo = apagarAsset;
          setApagarAsset(null);
          if (alvo) roda(() => deleteAssetAction(alvo.id));
        }}
        title="Remover arquivo?"
        description={`O arquivo ${apagarAsset?.nome ?? ''} sai do bucket e da peça. Dá pra subir de novo depois.`}
        confirmLabel="Remover"
        pending={pending}
      />
      <ConfirmModal
        open={confirmaApagarPost}
        onClose={() => setConfirmaApagarPost(false)}
        onConfirm={() => {
          setConfirmaApagarPost(false);
          roda(() => deletePostAction(postId), () => router.push('/admin/posts'));
        }}
        title="Apagar a peça inteira?"
        description="Apaga a peça, a estratégia e todos os arquivos do bucket. Não dá pra desfazer."
        confirmLabel="Apagar peça"
        pending={pending}
      />
    </section>
  );
}
