import ContentPage from '@/components/ContentPage';

export const metadata = {
  title: 'Sobre Nós | Nautitour Passeios',
  description: 'Conheça a história e a equipe da Nautitour Passeios em Búzios.',
};

export default function SobreNosPage() {
  return (
    <ContentPage
      title="Sobre Nós"
      intro="Operamos passeios em Búzios há anos, com tripulação experiente e foco em segurança, conforto e diversão."
    >
      {/* TODO: substituir por texto definitivo da Nautitour */}
      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">Nossa história</h2>
      <p>Texto institucional sobre a empresa, fundação, valores e diferenciais.</p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">Nossa equipe</h2>
      <p>Capitães, marinheiros e atendimento — apresentação da equipe.</p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">Onde nos encontrar</h2>
      <p>Travessa dos Pescadores, 326 — Búzios/RJ.</p>
    </ContentPage>
  );
}
