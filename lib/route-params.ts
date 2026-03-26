/**
 * Next.js App Router may pass `params` as a plain object or a Promise.
 * Reading `params.projectId` without awaiting breaks dynamic API routes (undefined id → 404).
 */
export async function projectIdFromParams(
  params: { projectId: string } | Promise<{ projectId: string }>
): Promise<string> {
  const { projectId } = await Promise.resolve(params)
  return projectId
}
