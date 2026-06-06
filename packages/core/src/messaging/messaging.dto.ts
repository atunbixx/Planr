import { z } from "zod";
import type { AnnouncementWrite } from "../ports/repositories";

export const announcementInput = z.object({
  title: z.string().trim().min(1).max(120),
  body: z.string().trim().min(1).max(4000),
});

export type AnnouncementInput = z.input<typeof announcementInput>;
type AnnouncementParsed = z.output<typeof announcementInput>;

export function toAnnouncementWrite(input: AnnouncementParsed): AnnouncementWrite {
  return { title: input.title, body: input.body };
}

export function toAnnouncementPatch(input: Partial<AnnouncementParsed>): Partial<AnnouncementWrite> {
  const patch: Partial<AnnouncementWrite> = {};
  if (input.title !== undefined) patch.title = input.title;
  if (input.body !== undefined) patch.body = input.body;
  return patch;
}
