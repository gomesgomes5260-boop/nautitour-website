# Logos de certificação / órgãos reguladores

Logos oficiais usadas no bloco "Certificados pelos principais órgãos reguladores" do componente `src/components/WhyChooseUs.tsx`.

## Arquivos esperados

Drope aqui (PNG com **fundo transparente**, idealmente 200–400px de altura):

- `cadastur.png` — logo do Cadastur / Ministério do Turismo
- `marinha.png` — brasão / logo da Marinha do Brasil
- `prefeitura-buzios.png` — brasão / logo da Prefeitura de Armação dos Búzios
- `turista-seguro.png` — selo do programa Turista Seguro

## Onde encontrar (fontes oficiais)

| Arquivo | Onde baixar |
|---|---|
| `cadastur.png` | [gov.br/turismo — Marcas e logotipos](https://www.gov.br/turismo/pt-br/secretaria-especial-da-cultura/centrais-de-conteudo/marcas-e-logotipos-1) OU [logodownload.org/cadastur](https://logodownload.org/cadastur-logo/) |
| `marinha.png` | [Wikimedia Commons — Brazilian Navy](https://commons.wikimedia.org/wiki/File:Logo_of_the_Brazilian_Navy.svg) OU [logodownload.org/marinha](https://logodownload.org/marinha-do-brasil-logo/) |
| `prefeitura-buzios.png` | [Manual da Marca da Prefeitura (PDF 2019)](https://transparencia.buzios.rj.gov.br/arquivos/571/MANUAL%20DA%20MARCA%20DA%20PREFEITURA__2019_0000001.pdf) — extrair brasão + lockup da capa |
| `turista-seguro.png` | [turistaseguro.com.br](https://turistaseguro.com.br/home/) — selo oficial do programa |

## Especificações

- **Formato**: PNG com transparência (SVG também funciona — só ajustar o `<Image>` no componente)
- **Altura ideal**: 200–400px (vão ser renderizados em 40px no componente, mas alta resolução pra suportar retina)
- **Aspect ratio**: livre — o componente usa `object-contain` num container 56×56 (`w-14 h-14`)
- **Cores**: cores originais oficiais (não convertem pra mono — perde reconhecimento de marca)

## ⚠️ Antes de mergear

Se você abrir a PR sem os arquivos, o preview do Vercel vai mostrar imagens quebradas. Drope os 3 PNGs e dê push antes de pedir review.
