import { redirect } from 'next/navigation'

/** Server redirect avoids client-side navigation churn (can log "Connection closed" in some browsers). */
export default function Home() {
  redirect('/login')
}
