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
- leitura de dashboard, ativos, incidentes, documentos e pedidos;
- CMS público em `/api/public/*` e CMS administrativo, apenas para Administrador, em `/api/admin/*`;
- utilizadores, apenas para Administrador, em `/api/users/*`.

As rotas de escrita devem ser validadas apenas contra uma PostgreSQL de testes isolada. Nenhum comando deste backend executa `sequelize.sync()`, DDL, seeds ou migrations automaticamente.
