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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit, Save, Trash } from "lucide-react";
import { client } from "@/sanity/client";
import { toast } from "sonner";

interface Material {
  _id: string;
  name: string;
  shopName?: string;
  description: string;
  quantity: number;
  pieces: number;
  Unit: string; // may be a name instead of id
  priceNetto: number;
  Supplier: string; // may be a name instead of id
  Category: string; // may be a name instead of id
  minQuantity?: number;
  createdAt: string;
  updatedAt: string;
  url?: string;
}

interface EditMaterialDialogProps {
  material: Material;
  refreshMaterials: () => void;
}

export default function EditMaterialDialog({
  material,
  refreshMaterials,
}: EditMaterialDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Local editable state is initialized from the passed material.
  // Note: We expect material.Category, Supplier, and Unit to be names,
  // so we later convert them to the matching IDs.
  const [editedMaterial, setEditedMaterial] = useState({
    name: material.name,
    shopName: material.shopName || "",
    description: material.description,
    category: material.Category, // initially a name
    supplier: material.Supplier, // initially a name
    unit: material.Unit, // initially a name
    quantity: material.quantity,
    pieces: material.pieces,
    minQuantity: material.minQuantity || 5,
    priceNetto: material.priceNetto,
    url: material.url || "",
    updatedAt: material.updatedAt, // read-only
  });

  // States for select options
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [units, setUnits] = useState<{ _id: string; name: string }[]>([]);

  // Fetch options for Category, Supplier, and Unit selects
  useEffect(() => {
    client
      .fetch(
        `{
          "categories": *[_type == "category"]{_id, name},
          "suppliers": *[_type == "supplier"]{_id, name},
          "units": *[_type == "pieceType"]{_id, name}
        }`
      )
      .then((data) => {
        setCategories(data.categories);
        setSuppliers(data.suppliers);
        setUnits(data.units);
      })
      .catch((error) => console.error("Error fetching options:", error));
  }, []);

  // Convert the category field from name to id (if needed)
  useEffect(() => {
    if (categories.length > 0 && editedMaterial.category) {
      // Check if the current value already exists as an id
      const exists = categories.some(
        (cat) => cat._id === editedMaterial.category
      );
      if (!exists) {
        const found = categories.find(
          (cat) => cat.name === editedMaterial.category
        );
        if (found) {
          setEditedMaterial((prev) => ({ ...prev, category: found._id }));
        }
      }
    }
  }, [categories, editedMaterial.category]);

  // Convert the supplier field from name to id (if needed)
  useEffect(() => {
    if (suppliers.length > 0 && editedMaterial.supplier) {
      const exists = suppliers.some(
        (sup) => sup._id === editedMaterial.supplier
      );
      if (!exists) {
        const found = suppliers.find(
          (sup) => sup.name === editedMaterial.supplier
        );
        if (found) {
          setEditedMaterial((prev) => ({ ...prev, supplier: found._id }));
        }
      }
    }
  }, [suppliers, editedMaterial.supplier]);

  // Convert the unit field from name to id (if needed)
  useEffect(() => {
    if (units.length > 0 && editedMaterial.unit) {
      const exists = units.some((unit) => unit._id === editedMaterial.unit);
      if (!exists) {
        const found = units.find((unit) => unit.name === editedMaterial.unit);
        if (found) {
          setEditedMaterial((prev) => ({ ...prev, unit: found._id }));
        }
      }
    }
  }, [units, editedMaterial.unit]);

  // Handler to save changes using a patch update
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const newUpdatedAt = new Date().toISOString();
      await client
        .patch(material._id)
        .set({
          name: editedMaterial.name,
          shopName: editedMaterial.shopName,
          description: editedMaterial.description,
          category: { _type: "reference", _ref: editedMaterial.category },
          supplier: { _type: "reference", _ref: editedMaterial.supplier },
          unit: { _type: "reference", _ref: editedMaterial.unit },
          quantity: editedMaterial.quantity,
          pieces: editedMaterial.pieces,
          minQuantity: editedMaterial.minQuantity,
          priceNetto: editedMaterial.priceNetto,
          url: editedMaterial.url,
          updatedAt: newUpdatedAt,
        })
        .commit();
      toast.success("Material updated successfully!");
      setIsOpen(false);
      refreshMaterials();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update material.");
    }
  };

  // Handler to delete the material
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this material?")) return;
    try {
      await client.delete(material._id);
      toast.success("Material deleted successfully!");
      setIsOpen(false);
      refreshMaterials();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete material.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {/* Trigger the dialog with an edit button */}
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <ScrollArea className="max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Edit Material</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={editedMaterial.name}
                onChange={(e) =>
                  setEditedMaterial({ ...editedMaterial, name: e.target.value })
                }
                required
              />
            </div>
            {/* Shop Name */}
            <div className="space-y-2">
              <Label>Shop Name</Label>
              <Input
                value={editedMaterial.shopName}
                onChange={(e) =>
                  setEditedMaterial({
                    ...editedMaterial,
                    shopName: e.target.value,
                  })
                }
              />
            </div>
            {/* Description */}
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={editedMaterial.description}
                onChange={(e) =>
                  setEditedMaterial({
                    ...editedMaterial,
                    description: e.target.value,
                  })
                }
              />
            </div>
            {/* Category */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={editedMaterial.category}
                onValueChange={(value) =>
                  setEditedMaterial({ ...editedMaterial, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
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
            {/* Supplier */}
            <div className="space-y-2">
              <Label>Supplier</Label>
              <Select
                value={editedMaterial.supplier}
                onValueChange={(value) =>
                  setEditedMaterial({ ...editedMaterial, supplier: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((sup) => (
                    <SelectItem key={sup._id} value={sup._id}>
                      {sup.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {/* URL */}
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                type="url"
                value={editedMaterial.url}
                onChange={(e) =>
                  setEditedMaterial({ ...editedMaterial, url: e.target.value })
                }
              />
            </div>
            {/* Unit */}
            <div className="space-y-2">
              <Label>Unit</Label>
              <Select
                value={editedMaterial.unit}
                onValueChange={(value) =>
                  setEditedMaterial({ ...editedMaterial, unit: value })
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
            {/* Quantity & Pieces */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={editedMaterial.quantity}
                  onChange={(e) =>
                    setEditedMaterial({
                      ...editedMaterial,
                      quantity: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Pieces</Label>
                <Input
                  type="number"
                  min="1"
                  value={editedMaterial.pieces}
                  onChange={(e) =>
                    setEditedMaterial({
                      ...editedMaterial,
                      pieces: Number(e.target.value),
                    })
                  }
                  required
                />
              </div>
            </div>
            {/* Minimum Quantity & Price Netto */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Minimum Quantity</Label>
                <Input
                  type="number"
                  min="0"
                  value={editedMaterial.minQuantity}
                  onChange={(e) =>
                    setEditedMaterial({
                      ...editedMaterial,
                      minQuantity: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Price Netto</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={editedMaterial.priceNetto}
                  onChange={(e) =>
                    setEditedMaterial({
                      ...editedMaterial,
                      priceNetto: Number(e.target.value.replace(",", ".")),
                    })
                  }
                  required
                />
              </div>
            </div>
            {/* Last Updated (disabled) */}
            <div className="space-y-2">
              <Label>Last Updated</Label>
              <Input value={editedMaterial.updatedAt} disabled />
            </div>
            {/* Action buttons */}
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </Button>
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" />
                Save
              </Button>
            </div>
          </form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
