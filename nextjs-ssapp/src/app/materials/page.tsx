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

const MATERIALS_QUERY = `*[_type == "material"] {
  _id,
  name,
  description,
  quantity,
  pieces,
  "Unit": unit->name,          // Follow unit reference
  priceNetto,
  "Supplier": supplier->name,  // Follow supplier reference
  "Category": category->name,  // Follow category reference
  minQuantity,
  createdAt,
}
`;
const options = { next: { revalidate: 30 } };

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  useEffect(() => {
  client.fetch<SanityDocument[]>(MATERIALS_QUERY, {}, options)
    .then((data) => {
      console.log("Fetched materials:", data);
      setMaterials(data);
    });
}, []);

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
                      <SelectItem value="metal">Metal</SelectItem>
                      <SelectItem value="wood">Wood</SelectItem>
                      <SelectItem value="plastic">Plastic</SelectItem>
                      <SelectItem value="electronics">Electronics</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input id="quantity" name="quantity" type="number" min="0" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="price">Price</Label>
                    <Input id="price" name="price" type="number" min="0" step="0.01" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="minQuantity">Minimum Stock</Label>
                  <Input id="minQuantity" name="minQuantity" type="number" min="0" placeholder="Enter minimum stock" />
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
                    <TableCell>{material.quantity} {material.Unit}</TableCell>
                    <TableCell>{material.priceNetto} zl</TableCell>
                    <TableCell>
                      <Button variant="link">Edit</Button>
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
      </div>
    </Layout>
  );
}
