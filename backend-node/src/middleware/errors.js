export function notFound(_request, response) {
  response.status(404).json({ erro: 'Rota não encontrada.' });
}

export function errorHandler(error, _request, response, _next) {
  if (error?.code === 'DATABASE_NOT_CONFIGURED') {
    return response.status(503).json({ erro: 'Base de dados de testes não configurada.' });
  }
  if (error?.name === 'SequelizeConnectionError') {
    return response.status(503).json({ erro: 'Não foi possível ligar à base de dados de testes.' });
  }
  if (error?.name === 'SequelizeUniqueConstraintError') {
    return response.status(409).json({ erro: 'Já existe um registo com estes dados.' });
  }
  if (error?.name === 'SequelizeValidationError') {
    return response.status(400).json({ erro: 'Dados inválidos.' });
  }
  if (error?.status && Number.isInteger(error.status)) {
    return response.status(error.status).json({ erro: error.message || 'Pedido inválido.' });
  }

  console.error('Erro não tratado na API Node:', error);
  return response.status(500).json({ erro: 'Erro interno do servidor.' });
}

export function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}
