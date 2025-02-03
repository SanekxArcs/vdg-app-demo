
import { groq } from "next-sanity";
import { notFound } from "next/navigation";

import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, DollarSign, Package } from "lucide-react";
import { client } from "@/sanity/client";

// Допасуйте типи під фактичну структуру ваших документів:
interface ProjectMaterial {
  // Кількість, що використовується в поточному проєкті
  quantity: number;
  // Матеріал-референс
  material: {
    _id: string;
    name: string;
    priceNetto: number;
  };
}

interface Project {
  _id: string;
  city?: string; // Використовуємо "city" як назву
  description?: string; // Якщо у вашій схемі передбачено опис
  status?: string; // Наприклад, status->title
  startDate?: string;
  endDate?: string;
  totalBudget?: number;
  progress?: number;
  // Масив матеріалів
  materials?: ProjectMaterial[];
  timeline?: {
    time: string;
    comment: string;
  }[];
}

// Запит GROQ для одного проєкту. Скоригуйте поля під свою схему.
const projectQuery = groq`
  *[_type == "project" && _id == $id][0]{
    _id,
    // city як назву (або створіть окреме поле name в схемі)
    "city": city,
    // Якщо є окреме поле "description", додайте його теж, або видаліть, якщо немає
    "description": coalesce(description, "No description"),
    // Розгортаємо reference до status->title, якщо в документі status є title
    "status": status->name,
    startDate,
    endDate,
    "totalBudget": totalBudget,
    progress,
    // МАСИВ МАТЕРІАЛІВ
    // Тут розгортаємо дані material->, щоб отримати деталі
    materials[] {
      quantity,
      "material": material->{
        _id,
        name,
        priceNetto
      }
    },
    // Хронологія
    timeline
  }
`;

function daysBetween(start?: string, end?: string) {
  if (!start || !end) return 0;
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  return Math.max(Math.round((endMs - startMs) / (1000 * 60 * 60 * 24)), 0);
}

/**
 * Генерує всі можливі params для статичної генерації (SFG).
 * Якщо ви використовуєте ці сторінки на проді, переконайтеся, що кількість
 * документів відносно невелика, інакше перейдіть на SSR або ISR.
 */
export async function generateStaticParams() {
  const ids = await client.fetch(groq`*[_type == "project"]{ _id }`);
  return ids.map((item: { _id: string }) => ({ id: item._id }));
}

// Оскільки це layout для Next.js 13 (Route Handlers), можна використати серверний компонент (async).
// Якщо вам потрібен client-компонент, змініть структуру. Тут показано серверний компонент.
export default async function ProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  // Завантажуємо дані про проєкт
  const project: Project | null = await client.fetch(projectQuery, { id });
  if (!project) return notFound();

  // Підрахунок днів між початком та кінцем
  const totalDays = daysBetween(project.startDate, project.endDate);

  // Якщо materials присутні, підраховуємо довжину масиву
  const materialCount = project.materials?.length ?? 0;

  // Приклад обчислення суми бюджету на основі materials:
  // Якщо в схемі передбачена totalBudget і вона вже обчислена — можна показувати її напряму.
  // Якщо хочете додатково відобразити "спожитий бюджет", можна:
  const usedBudget = project.materials?.reduce((acc, m) => {
    const price = m.material?.priceNetto ?? 0;
    const qty = m.quantity ?? 0;
    return acc + price * qty;
  }, 0);

  // Прогрес
  const progressPercent = project.progress ?? 0;

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-8 pt-6">
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

        {/* Картки з короткою статистикою */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Статус */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Статус</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold capitalize">
                {project.status || "N/A"}
              </div>
            </CardContent>
          </Card>
          {/* Тимлайн */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
          {/* Загальний бюджет (зчитуємо з totalBudget) */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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
          {/* Матеріали */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
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

        {/* Вкладки: Overview, Materials, Timeline, Budget */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            {/* <TabsTrigger value="budget">Budget</TabsTrigger> */}
          </TabsList>

          {/* OVERVIEW */}
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

          {/* MATERIALS */}
          <TabsContent value="materials" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Materials Used</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {project.materials && project.materials.length > 0 ? (
                  project.materials.map((m) => (
                    <div
                      key={`${m.material._id}`}
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

          {/* TIMELINE */}
          <TabsContent value="timeline" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Timeline / History</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.timeline?.length ? (
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

          {/* BUDGET */}
          <TabsContent value="budget" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Budget Calculations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {/* Перевірка totalBudget */}
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

                {/* Перевірка usedBudget */}
                <div className="flex justify-between">
                  <span className="font-medium">
                    Used Budget (materials x price):
                  </span>
                  <span>{usedBudget ? `$${usedBudget}` : "$0"}</span>
                </div>

                <hr />

                {/* Перевірка залишку: якщо totalBudget не число — показуємо «—», інакше віднімаємо usedBudget */}
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
