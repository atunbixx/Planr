import { router, publicProcedure, authedProcedure } from "../trpc";
import { onboardingRouter } from "./onboarding";
import { collaborationRouter } from "./collaboration";
import { organizationsRouter } from "./organizations";
import { eventsRouter } from "./events";
import { guestsRouter } from "./guests";
import { tasksRouter } from "./tasks";
import { budgetRouter } from "./budget";

// Composition root. Each feature owns its own router file (and its boundary Zod schema); this file
// only assembles them so adding a feature is "new file + one line here", never editing a monolith.
export const appRouter = router({
  me: publicProcedure.query(({ ctx }) => ctx.user),
  workspaces: router({
    list: authedProcedure.query(({ ctx }) => ctx.container.repos.orgs.listForUser(ctx.user.id)),
  }),
  onboarding: onboardingRouter,
  collaboration: collaborationRouter,
  organizations: organizationsRouter,
  events: eventsRouter,
  guests: guestsRouter,
  tasks: tasksRouter,
  budget: budgetRouter,
});

export type AppRouter = typeof appRouter;
