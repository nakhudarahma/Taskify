import { useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const REOPEN_REASONS = [
  "Marked by mistake",
  "Task incomplete",
  "Requirements changed",
] as const;

export type ReopenReason = typeof REOPEN_REASONS[number];

interface ReopenTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: ReopenReason) => void;
  taskTitle: string;
}

const ReopenTaskDialog = ({
  open,
  onOpenChange,
  onConfirm,
  taskTitle,
}: ReopenTaskDialogProps) => {
  const [reason, setReason] = useState<ReopenReason | "">("");

  const handleConfirm = () => {
    if (reason) {
      onConfirm(reason as ReopenReason);
      setReason("");
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) setReason("");
    onOpenChange(newOpen);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent className="glass-card">
        <AlertDialogHeader>
          <AlertDialogTitle>Reopen Task</AlertDialogTitle>
          <AlertDialogDescription className="text-sm text-muted-foreground leading-relaxed">
            Reopening "{taskTitle}" has consequences. Your streak confidence will be reduced, 
            and you will not be able to re-complete this task immediately. Select a reason to proceed.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2 py-2">
          <Label>Reason for reopening</Label>
          <Select value={reason} onValueChange={(v) => setReason(v as ReopenReason)}>
            <SelectTrigger className="bg-secondary/50">
              <SelectValue placeholder="Select a reason" />
            </SelectTrigger>
            <SelectContent>
              {REOPEN_REASONS.map((r) => (
                <SelectItem key={r} value={r}>{r}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} disabled={!reason}>
            Reopen Task
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default ReopenTaskDialog;
