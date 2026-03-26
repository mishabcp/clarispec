import { Sidebar } from '@/components/dashboard/Sidebar'
import { ToastProvider } from '@/components/ui/toast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <div className="flex h-screen">
        <Sidebar />
        <main className="flex-1 overflow-y-auto bg-navy">
          <div className="p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
