"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { client } from "@/sanity/client";
import { toast } from "sonner";
import { Save, Trash, ArrowLeft } from "lucide-react"; // ✅ Import icons

const MATERIAL_QUERY = (
  id: string
) => `*[_type == "material" && _id == "${id}"][0]{
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
}`;

export default function MaterialDetailsPage() {
  const { id } = useParams();
  const router = useRouter();
  const [material, setMaterial] = useState<any>(null);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    if (!id) return;

    // Fetch material details
    client
      .fetch(MATERIAL_QUERY(id))
      .then(setMaterial)
      .catch((error) => console.error("Error fetching material:", error));

    // Fetch categories, suppliers, and units
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
  }, [id]);

  const handleUpdate = async () => {
    try {
      await client
        .patch(id)
        .set({ ...material, updatedAt: new Date().toISOString() })
        .commit();

      toast.success("Material updated successfully!");
    } catch (error) {
      console.error("Sanity update error:", error);
      toast.error("Failed to update material.");
    }
  };

  const handleClickSaveAndBack = () => {
    handleUpdate();
    router.push("/materials");
  };

  const handleDelete = async () => {
    try {
      await client.delete(id);
      toast.success("Material deleted successfully!");
      router.push("/materials");
    } catch (error) {
      console.error("Sanity delete error:", error);
      toast.error("Failed to delete material.");
    }
  };

  if (!material) return <div className="p-8 text-center">Loading...</div>;

  return (
    <Layout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Back Button */}
        <Button
          variant="outline"
          className="flex items-center gap-2 text-black  hover:bg-gray-200"
          onClick={() => router.push("/materials")}
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <h2 className="text-3xl font-bold tracking-tight">Edit Material</h2>

        {/* Name */}
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={material.name || ""}
            onChange={(e) => setMaterial({ ...material, name: e.target.value })}
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
            value={material.Category || ""}
            onValueChange={(value) =>
              setMaterial({ ...material, Category: value })
            }
          >
            <SelectTrigger>
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

        {/* Supplier */}
        <div className="space-y-2">
          <Label>Supplier</Label>
          <Select
            value={material.Supplier || ""}
            onValueChange={(value) =>
              setMaterial({ ...material, Supplier: value })
            }
          >
            <SelectTrigger>
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

        {/* Unit */}
        <div className="space-y-2">
          <Label>Unit</Label>
          <Select
            value={material.Unit || ""}
            onValueChange={(value) => setMaterial({ ...material, Unit: value })}
          >
            <SelectTrigger>
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
          <Label>Quantity</Label>
          <Input
            type="number"
            value={material.quantity || 0}
            onChange={(e) =>
              setMaterial({ ...material, quantity: Number(e.target.value) })
            }
          />
        </div>

        {/* Pieces */}
        <div className="space-y-2">
          <Label>Pieces</Label>
          <Input
            type="number"
            value={material.pieces || 0}
            onChange={(e) =>
              setMaterial({ ...material, pieces: Number(e.target.value) })
            }
          />
        </div>

        {/* Minimum Quantity */}
        <div className="space-y-2">
          <Label>Minimum Quantity</Label>
          <Input
            type="number"
            value={material.minQuantity || 0}
            onChange={(e) =>
              setMaterial({ ...material, minQuantity: Number(e.target.value) })
            }
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label>Price Netto</Label>
          <Input
            type="number"
            step="0.01"
            value={material.priceNetto || 0}
            onChange={(e) =>
              setMaterial({ ...material, priceNetto: Number(e.target.value) })
            }
          />
        </div>

        {/* Created At (Read-Only) */}
        <div className="space-y-2">
          <Label>Created At</Label>
          <Input
            type="text"
            value={new Date(material.createdAt).toLocaleString()}
            readOnly
            className="bg-gray-100 cursor-not-allowed"
          />
        </div>

        {/* Last Updated */}
        <p className="text-sm text-gray-500">
          Last Updated: {new Date(material.updatedAt).toLocaleString()}
        </p>

        <div className="flex justify-between mt-6">
          {/* Save Button (White with Black Border, Green on Hover) */}
          <Button
            onClick={handleUpdate}
            variant="outline"
            className="flex items-center gap-2 bg-white text-black hover:bg-green-500 hover:text-white"
          >
            <Save size={16} />
            Save
          </Button>
          {/* Save Button (White with Black Border, Green on Hover) */}
          <Button
            onClick={handleClickSaveAndBack}
            variant="outline"
            className="flex items-center gap-2 bg-white text-black hover:bg-green-500 hover:text-white"
          >
            <Save size={16} />
            Save and Back <ArrowLeft size={16} />
          </Button>

          {/* Delete Button (Black with White Text, Red on Hover) */}
          <Button
            onClick={handleDelete}
            className="flex items-center gap-2 bg-black text-white hover:bg-red-500"
          >
            <Trash size={16} />
            Delete
          </Button>
        </div>
      </div>
    </Layout>
  );
}
