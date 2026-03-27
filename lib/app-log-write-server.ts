import 'server-only'
import { headers } from 'next/headers'
import {
  ingestAppLogPayload,
  type AppLogLevel,
} from '@/lib/app-log-ingest'

function releaseTag(): string | null {
  return (
    process.env.VERCEL_GIT_COMMIT_SHA ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ??
    null
  )
}

export async function writeAppLogServer(
  level: AppLogLevel,
  message: string,
  context?: Record<string, unknown>,
  path?: string
): Promise<void> {
  const h = await headers()
  await ingestAppLogPayload({
    source: 'server',
    level,
    message,
    context,
    path: path ?? null,
    user_agent: h.get('user-agent'),
    release: releaseTag(),
    user_id: null,
  })
}
