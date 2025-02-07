import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Status {
  _id: string;
  name: string;
}

interface StatusSelectorProps {
  currentStatus: Status;
  statuses: Status[];
  onStatusChange: (newStatus: Status) => void;
}

export function StatusSelector({
  currentStatus,
  statuses,
  onStatusChange,
}: StatusSelectorProps) {
  return (
    <Select onValueChange={(value) => {
        const selectedStatus = statuses.find((status) => status._id === value);
        if (selectedStatus) {
          onStatusChange(selectedStatus);
        }
      }}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder={currentStatus.name} />
      </SelectTrigger>
      <SelectContent>
        {statuses.map((status) => (
          <SelectItem key={status._id} value={status._id}>
            {status.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}