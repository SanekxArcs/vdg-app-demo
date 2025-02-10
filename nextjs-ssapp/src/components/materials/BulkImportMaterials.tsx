"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { client } from "@/sanity/client";
import { Save, Check, XCircle } from "lucide-react";

interface Material {
  _id?: string;
  name: string;
  shopName?: string;
  description?: string;
  category: string; // Either an ID (if found) or the original value
  supplier: string;
  unit: string;
  quantity: number;
  pieces: number;
  minQuantity?: number;
  priceNetto: number;
  url?: string;
}

/** Bulk Import dialog for materials */
export default function BulkImportMaterials({
  refreshMaterials,
}: {
  refreshMaterials: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawData, setRawData] = useState(""); // Raw pasted text
  const [parsedMaterials, setParsedMaterials] = useState<Material[]>([]);

  // Options for mapping names to IDs.
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [units, setUnits] = useState<{ _id: string; name: string }[]>([]);

  // Fetch reference options from Sanity
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

  /**
   * Helper function to render validated values for Category, Supplier, and Unit.
   * If the passed value (which should be an ID) is found among options, it shows a green check and the option’s name.
   * Otherwise, it shows a red X and the raw value.
   */
  const renderValidatedValue = (
    value: string,
    options: { _id: string; name: string }[]
  ) => {
    const found = options.find((opt) => opt._id === value);
    if (found) {
      return (
        <span className="flex items-center space-x-1 text-green-600">
          <Check className="h-4 w-4" />
          <span>{found.name}</span>
        </span>
      );
    } else {
      return (
        <span className="flex items-center space-x-1 text-red-600">
          <XCircle className="h-4 w-4" />
          <span>{value}</span>
        </span>
      );
    }
  };

  /** Parse the raw pasted text into an array of material objects */
  const parseData = () => {
    try {
      // Split the raw data into lines and trim whitespace.
      const lines = rawData
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      let materials: Material[] = lines.map((line) => {
        // Expect fields separated by semicolon in this order:
        // Name; Shop Name; Description; Category; Supplier; Unit; Quantity; Pieces; Min Quantity; Price; URL
        const [
          name,
          shopName,
          description,
          category,
          supplier,
          unit,
          quantity,
          pieces,
          minQuantity,
          priceNetto,
          url,
        ] = line.split(";").map((field) => field.trim());

        return {
          name,
          shopName: shopName || "",
          description: description || "",
          category, // initially a name; will map to ID if found
          supplier, // initially a name; will map to ID if found
          unit, // initially a name; will map to ID if found
          quantity: quantity === "" ? 0 : Number(quantity),
          pieces: pieces === "" ? 1 : Number(pieces),
          minQuantity: minQuantity === "" ? 5 : Number(minQuantity),
          priceNetto:
            priceNetto === "" ? 0 : Number(priceNetto.replace(",", ".")),
          url: url || "",
        };
      });

      // Map category, supplier, and unit names to their reference IDs if found.
      materials = materials.map((material) => ({
        ...material,
        category:
          categories.find((cat) => cat.name === material.category)?._id ||
          material.category,
        supplier:
          suppliers.find((sup) => sup.name === material.supplier)?._id ||
          material.supplier,
        unit: units.find((u) => u.name === material.unit)?._id || material.unit,
      }));

      setParsedMaterials(materials);
    } catch (error) {
      console.error("Parsing error:", error);
      toast.error("Failed to parse input. Ensure it's formatted correctly.");
    }
  };

  /** Save (create or update) the parsed materials to Sanity */
  const saveMaterials = async () => {
    try {
      await Promise.all(
        parsedMaterials.map(async (material) => {
          if (material._id) {
            // Update existing material
            await client.patch(material._id).set(material).commit();
          } else {
            // Create new material
            await client.create({
              _type: "material",
              ...material,
              category: { _type: "reference", _ref: material.category },
              supplier: { _type: "reference", _ref: material.supplier },
              unit: { _type: "reference", _ref: material.unit },
            });
          }
        })
      );
      toast.success("Bulk update successful!");
      setIsOpen(false);
      refreshMaterials();
    } catch (error) {
      console.error("Bulk save error:", error);
      toast.error("Failed to save materials.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Bulk Import</Button>
      </DialogTrigger>
      <DialogContent>
        <ScrollArea className="max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Bulk Import Materials</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={`Paste materials here with fields separated by ';':
Name; Shop Name; Description; Category; Supplier; Unit; Quantity; Pieces; Min Quantity; Price; URL`}
            className="w-full h-40"
            value={rawData}
            onChange={(e) => setRawData(e.target.value)}
          />
          <Button onClick={parseData} className="w-full mt-2">
            Parse Data
          </Button>

          {parsedMaterials.length > 0 && (
            <div className="mt-4 space-y-4">
              {parsedMaterials.map((material, index) => (
                <div
                  key={index}
                  className="p-4 border rounded shadow-sm bg-background flex flex-col space-y-2"
                >
                  <div>
                    <strong>Name:</strong> {material.name}
                  </div>
                  <div>
                    <strong>Shop Name:</strong> {material.shopName}
                  </div>
                  <div>
                    <strong>Description:</strong> {material.description}
                  </div>
                  <div>
                    <strong>Category:</strong>{" "}
                    {renderValidatedValue(material.category, categories)}
                  </div>
                  <div>
                    <strong>Supplier:</strong>{" "}
                    {renderValidatedValue(material.supplier, suppliers)}
                  </div>
                  <div>
                    <strong>Unit:</strong>{" "}
                    {renderValidatedValue(material.unit, units)}
                  </div>
                  <div>
                    <strong>Quantity:</strong> {material.quantity}
                  </div>
                  <div>
                    <strong>Pieces:</strong> {material.pieces}
                  </div>
                  <div>
                    <strong>Min Quantity:</strong> {material.minQuantity}
                  </div>
                  <div>
                    <strong>Price:</strong> {material.priceNetto} zł
                  </div>
                  <div>
                    <strong>URL:</strong> {material.url}
                  </div>
                </div>
              ))}
              <Button onClick={saveMaterials} className="w-full mt-4">
                <Save className="mr-2 h-4 w-4" />
                Save Materials
              </Button>
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
