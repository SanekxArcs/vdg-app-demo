"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { groq } from "next-sanity";
import { client } from "@/sanity/client";
import { Layout } from "@/components/layout/layout";
import { ProjectDetails } from "@/components/projects/ProjectDetails";

interface Project {
  _id: string;
  number: number;
  city: string;
  address: string;
  postal: string;
  idq: string;
  description: string;
  link: string;
  startDate: string;
  endDate: string;
  deadlineDate: string;
  totalBudget: number;
  type: { name: string };
  status: { name: string };
  firm: { name: string };
  ekipa: { name: string };
  materials: Array<{
    material: {
      name: string;
      priceNetto: number;
      unit: { name: string };
      pieces: number;
    };
    quantity: number;
    id: string;
  }>;
  timeline: Array<{
    _key: string;
    time: string;
    author: { name: string };
    comment: string;
  }>;
  additionalCosts: number;
}

export default function ProjectPage() {
  const { id } = useParams() as { id: string };

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!id) return;

    const query = groq`
      *[_type == "project" && _id == $id][0]{
        _id,
        number,
        city,
        address,
        postal,
        idq,
        description,
        link,
        startDate,
        endDate,
        deadlineDate,
        totalBudget,
        type-> { name },
        status-> { name },
        firm-> { name },
        ekipa-> { name },
        materials[] {
          "material": material-> { name, priceNetto, unit->{name}, pieces },
          "quantity": quantity,
          "id": id,
        },
        timeline[] {
          _key,
          time,
          author-> { name },
          comment,
        },
        additionalCosts
      }
    `;

    client
      .fetch<Project>(query, { id })
      .then((fetchedProject) => {
        setProject(fetchedProject);
      })
      .catch((error) => {
        console.error("Error fetching project:", error);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div className="p-8 text-center">Loading...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center">Project not found.</div>;
  }

  return (
    <Layout>
      <ProjectDetails project={project} />
    </Layout>
  );
}
