import { useState } from "react";
import { Lock } from "lucide-react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";

interface PasswordConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirmed: () => void;
}

const PasswordConfirmDialog = ({
  open,
  onOpenChange,
  onConfirmed,
}: PasswordConfirmDialogProps) => {
  const { user, signIn } = useAuth();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const handleConfirm = async () => {
    if (!password.trim()) {
      setError("Password is required.");
      return;
    }

    setVerifying(true);
    setError("");

    try {
      if (!user?.email) {
        setError("Unable to verify identity. Session expired.");
        setVerifying(false);
        return;
      }

      const { error: signInError } = await signIn({
        email: user.email,
        password,
      });

      if (signInError) {
        setError("Incorrect password. Changes denied.");
        setVerifying(false);
        return;
      }

      setPassword("");
      setError("");
      onConfirmed();
    } catch {
      setError("Verification failed. Try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleCancel = () => {
    setPassword("");
    setError("");
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Lock className="w-5 h-5 text-foreground" />
            </div>
            <AlertDialogTitle className="text-lg">Confirm Identity</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            Enter your password to apply personality changes.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Password</Label>
            <Input
              id="confirm-password"
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !verifying) handleConfirm();
              }}
              placeholder="Enter your password"
              className="bg-secondary/50"
              autoFocus
            />
          </div>
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Cancel</AlertDialogCancel>
          <Button
            onClick={handleConfirm}
            disabled={verifying || !password.trim()}
            className="bg-primary text-primary-foreground hover:bg-primary/85"
          >
            {verifying ? (
              <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              "Confirm"
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PasswordConfirmDialog;
