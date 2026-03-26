export { client } from './client';

// Re-export repositories for easier access
export { EmployeeRepository } from './repositories/employee.repository';
export { ApplicantRepository } from './repositories/applicant.repository';
export { ContractRepository } from './repositories/contract.repository';

// Re-export HTTP clients
export { http } from './clienteHttp';
export * from './http';

