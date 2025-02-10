"use client";

import { FC, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Define the types for a partner and transaction
interface Partner {
  _id: string;
  name: string;
  share?: number;
}

// Extend the possible shapes of partner data using the proper key "_type"
type PartnerReference = { _type: "reference"; _ref: string };

export interface Transaction {
  _id: string;
  description: string;
  amount: number;
  type: "expense" | "revenue";
  category: string;
  partner:
    | string
    | { _id: string; name?: string; share?: number }
    | PartnerReference
    | null;
  date: string;
}

// Define the component props
interface EditTransactionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  // Allow onSave to be async by returning Promise<void>
  onSave: (updatedTransaction: Transaction) => Promise<void>;
  partners: Partner[];
}

export const EditTransactionDialog: FC<EditTransactionDialogProps> = ({
  isOpen,
  onClose,
  transaction,
  onSave,
  partners,
}) => {
  // Local state for editing transaction fields
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "revenue">("expense");
  const [category, setCategory] = useState("");
  const [partner, setPartner] = useState("");
  const [date, setDate] = useState("");

  // Populate state fields when the transaction prop changes
  useEffect(() => {
    if (transaction) {
      setDescription(transaction.description);
      setAmount(transaction.amount.toString());
      setType(transaction.type);
      setCategory(transaction.category);
      // Check if partner is non-null before trying to access its properties
      if (transaction.partner != null) {
        if (typeof transaction.partner === "object") {
          if ("_id" in transaction.partner) {
            setPartner(transaction.partner._id);
          } else if ("_ref" in transaction.partner) {
            setPartner(transaction.partner._ref);
          } else {
            setPartner("");
          }
        } else {
          setPartner(transaction.partner);
        }
      } else {
        setPartner("");
      }
      // Convert ISO date to YYYY-MM-DD format
      setDate(new Date(transaction.date).toISOString().split("T")[0]);
    }
  }, [transaction]);

  // Prepare and send the updated transaction object to onSave
  const handleSave = () => {
    if (!transaction) return;
    const updatedTransaction: Transaction = {
      ...transaction,
      description,
      amount: parseFloat(amount),
      type,
      category,
      // Use the proper Sanity reference shape (with _type)
      partner: { _type: "reference", _ref: partner },
      date: new Date(date).toISOString(),
    };
    onSave(updatedTransaction);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-full">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Description Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Input
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          {/* Amount Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-amount">Amount</Label>
            <Input
              id="edit-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          {/* Type Field */}
          <div className="space-y-2">
            <Label>Type</Label>
            <Select
              value={type}
              onValueChange={(value: "expense" | "revenue") => setType(value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="revenue">Revenue</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Category Field */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="supplies">Supplies</SelectItem>
                <SelectItem value="project">Project</SelectItem>
                <SelectItem value="salary">Salary</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Partner Field */}
          <div className="space-y-2">
            <Label>Partner</Label>
            <Select value={partner} onValueChange={setPartner}>
              <SelectTrigger>
                <SelectValue placeholder="Select partner" />
              </SelectTrigger>
              <SelectContent>
                {partners.map((p) => (
                  <SelectItem key={p._id} value={p._id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {/* Date Field */}
          <div className="space-y-2">
            <Label htmlFor="edit-date">Date</Label>
            <Input
              id="edit-date"
              name="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
