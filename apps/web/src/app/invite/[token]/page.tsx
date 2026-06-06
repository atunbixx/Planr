import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../server/auth";
import { getServerCaller } from "../../../server/caller";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const user = await getCurrentUser();
  if (!user) redirect(`/sign-in?next=/invite/${token}`);
  const orgId = await (await getServerCaller()).collaboration.acceptByToken({ token });
  redirect(`/dashboard?w=${orgId}`);
}
