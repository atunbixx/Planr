import type { InvitationRepository, InvitationRecord } from "@planr/core";
import type { Role, InvitationStatus } from "@planr/core";
import type { PrismaClient } from "../generated/client";

function toRecord(row: {
  id: string;
  organizationId: string;
  email: string;
  role: string;
  token: string;
  status: string;
  invitedByUserId: string;
}): InvitationRecord {
  return {
    id: row.id,
    organizationId: row.organizationId,
    email: row.email,
    role: row.role as Role,
    token: row.token,
    status: row.status as InvitationStatus,
    invitedByUserId: row.invitedByUserId,
  };
}

export class PrismaInvitationRepository implements InvitationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: {
    organizationId: string;
    email: string;
    role: Role;
    token: string;
    invitedByUserId: string;
  }): Promise<InvitationRecord> {
    const row = await this.prisma.invitation.create({ data: input });
    return toRecord(row);
  }

  async findByToken(token: string): Promise<InvitationRecord | null> {
    const row = await this.prisma.invitation.findUnique({ where: { token } });
    return row ? toRecord(row) : null;
  }

  async findPending(input: {
    organizationId: string;
    email: string;
  }): Promise<InvitationRecord | null> {
    const row = await this.prisma.invitation.findFirst({
      where: { organizationId: input.organizationId, email: input.email, status: "pending" },
    });
    return row ? toRecord(row) : null;
  }

  async listPendingByEmail(email: string): Promise<InvitationRecord[]> {
    const rows = await this.prisma.invitation.findMany({ where: { email, status: "pending" } });
    return rows.map(toRecord);
  }

  async listPendingByOrganization(organizationId: string): Promise<InvitationRecord[]> {
    const rows = await this.prisma.invitation.findMany({
      where: { organizationId, status: "pending" },
      orderBy: { createdAt: "asc" },
    });
    return rows.map(toRecord);
  }

  async setStatus(input: { id: string; status: InvitationStatus }): Promise<void> {
    await this.prisma.invitation.update({
      where: { id: input.id },
      data: { status: input.status },
    });
  }
}
