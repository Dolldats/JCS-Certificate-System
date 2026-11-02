export function AuthTransitionLoading({ title }: { title: string }) {
  return (
    <div className="app-background flex min-h-screen w-full items-center justify-center" role="status" aria-label={title}>
      <div className="glass-surface flex min-w-56 flex-col items-center rounded-2xl px-8 py-7 text-center shadow-2xl">
        <div className="login-logo-loader relative mb-4 grid h-[76px] w-[76px] place-items-center">
          <span aria-hidden="true" className="login-logo-loader__ring absolute inset-0 rounded-full border-[3px] border-emerald-100 border-t-emerald-600" />
          <span aria-hidden="true" className="absolute inset-[7px] rounded-full bg-emerald-500/10" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/ahmadiyyah_logo.png" alt="" className="relative z-10 h-11 w-11 rounded-full object-contain" />
        </div>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{title}</p>
      </div>
    </div>
  );
}
