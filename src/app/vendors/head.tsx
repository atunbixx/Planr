import type { Metadata } from 'next'

export default function Head() {
  const base = process.env.NEXT_PUBLIC_BASE_URL || ''
  const title = 'Vendor Directory — Find Wedding Vendors'
  const description = 'Browse wedding vendors by category and region. Compare ratings, pricing, and get quotes.'
  const url = `${base}/vendors`
  const image = `${base}/og/vendors.svg`
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={image} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
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
                item: url,
              },
            ],
          }),
        }}
      />
    </>
  )
}
