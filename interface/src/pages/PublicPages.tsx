import { useState } from 'react';
import {
  BookOpen,
  ChevronRight,
  Eye,
  FileText,
  Globe,
  Mail,
  MapPin,
  Phone,
  Shield,
  Target,
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
  const services = [
    {
      t: 'Managed Detection & Response (MDR)',
      d: 'Monitorização 24/7 por SOC humano, com deteção avançada de ameaças, caça a intrusos e resposta imediata a incidentes.',
      f: ['SIEM de última geração', 'Threat Intelligence global', 'MTTR < 15 minutos', 'Relatórios semanais'],
    },
    {
      t: 'Penetration Testing (Pentest)',
      d: 'Testes de intrusão éticos realizados por especialistas OSCP para descobrir vulnerabilidades antes dos atacantes.',
      f: ['Web & Mobile Apps', 'Infraestrutura On-Prem e Cloud', 'Social Engineering', 'Relatório executivo + técnico'],
    },
    {
      t: 'Consultoria NIS2 e RGPD',
      d: 'Aconselhamento jurídico e técnico para implementação e manutenção da conformidade com regulamentos europeus.',
      f: ['Gap analysis inicial', 'Plano de implementação', 'Políticas e procedimentos', 'Auditorias de manutenção'],
    },
    {
      t: 'Vulnerability Assessment',
      d: 'Varredura contínua de vulnerabilidades nas suas aplicações, sistemas e superfície de ataque externa.',
      f: ['Scanner automatizado diário', 'Validação manual', 'Priorização CVSS', 'Remediação guiada'],
    },
    {
      t: 'Security Awareness Training',
      d: 'Programas de formação contínua em cibersegurança para colaboradores, com simulações de phishing.',
      f: ['Biblioteca de 50+ módulos', 'Simulações realistas', 'Dashboards de progresso', 'Certificados individuais'],
    },
    {
      t: 'Virtual CISO (vCISO)',
      d: 'Diretor de Segurança Informática virtual para organizações que não precisam de um recurso full-time interno.',
      f: ['Roadmap estratégico', 'Gestão de fornecedores', 'Comité de Segurança', 'Reporting à Administração'],
    },
  ];

  return (
    <div>
      <section className="hero-gradient relative overflow-hidden">
        <div className="hero-orb-1" />
        <div className="relative mx-auto max-w-5xl px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-24">
          <span className="badge bg-blue-100 text-blue-700">Nossos Serviços</span>
          <h1 className="mt-5 font-display text-5xl font-bold text-slate-900 sm:text-6xl">
            Stack completa de cibersegurança
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-xl text-slate-600">
            Desde a monitorização 24/7 até consultoria estratégica. Tudo num único parceiro de confiança.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {services.map((s, idx) => (
            <div
              key={s.t}
              className={`rounded-3xl border border-slate-200 bg-white p-8 transition-base hover:-translate-y-1 hover:shadow-xl ${
                idx % 3 === 0 ? 'sm:translate-y-4' : ''
              }`}
            >
              <div className="mb-5 flex items-center gap-2 text-blue-600">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                <span className="text-xs font-semibold uppercase tracking-widest">Serviço #{String(idx + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="font-display text-2xl font-bold text-slate-900">{s.t}</h3>
              <p className="mt-3 leading-relaxed text-slate-600">{s.d}</p>
              <ul className="mt-5 grid grid-cols-2 gap-2">
                {s.f.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <span className="text-emerald-500">✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => setPage('contact')}
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Pedir proposta →
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export function NewsPage({ setPage }: PageProps) {
  const posts = [
    { t: 'NIS2: Guia prático de implementação para Entidades Essenciais', d: 'Tudo o que precisa de saber para cumprir os prazos do regulamento europeu.', d2: '15 Jan 2026 • 8 min de leitura', c: 'NIS2' },
    { t: 'Ransomware 2026: novas táticas e como se defender', d: 'Análise das tendências de ataques Ransomware e medidas de mitigação eficazes.', d2: '02 Jan 2026 • 12 min de leitura', c: 'Ameaças' },
    { t: 'Phishing com IA: o que muda e como detetar', d: 'As deepfakes e LLMs estão a revolucionar os ataques de phishing. Saiba proteger-se.', d2: '20 Dez 2025 • 6 min de leitura', c: 'Formação' },
    { t: 'Estudo: PMEs portuguesas e a maturidade em cibersegurança', d: 'Resultados do estudo anual da CiberBoxSecur sobre segurança digital nas PMEs.', d2: '10 Dez 2025 • 10 min de leitura', c: 'Estudo' },
  ];
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="badge bg-blue-100 text-blue-700">Novidades & Artigos</span>
      <h1 className="mt-4 font-display text-5xl font-bold text-slate-900">Centro de Conhecimento</h1>
      <p className="mt-4 max-w-2xl text-xl text-slate-600">
        Conteúdos atualizados sobre cibersegurança, conformidade e melhores práticas.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {posts.map((p, i) => (
          <article
            key={p.t}
            className={`overflow-hidden rounded-3xl border border-slate-200 bg-white transition-base hover:-translate-y-1 hover:shadow-xl ${
              i === 0 ? 'md:col-span-2' : ''
            }`}
          >
            <div className={`${i === 0 ? 'h-64' : 'h-48'} bg-gradient-to-br from-blue-500 via-violet-500 to-fuchsia-500`} />
            <div className="p-7">
              <div className="flex items-center gap-3">
                <span className="badge bg-slate-100 text-slate-700">{p.c}</span>
                <span className="text-xs text-slate-500">{p.d2}</span>
              </div>
              <h3 className={`mt-4 font-display font-bold text-slate-900 ${i === 0 ? 'text-3xl' : 'text-xl'}`}>{p.t}</h3>
              <p className="mt-2 leading-relaxed text-slate-600">{p.d}</p>
              <button
                onClick={() => setPage('contact')}
                className="mt-5 inline-flex text-sm font-semibold text-blue-600 hover:underline"
              >
                Ler artigo completo →
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

export function ContactPage({ setPage }: PageProps) {
  const [sent, setSent] = useState(false);
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
      <span className="badge bg-blue-100 text-blue-700">Contacto</span>
      <h1 className="mt-4 font-display text-5xl font-bold text-slate-900">Fale connosco</h1>
      <p className="mt-4 max-w-2xl text-xl text-slate-600">
        Está à procura de mais informações? Tem um projeto específico? A nossa equipa responde em menos de 24h úteis.
      </p>

      <div className="mt-12 grid gap-10 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSent(true);
            }}
            className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Nome completo</label>
                <input
                  required
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="Nome Sobrenome"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Email profissional</label>
                <input
                  required
                  type="email"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                  placeholder="nome@empresa.pt"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Empresa</label>
                <input className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm" placeholder="Empresa, Lda." />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Serviço de interesse</label>
                <select className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm">
                  <option>MDR / SOC 24/7</option>
                  <option>Penetration Testing</option>
                  <option>Consultoria NIS2</option>
                  <option>Consultoria RGPD</option>
                  <option>Formação & Phishing</option>
                  <option>Outro / Preciso de ajuda</option>
                </select>
              </div>
            </div>
            <div className="mt-5">
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Mensagem</label>
              <textarea
                required
                rows={5}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm"
                placeholder="Conte-nos mais sobre o seu projeto ou desafio..."
              />
            </div>
            <button
              type="submit"
              className="mt-6 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/20 hover:from-blue-700 hover:to-violet-700 sm:w-auto sm:px-8"
            >
              {sent ? '✓ Mensagem enviada!' : 'Enviar mensagem'}
            </button>
          </form>
        </div>
        <div className="space-y-4 lg:col-span-2">
          {[
            { t: '📧 Email', l: 'geral@ciberboxsecur.pt', s: 'Resposta em até 24h úteis' },
            { t: '📞 Telefone', l: '+351 210 000 000', s: 'Seg-Sex • 9h-18h' },
            { t: '📍 Sede', l: 'Avenida da Liberdade, Lisboa', s: 'Portugal' },
            { t: '💬 Urgências 24/7', l: 'soc@ciberboxsecur.pt', s: 'Linha SOC permanente' },
          ].map((c) => (
            <div key={c.t} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="text-sm font-semibold text-slate-500">{c.t}</div>
              <div className="mt-2 font-display text-xl font-semibold text-slate-900">{c.l}</div>
              <div className="mt-1 text-sm text-slate-500">{c.s}</div>
            </div>
          ))}
          <div className="rounded-2xl bg-slate-900 p-6 text-white">
            <h4 className="font-display text-lg font-semibold">Já tem conta?</h4>
            <p className="mt-1 text-sm text-slate-300">Entre diretamente na plataforma.</p>
            <button
              onClick={() => setPage('login')}
              className="mt-4 w-full rounded-xl bg-white py-2.5 text-sm font-semibold text-slate-900 hover:bg-slate-100"
            >
              Iniciar Sessão →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
