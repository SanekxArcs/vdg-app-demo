import { Layout } from "@/components/layout/layout";
import { groq } from "next-sanity";
import { client } from "@/sanity/client"; // Your configured Sanity client
import { ProjectDetails } from "@/components/projects/ProjectDetails";

/**
 * Generate static paths by fetching all project IDs from Sanity.
 */
export async function generateStaticParams() {
  // Fetch all projects' _id values from Sanity
  const query = groq`*[_type == "project"]{ _id }`;
  const projects: { _id: string }[] = await client.fetch(query);
  return projects.map((project) => ({
    id: project._id,
  }));
}

/**
 * The ProjectPage component fetches a single project document based on the dynamic route param.
 */
export default async function ProjectPage({
  params,
}: {
  params: { id: string } | Promise<{ id: string }>;
}) {
  // Await params before using its properties
  const { id } = await params;
  // GROQ query to fetch project data and flatten nested objects for materials and timeline
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
      // Flatten materials: extract material reference and quantity from usedMaterial
      materials[] {
        "material": material-> { name, priceNetto, unit->{name}, pieces },
        "quantity": quantity,
        "id": id,
      },
      // Flatten timeline: extract event fields to top level
      timeline[]{
        _key,
        time,
        author-> { name },
        comment,
      },
      additionalCosts
    }
  `;

  // Fetch the project data from Sanity using the route param
  const project = await client.fetch(query, { id });

  console.log("Project data:", project);

  return (
    <Layout>
      <ProjectDetails project={project} />
    </Layout>
  );
}
