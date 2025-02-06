"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ProjectOverview({ project }: { project: any }) {
  // Helper: Format a date to a readable string
  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Calculate project progress percentage
  const calculateProgress = () => {
    const total =
      new Date(project.endDate).getTime() -
      new Date(project.startDate).getTime();
    const current = Date.now() - new Date(project.startDate).getTime();
    return Math.min(Math.max(Math.round((current / total) * 100), 0), 100);
  };

  return (
    <div className="space-y-4">
      {/* Project Progress Card */}
      <Card>
        <CardHeader>
          <CardTitle>Project Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{calculateProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${calculateProgress()}%` }}
              ></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Project Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm font-medium">Project Type:</dt>
                <dd className="text-sm text-muted-foreground">
                  {project.type.name}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium">Firm Code:</dt>
                <dd className="text-sm text-muted-foreground">{project.idq}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium">Status:</dt>
                <dd className="text-sm text-muted-foreground">
                  {project.status.name}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Location Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Location Information</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm font-medium">City:</dt>
                <dd className="text-sm text-muted-foreground">
                  {project.city}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium">Address:</dt>
                <dd className="text-sm text-muted-foreground">
                  {project.address}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm font-medium">Postal Code:</dt>
                <dd className="text-sm text-muted-foreground">
                  {project.postal}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
