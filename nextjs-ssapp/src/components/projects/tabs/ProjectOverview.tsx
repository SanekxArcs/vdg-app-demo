"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { groq } from "next-sanity";
import { client } from "@/sanity/client";
import { useParams } from "next/navigation";

export function ProjectOverview() {
  // Get project ID from URL params
  const { id } = useParams() as { id: string };

  // Local state for project data and loading flag
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // GROQ query to load only the necessary fields
const query = groq`
  *[_type == "project" && _id == $id][0]{
    _id,
    number,
    city,
    address,
    postal,
    idq,
    startDate,
    endDate,
    type-> { name },
    status-> { name }
  }
`;


  // Fetch project data from Sanity
  const fetchProject = async () => {
    try {
      const data = await client.fetch(query, { id });
      setProject(data);
    } catch (error) {
      console.error("Error fetching project data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and refresh data every 60 seconds
  useEffect(() => {
    if (!id) return;
    fetchProject();
    const interval = setInterval(fetchProject, 60000);
    return () => clearInterval(interval);
  }, [id]);

  // Helper: Format a date to a readable string
  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Calculate project progress based on start and end dates
  const calculateProgress = () => {
    const startTime = new Date(project.startDate).getTime();
    const endTime = new Date(project.endDate).getTime();
    const total = endTime - startTime;
    const current = Date.now() - startTime;
    return total > 0
      ? Math.min(Math.max(Math.round((current / total) * 100), 0), 100)
      : 0;
  };

  // Show loading state until project data is available
  if (loading || !project) return <p>Loading project data...</p>;

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
