export function requireServerEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export function assertCoreServerConfig() {
  requireServerEnv('NEXT_PUBLIC_SUPABASE_URL')
  requireServerEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
}
