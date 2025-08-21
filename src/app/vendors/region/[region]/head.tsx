type Props = { params: { region: string } }

export default function Head({ params }: Props) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || ''
  const region = decodeURIComponent(params.region || '')
  const title = `Vendors in ${region} — Wedding Directory`
  const description = `Browse top wedding vendors in ${region}. Compare ratings and request quotes.`
  const url = `${base}/vendors/region/${encodeURIComponent(region)}`
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
                item: `${base}/vendors`,
              },
              {
                '@type': 'ListItem',
                position: 3,
                name: `Vendors in ${region}`,
                item: url,
              },
            ],
          }),
        }}
      />
    </>
  )
}
