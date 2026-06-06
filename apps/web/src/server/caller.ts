import { appRouter } from "./routers/app";
import { makeContext } from "./trpc";
import { getCurrentUser } from "./auth";

/** An authed tRPC caller bound to the current request's user (or null). */
export async function getServerCaller(): Promise<ReturnType<typeof appRouter.createCaller>> {
  return appRouter.createCaller(makeContext(await getCurrentUser()));
}
