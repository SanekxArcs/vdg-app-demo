import { FC, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// Define a minimal Transaction type (expand as needed)
interface Transaction {
  _id: string;
  // other transaction properties can be added here
}

// Props for the confirmation dialog component
interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onConfirm: (transactionId: string) => void;
}

export const ConfirmDeleteDialog: FC<ConfirmDeleteDialogProps> = ({
  isOpen,
  onClose,
  transaction,
  onConfirm,
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Handle confirmation: check if the password matches before calling onConfirm
  const handleConfirm = () => {
    if (password === "1234567890") {
      if (transaction) {
        onConfirm(transaction._id);
      }
      setPassword("");
      setError("");
    } else {
      setError("Incorrect password.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Confirm Delete</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this transaction?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="delete-password">Enter Password</Label>
          <Input
            id="delete-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>
        <DialogFooter>
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setPassword("");
                onClose();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm}>Delete</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmDeleteDialog;
