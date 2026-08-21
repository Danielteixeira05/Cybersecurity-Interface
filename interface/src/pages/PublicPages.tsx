import { useState } from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  ChevronRight,
  Clock3,
  Database,
  Eye,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Shield,
  Target,
  UserRoundCheck,
} from 'lucide-react';
import type { Page } from '../types';

interface PageProps {
  setPage: (p: Page) => void;
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
    title: 'Managed Detection & Response (MDR)',
    description:
      'Monitorização 24/7 por SOC humano, com deteção avançada de ameaças, caça a intrusos e resposta imediata a incidentes.',
    features: ['SIEM de última geração', 'Threat Intelligence global', 'MTTR < 15 minutos', 'Relatórios semanais'],
    icon: Shield,
  },
  {
    title: 'Penetration Testing (Pentest)',
    description:
      'Testes de intrusão éticos realizados por especialistas OSCP para descobrir vulnerabilidades antes dos atacantes.',
    features: ['Web & Mobile Apps', 'Infraestrutura On-Prem e Cloud', 'Social Engineering', 'Relatório executivo + técnico'],
    icon: Target,
  },
  {
    title: 'Consultoria NIS2 e RGPD',
    description:
      'Aconselhamento jurídico e técnico para implementação e manutenção da conformidade com regulamentos europeus.',
    features: ['Gap analysis inicial', 'Plano de implementação', 'Políticas e procedimentos', 'Auditorias de manutenção'],
    icon: FileText,
  },
  {
    title: 'Vulnerability Assessment',
    description:
      'Varredura contínua de vulnerabilidades nas suas aplicações, sistemas e superfície de ataque externa.',
    features: ['Scanner automatizado diário', 'Validação manual', 'Priorização CVSS', 'Remediação guiada'],
    icon: Eye,
  },
  {
    title: 'Security Awareness Training',
    description:
      'Programas de formação contínua em cibersegurança para colaboradores, com simulações de phishing.',
    features: ['Biblioteca de 50+ módulos', 'Simulações realistas', 'Dashboards de progresso', 'Certificados individuais'],
    icon: BookOpen,
  },
  {
    title: 'Virtual CISO (vCISO)',
    description:
      'Diretor de Segurança Informática virtual para organizações que não precisam de um recurso full-time interno.',
    features: ['Roadmap estratégico', 'Gestão de fornecedores', 'Comité de Segurança', 'Reporting à Administração'],
    icon: Globe,
  },
] as const;

const SERVICE_PROOF_POINTS = [
  { title: 'Certificado CNCS', detail: 'Autoridade Nacional', icon: Award },
  { title: 'SLA 24/7', detail: 'Resposta garantida', icon: Clock3 },
  { title: 'Dados na UE', detail: 'RGPD compliant', icon: Database },
  { title: 'Gestor Dedicado', detail: 'Por cada cliente', icon: UserRoundCheck },
] as const;

const PUBLIC_NEWS_POSTS = [
  {
    title: 'NIS2: Guia prático de implementação para Entidades Essenciais',
    description: 'Tudo o que precisa de saber para cumprir os prazos do regulamento europeu.',
    meta: '15 Jan 2026 • 8 min de leitura',
    category: 'NIS2',
    icon: FileText,
    accent: 'violet',
  },
  {
    title: 'Ransomware 2026: novas táticas e como se defender',
    description: 'Análise das tendências de ataques Ransomware e medidas de mitigação eficazes.',
    meta: '02 Jan 2026 • 12 min de leitura',
    category: 'Ameaças',
    icon: Shield,
    accent: 'rose',
  },
  {
    title: 'Phishing com IA: o que muda e como detetar',
    description: 'As deepfakes e LLMs estão a revolucionar os ataques de phishing. Saiba proteger-se.',
    meta: '20 Dez 2025 • 6 min de leitura',
    category: 'Formação',
    icon: Eye,
    accent: 'blue',
  },
  {
    title: 'Estudo: PMEs portuguesas e a maturidade em cibersegurança',
    description: 'Resultados do estudo anual da CiberBoxSecur sobre segurança digital nas PMEs.',
    meta: '10 Dez 2025 • 10 min de leitura',
    category: 'Estudo',
    icon: BookOpen,
    accent: 'teal',
  },
] as const;

const PUBLIC_CONTACT_CHANNELS = [
  { title: 'Email', value: 'geral@ciberboxsecur.pt', detail: 'Resposta em até 24h úteis', icon: Mail },
  { title: 'Telefone', value: '+351 210 000 000', detail: 'Seg-Sex • 9h-18h', icon: Phone },
  { title: 'Sede', value: 'Avenida da Liberdade, Lisboa', detail: 'Portugal', icon: MapPin },
  { title: 'Urgências 24/7', value: 'soc@ciberboxsecur.pt', detail: 'Linha SOC permanente', icon: Shield },
] as const;

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
  return (
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
                  Proteção abrangente para cada ameaça.
                </h1>
                <p className="public-page-lead">
                  Do SOC 24/7 à conformidade NIS2, a nossa equipa certificada cobre todo o ciclo de vida da
                  cibersegurança empresarial.
                </p>
                <div className="public-page-hero__actions">
                  <button type="button" className="phase2-button phase2-button--primary" onClick={() => setPage('contact')}>
                    Pedir Proposta
                    <ArrowRight aria-hidden="true" />
                  </button>
                  <button type="button" className="phase2-button phase2-button--secondary" onClick={() => setPage('contact')}>
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
          <div className="row g-3 g-lg-0">
            {SERVICE_PROOF_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <div className="col-12 col-sm-6 col-lg-3" key={point.title}>
                  <article className="service-proof-card">
                    <span className="service-proof-card__icon" aria-hidden="true">
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

      <section className="services-page__catalog" aria-label="Catálogo de serviços" data-page-section="services-catalog">
        <div className="container-xl">
          <div className="row g-4 g-xl-5">
            {PUBLIC_SERVICES.map((service, index) => {
              const Icon = service.icon;
              return (
                <div className="col-12 col-lg-6" key={service.title}>
                  <article className="service-detail-card">
                    <div className="service-detail-card__topline">
                      <span className="service-detail-card__icon" aria-hidden="true">
                        <Icon />
                      </span>
                      <span className="service-detail-card__number">{String(index + 1).padStart(2, '0')}</span>
                    </div>
                    <h3>{service.title}</h3>
                    <p>{service.description}</p>
                    <ul className="row g-2">
                      {service.features.map((feature) => (
                        <li className="col-12 col-sm-6" key={feature}>
                          <span aria-hidden="true">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <button type="button" onClick={() => setPage('contact')}>
                      Pedir Proposta <ArrowRight aria-hidden="true" />
                    </button>
                  </article>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </main>
  );
}

export function NewsPage(_props: PageProps) {
  return (
    <main className="public-subpage news-page" data-public-page="news">
      <section className="public-page-hero phase2-public-hero news-page__hero" aria-labelledby="news-page-title">
        <div className="public-page-hero__orb public-page-hero__orb--violet" aria-hidden="true" />
        <div className="public-page-hero__orb public-page-hero__orb--blue" aria-hidden="true" />
        <div className="container-xl public-page-hero__container">
          <div className="row justify-content-center">
            <div className="col-12 col-lg-10 col-xl-9">
              <div className="public-page-hero__content">
                <span className="public-page-kicker">Centro de Conhecimento · Artigos &amp; Análises</span>
                <h1 id="news-page-title" className="public-page-title">Notícias de Cibersegurança</h1>
                <p className="public-page-lead">
                  Mantenha-se informado sobre as últimas tendências, ameaças e boas práticas em segurança digital e
                  conformidade regulamentar.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container-xl public-subpage__container">
        <section className="news-page__articles" aria-label="Artigos recentes" data-page-section="news-articles">
          <div className="row g-4">
            {PUBLIC_NEWS_POSTS.map((post, index) => {
              const Icon = post.icon;
              return (
                <div className={index === 0 ? 'col-12' : 'col-12 col-md-6 col-xl-4'} key={post.title}>
                  <article className={`public-news-card${index === 0 ? ' is-featured' : ''}`}>
                    <div className={`public-news-card__visual public-news-card__visual--${post.accent}`} aria-hidden="true">
                      <span className="public-news-card__visual-grid" />
                      <span className="public-news-card__visual-icon">
                        <Icon />
                      </span>
                    </div>
                    <div className="public-news-card__content">
                      <div className="public-news-card__meta">
                        <span className="public-news-card__category">{post.category}</span>
                        <span>{post.meta}</span>
                      </div>
                      <h3>{post.title}</h3>
                      <p>{post.description}</p>
                      <span
                        className="public-news-card__read-more"
                        title="O detalhe de notícia ainda não tem uma rota pública implementada"
                      >
                        Ler artigo completo <ArrowRight aria-hidden="true" />
                      </span>
                    </div>
                  </article>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </main>
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
