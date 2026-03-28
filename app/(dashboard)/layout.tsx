import { Sidebar } from '@/components/dashboard/Sidebar'
import { ToastProvider } from '@/components/ui/toast'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-transparent">
        <Sidebar />
        <main className="flex-1 flex flex-col min-w-0 md:pl-[300px] relative z-10">
          <div className="p-3 md:p-6 lg:p-8 pt-20 md:pt-8 w-full mx-auto max-w-[1600px]">
            {children}
          </div>
        </main>
      </div>
    </ToastProvider>
  )
}
