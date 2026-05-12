# Design — Inspirações & Pesquisa

Pasta de trabalho pro redesign UI/UX (Tier UI/UX do roadmap). Não vai pra produção — é referência interna pra time de design + dev.

## Estrutura

```
design/
├── inspirations/          # Prints e refs visuais que você coleta
│   ├── framework/         # Sistemas de design completos (Linear, Stripe, Airbnb, Vercel...)
│   ├── home/              # Páginas iniciais inspiradoras
│   ├── checkout/          # Fluxos de pagamento bem feitos
│   ├── components/        # Botões, cards, modais, inputs...
│   ├── icons/             # Estilos de iconografia (line, filled, duotone...)
│   ├── typography/        # Pairings de fontes (display + body)
│   ├── colors/            # Paletas que te inspiram
│   ├── mobile/            # Designs especificamente mobile (apps, m.sites)
│   └── tours-competitors/ # Sites de turismo / passeio / experiência (concorrência direta)
└── research/              # Documentos gerados (HTMLs, markdowns, dados)
    ├── 00-status.html         # Status geral do projeto
    ├── 01-fase1-personas.html # Personas + journey + brand voice
    └── ...                    # Próximas fases entram aqui
```

## Como adicionar prints às inspirações

1. Tira o print (cmd+shift+4 no Mac, recorte no Windows, ferramenta do navegador)
2. Salva na pasta correspondente. Nome do arquivo descritivo, ex:
   - `framework/linear-typography-2024.png`
   - `home/airbnb-experiences-hero.png`
   - `checkout/stripe-3steps-mobile.png`
3. Se quiser anotar contexto, cria `notes.md` na pasta com bullets do tipo:
   ```
   - linear-typography-2024.png — pairing de fonte que gosto. Inter + Inter Display?
   - airbnb-experiences-hero.png — quero hero grande assim mas com nossa paleta
   ```

## Como visualizar os HTMLs de `research/`

3 opções (em ordem de praticidade):

### Opção 1 — VS Code Live Preview (recomendado)

1. Instala a extensão **"Live Preview"** da Microsoft (publisher `ms-vscode.live-server` ou similar)
2. Botão direito no arquivo `.html` → **"Show Preview"** ou **"Open with Live Preview"**
3. Abre painel lateral renderizando em tempo real

### Opção 2 — Browser direto

Abre o arquivo direto pelo Finder/Files no caminho:
```
file:///caminho/completo/do/repo/design/research/01-fase1-personas.html
```

Funciona em qualquer browser. Não renderiza requests externos com restrição CORS, mas pros nossos HTMLs (CSS inline, sem fetch) funciona 100%.

### Opção 3 — HTTP server local (1 comando)

```bash
cd design/research
python3 -m http.server 8765
```

Abre `http://localhost:8765` no browser. Lista todos os arquivos da pasta.

## Por que não está hosted publicamente

Esses docs são pesquisa interna — não querem ir pro Vercel público porque (a) podem conter dados sensíveis em alguns casos, (b) poluem o domínio principal. Se em algum momento for útil compartilhar com cliente/designer externo, dá pra subir num Vercel Preview separado ou GitHub Pages privado.
