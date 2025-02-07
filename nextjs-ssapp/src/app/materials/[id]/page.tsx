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
import { Save, Trash, ArrowLeft } from "lucide-react";

// Interfaces for your reference documents
interface Category {
  _id: string;
  name: string;
}

interface Supplier {
  _id: string;
  name: string;
}

interface Unit {
  _id: string;
  name: string;
}

// Interface for your "material" object fetched from Sanity
interface Material {
  _id: string;
  name: string;
  description: string;
  quantity: number;
  pieces: number;
  Unit: string; // e.g. "kg", "pieces", etc. (resolved from unit->name)
  priceNetto: number;
  Supplier: string; // supplier->name
  Category: string; // category->name
  minQuantity: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

// GROQ query for a single material by _id
const MATERIAL_QUERY = (id: string) => `
  *[_type == "material" && _id == "${id}"][0]{
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
  }
`;

export default function MaterialDetailsPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // Material state
  const [material, setMaterial] = useState<Material | null>(null);

  // Arrays for categories, suppliers, and units
  const [categories, setCategories] = useState<Category[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    if (!id) return;

    // 1) Fetch material details
    client
      .fetch<Material>(MATERIAL_QUERY(id)) // <Material> for type inference
      .then((fetchedMaterial) => {
        setMaterial(fetchedMaterial);
      })
      .catch((error) => console.error("Error fetching material:", error));

    // 2) Fetch categories, suppliers, and units
    client
      .fetch<{
        categories: Category[];
        suppliers: Supplier[];
        units: Unit[];
      }>(
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
    if (!material) return;
    try {
      await client
        .patch(material._id)
        .set({
          
          ...material,
          updatedAt: new Date().toISOString(),
        })
        .commit();

      toast.success("Material updated successfully!");
    } catch (error) {
      console.error("Sanity update error:", error);
      toast.error("Failed to update material.");
    }
  };

  const handleClickSaveAndBack = async () => {
    await handleUpdate();
    router.push("/materials");
  };

  const handleDelete = async () => {
    if (!material) return;
    try {
      await client.delete(material._id);
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
          className="flex items-center gap-2 text-black hover:bg-gray-200"
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
            value={material.name}
            onChange={(e) =>
              setMaterial((prev) =>
                prev ? { ...prev, name: e.target.value } : null
              )
            }
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea
            value={material.description}
            onChange={(e) =>
              setMaterial((prev) =>
                prev ? { ...prev, description: e.target.value } : null
              )
            }
          />
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label>Category</Label>
          <Select
            value={material.Category || ""}
            onValueChange={(value) =>
              setMaterial((prev) =>
                prev ? { ...prev, Category: value } : null
              )
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
              setMaterial((prev) =>
                prev ? { ...prev, Supplier: value } : null
              )
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
            onValueChange={(value) =>
              setMaterial((prev) => (prev ? { ...prev, Unit: value } : null))
            }
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
            value={material.quantity}
            onChange={(e) =>
              setMaterial((prev) =>
                prev
                  ? { ...prev, quantity: parseInt(e.target.value, 10) || 0 }
                  : null
              )
            }
          />
        </div>

        {/* Pieces */}
        <div className="space-y-2">
          <Label>Pieces</Label>
          <Input
            type="number"
            value={material.pieces}
            onChange={(e) =>
              setMaterial((prev) =>
                prev
                  ? { ...prev, pieces: parseInt(e.target.value, 10) || 0 }
                  : null
              )
            }
          />
        </div>

        {/* Minimum Quantity */}
        <div className="space-y-2">
          <Label>Minimum Quantity</Label>
          <Input
            type="number"
            value={material.minQuantity}
            onChange={(e) =>
              setMaterial((prev) =>
                prev
                  ? {
                      ...prev,
                      minQuantity: parseInt(e.target.value, 10) || 0,
                    }
                  : null
              )
            }
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <Label>Price Netto</Label>
          <Input
            type="number"
            step="0.01"
            value={material.priceNetto}
            onChange={(e) =>
              setMaterial((prev) =>
                prev
                  ? {
                      ...prev,
                      priceNetto: parseFloat(e.target.value) || 0,
                    }
                  : null
              )
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
          {/* Save Button */}
          <Button
            onClick={handleUpdate}
            variant="outline"
            className="flex items-center gap-2 bg-white text-black hover:bg-green-500 hover:text-white"
          >
            <Save size={16} />
            Save
          </Button>

          {/* Save and Back */}
          <Button
            onClick={handleClickSaveAndBack}
            variant="outline"
            className="flex items-center gap-2 bg-white text-black hover:bg-green-500 hover:text-white"
          >
            <Save size={16} />
            Save and Back <ArrowLeft size={16} />
          </Button>

          {/* Delete Button */}
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
