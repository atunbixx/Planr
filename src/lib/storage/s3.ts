let client: any | null | undefined
let awsSdk: any | null | undefined

export function isS3Enabled() {
  return Boolean(process.env.AWS_S3_BUCKET && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && process.env.AWS_S3_REGION)
}

export function getS3(): any | null {
  if (!isS3Enabled()) return null
  if (client === undefined) {
    try {
      // Lazy import to avoid dependency requirement when not configured
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      awsSdk = require('@aws-sdk/client-s3')
      client = new awsSdk.S3Client({ region: process.env.AWS_S3_REGION })
    } catch (_) {
      client = null
    }
  }
  return client || null
}

export async function uploadBufferToS3(key: string, buffer: Buffer, contentType?: string) {
  const s3 = getS3()
  if (!s3) throw new Error('S3 not configured')
  const bucket = process.env.AWS_S3_BUCKET as string
  const { PutObjectCommand } = awsSdk || require('@aws-sdk/client-s3')
  await s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: buffer, ContentType: contentType }))
  return getPublicUrl(key)
}

export function getPublicUrl(key: string) {
  const base = process.env.AWS_S3_PUBLIC_URL_BASE
  if (base) return `${base.replace(/\/$/, '')}/${key}`
  const bucket = process.env.AWS_S3_BUCKET
  const region = process.env.AWS_S3_REGION
  return `https://${bucket}.s3.${region}.amazonaws.com/${key}`
}
