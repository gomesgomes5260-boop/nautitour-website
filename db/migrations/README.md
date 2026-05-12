# Migrations Supabase

Histórico das migrations aplicadas no projeto Supabase do Nautitour. **Esta pasta é só pra rastreamento.** As migrations efetivamente vivem no Supabase remoto e são aplicadas via dashboard ou MCP (`mcp__supabase__apply_migration`).

Use os arquivos aqui pra:
- Code review da SQL antes de aplicar
- Histórico legível (sem precisar do dashboard)
- Re-aplicar em branch ou ambiente staging

## Como aplicar uma migration

Via Supabase MCP:
```ts
apply_migration({
  project_id: 'uydvnjcqrfjacwburvuo',
  name: '017_escuna_schedule_factory',
  query: '<conteúdo do arquivo .sql>'
});
```

Ou via Supabase Dashboard → Database → Migrations.

## Convenção de nomes

`NNN_descricao_curta.sql` — NNN começa em `001` e segue a sequência.
