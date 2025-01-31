"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client } from "@/sanity/client";
import type { Material } from "@/sanity/types";
import { Plus } from "lucide-react";
import AddMaterialButton from "@/components/materials/AddMaterialButton";
import EditMaterialDialog from "@/components/materials/EditMaterialDialog";
import { toast } from "sonner";
import MaterialsDashboard from "@/components/materials/MaterialsDashboard";


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
  const [editMaterialId, setEditMaterialId] = useState<string | null>(null);

   const fetchMaterials = () => {
     client
       .fetch(DATA_QUERY)
       .then((data) => setMaterials(data.materials))
       .catch((error) => toast.error("Error fetching materials:", error));
   };

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
        <MaterialsDashboard refreshMaterials={fetchMaterials} />

        {/* Materials Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Last Update</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.length > 0 ? (
                materials.map((material) => (
                  <TableRow
                    className="cursor-pointer"
                    key={material._id}
                    onClick={() => router.push(`/materials/${material._id}`)}
                  >
                    {/* Status Indicator + Name */}
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
                    <TableCell>{material.priceNetto} zl</TableCell>
                    <TableCell>
                      {new Date(material.updatedAt).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
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
