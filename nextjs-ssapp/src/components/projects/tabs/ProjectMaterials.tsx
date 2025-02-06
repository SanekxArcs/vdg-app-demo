"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { client } from "@/sanity/client";
import { nanoid } from "nanoid";

interface ProjectType {
  materials: {
    material?: {
      name?: string;
      priceNetto?: number;
      unit?: { name?: string };
    } | null;
    quantity?: number;
    pieces?: number;
  }[];
}
// ...existing code...
interface Material {
  _id: string;
  name: string;
}

export function ProjectMaterials({ project }: { project: ProjectType }) {

  // Local state for the "Add Material" form
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [materialQuantity, setMaterialQuantity] = useState("");
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);

  useEffect(() => {
    client
      .fetch<Material[]>(`*[_type == "material"]{_id, name}`)
      .then((data) => setAllMaterials(data))
      .catch(console.error);
  }, []);


  const handleAddMaterial = async () => {
    if (!selectedMaterial || !materialQuantity) return;
    try {
      await client
        .patch(project._id)
        .setIfMissing({ materials: [] })
        .append("materials", [
          {
            _key: nanoid(),
            _type: "usedMaterial",
            material: {
              _type: "reference",
              _ref: selectedMaterial,
            },
            quantity: Number(materialQuantity),
            id: nanoid(),
          },
        ])
        .commit();

      // Reset form
      setSelectedMaterial("");
      setMaterialQuantity("");
      // Optionally refresh local project data here
      await fetchUpdatedProject();

      console.log("Material added to project");
    } catch (err) {
      console.error("Error adding material:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Materials List</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Materials Table */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Price (Netto)</TableHead>
              <TableHead>Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {project?.materials?.map((mat, index) => {
              // Optional chaining to safely access nested fields
              const materialName = mat.material?.name || "N/A";
              const quantity = mat.quantity ?? 0;
              const priceNetto = mat.material?.priceNetto ?? 0;
              const unitName = mat.material?.unit?.name || "";
              const pieces = mat.material?.pieces || 0;

              return (
                <TableRow key={index} className="p-1">
                  <TableCell className="p-1">{materialName}</TableCell>
                  <TableCell className="p-1">
                    {quantity} {unitName}
                  </TableCell>
                  <TableCell className="p-1">{priceNetto} zl</TableCell>
                  <TableCell className="p-1">
                    {((quantity / pieces) * priceNetto).toLocaleString()} zl
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Add Material Form */}
        <div className="mt-6 border-t pt-6">
          <h4 className="text-sm font-medium mb-4">Add Material</h4>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Select Material</Label>
              <Select
                value={selectedMaterial}
                onValueChange={setSelectedMaterial}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose material" />
                </SelectTrigger>
                <SelectContent>
                  {allMaterials.map((m) => (
                    <SelectItem key={m._id} value={m._id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                value={materialQuantity}
                onChange={(e) => setMaterialQuantity(e.target.value)}
                placeholder="Enter quantity"
                min="0"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleAddMaterial} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Material
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
