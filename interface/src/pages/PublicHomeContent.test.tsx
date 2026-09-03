import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiConteudoSite, ApiNoticia } from '../apiClient';
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
  });

  it('mostra imediatamente o Hero original completo sem registos CMS', async () => {
    let resolve!: (rows: ApiConteudoSite[]) => void;
    apiMocks.conteudosPublicosApi.mockReturnValue(new Promise((done) => { resolve = done; }));

    render(<HomePage setPage={vi.fn()} />);

    expect(screen.getByText('Plataforma Certificada NIS2 · ISO/IEC 27001')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Segurança Digital para um Mundo Conectado' })).toBeVisible();
    expect(screen.getByText(/Proteja a sua empresa contra ameaças digitais/)).toBeVisible();
    expect(screen.getByRole('button', { name: /Explorar Serviços/ })).toBeVisible();
    expect(screen.getAllByRole('button', { name: 'Agendar Serviços' })[0]).toBeVisible();
    expect(screen.getByText('Links Rápidos')).toBeVisible();

    await act(async () => {
      resolve([]);
      await Promise.resolve();
    });
    expect(screen.getByRole('heading', { name: 'Segurança Digital para um Mundo Conectado' })).toBeVisible();
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
    expect(screen.getByText('Links Rápidos')).toBeVisible();

    const hero = heading.closest('section');
    expect(hero).not.toBeNull();
    await user.click(withinSection(hero!, /Explorar Serviços/));
    expect(setPage).toHaveBeenLastCalledWith('services');
  });

  it('mantém Homepage e footer quando a API de CMS falha', async () => {
    apiMocks.conteudosPublicosApi.mockRejectedValue(new Error('Falha controlada.'));
    render(<HomePage setPage={vi.fn()} />);

    expect(screen.getByRole('heading', { name: 'Segurança Digital para um Mundo Conectado' })).toBeVisible();
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
    expect(screen.getByText('ISO 27001')).toBeVisible();
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
