import { SignUp } from '@clerk/nextjs';

export default function RegisterPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden p-4">
      <div className="pointer-events-none absolute -left-20 top-16 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
      <SignUp
        path="/register"
        routing="path"
        signInUrl="/login"
        fallbackRedirectUrl="/dashboard"
        appearance={{
          elements: {
            card: 'glass-card border border-white/15 shadow-2xl bg-slate-900/85',
            headerTitle: 'text-slate-100',
            headerSubtitle: 'text-slate-300',
            socialButtonsBlockButton: 'border border-slate-500 bg-slate-800 text-white shadow-md shadow-slate-950/60 hover:border-indigo-400/70 hover:bg-slate-700',
            socialButtonsBlockButtonText: 'font-medium text-white',
            dividerLine: 'bg-slate-700',
            dividerText: 'text-slate-400',
            formFieldLabel: 'text-slate-300',
            formButtonPrimary: 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-lg',
            formFieldInput: 'bg-slate-900/70 border border-slate-700 text-slate-100 placeholder:text-slate-500',
            formFieldHintText: 'text-slate-400',
            formFieldErrorText: 'text-rose-300',
            footer: 'bg-transparent border-t border-slate-800',
            footerActionText: 'text-slate-300',
            footerActionLink: 'text-indigo-300 hover:text-indigo-200',
            identityPreviewText: 'text-slate-200',
            identityPreviewEditButton: 'text-indigo-300 hover:text-indigo-200',
          },
        }}
      />
    </div>
  );
}
