import { redirect } from 'next/navigation'

export default function Home() {
  // Redirect to dashboard - clients should access via /dashboard?clientId=xxx
  redirect('/dashboard')
}


