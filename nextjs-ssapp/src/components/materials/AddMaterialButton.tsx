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
import { Plus } from "lucide-react";
import { client } from "@/sanity/client";
import { toast } from "sonner";

export default function AddMaterialButton({
  refreshMaterials,
}: {
  refreshMaterials: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [material, setMaterial] = useState({
    name: "",
    description: "",
    category: "",
    supplier: "",
    unit: "",
    quantity: 0,
    pieces: 1,
    minQuantity: 5,
    priceNetto: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  // State for Categories, Suppliers, and Units
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [units, setUnits] = useState<{ _id: string; name: string }[]>([]);

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
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await client.create({
        _type: "material",
        ...material,
        category: { _type: "reference", _ref: material.category }, // ✅ Store as reference
        supplier: { _type: "reference", _ref: material.supplier }, // ✅ Store as reference
        unit: { _type: "reference", _ref: material.unit }, // ✅ Store as reference
      });

      toast.success("Material added successfully!");
      setIsOpen(false);
      refreshMaterials(); // ✅ Refresh the materials list
    } catch (error) {
      console.error("Sanity create error:", error);
      toast.error("Failed to add material.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Material
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Material</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label>Name</Label>
            <Input
              value={material.name}
              onChange={(e) =>
                setMaterial({ ...material, name: e.target.value })
              }
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              value={material.description}
              onChange={(e) =>
                setMaterial({ ...material, description: e.target.value })
              }
            />
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              onValueChange={(value) =>
                setMaterial({ ...material, category: value })
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
              onValueChange={(value) =>
                setMaterial({ ...material, supplier: value })
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
              onValueChange={(value) =>
                setMaterial({ ...material, unit: value })
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
                value={material.quantity}
                onChange={(e) =>
                  setMaterial({ ...material, quantity: Number(e.target.value) })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Pieces</Label>
              <Input
                type="number"
                min="1"
                value={material.pieces}
                onChange={(e) =>
                  setMaterial({ ...material, pieces: Number(e.target.value) })
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
                value={material.minQuantity}
                onChange={(e) =>
                  setMaterial({
                    ...material,
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
                value={material.priceNetto}
                onChange={(e) =>
                  setMaterial({
                    ...material,
                    priceNetto: Number(e.target.value),
                  })
                }
                required
              />
            </div>
          </div>

          {/* Submit Button */}
          <Button type="submit" className="w-full">
            Add Material
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
