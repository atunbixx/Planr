import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { NotFoundError, ForbiddenError, type UserRecord } from "@planr/core";
import { container, type Container } from "./container";

export interface TrpcContext {
  user: UserRecord | null;
  container: Container;
}

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

const mapErrors = t.middleware(async ({ next }) => {
  try {
    return await next();
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw new TRPCError({ code: "NOT_FOUND", message: err.message, cause: err });
    }
    if (err instanceof ForbiddenError) {
      throw new TRPCError({ code: "FORBIDDEN", message: err.message, cause: err });
    }
    throw err;
  }
});

export const router = t.router;
export const publicProcedure = t.procedure.use(mapErrors);
export const authedProcedure = t.procedure.use(mapErrors).use(({ ctx, next }) => {
  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx: { ...ctx, user: ctx.user } });
});

export function makeContext(user: UserRecord | null): TrpcContext {
  return { user, container };
}
