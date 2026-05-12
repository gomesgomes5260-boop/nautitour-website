# public/brand/

Assets de marca servidos pela aplicação. Acessíveis em runtime via `/brand/...`.

## Arquivos

- `logomark.png` — logo principal (charcoal mono). Use como referência primária.

## Como usar em componentes

```tsx
import Image from "next/image";

export function Logo() {
  return (
    <Image
      src="/brand/logomark.png"
      alt="Nautitour Passeios"
      width={200}
      height={100}
      priority
    />
  );
}
```

## TODO

- [ ] Adicionar SVG do logo (PNG não escala bem em Retina). Pedir ao designer.
- [ ] Adicionar variants `logomark-white.png` (knockout) e `logomark-on-red.png`.
- [ ] Favicons (16, 32, apple-touch).
