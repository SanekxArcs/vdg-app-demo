
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, DollarSign, Package } from "lucide-react";
import type { Project } from "@/types";

// Mock project data
const project: Project = {
  id: "1",
  name: "Building A Construction",
  description: "Main construction project for Building A",
  status: "in-progress",
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-06-30"),
  budget: 500000,
  materials: [
    { materialId: "1", quantity: 100, allocatedBudget: 5000 },
    { materialId: "2", quantity: 50, allocatedBudget: 2500 },
  ],
  createdAt: new Date("2023-12-15"),
  updatedAt: new Date("2024-03-10"),
};

// This is required for static site generation with dynamic routes
export function generateStaticParams() {
  // Return an array of possible values for id
  return [
    { id: "1" },
    { id: "2" },
    // Add more IDs as needed
  ];
}

export default function ProjectPage({ params }: { params: { id: string } }) {
  return (
    <Layout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {project.name}
            </h2>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">Edit Project</Button>
            <Button variant="destructive">Delete Project</Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Status</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {project.status}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timeline</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">180 days</div>
              <p className="text-xs text-muted-foreground">
                {project.startDate.toLocaleDateString()} -{" "}
                {project.endDate?.toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${project.budget?.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">Total allocated</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Materials</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project.materials.length}
              </div>
              <p className="text-xs text-muted-foreground">Items assigned</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="budget">Budget</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>45%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: "45%" }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="materials" className="space-y-4">
            {/* Materials content */}
          </TabsContent>
          <TabsContent value="timeline" className="space-y-4">
            {/* Timeline content */}
          </TabsContent>
          <TabsContent value="budget" className="space-y-4">
            {/* Budget content */}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
