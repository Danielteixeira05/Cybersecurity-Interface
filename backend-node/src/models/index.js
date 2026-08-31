import { DataTypes } from 'sequelize';
import { getSequelize } from '../config/database.js';

let models;

const id = { type: DataTypes.BIGINT, primaryKey: true, autoIncrement: true };
const smallId = { type: DataTypes.SMALLINT, primaryKey: true, autoIncrement: true };
const createdAt = { type: DataTypes.DATE, allowNull: false, field: 'criado_em' };
const updatedAt = { type: DataTypes.DATE, allowNull: false, field: 'atualizado_em' };

/**
 * Mapeamento estrito do esquema SQL existente (sql/01_criacao.sql e sql/06_extensao_projetoIII.sql).
 * `timestamps: false` é intencional: o PostgreSQL, e não o Sequelize, gere os defaults existentes.
 */
export function getModels() {
  if (models) return models;

  const sequelize = getSequelize();
  const define = (name, attributes, tableName) => sequelize.define(name, attributes, {
    tableName,
    schema: 'public',
    timestamps: false,
    freezeTableName: true,
  });

  const Profile = define('Profile', {
    id: smallId,
    codigo: { type: DataTypes.STRING(20), allowNull: false },
    nome: { type: DataTypes.STRING(60), allowNull: false },
    descricao: DataTypes.TEXT,
    criado_em: createdAt,
  }, 'perfis');

  const User = define('User', {
    id,
    perfil_id: { type: DataTypes.SMALLINT, allowNull: false },
    nome: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false },
    telefone: DataTypes.STRING(30),
    nif: DataTypes.STRING(9),
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false },
    ultimo_acesso_em: DataTypes.DATE,
    criado_em: createdAt,
    atualizado_em: updatedAt,
  }, 'utilizadores');

  const Client = define('Client', {
    id,
    nome: { type: DataTypes.STRING(160), allowNull: false },
    nif: { type: DataTypes.STRING(9), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false },
    telefone: DataTypes.STRING(30),
    morada: DataTypes.TEXT,
    setor_atividade: DataTypes.STRING(100),
    numero_colaboradores: DataTypes.INTEGER,
    volume_negocios: DataTypes.DECIMAL(14, 2),
    ativo: { type: DataTypes.BOOLEAN, allowNull: false },
    criado_em: createdAt,
    atualizado_em: updatedAt,
  }, 'clientes');

  const UserClient = define('UserClient', {
    utilizador_id: { type: DataTypes.BIGINT, primaryKey: true },
    cliente_id: { type: DataTypes.BIGINT, primaryKey: true },
    principal: { type: DataTypes.BOOLEAN, allowNull: false },
    criado_em: createdAt,
    ativo: { type: DataTypes.BOOLEAN, allowNull: false },
  }, 'utilizadores_clientes');

  const ClientContact = define('ClientContact', {
    id,
    cliente_id: { type: DataTypes.BIGINT, allowNull: false },
    tipo: { type: DataTypes.STRING(40), allowNull: false },
    nome: { type: DataTypes.STRING(120), allowNull: false },
    cargo: DataTypes.STRING(100),
    email: { type: DataTypes.STRING(254), allowNull: false },
    telefone: DataTypes.STRING(30),
    comunicado_cncs: { type: DataTypes.BOOLEAN, allowNull: false },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false },
    criado_em: createdAt,
    atualizado_em: updatedAt,
  }, 'contactos_clientes');

  const ConformityStatus = define('ConformityStatus', {
    id: smallId,
    codigo: { type: DataTypes.STRING(30), allowNull: false },
    nome: { type: DataTypes.STRING(80), allowNull: false },
    ordem: { type: DataTypes.SMALLINT, allowNull: false },
  }, 'estados_conformidade');

  const RiskAssessment = define('RiskAssessment', {
    id,
    cliente_id: { type: DataTypes.BIGINT, allowNull: false },
    estado_conformidade_id: { type: DataTypes.SMALLINT, allowNull: false },
    data_avaliacao: { type: DataTypes.DATEONLY, allowNull: false },
    nivel_risco: { type: DataTypes.STRING(20), allowNull: false },
    pontuacao: DataTypes.DECIMAL(5, 2),
    resumo: { type: DataTypes.TEXT, allowNull: false },
    recomendacoes: DataTypes.TEXT,
    criado_por: DataTypes.BIGINT,
    criado_em: createdAt,
  }, 'avaliacoes_risco');

  const Asset = define('Asset', {
    id,
    cliente_id: { type: DataTypes.BIGINT, allowNull: false },
    importacao_id: DataTypes.BIGINT,
    numero_inventario: DataTypes.STRING(80),
    tipo_equipamento: DataTypes.STRING(100),
    nome: { type: DataTypes.STRING(160), allowNull: false },
    tipologia: DataTypes.STRING(100),
    modelo_versao: DataTypes.STRING(160),
    numero_serie: DataTypes.STRING(120),
    fabricante: DataTypes.STRING(120),
    localizacao: DataTypes.STRING(160),
    sistema_operativo: DataTypes.STRING(120),
    criticidade: { type: DataTypes.STRING(20), allowNull: false },
    endereco_ip: DataTypes.INET,
    endereco_mac: DataTypes.MACADDR,
    fqdn: DataTypes.STRING(255),
    servico_suportado: DataTypes.TEXT,
    responsavel_nome: DataTypes.STRING(120),
    responsavel_contacto: DataTypes.STRING(120),
    unidade_organica: DataTypes.STRING(120),
    aplicacoes_servicos: DataTypes.TEXT,
    observacoes: DataTypes.TEXT,
    comunicado_cncs: { type: DataTypes.BOOLEAN, allowNull: false },
    programa_gestao_risco: { type: DataTypes.BOOLEAN, allowNull: false },
    criado_por: DataTypes.BIGINT,
    criado_em: createdAt,
    atualizado_em: updatedAt,
    ativo: { type: DataTypes.BOOLEAN, allowNull: false },
  }, 'ativos_tecnologicos');

  const Incident = define('Incident', {
    id,
    cliente_id: { type: DataTypes.BIGINT, allowNull: false },
    importacao_id: DataTypes.BIGINT,
    codigo: { type: DataTypes.STRING(40), allowNull: false },
    data_hora_incidente: { type: DataTypes.DATE, allowNull: false },
    registado_por: DataTypes.STRING(120),
    departamento: DataTypes.STRING(120),
    tipo_incidente: { type: DataTypes.STRING(100), allowNull: false },
    descricao: { type: DataTypes.TEXT, allowNull: false },
    utilizadores_afetados: { type: DataTypes.INTEGER, allowNull: false },
    dados_comprometidos: { type: DataTypes.BOOLEAN, allowNull: false },
    sistemas_afetados: DataTypes.TEXT,
    origem_ataque: DataTypes.STRING(160),
    ip_atacante: DataTypes.INET,
    analise_log: DataTypes.TEXT,
    resposta_imediata: DataTypes.TEXT,
    medidas_corretivas: DataTypes.TEXT,
    entidades_internas: DataTypes.TEXT,
    entidades_externas: DataTypes.TEXT,
    gravidade: { type: DataTypes.STRING(20), allowNull: false },
    probabilidade_reincidencia: DataTypes.STRING(20),
    recomendacoes: DataTypes.TEXT,
    estado: { type: DataTypes.STRING(20), allowNull: false },
    encerrado_em: DataTypes.DATE,
    responsavel_encerramento: DataTypes.STRING(120),
    notificado_nis2: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    notificado_nis2_em: DataTypes.DATE,
    notificado_nis2_por: DataTypes.BIGINT,
    criado_por: DataTypes.BIGINT,
    criado_em: createdAt,
    atualizado_em: updatedAt,
    ativo: { type: DataTypes.BOOLEAN, allowNull: false },
  }, 'incidentes');

  const Notification = define('Notification', {
    id,
    utilizador_id: { type: DataTypes.BIGINT, allowNull: false },
    incidente_id: DataTypes.BIGINT,
    documento_id: DataTypes.BIGINT,
    cliente_id: { type: DataTypes.BIGINT, allowNull: false },
    tipo: { type: DataTypes.STRING(40), allowNull: false },
    titulo: { type: DataTypes.STRING(180), allowNull: false },
    mensagem: { type: DataTypes.TEXT, allowNull: false },
    lida: { type: DataTypes.BOOLEAN, allowNull: false },
    lida_em: DataTypes.DATE,
    criado_em: createdAt,
    atualizado_em: updatedAt,
  }, 'notificacoes_utilizadores');

  const Conversation = define('Conversation', {
    id,
    cliente_id: { type: DataTypes.BIGINT, allowNull: false },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false },
    criado_em: createdAt,
    atualizado_em: updatedAt,
  }, 'conversas');

  const Message = define('Message', {
    id,
    conversa_id: { type: DataTypes.BIGINT, allowNull: false },
    remetente_id: { type: DataTypes.BIGINT, allowNull: false },
    conteudo: { type: DataTypes.TEXT, allowNull: false },
    criado_em: createdAt,
    ativo: { type: DataTypes.BOOLEAN, allowNull: false },
  }, 'mensagens');

  const ConversationRead = define('ConversationRead', {
    conversa_id: { type: DataTypes.BIGINT, primaryKey: true },
    utilizador_id: { type: DataTypes.BIGINT, primaryKey: true },
    ultima_mensagem_id: DataTypes.BIGINT,
    atualizado_em: updatedAt,
  }, 'conversas_leituras');

  const Document = define('Document', {
    id,
    cliente_id: { type: DataTypes.BIGINT, allowNull: false },
    categoria: { type: DataTypes.STRING(30), allowNull: false },
    titulo: { type: DataTypes.STRING(180), allowNull: false },
    descricao: DataTypes.TEXT,
    nome_ficheiro_original: { type: DataTypes.STRING(255), allowNull: false },
    nome_ficheiro_guardado: { type: DataTypes.STRING(255), allowNull: false },
    caminho_ficheiro: { type: DataTypes.STRING(500), allowNull: false },
    tipo_mime: { type: DataTypes.STRING(120), allowNull: false },
    tamanho_bytes: { type: DataTypes.BIGINT, allowNull: false },
    hash_sha256: { type: DataTypes.STRING(64), allowNull: false },
    privado: { type: DataTypes.BOOLEAN, allowNull: false },
    submetido_por: DataTypes.BIGINT,
    submetido_em: { type: DataTypes.DATE, allowNull: false },
    ativo: { type: DataTypes.BOOLEAN, allowNull: false },
    estado: { type: DataTypes.STRING(30), allowNull: false },
    versao: { type: DataTypes.STRING(40), allowNull: false },
    data_documento: DataTypes.DATEONLY,
    documento_anterior_id: DataTypes.BIGINT,
    revisto_por: DataTypes.BIGINT,
    revisto_em: DataTypes.DATE,
    atualizado_em: updatedAt,
  }, 'documentos');

  const DocumentReview = define('DocumentReview', {
    id,
    documento_id: { type: DataTypes.BIGINT, allowNull: false },
    estado_anterior: DataTypes.STRING(30),
    estado_novo: { type: DataTypes.STRING(30), allowNull: false },
    observacao: DataTypes.TEXT,
    autor_id: { type: DataTypes.BIGINT, allowNull: false },
    criado_em: createdAt,
  }, 'documentos_revisoes');

  const RequestStatus = define('RequestStatus', {
    id: smallId,
    codigo: { type: DataTypes.STRING(30), allowNull: false },
    nome: { type: DataTypes.STRING(80), allowNull: false },
    estado_final: { type: DataTypes.BOOLEAN, allowNull: false },
    ordem: { type: DataTypes.SMALLINT, allowNull: false },
  }, 'estados_pedidos');

  const Request = define('Request', {
    id,
    cliente_id: { type: DataTypes.BIGINT, allowNull: false },
    criado_por: { type: DataTypes.BIGINT, allowNull: false },
    atribuido_a: DataTypes.BIGINT,
    estado_id: { type: DataTypes.SMALLINT, allowNull: false },
    assunto: { type: DataTypes.STRING(180), allowNull: false },
    descricao: { type: DataTypes.TEXT, allowNull: false },
    prioridade: { type: DataTypes.STRING(20), allowNull: false },
    criado_em: createdAt,
    atualizado_em: updatedAt,
    resolvido_em: DataTypes.DATE,
    fechado_em: DataTypes.DATE,
  }, 'pedidos');

  const ExcelImport = define('ExcelImport', {
    id,
    cliente_id: { type: DataTypes.BIGINT, allowNull: false },
    tipo: { type: DataTypes.STRING(20), allowNull: false },
    nome_ficheiro_original: { type: DataTypes.STRING(255), allowNull: false },
    caminho_ficheiro: { type: DataTypes.STRING(500), allowNull: false },
    estado: { type: DataTypes.STRING(20), allowNull: false },
    total_linhas: { type: DataTypes.INTEGER, allowNull: false },
    linhas_importadas: { type: DataTypes.INTEGER, allowNull: false },
    linhas_rejeitadas: { type: DataTypes.INTEGER, allowNull: false },
    importado_por: DataTypes.BIGINT,
    importado_em: { type: DataTypes.DATE, allowNull: false },
  }, 'importacoes_excel');

  const ImportRow = define('ImportRow', {
    id,
    importacao_id: { type: DataTypes.BIGINT, allowNull: false },
    numero_linha: { type: DataTypes.INTEGER, allowNull: false },
    estado: { type: DataTypes.STRING(20), allowNull: false },
    erro: DataTypes.TEXT,
    dados: { type: DataTypes.JSONB, allowNull: false },
    criado_em: { type: DataTypes.DATE, allowNull: false },
  }, 'linhas_importacao');

  const ActivityLog = define('ActivityLog', {
    id,
    utilizador_id: DataTypes.BIGINT,
    acao: { type: DataTypes.STRING(80), allowNull: false },
    entidade: { type: DataTypes.STRING(80), allowNull: false },
    entidade_id: DataTypes.BIGINT,
    detalhes: { type: DataTypes.JSONB, allowNull: false },
    endereco_ip: DataTypes.INET,
    criado_em: createdAt,
  }, 'logs_atividade');

  const SystemConfiguration = define('SystemConfiguration', {
    id,
    chave: { type: DataTypes.STRING, allowNull: false },
    valor: { type: DataTypes.STRING, allowNull: false },
    descricao: DataTypes.STRING,
    atualizado_por: DataTypes.BIGINT,
    criado_em: createdAt,
    atualizado_em: updatedAt,
  }, 'configuracoes_sistema');

  const SiteContent = define('SiteContent', {
    id,
    // Campos confirmados no contrato Django/SQL existente. Não usar um
    // genérico `conteudo`: o esquema tem subtitulo, corpo e imagem_url.
    chave: { type: DataTypes.STRING(80), allowNull: false },
    titulo: { type: DataTypes.STRING(180), allowNull: false },
    subtitulo: DataTypes.STRING(240),
    corpo: DataTypes.TEXT,
    imagem_url: DataTypes.STRING(500),
    ativo: { type: DataTypes.BOOLEAN, allowNull: false },
    ordem: { type: DataTypes.INTEGER, allowNull: false },
    atualizado_por: DataTypes.BIGINT,
    criado_em: createdAt,
    atualizado_em: updatedAt,
  }, 'conteudos_site');

  const News = define('News', {
    id,
    titulo: { type: DataTypes.STRING(180), allowNull: false },
    resumo: { type: DataTypes.STRING(500), allowNull: false },
    corpo: { type: DataTypes.TEXT, allowNull: false },
    imagem_url: DataTypes.STRING(500),
    autor_id: DataTypes.BIGINT,
    publicada: { type: DataTypes.BOOLEAN, allowNull: false },
    publicada_em: DataTypes.DATE,
    criado_em: createdAt,
    atualizado_em: updatedAt,
    ativo: { type: DataTypes.BOOLEAN, allowNull: false },
  }, 'noticias');

  const ContactMessage = define('ContactMessage', {
    id,
    nome: { type: DataTypes.STRING(120), allowNull: false },
    email: { type: DataTypes.STRING(254), allowNull: false },
    telefone: DataTypes.STRING(30),
    empresa: DataTypes.STRING(160),
    assunto: { type: DataTypes.STRING(180), allowNull: false },
    mensagem: { type: DataTypes.TEXT, allowNull: false },
    estado: { type: DataTypes.STRING(20), allowNull: false },
    respondida_por: DataTypes.BIGINT,
    criado_em: createdAt,
    respondida_em: DataTypes.DATE,
  }, 'mensagens_contacto');

  User.belongsTo(Profile, { foreignKey: 'perfil_id', as: 'perfil' });
  Profile.hasMany(User, { foreignKey: 'perfil_id', as: 'utilizadores' });
  User.belongsToMany(Client, { through: UserClient, foreignKey: 'utilizador_id', otherKey: 'cliente_id', as: 'clientes' });
  Client.belongsToMany(User, { through: UserClient, foreignKey: 'cliente_id', otherKey: 'utilizador_id', as: 'utilizadores' });
  UserClient.belongsTo(User, { foreignKey: 'utilizador_id', as: 'utilizador' });
  UserClient.belongsTo(Client, { foreignKey: 'cliente_id', as: 'cliente' });
  Client.hasMany(ClientContact, { foreignKey: 'cliente_id', as: 'contactos' });
  ClientContact.belongsTo(Client, { foreignKey: 'cliente_id', as: 'cliente' });
  Client.hasMany(RiskAssessment, { foreignKey: 'cliente_id', as: 'avaliacoes' });
  RiskAssessment.belongsTo(Client, { foreignKey: 'cliente_id', as: 'cliente' });
  RiskAssessment.belongsTo(ConformityStatus, { foreignKey: 'estado_conformidade_id', as: 'estadoConformidade' });
  Client.hasMany(Asset, { foreignKey: 'cliente_id', as: 'ativos' });
  Asset.belongsTo(Client, { foreignKey: 'cliente_id', as: 'cliente' });
  Client.hasMany(Incident, { foreignKey: 'cliente_id', as: 'incidentes' });
  Incident.belongsTo(Client, { foreignKey: 'cliente_id', as: 'cliente' });
  User.hasMany(Notification, { foreignKey: 'utilizador_id', as: 'notificacoes' });
  Notification.belongsTo(User, { foreignKey: 'utilizador_id', as: 'utilizador' });
  Client.hasMany(Notification, { foreignKey: 'cliente_id', as: 'notificacoes' });
  Notification.belongsTo(Client, { foreignKey: 'cliente_id', as: 'cliente' });
  Incident.hasMany(Notification, { foreignKey: 'incidente_id', as: 'notificacoes' });
  Notification.belongsTo(Incident, { foreignKey: 'incidente_id', as: 'incidente' });
  Client.hasMany(Conversation, { foreignKey: 'cliente_id', as: 'conversas' });
  Conversation.belongsTo(Client, { foreignKey: 'cliente_id', as: 'cliente' });
  Conversation.hasMany(Message, { foreignKey: 'conversa_id', as: 'mensagens' });
  Message.belongsTo(Conversation, { foreignKey: 'conversa_id', as: 'conversa' });
  User.hasMany(Message, { foreignKey: 'remetente_id', as: 'mensagensEnviadas' });
  Message.belongsTo(User, { foreignKey: 'remetente_id', as: 'remetente' });
  Conversation.hasMany(ConversationRead, { foreignKey: 'conversa_id', as: 'leituras' });
  ConversationRead.belongsTo(Conversation, { foreignKey: 'conversa_id', as: 'conversa' });
  User.hasMany(ConversationRead, { foreignKey: 'utilizador_id', as: 'leiturasConversa' });
  ConversationRead.belongsTo(User, { foreignKey: 'utilizador_id', as: 'utilizador' });
  ConversationRead.belongsTo(Message, { foreignKey: 'ultima_mensagem_id', as: 'ultimaMensagem' });
  Client.hasMany(Document, { foreignKey: 'cliente_id', as: 'documentos' });
  Document.belongsTo(Client, { foreignKey: 'cliente_id', as: 'cliente' });
  User.hasMany(Document, { foreignKey: 'submetido_por', as: 'documentosSubmetidos' });
  Document.belongsTo(User, { foreignKey: 'submetido_por', as: 'submetidoPor' });
  User.hasMany(Document, { foreignKey: 'revisto_por', as: 'documentosRevistos' });
  Document.belongsTo(User, { foreignKey: 'revisto_por', as: 'revistoPor' });
  Document.belongsTo(Document, { foreignKey: 'documento_anterior_id', as: 'documentoAnterior' });
  Document.hasMany(Document, { foreignKey: 'documento_anterior_id', as: 'versoesSeguintes' });
  Document.hasMany(DocumentReview, { foreignKey: 'documento_id', as: 'revisoes' });
  DocumentReview.belongsTo(Document, { foreignKey: 'documento_id', as: 'documento' });
  User.hasMany(DocumentReview, { foreignKey: 'autor_id', as: 'revisoesDocumentos' });
  DocumentReview.belongsTo(User, { foreignKey: 'autor_id', as: 'autor' });
  Document.hasMany(Notification, { foreignKey: 'documento_id', as: 'notificacoes' });
  Notification.belongsTo(Document, { foreignKey: 'documento_id', as: 'documento' });
  SystemConfiguration.belongsTo(User, { foreignKey: 'atualizado_por', as: 'atualizadoPor' });
  User.hasMany(SystemConfiguration, { foreignKey: 'atualizado_por', as: 'configuracoesAtualizadas' });
  Client.hasMany(Request, { foreignKey: 'cliente_id', as: 'pedidos' });
  Request.belongsTo(Client, { foreignKey: 'cliente_id', as: 'cliente' });
  Request.belongsTo(RequestStatus, { foreignKey: 'estado_id', as: 'estado' });
  Request.belongsTo(User, { foreignKey: 'criado_por', as: 'criadoPor' });
  Request.belongsTo(User, { foreignKey: 'atribuido_a', as: 'atribuidoA' });
  Client.hasMany(ExcelImport, { foreignKey: 'cliente_id', as: 'importacoesExcel' });
  ExcelImport.belongsTo(Client, { foreignKey: 'cliente_id', as: 'cliente' });
  User.hasMany(ExcelImport, { foreignKey: 'importado_por', as: 'importacoesExcel' });
  ExcelImport.belongsTo(User, { foreignKey: 'importado_por', as: 'importadoPor' });
  ExcelImport.hasMany(ImportRow, { foreignKey: 'importacao_id', as: 'linhas' });
  ImportRow.belongsTo(ExcelImport, { foreignKey: 'importacao_id', as: 'importacao' });
  ExcelImport.hasMany(Asset, { foreignKey: 'importacao_id', as: 'ativos' });
  Asset.belongsTo(ExcelImport, { foreignKey: 'importacao_id', as: 'importacao' });
  ExcelImport.hasMany(Incident, { foreignKey: 'importacao_id', as: 'incidentes' });
  Incident.belongsTo(ExcelImport, { foreignKey: 'importacao_id', as: 'importacao' });
  SiteContent.belongsTo(User, { foreignKey: 'atualizado_por', as: 'atualizadoPor' });
  News.belongsTo(User, { foreignKey: 'autor_id', as: 'autor' });
  ContactMessage.belongsTo(User, { foreignKey: 'respondida_por', as: 'respondidaPor' });

  models = {
    sequelize, Profile, User, Client, UserClient, ClientContact, ConformityStatus,
    RiskAssessment, Asset, Incident, Notification, Conversation, Message, ConversationRead,
    Document, DocumentReview, RequestStatus, Request, ExcelImport, ImportRow, ActivityLog, SystemConfiguration,
    SiteContent, News, ContactMessage,
  };
  return models;
}
