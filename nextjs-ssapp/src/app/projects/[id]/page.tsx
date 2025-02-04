// app/projects/[id]/page.tsx

import { groq } from "next-sanity";
import { notFound } from "next/navigation";

import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, DollarSign, Package } from "lucide-react";
import { client } from "@/sanity/client";

/* ----------------------------------------------------------
   Types: Define your document structure for type safety
----------------------------------------------------------- */
interface ProjectMaterial {
  // Quantity used in the project
  quantity: number;
  // Reference to the material document
  material: {
    _id: string;
    name: string;
    priceNetto: number;
  };
}

interface Project {
  _id: string;
  city?: string; // Project name (using city)
  description?: string; // Optional description
  status?: string; // E.g., status->name
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
  progress?: number;
  // Array of materials
  materials?: ProjectMaterial[];
  // Timeline entries
  timeline?: {
    time: string;
    comment: string;
  }[];
}

/* ----------------------------------------------------------
   GROQ Query: Fetch a single project by ID
----------------------------------------------------------- */
const projectQuery = groq`
  *[_type == "project" && _id == $id][0]{
    _id,
    "city": city,
    "description": coalesce(description, "No description"),
    "status": status->name,
    startDate,
    endDate,
    "totalBudget": totalBudget,
    progress,
    materials[] {
      quantity,
      "material": material->{
        _id,
        name,
        priceNetto
      }
    },
    timeline
  }
`;

/* ----------------------------------------------------------
   Utility Function: Calculate days between two dates
----------------------------------------------------------- */
function daysBetween(start?: string, end?: string): number {
  if (!start || !end) return 0;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  return Math.max(Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)), 0);
}

/* ----------------------------------------------------------
   Static Params: Generate all possible project IDs for SSG
----------------------------------------------------------- */
export async function generateStaticParams() {
  const ids = await client.fetch(groq`*[_type == "project"]{ _id }`);
  return ids.map((item: { _id: string }) => ({ id: item._id }));
}

/* ----------------------------------------------------------
   Page Component: Fetch and render project details.
   Note: Next.js 15 expects `params` as a Promise.
----------------------------------------------------------- */
export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap the promise to get the actual parameters
  const { id } = await params;

  // Fetch the project data from Sanity
  const project: Project | null = await client.fetch(projectQuery, { id });
  if (!project) return notFound();

  // Calculate project statistics
  const totalDays = daysBetween(project.startDate, project.endDate);
  const materialCount = project.materials?.length ?? 0;
  const usedBudget = project.materials?.reduce((acc, m) => {
    const price = m.material.priceNetto ?? 0;
    const qty = m.quantity ?? 0;
    return acc + price * qty;
  }, 0);
  const progressPercent = project.progress ?? 0;

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        {/* Header with title and action buttons */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {project.city ?? "No Name"}
            </h2>
            <p className="text-muted-foreground">{project.description}</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline">Edit Project</Button>
            <Button variant="destructive">Delete Project</Button>
          </div>
        </div>

        {/* Quick Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Status Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Статус</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {project.status || "N/A"}
              </div>
            </CardContent>
          </Card>

          {/* Duration Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Тривалість</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDays} дн.</div>
              <p className="text-xs text-muted-foreground">
                {project.startDate
                  ? new Date(project.startDate).toLocaleDateString()
                  : "—"}{" "}
                —{" "}
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString()
                  : "—"}
              </p>
            </CardContent>
          </Card>

          {/* Budget Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Бюджет</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {project.totalBudget !== undefined
                  ? `$${project.totalBudget}`
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">Орієнтовно</p>
            </CardContent>
          </Card>

          {/* Materials Count Card */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Матеріали</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{materialCount}</div>
              <p className="text-xs text-muted-foreground">
                Загальна кількість позицій
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Sections via Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            {/* Uncomment to enable Budget tab */}
            {/* <TabsTrigger value="budget">Budget</TabsTrigger> */}
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Overall Progress</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-blue-600 h-2.5 rounded-full"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Materials Used</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.materials && project.materials.length > 0 ? (
                  project.materials.map((m) => (
                    <div
                      key={m.material._id}
                      className="flex justify-between text-sm"
                    >
                      <span>
                        {m.material.name} (x{m.quantity})
                      </span>
                      <span>
                        ${(m.material.priceNetto ?? 0) * (m.quantity ?? 0)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No materials listed.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Timeline Tab */}
          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Timeline / History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.timeline && project.timeline.length > 0 ? (
                  project.timeline.map((t, idx) => (
                    <div key={idx} className="border-b pb-2">
                      <p className="text-sm text-muted-foreground">
                        {t.time
                          ? new Date(t.time).toLocaleDateString()
                          : "Unknown date"}
                      </p>
                      <p>{t.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No timeline entries.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Budget Tab (Optional) */}
          <TabsContent value="budget" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Budget Calculations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Total Budget */}
                <div className="flex justify-between">
                  <span className="font-medium">
                    Total Budget (from schema):
                  </span>
                  <span>
                    {typeof project.totalBudget === "number"
                      ? `$${project.totalBudget}`
                      : "N/A"}
                  </span>
                </div>
                {/* Used Budget */}
                <div className="flex justify-between">
                  <span className="font-medium">
                    Used Budget (materials x price):
                  </span>
                  <span>{usedBudget ? `$${usedBudget}` : "$0"}</span>
                </div>
                <hr />
                {/* Remaining Budget */}
                <div className="flex justify-between">
                  <span className="font-medium">Remaining / Difference:</span>
                  <span>
                    {typeof project.totalBudget === "number"
                      ? `$${project.totalBudget - (usedBudget || 0)}`
                      : "—"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
