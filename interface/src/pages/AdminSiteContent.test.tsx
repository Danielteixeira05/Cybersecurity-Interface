import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApiConteudoSite, ApiMensagemContacto, ApiNoticia } from '../apiClient';
import { AdminSiteContent } from './AdminPages';

const apiMocks = vi.hoisted(() => ({
  atualizarConteudoAdminApi: vi.fn(),
  atualizarMensagemContactoAdminApi: vi.fn(),
  atualizarNoticiaAdminApi: vi.fn(),
  conteudosAdminApi: vi.fn(),
  criarConteudoAdminApi: vi.fn(),
  criarNoticiaAdminApi: vi.fn(),
  mensagensContactoAdminApi: vi.fn(),
  noticiasAdminApi: vi.fn(),
}));

vi.mock('../apiClient', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../apiClient')>();
  return { ...actual, ...apiMocks };
});

function content(overrides: Partial<ApiConteudoSite>): ApiConteudoSite {
  return {
    id: 1,
    chave: 'homepage.hero',
    titulo: 'Hero persistido',
    subtitulo: 'Etiqueta persistida',
    corpo: 'Descrição persistida',
    ativo: true,
    ordem: 0,
    ...overrides,
  };
}

const canonicalContents: ApiConteudoSite[] = [
  content({ id: 1 }),
  content({ id: 2, chave: 'servicos.card.pentesting', titulo: 'Serviço real', ordem: 0 }),
  content({ id: 3, chave: 'contacto.channel.email', titulo: 'Email institucional', corpo: 'contacto@example.test' }),
  content({ id: 99, chave: 'bloco_generico_antigo', titulo: 'Conteúdo legado que deve ficar oculto' }),
];

const news: ApiNoticia[] = [{
  id: 20,
  titulo: 'Notícia existente',
  resumo: 'Resumo real',
  corpo: 'Corpo real',
  publicada: true,
  ativo: true,
}];

const messages: ApiMensagemContacto[] = [{
  id: 30,
  nome: 'Pessoa real',
  email: 'pessoa@example.test',
  assunto: 'Pedido real',
  mensagem: 'Mensagem real',
  estado: 'NOVA',
}];

describe('AdminSiteContent', () => {
  beforeEach(() => {
    Object.values(apiMocks).forEach((mock) => mock.mockReset());
    apiMocks.conteudosAdminApi.mockResolvedValue(canonicalContents);
    apiMocks.noticiasAdminApi.mockResolvedValue(news);
    apiMocks.mensagensContactoAdminApi.mockResolvedValue(messages);
    apiMocks.atualizarConteudoAdminApi.mockResolvedValue(undefined);
    apiMocks.atualizarMensagemContactoAdminApi.mockResolvedValue(undefined);
    apiMocks.atualizarNoticiaAdminApi.mockResolvedValue(undefined);
    apiMocks.criarConteudoAdminApi.mockResolvedValue(undefined);
    apiMocks.criarNoticiaAdminApi.mockResolvedValue(undefined);
  });

  it('expõe quatro separadores e apenas os blocos estáveis do design', async () => {
    const user = userEvent.setup();
    render(<AdminSiteContent />);

    expect(screen.getByRole('button', { name: 'Homepage' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Serviços' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Notícias' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Contacto' })).toBeVisible();
    expect(await screen.findByText('Hero persistido')).toBeVisible();
    expect(screen.getByText('Cabeçalho da identidade')).toBeVisible();
    expect(screen.getByText('Título e descrição do cartão Missão.')).toBeVisible();
    expect(screen.getByText('Título e descrição do cartão Visão.')).toBeVisible();
    expect(screen.getByText('Título e descrição do cartão Valores.')).toBeVisible();
    expect(screen.getByText('Cabeçalho dos serviços da Homepage')).toBeVisible();
    expect(screen.getByText('Homepage — Testes de Penetração')).toBeVisible();
    expect(screen.getByText('Chamada final da Homepage')).toBeVisible();
    expect(screen.getAllByText('Predefinição')).toHaveLength(12);
    expect(screen.queryByText('Conteúdo legado que deve ficar oculto')).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/^Chave$/i)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Serviços' }));
    expect(await screen.findByText('Serviço real')).toBeVisible();
    expect(screen.getByText('Segurança Cloud & DevSecOps')).toBeVisible();
    expect(screen.getByText('Compromisso — Referencial CNCS')).toBeVisible();
    expect(screen.getByText('Processo — Monitorização')).toBeVisible();
    expect(screen.getByText('NIS2 — Formação')).toBeVisible();
    expect(screen.queryByRole('combobox', { name: 'Tipo de bloco' })).not.toBeInTheDocument();
    expect(screen.queryByText('Conteúdo legado que deve ficar oculto')).not.toBeInTheDocument();
  });

  it('mostra valores default e cria apenas a chave estável na primeira gravação', async () => {
    const user = userEvent.setup();
    apiMocks.conteudosAdminApi.mockResolvedValue([]);
    render(<AdminSiteContent />);

    const defaultTitle = await screen.findByText('Segurança Digital para um|Mundo Conectado');
    const card = defaultTitle.closest('div.rounded-2xl');
    if (!(card instanceof HTMLElement)) throw new Error('Cartão do Hero não encontrado.');
    expect(screen.getAllByText('Predefinição')).toHaveLength(13);
    expect(within(card).getByText('Predefinição')).toBeVisible();
    await user.click(within(card).getByRole('button', { name: 'Editar' }));
    expect(screen.getByLabelText('Bloco')).toHaveValue('Hero da Homepage');
    expect(screen.getByLabelText('Título')).toHaveValue('Segurança Digital para um|Mundo Conectado');

    await user.click(screen.getByRole('button', { name: 'Guardar' }));
    await waitFor(() => expect(apiMocks.criarConteudoAdminApi).toHaveBeenCalledTimes(1));
    expect(apiMocks.criarConteudoAdminApi).toHaveBeenCalledWith(expect.objectContaining({
      chave: 'homepage.hero',
      titulo: 'Segurança Digital para um|Mundo Conectado',
    }));
    expect(apiMocks.criarConteudoAdminApi.mock.calls[0][0]).not.toHaveProperty('dados');
  });

  it('edita um bloco existente sem permitir mudar a chave', async () => {
    const user = userEvent.setup();
    render(<AdminSiteContent />);
    const title = await screen.findByText('Hero persistido');
    const card = title.closest('div.rounded-2xl');
    if (!(card instanceof HTMLElement)) throw new Error('Cartão do Hero não encontrado.');

    await user.click(within(card).getByRole('button', { name: 'Editar' }));
    expect(screen.getByLabelText('Bloco')).toHaveValue('Hero da Homepage');
    expect(screen.getByLabelText('Bloco')).toHaveAttribute('readonly');
    await user.clear(screen.getByLabelText('Título'));
    await user.type(screen.getByLabelText('Título'), 'Novo título persistido');
    await user.click(screen.getByRole('button', { name: 'Guardar' }));

    await waitFor(() => expect(apiMocks.atualizarConteudoAdminApi).toHaveBeenCalled());
    const [, payload] = apiMocks.atualizarConteudoAdminApi.mock.calls[0];
    expect(payload).toEqual(expect.objectContaining({ chave: 'homepage.hero', titulo: 'Novo título persistido' }));
    expect(payload).not.toHaveProperty('dados');
  });

  it('mantém Serviços, Notícias e Contacto separados por finalidade', async () => {
    const user = userEvent.setup();
    render(<AdminSiteContent />);
    await screen.findByText('Hero persistido');

    await user.click(screen.getByRole('button', { name: 'Serviços' }));
    expect(await screen.findByText('Serviço real')).toBeVisible();
    expect(screen.queryByText('Email institucional')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Notícias' }));
    expect(await screen.findByText('Notícia existente')).toBeVisible();
    expect(screen.getByRole('button', { name: '+ Nova notícia' })).toBeVisible();
    expect(apiMocks.noticiasAdminApi).toHaveBeenCalledWith(expect.any(AbortSignal));

    await user.click(screen.getByRole('button', { name: 'Contacto' }));
    expect(await screen.findByText('Email institucional')).toBeVisible();
    expect(screen.getByText('Morada')).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Mensagens de contacto' })).toBeVisible();
    expect(screen.getByText('Pedido real')).toBeVisible();
    expect(screen.queryByText('Notícia existente')).not.toBeInTheDocument();
  });

  it('apresenta estados controlados de carregamento e erro', async () => {
    let resolvePending!: (rows: ApiConteudoSite[]) => void;
    apiMocks.conteudosAdminApi.mockReturnValueOnce(new Promise((resolve) => { resolvePending = resolve; }));
    const first = render(<AdminSiteContent />);
    expect(screen.getByText('A carregar...')).toBeVisible();
    first.unmount();
    resolvePending([]);

    apiMocks.conteudosAdminApi.mockRejectedValueOnce(new Error('Conteúdo indisponível.'));
    render(<AdminSiteContent />);
    expect(await screen.findByText('Conteúdo indisponível.')).toBeVisible();
  });

  it('aborta a página anterior e ignora a sua resposta atrasada', async () => {
    const user = userEvent.setup();
    let resolveHomepage!: (rows: ApiConteudoSite[]) => void;
    let resolveServices!: (rows: ApiConteudoSite[]) => void;
    const signals: AbortSignal[] = [];
    apiMocks.conteudosAdminApi
      .mockImplementationOnce((signal?: AbortSignal) => {
        if (signal) signals.push(signal);
        return new Promise<ApiConteudoSite[]>((resolve) => { resolveHomepage = resolve; });
      })
      .mockImplementationOnce((signal?: AbortSignal) => {
        if (signal) signals.push(signal);
        return new Promise<ApiConteudoSite[]>((resolve) => { resolveServices = resolve; });
      });

    render(<AdminSiteContent />);
    await waitFor(() => expect(apiMocks.conteudosAdminApi).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('button', { name: 'Serviços' }));
    await waitFor(() => expect(apiMocks.conteudosAdminApi).toHaveBeenCalledTimes(2));
    expect(signals[0].aborted).toBe(true);

    await act(async () => {
      resolveHomepage([content({ titulo: 'Hero atrasado' })]);
      await Promise.resolve();
    });
    expect(screen.queryByText('Hero atrasado')).not.toBeInTheDocument();

    await act(async () => {
      resolveServices([]);
      await Promise.resolve();
    });
    expect(await screen.findByText('Segurança Cloud & DevSecOps')).toBeVisible();
    expect(screen.queryByText('Hero atrasado')).not.toBeInTheDocument();
  });
});
