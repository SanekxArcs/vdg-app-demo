"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProjectOverview } from "./tabs/ProjectOverview";
import { ProjectMaterials } from "./tabs/ProjectMaterials";
import { ProjectTimeline } from "./tabs/ProjectTimeline";
import { ProjectCosts } from "./tabs/ProjectCosts";

export function ProjectTabs() {
  return (
    <Tabs defaultValue="costs" className="space-y-4">
      {/* Tab triggers */}
      <TabsList>
        <TabsTrigger value="costs">Costs</TabsTrigger>
        <TabsTrigger value="materials">Materials</TabsTrigger>
        <TabsTrigger value="timeline">Timeline</TabsTrigger>
        <TabsTrigger value="overview">Overview</TabsTrigger>
      </TabsList>

      {/* Tab content: each imported component handles its own rendering */}
      <TabsContent value="overview">
        <ProjectOverview />
      </TabsContent>
      <TabsContent value="materials">
        <ProjectMaterials />
      </TabsContent>
      <TabsContent value="timeline">
        <ProjectTimeline />
      </TabsContent>
      <TabsContent value="costs">
        <ProjectCosts />
      </TabsContent>
    </Tabs>
  );
}
