import { z } from "zod";
import { router, authedProcedure } from "../trpc";

// Org-scoped workspace console. All procedures are RBAC-gated inside the tenancy service
// (member:invite to view/rename, org:delete to delete).
export const adminRouter = router({
  settings: authedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(({ ctx, input }) => ctx.container.tenancy.workspaceSettings(ctx.user.id, input)),
  rename: authedProcedure
    .input(z.object({ organizationId: z.string(), name: z.string().min(1).max(80) }))
    .mutation(({ ctx, input }) =>
      ctx.container.tenancy.renameOrganization(ctx.user.id, {
        organizationId: input.organizationId,
        name: input.name,
      }),
    ),
  deleteWorkspace: authedProcedure
    .input(z.object({ organizationId: z.string() }))
    .mutation(({ ctx, input }) =>
      ctx.container.tenancy.deleteOrganization(ctx.user.id, { organizationId: input.organizationId }),
    ),
});
