// Preço "a partir de" da lancha privativa usado nas PEÇAS DE MARKETING
// (card do hero na home + box de cross-sell na página da escuna). O preço
// transacional autoritativo vive no banco (tours.base_price_cents da
// 'lancha-privativa'); esta é a vitrine — mantida como fonte única pra não
// divergir entre as páginas. Ao mudar o piso da lancha, ajustar aqui.
export const LANCHA_PRICE_FROM = 'R$ 1.200';
