import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import { AuthSplitShell } from '../../components/auth/AuthSplitShell';
import { Button } from '../../components/ui/Button';

export default function SignupPage() {
  return (
    <AuthSplitShell>
      <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
        <ShieldCheck className="h-5 w-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 text-center text-base font-bold tracking-tight text-slate-900">
        Account setup
      </h2>
      <p className="mt-2 text-center text-xs leading-relaxed text-slate-500">
        Jama&apos;at administrator accounts are provisioned by a system administrator. Contact your administrator to have your Member ID assigned, then sign in here.
      </p>
      <Link href="/login" className="mt-6 block">
        <Button type="button" className="w-full" size="md" rightIcon={<ArrowRight className="h-4 w-4" />}>
          Go to sign in
        </Button>
      </Link>
    </AuthSplitShell>
  );
}
