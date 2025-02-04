"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout/layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { client } from "@/sanity/client";
import {
  ArrowDownAZ,
  ArrowDownZA,
  ArrowDown01,
  ArrowDown10,
} from "lucide-react";
import AddMaterialButton from "@/components/materials/AddMaterialButton";
import { toast } from "sonner";
import MaterialsDashboard from "@/components/materials/MaterialsDashboard";

/** Material interface that matches your GROQ query fields */
interface Material {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  pieces: number;
  Unit: string; // from unit->name
  priceNetto: number;
  Supplier: string; // supplier->name
  Category: string; // category->name
  minQuantity?: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/** The keys we allow sorting on */
type SortableKey =
  | "name"
  | "Category"
  | "Supplier"
  | "quantity"
  | "priceNetto"
  | "updatedAt";

const DATA_QUERY = `{
  "materials": *[_type == "material"] {
    _id,
    name,
    description,
    quantity,
    pieces,
    "Unit": unit->name,
    priceNetto,
    "Supplier": supplier->name,
    "Category": category->name,
    minQuantity,
    createdAt,
    updatedAt
  },
  "categories": *[_type == "category"][] { _id, name },
  "suppliers": *[_type == "supplier"][] { _id, name },
  "pieceType": *[_type == "pieceType"][] { _id, name }
}`;

export default function MaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<Material[]>([]);

  // Sort config stores which key we sort by and direction
  const [sortConfig, setSortConfig] = useState<{
    key: SortableKey;
    direction: "asc" | "desc";
  } | null>(null);

  /** Fetch all materials */
  const fetchMaterials = () => {
    client
      .fetch<{ materials: Material[] }>(DATA_QUERY)
      .then((data) => setMaterials(data.materials))
      .catch((error) => {
        console.error("Error fetching materials:", error);
        toast.error("Error fetching materials. See console for details.");
      });
  };

  /** Sort the materials array based on `sortConfig` */
  const sortedMaterials = [...materials].sort((a, b) => {
    if (!sortConfig) return 0;

    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // If the key is 'updatedAt', we might want to compare as dates
    if (sortConfig.key === "updatedAt") {
      // Convert to numeric time for comparison
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    // Compare as strings or numbers
    if (typeof aValue === "string" && typeof bValue === "string") {
      // Compare strings
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    } else if (typeof aValue === "number" && typeof bValue === "number") {
      // Compare numbers
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    }

    // Fallback if types don't match (shouldn't happen with your keys)
    return 0;
  });

  /** Toggle sort direction or pick new key */
  const requestSort = (key: SortableKey) => {
    setSortConfig((prev) => {
      if (prev && prev.key === key && prev.direction === "asc") {
        // Switch to desc
        return { key, direction: "desc" };
      }
      // Default to asc
      return { key, direction: "asc" };
    });
  };

  /** Utility to show correct icon */
  const getSortIcon = (key: SortableKey) => {
    // Check if this column is the currently-sorted one
    const isActive = sortConfig?.key === key;
    const colorClass = isActive ? "text-black" : "text-gray-400";

    // Decide which pair of icons (string vs. numeric) you want
    if (key === "name" || key === "Category" || key === "Supplier") {
      // Strings
      return sortConfig?.direction === "asc" ? (
        <ArrowDownAZ className={`inline-block ml-2 ${colorClass}`} />
      ) : (
        <ArrowDownZA className={`inline-block ml-2 ${colorClass}`} />
      );
    } else {
      // Numeric or date
      return sortConfig?.direction === "asc" ? (
        <ArrowDown01 className={`inline-block ml-2 ${colorClass}`} />
      ) : (
        <ArrowDown10 className={`inline-block ml-2 ${colorClass}`} />
      );
    }
  };

  // Fetch once on mount
  useEffect(() => {
    fetchMaterials();
  }, []);

  return (
    <Layout>
      <div className="p-8 space-y-4">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Materials</h2>
          <AddMaterialButton refreshMaterials={fetchMaterials} />
        </div>

        {/* Optional Dashboard Component */}
        <MaterialsDashboard refreshMaterials={fetchMaterials} />

        {/* Materials Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead
                  onClick={() => requestSort("name")}
                ><div className="flex items-center flex-nowrap">
                  Name {getSortIcon("name")}
                </div>
                  
                </TableHead>

                <TableHead
                  onClick={() => requestSort("Category")}
                ><div className="flex items-center flex-nowrap">Category {getSortIcon("Category")}</div>
                  
                </TableHead>
                <TableHead onClick={() => requestSort("Supplier")}>
                  <div className="flex items-center flex-nowrap">Supplier {getSortIcon("Supplier")}</div>
                </TableHead>
                <TableHead onClick={() => requestSort("quantity")}>
                  <div className="flex items-center flex-nowrap">Quantity {getSortIcon("quantity")}</div>
                </TableHead>
                <TableHead onClick={() => requestSort("priceNetto")}>
                  <div className="flex items-center flex-nowrap">Price {getSortIcon("priceNetto")}</div>
                </TableHead>
                <TableHead onClick={() => requestSort("updatedAt")}>
                  <div className="flex items-center flex-nowrap">Last Update {getSortIcon("updatedAt")}</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedMaterials.length > 0 ? (
                sortedMaterials.map((material) => (
                  <TableRow
                    key={material._id}
                    className="cursor-pointer"
                    onClick={() => {
                      // E.g. navigate to details page:
                      // or open a modal for editing
                      // For now, let's push to /materials/[id]
                      router.push(`/materials/${material._id}`);
                    }}
                  >
                    <TableCell
                      className={`border-l-4 ${
                        material.quantity >= (material.minQuantity ?? 0) + 10
                          ? "border-l-green-500"
                          : material.quantity >= (material.minQuantity ?? 0)
                            ? "border-l-yellow-500"
                            : "border-l-red-500"
                      }`}
                    >
                      {material.name}
                    </TableCell>
                    <TableCell>{material.Category}</TableCell>
                    <TableCell>{material.Supplier}</TableCell>
                    <TableCell>
                      {material.quantity} {material.Unit}
                    </TableCell>
                    <TableCell>{material.priceNetto} zł</TableCell>
                    <TableCell>
                      {new Date(material.updatedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    No materials found.
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
