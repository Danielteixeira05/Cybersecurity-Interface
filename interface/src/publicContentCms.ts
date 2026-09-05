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
  homepageServicesHeader: 'homepage_servicos_cabecalho',
  homepageFinalCta: 'homepage_cta_final',
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

export const PUBLIC_HOME_SERVICE_KEYS = [
  'homepage.servico.pentesting',
  'homepage.servico.incidentes-nis2',
  'homepage.servico.conformidade-nis2',
  'homepage.servico.siem',
  'homepage.servico.formacao',
  'homepage.servico.cloud-devsecops',
] as const;

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
    'Apoio à conformidade NIS2 · Segurança digital',
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
    PUBLIC_CONTENT_KEYS.homepageServicesHeader,
    'homepage',
    'Cabeçalho dos serviços da Homepage',
    'Etiqueta, título e introdução da secção de serviços apresentada na Homepage.',
    'Serviços de Cibersegurança Completos',
    'O Que Fazemos',
    'Proteção de ponta a ponta para a sua infraestrutura digital, desde a deteção de ameaças à conformidade regulatória.',
    5,
  ),
  fixedPreset(PUBLIC_HOME_SERVICE_KEYS[0], 'homepage', 'Homepage — Testes de Penetração', 'Título e descrição do cartão.', 'Testes de Penetração', '', 'Avaliações de vulnerabilidades e testes de intrusão autorizados por profissionais de segurança.', 6),
  fixedPreset(PUBLIC_HOME_SERVICE_KEYS[1], 'homepage', 'Homepage — Incidentes NIS2', 'Título e descrição do cartão.', 'Gestão de Incidentes NIS2', '', 'Resposta rápida a incidentes com alerta inicial em 24 horas e notificação do incidente em 72 horas.', 7),
  fixedPreset(PUBLIC_HOME_SERVICE_KEYS[2], 'homepage', 'Homepage — Conformidade NIS2', 'Título e descrição do cartão.', 'Conformidade NIS2', '', 'Apoio completo em auditoria e gestão de conformidade para os requisitos da Diretiva NIS2 da UE.', 8),
  fixedPreset(PUBLIC_HOME_SERVICE_KEYS[3], 'homepage', 'Homepage — SIEM', 'Título e descrição do cartão.', 'SIEM & Monitorização Contínua', '', 'Monitorização contínua com deteção de ameaças em tempo real nos ativos digitais e no perímetro de rede.', 9),
  fixedPreset(PUBLIC_HOME_SERVICE_KEYS[4], 'homepage', 'Homepage — Formação', 'Título e descrição do cartão.', 'Formação e Consciencialização', '', 'Programas de formação personalizados para aumentar a maturidade de segurança das suas equipas.', 10),
  fixedPreset(PUBLIC_HOME_SERVICE_KEYS[5], 'homepage', 'Homepage — Cloud & DevSecOps', 'Título e descrição do cartão.', 'Segurança Cloud & DevSecOps', '', 'Proteção de ambientes cloud e integração de segurança no ciclo de desenvolvimento de software.', 11),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.homepageFinalCta,
    'homepage',
    'Chamada final da Homepage',
    'Etiqueta, título e descrição da chamada final. Use “|” no título para destacar a segunda parte.',
    'Pronto para Proteger o|Seu Negócio?',
    'Comece Hoje',
    'Agende uma demonstração gratuita e veja como a nossa tecnologia pode proteger a sua empresa contra as ameaças digitais.',
    12,
  ),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.servicesHero,
    'services',
    'Cabeçalho de Serviços',
    'Etiqueta, título e texto introdutório. Use “|” no título para destacar a segunda parte.',
    'Proteção abrangente para |cada ameaça.',
    'Os Nossos Serviços · Equipa de Cibersegurança',
    'Da monitorização contínua à conformidade NIS2, a nossa equipa acompanha todo o ciclo de vida da cibersegurança empresarial.',
  ),
  fixedPreset(PUBLIC_SERVICE_PROOF_KEYS[0], 'services', 'Compromisso — Referencial CNCS', 'Título e detalhe do compromisso.', 'Referencial CNCS', 'Orientações nacionais', '', 0),
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
    'Todos os serviços são prestados pela nossa equipa com âmbito e condições documentados.',
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
    serviceFeatures(['Resposta de emergência 24/7', 'Alerta inicial em 24h e notificação em 72h', 'Análise forense digital', 'Relatório pós-incidente']),
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
  fixedPreset(PUBLIC_SERVICE_PROCESS_KEYS[2], 'services', 'Processo — Implementação', 'Título e descrição da etapa.', 'Implementação', '', 'Execução acompanhada por especialistas, com relatórios contínuos.', 2),
  fixedPreset(PUBLIC_SERVICE_PROCESS_KEYS[3], 'services', 'Processo — Monitorização', 'Título e descrição da etapa.', 'Monitorização', '', 'Acompanhamento contínuo, relatórios periódicos e melhoria contínua.', 3),
  fixedPreset(
    PUBLIC_CONTENT_KEYS.servicesNis2Header,
    'services',
    'Introdução NIS2',
    'Etiqueta, título e explicação da secção.',
    'O que é a NIS2 e o que implica para a sua empresa?',
    'Diretiva NIS2',
    'A Diretiva NIS2 é uma diretiva da União Europeia que entrou em vigor em janeiro de 2023. Os Estados-Membros tiveram até 17 de outubro de 2024 para a transpor para o direito nacional.',
  ),
  fixedPreset(PUBLIC_SERVICE_NIS2_KEYS[0], 'services', 'NIS2 — Quem é abrangido', 'Título e explicação do requisito.', 'Quem é abrangido?', '', 'Entidades essenciais e importantes de setores abrangidos, tendo em conta a atividade, a dimensão e as exceções previstas na Diretiva NIS2.', 0),
  fixedPreset(PUBLIC_SERVICE_NIS2_KEYS[1], 'services', 'NIS2 — Obrigações', 'Título e explicação do requisito.', 'O que é obrigatório?', '', 'Medidas de gestão de risco, políticas de segurança documentadas, controlo de acesso, criptografia, avaliações de risco regulares, planos de continuidade de negócio e gestão de incidentes.', 1),
  fixedPreset(PUBLIC_SERVICE_NIS2_KEYS[2], 'services', 'NIS2 — Notificação', 'Título e explicação do requisito.', 'Notificação de incidentes', '', 'Os incidentes significativos exigem um alerta inicial em 24 horas, uma notificação com avaliação inicial em 72 horas e, normalmente, um relatório final até um mês.', 2),
  fixedPreset(PUBLIC_SERVICE_NIS2_KEYS[3], 'services', 'NIS2 — Cadeia de abastecimento', 'Título e explicação do requisito.', 'Cadeia de abastecimento', '', 'As organizações devem avaliar e gerir os riscos de segurança dos seus fornecedores e prestadores de serviços TIC, incluindo cláusulas contratuais de segurança.', 3),
  fixedPreset(PUBLIC_SERVICE_NIS2_KEYS[4], 'services', 'NIS2 — Gestão', 'Título e explicação do requisito.', 'Responsabilidade de gestão', '', 'Os órgãos de gestão das entidades abrangidas devem aprovar as medidas de gestão de riscos de cibersegurança e supervisionar a sua aplicação.', 4),
  fixedPreset(PUBLIC_SERVICE_NIS2_KEYS[5], 'services', 'NIS2 — Formação', 'Título e explicação do requisito.', 'Formação obrigatória', '', 'Os membros dos órgãos de gestão devem receber formação, e as entidades são incentivadas a disponibilizar regularmente formação semelhante aos colaboradores.', 5),
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
  fixedPreset(PUBLIC_CONTACT_CERTIFICATION_KEYS[0], 'contact', 'Referencial — ISO/IEC 27001', 'Designação apresentada na lista de referenciais.', 'Boas práticas ISO/IEC 27001', '', '', 0),
  fixedPreset(PUBLIC_CONTACT_CERTIFICATION_KEYS[1], 'contact', 'Referencial — CNCS', 'Designação apresentada na lista de referenciais.', 'Orientações CNCS', '', '', 1),
  fixedPreset(PUBLIC_CONTACT_CERTIFICATION_KEYS[2], 'contact', 'Referencial — NIS2', 'Designação apresentada na lista de referenciais.', 'Apoio à conformidade NIS2', '', '', 2),
  fixedPreset(PUBLIC_CONTACT_CERTIFICATION_KEYS[3], 'contact', 'Referencial — RGPD', 'Designação apresentada na lista de referenciais.', 'Apoio à proteção de dados', '', '', 3),
];

export function getPublicContentEditorPreset(chave: string): PublicContentEditorPreset | undefined {
  return PUBLIC_CONTENT_EDITOR_PRESETS.find((preset) => preset.chave === chave);
}

export function isPublicContentScope(chave: string, scope: PublicContentScope): boolean {
  return getPublicContentEditorPreset(chave)?.scope === scope;
}
