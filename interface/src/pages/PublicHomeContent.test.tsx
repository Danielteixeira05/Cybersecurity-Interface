import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { session, type ApiConteudoSite, type ApiNoticia } from '../apiClient';
import { ContactPage, HomePage, NewsPage, ServicesPage } from './PublicPages';

const apiMocks = vi.hoisted(() => ({
  conteudosPublicosApi: vi.fn(),
  enviarContactoPublicoApi: vi.fn(),
  noticiasPublicasApi: vi.fn(),
}));

vi.mock('../apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../apiClient')>();
  return { ...actual, ...apiMocks };
});

function content(overrides: Partial<ApiConteudoSite>): ApiConteudoSite {
  return {
    id: 101,
    chave: 'homepage.hero',
    titulo: 'Título publicado',
    subtitulo: 'Etiqueta publicada',
    corpo: 'Descrição publicada.',
    ativo: true,
    ordem: 0,
    ...overrides,
  };
}

describe('conteúdo público com design canónico', () => {
  beforeEach(() => {
    Object.values(apiMocks).forEach((mock) => mock.mockReset());
    apiMocks.conteudosPublicosApi.mockResolvedValue([]);
    apiMocks.enviarContactoPublicoApi.mockResolvedValue({ id: 1 });
    apiMocks.noticiasPublicasApi.mockResolvedValue([]);
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    session.clear();
  });

  it('mostra imediatamente o Hero original completo sem registos CMS', async () => {
    let resolve!: (rows: ApiConteudoSite[]) => void;
    apiMocks.conteudosPublicosApi.mockReturnValue(new Promise((done) => { resolve = done; }));

    render(<HomePage setPage={vi.fn()} />);

    expect(screen.getByText('Apoio à conformidade NIS2 · Segurança digital')).toBeVisible();
    expect(screen.queryByText('Plataforma Certificada NIS2 · ISO/IEC 27001')).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Segurança Digital para um Mundo Conectado' })).toBeVisible();
    expect(screen.getByText(/Proteja a sua empresa contra ameaças digitais/)).toBeVisible();
    expect(screen.getByRole('heading', { name: 'A nossa identidade' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Missão' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Visão' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Valores' })).toBeVisible();
    expect(screen.getByRole('button', { name: /Explorar Serviços/ })).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Agendar Serviços' })[0]).toBeVisible();
    expect(screen.getByText('Links Rápidos')).toBeVisible();
    expect(screen.getByRole('link', { name: 'Sobre Nós' })).toHaveAttribute('href', '/#quem-somos');
    expect(screen.getByText(`© ${new Date().getFullYear()} CiberBoxSecur Lda. Todos os direitos reservados. Lisboa, Portugal.`)).toBeVisible();

    await act(async () => {
      resolve([]);
      await Promise.resolve();
    });
    expect(screen.getByRole('heading', { name: 'Segurança Digital para um Mundo Conectado' })).toBeVisible();
  });

  it('mantém os destinos reais do footer e abre o portal adequado à sessão', async () => {
    const user = userEvent.setup();
    const setPage = vi.fn();
    render(<HomePage setPage={setPage} />);

    const footer = document.querySelector('.home-footer');
    expect(footer).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Sobre Nós' })).toHaveAttribute('href', '/#quem-somos');

    for (const [label, page] of [['Início', 'home'], ['Serviços', 'services'], ['Notícias', 'news'], ['Contacto', 'contact']] as const) {
      await user.click(withinSection(footer!, new RegExp(`^${label}$`)));
      expect(setPage).toHaveBeenLastCalledWith(page);
    }

    await user.click(withinSection(footer!, /^Dashboard$/));
    expect(setPage).toHaveBeenLastCalledWith('login');

    session.set({ utilizador: null, cliente: null, role: 'manager' });
    await user.click(withinSection(footer!, /^Dashboard$/));
    expect(setPage).toHaveBeenLastCalledWith('mgr-dashboard');
  });

  it('sobrepõe apenas os campos publicados do Hero e mantém CTAs, secções e footer', async () => {
    const user = userEvent.setup();
    const setPage = vi.fn();
    apiMocks.conteudosPublicosApi.mockResolvedValue([
      content({
        titulo: 'Proteção digital|feita à sua medida',
        subtitulo: 'Etiqueta guardada no Back Office',
        corpo: 'Descrição carregada através da API pública.',
      }),
    ]);

    render(<HomePage setPage={setPage} />);

    expect(await screen.findByText('Etiqueta guardada no Back Office')).toBeVisible();
    const heading = screen.getByRole('heading', { name: 'Proteção digital feita à sua medida' });
    expect(heading).toBeVisible();
    expect(screen.getByText('Serviços de Cibersegurança Completos')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'A nossa identidade' })).toBeVisible();
    expect(screen.getByText('Links Rápidos')).toBeVisible();

    const hero = heading.closest('section');
    expect(hero).not.toBeNull();
    await user.click(withinSection(hero!, /Explorar Serviços/));
    expect(setPage).toHaveBeenLastCalledWith('services');
  });

  it('sobrepõe os quatro blocos institucionais sem alterar a estrutura da Homepage', async () => {
    apiMocks.conteudosPublicosApi.mockResolvedValue([
      content({
        id: 110,
        chave: 'homepage_identidade_cabecalho',
        titulo: 'Identidade publicada',
        subtitulo: null,
        corpo: 'Introdução institucional publicada.',
      }),
      content({ id: 111, chave: 'homepage_missao', titulo: 'Missão publicada', corpo: 'Descrição publicada da missão.' }),
      content({ id: 112, chave: 'homepage_visao', titulo: 'Visão publicada', corpo: 'Descrição publicada da visão.' }),
      content({ id: 113, chave: 'homepage_valores', titulo: 'Valores publicados', corpo: 'Descrição publicada dos valores.' }),
    ]);

    render(<HomePage setPage={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: 'Identidade publicada' })).toBeVisible();
    expect(screen.getByText('Quem Somos')).toBeVisible();
    expect(screen.getByText('Introdução institucional publicada.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Missão publicada' })).toBeVisible();
    expect(screen.getByText('Descrição publicada da missão.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Visão publicada' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Valores publicados' })).toBeVisible();
    expect(document.querySelectorAll('.home-identity-card')).toHaveLength(3);
    expect(document.querySelectorAll('.home-service-card')).toHaveLength(6);
    expect(screen.getByRole('heading', { name: 'Serviços de Cibersegurança Completos' })).toBeVisible();
  });

  it('sobrepõe cabeçalho, cartões e chamada final da Homepage sem alterar a grelha', async () => {
    apiMocks.conteudosPublicosApi.mockResolvedValue([
      content({
        id: 120,
        chave: 'homepage_servicos_cabecalho',
        titulo: 'Capacidades publicadas',
        subtitulo: 'O que fazemos agora',
        corpo: 'Introdução dos serviços publicada.',
      }),
      content({
        id: 121,
        chave: 'homepage.servico.pentesting',
        titulo: 'Pentesting publicado',
        corpo: 'Descrição publicada do serviço.',
      }),
      content({
        id: 122,
        chave: 'homepage_cta_final',
        titulo: 'Proteção à medida|Começa agora',
        subtitulo: 'Próximo passo',
        corpo: 'Chamada final publicada.',
      }),
    ]);

    render(<HomePage setPage={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: 'Capacidades publicadas' })).toBeVisible();
    expect(screen.getByText('O que fazemos agora')).toBeVisible();
    expect(screen.getByText('Introdução dos serviços publicada.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Pentesting publicado' })).toBeVisible();
    expect(screen.getByText('Descrição publicada do serviço.')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Proteção à medida Começa agora' })).toBeVisible();
    expect(screen.getByText('Próximo passo')).toBeVisible();
    expect(screen.getByText('Chamada final publicada.')).toBeVisible();
    expect(document.querySelectorAll('.home-service-card')).toHaveLength(6);
  });

  it('mantém Homepage e footer quando a API de CMS falha', async () => {
    apiMocks.conteudosPublicosApi.mockRejectedValue(new Error('Falha controlada.'));
    render(<HomePage setPage={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Segurança Digital para um Mundo Conectado' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'A nossa identidade' })).toBeVisible();
    expect(document.querySelectorAll('.home-identity-card')).toHaveLength(3);
    expect(document.querySelectorAll('.home-service-card')).toHaveLength(6);
    expect(screen.getByRole('heading', { name: 'Pronto para Proteger o Seu Negócio?' })).toBeVisible();
    expect(screen.getByText('Links Rápidos')).toBeVisible();
    expect(await screen.findByText(/Conteúdo atualizado temporariamente indisponível/)).toBeInTheDocument();
  });

  it('mantém os seis serviços e todas as secções originais sem dados CMS', async () => {
    render(<ServicesPage setPage={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Proteção abrangente para cada ameaça.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Testes de Penetração (Pentesting)' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Segurança Cloud & DevSecOps' })).toBeVisible();
    expect(document.querySelectorAll('.service-detail-card')).toHaveLength(6);
    expect(document.querySelectorAll('.service-proof-card')).toHaveLength(4);
    expect(document.querySelectorAll('.service-process-step')).toHaveLength(4);
    expect(document.querySelectorAll('.nis2-requirement-card')).toHaveLength(6);
    expect(screen.getByText(/entrou em vigor em janeiro de 2023/i)).toBeVisible();
    expect(screen.getByText(/até 17 de outubro de 2024/i)).toBeVisible();
    expect(screen.getByText(/alerta inicial em 24 horas, uma notificação com avaliação inicial em 72 horas/i)).toBeVisible();
    expect(screen.getByText(/relatório final até um mês/i)).toBeVisible();
    expect(screen.getByText(/atividade, a dimensão e as exceções previstas/i)).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Pronto para Proteger o Seu Negócio?' })).toBeVisible();
    expect(screen.getByText('Links Rápidos')).toBeVisible();
    await waitFor(() => expect(apiMocks.conteudosPublicosApi).toHaveBeenCalled());
  });

  it('substitui só um cartão de Serviço e mantém os restantes defaults', async () => {
    apiMocks.conteudosPublicosApi.mockResolvedValue([
      content({
        id: 202,
        chave: 'servicos.card.pentesting',
        titulo: 'Pentesting adaptado',
        subtitulo: 'Preço sob proposta',
        corpo: 'Aplicações críticas\nAPIs empresariais',
      }),
    ]);

    render(<ServicesPage setPage={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: 'Pentesting adaptado' })).toBeVisible();
    expect(screen.getByText('Preço sob proposta')).toBeVisible();
    expect(screen.getByText('Aplicações críticas')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Gestão de Incidentes NIS2' })).toBeVisible();
    expect(document.querySelectorAll('.service-detail-card')).toHaveLength(6);
  });

  it('mantém a página Serviços completa quando a API falha', async () => {
    apiMocks.conteudosPublicosApi.mockRejectedValue(new Error('Falha controlada.'));
    render(<ServicesPage setPage={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Proteção abrangente para cada ameaça.' })).toBeVisible();
    expect(document.querySelectorAll('.service-detail-card')).toHaveLength(6);
    expect(screen.getByText('Links Rápidos')).toBeVisible();
    expect(await screen.findByText(/Conteúdo publicado temporariamente indisponível/)).toBeInTheDocument();
  });

  it('mantém Contacto, formulário, escritório e footer sem dados CMS', async () => {
    render(<ContactPage setPage={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Estamos prontos para proteger a sua empresa.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Envie-nos uma mensagem' })).toBeVisible();
    expect(screen.getByLabelText('Email')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'O nosso escritório' })).toBeVisible();
    expect(screen.getByText('Av. da Liberdade 110, 3.º', { exact: false })).toBeVisible();
    expect(screen.getByText('Horário de Atendimento')).toBeVisible();
    expect(screen.getByText('Boas práticas ISO/IEC 27001')).toBeVisible();
    expect(screen.getByText('Links Rápidos')).toBeVisible();
    await waitFor(() => expect(apiMocks.conteudosPublicosApi).toHaveBeenCalled());
  });

  it('sobrepõe um canal de Contacto sem retirar os restantes nem o formulário', async () => {
    apiMocks.conteudosPublicosApi.mockResolvedValue([
      content({
        id: 303,
        chave: 'contacto.channel.telefone',
        titulo: 'Linha direta',
        subtitulo: null,
        corpo: '+351 210 111 222',
      }),
    ]);

    render(<ContactPage setPage={vi.fn()} />);

    expect(await screen.findByText('Linha direta')).toBeVisible();
    expect(screen.getByText('+351 210 111 222')).toBeVisible();
    expect(screen.getByText('Morada')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Email' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Envie-nos uma mensagem' })).toBeVisible();
  });

  it('mantém Contacto e footer quando a API falha', async () => {
    apiMocks.conteudosPublicosApi.mockRejectedValue(new Error('Falha controlada.'));
    render(<ContactPage setPage={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Estamos prontos para proteger a sua empresa.' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Envie-nos uma mensagem' })).toBeVisible();
    expect(screen.getByText('Links Rápidos')).toBeVisible();
    expect(await screen.findByText(/Conteúdo publicado temporariamente indisponível/)).toBeInTheDocument();
  });

  it('mantém Notícias ligada à API própria e independente do CMS', async () => {
    const article: ApiNoticia = {
      id: 404,
      titulo: 'Notícia publicada',
      resumo: 'Resumo publicado',
      corpo: 'Corpo publicado',
      imagem_url: null,
      publicada: true,
      ativo: true,
      publicada_em: '2026-09-03T10:00:00.000Z',
    };
    apiMocks.noticiasPublicasApi.mockResolvedValue([article]);

    render(<NewsPage setPage={vi.fn()} onSelectArticle={vi.fn()} />);

    expect(await screen.findByRole('heading', { name: 'Notícia publicada' })).toBeVisible();
    expect(apiMocks.noticiasPublicasApi).toHaveBeenCalledTimes(1);
    expect(apiMocks.conteudosPublicosApi).not.toHaveBeenCalled();
    expect(screen.getByText('Links Rápidos')).toBeVisible();
  });
});

function withinSection(section: Element, name: RegExp) {
  const button = Array.from(section.querySelectorAll('button')).find((candidate) => name.test(candidate.textContent ?? ''));
  if (!(button instanceof HTMLButtonElement)) throw new Error('Botão esperado não encontrado.');
  return button;
}
