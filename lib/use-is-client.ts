import { useSyncExternalStore } from 'react'

/** True after client mount; false on server (avoids localStorage SSR mismatch). */
export function useIsClient(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}
