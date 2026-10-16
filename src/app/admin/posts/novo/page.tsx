import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import PostForm from '../PostForm';

export const dynamic = 'force-dynamic';

export default function NovoPostPage() {
  return (
    <div>
      <Link
        href="/admin/posts"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--color-charcoal-500)] hover:text-[var(--color-charcoal-900)] transition-colors mb-6"
      >
        <ArrowLeft size={14} />
        Voltar pro material
      </Link>
      <h1 className="font-display text-2xl md:text-3xl font-semibold text-[var(--color-charcoal-900)] tracking-tight mb-1">
        Nova peça
      </h1>
      <p className="text-sm text-[var(--color-charcoal-500)] mb-6">
        Crie a peça e depois anexe os arquivos (PNG/MP4) na tela de detalhe.
      </p>
      <div className="bg-white border border-[var(--color-charcoal-100)] rounded-2xl p-5 md:p-6">
        <PostForm />
      </div>
    </div>
  );
}
