import { createBrowserClient } from "@supabase/ssr"

let client: ReturnType<typeof createBrowserClient> | null = null

export function createClient() {
  if (client) return client

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to your .env.local file.",
    )
  }

  client = createBrowserClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: true, // Persist session across browser tabs and devices
      autoRefreshToken: true, // Auto-refresh tokens for long-running sessions
      detectSessionInUrl: true, // Handle auth redirects properly
      flowType: "pkce", // Enhanced security for auth flow
    },
    realtime: {
      params: {
        eventsPerSecond: 10, // Allow more real-time events for faster sync
      },
    },
  })
  return client
}
