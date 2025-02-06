"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  DollarSign,
  MapPin,
  Users,
  ExternalLink,
} from "lucide-react";

export function ProjectDashboard({ project }: { project: any }) {
  // Format a date into a human-readable string
  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Build a Google Maps URL from the project address
  const getGoogleMapsUrl = () => {
    const address = `${project.address}, ${project.city}, ${project.postal}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex md:flex-row flex-col items-center gap-2">
            <h2 className=" text-xl md:text-3xl font-bold tracking-tight text-nowrap">
              MPK: {project.number}
            </h2>
            <Badge
              variant="outline"
              className={` 
                            ${
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
            >
              {project.status.name}
            </Badge>
          </div>
        </div>
        <div className="flex md:flex-row gap-y-2 flex-col space-x-2">
          <Button
            variant="secondary"
            className="hover:text-blue-600 hover:bg-gray-200 transition-all"
          >
            <a
              href={project.link}
              target="_blanc"
              className="flex items-center "
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Project files
            </a>
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Location Card */}
        <Card
          className=" cursor-pointer hover:-translate-y-1 transition-all hover:shadow-xl"
          onClick={() => window.open(getGoogleMapsUrl(), "_blank")}
        >
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="font-medium">Location</CardTitle>
            <MapPin className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-medium "></div>
            <p className=" select-none text-center">
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
              Start:{formatDate(project.startDate)} <br />
              {project.endDate
                ? "End:" + formatDate(project.endDate)
                : "End date not set"}{" "}
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
            <div className="font-medium  text-center">
              {project.totalBudget.toLocaleString()} zl
            </div>
            <p className="text-xs text-muted-foreground  text-center">
              Total allocated
            </p>
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
              {project.firm.name}
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
