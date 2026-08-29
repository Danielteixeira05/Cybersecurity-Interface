import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCheck, CircleAlert, LoaderCircle, MessageCircle, Search, Send, ShieldCheck, UsersRound } from 'lucide-react';
import {
  clientesApi, conversasApi, enviarMensagemConversaApi, garantirConversaApi, marcarConversaLidaApi,
  mensagensConversaApi, session, type ApiCliente, type ApiConversa, type ApiMensagemConversa,
} from '../apiClient';
import { realtimeSocket } from '../socketClient';
import type { UserRole } from '../types';

type CommunicationRole = Exclude<UserRole, null>;

const roleName = (role: CommunicationRole) => role === 'admin' ? 'Administrador' : role === 'manager' ? 'Gestor' : 'Cliente';

function messageDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('pt-PT', { dateStyle: 'short', timeStyle: 'short' }).format(date);
}

function lastMessageSummary(message: ApiMensagemConversa | null) {
  if (!message) return 'Ainda não existem mensagens.';
  return message.conteudo;
}

export function CommunicationPage({ role }: { role: CommunicationRole }) {
  const isClient = role === 'client';
  const currentUserId = session.get().utilizador?.id;
  const [clients, setClients] = useState<ApiCliente[]>([]);
  const [conversations, setConversations] = useState<ApiConversa[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ApiMensagemConversa[]>([]);
  const [search, setSearch] = useState('');
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const stickToBottomRef = useRef(true);

  const refreshConversations = useCallback(async () => {
    const [availableClients, existingConversations] = await Promise.all([clientesApi(), conversasApi()]);
    let nextConversations = existingConversations;
    if (isClient) {
      const activeClient = session.get().cliente?.id;
      if (!activeClient) throw new Error('Não existe uma organização ativa associada a esta sessão.');
      const ensured = await garantirConversaApi();
      nextConversations = existingConversations.some((conversation) => conversation.id === ensured.id)
        ? existingConversations
        : [ensured, ...existingConversations];
    }
    setClients(availableClients);
    setConversations(nextConversations);
    setSelectedId((current) => nextConversations.some((conversation) => conversation.id === current) ? current : (nextConversations[0]?.id ?? null));
  }, [isClient]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);
    refreshConversations()
      .catch((cause: unknown) => { if (alive) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as conversas.'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [refreshConversations]);

  const selectedConversation = conversations.find((conversation) => conversation.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedConversation) {
      setMessages([]);
      return undefined;
    }
    let alive = true;
    stickToBottomRef.current = true;
    setMessagesLoading(true);
    setError(null);
    mensagensConversaApi(selectedConversation.id)
      .then(({ items }) => {
        if (!alive) return;
        setMessages(items);
        void marcarConversaLidaApi(selectedConversation.id).then(() => refreshConversations()).catch(() => {});
      })
      .catch((cause: unknown) => { if (alive) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o histórico.'); })
      .finally(() => { if (alive) setMessagesLoading(false); });
    return () => { alive = false; };
  }, [refreshConversations, selectedConversation?.id]);

  useEffect(() => {
    const socket = realtimeSocket();
    const onMessage = (message: ApiMensagemConversa) => {
      if (message.conversa_id === selectedId) {
        setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      }
      void refreshConversations().catch(() => {});
    };
    const onUnread = () => { void refreshConversations().catch(() => {}); };
    const onRead = () => { void refreshConversations().catch(() => {}); };
    socket.on('chat:message', onMessage);
    socket.on('chat:unread', onUnread);
    socket.on('chat:read', onRead);
    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:unread', onUnread);
      socket.off('chat:read', onRead);
    };
  }, [refreshConversations, selectedId]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (viewport && stickToBottomRef.current) viewport.scrollTop = viewport.scrollHeight;
  }, [messages]);

  const chooseClient = async (clientId: number) => {
    setError(null);
    try {
      const conversation = await garantirConversaApi(clientId);
      await refreshConversations();
      stickToBottomRef.current = true;
      setSelectedId(conversation.id);
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível abrir a conversa desta organização.');
    }
  };

  const send = async () => {
    if (!selectedConversation || sending || !draft.trim()) return;
    setSending(true);
    setError(null);
    try {
      const message = await enviarMensagemConversaApi(selectedConversation.id, draft);
      setMessages((current) => current.some((item) => item.id === message.id) ? current : [...current, message]);
      setDraft('');
      stickToBottomRef.current = true;
      await refreshConversations();
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar a mensagem.');
    } finally {
      setSending(false);
    }
  };

  const visibleClients = clients.filter((client) => `${client.nome} ${client.nif ?? ''}`.toLocaleLowerCase('pt-PT').includes(search.toLocaleLowerCase('pt-PT')));
  const visibleConversations = conversations.filter((conversation) => `${conversation.cliente?.nome ?? ''} ${conversation.cliente?.nif ?? ''}`.toLocaleLowerCase('pt-PT').includes(search.toLocaleLowerCase('pt-PT')));

  return (
    <section className="communication-page" aria-label="Comunicação segura">
      <header className="communication-page__header">
        <div>
          <span className="communication-page__eyebrow"><ShieldCheck size={16} aria-hidden="true" /> Canal seguro</span>
          <h1>Comunicação</h1>
          <p>{isClient ? 'Converse com os Gestores ativos da sua organização.' : role === 'manager' ? 'Comunique apenas com as organizações sob a sua gestão.' : 'Consulta e participação global como Administrador.'}</p>
        </div>
        <span className="communication-page__role"><UsersRound size={16} aria-hidden="true" /> {roleName(role)}</span>
      </header>

      {error && <div className="communication-page__alert" role="alert"><CircleAlert size={18} aria-hidden="true" />{error}</div>}

      <div className="communication-page__layout">
        <aside className="communication-page__sidebar" aria-label={isClient ? 'A sua organização' : 'Organizações'}>
          <label className="communication-page__search"><Search size={17} aria-hidden="true" /><span className="sr-only">Pesquisar organização</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar organização" /></label>
          {loading ? <div className="communication-page__state"><LoaderCircle className="communication-page__spinner" size={20} />A carregar conversas…</div> : isClient && visibleConversations.length === 0 ? <div className="communication-page__state">Não existe uma conversa disponível para a sua organização.</div> : !isClient && visibleClients.length === 0 ? <div className="communication-page__state">Não existem organizações ativas associadas a este utilizador.</div> : (
            <div className="communication-page__conversation-list">
              {isClient ? visibleConversations.map((conversation) => <button type="button" key={conversation.id} className={conversation.id === selectedId ? 'is-selected' : ''} onClick={() => { stickToBottomRef.current = true; setSelectedId(conversation.id); }}>
                <strong>{conversation.cliente?.nome ?? 'Organização'}</strong>
                <small>{conversation.cliente?.nif ? `NIF ${conversation.cliente.nif}` : '—'}</small>
                <span>{lastMessageSummary(conversation.ultima_mensagem)}</span>
                {conversation.nao_lidas > 0 && <b aria-label={`${conversation.nao_lidas} mensagens não lidas`}>{conversation.nao_lidas}</b>}
              </button>) : visibleClients.map((client) => {
                const conversation = conversations.find((item) => item.cliente_id === client.id);
                return <button type="button" key={client.id} className={conversation?.id === selectedId ? 'is-selected' : ''} onClick={() => void chooseClient(client.id)}>
                  <strong>{client.nome}</strong>
                  <small>{client.nif ? `NIF ${client.nif}` : 'NIF indisponível'}</small>
                  <span>{lastMessageSummary(conversation?.ultima_mensagem ?? null)}</span>
                  {(conversation?.nao_lidas ?? 0) > 0 && <b aria-label={`${conversation?.nao_lidas} mensagens não lidas`}>{conversation?.nao_lidas}</b>}
                </button>;
              })}
            </div>
          )}
        </aside>

        <main className="communication-page__thread">
          {!selectedConversation && !loading ? <div className="communication-page__state communication-page__empty-thread"><MessageCircle size={30} aria-hidden="true" /><strong>Selecione uma organização para iniciar a comunicação.</strong><span>A conversa será criada de forma segura apenas para participantes autorizados.</span></div> : selectedConversation && <>
            <header className="communication-page__thread-header">
              <div><h2>{selectedConversation.cliente?.nome ?? 'Organização'}</h2><span>{selectedConversation.cliente?.nif ? `NIF ${selectedConversation.cliente.nif}` : 'Identificação indisponível'}</span></div>
              <div className="communication-page__participants"><UsersRound size={17} aria-hidden="true" /><span>{selectedConversation.gestores.length ? selectedConversation.gestores.map((manager) => manager.nome).join(', ') : 'Sem Gestor ativo associado'}</span></div>
            </header>
            <div ref={viewportRef} onScroll={(event) => {
              const target = event.currentTarget;
              stickToBottomRef.current = target.scrollHeight - target.scrollTop - target.clientHeight < 72;
            }} className="communication-page__messages" aria-live="polite">
              {messagesLoading ? <div className="communication-page__state"><LoaderCircle className="communication-page__spinner" size={20} />A carregar histórico…</div> : messages.length === 0 ? <div className="communication-page__state">Ainda não existem mensagens. Envie a primeira mensagem para iniciar a conversa.</div> : messages.map((message) => {
                const mine = message.remetente_id === currentUserId;
                return <article key={message.id} className={`communication-page__message${mine ? ' is-mine' : ''}`}>
                  <div className="communication-page__message-meta"><strong>{mine ? 'Você' : (message.remetente?.nome ?? 'Utilizador')}</strong><span>{message.remetente?.perfil_codigo === 'COLABORADOR' ? 'Gestor' : message.remetente?.perfil_codigo === 'ADMINISTRADOR' ? 'Administrador' : 'Cliente'} · {messageDate(message.criado_em)}</span></div>
                  <p>{message.conteudo}</p>
                </article>;
              })}
            </div>
            <form className="communication-page__composer" onSubmit={(event) => { event.preventDefault(); void send(); }}>
              <label className="sr-only" htmlFor="chat-message">Mensagem</label>
              <textarea id="chat-message" value={draft} maxLength={2000} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void send(); } }} placeholder="Escreva uma mensagem…" rows={2} />
              <div><span>{draft.length}/2000</span><button type="submit" disabled={sending || !draft.trim()}>{sending ? <LoaderCircle className="communication-page__spinner" size={17} /> : <Send size={17} aria-hidden="true" />}Enviar</button></div>
            </form>
            <p className="communication-page__hint"><CheckCheck size={15} aria-hidden="true" /> Enter envia · Shift+Enter cria uma nova linha</p>
          </>}
        </main>
      </div>
    </section>
  );
}
