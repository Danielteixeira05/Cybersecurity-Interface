import assert from 'node:assert/strict';
import test from 'node:test';
import { normaliseMessageContent } from '../src/services/conversations.service.js';
import { emitChatMessage, emitChatRead, setRealtimeServer } from '../src/socket/events.js';

test('chat normalises content and rejects invalid payloads', () => {
  assert.equal(normaliseMessageContent('  mensagem segura  '), 'mensagem segura');
  assert.throws(() => normaliseMessageContent('   '), { status: 400 });
  assert.throws(() => normaliseMessageContent('a'.repeat(2001)), { status: 400 });
});

test('chat socket events use only authorised user rooms', () => {
  const emitted = [];
  setRealtimeServer({
    to(room) {
      return { emit(event, payload) { emitted.push({ room, event, payload }); } };
    },
  });
  const message = { id: 41, conversa_id: 9, remetente_id: 7, conteudo: 'Mensagem', criado_em: '2026-08-28T12:00:00.000Z' };
  emitChatMessage(message, [7, 11], 7, 3);
  emitChatRead(11, { conversa_id: 9, ultima_mensagem_id: 41, atualizado_em: '2026-08-28T12:01:00.000Z' });

  assert.deepEqual(emitted.map(({ room, event }) => ({ room, event })), [
    { room: 'user:7', event: 'chat:message' },
    { room: 'user:11', event: 'chat:message' },
    { room: 'user:11', event: 'chat:unread' },
    { room: 'user:11', event: 'chat:read' },
  ]);
  assert.equal(emitted.some(({ room }) => room === 'client:3'), false);
});
