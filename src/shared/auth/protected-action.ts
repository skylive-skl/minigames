import { dispatchAuthDialogOpen } from '@/shared/lib/app-events';
import type { AppSession } from './app-session';
import { DialogMode } from '@/shared/types/ui';
import { showSnackbar } from '@/shared/ui/snackbar/snackbar';
import { ensureActiveSession, getActiveSession } from './session-store';

// Gate for favorite / comment / like requests. Without a valid session the
// request must not be sent: Auth is opened instead (Game Details keeps its
// URL state and comes back when Auth closes). The action is never replayed.
export function requireSession(guestWarning: string): AppSession | undefined {
  const wasSignedIn = getActiveSession() !== undefined;
  const session = ensureActiveSession();

  if (session !== undefined) {
    return session;
  }

  // An expired session already announced itself; a guest gets the warning.
  if (!wasSignedIn) {
    showSnackbar({ message: guestWarning, variant: 'warning' });
  }
  dispatchAuthDialogOpen(DialogMode.Login);
  return undefined;
}
