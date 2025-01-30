"use client";

import { useState, useEffect } from "react";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { client } from "@/sanity/client";
import type { Material } from "@/sanity/types";
import { type SanityDocument } from "next-sanity";
import { toast } from "sonner";

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

const options = { next: { revalidate: 30 } };

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [units, setUnits] = useState<{ _id: string; name: string }[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentMaterial, setCurrentMaterial] = useState<Material | null>(null);

  useEffect(() => {
    client
      .fetch<SanityDocument[]>(DATA_QUERY, {}, options)
      .then((data) => {
        console.log("Fetched data:", data);
        setMaterials(data.materials);
        setCategories(data.categories);
        setSuppliers(data.suppliers);
        setUnits(data.pieceType);
      })
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

const handleEdit = (material: Material) => {
  setCurrentMaterial(material);
  setIsEditDialogOpen(true);
  toast.info("You are editing a material");
};

  const handleUpdate = async (updatedMaterial: Material) => {
    try {
      await client
        .patch(updatedMaterial._id)
        .set({
          name: updatedMaterial.name,
          Category: updatedMaterial.Category,
          Supplier: updatedMaterial.Supplier,
          Unit: updatedMaterial.Unit,
          quantity: updatedMaterial.quantity,
          priceNetto: updatedMaterial.priceNetto,
          minQuantity: updatedMaterial.minQuantity,
        })
        .commit();

      setMaterials((prev) =>
        prev.map((m) => (m._id === updatedMaterial._id ? updatedMaterial : m))
      );
      setIsEditDialogOpen(false);

      toast.success("Material updated successfully!");
    } catch (error) {
      console.error("Sanity update error:", error);
      toast.error("Failed to update material.");
    }
  };

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Materials</h2>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Material
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Material</DialogTitle>
                <DialogDescription>
                  Add a new material to your inventory
                </DialogDescription>
              </DialogHeader>
              <form className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" name="name" placeholder="Material name" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select name="category">
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select name="supplier">
                    <SelectTrigger id="supplier">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier._id} value={supplier.name}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select name="unit">
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit._id} value={unit.name}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      name="quantity"
                      type="number"
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minQuantity">Minimum Stock</Label>
                  <Input
                    id="minQuantity"
                    name="minQuantity"
                    type="number"
                    min="0"
                    placeholder="Enter minimum stock"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Add Material
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.length > 0 ? (
                materials.map((material) => (
                  <TableRow key={material._id}>
                    <TableCell>{material.name}</TableCell>
                    <TableCell>{material.Category}</TableCell>
                    <TableCell>{material.Supplier}</TableCell>
                    <TableCell>
                      {material.quantity} {material.Unit}
                    </TableCell>
                    <TableCell>{material.priceNetto} zl</TableCell>
                    <TableCell>
                      <Button
                        variant="link"
                        onClick={() => handleEdit(material)}
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No materials found (check concole for read errors).
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Material</DialogTitle>
              <DialogDescription>
                Modify the details of the material
              </DialogDescription>
            </DialogHeader>

            {currentMaterial && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleUpdate(currentMaterial);
                }}
                className="space-y-4"
              >
                {/* Name */}
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={currentMaterial.name || ""}
                    onChange={(e) =>
                      setCurrentMaterial({
                        ...currentMaterial,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={currentMaterial.Category || ""}
                    onValueChange={(value) =>
                      setCurrentMaterial({
                        ...currentMaterial,
                        Category: value,
                      })
                    }
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category._id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Supplier Selection */}
                <div className="space-y-2">
                  <Label htmlFor="supplier">Supplier</Label>
                  <Select
                    value={currentMaterial.Supplier || ""}
                    onValueChange={(value) =>
                      setCurrentMaterial({
                        ...currentMaterial,
                        Supplier: value,
                      })
                    }
                  >
                    <SelectTrigger id="supplier">
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier._id} value={supplier.name}>
                          {supplier.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Unit Selection */}
                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={currentMaterial.Unit || ""}
                    onValueChange={(value) =>
                      setCurrentMaterial({ ...currentMaterial, Unit: value })
                    }
                  >
                    <SelectTrigger id="unit">
                      <SelectValue placeholder="Select unit" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem key={unit._id} value={unit.name}>
                          {unit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Quantity */}
                <div className="space-y-2">
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    min="0"
                    value={currentMaterial.quantity || 0}
                    onChange={(e) =>
                      setCurrentMaterial({
                        ...currentMaterial,
                        quantity: Number(e.target.value),
                      })
                    }
                  />
                </div>

                {/* Price */}
                <div className="space-y-2">
                  <Label htmlFor="price">Price (Netto)</Label>
                  <Input
                    id="price"
                    name="priceNetto"
                    type="number"
                    min="0"
                    step="0.01"
                    value={currentMaterial.priceNetto || 0}
                    onChange={(e) =>
                      setCurrentMaterial({
                        ...currentMaterial,
                        priceNetto: Number(e.target.value),
                      })
                    }
                  />
                </div>

                {/* Minimum Stock */}
                <div className="space-y-2">
                  <Label htmlFor="minQuantity">Minimum Stock</Label>
                  <Input
                    id="minQuantity"
                    name="minQuantity"
                    type="number"
                    min="0"
                    value={currentMaterial.minQuantity || 0}
                    onChange={(e) =>
                      setCurrentMaterial({
                        ...currentMaterial,
                        minQuantity: Number(e.target.value),
                      })
                    }
                  />
                </div>

                {/* Submit Button */}
                <Button type="submit" className="w-full">
                  Update Material
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
