import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "e63ldsc8",
  dataset: "materials",
  apiVersion: "v2022-03-07",
  useCdn: false,
});