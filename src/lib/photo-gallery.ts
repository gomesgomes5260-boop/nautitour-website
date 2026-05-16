// Curadorias estáticas de fotos por página. Path relativo a /public.
// Adicionar/remover fotos aqui sem tocar nas páginas.

export type Photo = {
  src: string;
  alt: string;
};

// Helper pra construir paths uniformes.
const p = (subpath: string): string => `/images/photos/${subpath}`;

// === Home: mix de melhores momentos (drone + clientes + ilhas + escuna) ===
export const HOME_GALLERY: Photo[] = [
  { src: p('aerea/drone-praia-01.jpg'), alt: 'Vista aérea de praia em Búzios' },
  { src: p('ilhas/ilha-falesia-01.jpg'), alt: 'Ilha com falésia nas águas de Búzios' },
  { src: p('clientes/familia-bordo-01.jpg'), alt: 'Família a bordo da escuna' },
  { src: p('aerea/drone-tartaruga-01.jpg'), alt: 'Vista aérea da Praia da Tartaruga' },
  { src: p('ilhas/snorkel-ilha-01.jpg'), alt: 'Snorkel em ilha cristalina' },
  { src: p('clientes/pulo-bordo-01.jpg'), alt: 'Pulo da escuna pra água' },
  { src: p('aerea/drone-joao-fernandes-01.jpg'), alt: 'Vista aérea da praia de João Fernandes' },
  { src: p('clientes/casal-proa-01.jpg'), alt: 'Casal na proa da escuna' },
  { src: p('ilhas/trampolim-01.jpg'), alt: 'Trampolim da escuna' },
  { src: p('escuna/escuna-pier-01.jpg'), alt: 'Escuna Nautitour no píer' },
  { src: p('drinks-bordo/drink-vista-01.jpg'), alt: 'Drink com vista pro mar' },
  { src: p('clientes/grupo-eu-buzios-01.jpg'), alt: 'Grupo na placa Eu Amo Búzios' },
];

// === Passeio Escuna: foco na escuna + experiência + ilhas ===
export const PASSEIO_ESCUNA_GALLERY: Photo[] = [
  { src: p('escuna/escuna-pier-01.jpg'), alt: 'Escuna Nautitour no píer de Búzios' },
  { src: p('clientes/clientes-deck-01.jpg'), alt: 'Clientes no deck da escuna' },
  { src: p('ilhas/ilha-falesia-01.jpg'), alt: 'Ilha com falésia visitada no passeio' },
  { src: p('escuna/escuna-transito-01.jpg'), alt: 'Escuna em trânsito pelas águas de Búzios' },
  { src: p('clientes/familia-bordo-01.jpg'), alt: 'Família curtindo o passeio a bordo' },
  { src: p('ilhas/snorkel-ilha-01.jpg'), alt: 'Snorkel em ilha cristalina' },
  { src: p('escuna/rede-proa-01.jpg'), alt: 'Rede na proa da escuna' },
  { src: p('clientes/criancas-bordo-01.jpg'), alt: 'Crianças a bordo da escuna' },
  { src: p('ilhas/trampolim-01.jpg'), alt: 'Trampolim pra água cristalina' },
  { src: p('escuna/mastros-pier-01.jpg'), alt: 'Mastros da escuna ao entardecer' },
  { src: p('drinks-bordo/bar-bordo-01.jpg'), alt: 'Bar a bordo da escuna' },
  { src: p('clientes/snorkel-bordo-01.jpg'), alt: 'Snorkel a partir da escuna' },
  { src: p('ilhas/snorkel-ilha-02.jpg'), alt: 'Mais um spot de snorkel' },
  { src: p('escuna/escuna-pier-02.jpg'), alt: 'Escuna ancorada no píer' },
  { src: p('drinks-bordo/drink-vista-01.jpg'), alt: 'Drink com vista pro mar' },
];

// === Passeio Lancha Privativa: aéreas + clientes íntimos ===
export const PASSEIO_LANCHA_GALLERY: Photo[] = [
  { src: p('aerea/drone-tartaruga-01.jpg'), alt: 'Vista aérea da Praia da Tartaruga' },
  { src: p('clientes/casal-proa-01.jpg'), alt: 'Casal aproveitando a lancha privativa' },
  { src: p('aerea/drone-joao-fernandes-01.jpg'), alt: 'Vista aérea da praia de João Fernandes' },
  { src: p('ilhas/ilha-falesia-01.jpg'), alt: 'Ilha visitada na lancha' },
  { src: p('aerea/drone-praia-01.jpg'), alt: 'Praia paradisíaca vista do drone' },
  { src: p('clientes/modelo-vista-01.jpg'), alt: 'Vista privilegiada da lancha' },
  { src: p('aerea/drone-ilha-feia-01.jpg'), alt: 'Vista aérea da Ilha Feia' },
  { src: p('clientes/cliente-foto-proa-01.jpg'), alt: 'Cliente fotografando na proa' },
  { src: p('ilhas/ilha-rochosa-01.jpg'), alt: 'Ilha rochosa de Búzios' },
  { src: p('ilhas/snorkel-ilha-01.jpg'), alt: 'Snorkel em ilha cristalina' },
  { src: p('drinks-bordo/drink-vista-01.jpg'), alt: 'Drink com vista pro mar' },
  { src: p('buzios/porto-buzios-01.jpg'), alt: 'Porto de Búzios' },
];

// === Locação Escuna: grupos + bar + equipe (eventos) ===
export const LOCACAO_ESCUNA_GALLERY: Photo[] = [
  { src: p('escuna/escuna-pier-01.jpg'), alt: 'Escuna pronta pra evento privado' },
  { src: p('clientes/grupo-eu-buzios-01.jpg'), alt: 'Grupo na placa Eu Amo Búzios' },
  { src: p('drinks-bordo/bar-bordo-01.jpg'), alt: 'Bar completo a bordo' },
  { src: p('clientes/clientes-deck-01.jpg'), alt: 'Grupo no deck da escuna' },
  { src: p('drinks-bordo/bar-gins-01.jpg'), alt: 'Variedade de gins no bar' },
  { src: p('clientes/clientes-deck-02.jpg'), alt: 'Grupo grande aproveitando o passeio' },
  { src: p('drinks-bordo/cardapio-bar-01.jpg'), alt: 'Cardápio do bar a bordo' },
  { src: p('equipe/bar-equipe-01.jpg'), alt: 'Equipe atendendo no bar' },
  { src: p('escuna/escuna-pier-02.jpg'), alt: 'Escuna ancorada pronta pra grupo' },
  { src: p('drinks-bordo/morango-vodka-01.jpg'), alt: 'Drink especial morango com vodka' },
  { src: p('clientes/familia-bordo-01.jpg'), alt: 'Família a bordo' },
  { src: p('equipe/atendimento-loja-01.jpg'), alt: 'Atendimento na loja Nautitour' },
  { src: p('escuna/mastros-pier-01.jpg'), alt: 'Mastros da escuna' },
  { src: p('drinks-bordo/drink-vista-01.jpg'), alt: 'Drink com vista pro mar' },
];
