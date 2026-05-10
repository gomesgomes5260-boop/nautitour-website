import ContentPage from '@/components/ContentPage';

export const metadata = {
  title: 'Política de Privacidade | Nautitour Passeios',
  description: 'Como tratamos seus dados pessoais conforme a LGPD.',
};

// TODO: revisar com assessoria jurídica antes do go-live
export default function PrivacidadePage() {
  return (
    <ContentPage
      title="Política de Privacidade"
      intro="Última atualização: maio/2026. Esta versão é preliminar e deve ser revisada por assessoria jurídica antes da publicação oficial."
    >
      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">1. Dados que coletamos</h2>
      <p>
        Quando você reserva um passeio ou solicita um orçamento, coletamos: nome
        completo, e-mail, telefone, CPF (opcional) e dados dos passageiros. Em
        pagamentos online, dados financeiros são processados pelo gateway
        Pagar.me — não armazenamos números de cartão em nossos servidores.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">2. Como usamos seus dados</h2>
      <p>
        Usamos seus dados para confirmar reservas, organizar embarque, enviar
        comunicações relacionadas ao passeio e cumprir obrigações legais.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">3. Compartilhamento</h2>
      <p>
        Não vendemos seus dados. Compartilhamos apenas com prestadores
        necessários para a operação do passeio (gateway de pagamento,
        infraestrutura de hospedagem) e quando exigido por lei.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">4. Seus direitos</h2>
      <p>
        Conforme a LGPD, você pode solicitar acesso, correção, exclusão ou
        portabilidade dos seus dados a qualquer momento entrando em contato
        pelo e-mail listado em nossa página de contato.
      </p>

      <h2 className="text-2xl font-bold text-gray-800 mt-8 mb-2">5. Retenção</h2>
      <p>
        Mantemos seus dados pelo tempo necessário para cumprir as finalidades
        descritas e obrigações legais (mínimo de 5 anos para registros fiscais).
      </p>
    </ContentPage>
  );
}
