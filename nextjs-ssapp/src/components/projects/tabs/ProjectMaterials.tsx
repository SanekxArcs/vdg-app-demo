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
import { useRouter, useParams } from "next/navigation";
import { groq } from "next-sanity";

// Define interfaces for the used material and project data
interface UsedMaterial {
  _key: string;
  quantity: number;
  id: string;
  material: {
    name: string;
    priceNetto: number;
    unit: { name: string };
    pieces: number;
  } | null;
}

interface ProjectType {
  _id: string;
  materials: UsedMaterial[];
}

interface Material {
  _id: string;
  name: string;
}

export function ProjectMaterials() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  // Local state for project data, loading flag, and form fields
  const [project, setProject] = useState<ProjectType | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [materialQuantity, setMaterialQuantity] = useState("");
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);

  // GROQ query to load only necessary fields for the project's materials
  const projectQuery = groq`
    *[_type=="project" && _id==$id][0]{
      _id,
      materials[] {
        _key,
        quantity,
        id,
        material-> {
          name,
          priceNetto,
          unit->{name},
          pieces
        }
      }
    }
  `;

  // Fetch project materials from Sanity
  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await client.fetch(projectQuery, { id });
      setProject(data);
    } catch (error) {
      console.error("Error fetching project data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load project data on mount and refresh every 60 seconds
  useEffect(() => {
    if (!id) return;
    fetchProject();
    const interval = setInterval(fetchProject, 60000);
    return () => clearInterval(interval);
  }, [id]);

  // Fetch all available materials for the selection dropdown
  useEffect(() => {
    client
      .fetch<Material[]>(`*[_type == "material"]{ _id, name }`)
      .then((data) => setAllMaterials(data))
      .catch(console.error);
  }, []);

  // Handle adding a new material to the project
  const handleAddMaterial = async () => {
    if (!selectedMaterial || !materialQuantity || !project?._id) return;
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

      // Reset form fields and refresh project data
      setSelectedMaterial("");
      setMaterialQuantity("");
      fetchProject();
      router.refresh();
      console.log("Material added to project");
    } catch (err) {
      console.error("Error adding material:", err);
    }
  };

  // Display a loading state until project data is available
  if (loading || !project) return <p>Loading project materials...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Materials List</CardTitle>
      </CardHeader>
      <CardContent>
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
            {project.materials.map((mat) => {
              const materialName = mat.material?.name || "N/A";
              const quantity = mat.quantity ?? 0;
              const priceNetto = mat.material?.priceNetto ?? 0;
              const unitName = mat.material?.unit?.name || "";
              const pieces = mat.material?.pieces || 1;
              const totalPrice = (
                (quantity / pieces) *
                priceNetto
              ).toLocaleString();

              return (
                <TableRow key={mat._key} className="p-1">
                  <TableCell className="p-1">{materialName}</TableCell>
                  <TableCell className="p-1">
                    {quantity} {unitName}
                  </TableCell>
                  <TableCell className="p-1">{priceNetto} zl</TableCell>
                  <TableCell className="p-1">{totalPrice} zl</TableCell>
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
