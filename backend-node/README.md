# CiberBoxSecur Node API

Backend Node/Express complementar para os requisitos académicos de Web II. Reutiliza o esquema PostgreSQL já existente do projeto e não executa `sync`, migrações, DDL ou seed automaticamente.

## Configuração local

1. Copie `.env.example` para `.env` dentro desta pasta.
2. Preencha apenas uma `DATABASE_URL` de uma base/branch de testes isolada e um `JWT_SECRET` local forte.
3. Execute `npm install` e `npm run dev` nesta pasta.

O processo arranca sem base de dados apenas para `GET /api/health`; qualquer rota de dados exige `DATABASE_URL` válida.

## Rotas atualmente preparadas

- `GET /api/health` e `GET /api/csrf/`;
- sessão JWT em cookie HttpOnly: `/api/auth/*` e compatibilidade `/api/login/`, `/api/me/`, `/api/logout/`;
- clientes com isolamento por associação em `/api/clients/*`;
- dashboard, ativos, incidentes, documentos e pedidos;
- pedidos em `/api/requests`: qualquer perfil autenticado pode consultar, Cliente cria apenas para a sua organização, Gestor/Admin criam para organizações autorizadas e Gestor/Admin atualizam o workflow; a rota legada de leitura `/api/pedidos/` mantém-se compatível;
- importações XLSX em `/api/excel-imports`, apenas para Administrador e Gestor: `POST /preview` valida sem escrever e `POST /` persiste o ficheiro privado, o histórico e as linhas aceites/rejeitadas numa única transação; apenas `ATIVOS` e `INCIDENTES` são suportados pelo esquema atual;
- CMS público em `/api/public/*` e CMS administrativo, apenas para Administrador, em `/api/admin/*`;
- utilizadores, apenas para Administrador, em `/api/users/*`.

As rotas de escrita devem ser validadas apenas contra uma PostgreSQL de testes isolada. Nenhum comando deste backend executa `sequelize.sync()`, DDL, seeds ou migrations automaticamente.

## Formato XLSX de importação

O ficheiro é limitado a 1.000 linhas e ao teto de segurança `DOCUMENT_UPLOAD_SAFETY_MAX_MB`. A primeira folha é lida; a primeira linha deve conter os cabeçalhos. Cabeçalhos com maiúsculas, acentos e espaços são normalizados.

- Ativos: `nome`, `criticidade` e, opcionalmente, `numero_inventario`, `tipo_equipamento`, `sistema_operativo`, `endereco_ip`, `endereco_mac`, `fqdn`, `fabricante`, `modelo_versao`, `numero_serie`, `localizacao`, `tipologia`, `observacoes`, `comunicado_cncs`, `programa_gestao_risco`.
- Incidentes: `codigo`, `data_hora_incidente`, `tipo_incidente`, `descricao`, `gravidade` e, opcionalmente, os restantes campos do incidente. A importação nunca ativa NIS2 automaticamente: essa confirmação permanece no fluxo normal de Incidentes.

Erros de validação por linha produzem uma importação parcial ou falhada, sem criar registos inválidos. Um erro técnico reverte a transação da base de dados e remove o objeto Blob que já tenha sido criado.
