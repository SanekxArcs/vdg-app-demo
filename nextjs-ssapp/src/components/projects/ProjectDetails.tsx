"use client";

import { ProjectDashboard } from "./ProjectDashboard";
import { ProjectTabs } from "./ProjectTabs";

export function ProjectDetails({ project }: { project: any }) {
  return (
    <div className="flex-1 space-y-4 p-1 pt-6">
      <ProjectDashboard />
      <ProjectTabs />
    </div>
  );
}
