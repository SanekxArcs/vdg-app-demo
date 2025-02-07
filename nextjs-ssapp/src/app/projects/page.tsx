/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useState, useEffect } from "react";
import { groq } from "next-sanity";
import Link from "next/link";

import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MapPin, Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

// Імпортуйте налаштований клієнт Sanity (приклад):
import { client } from "@/sanity/client";
import { Separator } from "@/components/ui/separator";

// Тип для проєкту (пристосуйте під свої поля)
type Project = {
  id: string;
  mpk: number;
  name: string;
  address: string;
  postal: string;
  firm: string;
  firmCode: number;
  type: string;
  status: string;
  endDate?: string;
  deadline?: string;
};

export default function ProjectsPage() {
  // Стан для масиву проєктів
  const [projects, setProjects] = useState<Project[]>([]);
  // ОКРЕМІ стани для фільтра за статусом і фільтра за фірмою
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedFirm, setSelectedFirm] = useState<string>("all");
  // Стан для пошуку
  const [searchQuery, setSearchQuery] = useState<string>("");

  // GROQ-запит, який завантажує список проєктів.
  // Змінюйте поля згідно зі своєю схемою:
  const query = groq`
    *[_type == "project"] {
      "id": _id,
      "mpk": number,
      "name": city,
      "address": address,
      "postal": postal,
      "firmCode": idq,
      "type": type->name,
      "status": status->name,
      "firm": firm->name,
      "deadline": deadlineDate,
    } | order(_createdAt desc)
  `;

  // Завантаження даних з Sanity
  const fetchProjects = async () => {
    try {
      const data = await client.fetch(query);
      setProjects(data);
      
    } catch (error) {
      toast.error(`Error fetching projects: ${error}`);
      console.error("Error fetching projects:", error);
    }
  };

  // Викликаємо fetchProjects при монтуванні компонента
  useEffect(() => {
    fetchProjects();
  }, []);

  // Фільтрація списку проєктів
  const filteredProjects = projects.filter((project) => {
    // Порівняння статусу
    const matchesStatus =
      selectedStatus === "all" || project.status === selectedStatus;

    // Фільтрація за фірмою
    const matchesFirm = selectedFirm === "all" || project.firm === selectedFirm;

    // Пошук (назва або MPK)
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      project.name.toLowerCase().includes(searchLower) ||
      String(project.mpk).includes(searchQuery);

    return matchesStatus && matchesFirm && matchesSearch;
  });

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-1 pt-6">
        {/* Заголовок сторінки й кнопка створення нового проєкту */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
          <Link href="/projects/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Поле пошуку та селект для статусу та фірми */}
        <div className="flex items-center space-x-2">
          <Input
            placeholder="Search projects..."
            className="max-w-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Перший селект – статус */}
          <Select onValueChange={(val) => setSelectedStatus(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Planned">Planned</SelectItem>
              <SelectItem value="In progress">In Progress</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
              <SelectItem value="On Hold">On Hold</SelectItem>
            </SelectContent>
          </Select>

          {/* Другий селект – фірма */}
          <Select onValueChange={(val) => setSelectedFirm(val)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Firm" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Biedronka">Biedronka</SelectItem>
              <SelectItem value="Aldi">Aldi</SelectItem>
              <SelectItem value="Quanta Energy">Quanta Energy</SelectItem>
              <SelectItem value="Inne">Inne</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Таблиця з проєктами */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MPK</TableHead>

                <TableHead>Address</TableHead>
                <TableHead>Firm</TableHead>
                <TableHead>Firm ID</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProjects.map((project) => {
                // Колонка MPK № з індикацією дедлайну (кольорова смужка)
                let textColorClass = "border-gray-300";
                if (project.deadline) {
                  const deadlineDate = new Date(project.deadline);
                  const now = new Date();
                  const diffInMs = deadlineDate.getTime() - now.getTime();
                  const diffInDays = Math.floor(
                    diffInMs / (1000 * 60 * 60 * 24)
                  );

                  if (diffInDays < 0) {
                    textColorClass = "border-red-600";
                  } else if (diffInDays <= 3) {
                    textColorClass = "border-orange-600";
                  } else {
                    textColorClass = "border-green-600";
                  }
                }

                return (
                  <TableRow key={project.id}>
                    <TableCell className={`border-l-4 ${textColorClass}`}>
                      {project.mpk}
                    </TableCell>

                    {/* Адреса, клік для відриття в Google Maps */}
                    <TableCell
                      onClick={() =>
                        window.open(
                          `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                            `${project.postal}, ${project.name}, ${project.address}`
                          )}`,
                          "_blank"
                        )
                      }
                      className="cursor-pointer"
                    >
                      <div className="flex items-center text-nowrap group">
                        {project.postal}, {project.name}, {project.address}
                        <MapPin className="h-5 w-5 mr-2 opacity-0 transition-all group-hover:opacity-100" />
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className=" text-nowrap">{project.firm}</div>
                    </TableCell>
                    <TableCell>
                      <div className=" text-nowrap">{project.firmCode}</div>
                    </TableCell>
                    <TableCell>
                      <div className=" text-nowrap">{project.type}</div>
                    </TableCell>

                    <TableCell>
                      <div
                        className={` inline-flex text-nowrap items-center rounded-full px-2.5 py-0.5 text-xs font-medium
                            ${
                              project.status === "Completed"
                                ? "bg-green-100 text-green-800"
                                : project.status === "In progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : project.status === "On Hold"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : project.status === "Planned"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-50 text-gray-600"
                            }`}
                      >
                        {project.status}
                      </div>
                    </TableCell>

                    <TableCell>
                      <Link href={`/projects/${project.id}`}>
                        <Button variant="outline" className="hover:bg-gray-300">
                          Edit
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}

              {/* Якщо немає результатів після фільтра */}
              {filteredProjects.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    No projects found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </Layout>
  );
}
