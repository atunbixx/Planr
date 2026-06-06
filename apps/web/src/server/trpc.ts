import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { NotFoundError, ForbiddenError, ValidationError, type UserRecord } from "@planr/core";
import { container, type Container } from "./container";

export interface TrpcContext {
  user: UserRecord | null;
  container: Container;
}

const t = initTRPC.context<TrpcContext>().create({ transformer: superjson });

// tRPC middleware `next()` resolves with `{ ok: false, error }` on a downstream throw rather than
// rejecting, and tRPC has already wrapped our domain error as a TRPCError with the original on
// `.cause`. So we inspect the result (not a try/catch) and remap by the cause's type.
const mapErrors = t.middleware(async ({ next }) => {
  const result = await next();
  if (!result.ok) {
    const cause = result.error.cause;
    if (cause instanceof NotFoundError) {
      throw new TRPCError({ code: "NOT_FOUND", message: cause.message, cause });
    }
    if (cause instanceof ForbiddenError) {
      throw new TRPCError({ code: "FORBIDDEN", message: cause.message, cause });
    }
    if (cause instanceof ValidationError) {
      throw new TRPCError({ code: "BAD_REQUEST", message: cause.message, cause });
    }
  }
  return result;
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
