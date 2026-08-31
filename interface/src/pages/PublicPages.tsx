import { useEffect, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Award,
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
  Send,
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
import {
  conteudosPublicosApi, enviarContactoPublicoApi, noticiaPublicaDetalheApi, noticiasPublicasApi, session,
  type ApiConteudoSite, type ApiNoticia,
} from '../apiClient';
import { PUBLIC_CONTENT_KEYS } from '../publicContentCms';
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
  image?: string | null;
  featured: boolean;
  readingTime?: string;
  content: readonly NewsContentBlock[];
}

function formatNewsDate(value?: string | null) {
  if (!value) return 'Data não disponível';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Data não disponível';
  return new Intl.DateTimeFormat('pt-PT', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}

function formatNewsShortDate(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('pt-PT').format(date);
}

function apiNewsToArticle(news: ApiNoticia): NewsArticle {
  const publishedAt = news.publicada_em ?? news.criado_em ?? null;
  const paragraphs = news.corpo.split(/\n\s*\n/).map((text) => text.trim()).filter(Boolean);
  return {
    id: String(news.id),
    slug: String(news.id),
    title: news.titulo,
    // O modelo atual não tem categoria. Este rótulo é puramente de interface,
    // sem classificar ou inventar dados editoriais.
    category: 'Publicação',
    categoryTone: 'blue',
    date: formatNewsDate(publishedAt),
    shortDate: formatNewsShortDate(publishedAt),
    dateTime: publishedAt ?? '',
    excerpt: news.resumo,
    image: news.imagem_url ?? null,
    featured: false,
    content: (paragraphs.length ? paragraphs : [news.corpo]).map((text) => ({ type: 'paragraph', text })),
  };
}

// TODO(CMS): conteúdo editorial provisório. Esta coleção será substituída por GET /api/public/noticias.
const NEWS_ARTICLES: readonly NewsArticle[] = [
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

const CONTACT_CHANNELS = [
  {
    title: 'Morada',
    value: 'Av. da Liberdade 110, 3.º\n1269-046 Lisboa, Portugal',
    icon: MapPin,
    tone: 'violet',
  },
  { title: 'Telefone', value: '+351 21 000 0000', icon: Phone, tone: 'blue' },
  { title: 'Email', value: 'info@ciberboxsecur.pt', icon: Mail, tone: 'green' },
  { title: 'Website', value: 'www.ciberboxsecur.pt', icon: Globe, tone: 'amber' },
] as const;

const CONTACT_SERVICE_OPTIONS = [
  'SOC / Monitorização 24/7',
  'Conformidade NIS2',
  'Testes de Penetração',
  'Avaliação de Risco',
  'Resposta a Incidentes',
  'Formação em Sensibilização',
  'Outro',
] as const;

const CONTACT_CERTIFICATIONS = ['ISO 27001', 'CNCS', 'NIS2', 'RGPD'] as const;

function usePublicSiteContents() {
  const [contents, setContents] = useState<ApiConteudoSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    conteudosPublicosApi()
      .then((rows) => { if (active) setContents(rows); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o conteúdo publicado.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return { contents, loading, error };
}

function firstContent(contents: ApiConteudoSite[], chave: string) {
  return contents.find((content) => content.chave === chave);
}

function repeatedContent(contents: ApiConteudoSite[], chave: string) {
  return contents.filter((content) => content.chave === chave);
}

function contentText(value: string | null | undefined, fallback: string) {
  return value?.trim() || fallback;
}

function contentLines(value: string | null | undefined) {
  return (value ?? '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function highlightedHeading(value: string) {
  const [before, ...after] = value.split('|');
  const highlight = after.join('|').trim();
  return highlight ? <>{before.trim()} <span>{highlight}</span></> : value;
}

function contactScheduleRows(value: string | null | undefined) {
  return contentLines(value).map((line) => {
    const [label, ...time] = line.split('|');
    return { label: label.trim(), time: time.join('|').trim() };
  }).filter((row) => row.label && row.time);
}

function PublicFooter({ setPage }: PageProps) {
  const { contents } = usePublicSiteContents();
  const channelRows = repeatedContent(contents, PUBLIC_CONTENT_KEYS.contactChannel);
  const contacts = channelRows.length
    ? channelRows.map((content, index) => ({
      id: content.id,
      label: contentText(content.corpo, contentText(content.subtitulo, content.titulo)),
      icon: HOME_FOOTER_CONTACTS[index % HOME_FOOTER_CONTACTS.length].icon,
    }))
    : HOME_FOOTER_CONTACTS;
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
              {contacts.map((contact) => {
                const Icon = contact.icon;
                return (
                  <li key={'id' in contact ? contact.id : contact.label}>
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
  const [contents, setContents] = useState<ApiConteudoSite[]>([]);
  const [loadingContents, setLoadingContents] = useState(true);
  const [contentError, setContentError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    conteudosPublicosApi()
      .then((rows) => { if (active) setContents(rows); })
      .catch((cause) => { if (active) setContentError(cause instanceof Error ? cause.message : 'Não foi possível carregar o conteúdo institucional.'); })
      .finally(() => { if (active) setLoadingContents(false); });
    return () => { active = false; };
  }, []);

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="badge bg-blue-100 text-blue-700">Sobre Nós</span>
      <h1 className="mt-4 font-display text-5xl font-bold text-slate-900">
        Conteúdo institucional
      </h1>
      {loadingContents ? <p className="mt-6 text-slate-500">A carregar conteúdo institucional...</p> : contentError ? <p className="mt-6 text-rose-700" role="alert">{contentError}</p> : contents.length === 0 ? <p className="mt-6 text-slate-500">Sem conteúdo institucional publicado.</p> : <div className="mt-10 grid gap-8 sm:grid-cols-2">{contents.map((content) => <article key={content.id} className="rounded-2xl border border-slate-200 bg-white p-7"><h2 className="font-display text-xl font-semibold text-slate-900">{content.titulo}</h2>{content.subtitulo && <p className="mt-2 text-sm font-medium text-blue-700">{content.subtitulo}</p>}{content.corpo && <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-600">{content.corpo}</p>}</article>)}</div>}

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
  const { contents, loading: loadingContent, error: contentError } = usePublicSiteContents();
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

  const hero = firstContent(contents, PUBLIC_CONTENT_KEYS.servicesHero);
  const catalog = firstContent(contents, PUBLIC_CONTENT_KEYS.servicesCatalog);
  const processHeader = firstContent(contents, PUBLIC_CONTENT_KEYS.servicesProcessHeader);
  const nis2Header = firstContent(contents, PUBLIC_CONTENT_KEYS.servicesNis2Header);
  const nis2Cta = firstContent(contents, PUBLIC_CONTENT_KEYS.servicesNis2Cta);
  const finalCta = firstContent(contents, PUBLIC_CONTENT_KEYS.servicesFinalCta);
  const proofRows = repeatedContent(contents, PUBLIC_CONTENT_KEYS.servicesProof);
  const serviceRows = repeatedContent(contents, PUBLIC_CONTENT_KEYS.service);
  const processRows = repeatedContent(contents, PUBLIC_CONTENT_KEYS.servicesProcessStep);
  const nis2RequirementRows = repeatedContent(contents, PUBLIC_CONTENT_KEYS.servicesNis2Requirement);
  const proofPoints = proofRows.length
    ? proofRows.map((content, index) => ({
      id: content.id,
      title: content.titulo,
      detail: contentText(content.subtitulo, contentText(content.corpo, '—')),
      icon: SERVICE_PROOF_POINTS[index % SERVICE_PROOF_POINTS.length].icon,
      accent: SERVICE_PROOF_POINTS[index % SERVICE_PROOF_POINTS.length].accent,
    }))
    : SERVICE_PROOF_POINTS;
  const services = serviceRows.length
    ? serviceRows.map((content, index) => {
      const presentation = PUBLIC_SERVICES[index % PUBLIC_SERVICES.length];
      return {
        id: content.id,
        title: content.titulo,
        price: contentText(content.subtitulo, 'Sob consulta'),
        features: contentLines(content.corpo).length ? contentLines(content.corpo) : ['Consulte-nos para uma proposta personalizada.'],
        icon: presentation.icon,
        accent: presentation.accent,
        nis2: /\bnis2\b/i.test([content.titulo, content.subtitulo, content.corpo].filter(Boolean).join(' ')),
      };
    })
    : PUBLIC_SERVICES;
  const processSteps = processRows.length
    ? processRows.map((content, index) => ({
      id: content.id,
      step: String(index + 1).padStart(2, '0'),
      title: content.titulo,
      description: contentText(content.corpo, 'Informação a disponibilizar pelo Back Office.'),
      icon: SERVICE_PROCESS_STEPS[index % SERVICE_PROCESS_STEPS.length].icon,
    }))
    : SERVICE_PROCESS_STEPS;
  const nis2Requirements = nis2RequirementRows.length
    ? nis2RequirementRows.map((content, index) => ({
      id: content.id,
      title: content.titulo,
      description: contentText(content.corpo, 'Informação a disponibilizar pelo Back Office.'),
      icon: NIS2_REQUIREMENTS[index % NIS2_REQUIREMENTS.length].icon,
      accent: NIS2_REQUIREMENTS[index % NIS2_REQUIREMENTS.length].accent,
    }))
    : NIS2_REQUIREMENTS;
  const nis2CtaLink = nis2Cta?.imagem_url?.trim() || (nis2Cta ? '' : 'https://www.cncs.gov.pt/');

  return (
    <>
      <main className="public-subpage services-page" data-public-page="services" aria-busy={loadingContent}>
        {contentError && <p className="visually-hidden" role="status">Conteúdo publicado temporariamente indisponível; é apresentada a informação institucional disponível.</p>}
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
                  <span className="public-page-kicker">{contentText(hero?.subtitulo, 'Os Nossos Serviços · Equipa Certificada')}</span>
                  <h1 id="services-page-title" className="public-page-title">
                    {highlightedHeading(contentText(hero?.titulo, 'Proteção abrangente para |cada ameaça.'))}
                  </h1>
                  <p className="public-page-lead">
                    {contentText(hero?.corpo, 'Do SOC 24/7 à conformidade NIS2, a nossa equipa certificada cobre todo o ciclo de vida da cibersegurança empresarial.')}
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
              {proofPoints.map((point) => {
                const Icon = point.icon;
                return (
                  <div className="col-12 col-sm-6 col-xl-3" key={'id' in point ? point.id : point.title}>
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
              <p className="services-section-heading__eyebrow">{contentText(catalog?.subtitulo, 'Catálogo de Serviços')}</p>
              <h2 id="services-catalog-title">{contentText(catalog?.titulo, 'O que oferecemos')}</h2>
              <p>{contentText(catalog?.corpo, 'Todos os serviços são prestados pela nossa equipa certificada com SLAs documentados.')}</p>
            </header>

            <div className="row g-4 services-catalog-grid">
              {services.map((service) => {
                const Icon = service.icon;
                return (
                  <div className="col-12 col-md-6 col-xl-4" key={'id' in service ? service.id : service.title}>
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
              <p className="services-section-heading__eyebrow">{contentText(processHeader?.subtitulo, 'Como Trabalhamos')}</p>
              <h2 id="services-process-title">{contentText(processHeader?.titulo, 'O nosso processo')}</h2>
              <p>{contentText(processHeader?.corpo, 'Metodologia estruturada para garantir resultados consistentes em cada projeto.')}</p>
            </header>

            <div className="row g-5 g-xl-4">
              {processSteps.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="col-12 col-sm-6 col-xl-3" key={'id' in item ? item.id : item.step}>
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
              <p className="services-section-heading__eyebrow">{contentText(nis2Header?.subtitulo, 'Diretiva NIS2')}</p>
              <h2 id="services-nis2-title">{contentText(nis2Header?.titulo, 'O que é a NIS2 e o que implica para a sua empresa?')}</h2>
              <p>{contentText(nis2Header?.corpo, 'A Diretiva NIS2 (Network and Information Security 2) é a lei europeia de cibersegurança mais abrangente até à data. Entrou em vigor em outubro de 2024 e obriga milhares de organizações portuguesas a adotarem medidas concretas de segurança.')}</p>
            </header>

            <div className="row g-4 services-nis2__grid">
              {nis2Requirements.map((requirement) => {
                const Icon = requirement.icon;
                return (
                  <div className="col-12 col-md-6 col-xl-4" key={'id' in requirement ? requirement.id : requirement.title}>
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
                <h3 id="nis2-assessment-title">{contentText(nis2Cta?.titulo, 'Não tem a certeza se a sua organização é abrangida?')}</h3>
                <p>{contentText(nis2Cta?.corpo, 'A CiberBoxSecur realiza gratuitamente uma avaliação inicial de conformidade NIS2 para determinar as suas obrigações e os passos a seguir.')}</p>
                {nis2CtaLink && <p>Consulte também <a href={nis2CtaLink} target="_blank" rel="noreferrer">a informação oficial</a>.</p>}
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
              <p className="services-final-cta__eyebrow">{contentText(finalCta?.subtitulo, 'Comece Hoje')}</p>
              <h2 id="services-final-cta-title">
                {highlightedHeading(contentText(finalCta?.titulo, 'Pronto para Proteger o|Seu Negócio?'))}
              </h2>
              <p>{contentText(finalCta?.corpo, 'Agende uma demonstração gratuita e veja como a CiberBoxSecur pode proteger a sua empresa.')}</p>
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
        {article.image && <img src={article.image} alt={article.title} />}
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
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    noticiasPublicasApi()
      .then((rows) => { if (active) setArticles(rows.map(apiNewsToArticle)); })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as publicações.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const [featuredArticle, ...remainingArticles] = articles;

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
            {loading && <p className="text-center text-slate-500">A carregar publicações...</p>}
            {error && <p className="text-center text-rose-700" role="alert">{error}</p>}
            {!loading && !error && !featuredArticle && <p className="text-center text-slate-500">Ainda não existem publicações disponíveis.</p>}
            {featuredArticle && <>
              <article className="news-v97-featured">
                <div className="news-v97-featured__media">
                  {featuredArticle.image && <img src={featuredArticle.image} alt={featuredArticle.title} />}
                </div>
                <div className="news-v97-featured__content">
                  <span className="news-v97-featured__category">{featuredArticle.category}</span>
                  <h2>{featuredArticle.title}</h2>
                  <p>{featuredArticle.excerpt}</p>
                  <div className="news-v97-featured__date">
                    <CalendarDays aria-hidden="true" />
                    <time dateTime={featuredArticle.dateTime}>{featuredArticle.date}</time>
                  </div>
                  <button type="button" className="news-v97-featured__read" onClick={() => onSelectArticle(featuredArticle.id)}>
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
            </>}
          </div>
        </section>
      </main>

      <PublicFooter setPage={setPage} />
    </>
  );
}

export function NewsDetailPage({ setPage, selectedArticleId, onSelectArticle }: NewsDetailPageProps) {
  const [article, setArticle] = useState<NewsArticle | null>(null);
  const [latestArticles, setLatestArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const id = Number(selectedArticleId);
    if (!Number.isSafeInteger(id) || id < 1) {
      setArticle(null);
      setLatestArticles([]);
      setError('Publicação não encontrada.');
      setLoading(false);
      return;
    }
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([noticiaPublicaDetalheApi(id), noticiasPublicasApi()])
      .then(([item, all]) => {
        if (!active) return;
        setArticle(apiNewsToArticle(item));
        setLatestArticles(all.filter((news) => news.id !== id).slice(0, 3).map(apiNewsToArticle));
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a publicação.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedArticleId]);

  const returnToNews = () => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    setPage('news');
  };

  if (loading) return <main className="news-detail"><p className="py-16 text-center text-slate-500">A carregar publicação...</p></main>;
  if (error || !article) return <main className="news-detail"><p className="py-16 text-center text-rose-700" role="alert">{error || 'Publicação não encontrada.'}</p></main>;

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
              {article.image && <img src={article.image} alt={article.title} />}
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
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const { contents, loading: loadingContent, error: contentError } = usePublicSiteContents();
  const hero = firstContent(contents, PUBLIC_CONTENT_KEYS.contactHero);
  const formContent = firstContent(contents, PUBLIC_CONTENT_KEYS.contactForm);
  const scheduleContent = firstContent(contents, PUBLIC_CONTENT_KEYS.contactSchedule);
  const channelRows = repeatedContent(contents, PUBLIC_CONTENT_KEYS.contactChannel);
  const serviceRows = repeatedContent(contents, PUBLIC_CONTENT_KEYS.service);
  const certificationRows = repeatedContent(contents, PUBLIC_CONTENT_KEYS.contactCertification);
  const channels = channelRows.length
    ? channelRows.map((content, index) => ({
      id: content.id,
      title: content.titulo,
      value: contentText(content.corpo, contentText(content.subtitulo, '—')),
      icon: CONTACT_CHANNELS[index % CONTACT_CHANNELS.length].icon,
      tone: CONTACT_CHANNELS[index % CONTACT_CHANNELS.length].tone,
    }))
    : CONTACT_CHANNELS;
  const serviceOptions = serviceRows.length ? serviceRows.map((service) => service.titulo) : CONTACT_SERVICE_OPTIONS;
  const scheduleRows = scheduleContent
    ? contactScheduleRows(scheduleContent.corpo).length
      ? contactScheduleRows(scheduleContent.corpo)
      : [{ label: contentText(scheduleContent.subtitulo, 'Horário'), time: '—' }]
    : [
      { label: 'Segunda – Sexta', time: '09:00 – 18:00' },
      { label: 'SOC (clientes ativos)', time: '24 / 7' },
    ];
  const certifications = certificationRows.length ? certificationRows.map((content) => ({ id: content.id, label: content.titulo })) : CONTACT_CERTIFICATIONS.map((label) => ({ id: label, label }));

  async function submitContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const values = new FormData(form);
    const firstName = String(values.get('firstName') ?? '').trim();
    const lastName = String(values.get('lastName') ?? '').trim();
    setStatus('sending');
    setError(null);
    try {
      await enviarContactoPublicoApi({
        nome: [firstName, lastName].filter(Boolean).join(' '),
        email: String(values.get('email') ?? '').trim(),
        empresa: String(values.get('organization') ?? '').trim(),
        assunto: String(values.get('service') ?? '').trim(),
        mensagem: String(values.get('message') ?? '').trim(),
      });
      form.reset();
      setStatus('sent');
    } catch (cause) {
      setStatus('error');
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar a mensagem.');
    }
  }

  return (
    <>
      <main className="public-subpage contact-page contact-v97" data-public-page="contact" aria-busy={loadingContent}>
        {contentError && <p className="visually-hidden" role="status">Conteúdo publicado temporariamente indisponível; é apresentada a informação institucional disponível.</p>}
        <section className="contact-v97__hero" aria-labelledby="contact-page-title">
          <span className="contact-v97__hero-orb contact-v97__hero-orb--violet" aria-hidden="true" />
          <span className="contact-v97__hero-orb contact-v97__hero-orb--blue" aria-hidden="true" />
          <span className="contact-v97__hero-grid" aria-hidden="true" />

          <div className="container-xl contact-v97__hero-container">
            <div className="contact-v97__hero-content">
              <span className="contact-v97__badge">
                <span aria-hidden="true" />
                {contentText(hero?.subtitulo, 'Fale Connosco · Resposta em 1 dia útil')}
              </span>
              <h1 id="contact-page-title">
                {highlightedHeading(contentText(hero?.titulo, 'Estamos prontos para|proteger a sua empresa.'))}
              </h1>
              <p>{contentText(hero?.corpo, 'Contacte a nossa equipa de especialistas para uma avaliação gratuita ou para saber mais sobre os nossos serviços.')}</p>
            </div>
          </div>
        </section>

        <section className="contact-v97__body" aria-label="Formulário e contactos" data-page-section="contact-content">
          <div className="container-xl contact-v97__container">
            <div className="row align-items-start contact-v97__layout">
              <div className="col-12 col-md-7 contact-v97__form-column">
                <header className="contact-v97__form-heading">
                  <span className="contact-v97__form-heading-icon" aria-hidden="true">
                    <Send />
                  </span>
                  <div>
                    <h2>{contentText(formContent?.titulo, 'Envie-nos uma mensagem')}</h2>
                    <p>{contentText(formContent?.subtitulo, 'Respondemos em menos de 1 dia útil')}</p>
                  </div>
                </header>

                <form
                  className="contact-v97__form"
                  onChange={() => status !== 'idle' && setStatus('idle')}
                  onSubmit={submitContact}
                >
                  <div className="row g-3">
                    <div className="col-12 col-sm-6 contact-v97__field">
                      <label htmlFor="contact-first-name">Nome</label>
                      <input
                        id="contact-first-name"
                        name="firstName"
                        type="text"
                        autoComplete="given-name"
                        required
                        className="form-control contact-v97__control"
                        placeholder="João"
                      />
                    </div>

                    <div className="col-12 col-sm-6 contact-v97__field">
                      <label htmlFor="contact-last-name">Apelido</label>
                      <input
                        id="contact-last-name"
                        name="lastName"
                        type="text"
                        autoComplete="family-name"
                        required
                        className="form-control contact-v97__control"
                        placeholder="Silva"
                      />
                    </div>

                    <div className="col-12 contact-v97__field">
                      <label htmlFor="contact-email">Email</label>
                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        className="form-control contact-v97__control"
                        placeholder="joao@empresa.pt"
                      />
                    </div>

                    <div className="col-12 contact-v97__field">
                      <label htmlFor="contact-organization">Organização</label>
                      <input
                        id="contact-organization"
                        name="organization"
                        type="text"
                        autoComplete="organization"
                        className="form-control contact-v97__control"
                        placeholder="Empresa, S.A."
                      />
                    </div>

                    <div className="col-12 contact-v97__field contact-v97__field--mono">
                      <label htmlFor="contact-service">Serviço de Interesse</label>
                      <select
                        id="contact-service"
                        name="service"
                        className="form-select contact-v97__control contact-v97__select"
                        defaultValue={serviceOptions[0]}
                      >
                        {serviceOptions.map((service) => <option key={service}>{service}</option>)}
                      </select>
                    </div>

                    <div className="col-12 contact-v97__field">
                      <label htmlFor="contact-message">Mensagem</label>
                      <textarea
                        id="contact-message"
                        name="message"
                        rows={4}
                        required
                        className="form-control contact-v97__control contact-v97__textarea"
                        placeholder="Descreva as suas necessidades de segurança..."
                      />
                    </div>
                  </div>

                  <button type="submit" className="contact-v97__submit" disabled={status === 'sending'}>
                    <Send aria-hidden="true" />
                    {status === 'sending' ? 'A enviar...' : 'Enviar Mensagem'}
                  </button>

                  <div className="contact-v97__feedback" aria-live="polite" aria-atomic="true">
                    {status === 'sent' && (
                      <p role="status">
                        <CircleCheckBig aria-hidden="true" />
                        Mensagem registada com sucesso.
                      </p>
                    )}
                    {status === 'error' && <p role="alert">{error || 'Não foi possível enviar a mensagem.'}</p>}
                  </div>
                </form>
              </div>

              <aside className="col-12 col-md-5 contact-v97__office" aria-labelledby="contact-office-title">
                <h2 id="contact-office-title">O nosso escritório</h2>

                <div className="contact-v97__channels">
                  {channels.map((channel) => {
                    const Icon = channel.icon;
                    return (
                      <article className="contact-v97__channel" key={'id' in channel ? channel.id : channel.title}>
                        <span className={`contact-v97__channel-icon contact-v97__channel-icon--${channel.tone}`} aria-hidden="true">
                          <Icon />
                        </span>
                        <div>
                          <h3>{channel.title}</h3>
                          <p>{channel.value}</p>
                        </div>
                      </article>
                    );
                  })}
                </div>

                <section className="contact-v97__schedule" aria-labelledby="contact-hours-title">
                  <header>
                    <Clock3 aria-hidden="true" />
                    <h3 id="contact-hours-title">{contentText(scheduleContent?.titulo, 'Horário de Atendimento')}</h3>
                  </header>
                  {scheduleRows.map((entry, index) => (
                    <div className={index === 1 ? 'contact-v97__schedule-soc' : undefined} key={`${entry.label}-${entry.time}`}>
                      <span>{entry.label}</span>
                      <strong>{entry.time}</strong>
                    </div>
                  ))}
                </section>

                <div className="contact-v97__certifications" aria-label="Certificações e conformidade">
                  {certifications.map((certification) => (
                    <span key={certification.id}>
                      <Award aria-hidden="true" />
                      {certification.label}
                    </span>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter setPage={setPage} />
    </>
  );
}
