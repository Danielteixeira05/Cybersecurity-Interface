export type PublicContentScope = 'services' | 'contact';

export interface PublicContentDraftTemplate {
  chave: string;
  titulo: string;
  subtitulo: string;
  corpo: string;
  imagem_url: string;
  ativo: boolean;
  ordem: number;
}

export interface PublicContentEditorPreset {
  chave: string;
  scope: PublicContentScope;
  label: string;
  description: string;
  repeatable?: boolean;
  draft: PublicContentDraftTemplate;
}

export const PUBLIC_CONTENT_KEYS = {
  servicesHero: 'servicos_cabecalho',
  servicesProof: 'servicos_prova',
  servicesCatalog: 'servicos_catalogo',
  service: 'servico',
  servicesProcessHeader: 'servicos_processo_cabecalho',
  servicesProcessStep: 'servicos_processo_etapa',
  servicesNis2Header: 'servicos_nis2_cabecalho',
  servicesNis2Requirement: 'servicos_nis2_requisito',
  servicesNis2Cta: 'servicos_nis2_cta',
  servicesFinalCta: 'servicos_cta_final',
  contactHero: 'contacto_cabecalho',
  contactForm: 'contacto_formulario',
  contactChannel: 'contacto_canal',
  contactSchedule: 'contacto_horario',
  contactCertification: 'contacto_certificacao',
} as const;

const activeDraft = (chave: string, titulo = '', subtitulo = '', corpo = '', ordem = 0): PublicContentDraftTemplate => ({
  chave,
  titulo,
  subtitulo,
  corpo,
  imagem_url: '',
  ativo: true,
  ordem,
});

export const PUBLIC_CONTENT_EDITOR_PRESETS: readonly PublicContentEditorPreset[] = [
  {
    chave: PUBLIC_CONTENT_KEYS.servicesHero,
    scope: 'services',
    label: 'Cabeçalho de Serviços',
    description: 'Título, etiqueta e texto introdutório. Use “|” no título para destacar a segunda parte.',
    draft: activeDraft(PUBLIC_CONTENT_KEYS.servicesHero, 'Proteção abrangente para |cada ameaça.', 'Os Nossos Serviços · Equipa Certificada', 'Do SOC 24/7 à conformidade NIS2, a nossa equipa certificada cobre todo o ciclo de vida da cibersegurança empresarial.'),
  },
  {
    chave: PUBLIC_CONTENT_KEYS.servicesProof,
    scope: 'services',
    label: 'Compromisso de Serviço',
    description: 'Bloco repetível: título e detalhe de um compromisso. A ordem controla a posição.',
    repeatable: true,
    draft: activeDraft(PUBLIC_CONTENT_KEYS.servicesProof, 'Certificado CNCS', 'Autoridade Nacional'),
  },
  {
    chave: PUBLIC_CONTENT_KEYS.servicesCatalog,
    scope: 'services',
    label: 'Introdução ao Catálogo',
    description: 'Título, etiqueta e texto apresentados antes dos cartões de serviço.',
    draft: activeDraft(PUBLIC_CONTENT_KEYS.servicesCatalog, 'O que oferecemos', 'Catálogo de Serviços', 'Todos os serviços são prestados pela nossa equipa certificada com SLAs documentados.'),
  },
  {
    chave: PUBLIC_CONTENT_KEYS.service,
    scope: 'services',
    label: 'Serviço',
    description: 'Bloco repetível: título, preço/subtítulo e funcionalidades, uma por linha no corpo.',
    repeatable: true,
    draft: activeDraft(PUBLIC_CONTENT_KEYS.service, 'Nome do serviço', 'A partir de …', 'Funcionalidade 1\nFuncionalidade 2'),
  },
  {
    chave: PUBLIC_CONTENT_KEYS.servicesProcessHeader,
    scope: 'services',
    label: 'Introdução ao Processo',
    description: 'Título, etiqueta e texto da secção “Como trabalhamos”.',
    draft: activeDraft(PUBLIC_CONTENT_KEYS.servicesProcessHeader, 'O nosso processo', 'Como Trabalhamos', 'Metodologia estruturada para garantir resultados consistentes em cada projeto.'),
  },
  {
    chave: PUBLIC_CONTENT_KEYS.servicesProcessStep,
    scope: 'services',
    label: 'Etapa do Processo',
    description: 'Bloco repetível: título e descrição. A ordem determina a numeração e a posição.',
    repeatable: true,
    draft: activeDraft(PUBLIC_CONTENT_KEYS.servicesProcessStep, 'Avaliação', '', 'Diagnóstico inicial do estado de segurança e identificação de lacunas.'),
  },
  {
    chave: PUBLIC_CONTENT_KEYS.servicesNis2Header,
    scope: 'services',
    label: 'Introdução NIS2',
    description: 'Título, etiqueta e explicação da secção NIS2.',
    draft: activeDraft(PUBLIC_CONTENT_KEYS.servicesNis2Header, 'O que é a NIS2 e o que implica para a sua empresa?', 'Diretiva NIS2', 'A Diretiva NIS2 (Network and Information Security 2) é a lei europeia de cibersegurança mais abrangente até à data. Entrou em vigor em outubro de 2024 e obriga milhares de organizações portuguesas a adotarem medidas concretas de segurança.'),
  },
  {
    chave: PUBLIC_CONTENT_KEYS.servicesNis2Requirement,
    scope: 'services',
    label: 'Requisito NIS2',
    description: 'Bloco repetível: título e explicação de um requisito.',
    repeatable: true,
    draft: activeDraft(PUBLIC_CONTENT_KEYS.servicesNis2Requirement, 'Quem é abrangido?', '', 'Descrição do requisito NIS2.'),
  },
  {
    chave: PUBLIC_CONTENT_KEYS.servicesNis2Cta,
    scope: 'services',
    label: 'Chamada NIS2',
    description: 'Título e texto da chamada à ação. A URL de imagem é usada como ligação externa opcional.',
    draft: activeDraft(PUBLIC_CONTENT_KEYS.servicesNis2Cta, 'Não tem a certeza se a sua organização é abrangida?', '', 'A CiberBoxSecur realiza uma avaliação inicial de conformidade NIS2 para determinar os passos a seguir.'),
  },
  {
    chave: PUBLIC_CONTENT_KEYS.servicesFinalCta,
    scope: 'services',
    label: 'Chamada Final de Serviços',
    description: 'Título, etiqueta e texto da chamada final. Use “|” no título para destacar a segunda parte.',
    draft: activeDraft(PUBLIC_CONTENT_KEYS.servicesFinalCta, 'Pronto para Proteger o|Seu Negócio?', 'Comece Hoje', 'Agende uma demonstração gratuita e veja como a CiberBoxSecur pode proteger a sua empresa.'),
  },
  {
    chave: PUBLIC_CONTENT_KEYS.contactHero,
    scope: 'contact',
    label: 'Cabeçalho de Contacto',
    description: 'Título, etiqueta e texto introdutório. Use “|” no título para destacar a segunda parte.',
    draft: activeDraft(PUBLIC_CONTENT_KEYS.contactHero, 'Estamos prontos para|proteger a sua empresa.', 'Fale Connosco · Resposta em 1 dia útil', 'Contacte a nossa equipa de especialistas para uma avaliação gratuita ou para saber mais sobre os nossos serviços.'),
  },
  {
    chave: PUBLIC_CONTENT_KEYS.contactForm,
    scope: 'contact',
    label: 'Introdução do Formulário',
    description: 'Título e texto de apoio apresentados no formulário de contacto.',
    draft: activeDraft(PUBLIC_CONTENT_KEYS.contactForm, 'Envie-nos uma mensagem', 'Respondemos em menos de 1 dia útil'),
  },
  {
    chave: PUBLIC_CONTENT_KEYS.contactChannel,
    scope: 'contact',
    label: 'Canal de Contacto',
    description: 'Bloco repetível: título do canal e respetivo valor no corpo. A ordem controla a posição.',
    repeatable: true,
    draft: activeDraft(PUBLIC_CONTENT_KEYS.contactChannel, 'Email', '', 'info@empresa.pt'),
  },
  {
    chave: PUBLIC_CONTENT_KEYS.contactSchedule,
    scope: 'contact',
    label: 'Horário de Atendimento',
    description: 'Título e pares “rótulo | horário”, um por linha no corpo.',
    draft: activeDraft(PUBLIC_CONTENT_KEYS.contactSchedule, 'Horário de Atendimento', '', 'Segunda – Sexta | 09:00 – 18:00\nSOC (clientes ativos) | 24 / 7'),
  },
  {
    chave: PUBLIC_CONTENT_KEYS.contactCertification,
    scope: 'contact',
    label: 'Certificação ou Conformidade',
    description: 'Bloco repetível: use o título para cada certificação ou referência de conformidade.',
    repeatable: true,
    draft: activeDraft(PUBLIC_CONTENT_KEYS.contactCertification, 'ISO 27001'),
  },
];

export function getPublicContentEditorPreset(chave: string): PublicContentEditorPreset | undefined {
  return PUBLIC_CONTENT_EDITOR_PRESETS.find((preset) => preset.chave === chave);
}

export function isPublicContentScope(chave: string, scope: PublicContentScope): boolean {
  return getPublicContentEditorPreset(chave)?.scope === scope;
}
