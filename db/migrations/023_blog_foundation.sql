-- Migration 023: Blog foundation
-- Aplicada via MCP Supabase (apply_migration). Esta cópia é só rastreio histórico.
--
-- Cria infraestrutura inicial pro blog:
--   1. blog_categories — categorias planas (slug + name + description)
--   2. blog_posts — posts com status draft/published, content jsonb (BlockNote),
--      cover image obrigatória ao publicar, SEO meta opcionais
--   3. RLS: leitura pública só do que está published e publicado no passado;
--      escrita restrita a admins (via public.is_admin)
--   4. Storage bucket `blog-images` público pra leitura. Uploads via server
--      action com admin client (service role bypassa RLS).
--
-- Convenção de RLS otimizada (initplan): `(SELECT auth.uid())` em vez de
-- `auth.uid()` — Postgres avalia uma vez por query.

-- =========================================================================
-- 1. blog_categories
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.blog_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.blog_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS blog_categories_public_select ON public.blog_categories;
CREATE POLICY blog_categories_public_select ON public.blog_categories
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS blog_categories_admin_all ON public.blog_categories;
CREATE POLICY blog_categories_admin_all ON public.blog_categories
  FOR ALL TO public
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

-- =========================================================================
-- 2. blog_posts
-- =========================================================================
CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  excerpt text,
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover_image_url text,
  cover_image_alt text,
  category_id uuid REFERENCES public.blog_categories(id) ON DELETE SET NULL,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  seo_title text,
  seo_description text,
  og_image_url text,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  -- Ao publicar, exige cover + published_at preenchidos.
  CONSTRAINT blog_posts_published_requires_cover
    CHECK (status = 'draft' OR cover_image_url IS NOT NULL),
  CONSTRAINT blog_posts_published_requires_date
    CHECK (status = 'draft' OR published_at IS NOT NULL)
);

-- Index pro paginated list por status (apenas published, ordenado desc por data)
CREATE INDEX IF NOT EXISTS blog_posts_published_idx
  ON public.blog_posts(published_at DESC)
  WHERE status = 'published';

-- Covering indexes pras FKs (evita seq scan em joins / cascades)
CREATE INDEX IF NOT EXISTS blog_posts_category_idx
  ON public.blog_posts(category_id)
  WHERE category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS blog_posts_author_idx
  ON public.blog_posts(author_id)
  WHERE author_id IS NOT NULL;

ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Leitura pública: só published e com published_at no passado (permite agendar).
DROP POLICY IF EXISTS blog_posts_public_select ON public.blog_posts;
CREATE POLICY blog_posts_public_select ON public.blog_posts
  FOR SELECT TO public
  USING (status = 'published' AND published_at IS NOT NULL AND published_at <= now());

-- Admins têm acesso total (CRUD).
DROP POLICY IF EXISTS blog_posts_admin_all ON public.blog_posts;
CREATE POLICY blog_posts_admin_all ON public.blog_posts
  FOR ALL TO public
  USING (public.is_admin((SELECT auth.uid())))
  WITH CHECK (public.is_admin((SELECT auth.uid())));

-- =========================================================================
-- 3. Storage bucket blog-images
-- =========================================================================
-- Bucket público pra leitura (URLs servidas direto pelo CDN do Supabase).
-- Uploads via server action com admin client — service_role bypassa RLS.
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images',
  true,
  10485760, -- 10 MiB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Sem RLS policy explícita: bucket público já serve URLs via CDN sem auth.
-- Uma SELECT policy genérica permitiria listar todos os arquivos via API
-- (advisor warn `public_bucket_allows_listing`), exposição desnecessária.
-- Escritas (upload/update/delete) acontecem via server actions com admin
-- client — service_role bypassa RLS.
