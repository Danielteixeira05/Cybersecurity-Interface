import type { Page } from '../types';

interface PageProps {
  setPage: (p: Page) => void;
}

export function HomePage({ setPage }: PageProps) {
  const services = [
    { t: 'Gestão de Ativos', d: 'Inventário completo e classificação de ativos críticos da sua organização.', i: '📦' },
    { t: 'Monitorização de Incidentes', d: 'Deteção, resposta e resolução de incidentes de segurança em tempo real.', i: '🛡️' },
    { t: 'Conformidade NIS2', d: 'Implementação e monitorização contínua dos requisitos do Regulamento NIS2.', i: '✅' },
    { t: 'Avaliação de Riscos', d: 'Identificação proativa de vulnerabilidades e matriz de risco atualizada.', i: '⚠️' },
    { t: 'Pentesting & Ethical Hacking', d: 'Testes de penetração autorizados para validar os seus controlos de segurança.', i: '🔐' },
    { t: 'Documentação Segura', d: 'Arquivo encriptado de políticas, relatórios e evidências de auditoria.', i: '📄' },
  ];

  const stats = [
    { v: '500+', l: 'Clientes Protegidos' },
    { v: '10K+', l: 'Incidentes Resolvidos' },
    { v: '99.9%', l: 'SLA de Disponibilidade' },
    { v: '24/7', l: 'SOC Monitorização' },
  ];

  return (
    <div>
      <section className="hero-gradient relative overflow-hidden">
        <div className="hero-orb-1" />
        <div className="hero-orb-2" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-32">
          <div className="max-w-3xl">
            <span className="badge bg-blue-100 text-blue-700">
              🚀 Plataforma Enterprise de Cibersegurança
            </span>
            <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl">
              Segurança que
              <br />
              <span className="bg-gradient-to-r from-blue-600 via-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                protege o seu negócio
              </span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 sm:text-xl">
              A CiberBoxSecur é a plataforma all-in-one de gestão de cibersegurança para MSSPs e equipas internas.
              Gere clientes, ativos, incidentes e conformidade NIS2 numa única interface moderna.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <button
                onClick={() => setPage('login')}
                className="rounded-2xl bg-slate-900 px-7 py-3.5 text-sm font-semibold text-white shadow-xl shadow-slate-900/20 transition-base hover:bg-slate-800"
              >
                Entrar na Plataforma →
              </button>
              <button
                onClick={() => setPage('services')}
                className="rounded-2xl border border-slate-200 bg-white px-7 py-3.5 text-sm font-semibold text-slate-900 transition-base hover:border-slate-300 hover:bg-slate-50"
              >
                Ver Serviços
              </button>
            </div>
            <div className="mt-14 grid grid-cols-2 gap-6 sm:grid-cols-4">
              {stats.map((s) => (
                <div key={s.l}>
                  <div className="font-display text-3xl font-bold text-slate-900 sm:text-4xl">{s.v}</div>
                  <div className="mt-1 text-sm text-slate-500">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <span className="badge bg-violet-100 text-violet-700">Nossos Serviços</span>
          <h2 className="mt-4 font-display text-4xl font-bold text-slate-900 sm:text-5xl">
            Tudo o que precisa para estar seguro
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
            Uma stack completa de cibersegurança, desenhada para equipas de SOC, MSSPs e departamentos de IT.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((s) => (
            <div
              key={s.t}
              className="group rounded-2xl border border-slate-200 bg-white p-7 transition-base hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-500/5"
            >
              <div className="text-4xl">{s.i}</div>
              <h3 className="mt-5 font-display text-xl font-semibold text-slate-900">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{s.d}</p>
              <div className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-blue-600 opacity-0 transition-base group-hover:opacity-100">
                Saber mais →
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div className="mx-auto grid max-w-7xl gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="badge bg-emerald-100 text-emerald-700">Conformidade NIS2</span>
            <h2 className="mt-4 font-display text-4xl font-bold leading-tight text-slate-900 sm:text-5xl">
              Cumpre o Regulamento NIS2 sem dores de cabeça
            </h2>
            <p className="mt-5 text-lg text-slate-600">
              A CiberBoxSecur foi construída de raiz para dar resposta a todos os requisitos do Regulamento (UE) 2022/2555 (NIS2), incluindo:
            </p>
            <ul className="mt-7 space-y-4">
              {[
                'Gestão de riscos e análise de impacto',
                'Políticas de segurança documentadas',
                'Resposta a incidentes (Art. 14º)',
                'Notificação obrigatória à CNCS',
                'Testes e auditorias regulares',
                'Formação e sensibilização',
              ].map((p) => (
                <li key={p} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">✓</span>
                  <span className="text-slate-700">{p}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8">
              <button
                onClick={() => setPage('contact')}
                className="rounded-2xl bg-emerald-600 px-7 py-3.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 hover:bg-emerald-700"
              >
                Falar com um especialista NIS2
              </button>
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-emerald-100 via-blue-100 to-violet-100 blur-2xl" />
            <div className="relative rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <div className="font-display text-lg font-semibold text-slate-900">Dashboard NIS2</div>
                  <div className="text-xs text-slate-500">Estado de conformidade global</div>
                </div>
                <span className="badge bg-emerald-500/15 text-emerald-700">87% Conforme</span>
              </div>
              <div className="mt-6 space-y-4">
                {[
                  { d: 'Políticas Aprovadas', c: 12, m: 14, p: 86 },
                  { d: 'Controlos Técnicos', c: 28, m: 30, p: 93 },
                  { d: 'Formações Completadas', c: 45, m: 52, p: 87 },
                  { d: 'Incidentes Reportados', c: 3, m: 0, p: 100 },
                ].map((r) => (
                  <div key={r.d}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-slate-700">{r.d}</span>
                      <span className="font-mono text-slate-900">{r.c}/{r.m}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-blue-500 to-violet-500"
                        style={{ width: `${r.p}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6 lg:px-8">
        <h2 className="font-display text-4xl font-bold text-slate-900 sm:text-5xl">
          Pronto para começar?
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-slate-600">
          Entre na plataforma agora ou fale connosco para uma demonstração personalizada.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={() => setPage('login')}
            className="rounded-2xl bg-gradient-to-r from-blue-600 to-violet-600 px-8 py-4 text-sm font-semibold text-white shadow-xl shadow-blue-600/25 hover:from-blue-700 hover:to-violet-700"
          >
            Aceder ao Portal
          </button>
          <button
            onClick={() => setPage('contact')}
            className="rounded-2xl border border-slate-200 bg-white px-8 py-4 text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            Contactar Vendas
          </button>
        </div>
      </section>
    </div>
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
