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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Search } from "lucide-react";
import { client } from "@/sanity/client";
import { nanoid } from "nanoid";
import { useRouter, useParams } from "next/navigation";
import { groq } from "next-sanity";

// Define interfaces for a used material (attached to a project)
interface UsedMaterial {
  _key: string;
  quantity: number;
  quantityForFirm: number;
  id: string;
  material: {
    _id: string;
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
  category?: {
    _id: string;
    name: string;
  };
}

export function ProjectMaterials() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  // Project data and loading flag
  const [project, setProject] = useState<ProjectType | null>(null);
  const [loading, setLoading] = useState(true);

  // State for the "Add Material" form
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [materialQuantity, setMaterialQuantity] = useState("");
  const [materialQuantityForFirm, setMaterialQuantityForFirm] = useState("");
  const [allMaterials, setAllMaterials] = useState<Material[]>([]);

  // State for search input and toggle
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // State for editing an existing material via dialog
  const [editingMaterial, setEditingMaterial] = useState<UsedMaterial | null>(
    null
  );
  const [editQuantity, setEditQuantity] = useState("");
  const [editQuantityForFirm, setEditQuantityForFirm] = useState("");

  // GROQ query to load only necessary fields for the project's materials
  const projectQuery = groq`
    *[_type=="project" && _id==$id][0]{
      _id,
      materials[] {
        _key,
        quantity,
        quantityForFirm,
        id,
        material-> {
          _id,
          name,
          priceNetto,
          unit->{name},
          pieces
        }
      }
    }
  `;

  // Fetch project data (materials)
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

  // Fetch project on mount
  useEffect(() => {
    if (!id) return;
    fetchProject();
  }, [id]);

  // Fetch all available materials (with category) for the selection dropdowns and search
  useEffect(() => {
    client
      .fetch<Material[]>(
        `*[_type == "material"]{ _id, name, category->{_id, name} }`
      )
      .then((data) => setAllMaterials(data))
      .catch(console.error);
  }, []);

  // Derived list of unique categories from allMaterials
  const categories = Array.from(
    new Map(
      allMaterials
        .filter((m) => m.category)
        .map((m) => [m.category!._id, m.category])
    ).values()
  ) as { _id: string; name: string }[];

  // Handle adding a new material to the project.
  // If "Quantity For Firm" is empty, default it to the main quantity.
  const handleAddMaterial = async () => {
    if (!selectedMaterial || !materialQuantity || !project?._id) return;

    const mainQty = Number(materialQuantity);
    const firmQty = materialQuantityForFirm
      ? Number(materialQuantityForFirm)
      : mainQty;

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
            quantity: mainQty,
            quantityForFirm: firmQty,
            id: nanoid(),
          },
        ])
        .commit();

      // Reset form fields and refresh project data
      setSelectedCategory("");
      setSelectedMaterial("");
      setMaterialQuantity("");
      setMaterialQuantityForFirm("");
      fetchProject();
      router.refresh();
      console.log("Material added to project");
    } catch (err) {
      console.error("Error adding material:", err);
    }
  };

  // Open the edit dialog and populate it with the clicked material's data.
  // If quantityForFirm is undefined, default to the main quantity.
  const handleOpenEditDialog = (mat: UsedMaterial) => {
    setEditingMaterial(mat);
    setEditQuantity(mat.quantity.toString());
    setEditQuantityForFirm(
      mat.quantityForFirm !== undefined && mat.quantityForFirm !== null
        ? mat.quantityForFirm.toString()
        : mat.quantity.toString()
    );
  };

  // Handle updating an existing material in the project.
  // If the edited quantityForFirm is empty, default it to the main quantity.
  const handleUpdateMaterial = async () => {
    if (!editingMaterial || !project?._id) return;
    const mainQty = Number(editQuantity);
    const firmQty = editQuantityForFirm ? Number(editQuantityForFirm) : mainQty;

    try {
      await client
        .patch(project._id)
        .set({
          [`materials[_key=="${editingMaterial._key}"].quantity`]: mainQty,
          [`materials[_key=="${editingMaterial._key}"].quantityForFirm`]:
            firmQty,
        })
        .commit();
      setEditingMaterial(null);
      fetchProject();
      router.refresh();
    } catch (error) {
      console.error("Error updating material:", error);
    }
  };

  // Handle deleting an existing material from the project.
  const handleDeleteMaterial = async () => {
    if (!editingMaterial || !project?._id) return;
    try {
      await client
        .patch(project._id)
        .unset([`materials[_key=="${editingMaterial._key}"]`])
        .commit();
      setEditingMaterial(null);
      fetchProject();
      router.refresh();
    } catch (error) {
      console.error("Error deleting material:", error);
    }
  };

  // Handle selecting a material from the search results.
  const handleSelectFromSearch = (mat: Material) => {
    setSelectedMaterial(mat._id);
    if (mat.category) setSelectedCategory(mat.category._id);
    setShowSearch(false);
    setSearchQuery("");
  };

  // Filter and sort search results: sort by category then by material name.
  const searchResults = allMaterials
    .filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      const catA = a.category?.name.toLowerCase() || "";
      const catB = b.category?.name.toLowerCase() || "";
      if (catA < catB) return -1;
      if (catA > catB) return 1;
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      if (nameA < nameB) return -1;
      if (nameA > nameB) return 1;
      return 0;
    });

  // Calculate totals for each row and overall sums.
  const calculateRowTotals = (mat: UsedMaterial) => {
    if (!mat.material) return { mainTotal: 0, firmTotal: 0 };
    const pieces = mat.material.pieces || 1;
    const mainTotal = (mat.quantity / pieces) * mat.material.priceNetto;
    const firmTotal = (mat.quantityForFirm / pieces) * mat.material.priceNetto;
    return { mainTotal, firmTotal };
  };

  const sumMainTotal =
    project?.materials.reduce((acc, mat) => {
      const { mainTotal } = calculateRowTotals(mat);
      return acc + mainTotal;
    }, 0) || 0;

  const sumFirmTotal =
    project?.materials.reduce((acc, mat) => {
      const { firmTotal } = calculateRowTotals(mat);
      return acc + firmTotal;
    }, 0) || 0;

  const difference = sumMainTotal - sumFirmTotal;

  if (loading || !project) return <p>Loading project materials...</p>;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Materials List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Main Qty</TableHead>
                <TableHead>Firm Qty</TableHead>
                <TableHead>Price (Netto)</TableHead>
                <TableHead>Total (Main)</TableHead>
                <TableHead>Total (Firm)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.materials.map((mat) => {
                const materialName = mat.material?.name || "N/A";
                const quantity = mat.quantity ?? 0;
                const firmQuantity = mat.quantityForFirm ?? 0;
                const priceNetto = mat.material?.priceNetto || 0;
                const unitName = mat.material?.unit?.name || "";
                const pieces = mat.material?.pieces || 1;
                const mainTotal = (quantity / pieces) * priceNetto;
                const firmTotal = (firmQuantity / pieces) * priceNetto;
                return (
                  <TableRow
                    key={mat._key}
                    className="p-1 cursor-pointer"
                    onClick={() => handleOpenEditDialog(mat)}
                  >
                    <TableCell className="p-1">{materialName}</TableCell>
                    <TableCell className="p-1">
                      {quantity} {unitName}
                    </TableCell>
                    <TableCell className="p-1">
                      {firmQuantity} {unitName}
                    </TableCell>
                    <TableCell className="p-1">{priceNetto} zl</TableCell>
                    <TableCell className="p-1">
                      {mainTotal.toLocaleString()} zl
                    </TableCell>
                    <TableCell className="p-1">
                      {firmTotal.toLocaleString()} zl
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* Summary Section for totals */}
          <div className="mt-6 border-t pt-4">
            <div className="flex justify-between">
              <span className="font-medium">Sum Total (Main Qty):</span>
              <span>{sumMainTotal.toLocaleString()} zl</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-medium">Sum Total (Firm Qty):</span>
              <span>{sumFirmTotal.toLocaleString()} zl</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-medium">Difference:</span>
              <span>{difference.toLocaleString()} zl</span>
            </div>
          </div>

          {/* Add Material Form */}
          <div className="mt-6 border-t pt-6">
            <h4 className="text-sm font-medium mb-4">Add Material</h4>
            {/* Search Input Toggle */}
            <div className="mb-4 flex items-center">
              <Button
                variant="outline"
                onClick={() => setShowSearch(!showSearch)}
              >
                <Search className="h-4 w-4 mr-2" />
                {showSearch ? "Close Search" : "Search Material"}
              </Button>
            </div>
            {showSearch && (
              <div className="mb-4">
                <Input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search materials..."
                />
                <div className="mt-2 space-y-1 border p-2 rounded">
                  {searchResults.map((m) => (
                    <div
                      key={m._id}
                      className="cursor-pointer px-3 py-1 hover:bg-gray-100/10 rounded"
                      onClick={() => handleSelectFromSearch(m)}
                    >
                      {m.name} {m.category ? `(${m.category.name})` : ""}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-4">
              {/* Category Selector */}
              <div className="space-y-2">
                <Label>Select Category</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(val) => {
                    setSelectedCategory(val);
                    setSelectedMaterial("");
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat._id} value={cat._id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Material Selector (filtered by selected category) */}
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
                    {allMaterials
                      .filter(
                        (m) => m.category && m.category._id === selectedCategory
                      )
                      .map((m) => (
                        <SelectItem key={m._id} value={m._id}>
                          {m.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Main Quantity Input */}
              <div className="space-y-2">
                <Label>Main Quantity</Label>
                <Input
                  type="number"
                  value={materialQuantity}
                  onChange={(e) => setMaterialQuantity(e.target.value)}
                  placeholder="Enter quantity"
                  min="0"
                />
              </div>
              {/* Firm Quantity Input */}
              <div className="space-y-2">
                <Label>Quantity For Firm</Label>
                <Input
                  type="number"
                  value={materialQuantityForFirm}
                  onChange={(e) => setMaterialQuantityForFirm(e.target.value)}
                  placeholder="Enter firm quantity (or leave empty)"
                  min="0"
                />
              </div>
              {/* Add Button */}
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

      {/* Edit/Delete Material Dialog */}
      <Dialog
        open={!!editingMaterial}
        onOpenChange={(open) => {
          if (!open) setEditingMaterial(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
            <DialogDescription>
              Material:{" "}
              <span className="font-bold">
                {editingMaterial?.material?.name || "N/A"}
              </span>
              <br />
              Update the main quantity and firm quantity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Edit Main Quantity */}
            <div className="space-y-2">
              <Label>Main Quantity</Label>
              <Input
                type="number"
                value={editQuantity}
                onChange={(e) => setEditQuantity(e.target.value)}
                placeholder="Enter new quantity"
                min="0"
              />
            </div>
            {/* Edit Quantity For Firm */}
            <div className="space-y-2">
              <Label>Quantity For Firm</Label>
              <Input
                type="number"
                value={editQuantityForFirm}
                onChange={(e) => setEditQuantityForFirm(e.target.value)}
                placeholder="Enter new firm quantity (or leave empty)"
                min="0"
              />
            </div>
          </div>
          <DialogFooter className="flex justify-between mt-4">
            <div className="flex gap-2">
              <Button variant="destructive" onClick={handleDeleteMaterial}>
                Delete
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditingMaterial(null)}
              >
                Cancel
              </Button>
            </div>
            <Button onClick={handleUpdateMaterial}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
