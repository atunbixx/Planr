type Props = { params: { category: string } }

export default function Head({ params }: Props) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || ''
  const category = decodeURIComponent(params.category || '')
  const title = `${category.charAt(0).toUpperCase()+category.slice(1)} Vendors — Wedding Directory`
  const description = `Discover ${category} vendors. View ratings, pricing, photos, and request quotes.`
  const url = `${base}/vendors/category/${encodeURIComponent(category)}`
  const image = `${base}/og/category-${category.toLowerCase()}.svg`
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
                name: `${category.charAt(0).toUpperCase() + category.slice(1)} Vendors`,
                item: url,
              },
            ],
          }),
        }}
      />
    </>
  )
}
