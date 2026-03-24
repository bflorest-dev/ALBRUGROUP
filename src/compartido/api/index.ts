export { authHttp, rrhhHttp, http, type ApiError } from './clienteHttp';
export { BaseService, type RepositoryMethod, type DataAdapter } from './servicioBase';

// Re-exportar repositories desde src/repositories
export * from '../../repositories/index';
