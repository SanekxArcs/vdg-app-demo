"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { groq } from "next-sanity";
import { client } from "@/sanity/client";
import { nanoid } from "nanoid";
import { toast } from "sonner";

// UI Components
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Icons from lucide-react
import {
  Calendar,
  DollarSign,
  MapPin,
  Users,
  ExternalLink,
  Settings,
} from "lucide-react";

// Custom Dialog for additional settings
import { ProjectSettingsDialog } from "./ProjectSettingsDialog";
import { Label } from "../ui/label";

// Helper: Format a date for display
const formatDate = (date: Date | string) =>
  new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

// Helper: Format a date to a datetime-local input value
const formatDatetimeLocal = (date: string) => {
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
};

export function ProjectDashboard() {
  // Get project id from URL params.
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // Local state for project data and dialog visibility.
  const [project, setProject] = useState<any>(null);
  const [isSettingsDialogOpen, setIsSettingsDialogOpen] = useState(false);
  const [isTimelineDialogOpen, setIsTimelineDialogOpen] = useState(false);
  const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false);

  // State for timeline editing.
  const [newStatus, setNewStatus] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newDeadlineDate, setNewDeadlineDate] = useState("");

  // List of available statuses for selection.
  const [statuses, setStatuses] = useState<{ _id: string; name: string }[]>([]);

  // GROQ query to load only the necessary fields.
  const query = groq`
    *[_type == "project" && _id == $id][0]{
      _id,
      number,
      city,
      address,
      postal,
      link,
      startDate,
      endDate,
      deadlineDate,
      totalBudget,
      status-> { _id, name },
      ekipa-> { name },
      firm-> { name }
    }
  `;

  // Fetch project data from Sanity.
  const fetchProject = async () => {
    try {
      const data = await client.fetch(query, { id });
      setProject(data);
    } catch (error) {
      console.error("Error fetching project data:", error);
    }
  };

  // Fetch project data on mount.
  useEffect(() => {
    if (!id) return;
    fetchProject();
  }, [id]);

  // Fetch available statuses from Sanity.
  useEffect(() => {
    async function fetchStatuses() {
      try {
        const data = await client.fetch(`*[_type=="status"]{ _id, name }`);
        setStatuses(data);
        if (data.length > 0 && project?.status?._id) {
          setNewStatus(project.status._id);
        }
      } catch (error) {
        console.error("Error fetching statuses:", error);
      }
    }
    fetchStatuses();
  }, [project]);

  // Build a Google Maps URL from the project address details.
  const getGoogleMapsUrl = () => {
    const address = `${project.address}, ${project.city}, ${project.postal}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`;
  };

  // Open the timeline dialog and pre-populate fields.
  const handleOpenTimelineDialog = () => {
    if (!project) return;
    setNewStatus(project.status?._id || statuses[0]?._id || "");
    setNewStartDate(formatDatetimeLocal(project.startDate));
    setNewEndDate(project.endDate ? formatDatetimeLocal(project.endDate) : "");
    setNewDeadlineDate(formatDatetimeLocal(project.deadlineDate));
    setIsTimelineDialogOpen(true);
  };

  // Handler to update timeline fields.
  const handleUpdateTimeline = async () => {
    if (!project) return;
    try {
      await client
        .patch(project._id)
        .set({
          startDate: newStartDate,
          endDate: newEndDate,
          deadlineDate: newDeadlineDate,
          status: { _type: "reference", _ref: newStatus },
        })
        .commit();
      setIsTimelineDialogOpen(false);
      fetchProject();
      router.refresh();
    } catch (error) {
      console.error("Error updating timeline:", error);
    }
  };

  if (!project) return <p>Loading project data...</p>;

  return (
    <>
      <div className="flex flex-col gap-5 md:flex-row items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight text-nowrap">
              MPK: {project.number}
            </h2>
            <Badge
              variant="outline"
              className={`cursor-default ${
                project.status.name === "Completed"
                  ? "bg-green-100 text-green-800"
                  : project.status.name === "In progress"
                    ? "bg-blue-100 text-blue-800"
                    : project.status.name === "On Hold"
                      ? "bg-yellow-100 text-yellow-800"
                      : project.status.name === "Planned"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-gray-50 text-gray-600"
              }`}
              onClick={() => setIsStatusSelectorOpen(!isStatusSelectorOpen)}
            >
              {project.status.name}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="w-full md:w-auto">
            <a
              href={project.link}
              target="_blanc"
              className="flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Project files
            </a>
          </Button>
          <Button
            className="w-full md:w-auto"
            variant="outline"
            onClick={() => setIsSettingsDialogOpen(true)}
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Location Card */}
        <Card
          className="cursor-pointer hover:-translate-y-1 transition-all hover:shadow-xl"
          onClick={() => window.open(getGoogleMapsUrl(), "_blank")}
        >
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="font-medium">Location</CardTitle>
            <MapPin className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="select-none text-center">
              {project.postal}, {project.city},<br /> {project.address}
            </p>
            <Button
              variant="link"
              className="p-0 mt-2 text-blue-600 w-full"
              onClick={() => window.open(getGoogleMapsUrl(), "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View on Google Maps
            </Button>
          </CardContent>
        </Card>

        {/* Timeline Card */}
        <Card
          className="cursor-pointer hover:-translate-y-1 transition-all hover:shadow-xl"
          onClick={handleOpenTimelineDialog}
        >
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="font-medium">Timeline</CardTitle>
            <Calendar className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-medium text-center">
              Start: {formatDate(project.startDate)} <br />
              {project.endDate
                ? "End: " + formatDate(project.endDate)
                : "End date not set"}
              <br />
              Deadline: {formatDate(project.deadlineDate)}
            </div>
          </CardContent>
        </Card>

        {/* Budget Card */}
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="font-medium">Budget</CardTitle>
            <DollarSign className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-medium text-center">
              {project.totalBudget.toLocaleString()} zl
            </div>
            <p className="text-xs text-muted-foreground text-center">Total</p>
          </CardContent>
        </Card>

        {/* Team Card */}
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="font-medium">Team</CardTitle>
            <Users className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-medium text-center">{project.ekipa.name}</div>
            <p className="text-xs text-muted-foreground text-center">
              {project.firm?.name || ""}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Timeline Edit Dialog */}
      <Dialog
        open={isTimelineDialogOpen}
        onOpenChange={(open) => {
          if (!open) setIsTimelineDialogOpen(false);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Timeline Details</DialogTitle>
            <DialogDescription>
              Update the project status, start, end, and deadline dates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Status Selector */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status._id} value={status._id}>
                      {status.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="datetime-local"
                value={newStartDate}
                onChange={(e) => setNewStartDate(e.target.value)}
              />
            </div>
            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="datetime-local"
                value={newEndDate}
                onChange={(e) => setNewEndDate(e.target.value)}
              />
            </div>
            {/* Deadline Date */}
            <div className="space-y-2">
              <Label>Deadline Date</Label>
              <Input
                type="datetime-local"
                value={newDeadlineDate}
                onChange={(e) => setNewDeadlineDate(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setIsTimelineDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateTimeline}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ProjectSettingsDialog
        isOpen={isSettingsDialogOpen}
        onClose={() => setIsSettingsDialogOpen(false)}
        project={project}
      />
    </>
  );
}
