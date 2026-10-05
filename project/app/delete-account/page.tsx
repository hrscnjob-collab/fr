'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation } from '@tanstack/react-query';
import { Eye, EyeOff, Loader2, LogIn, ShieldAlert, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { PublicNavbar } from '@/components/public-navbar';
import { PublicFooter } from '@/components/public-footer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/lib/auth-context';
import { authApi, workerApi } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';
import { LEGAL } from '@/lib/legal-config';

/**
 * Public "Delete your account" page  ->  /delete-account
 * Anyone can open it without logging in. A worker can sign in right here
 * and delete their account (DELETE /api/worker/account).
 */
export default function DeleteAccountPage() {
  const { user, isAuthenticated, isLoading, setSession, logout } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Enter your email and password.');
      return;
    }
    setSigningIn(true);
    try {
      const { token, user: authUser } = await authApi.login(email.trim(), password);
      if (authUser.role !== 'worker') {
        toast.error('Only job seeker (worker) accounts can be deleted from this page.');
        return;
      }
      // false = stay on this page instead of redirecting to the dashboard
      setSession(token, authUser, false);
      setPassword('');
    } catch (error) {
      toast.error(getApiErrorMessage(error, 'Invalid email or password'));
    } finally {
      setSigningIn(false);
    }
  };

  const deleteMutation = useMutation({
    mutationFn: () => workerApi.deleteAccount(),
    onSuccess: async () => {
      toast.success('Your account has been deleted');
      setConfirmOpen(false);
      await logout(); // clears the stored token and redirects to /login
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not delete your account')),
  });

  const isWorker = isAuthenticated && user?.role === 'worker';

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <PublicNavbar />

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12 sm:px-6">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight">Delete your {LEGAL.brand} account</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Job seekers can delete their {LEGAL.brand} account at any time using this page.
          </p>
        </div>

        <Card className="mb-6 p-5 sm:p-6">
          <h2 className="text-base font-bold">What happens when you delete your account</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-muted-foreground">
            <li>Your account is deactivated immediately and you are signed out.</li>
            <li>You will not be able to log in again or apply to jobs with this account.</li>
            <li>
              Profile and application records are kept in our system only so that recruiters&apos; hiring
              records stay intact; they are no longer accessible to you.
            </li>
            <li>
              To request complete erasure of your personal data, email{' '}
              <a href={`mailto:${LEGAL.emails.privacy}`} className="font-medium text-primary hover:underline">
                {LEGAL.emails.privacy}
              </a>{' '}
              from your registered email address. See our{' '}
              <Link href="/privacy" className="font-medium text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </li>
          </ul>
        </Card>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : isWorker ? (
          <Card className="border-red-200 p-5 sm:p-6 dark:border-red-900/40">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div className="flex-1">
                <h2 className="text-base font-bold text-red-600">Delete this account</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  You are signed in as <span className="font-semibold text-foreground">{user?.name}</span>
                  {user?.email ? ` (${user.email})` : ''}.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    className="bg-red-600 text-white hover:bg-red-700"
                    onClick={() => setConfirmOpen(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete my account
                  </Button>
                  <Button variant="outline" onClick={() => logout()}>
                    Not you? Sign out
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ) : (
          <Card className="p-5 sm:p-6">
            <h2 className="text-base font-bold">Sign in to continue</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Sign in with the account you want to delete.
            </p>
            {isAuthenticated && user?.role !== 'worker' && (
              <p className="mt-3 rounded-lg bg-amber-50 p-3 text-xs text-amber-800">
                You are signed in with a {user?.role} account. Only job seeker accounts can be deleted here.
              </p>
            )}
            <form onSubmit={handleSignIn} className="mt-4 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="del-email">Email</Label>
                <Input
                  id="del-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="del-password">Password</Label>
                <div className="relative">
                  <Input
                    id="del-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={signingIn}>
                {signingIn ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing in...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" /> Sign in
                  </>
                )}
              </Button>
            </form>
            <p className="mt-4 text-xs text-muted-foreground">
              Can&apos;t sign in? Email{' '}
              <a href={`mailto:${LEGAL.emails.support}`} className="font-medium text-primary hover:underline">
                {LEGAL.emails.support}
              </a>{' '}
              and we will help you delete your account.
            </p>
          </Card>
        )}
      </main>

      <PublicFooter />

      <AlertDialog open={confirmOpen} onOpenChange={(v) => !deleteMutation.isPending && setConfirmOpen(v)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              Your account will be deactivated and you will be signed out. You will no longer be able to log in
              or apply to jobs with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate();
              }}
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Deleting...
                </>
              ) : (
                'Yes, delete my account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}