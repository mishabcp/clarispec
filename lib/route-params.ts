/**
 * Next.js 16+ types dynamic route `params` as `Promise<{ ... }>` for route handlers.
 */
export async function projectIdFromParams(
  params: Promise<{ projectId: string }>
): Promise<string> {
  const { projectId } = await params
  return projectId
}
