# Coolicons (icon set)

Set de ícones enviado no `NautitourWEB.zip` (Coolicons master). 442 SVGs categorizados.

## Estrutura

```
coolicons/
├── SVG/                  ← 442 SVGs em 14 categorias
│   ├── Arrow/
│   ├── Calendar/
│   ├── Communication/
│   ├── Edit/
│   ├── Environment/
│   ├── File/
│   ├── Interface/
│   ├── Media/
│   ├── Menu/
│   ├── Navigation/
│   ├── Shape/
│   ├── System/
│   ├── User/
│   └── Warning/
└── COOLICONS-README.md   ← README original do set
```

## Como usar no projeto

3 opções dependendo da necessidade:

### Opção 1 — SVG inline direto (1 ícone específico)
Copia o SVG do arquivo (`design/icons/coolicons/SVG/Calendar/ci-calendar.svg`) e inline em um componente React. Bom pra ícones decorativos que aparecem em poucos lugares.

```tsx
export function CalendarIcon() {
  return (
    <svg viewBox="0 0 24 24" /* ... cole do SVG aqui */ />
  );
}
```

### Opção 2 — Migrar pra `public/icons/` (se for usar muitos)
Copia os SVGs que vai usar pra `public/icons/coolicons/` e referencia via `<img src="/icons/coolicons/calendar.svg">`. Mais simples mas perde tree-shaking.

### Opção 3 — Manter `lucide-react` (já no projeto)
Lucide-react já está instalado e tem 1500+ ícones. Para a maioria dos casos, é mais conveniente (tree-shaking automático, props consistentes). Use coolicons só quando lucide não tem o equivalente exato.

## Não foi incluído no repo (mas está no zip)

- PNG variants (7.3MB redundante — SVGs já bastam)
- Webfont (1.7MB — desnecessário, usaremos SVG inline ou lucide)
- iconjar (formato proprietário do app Iconjar)

Quem quiser acessar essas variantes, está em `design/NautitourWEB.zip` (no histórico do repo) ou no ZIP original.
