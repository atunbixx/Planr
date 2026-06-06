import { notFound } from "next/navigation";
import { getServerCaller } from "../../../../server/caller";
import { publicPhotoUrl } from "../../../../lib/storage";
import { Slideshow } from "../../../../components/slideshow";

export const dynamic = "force-dynamic";

export default async function SlideshowPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caller = await getServerCaller();
  const [site, photos] = await Promise.all([
    caller.website.getPublic({ slug }),
    caller.photos.publicBySlug({ slug }),
  ]);
  if (!site) notFound();

  const slides = photos.map((p) => ({ url: publicPhotoUrl(p.storagePath), caption: p.caption }));

  return (
    <main className="site site-slideshow" data-theme={site.website.theme}>
      <a className="back" href={`/e/${slug}`}>
        ← Back to {site.event.name}
      </a>
      <h1 className="site-title">Photos</h1>
      <Slideshow slides={slides} />
    </main>
  );
}
