"use client";

import { ProjectDashboard } from "./ProjectDashboard";
import { ProjectTabs } from "./ProjectTabs";

export function ProjectDetails({ project }: { project: any }) {
  return (
    <div className="flex-1 space-y-4 p-1 pt-6">
      {/* Dashboard: header and overview cards */}
      <ProjectDashboard project={project} />
      {/* Tabs: each tab is separated into its own component */}
      <ProjectTabs project={project} />
    </div>
  );
}
