import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../../../../../server/auth";
import { getServerCaller } from "../../../../../../../server/caller";
import { publicPhotoUrl } from "../../../../../../../lib/storage";
import { removePhotoAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function PhotosPage({
  params,
}: {
  params: Promise<{ orgId: string; eventId: string }>;
}) {
  const { orgId, eventId } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/sign-in");
  const photos = await (await getServerCaller()).photos.list({ eventId });

  return (
    <main>
      <a className="back" href={`/dashboard/org/${orgId}/event/${eventId}`}>
        ← Event
      </a>
      <p className="eyebrow">Photos</p>
      <h1>Shared gallery</h1>
      <p className="rsvphint">
        Guests add photos from their RSVP link. Published, they appear on your event site&apos;s slideshow.
      </p>

      {photos.length === 0 ? (
        <p className="empty">No photos yet — they&apos;ll show here as guests upload them.</p>
      ) : (
        <ul className="photogrid">
          {photos.map((p) => (
            <li key={p.id} data-photo={p.id}>
              <img src={publicPhotoUrl(p.storagePath)} alt={p.caption ?? "Guest photo"} loading="lazy" />
              {p.caption ? <span className="pcap">{p.caption}</span> : null}
              <form action={removePhotoAction}>
                <input type="hidden" name="eventId" value={eventId} />
                <input type="hidden" name="orgId" value={orgId} />
                <input type="hidden" name="photoId" value={p.id} />
                <button type="submit" className="ghost premove" aria-label="Remove photo">
                  ✕
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
