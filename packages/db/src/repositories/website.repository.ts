import type {
  EventWebsiteRepository,
  EventWebsiteRecord,
  EventWebsitePatch,
} from "@planr/core";
import type { PrismaClient } from "../generated/client";

type Row = {
  id: string;
  organizationId: string;
  eventId: string;
  slug: string;
  published: boolean;
  theme: string;
  headline: string | null;
  welcomeMessage: string | null;
  story: string | null;
  scheduleText: string | null;
  travelText: string | null;
};

export class PrismaEventWebsiteRepository implements EventWebsiteRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: {
    organizationId: string;
    eventId: string;
    slug: string;
  }): Promise<EventWebsiteRecord> {
    const row = await this.prisma.eventWebsite.create({ data: input });
    return this.toRecord(row);
  }

  async getByEvent(input: {
    organizationId: string;
    eventId: string;
  }): Promise<EventWebsiteRecord | null> {
    const row = await this.prisma.eventWebsite.findFirst({
      where: { eventId: input.eventId, organizationId: input.organizationId },
    });
    return row ? this.toRecord(row) : null;
  }

  async getBySlug(slug: string): Promise<EventWebsiteRecord | null> {
    const row = await this.prisma.eventWebsite.findUnique({ where: { slug } });
    return row ? this.toRecord(row) : null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const row = await this.prisma.eventWebsite.findUnique({ where: { slug }, select: { id: true } });
    return row !== null;
  }

  async update(input: {
    organizationId: string;
    eventId: string;
    patch: EventWebsitePatch;
  }): Promise<EventWebsiteRecord | null> {
    const result = await this.prisma.eventWebsite.updateMany({
      where: { eventId: input.eventId, organizationId: input.organizationId },
      data: input.patch,
    });
    if (result.count === 0) return null;
    return this.getByEvent({ organizationId: input.organizationId, eventId: input.eventId });
  }

  private toRecord(row: Row): EventWebsiteRecord {
    return {
      id: row.id,
      organizationId: row.organizationId,
      eventId: row.eventId,
      slug: row.slug,
      published: row.published,
      theme: row.theme,
      headline: row.headline,
      welcomeMessage: row.welcomeMessage,
      story: row.story,
      scheduleText: row.scheduleText,
      travelText: row.travelText,
    };
  }
}
