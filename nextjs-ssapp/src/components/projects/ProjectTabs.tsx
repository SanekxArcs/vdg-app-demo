"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectOverview } from "./tabs/ProjectOverview";
import { ProjectMaterials } from "./tabs/ProjectMaterials";
import { ProjectTimeline } from "./tabs/ProjectTimeline";
import { ProjectCosts } from "./tabs/ProjectCosts";

export function ProjectTabs({ project }: { project: any }) {
  return (
    <Tabs defaultValue="overview" className="space-y-4">
      {/* Tab triggers */}
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="materials">Materials</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="costs">Costs</TabsTrigger>
      </TabsList>

      {/* Tab content: each imported component handles its own rendering */}
      <TabsContent value="overview">
        <ProjectOverview />
      </TabsContent>
      <TabsContent value="materials">
        <ProjectMaterials/>
      </TabsContent>
      <TabsContent value="timeline">
        <ProjectTimeline/>
      </TabsContent>
      <TabsContent value="costs">
        <ProjectCosts project={project} />
      </TabsContent>
    </Tabs>
  );
}
