import { redirect } from 'next/navigation'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // TODO: Add authentication check here
  // For now, we'll allow access (in production, check Supabase auth)
  
  return (
    <div className="min-h-screen bg-[#050505]">
      {children}
    </div>
  )
}

