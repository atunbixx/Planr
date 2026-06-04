import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "../../../../server/routers/app";
import { makeContext } from "../../../../server/trpc";
import { getCurrentUser } from "../../../../server/auth";

const handler = async (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async () => makeContext(await getCurrentUser()),
  });

export { handler as GET, handler as POST };
