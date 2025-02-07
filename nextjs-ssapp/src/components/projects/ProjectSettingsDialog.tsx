import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export  function ProjectSettingsDialog({ isOpen, onClose, project }: { isOpen: boolean; onClose: () => void; project: any }) {
  const [projectName, setProjectName] = useState(project.name);
  const [projectDescription, setProjectDescription] = useState(project.description);

  const handleSave = () => {
    // Logic to save project details
    console.log("Project details saved:", { projectName, projectDescription });
    onClose();
  };

  const handleDelete = () => {
    // Logic to delete project
    console.log("Project deleted!");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>You want to delete Project: {project.number}?</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this project? <br /> This action cannot be undone.
            
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end space-x-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}