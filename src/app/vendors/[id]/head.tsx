import { prisma } from '@/lib/db/prisma'

type Props = { params: { id: string } }

export default async function Head({ params }: Props) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || ''
  const id = params.id
  let title = 'Vendor — Wedding Directory'
  let description = 'View vendor details, ratings, and request a quote.'
  let image: string | undefined
  try {
    const v = await prisma.DirectoryVendor.findUnique({ where: { id } })
    if (v) {
      title = `${v.name} — ${v.category}${v.city || v.region ? ` in ${[v.city, v.region].filter(Boolean).join(', ')}` : ''}`
      description = v.shortDescription || v.description || description
      if (Array.isArray(v.photos) && v.photos.length > 0) image = v.photos[0] as any
    }
  } catch {}
  const url = `${base}/vendors/${encodeURIComponent(id)}`
  if (!image) image = `${base}/og/vendors.svg`
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      {image ? <meta property="og:image" content={image} /> : null}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image ? <meta name="twitter:image" content={image} /> : null}
      <link rel="canonical" href={url} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              {
                '@type': 'ListItem',
                position: 1,
                name: 'Home',
                item: `${base}/`,
              },
              {
                '@type': 'ListItem',
                position: 2,
                name: 'Wedding Vendors',
                item: `${base}/vendors`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: title.split(' — ')[0],
                item: url,
              },
            ],
          }),
        }}
      />
    </>
  );
}
