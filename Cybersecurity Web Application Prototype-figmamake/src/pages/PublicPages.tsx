import type { Page } from '../types';
import { Shield, Lock, CheckCircle, ArrowRight, ChevronRight, Phone, Mail, MapPin,
  Globe, Zap, Eye, FileText, BarChart3, Award, Target, Heart, Users, Clock,
  Star, Briefcase, ShieldCheck, BookOpen, Send, Calendar } from 'lucide-react';
import { Button, Input, Textarea, Card, Alert } from '../components/DesignSystem';
import { useState } from 'react';

// ── Auxiliares ────────────────────────────────────────────────────────────────
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <section className={`py-16 px-6 ${className}`}>{children}</section>;
}
function Container({ children }: { children: React.ReactNode }) {
  return <div className="max-w-6xl mx-auto">{children}</div>;
}
function SectionHeading({ label, title, subtitle }: { label?: string; title: string; subtitle?: string }) {
  return (
    <div className="text-center mb-12">
      {label && <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3 font-mono">{label}</p>}
      <h2 className="text-3xl font-bold text-slate-900 font-display mb-4">{title}</h2>
      {subtitle && <p className="text-slate-500 max-w-2xl mx-auto text-sm leading-relaxed">{subtitle}</p>}
    </div>
  );
}

// ── Hero partilhado (páginas internas) ────────────────────────────────────────
function PageHero({ badge, title, highlight, subtitle, actions }: {
  badge: string;
  title: string;
  highlight?: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="hero-gradient flex items-center relative overflow-hidden" style={{ minHeight: '400px' }}>
      <div className="hero-orb-1" />
      <div className="hero-orb-2" />
      <div className="absolute inset-0 opacity-[0.04]"
        style={{ backgroundImage: 'linear-gradient(#6d28d9 1px, transparent 1px), linear-gradient(90deg, #6d28d9 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
      <Container>
        <div className="flex flex-col items-center text-center py-16 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-violet-100 border border-violet-200 rounded-full px-4 py-1.5 text-xs text-violet-700 font-mono mb-7">
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
            {badge}
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 font-display leading-tight mb-5">
            {title}{highlight && (
              <> <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">{highlight}</span></>
            )}
          </h1>
          <p className="text-slate-500 text-base leading-relaxed max-w-xl mb-7">{subtitle}</p>
          {actions}
        </div>
      </Container>
    </div>
  );
}

// ── CTA partilhado ─────────────────────────────────────────────────────────────
function CtaSection({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <Section className="bg-white">
      <Container>
        <div className="rounded-2xl p-12 text-center" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}>
          <p className="text-xs font-semibold text-violet-200 uppercase tracking-widest mb-3 font-mono">Comece Hoje</p>
          <h2 className="text-3xl font-bold text-white font-display mb-4">Pronto para Proteger o<br />Seu Negócio?</h2>
          <p className="text-violet-100 mb-8 max-w-xl mx-auto text-sm">Agende uma demonstração gratuita e veja como a CiberBoxSecur pode proteger a sua empresa.</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => setPage('contact')} className="px-8 py-3 bg-white hover:bg-violet-50 text-violet-700 font-semibold rounded-xl transition-base shadow-sm">
              Pedir Demonstração →
            </button>
            <button onClick={() => setPage('login')} className="flex items-center gap-2 px-8 py-3 border border-white/30 hover:border-white text-white rounded-xl transition-base">
              <Lock size={14} /> Dashboard
            </button>
          </div>
        </div>
      </Container>
    </Section>
  );
}

// ── Footer partilhado ──────────────────────────────────────────────────────────
function PageFooter({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <footer style={{ background: 'linear-gradient(180deg, #0f0c1d 0%, #1a1033 100%)' }}>
      <div className="max-w-6xl mx-auto px-6 pt-14 pb-8">
        <div className="grid md:grid-cols-3 gap-10 pb-10 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <img src="/src/imports/CiberBoxSecur-Minimal-NegativeVersion_c_pia.png" alt="CiberBoxSecur" className="w-8 h-8 object-contain" />
              <span className="font-bold text-white font-display tracking-tight">CiberBox<span className="text-violet-400">Secur</span></span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed mb-6 max-w-xs">
              Protegemos organizações portuguesas contra ciberameaças com serviços de nível empresarial e conformidade NIS2.
            </p>
            <div className="flex gap-3">
              {[
                { label: 'LinkedIn', path: 'M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z M4 6a2 2 0 1 0 0-4 2 2 0 0 0 0 4z' },
                { label: 'Twitter', path: 'M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z' },
                { label: 'Facebook', path: 'M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z' },
              ].map((s) => (
                <button key={s.label} aria-label={s.label}
                  className="w-9 h-9 rounded-lg bg-white/10 hover:bg-violet-600 flex items-center justify-center transition-colors duration-200">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                    <path d={s.path} />
                  </svg>
                </button>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5 font-mono">Links Rápidos</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'Início', page: 'home' as Page },
                { label: 'Sobre Nós', page: 'about' as Page },
                { label: 'Serviços', page: 'services' as Page },
                { label: 'Contacto', page: 'contact' as Page },
                { label: 'Dashboard', page: 'login' as Page },
              ].map((link) => (
                <li key={link.label}>
                  <button onClick={() => setPage(link.page)} className="text-sm text-slate-300 hover:text-violet-400 transition-colors flex items-center gap-1.5">
                    <ChevronRight size={12} className="text-violet-500" />{link.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5 font-mono">Contacto</h4>
            <ul className="space-y-3">
              {[
                { icon: Mail, text: 'info@ciberboxsecur.pt' },
                { icon: Phone, text: '+351 21 000 0000' },
                { icon: MapPin, text: 'Av. da Liberdade 110, Lisboa' },
                { icon: Globe, text: 'www.ciberboxsecur.pt' },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                  <div className="w-7 h-7 rounded-md bg-white/10 flex items-center justify-center shrink-0">
                    <Icon size={13} className="text-violet-400" />
                  </div>
                  {text}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6">
          <p className="text-xs text-slate-500">© 2025 CiberBoxSecur Lda. Todos os direitos reservados. Lisboa, Portugal.</p>
          <div className="flex gap-4 text-xs text-slate-500">
            {['Política de Privacidade', 'Termos de Serviço', 'RGPD'].map((l) => (
              <button key={l} className="hover:text-violet-400 transition-colors">{l}</button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

// ── PÁGINA INICIAL ────────────────────────────────────────────────────────────
export function HomePage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="pt-16">
      {/* Hero minimalista */}
      <div className="hero-gradient flex items-center relative overflow-hidden" style={{ minHeight: 'calc(100dvh - 4rem)' }}>
        <div className="hero-orb-1" />
        <div className="hero-orb-2" />
        {/* grid subtil */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(#6d28d9 1px, transparent 1px), linear-gradient(90deg, #6d28d9 1px, transparent 1px)', backgroundSize: '56px 56px' }} />
        <Container>
          <div className="flex flex-col items-center text-center py-16 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-violet-100 border border-violet-200 rounded-full px-4 py-1.5 text-xs text-violet-700 font-mono mb-4">
              <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
              Plataforma Certificada NIS2 · ISO/IEC 27001
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 font-display leading-tight mb-3">
              Segurança Digital para um<br />
              <span className="bg-gradient-to-r from-violet-600 to-blue-600 bg-clip-text text-transparent">Mundo Conectado</span>
            </h1>
            <p className="text-slate-500 text-base leading-relaxed mb-6 max-w-lg">
              Proteja a sua empresa contra ameaças digitais e garanta conformidade com as diretivas europeias de cibersegurança.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <button onClick={() => setPage('services')} className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-base shadow-md shadow-violet-200 text-sm">
                Explorar Serviços <ArrowRight size={15} />
              </button>
              <button onClick={() => setPage('contact')} className="flex items-center gap-2 px-6 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm transition-base text-sm">
                Agendar Serviços
              </button>
            </div>
          </div>
        </Container>
      </div>

      {/* Funcionalidades */}
      <Section className="bg-white">
        <Container>
          <SectionHeading label="O Que Fazemos" title="Serviços de Cibersegurança Completos" subtitle="Proteção de ponta a ponta para a sua infraestrutura digital, desde a deteção de ameaças à conformidade regulatória." />
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Target, title: 'Testes de Penetração', desc: 'Avaliações de vulnerabilidades e testes de intrusão autorizados por hackers éticos certificados.', gradient: 'from-blue-500 to-cyan-400' },
              { icon: Shield, title: 'Gestão de Incidentes NIS2', desc: 'Resposta rápida a incidentes com notificação às autoridades dentro dos prazos NIS2 (24h/72h).', gradient: 'from-pink-500 to-rose-400' },
              { icon: FileText, title: 'Conformidade NIS2', desc: 'Apoio completo em auditoria e gestão de conformidade para os requisitos da Diretiva NIS2 da UE.', gradient: 'from-violet-600 to-purple-500' },
              { icon: Eye, title: 'SIEM & Monitorização Contínua', desc: 'SOC 24/7 com deteção de ameaças em tempo real em todos os seus ativos digitais e perímetro de rede.', gradient: 'from-teal-500 to-cyan-400' },
              { icon: BookOpen, title: 'Formação e Consciencialização', desc: 'Programas de formação personalizados para aumentar a maturidade de segurança das suas equipas.', gradient: 'from-blue-600 to-blue-400' },
              { icon: Globe, title: 'Segurança Cloud & DevSecOps', desc: 'Proteção de ambientes cloud e integração de segurança no ciclo de desenvolvimento de software.', gradient: 'from-violet-500 to-purple-600' },
            ].map((f) => (
              <Card key={f.title} className="hover:shadow-md transition-base">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${f.gradient} mb-4 shadow-md`}>
                  <f.icon size={24} className="text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm mb-2 font-display">{f.title}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{f.desc}</p>
              </Card>
            ))}
          </div>
          <div className="flex justify-center mt-10">
            <button
              onClick={() => setPage('services')}
              className="px-8 py-2.5 rounded-full border-2 border-violet-500 text-violet-600 bg-white hover:bg-violet-50 font-semibold text-sm transition-colors duration-200"
            >
              + Detalhes
            </button>
          </div>
        </Container>
      </Section>

      {/* CTA */}
      <Section className="bg-white">
        <Container>
          <div className="rounded-2xl p-12 text-center" style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)' }}>
            <p className="text-xs font-semibold text-violet-200 uppercase tracking-widest mb-3 font-mono">Comece Hoje</p>
            <h2 className="text-3xl font-bold text-white font-display mb-4">Pronto para Proteger o<br />Seu Negócio?</h2>
            <p className="text-violet-100 mb-8 max-w-xl mx-auto text-sm">Agende uma demonstração gratuita e veja como a nossa tecnologia pode proteger a sua empresa contra as ameaças digitais.</p>
            <button onClick={() => setPage('contact')} className="px-8 py-3 bg-white hover:bg-violet-50 text-violet-700 font-semibold rounded-xl transition-base shadow-sm">
              Agendar Serviços
            </button>
          </div>
        </Container>
      </Section>

      <PageFooter setPage={setPage} />
    </div>
  );
}

// ── SOBRE NÓS ─────────────────────────────────────────────────────────────────
export function AboutPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="pt-16">
      <PageHero
        badge="Sobre Nós · Desde 2012"
        title="O parceiro de cibersegurança"
        highlight="de confiança em Portugal."
        subtitle="Fundados por veteranos do CNCS e do setor bancário, protegemos organizações em Portugal e na UE contra um panorama de ameaças cada vez mais complexo."
        actions={
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => setPage('contact')} className="flex items-center gap-2 px-7 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-base shadow-md shadow-violet-200">
              Falar com a Equipa <ArrowRight size={16} />
            </button>
            <button onClick={() => setPage('services')} className="flex items-center gap-2 px-7 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm transition-base">
              Ver Serviços
            </button>
          </div>
        }
      />

      {/* Estatísticas */}
      <Section className="bg-white py-10">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { v: '12+', l: 'Anos de Experiência', icon: Clock, color: 'text-violet-600 bg-violet-50' },
              { v: '150+', l: 'Clientes Protegidos', icon: Users, color: 'text-blue-600 bg-blue-50' },
              { v: '2.400+', l: 'Incidentes Resolvidos', icon: ShieldCheck, color: 'text-green-600 bg-green-50' },
              { v: '98%', l: 'Taxa de Retenção', icon: Star, color: 'text-amber-600 bg-amber-50' },
            ].map((s) => (
              <div key={s.l} className="flex flex-col items-center text-center p-6 rounded-xl border border-slate-100 hover:shadow-md transition-base">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.color} mb-3`}>
                  <s.icon size={18} />
                </div>
                <p className="text-3xl font-bold text-slate-900 font-display mb-1">{s.v}</p>
                <p className="text-xs text-slate-500">{s.l}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* História e missão */}
      <Section className="bg-slate-50">
        <Container>
          <div className="grid md:grid-cols-2 gap-14 items-center">
            <div>
              <p className="text-xs font-semibold text-violet-600 uppercase tracking-widest mb-3 font-mono">A Nossa História</p>
              <h2 className="text-3xl font-bold text-slate-900 font-display mb-6">Construídos para um mundo digitalmente ameaçado</h2>
              <p className="text-slate-500 text-sm leading-relaxed mb-5">
                Em 2012, um grupo de especialistas do CNCS e do setor bancário uniu-se com um objetivo claro: trazer proteção de nível militar às empresas portuguesas. Hoje, somos a referência nacional em cibersegurança gerida.
              </p>
              <div className="space-y-3">
                {[
                  'Equipa de operações de segurança certificada pelo CNCS',
                  'Processos certificados ISO/IEC 27001:2022',
                  'Especialistas certificados na Diretiva NIS2',
                  'Gestor dedicado para cada cliente',
                  'Suporte em português, dados alojados na UE',
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                      <CheckCircle size={12} className="text-green-600" />
                    </div>
                    <p className="text-sm text-slate-700">{item}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: Target, label: 'Missão', color: 'text-violet-600 bg-violet-50', text: 'Proteger as organizações portuguesas com serviços fiáveis e alinhados com os mais elevados padrões internacionais.' },
                { icon: Eye, label: 'Visão', color: 'text-blue-600 bg-blue-50', text: 'Ser o parceiro de cibersegurança mais confiável em Portugal, reconhecido pela excelência.' },
                { icon: Heart, label: 'Propósito', color: 'text-red-600 bg-red-50', text: 'Democratizar a cibersegurança empresarial para todas as organizações, independentemente da dimensão.' },
                { icon: Award, label: 'Valores', color: 'text-amber-600 bg-amber-50', text: 'Integridade, excelência e parceria de longo prazo em cada projeto que abraçamos.' },
              ].map((item) => (
                <Card key={item.label} className="hover:shadow-md transition-base">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color} mb-3`}>
                    <item.icon size={15} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 mb-1">{item.label}</p>
                  <p className="text-xs text-slate-500 leading-relaxed">{item.text}</p>
                </Card>
              ))}
            </div>
          </div>
        </Container>
      </Section>

      {/* Equipa */}
      <Section className="bg-white">
        <Container>
          <SectionHeading label="Liderança" title="A Nossa Equipa de Gestão" subtitle="Especialistas certificados com décadas de experiência em cibersegurança e conformidade regulatória." />
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { name: 'Dr. Paulo Ferreira', role: 'CEO e Co-fundador', bg: 'from-violet-600 to-violet-800', init: 'P', cert: 'CISSP · CISM', desc: 'Ex-Diretor do CNCS, mais de 20 anos em estratégia de cibersegurança e gestão de risco.' },
              { name: 'Eng. Sofia Leal', role: 'Diretora de Tecnologia', bg: 'from-blue-600 to-blue-800', init: 'S', cert: 'CISSP · CEH', desc: 'Mestre em Ciências da Computação, especialista em segurança ofensiva e arquitetura de SOC.' },
              { name: 'Dra. Mariana Costa', role: 'Responsável de Conformidade', bg: 'from-green-600 to-green-800', init: 'M', cert: 'CISA · DPO', desc: 'Especialista NIS2 e RGPD, ex-consultora regulatória da UE, auditora ISO 27001.' },
            ].map((p) => (
              <Card key={p.name} className="hover:shadow-md transition-base group">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${p.bg} flex items-center justify-center text-2xl font-bold text-white mb-4 font-display shadow-md`}>
                  {p.init}
                </div>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm font-display">{p.name}</p>
                    <p className="text-xs text-violet-600 font-medium">{p.role}</p>
                  </div>
                </div>
                <p className="text-xs font-mono text-slate-400 mb-2">{p.cert}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{p.desc}</p>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Certificações */}
      <Section className="bg-slate-50">
        <Container>
          <SectionHeading label="Reconhecimento" title="Certificados e Acreditados" subtitle="As nossas certificações garantem que trabalhamos com os mais elevados padrões da indústria." />
          <div className="flex flex-wrap justify-center gap-4">
            {[
              { name: 'ISO/IEC 27001', color: 'border-blue-200 bg-blue-50 text-blue-700' },
              { name: 'ISO/IEC 27005', color: 'border-purple-200 bg-purple-50 text-purple-700' },
              { name: 'Certificado CNCS', color: 'border-green-200 bg-green-50 text-green-700' },
              { name: 'Conforme RGPD', color: 'border-amber-200 bg-amber-50 text-amber-700' },
              { name: 'Especialista NIS2', color: 'border-violet-200 bg-violet-50 text-violet-700' },
              { name: 'Membro CREST', color: 'border-red-200 bg-red-50 text-red-700' },
            ].map((cert) => (
              <div key={cert.name} className={`flex items-center gap-2 border rounded-xl px-5 py-3 shadow-sm hover:shadow-md transition-base ${cert.color}`}>
                <Award size={15} />
                <span className="text-sm font-semibold">{cert.name}</span>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <CtaSection setPage={setPage} />
      <PageFooter setPage={setPage} />
    </div>
  );
}

// ── MISSÃO E VALORES ──────────────────────────────────────────────────────────
export function MissionPage({ setPage }: { setPage: (p: Page) => void }) {
  return (
    <div className="pt-16">
      <PageHero
        badge="Missão, Visão e Valores"
        title="Os princípios que"
        highlight="nos guiam."
        subtitle="Acreditamos que a cibersegurança é um direito de todas as organizações. Os nossos valores definem cada decisão que tomamos."
      />
      <Section className="bg-white">
        <Container>
          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              { icon: Target, label: 'Missão', color: 'text-violet-600 bg-violet-50', text: 'Proteger as organizações portuguesas contra ciberameaças, prestando serviços especializados, fiáveis e acessíveis, alinhados com os mais elevados padrões internacionais.' },
              { icon: Eye, label: 'Visão', color: 'text-blue-600 bg-blue-50', text: 'Ser o parceiro de cibersegurança mais confiável em Portugal, reconhecido pela excelência na proteção de infraestruturas críticas.' },
              { icon: Heart, label: 'Propósito', color: 'text-red-600 bg-red-50', text: 'Democratizar a cibersegurança empresarial para as empresas portuguesas, independentemente da sua dimensão.' },
            ].map((item) => (
              <Card key={item.label} className="text-center hover:shadow-md transition-base">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${item.color} mx-auto mb-4`}>
                  <item.icon size={20} />
                </div>
                <h3 className="font-bold text-slate-800 font-display mb-3">{item.label}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{item.text}</p>
              </Card>
            ))}
          </div>
          <SectionHeading label="Valores Fundamentais" title="Os princípios que nos guiam" />
          <div className="grid md:grid-cols-2 gap-4">
            {[
              { v: 'Integridade', icon: ShieldCheck, d: 'Agimos com transparência e honestidade em cada projeto, sem nunca comprometer a ética.' },
              { v: 'Excelência', icon: Star, d: 'Melhoramos continuamente as nossas competências e metodologias para acompanhar a evolução das ameaças.' },
              { v: 'Fiabilidade', icon: CheckCircle, d: 'Os nossos clientes contam connosco nos momentos críticos, com SLAs que cumprimos efetivamente.' },
              { v: 'Inovação', icon: Zap, d: 'Investimos em I&D para trazer ferramentas e técnicas de vanguarda aos nossos clientes.' },
              { v: 'Parceria', icon: Users, d: 'Tratamos cada relação com clientes como uma parceria de longo prazo assente na confiança mútua.' },
              { v: 'Responsabilidade', icon: Briefcase, d: 'Levamos a sério o nosso papel na proteção de infraestruturas críticas e agimos em conformidade.' },
            ].map((item) => (
              <div key={item.v} className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl hover:shadow-sm hover:border-violet-200 transition-base">
                <div className="w-8 h-8 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 mt-0.5">
                  <item.icon size={14} className="text-violet-600" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800 mb-1">{item.v}</p>
                  <p className="text-xs text-slate-500">{item.d}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>
      <CtaSection setPage={setPage} />
      <PageFooter setPage={setPage} />
    </div>
  );
}

// ── SERVIÇOS ──────────────────────────────────────────────────────────────────
export function ServicesPage({ setPage }: { setPage: (p: Page) => void }) {
  const services = [
    { icon: Target, title: 'Testes de Penetração (Pentesting)', price: 'A partir de 2.800€', tag: 'NIS2', features: ['Externo / Interno / Web', 'Aplicações e APIs', 'Engenharia social', 'Relatório detalhado com remediação'], gradient: 'from-blue-500 to-cyan-400', border: 'border-slate-200 hover:border-blue-200', tag2: 'bg-blue-100 text-blue-700' },
    { icon: Shield, title: 'Gestão de Incidentes NIS2', price: 'Retainer 950€/mês', tag: 'NIS2', features: ['Resposta de emergência 24/7', 'Notificação às autoridades 24h/72h', 'Análise forense digital', 'Relatório pós-incidente'], gradient: 'from-pink-500 to-rose-400', border: 'border-slate-200 hover:border-pink-200', tag2: 'bg-pink-100 text-pink-700' },
    { icon: FileText, title: 'Auditoria de Conformidade NIS2', price: 'A partir de 3.500€', tag: 'NIS2', features: ['Análise de lacunas', 'Desenvolvimento de políticas', 'Preparação de auditoria', 'Monitorização contínua'], gradient: 'from-violet-600 to-purple-500', border: 'border-slate-200 hover:border-violet-200', tag2: 'bg-violet-100 text-violet-700' },
    { icon: Eye, title: 'SIEM & Monitorização Contínua', price: 'A partir de 1.200€/mês', tag: 'NIS2', features: ['Monitorização 24/7', 'Integração SIEM', 'Triagem de alertas em tempo real', 'Relatórios mensais detalhados'], gradient: 'from-teal-500 to-cyan-400', border: 'border-slate-200 hover:border-teal-200', tag2: 'bg-teal-100 text-teal-700' },
    { icon: BookOpen, title: 'Formação e Consciencialização', price: 'A partir de 400€/mês', tag: '', features: ['Simulações de phishing', 'Cursos e-learning', 'Dashboards de KPI', 'Conteúdo personalizado'], gradient: 'from-blue-600 to-blue-400', border: 'border-slate-200 hover:border-blue-200', tag2: 'bg-blue-100 text-blue-700' },
    { icon: Globe, title: 'Segurança Cloud & DevSecOps', price: 'A partir de 1.800€', tag: '', features: ['Inventário de ativos cloud', 'Integração CI/CD', 'Gestão de vulnerabilidades', 'Plano de remediação priorizado'], gradient: 'from-violet-500 to-purple-600', border: 'border-slate-200 hover:border-violet-200', tag2: 'bg-violet-100 text-violet-700' },
  ];

  return (
    <div className="pt-16">
      <PageHero
        badge="Os Nossos Serviços · Equipa Certificada"
        title="Proteção abrangente para"
        highlight="cada ameaça."
        subtitle="Do SOC 24/7 à conformidade NIS2, a nossa equipa certificada cobre todo o ciclo de vida da cibersegurança empresarial."
        actions={
          <div className="flex flex-wrap justify-center gap-3">
            <button onClick={() => setPage('contact')} className="flex items-center gap-2 px-7 py-3 bg-violet-600 hover:bg-violet-700 text-white font-semibold rounded-xl transition-base shadow-md shadow-violet-200">
              Pedir Proposta <ArrowRight size={16} />
            </button>
            <button onClick={() => setPage('contact')} className="flex items-center gap-2 px-7 py-3 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-xl border border-slate-200 shadow-sm transition-base">
              Falar com um Especialista
            </button>
          </div>
        }
      />

      {/* Destaque de proposta de valor */}
      <Section className="bg-slate-50 py-10">
        <Container>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {[
              { icon: Shield, label: 'Certificado CNCS', sub: 'Autoridade Nacional', color: 'text-violet-600 bg-violet-50' },
              { icon: Clock, label: 'SLA 24/7', sub: 'Resposta garantida', color: 'text-blue-600 bg-blue-50' },
              { icon: Globe, label: 'Dados na UE', sub: 'RGPD compliant', color: 'text-green-600 bg-green-50' },
              { icon: Users, label: 'Gestor Dedicado', sub: 'Por cada cliente', color: 'text-amber-600 bg-amber-50' },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${s.color}`}>
                  <s.icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{s.label}</p>
                  <p className="text-xs text-slate-400">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Cards de serviço */}
      <Section className="bg-white">
        <Container>
          <SectionHeading label="Catálogo de Serviços" title="O que oferecemos" subtitle="Todos os serviços são prestados pela nossa equipa certificada com SLAs documentados." />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((s) => (
              <Card key={s.title} className={`hover:shadow-lg transition-all duration-200 border ${s.border} relative`}>
                {s.tag && (
                  <span className={`absolute top-4 right-4 text-xs px-2.5 py-0.5 rounded-full font-semibold font-mono ${s.tag2}`}>{s.tag}</span>
                )}
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center bg-gradient-to-br ${s.gradient} mb-4 shadow-md`}>
                  <s.icon size={24} className="text-white" />
                </div>
                <h3 className="font-semibold text-slate-800 text-sm mb-1 font-display leading-snug">{s.title}</h3>
                <p className="text-xs text-violet-600 mb-4 font-mono font-semibold">{s.price}</p>
                <ul className="space-y-2 mb-4">
                  {s.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-slate-600">
                      <div className="w-4 h-4 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                        <CheckCircle size={10} className="text-green-500" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>
                <button onClick={() => setPage('contact')} className="flex items-center gap-1.5 text-xs text-violet-600 hover:text-violet-700 font-medium transition-colors mt-auto">
                  Saber mais <ChevronRight size={12} />
                </button>
              </Card>
            ))}
          </div>
        </Container>
      </Section>

      {/* Processo */}
      <Section className="bg-slate-50">
        <Container>
          <SectionHeading label="Como Trabalhamos" title="O nosso processo" subtitle="Metodologia estruturada para garantir resultados consistentes em cada projeto." />
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: Target, label: 'Avaliação', desc: 'Diagnóstico inicial do estado de segurança e identificação de lacunas.' },
              { step: '02', icon: FileText, label: 'Planeamento', desc: 'Desenvolvimento de plano de ação priorizado por risco e impacto.' },
              { step: '03', icon: ShieldCheck, label: 'Implementação', desc: 'Execução por especialistas certificados com relatórios contínuos.' },
              { step: '04', icon: BarChart3, label: 'Monitorização', desc: 'Acompanhamento contínuo, relatórios periódicos e melhoria contínua.' },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center text-center gap-3">
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-violet-600 flex items-center justify-center shadow-md shadow-violet-200">
                    <s.icon size={22} className="text-white" />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-white border-2 border-violet-600 text-violet-700 text-xs font-bold font-mono flex items-center justify-center">{s.step}</span>
                </div>
                <p className="text-sm font-semibold text-slate-800 font-display">{s.label}</p>
                <p className="text-xs text-slate-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </Container>
      </Section>

      <CtaSection setPage={setPage} />
      <PageFooter setPage={setPage} />
    </div>
  );
}

// ── NOTÍCIAS ──────────────────────────────────────────────────────────────────
const newsArticles = [
  {
    title: 'NIS2: O que muda para as empresas portuguesas em 2025',
    desc: 'A Diretiva NIS2 trouxe novas obrigações para entidades essenciais e importantes. Saiba o que precisa de fazer para estar em conformidade.',
    date: '10 de março de 2025',
    dateShort: '10/03/2025',
    category: 'NIS2 & Compliance',
    categoryColor: 'bg-violet-100 text-violet-700',
    read: '5 min',
    img: 'https://images.unsplash.com/photo-1614064641938-3bbee52942c7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=900&q=80',
  },
  {
    title: 'Pentesting em 2025: Metodologias e Boas Práticas',
    desc: 'Como as técnicas de testes de penetração evoluíram e o que esperar de um pentest moderno na sua organização.',
    date: '28 de fevereiro de 2025',
    dateShort: '28/02/2025',
    category: 'Testes de Segurança',
    categoryColor: 'bg-amber-100 text-amber-700',
    read: '7 min',
    img: 'https://images.unsplash.com/photo-1577375729152-4c8b5fcda381?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80',
  },
  {
    title: 'Ransomware: Tendências e como proteger a sua organização',
    desc: 'Os ataques de ransomware continuam a crescer. Conheça as tendências de 2025 e as melhores práticas de proteção.',
    date: '15 de fevereiro de 2025',
    dateShort: '15/02/2025',
    category: 'Ameaças & Incidentes',
    categoryColor: 'bg-red-100 text-red-700',
    read: '6 min',
    img: 'https://images.unsplash.com/photo-1614064548237-096f735f344f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80',
  },
  {
    title: 'CiberBoxSecur Obtém Recertificação ISO/IEC 27001:2022',
    desc: 'Reforçamos o nosso compromisso com a excelência e a segurança ao obter a recertificação ISO 27001 na sua versão mais recente.',
    date: '10 de janeiro de 2025',
    dateShort: '10/01/2025',
    category: 'Empresa',
    categoryColor: 'bg-blue-100 text-blue-700',
    read: '2 min',
    img: 'https://images.unsplash.com/photo-1633265486064-086b219458ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80',
  },
  {
    title: 'Engenharia Social: Como Treinar as suas Equipas',
    desc: 'Simulações de phishing e formação contínua são a melhor defesa contra ataques de engenharia social. Veja como implementar.',
    date: '20 de dezembro de 2024',
    dateShort: '20/12/2024',
    category: 'Formação',
    categoryColor: 'bg-green-100 text-green-700',
    read: '4 min',
    img: 'https://images.unsplash.com/photo-1525373698358-041e3a460346?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=600&q=80',
  },
];

export function NewsPage({ setPage }: { setPage: (p: Page) => void }) {
  const [featured, ...rest] = newsArticles;

  return (
    <div className="pt-16 bg-white">
      {/* Hero banner */}
      <div
        className="flex items-center justify-center text-center relative overflow-hidden"
        style={{
          minHeight: '400px',
          background: 'linear-gradient(135deg, #f0ebff 0%, #e8f4fd 50%, #ede9fe 100%)',
        }}
      >
        <div className="py-16 px-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/70 border border-violet-200 rounded-full px-4 py-1.5 text-xs text-violet-700 font-mono mb-7">
            <span className="w-1.5 h-1.5 bg-violet-500 rounded-full animate-pulse" />
            Centro de Conhecimento · Artigos & Análises
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-slate-900 font-display leading-tight mb-5">
            Notícias de{' '}
            <span className="bg-gradient-to-r from-violet-600 to-blue-500 bg-clip-text text-transparent">
              Cibersegurança
            </span>
          </h1>
          <p className="text-slate-500 text-base leading-relaxed max-w-xl mx-auto">
            Mantenha-se informado sobre as últimas tendências, ameaças e boas práticas em segurança digital e conformidade regulamentar.
          </p>
        </div>
      </div>

      {/* Banner artigo principal */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div
          className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm flex flex-col md:flex-row cursor-pointer group hover:shadow-md transition-all duration-200"
          onClick={() => {}}
        >
          {/* Imagem */}
          <div className="md:w-[55%] h-72 md:h-auto relative overflow-hidden shrink-0">
            <img
              src={featured.img}
              alt={featured.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
          {/* Info */}
          <div className="flex flex-col justify-center px-10 py-10 bg-white flex-1">
            <span className={`inline-flex self-start text-xs font-semibold px-3 py-1 rounded-full mb-5 ${featured.categoryColor}`}>
              {featured.category}
            </span>
            <h2 className="text-2xl lg:text-3xl font-bold text-slate-900 font-display leading-snug mb-4 group-hover:text-violet-700 transition-colors">
              {featured.title}
            </h2>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">{featured.desc}</p>
            <div className="flex items-center gap-2 text-slate-400 text-sm mb-6">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {featured.date}
            </div>
            <button className="self-start flex items-center gap-1.5 text-violet-600 hover:text-violet-800 font-semibold text-sm transition-colors">
              Ler artigo <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Grelha de artigos */}
      <div className="max-w-6xl mx-auto px-6 pb-16">
        <div className="grid md:grid-cols-3 gap-7">
          {rest.map((a) => (
            <div
              key={a.title}
              className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer group bg-white"
              onClick={() => {}}
            >
              {/* Imagem com data overlay */}
              <div className="relative h-52 overflow-hidden">
                <img
                  src={a.img}
                  alt={a.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute bottom-3 left-3">
                  <span className="bg-violet-600 text-white text-xs font-bold font-mono px-3 py-1 rounded-full shadow-md">
                    {a.dateShort}
                  </span>
                </div>
              </div>
              {/* Conteúdo */}
              <div className="p-5">
                <span className={`inline-flex text-xs font-semibold px-2.5 py-0.5 rounded-full mb-3 ${a.categoryColor}`}>
                  {a.category}
                </span>
                <h3 className="text-base font-bold text-slate-900 font-display leading-snug group-hover:text-violet-700 transition-colors">
                  {a.title}
                </h3>
              </div>
            </div>
          ))}
        </div>
      </div>

      <PageFooter setPage={setPage} />
    </div>
  );
}

// ── CONTACTO ──────────────────────────────────────────────────────────────────
export function ContactPage({ setPage }: { setPage: (p: Page) => void }) {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="pt-16">
      <PageHero
        badge="Fale Connosco · Resposta em 1 dia útil"
        title="Estamos prontos para"
        highlight="proteger a sua empresa."
        subtitle="Contacte a nossa equipa de especialistas para uma avaliação gratuita ou para saber mais sobre os nossos serviços."
      />

      <Section className="bg-white">
        <Container>
          <div className="grid md:grid-cols-5 gap-12">
            {/* Formulário */}
            <div className="md:col-span-3">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Send size={18} className="text-violet-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-display">Envie-nos uma mensagem</h2>
                  <p className="text-xs text-slate-400">Respondemos em menos de 1 dia útil</p>
                </div>
              </div>
              {submitted ? (
                <Alert type="success" title="Mensagem enviada com sucesso!" message="Obrigado pelo seu contacto. A nossa equipa irá responder-lhe no prazo de 1 dia útil." />
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input label="Nome" placeholder="João" required />
                    <Input label="Apelido" placeholder="Silva" required />
                  </div>
                  <Input label="Email" type="email" placeholder="joao@empresa.pt" required />
                  <Input label="Organização" placeholder="Empresa, S.A." />
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase tracking-widest font-mono">Serviço de Interesse</label>
                    <select className="bg-white border border-slate-300 rounded-lg px-3 py-2.5 text-sm text-slate-900 focus:border-violet-500 transition-colors">
                      <option>SOC / Monitorização 24/7</option>
                      <option>Conformidade NIS2</option>
                      <option>Testes de Penetração</option>
                      <option>Avaliação de Risco</option>
                      <option>Resposta a Incidentes</option>
                      <option>Formação em Sensibilização</option>
                      <option>Outro</option>
                    </select>
                  </div>
                  <Textarea label="Mensagem" placeholder="Descreva as suas necessidades de segurança..." />
                  <Button type="submit" className="w-full justify-center gap-2">
                    <Send size={14} /> Enviar Mensagem
                  </Button>
                </form>
              )}
            </div>

            {/* Informações de contacto */}
            <div className="md:col-span-2 space-y-5">
              <h2 className="text-lg font-bold text-slate-800 font-display mb-1">O nosso escritório</h2>
              <div className="space-y-3">
                {[
                  { icon: MapPin, label: 'Morada', value: 'Av. da Liberdade 110, 3.º\n1269-046 Lisboa, Portugal', color: 'text-violet-600 bg-violet-50' },
                  { icon: Phone, label: 'Telefone', value: '+351 21 000 0000', color: 'text-blue-600 bg-blue-50' },
                  { icon: Mail, label: 'Email', value: 'info@ciberboxsecur.pt', color: 'text-green-600 bg-green-50' },
                  { icon: Globe, label: 'Website', value: 'www.ciberboxsecur.pt', color: 'text-amber-600 bg-amber-50' },
                ].map((c) => (
                  <div key={c.label} className="flex items-start gap-3 p-3 rounded-xl border border-slate-100 hover:border-violet-100 hover:bg-violet-50/30 transition-base">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.color}`}>
                      <c.icon size={15} />
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 font-mono uppercase tracking-wide mb-0.5">{c.label}</p>
                      <p className="text-sm text-slate-800 font-medium whitespace-pre-line">{c.value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Horário */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-violet-600" />
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide font-mono">Horário de Atendimento</p>
                </div>
                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between text-slate-700">
                    <span>Segunda – Sexta</span>
                    <span className="font-medium">09:00 – 18:00</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-xs">
                    <span>SOC (clientes ativos)</span>
                    <span className="font-mono font-semibold text-green-600">24 / 7</span>
                  </div>
                </div>
              </div>

              {/* Badge certificações */}
              <div className="flex flex-wrap gap-2">
                {['ISO 27001', 'CNCS', 'NIS2', 'RGPD'].map((c) => (
                  <div key={c} className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-600 font-medium shadow-sm">
                    <Award size={11} className="text-amber-500" />{c}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </Section>

      <PageFooter setPage={setPage} />
    </div>
  );
}
