export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-8 sm:p-12 overflow-hidden font-sans">
      <div className="w-full max-w-[440px] relative z-10 opacity-0 animate-auth-shell">
        <div className="mb-16 text-center">
          <h1 className="text-[42px] font-extralight text-white uppercase font-heading leading-none opacity-0 animate-auth-title">
            Clarispec
          </h1>
        </div>

        <div className="relative bg-[#0a0a0b]/90 border border-white/[0.08] shadow-[0_48px_100px_-32px_rgba(0,0,0,0.9)] backdrop-blur-[64px] rounded-[1px]">
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/[0.15] to-transparent shadow-[0_1px_4px_rgba(255,255,255,0.05)]" />

          <div className="p-10 sm:p-14">
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}
