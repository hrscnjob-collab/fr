'use client';

import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Loader2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
import { workerApi } from '@/lib/scn-api';
import { getApiErrorMessage } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';

/**
 * "Danger zone" card for the worker profile page.
 * Calls DELETE /api/worker/account, then signs the user out locally.
 */
export function DeleteAccountCard() {
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => workerApi.deleteAccount(),
    onSuccess: async () => {
      toast.success('Your account has been deleted');
      setOpen(false);
      // Clears the stored token/user and redirects to /login.
      await logout();
    },
    onError: (error) => toast.error(getApiErrorMessage(error, 'Could not delete your account')),
  });

  return (
    <>
      <Card className="bg-white dark:bg-slate-900 border border-red-100 dark:border-red-900/40 rounded-3xl p-5 sm:p-6 shadow-[0_8px_30px_rgb(0,0,0,0.02)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-bold text-red-600">Delete account</h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              You will be signed out immediately and will not be able to log in again with this account.
            </p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 text-xs font-bold"
            onClick={() => setOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete my account
          </Button>
        </div>
      </Card>

      <AlertDialog open={open} onOpenChange={(value) => !deleteMutation.isPending && setOpen(value)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete your account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate your account and sign you out. You will no longer be able to log in or apply
              to jobs with it. This cannot be undone from the website.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                // Keep the dialog open until the request finishes.
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
    </>
  );
}