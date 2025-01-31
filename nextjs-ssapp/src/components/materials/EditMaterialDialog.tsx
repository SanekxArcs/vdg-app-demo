"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Trash } from "lucide-react";
import { client } from "@/sanity/client";
import { toast } from "sonner";

export default function EditMaterialDialog({
  materialId,
  isOpen,
  onClose,
  refreshMaterials,
}: {
  materialId: string;
  isOpen: boolean;
  onClose: () => void;
  refreshMaterials: () => void;
}) {
  const [material, setMaterial] = useState<any>(null);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [units, setUnits] = useState<{ _id: string; name: string }[]>([]);

  useEffect(() => {
    if (!materialId) return;

    client
      .fetch(
        `{
      "material": *[_type == "material" && _id == "${materialId}"][0],
      "categories": *[_type == "category"]{_id, name},
      "suppliers": *[_type == "supplier"]{_id, name},
      "units": *[_type == "pieceType"]{_id, name}
    }`
      )
      .then((data) => {
        setMaterial(data.material);
        setCategories(data.categories);
        setSuppliers(data.suppliers);
        setUnits(data.units);
      })
      .catch((error) => console.error("Error fetching material:", error));
  }, [materialId]);

  const handleUpdate = async () => {
    try {
      await client
        .patch(materialId)
        .set({
          ...material,
          category: { _type: "reference", _ref: material.category },
          supplier: { _type: "reference", _ref: material.supplier },
          unit: { _type: "reference", _ref: material.unit },
          updatedAt: new Date().toISOString(),
        })
        .commit();

      toast.success("Material updated successfully!");
      refreshMaterials();
      onClose();
    } catch (error) {
      console.error("Sanity update error:", error);
      toast.error("Failed to update material.");
    }
  };

  const handleDelete = async () => {
    try {
      await client.delete(materialId);
      toast.success("Material deleted successfully!");
      refreshMaterials();
      onClose();
    } catch (error) {
      console.error("Sanity delete error:", error);
      toast.error("Failed to delete material.");
    }
  };

  if (!material) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Material</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={material.name || ""}
              onChange={(e) =>
                setMaterial({ ...material, name: e.target.value })
              }
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={material.description || ""}
              onChange={(e) =>
                setMaterial({ ...material, description: e.target.value })
              }
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              value={material.category?._ref || ""}
              onValueChange={(value) =>
                setMaterial({
                  ...material,
                  category: { _ref: value, _type: "reference" },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category._id} value={category._id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Supplier */}
          <div className="space-y-2">
            <Label>Supplier</Label>
            <Select
              value={material.supplier?._ref || ""}
              onValueChange={(value) =>
                setMaterial({
                  ...material,
                  supplier: { _ref: value, _type: "reference" },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select supplier" />
              </SelectTrigger>
              <SelectContent>
                {suppliers.map((supplier) => (
                  <SelectItem key={supplier._id} value={supplier._id}>
                    {supplier.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Unit */}
          <div className="space-y-2">
            <Label>Unit</Label>
            <Select
              value={material.unit?._ref || ""}
              onValueChange={(value) =>
                setMaterial({
                  ...material,
                  unit: { _ref: value, _type: "reference" },
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select unit" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit._id} value={unit._id}>
                    {unit.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Quantity & Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min="0"
                value={material.quantity || 0}
                onChange={(e) =>
                  setMaterial({ ...material, quantity: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Price Netto</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={material.priceNetto || 0}
                onChange={(e) =>
                  setMaterial({
                    ...material,
                    priceNetto: Number(e.target.value),
                  })
                }
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-between">
            <Button
              onClick={handleUpdate}
              className="bg-white text-black border border-black hover:bg-green-500"
            >
              <Save size={16} />
              Save
            </Button>
            <Button
              onClick={handleSaveAndGoBack}
              className="bg-white text-black border border-black hover:bg-blue-500"
            >
              <Save size={16} />
              Save and Go Back
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-black text-white hover:bg-red-500"
            >
              <Trash size={16} />
              Delete
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add the new handler function
const handleSaveAndGoBack = () => {
  handleUpdate();
  // Add navigation logic here, for example:
  router.push('/materials');
};
