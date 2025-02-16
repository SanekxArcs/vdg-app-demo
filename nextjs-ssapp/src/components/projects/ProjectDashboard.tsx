"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  DollarSign,
  MapPin,
  Users,
  ExternalLink,
  Settings,
} from "lucide-react";
import { ProjectSettingsDialog } from "./ProjectSettingsDialog";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { useParams } from "next/navigation";

export function ProjectDashboard() {
  // Get project id from URL params
  const { id } = useParams() as { id: string };

  // Local state for project data and dialog visibility
  const [project, setProject] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStatusSelectorOpen, setIsStatusSelectorOpen] = useState(false);

  // Sanity query to load only the necessary fields
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
      status-> { name },
      ekipa-> { name },
      firm-> { name }
    }
  `;

  // Fetch project data from Sanity
  const fetchProject = async () => {
    try {
      const data = await client.fetch(query, { id });
      setProject(data);
    } catch (error) {
      console.error("Error fetching project data:", error);
    }
  };

  // Load project data on mount and refresh every 60 seconds
  useEffect(() => {
    if (!id) return;
    fetchProject();
    const interval = setInterval(fetchProject, 60000); // refresh every 60 sec
    return () => clearInterval(interval);
  }, [id]);

  // Show a loading state until project data is available
  if (!project) return <p>Loading project data...</p>;

  // Format a date for display
  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Build a Google Maps URL from the project address details
  const getGoogleMapsUrl = () => {
    const address = `${project.address}, ${project.city}, ${project.postal}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
      address
    )}`;
  };

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
            onClick={() => setIsDialogOpen(true)}
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
        <Card>
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

      <ProjectSettingsDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        project={project}
      />
    </>
  );
}
