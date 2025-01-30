import { createClient } from "next-sanity";

export const client = createClient({
  projectId: "e63ldsc8",
  dataset: "production",
  apiVersion: "2024-01-01",
  useCdn: false,
});