import { AuditLogsAdminRepository } from './audit-logs.repository';
import type { getAuditLogsSchema } from './audit-logs.dto';
import type { z } from 'zod';

type GetAuditLogsFilters = z.infer<typeof getAuditLogsSchema>;

export class AuditLogsAdminService {
  private repository: AuditLogsAdminRepository;

  constructor() {
    this.repository = new AuditLogsAdminRepository();
  }

  async getAuditLogs(filters: GetAuditLogsFilters) {
    return this.repository.findMany(filters);
  }
}
