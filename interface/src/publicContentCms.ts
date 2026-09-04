export type PublicContentScope = 'homepage' | 'services' | 'contact';

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
  draft: PublicContentDraftTemplate;
}

export const PUBLIC_CONTENT_KEYS = {
  homepageHero: 'homepage.hero',
  homepageIdentityHeader: 'homepage_identidade_cabecalho',
  homepageMission: 'homepage_missao',
  homepageVision: 'homepage_visao',
  homepageValues: 'homepage_valores',
  servicesHero: 'servicos_cabecalho',
  servicesCatalog: 'servicos_catalogo',
  servicesProcessHeader: 'servicos_processo_cabecalho',
  servicesNis2Header: 'servicos_nis2_cabecalho',
  servicesNis2Cta: 'servicos_nis2_cta',
  servicesFinalCta: 'servicos_cta_final',
  contactHero: 'contacto_cabecalho',
  contactForm: 'contacto_formulario',
  contactSchedule: 'contacto_horario',
} as const;

export const PUBLIC_SERVICE_PROOF_KEYS = [
  'servicos.proof.cncs',
  'servicos.proof.sla-24-7',
  'servicos.proof.dados-ue',
  'servicos.proof.gestor-dedicado',
] as const;

export const PUBLIC_SERVICE_CARD_KEYS = [
  'servicos.card.pentesting',
  'servicos.card.incidentes-nis2',
  'servicos.card.auditoria-nis2',
  'servicos.card.siem',
  'servicos.card.formacao',
  'servicos.card.cloud-devsecops',
] as const;

export const PUBLIC_SERVICE_PROCESS_KEYS = [
  'servicos.processo.avaliacao',
  'servicos.processo.planeamento',
  'servicos.processo.implementacao',
  'servicos.processo.monitorizacao',
] as const;

export const PUBLIC_SERVICE_NIS2_KEYS = [
  'servicos.nis2.abrangencia',
  'servicos.nis2.obrigacoes',
  'servicos.nis2.notificacao',
  'servicos.nis2.cadeia-abastecimento',
  'servicos.nis2.gestao',
  'servicos.nis2.formacao',
] as const;

export const PUBLIC_CONTACT_CHANNEL_KEYS = [
  'contacto.channel.morada',
  'contacto.channel.telefone',
  'contacto.channel.email',
  'contacto.channel.website',
] as const;

export const PUBLIC_CONTACT_CERTIFICATION_KEYS = [
  'contacto.certification.iso-27001',
  'contacto.certification.cncs',
  'contacto.certification.nis2',
  'contacto.certification.rgpd',
] as const;

const activeDraft = (chave: string, titulo = '', subtitulo = '', corpo = '', ordem = 0): PublicContentDraftTemplate => ({
  chave,
  titulo,
  subtitulo,
  corpo,
  imagem_url: '',
  ativo: true,
  ordem,
});

const fixedPreset = (
  chave: string,
  scope: PublicContentScope,
  label: string,
  description: string,
  titulo: string,
  subtitulo = '',
  corpo = '',
  ordem = 0,
): PublicContentEditorPreset => ({
  chave,
  scope,
  label,
  description,
  draft: activeDraft(chave, titulo, subtitulo, corpo, ordem),
});

const serviceFeatures = (features: readonly string[]) => features.join('\n');

export const PUBLIC_CONTENT_EDITOR_PRESETS: readonly PublicContentEditorPreset[] = [
  fixedPreset(
    PUBLIC_CONTENT_KEYS.homepageHero,
    'homepage',
    'Hero da Homepage',
    'Etiqueta, título e descrição do Hero. Use “|” no título para destacar a segunda parte.',
    'Segurança Digital para um|Mundo Conectado',
    'Plataforma Certificada NIS2 · ISO/IEC 27001',
    'Proteja a sua empresa contra ameaças digitais e garanta conformidade com as diretivas europeias de cibersegurança.',
  ),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.homepageIdentityHeader,
    'homepage',
    'Cabeçalho da identidade',
    'Título e introdução da secção institucional da Homepage.',
    'A nossa identidade',
    '',
    'Trabalhamos para tornar a cibersegurança clara, acessível e alinhada com as necessidades de cada organização.',
    1,
  ),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.homepageMission,
    'homepage',
    'Missão',
    'Título e descrição do cartão Missão.',
    'Missão',
    '',
    'Ajudar organizações a proteger os seus ativos digitais, reduzir riscos e responder com confiança aos desafios de cibersegurança.',
    2,
  ),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.homepageVision,
    'homepage',
    'Visão',
    'Título e descrição do cartão Visão.',
    'Visão',
    '',
    'Contribuir para um ecossistema digital mais resiliente, no qual a segurança acompanha a evolução de cada organização.',
    3,
  ),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.homepageValues,
    'homepage',
    'Valores',
    'Título e descrição do cartão Valores.',
    'Valores',
    '',
    'Rigor, proximidade, transparência e melhoria contínua orientam a forma como colaboramos e tomamos decisões.',
    4,
  ),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.servicesHero,
    'services',
    'Cabeçalho de Serviços',
    'Etiqueta, título e texto introdutório. Use “|” no título para destacar a segunda parte.',
    'Proteção abrangente para |cada ameaça.',
    'Os Nossos Serviços · Equipa Certificada',
    'Do SOC 24/7 à conformidade NIS2, a nossa equipa certificada cobre todo o ciclo de vida da cibersegurança empresarial.',
  ),
  fixedPreset(PUBLIC_SERVICE_PROOF_KEYS[0], 'services', 'Compromisso — Certificado CNCS', 'Título e detalhe do compromisso.', 'Certificado CNCS', 'Autoridade Nacional', '', 0),
  fixedPreset(PUBLIC_SERVICE_PROOF_KEYS[1], 'services', 'Compromisso — SLA 24/7', 'Título e detalhe do compromisso.', 'SLA 24/7', 'Resposta garantida', '', 1),
  fixedPreset(PUBLIC_SERVICE_PROOF_KEYS[2], 'services', 'Compromisso — Dados na UE', 'Título e detalhe do compromisso.', 'Dados na UE', 'RGPD compliant', '', 2),
  fixedPreset(PUBLIC_SERVICE_PROOF_KEYS[3], 'services', 'Compromisso — Gestor Dedicado', 'Título e detalhe do compromisso.', 'Gestor Dedicado', 'Por cada cliente', '', 3),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.servicesCatalog,
    'services',
    'Introdução ao Catálogo',
    'Etiqueta, título e texto apresentados antes dos cartões.',
    'O que oferecemos',
    'Catálogo de Serviços',
    'Todos os serviços são prestados pela nossa equipa certificada com SLAs documentados.',
  ),
  fixedPreset(
    PUBLIC_SERVICE_CARD_KEYS[0],
    'services',
    'Serviço — Pentesting',
    'Título, preço e funcionalidades, uma por linha.',
    'Testes de Penetração (Pentesting)',
    'A partir de 2.800€',
    serviceFeatures(['Externo / Interno / Web', 'Aplicações e APIs', 'Engenharia social', 'Relatório detalhado com remediação']),
    0,
  ),
  fixedPreset(
    PUBLIC_SERVICE_CARD_KEYS[1],
    'services',
    'Serviço — Incidentes NIS2',
    'Título, preço e funcionalidades, uma por linha.',
    'Gestão de Incidentes NIS2',
    'Retainer 950€/mês',
    serviceFeatures(['Resposta de emergência 24/7', 'Notificação às autoridades 24h/72h', 'Análise forense digital', 'Relatório pós-incidente']),
    1,
  ),
  fixedPreset(
    PUBLIC_SERVICE_CARD_KEYS[2],
    'services',
    'Serviço — Auditoria NIS2',
    'Título, preço e funcionalidades, uma por linha.',
    'Auditoria de Conformidade NIS2',
    'A partir de 3.500€',
    serviceFeatures(['Análise de lacunas', 'Desenvolvimento de políticas', 'Preparação de auditoria', 'Monitorização contínua']),
    2,
  ),
  fixedPreset(
    PUBLIC_SERVICE_CARD_KEYS[3],
    'services',
    'Serviço — SIEM',
    'Título, preço e funcionalidades, uma por linha.',
    'SIEM & Monitorização Contínua',
    'A partir de 1.200€/mês',
    serviceFeatures(['Monitorização 24/7', 'Integração SIEM', 'Triagem de alertas em tempo real', 'Relatórios mensais detalhados']),
    3,
  ),
  fixedPreset(
    PUBLIC_SERVICE_CARD_KEYS[4],
    'services',
    'Serviço — Formação',
    'Título, preço e funcionalidades, uma por linha.',
    'Formação e Consciencialização',
    'A partir de 400€/mês',
    serviceFeatures(['Simulações de phishing', 'Cursos e-learning', 'Dashboards de KPI', 'Conteúdo personalizado']),
    4,
  ),
  fixedPreset(
    PUBLIC_SERVICE_CARD_KEYS[5],
    'services',
    'Serviço — Cloud & DevSecOps',
    'Título, preço e funcionalidades, uma por linha.',
    'Segurança Cloud & DevSecOps',
    'A partir de 1.800€',
    serviceFeatures(['Inventário de ativos cloud', 'Integração CI/CD', 'Gestão de vulnerabilidades', 'Plano de remediação priorizado']),
    5,
  ),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.servicesProcessHeader,
    'services',
    'Introdução ao Processo',
    'Etiqueta, título e texto da secção “Como Trabalhamos”.',
    'O nosso processo',
    'Como Trabalhamos',
    'Metodologia estruturada para garantir resultados consistentes em cada projeto.',
  ),
  fixedPreset(PUBLIC_SERVICE_PROCESS_KEYS[0], 'services', 'Processo — Avaliação', 'Título e descrição da etapa.', 'Avaliação', '', 'Diagnóstico inicial do estado de segurança e identificação de lacunas.', 0),
  fixedPreset(PUBLIC_SERVICE_PROCESS_KEYS[1], 'services', 'Processo — Planeamento', 'Título e descrição da etapa.', 'Planeamento', '', 'Desenvolvimento de plano de ação priorizado por risco e impacto.', 1),
  fixedPreset(PUBLIC_SERVICE_PROCESS_KEYS[2], 'services', 'Processo — Implementação', 'Título e descrição da etapa.', 'Implementação', '', 'Execução por especialistas certificados com relatórios contínuos.', 2),
  fixedPreset(PUBLIC_SERVICE_PROCESS_KEYS[3], 'services', 'Processo — Monitorização', 'Título e descrição da etapa.', 'Monitorização', '', 'Acompanhamento contínuo, relatórios periódicos e melhoria contínua.', 3),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.servicesNis2Header,
    'services',
    'Introdução NIS2',
    'Etiqueta, título e explicação da secção.',
    'O que é a NIS2 e o que implica para a sua empresa?',
    'Diretiva NIS2',
    'A Diretiva NIS2 (Network and Information Security 2) é a lei europeia de cibersegurança mais abrangente até à data. Entrou em vigor em outubro de 2024 e obriga milhares de organizações portuguesas a adotarem medidas concretas de segurança.',
  ),
  fixedPreset(PUBLIC_SERVICE_NIS2_KEYS[0], 'services', 'NIS2 — Quem é abrangido', 'Título e explicação do requisito.', 'Quem é abrangido?', '', 'Entidades essenciais e importantes em setores como energia, saúde, transportes, banca, infraestruturas digitais e prestadores de serviços TIC com mais de 50 colaboradores ou 10M€ de faturação.', 0),
  fixedPreset(PUBLIC_SERVICE_NIS2_KEYS[1], 'services', 'NIS2 — Obrigações', 'Título e explicação do requisito.', 'O que é obrigatório?', '', 'Medidas de gestão de risco, políticas de segurança documentadas, controlo de acesso, criptografia, avaliações de risco regulares, planos de continuidade de negócio e gestão de incidentes.', 1),
  fixedPreset(PUBLIC_SERVICE_NIS2_KEYS[2], 'services', 'NIS2 — Notificação', 'Título e explicação do requisito.', 'Notificação de incidentes', '', 'Incidentes significativos devem ser notificados ao CNCS (Centro Nacional de Cibersegurança) em 24 horas (alerta inicial) e 72 horas (relatório detalhado).', 2),
  fixedPreset(PUBLIC_SERVICE_NIS2_KEYS[3], 'services', 'NIS2 — Cadeia de abastecimento', 'Título e explicação do requisito.', 'Cadeia de abastecimento', '', 'As organizações devem avaliar e gerir os riscos de segurança dos seus fornecedores e prestadores de serviços TIC, incluindo cláusulas contratuais de segurança.', 3),
  fixedPreset(PUBLIC_SERVICE_NIS2_KEYS[4], 'services', 'NIS2 — Gestão', 'Título e explicação do requisito.', 'Responsabilidade de gestão', '', 'Os órgãos de gestão são diretamente responsáveis pelo cumprimento da NIS2. A negligência pode resultar em coimas até 10M€ ou 2% do volume de negócios global.', 4),
  fixedPreset(PUBLIC_SERVICE_NIS2_KEYS[5], 'services', 'NIS2 — Formação', 'Título e explicação do requisito.', 'Formação obrigatória', '', 'Colaboradores e gestores devem receber formação regular em cibersegurança. A consciencialização é considerada um controlo de segurança obrigatório pela diretiva.', 5),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.servicesNis2Cta,
    'services',
    'Chamada NIS2',
    'Título e texto da avaliação gratuita. A ligação complementar HTTPS é opcional.',
    'Não tem a certeza se a sua organização é abrangida?',
    '',
    'A CiberBoxSecur realiza gratuitamente uma avaliação inicial de conformidade NIS2 para determinar as suas obrigações e os passos a seguir.',
  ),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.servicesFinalCta,
    'services',
    'Chamada Final de Serviços',
    'Etiqueta, título e texto da chamada final. Use “|” no título para destacar a segunda parte.',
    'Pronto para Proteger o|Seu Negócio?',
    'Comece Hoje',
    'Agende uma demonstração gratuita e veja como a CiberBoxSecur pode proteger a sua empresa.',
  ),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.contactHero,
    'contact',
    'Cabeçalho de Contacto',
    'Etiqueta, título e texto introdutório. Use “|” no título para destacar a segunda parte.',
    'Estamos prontos para|proteger a sua empresa.',
    'Fale Connosco · Resposta em 1 dia útil',
    'Contacte a nossa equipa de especialistas para uma avaliação gratuita ou para saber mais sobre os nossos serviços.',
  ),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.contactForm,
    'contact',
    'Introdução do Formulário',
    'Título e texto de apoio apresentados no formulário.',
    'Envie-nos uma mensagem',
    'Respondemos em menos de 1 dia útil',
  ),
  fixedPreset(PUBLIC_CONTACT_CHANNEL_KEYS[0], 'contact', 'Canal — Morada', 'Título e informação do canal.', 'Morada', '', 'Av. da Liberdade 110, 3.º\n1269-046 Lisboa, Portugal', 0),
  fixedPreset(PUBLIC_CONTACT_CHANNEL_KEYS[1], 'contact', 'Canal — Telefone', 'Título e informação do canal.', 'Telefone', '', '+351 21 000 0000', 1),
  fixedPreset(PUBLIC_CONTACT_CHANNEL_KEYS[2], 'contact', 'Canal — Email', 'Título e informação do canal.', 'Email', '', 'info@ciberboxsecur.pt', 2),
  fixedPreset(PUBLIC_CONTACT_CHANNEL_KEYS[3], 'contact', 'Canal — Website', 'Título e informação do canal.', 'Website', '', 'www.ciberboxsecur.pt', 3),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.contactSchedule,
    'contact',
    'Horário de Atendimento',
    'Título e pares “rótulo | horário”, um por linha.',
    'Horário de Atendimento',
    '',
    'Segunda – Sexta | 09:00 – 18:00\nSOC (clientes ativos) | 24 / 7',
  ),
  fixedPreset(PUBLIC_CONTACT_CERTIFICATION_KEYS[0], 'contact', 'Certificação — ISO 27001', 'Designação apresentada no cartão de certificações.', 'ISO 27001', '', '', 0),
  fixedPreset(PUBLIC_CONTACT_CERTIFICATION_KEYS[1], 'contact', 'Certificação — CNCS', 'Designação apresentada no cartão de certificações.', 'CNCS', '', '', 1),
  fixedPreset(PUBLIC_CONTACT_CERTIFICATION_KEYS[2], 'contact', 'Certificação — NIS2', 'Designação apresentada no cartão de certificações.', 'NIS2', '', '', 2),
  fixedPreset(PUBLIC_CONTACT_CERTIFICATION_KEYS[3], 'contact', 'Certificação — RGPD', 'Designação apresentada no cartão de certificações.', 'RGPD', '', '', 3),
];

export function getPublicContentEditorPreset(chave: string): PublicContentEditorPreset | undefined {
  return PUBLIC_CONTENT_EDITOR_PRESETS.find((preset) => preset.chave === chave);
}

export function isPublicContentScope(chave: string, scope: PublicContentScope): boolean {
  return getPublicContentEditorPreset(chave)?.scope === scope;
}
