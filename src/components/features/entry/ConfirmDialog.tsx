import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ConfirmDialogProps {
  open: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  message,
  confirmLabel = "破棄して戻る",
  cancelLabel = "編集を続ける",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>確認</DialogTitle>
          <DialogDescription className="mt-2">{message}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-row justify-center gap-3 mt-6">
          <Button variant="outline" onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button variant="default" onClick={onCancel}>
            {cancelLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
