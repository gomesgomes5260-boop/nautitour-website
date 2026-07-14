/**
 * Sanitiza um termo de busca antes de interpolá-lo num filtro `.or()` /
 * `.ilike()` do PostgREST (Supabase). O parser do PostgREST trata
 * `, ( ) . : * \` e aspas como metacaracteres — sem escapar, um termo como
 * `a,email.eq.x` consegue reescrever a lógica do filtro (PostgREST
 * injection). Aqui removemos esses caracteres (viram espaço) e colapsamos
 * espaços, deixando só um termo textual inócuo pra casar com `ilike`.
 */
export function sanitizePostgrestPattern(raw: string): string {
  return raw
    .replace(/[,().:*\\%"']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
