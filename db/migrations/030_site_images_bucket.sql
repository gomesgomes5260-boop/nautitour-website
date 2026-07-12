-- 030_site_images_bucket.sql
-- Aplicada no projeto Supabase `uydvnjcqrfjacwburvuo` (Nutitour).
--
-- Biblioteca de imagens do site (/admin/imagens): capas de produto, galeria
-- e mídia geral. Mesmo padrão do blog-images (023): bucket público servido
-- via CDN; escrita só via service role (server actions com gate de owner).
-- Uploads chegam já otimizados pelo browser (máx 2560px, WebP) — originais
-- de câmera ficam no Google Drive, fora do código.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-images',
  'site-images',
  true,
  15728640, -- 15 MiB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = EXCLUDED.public,
  file_size_limit    = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Sem RLS policy explícita: bucket público já serve URLs via CDN sem auth.
-- Uma SELECT policy genérica permitiria listar todos os arquivos via API
-- (advisor warn `public_bucket_allows_listing`), exposição desnecessária.
