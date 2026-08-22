import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  ChevronRight,
  CircleAlert,
  CircleCheckBig,
  Clock3,
  Eye,
  FileText,
  Globe,
  LockKeyhole,
  Mail,
  MapPin,
  Phone,
  Shield,
  ShieldCheck,
  Tag,
  Target,
  UserRoundCheck,
  UsersRound,
} from 'lucide-react';
import newsIsoImage from '../assets/news/iso-27001.jpg';
import newsNis2Image from '../assets/news/nis2-compliance.jpg';
import newsPentestingImage from '../assets/news/pentesting.jpg';
import newsRansomwareImage from '../assets/news/ransomware.jpg';
import { session } from '../apiClient';
import type { Page } from '../types';

interface PageProps {
  setPage: (p: Page) => void;
}

interface NewsPageProps extends PageProps {
  onSelectArticle: (articleId: string) => void;
}

interface NewsDetailPageProps extends NewsPageProps {
  selectedArticleId: string;
}

const HOME_HERO_CONTENT = {
  certification: 'Plataforma Certificada NIS2 · ISO/IEC 27001',
  title: 'Segurança Digital para um',
  highlightedTitle: 'Mundo Conectado',
  description:
    'Proteja a sua empresa contra ameaças digitais e garanta conformidade com as diretivas europeias de cibersegurança.',
  primaryAction: 'Explorar Serviços',
  secondaryAction: 'Agendar Serviços',
} as const;

const HOME_SERVICES = [
  {
    title: 'Testes de Penetração',
    description: 'Avaliações de vulnerabilidades e testes de intrusão autorizados por hackers éticos certificados.',
    icon: Target,
    accent: 'blue',
  },
  {
    title: 'Gestão de Incidentes NIS2',
    description: 'Resposta rápida a incidentes com notificação às autoridades dentro dos prazos NIS2 (24h/72h).',
    icon: Shield,
    accent: 'rose',
  },
  {
    title: 'Conformidade NIS2',
    description: 'Apoio completo em auditoria e gestão de conformidade para os requisitos da Diretiva NIS2 da UE.',
    icon: FileText,
    accent: 'violet',
  },
  {
    title: 'SIEM & Monitorização Contínua',
    description: 'SOC 24/7 com deteção de ameaças em tempo real em todos os seus ativos digitais e perímetro de rede.',
    icon: Eye,
    accent: 'teal',
  },
  {
    title: 'Formação e Consciencialização',
    description: 'Programas de formação personalizados para aumentar a maturidade de segurança das suas equipas.',
    icon: BookOpen,
    accent: 'indigo',
  },
  {
    title: 'Segurança Cloud & DevSecOps',
    description: 'Proteção de ambientes cloud e integração de segurança no ciclo de desenvolvimento de software.',
    icon: Globe,
    accent: 'purple',
  },
] as const;

const HOME_FOOTER_LINKS = [
  { label: 'Início', page: 'home' },
  { label: 'Sobre Nós', page: 'about' },
  { label: 'Serviços', page: 'services' },
  { label: 'Contacto', page: 'contact' },
  { label: 'Dashboard', page: 'login' },
] satisfies ReadonlyArray<{ label: string; page: Page }>;

const HOME_FOOTER_CONTACTS = [
  { label: 'info@ciberboxsecur.pt', icon: Mail },
  { label: '+351 21 000 0000', icon: Phone },
  { label: 'Av. da Liberdade 110, Lisboa', icon: MapPin },
  { label: 'www.ciberboxsecur.pt', icon: Globe },
] as const;

const HOME_SOCIALS = [
  { label: 'LinkedIn', mark: 'in' },
  { label: 'Twitter', mark: '𝕏' },
  { label: 'Facebook', mark: 'f' },
] as const;

const PUBLIC_SERVICES = [
  {
    title: 'Testes de Penetração (Pentesting)',
    price: 'A partir de 2.800€',
    features: ['Externo / Interno / Web', 'Aplicações e APIs', 'Engenharia social', 'Relatório detalhado com remediação'],
    icon: Target,
    accent: 'cyan',
    nis2: true,
  },
  {
    title: 'Gestão de Incidentes NIS2',
    price: 'Retainer 950€/mês',
    features: ['Resposta de emergência 24/7', 'Notificação às autoridades 24h/72h', 'Análise forense digital', 'Relatório pós-incidente'],
    icon: Shield,
    accent: 'rose',
    nis2: true,
  },
  {
    title: 'Auditoria de Conformidade NIS2',
    price: 'A partir de 3.500€',
    features: ['Análise de lacunas', 'Desenvolvimento de políticas', 'Preparação de auditoria', 'Monitorização contínua'],
    icon: FileText,
    accent: 'violet',
    nis2: true,
  },
  {
    title: 'SIEM & Monitorização Contínua',
    price: 'A partir de 1.200€/mês',
    features: ['Monitorização 24/7', 'Integração SIEM', 'Triagem de alertas em tempo real', 'Relatórios mensais detalhados'],
    icon: Eye,
    accent: 'teal',
    nis2: true,
  },
  {
    title: 'Formação e Consciencialização',
    price: 'A partir de 400€/mês',
    features: ['Simulações de phishing', 'Cursos e-learning', 'Dashboards de KPI', 'Conteúdo personalizado'],
    icon: BookOpen,
    accent: 'blue',
    nis2: false,
  },
  {
    title: 'Segurança Cloud & DevSecOps',
    price: 'A partir de 1.800€',
    features: ['Inventário de ativos cloud', 'Integração CI/CD', 'Gestão de vulnerabilidades', 'Plano de remediação priorizado'],
    icon: Globe,
    accent: 'purple',
    nis2: false,
  },
] as const;

const SERVICE_PROOF_POINTS = [
  { title: 'Certificado CNCS', detail: 'Autoridade Nacional', icon: Shield, accent: 'violet' },
  { title: 'SLA 24/7', detail: 'Resposta garantida', icon: Clock3, accent: 'blue' },
  { title: 'Dados na UE', detail: 'RGPD compliant', icon: Globe, accent: 'green' },
  { title: 'Gestor Dedicado', detail: 'Por cada cliente', icon: UserRoundCheck, accent: 'orange' },
] as const;

const SERVICE_PROCESS_STEPS = [
  {
    step: '01',
    title: 'Avaliação',
    description: 'Diagnóstico inicial do estado de segurança e identificação de lacunas.',
    icon: Target,
  },
  {
    step: '02',
    title: 'Planeamento',
    description: 'Desenvolvimento de plano de ação priorizado por risco e impacto.',
    icon: FileText,
  },
  {
    step: '03',
    title: 'Implementação',
    description: 'Execução por especialistas certificados com relatórios contínuos.',
    icon: ShieldCheck,
  },
  {
    step: '04',
    title: 'Monitorização',
    description: 'Acompanhamento contínuo, relatórios periódicos e melhoria contínua.',
    icon: BarChart3,
  },
] as const;

const NIS2_REQUIREMENTS = [
  {
    title: 'Quem é abrangido?',
    description:
      'Entidades essenciais e importantes em setores como energia, saúde, transportes, banca, infraestruturas digitais e prestadores de serviços TIC com mais de 50 colaboradores ou 10M€ de faturação.',
    icon: UsersRound,
    accent: 'blue',
  },
  {
    title: 'O que é obrigatório?',
    description:
      'Medidas de gestão de risco, políticas de segurança documentadas, controlo de acesso, criptografia, avaliações de risco regulares, planos de continuidade de negócio e gestão de incidentes.',
    icon: CircleCheckBig,
    accent: 'green',
  },
  {
    title: 'Notificação de incidentes',
    description:
      'Incidentes significativos devem ser notificados ao CNCS (Centro Nacional de Cibersegurança) em 24 horas (alerta inicial) e 72 horas (relatório detalhado).',
    icon: CircleAlert,
    accent: 'orange',
  },
  {
    title: 'Cadeia de abastecimento',
    description:
      'As organizações devem avaliar e gerir os riscos de segurança dos seus fornecedores e prestadores de serviços TIC, incluindo cláusulas contratuais de segurança.',
    icon: Globe,
    accent: 'violet',
  },
  {
    title: 'Responsabilidade de gestão',
    description:
      'Os órgãos de gestão são diretamente responsáveis pelo cumprimento da NIS2. A negligência pode resultar em coimas até 10M€ ou 2% do volume de negócios global.',
    icon: Shield,
    accent: 'rose',
  },
  {
    title: 'Formação obrigatória',
    description:
      'Colaboradores e gestores devem receber formação regular em cibersegurança. A consciencialização é considerada um controlo de segurança obrigatório pela diretiva.',
    icon: BookOpen,
    accent: 'cyan',
  },
] as const;

type NewsCategoryTone = 'violet' | 'amber' | 'rose' | 'blue';

type NewsContentBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'section'; heading: string; paragraphs?: readonly string[]; items?: readonly string[] }
  | { type: 'note'; title: string; text: string };

interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  category: string;
  categoryTone: NewsCategoryTone;
  date: string;
  shortDate: string;
  dateTime: string;
  excerpt: string;
  image: string;
  featured: boolean;
  readingTime?: string;
  content: readonly NewsContentBlock[];
}

// TODO(CMS): conteúdo editorial provisório. Esta coleção será substituída por GET /api/public/noticias.
const NEWS_ARTICLES = [
  {
    id: 'nis2-portugal-2025',
    slug: 'nis2-o-que-muda-empresas-portuguesas-2025',
    title: 'NIS2: O que muda para as empresas portuguesas em 2025',
    category: 'NIS2 & Compliance',
    categoryTone: 'violet',
    date: '10 de março de 2025',
    shortDate: '10/03/2025',
    dateTime: '2025-03-10',
    excerpt:
      'A Diretiva NIS2 trouxe novas obrigações para entidades essenciais e importantes. Saiba o que precisa de fazer para estar em conformidade.',
    image: newsNis2Image,
    featured: true,
    content: [
      {
        type: 'paragraph',
        text: 'A preparação para a conformidade deve partir de uma leitura clara do contexto da organização, dos seus serviços e dos ativos digitais que sustentam a operação.',
      },
      {
        type: 'section',
        heading: 'Contexto e Importância',
        paragraphs: [
          'Uma abordagem estruturada permite identificar lacunas, organizar responsabilidades e priorizar medidas de segurança de acordo com o risco e o impacto para o negócio.',
        ],
      },
      {
        type: 'note',
        title: 'Nota importante',
        text: 'Este conteúdo apresenta orientação geral. A avaliação de conformidade deve ser adaptada ao setor, à dimensão e ao contexto específico de cada organização.',
      },
      {
        type: 'section',
        heading: 'Principais Considerações',
        paragraphs: ['Uma preparação consistente deve articular pessoas, processos e tecnologia.'],
        items: [
          'Analisar riscos, ativos e lacunas de segurança.',
          'Documentar políticas, responsabilidades e controlos aplicáveis.',
          'Preparar procedimentos de continuidade e resposta a incidentes.',
          'Manter formação, monitorização e melhoria contínua.',
        ],
      },
      {
        type: 'section',
        heading: 'Próximos Passos',
        paragraphs: [
          'O passo seguinte é transformar o diagnóstico numa sequência de ações priorizadas, com responsáveis, evidências e acompanhamento regular.',
          'A equipa CiberBoxSecur pode apoiar a avaliação inicial, o planeamento e a monitorização das medidas definidas para a organização.',
        ],
      },
    ],
  },
  {
    id: 'pentesting-2025',
    slug: 'pentesting-2025-metodologias-boas-praticas',
    title: 'Pentesting em 2025: Metodologias e Boas Práticas',
    category: 'Testes de Segurança',
    categoryTone: 'amber',
    date: '28 de fevereiro de 2025',
    shortDate: '28/02/2025',
    dateTime: '2025-02-28',
    excerpt:
      'Uma visão prática sobre avaliações autorizadas de segurança, definição de âmbito e comunicação clara das oportunidades de remediação.',
    image: newsPentestingImage,
    featured: false,
    content: [
      {
        type: 'paragraph',
        text: 'Os testes de penetração ajudam a observar, num âmbito previamente autorizado, como aplicações, APIs e infraestruturas respondem a diferentes cenários de ataque.',
      },
      {
        type: 'section',
        heading: 'Contexto e Importância',
        paragraphs: [
          'O valor da avaliação depende de objetivos claros, regras de execução acordadas e resultados apresentados de forma útil para as equipas responsáveis pela correção.',
        ],
      },
      {
        type: 'note',
        title: 'Nota importante',
        text: 'Qualquer teste de segurança deve ter autorização explícita, âmbito definido e acompanhamento adequado à organização.',
      },
      {
        type: 'section',
        heading: 'Principais Considerações',
        items: [
          'Definir os ativos, aplicações e APIs incluídos no âmbito.',
          'Alinhar janelas de teste, contactos e critérios de segurança.',
          'Registar evidências e classificar os resultados por prioridade.',
          'Validar a remediação das vulnerabilidades identificadas.',
        ],
      },
      {
        type: 'section',
        heading: 'Próximos Passos',
        paragraphs: [
          'Depois da avaliação, os resultados devem ser convertidos num plano de remediação acompanhado pelas equipas técnicas e de gestão.',
        ],
      },
    ],
  },
  {
    id: 'ransomware-tendencias',
    slug: 'ransomware-tendencias-proteger-organizacao',
    title: 'Ransomware: Tendências e como proteger a sua organização',
    category: 'Ameaças & Incidentes',
    categoryTone: 'rose',
    date: '15 de fevereiro de 2025',
    shortDate: '15/02/2025',
    dateTime: '2025-02-15',
    excerpt:
      'Como combinar monitorização, preparação operacional e resposta coordenada para reduzir o impacto de um incidente de ransomware.',
    image: newsRansomwareImage,
    featured: false,
    content: [
      {
        type: 'paragraph',
        text: 'A preparação para ransomware exige visibilidade sobre os ativos, capacidade de detetar sinais relevantes e procedimentos claros para responder quando ocorre um incidente.',
      },
      {
        type: 'section',
        heading: 'Contexto e Importância',
        paragraphs: [
          'A resposta torna-se mais consistente quando as responsabilidades, os canais de comunicação e as prioridades de recuperação são definidos antes de uma situação de crise.',
        ],
      },
      {
        type: 'note',
        title: 'Nota importante',
        text: 'Os procedimentos de resposta devem ser testados e adaptados aos sistemas, equipas e necessidades operacionais de cada organização.',
      },
      {
        type: 'section',
        heading: 'Principais Considerações',
        items: [
          'Manter inventário e monitorização dos ativos críticos.',
          'Definir triagem, escalamento e responsabilidades de resposta.',
          'Preparar continuidade, recuperação e comunicação do incidente.',
          'Rever o ocorrido e acompanhar as ações de melhoria.',
        ],
      },
      {
        type: 'section',
        heading: 'Próximos Passos',
        paragraphs: [
          'A organização deve rever o seu plano de resposta, confirmar os contactos essenciais e transformar os exercícios realizados em melhorias verificáveis.',
        ],
      },
    ],
  },
  {
    id: 'recertificacao-iso-27001',
    slug: 'ciberboxsecur-recertificacao-iso-27001-2022',
    title: 'CiberBoxSecur Obtém Recertificação ISO/IEC 27001:2022',
    category: 'Empresa',
    categoryTone: 'blue',
    date: '10 de janeiro de 2025',
    shortDate: '10/01/2025',
    dateTime: '2025-01-10',
    excerpt:
      'Uma atualização institucional sobre a recertificação ISO/IEC 27001:2022 anunciada pela CiberBoxSecur.',
    image: newsIsoImage,
    featured: false,
    content: [
      {
        type: 'paragraph',
        text: 'Esta publicação reúne a informação introdutória associada ao anúncio de recertificação apresentado no Centro de Conhecimento da CiberBoxSecur.',
      },
      {
        type: 'section',
        heading: 'Contexto e Importância',
        paragraphs: [
          'A versão editorial definitiva deverá apresentar o âmbito, as evidências e os detalhes institucionais validados para publicação pelo Back Office.',
        ],
      },
      {
        type: 'note',
        title: 'Conteúdo editorial provisório',
        text: 'Os detalhes desta publicação devem ser revistos e completados no CMS antes da disponibilização pública definitiva.',
      },
      {
        type: 'section',
        heading: 'Principais Considerações',
        items: [
          'Confirmar o âmbito institucional que pode ser comunicado.',
          'Validar datas, referências e documentação pública associada.',
          'Apresentar a informação de forma clara e verificável.',
        ],
      },
      {
        type: 'section',
        heading: 'Próximos Passos',
        paragraphs: [
          'A publicação será completada com o conteúdo editorial aprovado e os elementos documentais disponibilizados pelo Back Office.',
        ],
      },
    ],
  },
] satisfies readonly NewsArticle[];

const PUBLIC_CONTACT_CHANNELS = [
  { title: 'Email', value: 'geral@ciberboxsecur.pt', detail: 'Resposta em até 24h úteis', icon: Mail },
  { title: 'Telefone', value: '+351 210 000 000', detail: 'Seg-Sex • 9h-18h', icon: Phone },
  { title: 'Sede', value: 'Avenida da Liberdade, Lisboa', detail: 'Portugal', icon: MapPin },
  { title: 'Urgências 24/7', value: 'soc@ciberboxsecur.pt', detail: 'Linha SOC permanente', icon: Shield },
] as const;

function PublicFooter({ setPage }: PageProps) {
  const navigateTo = (target: Page) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setPage(target);
  };

  return (
    <footer className="home-footer" data-home-section="footer">
      <div className="container-xl home-footer__container">
        <div className="row g-4 home-footer__main">
          <div className="col-12 col-md-4">
            <div className="home-footer__brand">
              <span className="home-footer__brand-icon" aria-hidden="true">
                <Shield />
              </span>
              <span>
                CiberBox<strong>Secur</strong>
              </span>
            </div>
            <p className="home-footer__description">
              Protegemos organizações portuguesas contra ciberameaças com serviços de nível empresarial e
              conformidade NIS2.
            </p>
            <div className="home-footer__socials" aria-label="Redes sociais">
              {HOME_SOCIALS.map((social) => (
                <span className="home-footer__social" role="img" aria-label={social.label} key={social.label}>
                  {social.mark}
                </span>
              ))}
            </div>
          </div>

          <div className="col-12 col-md-4">
            <h2 className="home-footer__heading">Links Rápidos</h2>
            <ul className="home-footer__links">
              {HOME_FOOTER_LINKS.map((item) => (
                <li key={item.label}>
                  <button type="button" onClick={() => navigateTo(item.page)}>
                    <ChevronRight aria-hidden="true" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-12 col-md-4">
            <h2 className="home-footer__heading">Contacto</h2>
            <ul className="home-footer__contacts">
              {HOME_FOOTER_CONTACTS.map((contact) => {
                const Icon = contact.icon;
                return (
                  <li key={contact.label}>
                    <span className="home-footer__contact-icon" aria-hidden="true">
                      <Icon />
                    </span>
                    {contact.label}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className="home-footer__bottom">
          <p>© 2025 CiberBoxSecur Lda. Todos os direitos reservados. Lisboa, Portugal.</p>
          <div className="home-footer__legal" aria-label="Informação legal">
            <span>Política de Privacidade</span>
            <span>Termos de Serviço</span>
            <span>RGPD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function HomePage({ setPage }: PageProps) {
  const navigateTo = (target: Page) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setPage(target);
  };

  return (
    <>
      <main className="public-home">
        <section className="public-hero" aria-labelledby="home-hero-title">
          <div className="public-hero__glow public-hero__glow--violet" aria-hidden="true" />
          <div className="public-hero__glow public-hero__glow--blue" aria-hidden="true" />
          <div className="container-xl public-hero__container">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-10 col-xl-9">
                <div className="public-hero__content">
                  <span className="public-hero__badge">
                    <span className="public-hero__badge-dot" aria-hidden="true" />
                    {HOME_HERO_CONTENT.certification}
                  </span>
                  <h1 id="home-hero-title" className="public-hero__title">
                    {HOME_HERO_CONTENT.title}
                    <span>{HOME_HERO_CONTENT.highlightedTitle}</span>
                  </h1>
                  <p className="public-hero__description">{HOME_HERO_CONTENT.description}</p>
                  <div className="public-hero__actions">
                    <button
                      type="button"
                      onClick={() => setPage('services')}
                      className="public-hero__button public-hero__button--primary"
                    >
                      {HOME_HERO_CONTENT.primaryAction}
                      <span aria-hidden="true">→</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPage('contact')}
                      className="public-hero__button public-hero__button--secondary"
                    >
                      {HOME_HERO_CONTENT.secondaryAction}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="home-services" aria-labelledby="home-services-title" data-home-section="services">
          <div className="container-xl">
            <header className="home-section-heading">
              <p className="home-section-heading__eyebrow">O Que Fazemos</p>
              <h2 id="home-services-title">Serviços de Cibersegurança Completos</h2>
              <p>
                Proteção de ponta a ponta para a sua infraestrutura digital, desde a deteção de ameaças à
                conformidade regulatória.
              </p>
            </header>

            <div className="row g-4">
              {HOME_SERVICES.map((service) => {
                const Icon = service.icon;
                return (
                  <div className="col-12 col-md-4" key={service.title}>
                    <article className="home-service-card">
                      <div className={`home-service-card__icon home-service-card__icon--${service.accent}`}>
                        <Icon aria-hidden="true" />
                      </div>
                      <h3>{service.title}</h3>
                      <p>{service.description}</p>
                    </article>
                  </div>
                );
              })}
            </div>

            <div className="home-services__action">
              <button type="button" onClick={() => navigateTo('services')} className="home-services__details">
                + Detalhes
              </button>
            </div>
          </div>
        </section>

        <section className="home-final-cta" aria-labelledby="home-final-cta-title" data-home-section="final-cta">
          <div className="container-xl">
            <div className="home-final-cta__panel">
              <p className="home-final-cta__eyebrow">Comece Hoje</p>
              <h2 id="home-final-cta-title">
                Pronto para Proteger o
                <span>Seu Negócio?</span>
              </h2>
              <p>
                Agende uma demonstração gratuita e veja como a nossa tecnologia pode proteger a sua empresa contra as
                ameaças digitais.
              </p>
              <button type="button" onClick={() => navigateTo('contact')}>
                Agendar Serviços
              </button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter setPage={setPage} />
    </>
  );
}

export function AboutPage({ setPage }: PageProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="badge bg-blue-100 text-blue-700">Sobre Nós</span>
      <h1 className="mt-4 font-display text-5xl font-bold text-slate-900">
        Construímos confiança digital desde 2019
      </h1>
      <p className="mt-6 text-xl leading-relaxed text-slate-600">
        A CiberBoxSecur nasceu com a missão de democratizar o acesso a serviços profissionais de cibersegurança
        para PMEs e Grandes Empresas em Portugal e na Europa Lusófona.
      </p>

      <div className="mt-16 grid gap-8 sm:grid-cols-3">
        {[
          { t: 'Missão', d: 'Proteger organizações de todos os tamanhos contra ameaças cibernéticas modernas, com tecnologia acessível e equipa especializada.' },
          { t: 'Visão', d: 'Ser a plataforma de referência de cibersegurança em língua portuguesa, reconhecida pela inovação e excelência operacional.' },
          { t: 'Valores', d: 'Integridade, transparência, resiliência e melhoria contínua. A segurança é um processo, não um destino.' },
        ].map((v) => (
          <div key={v.t} className="rounded-2xl border border-slate-200 bg-white p-7">
            <h3 className="font-display text-xl font-semibold text-slate-900">{v.t}</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{v.d}</p>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-3xl bg-slate-900 p-10 text-white sm:p-14">
        <h2 className="font-display text-3xl font-bold">A nossa equipa</h2>
        <p className="mt-3 max-w-2xl text-slate-300">
          25+ especialistas certificados em cibersegurança, com experiência em setores regulados como banca, saúde, energia e administração pública.
        </p>
        <div className="mt-10 grid gap-6 sm:grid-cols-4">
          {[
            { n: 'CISSP', x: '12' },
            { n: 'CEH', x: '18' },
            { n: 'OSCP', x: '7' },
            { n: 'CISM', x: '5' },
          ].map((c) => (
            <div key={c.n} className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <div className="font-display text-4xl font-bold">{c.x}</div>
              <div className="mt-1 text-sm text-slate-400">Certificações {c.n}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-10 text-center">
        <button
          onClick={() => setPage('contact')}
          className="rounded-2xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white hover:bg-slate-800"
        >
          Fale connosco →
        </button>
      </div>
    </div>
  );
}

export function MissionPage({ setPage }: PageProps) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="badge bg-violet-100 text-violet-700">Missão & Propósito</span>
      <h1 className="mt-4 font-display text-5xl font-bold leading-tight text-slate-900">
        A segurança digital não é um luxo.
        <br />
        <span className="text-violet-600">É um direito fundamental.</span>
      </h1>

      <div className="mt-12 space-y-8">
        {[
          { t: '01. Proteger', d: 'Defender os ativos digitais dos nossos clientes com os mais altos padrões de segurança internacionalmente reconhecidos.', i: '🛡️' },
          { t: '02. Capacitar', d: 'Formar e capacitar as organizações para adotar uma cultura de cibersegurança resiliente e proativa.', i: '🎯' },
          { t: '03. Inovar', d: 'Investir continuamente em I&D para antecipar ameaças emergentes e disponibilizar tecnologia de ponta.', i: '💡' },
          { t: '04. Cumprir', d: 'Garantir o cumprimento rigoroso de todos os quadros regulamentares aplicáveis, nomeadamente o RGPD e o NIS2.', i: '⚖️' },
        ].map((p) => (
          <div key={p.t} className="flex gap-6 rounded-2xl border border-slate-200 bg-white p-7">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-violet-50 text-3xl">{p.i}</div>
            <div>
              <h3 className="font-display text-xl font-semibold text-slate-900">{p.t}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{p.d}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 rounded-3xl bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 p-10 text-white sm:p-14">
        <h2 className="font-display text-3xl font-bold">Junte-se a nós nesta missão</h2>
        <p className="mt-3 max-w-2xl text-white/80">
          Milhares de organizações já confiam na CiberBoxSecur. Está preparado para o próximo nível de segurança?
        </p>
        <button
          onClick={() => setPage('contact')}
          className="mt-8 rounded-2xl bg-white px-7 py-3.5 text-sm font-semibold text-violet-700 hover:bg-slate-50"
        >
          Saber mais →
        </button>
      </div>
    </div>
  );
}

export function ServicesPage({ setPage }: PageProps) {
  const navigateTo = (target: Page) => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setPage(target);
  };

  const navigateToDashboard = () => {
    const role = session.get().role;
    const target: Page =
      role === 'admin'
        ? 'admin-dashboard'
        : role === 'manager'
          ? 'mgr-dashboard'
          : role === 'client'
            ? 'cli-dashboard'
            : 'login';
    navigateTo(target);
  };

  return (
    <>
      <main className="public-subpage services-page" data-public-page="services">
        <section
          className="public-page-hero phase2-public-hero services-page__hero"
          aria-labelledby="services-page-title"
        >
          <div className="public-page-hero__orb public-page-hero__orb--violet" aria-hidden="true" />
          <div className="public-page-hero__orb public-page-hero__orb--blue" aria-hidden="true" />
          <div className="container-xl public-page-hero__container">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-10 col-xl-9">
                <div className="public-page-hero__content">
                  <span className="public-page-kicker">Os Nossos Serviços · Equipa Certificada</span>
                  <h1 id="services-page-title" className="public-page-title">
                    Proteção abrangente para <span>cada ameaça.</span>
                  </h1>
                  <p className="public-page-lead">
                    Do SOC 24/7 à conformidade NIS2, a nossa equipa certificada cobre todo o ciclo de vida da
                    cibersegurança empresarial.
                  </p>
                  <div className="public-page-hero__actions">
                    <button
                      type="button"
                      className="phase2-button phase2-button--primary"
                      onClick={() => navigateTo('contact')}
                    >
                      Pedir Proposta
                      <ArrowRight aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      className="phase2-button phase2-button--secondary"
                      onClick={() => navigateTo('contact')}
                    >
                      Falar com um Especialista
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="service-proof-strip" aria-label="Compromissos do serviço" data-page-section="service-proof">
          <div className="container-xl">
            <div className="row g-3 g-xl-4">
              {SERVICE_PROOF_POINTS.map((point) => {
                const Icon = point.icon;
                return (
                  <div className="col-12 col-sm-6 col-xl-3" key={point.title}>
                    <article className="service-proof-card">
                      <span className={`service-proof-card__icon service-proof-card__icon--${point.accent}`} aria-hidden="true">
                        <Icon />
                      </span>
                      <div>
                        <h2>{point.title}</h2>
                        <p>{point.detail}</p>
                      </div>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="services-page__catalog"
          aria-labelledby="services-catalog-title"
          data-page-section="services-catalog"
        >
          <div className="container-xl">
            <header className="services-section-heading">
              <p className="services-section-heading__eyebrow">Catálogo de Serviços</p>
              <h2 id="services-catalog-title">O que oferecemos</h2>
              <p>Todos os serviços são prestados pela nossa equipa certificada com SLAs documentados.</p>
            </header>

            <div className="row g-4 services-catalog-grid">
              {PUBLIC_SERVICES.map((service) => {
                const Icon = service.icon;
                return (
                  <div className="col-12 col-md-6 col-xl-4" key={service.title}>
                    <article className="service-detail-card">
                      <div className="service-detail-card__topline">
                        <span
                          className={`service-detail-card__icon service-detail-card__icon--${service.accent}`}
                          aria-hidden="true"
                        >
                          <Icon />
                        </span>
                        {service.nis2 ? <span className={`service-detail-card__badge service-detail-card__badge--${service.accent}`}>NIS2</span> : null}
                      </div>
                      <h3>{service.title}</h3>
                      <p className="service-detail-card__price">{service.price}</p>
                      <ul>
                        {service.features.map((feature) => (
                          <li key={feature}>
                            <CircleCheckBig aria-hidden="true" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                      <span
                        className="service-detail-card__more"
                        title="Ainda não existe uma página pública individual para este serviço"
                      >
                        Saber mais <ChevronRight aria-hidden="true" />
                      </span>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className="services-process"
          aria-labelledby="services-process-title"
          data-page-section="services-process"
        >
          <div className="container-xl">
            <header className="services-section-heading">
              <p className="services-section-heading__eyebrow">Como Trabalhamos</p>
              <h2 id="services-process-title">O nosso processo</h2>
              <p>Metodologia estruturada para garantir resultados consistentes em cada projeto.</p>
            </header>

            <div className="row g-5 g-xl-4">
              {SERVICE_PROCESS_STEPS.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="col-12 col-sm-6 col-xl-3" key={item.step}>
                    <article className="service-process-step">
                      <div className="service-process-step__icon" aria-hidden="true">
                        <Icon />
                        <span>{item.step}</span>
                      </div>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </article>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="services-nis2" aria-labelledby="services-nis2-title" data-page-section="services-nis2">
          <div className="container-xl">
            <header className="services-section-heading services-section-heading--nis2">
              <p className="services-section-heading__eyebrow">Diretiva NIS2</p>
              <h2 id="services-nis2-title">O que é a NIS2 e o que implica para a sua empresa?</h2>
              <p>
                A Diretiva NIS2 (Network and Information Security 2) é a lei europeia de cibersegurança mais
                abrangente até à data. Entrou em vigor em outubro de 2024 e obriga milhares de organizações
                portuguesas a adotarem medidas concretas de segurança.
              </p>
            </header>

            <div className="row g-4 services-nis2__grid">
              {NIS2_REQUIREMENTS.map((requirement) => {
                const Icon = requirement.icon;
                return (
                  <div className="col-12 col-md-6 col-xl-4" key={requirement.title}>
                    <article className="nis2-requirement-card">
                      <span
                        className={`nis2-requirement-card__icon nis2-requirement-card__icon--${requirement.accent}`}
                        aria-hidden="true"
                      >
                        <Icon />
                      </span>
                      <h3>{requirement.title}</h3>
                      <p>{requirement.description}</p>
                    </article>
                  </div>
                );
              })}
            </div>

            <aside className="nis2-assessment" aria-labelledby="nis2-assessment-title">
              <span className="nis2-assessment__icon" aria-hidden="true">
                <Shield />
              </span>
              <div className="nis2-assessment__content">
                <h3 id="nis2-assessment-title">Não tem a certeza se a sua organização é abrangida?</h3>
                <p>
                  A CiberBoxSecur realiza gratuitamente uma avaliação inicial de conformidade NIS2 para determinar
                  as suas obrigações e os passos a seguir.
                </p>
                <p>
                  Consulte também o portal oficial do CNCS em{' '}
                  <a href="https://www.cncs.gov.pt/" target="_blank" rel="noreferrer">
                    cncs.gov.pt
                  </a>
                  .
                </p>
              </div>
              <button type="button" onClick={() => navigateTo('contact')}>
                Avaliação Gratuita <ArrowRight aria-hidden="true" />
              </button>
            </aside>
          </div>
        </section>

        <section className="services-final-cta" aria-labelledby="services-final-cta-title" data-page-section="services-final-cta">
          <div className="container-xl">
            <div className="services-final-cta__panel">
              <p className="services-final-cta__eyebrow">Comece Hoje</p>
              <h2 id="services-final-cta-title">
                Pronto para Proteger o
                <span>Seu Negócio?</span>
              </h2>
              <p>Agende uma demonstração gratuita e veja como a CiberBoxSecur pode proteger a sua empresa.</p>
              <div className="services-final-cta__actions">
                <button type="button" className="services-final-cta__primary" onClick={() => navigateTo('contact')}>
                  Pedir Demonstração <ArrowRight aria-hidden="true" />
                </button>
                <button type="button" className="services-final-cta__secondary" onClick={navigateToDashboard}>
                  <LockKeyhole aria-hidden="true" /> Dashboard
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter setPage={setPage} />
    </>
  );
}

function NewsArticleCard({ article, onSelect }: { article: NewsArticle; onSelect: (articleId: string) => void }) {
  return (
    <article className="news-v97-card">
      <div className="news-v97-card__media">
        <img src={article.image} alt={article.title} />
        <time className="news-v97-card__date" dateTime={article.dateTime}>
          {article.shortDate}
        </time>
      </div>
      <div className="news-v97-card__content">
        <span className={`news-v97-card__category news-v97-card__category--${article.categoryTone}`}>
          {article.category}
        </span>
        <h3>{article.title}</h3>
      </div>
      <button
        type="button"
        className="news-v97-card__link"
        onClick={() => onSelect(article.id)}
        aria-label={`Ler artigo: ${article.title}`}
      />
    </article>
  );
}

export function NewsPage({ setPage, onSelectArticle }: NewsPageProps) {
  const featuredArticle = NEWS_ARTICLES.find((article) => article.featured) ?? NEWS_ARTICLES[0];
  const remainingArticles = NEWS_ARTICLES.filter((article) => article.id !== featuredArticle.id);

  return (
    <>
      <main className="public-subpage news-page news-v97" data-public-page="news">
        <section className="public-page-hero phase2-public-hero news-page__hero" aria-labelledby="news-page-title">
          <div className="container-xl public-page-hero__container">
            <div className="row justify-content-center">
              <div className="col-12 col-lg-8">
                <div className="public-page-hero__content">
                  <span className="public-page-kicker">Centro de Conhecimento · Artigos &amp; Análises</span>
                  <h1 id="news-page-title" className="public-page-title">
                    Notícias de <span>Cibersegurança</span>
                  </h1>
                  <p className="public-page-lead">
                    Mantenha-se informado sobre as últimas tendências, ameaças e boas práticas em segurança digital e
                    conformidade regulamentar.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="news-v97__feed" aria-label="Artigos recentes" data-page-section="news-articles">
          <div className="container-xl news-v97__container">
            <article className="news-v97-featured">
              <div className="news-v97-featured__media">
                <img src={featuredArticle.image} alt={featuredArticle.title} />
              </div>
              <div className="news-v97-featured__content">
                <span className="news-v97-featured__category">{featuredArticle.category}</span>
                <h2>{featuredArticle.title}</h2>
                <p>{featuredArticle.excerpt}</p>
                <div className="news-v97-featured__date">
                  <CalendarDays aria-hidden="true" />
                  <time dateTime={featuredArticle.dateTime}>{featuredArticle.date}</time>
                </div>
                <button
                  type="button"
                  className="news-v97-featured__read"
                  onClick={() => onSelectArticle(featuredArticle.id)}
                >
                  Ler artigo <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </article>

            <div className="row g-4 news-v97-grid">
              {remainingArticles.map((article) => (
                <div className="col-12 col-md-4" key={article.id}>
                  <NewsArticleCard article={article} onSelect={onSelectArticle} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter setPage={setPage} />
    </>
  );
}

export function NewsDetailPage({ setPage, selectedArticleId, onSelectArticle }: NewsDetailPageProps) {
  const article = NEWS_ARTICLES.find((item) => item.id === selectedArticleId) ?? NEWS_ARTICLES[0];
  const latestArticles = NEWS_ARTICLES.filter((item) => item.id !== article.id).slice(0, 3);

  const returnToNews = () => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setPage('news');
  };

  return (
    <>
      <main className="news-detail" data-public-page="news-detail">
        <article className="news-detail__article" aria-labelledby="news-detail-title">
          <div className="container-xl news-detail__container">
            <div className="news-detail__heading-wrap">
              <button type="button" className="news-detail__back" onClick={returnToNews}>
                <ArrowLeft aria-hidden="true" /> Voltar às notícias
              </button>

              <header className="news-detail__header">
                <div className="news-detail__meta" aria-label="Informação do artigo">
                  <span className={`news-detail__category news-detail__category--${article.categoryTone}`}>
                    <Tag aria-hidden="true" /> {article.category}
                  </span>
                  <span>
                    <CalendarDays aria-hidden="true" />
                    <time dateTime={article.dateTime}>{article.date}</time>
                  </span>
                  {article.readingTime && (
                    <span>
                      <Clock3 aria-hidden="true" /> {article.readingTime}
                    </span>
                  )}
                </div>

                <h1 id="news-detail-title">{article.title}</h1>
                <p>{article.excerpt}</p>
              </header>
            </div>

            <figure className="news-detail__figure">
              <img src={article.image} alt={article.title} />
            </figure>

            <div className="news-detail__body">
              {article.content.map((block, index) => {
                if (block.type === 'paragraph') {
                  return <p key={`paragraph-${index}`}>{block.text}</p>;
                }

                if (block.type === 'note') {
                  return (
                    <aside className="news-detail__note" key={`note-${index}`}>
                      <strong>{block.title}</strong>
                      <p>{block.text}</p>
                    </aside>
                  );
                }

                return (
                  <section className="news-detail__section" key={`${block.heading}-${index}`}>
                    <h2>{block.heading}</h2>
                    {block.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                    {block.items && (
                      <ul>
                        {block.items.map((item) => <li key={item}>{item}</li>)}
                      </ul>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        </article>

        <section className="news-detail__latest" aria-labelledby="latest-news-title">
          <div className="container-xl news-v97__container">
            <header className="news-detail__latest-heading">
              <span>Centro de Conhecimento</span>
              <h2 id="latest-news-title">Últimas Publicações</h2>
            </header>
            <div className="row g-4 news-detail__latest-grid">
              {latestArticles.map((latestArticle) => (
                <div className="col-12 col-md-6 col-xl-4" key={latestArticle.id}>
                  <NewsArticleCard article={latestArticle} onSelect={onSelectArticle} />
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <PublicFooter setPage={setPage} />
    </>
  );
}

export function ContactPage({ setPage }: PageProps) {
  const [sent, setSent] = useState(false);

  return (
    <main className="public-subpage contact-page" data-public-page="contact">
      <section className="public-page-hero phase2-public-hero contact-page__hero" aria-labelledby="contact-page-title">
        <div className="public-page-hero__orb public-page-hero__orb--violet" aria-hidden="true" />
        <div className="public-page-hero__orb public-page-hero__orb--blue" aria-hidden="true" />
        <div className="container-xl public-page-hero__container">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10 col-xl-9">
              <div className="public-page-hero__content">
                <span className="public-page-kicker">Fale Connosco · Resposta em 1 dia útil</span>
                <h1 id="contact-page-title" className="public-page-title">
                  Estamos prontos para proteger a sua empresa.
                </h1>
                <p className="public-page-lead">
                  Contacte a nossa equipa de especialistas para uma avaliação gratuita ou para saber mais sobre os
                  nossos serviços.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-xl public-subpage__container">
        <section className="contact-page__content" aria-label="Formulário e contactos" data-page-section="contact-content">
          <div className="row g-4 g-xl-5 align-items-start">
            <div className="col-12 col-lg-7">
              <div className="contact-form-panel">
                <header className="contact-section-heading">
                  <h2>Envie-nos uma mensagem</h2>
                </header>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    setSent(true);
                  }}
                  className="contact-form"
                >
                  <div className="row g-3">
                    <div className="col-12 col-sm-6">
                      <label className="form-label" htmlFor="contact-name">
                        Nome completo
                      </label>
                      <input
                        id="contact-name"
                        name="name"
                        autoComplete="name"
                        required
                        className="form-control contact-form__control"
                        placeholder="Nome Sobrenome"
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label" htmlFor="contact-email">
                        Email profissional
                      </label>
                      <input
                        id="contact-email"
                        name="email"
                        autoComplete="email"
                        required
                        type="email"
                        className="form-control contact-form__control"
                        placeholder="nome@empresa.pt"
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label" htmlFor="contact-company">
                        Empresa
                      </label>
                      <input
                        id="contact-company"
                        name="company"
                        autoComplete="organization"
                        className="form-control contact-form__control"
                        placeholder="Empresa, Lda."
                      />
                    </div>
                    <div className="col-12 col-sm-6">
                      <label className="form-label" htmlFor="contact-service">
                        Serviço de interesse
                      </label>
                      <select
                        id="contact-service"
                        name="service"
                        className="form-select contact-form__control"
                        defaultValue="MDR / SOC 24/7"
                      >
                        <option>MDR / SOC 24/7</option>
                        <option>Penetration Testing</option>
                        <option>Consultoria NIS2</option>
                        <option>Consultoria RGPD</option>
                        <option>Formação &amp; Phishing</option>
                        <option>Outro / Preciso de ajuda</option>
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label" htmlFor="contact-message">
                        Mensagem
                      </label>
                      <textarea
                        id="contact-message"
                        name="message"
                        required
                        rows={5}
                        className="form-control contact-form__control contact-form__textarea"
                        placeholder="Conte-nos mais sobre o seu projeto ou desafio..."
                      />
                    </div>
                  </div>
                  <button type="submit" className="contact-form__submit" aria-live="polite">
                    {sent ? '✓ Mensagem enviada!' : 'Enviar mensagem'}
                    {!sent && <ArrowRight aria-hidden="true" />}
                  </button>
                </form>
              </div>
            </div>

            <aside className="col-12 col-lg-5 contact-page__aside" aria-label="Canais de contacto">
              <section className="contact-office" aria-labelledby="contact-office-title">
                <header className="contact-section-heading">
                  <h2 id="contact-office-title">O nosso escritório</h2>
                </header>

                <div className="contact-office__map" aria-hidden="true">
                  <span className="contact-office__map-grid" />
                  <span className="contact-office__pin"><MapPin /></span>
                </div>

                <div className="contact-office__channels">
                  {PUBLIC_CONTACT_CHANNELS.map((channel) => {
                    const Icon = channel.icon;
                    return (
                      <article className="contact-channel-card" key={channel.title}>
                        <span className="contact-channel-card__icon" aria-hidden="true">
                          <Icon />
                        </span>
                        <div>
                          <h3>{channel.title}</h3>
                          <p>{channel.value}</p>
                          <span>{channel.detail}</span>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>

              <div className="contact-login-card">
                <h2>Já tem conta?</h2>
                <p>Entre diretamente na plataforma.</p>
                <button type="button" onClick={() => setPage('login')}>
                  Iniciar Sessão <ArrowRight aria-hidden="true" />
                </button>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}
