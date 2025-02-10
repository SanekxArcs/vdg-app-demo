"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import { client } from "@/sanity/client";
import { Save, Check, XCircle, AlertTriangle } from "lucide-react";

interface Material {
  _id?: string;
  name: string;
  shopName?: string;
  description?: string;
  category: string; // either the mapped ID or the raw value
  supplier: string;
  unit: string;
  quantity: number; // quantity from the pasted data
  pieces: number;
  minQuantity?: number;
  priceNetto: number;
  url?: string;
  // Bulk import bookkeeping:
  existingId?: string;
  oldPrice?: number;
  oldQuantity?: number;
  newQuantity?: number;
  totalQuantity?: number;
  needsUpdate?: boolean; // if price is different
}

export default function BulkImportMaterials({
  refreshMaterials,
}: {
  refreshMaterials: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [rawData, setRawData] = useState(""); // Raw pasted text
  const [parsedMaterials, setParsedMaterials] = useState<Material[]>([]);

  // Options to map names to IDs.
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [units, setUnits] = useState<{ _id: string; name: string }[]>([]);
  // Existing materials fetched from Sanity (including quantity)
  const [existingMaterials, setExistingMaterials] = useState<Material[]>([]);

  // Fetch reference options.
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

  // Fetch existing materials (including quantity) for matching.
  const fetchExistingMaterials = () => {
    client
      .fetch(
        `*[_type == "material"]{_id, name, shopName, priceNetto, quantity}`
      )
      .then((data) => {
        setExistingMaterials(data);
      })
      .catch((error) =>
        console.error("Error fetching existing materials:", error)
      );
  };

  useEffect(() => {
    fetchExistingMaterials();
  }, []);

  /**
   * A helper to render validated fields for Category, Supplier, or Unit.
   * If the value (which should be an ID) is found among options, shows a green check with the option’s name;
   * otherwise, shows a red X with the raw value.
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

  // Custom parser to split a line by semicolon while respecting quoted fields.
  const parseLine = (line: string): string[] => {
    const fields: string[] = [];
    let currentField = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          currentField += '"';
          i++; // Skip the escaped quote.
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ";" && !inQuotes) {
        fields.push(currentField);
        currentField = "";
      } else {
        currentField += char;
      }
    }
    fields.push(currentField);
    return fields.map((f) => f.trim());
  };

  /**
   * Parse the raw pasted text.
   * Expected format (fields separated by semicolon):
   * Name; Shop Name; Description; Category; Supplier; Unit; Quantity; Pieces; Min Quantity; Price; URL
   */
  const parseData = () => {
    try {
      const lines = rawData
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean);
      let materials: Material[] = lines.map((line) => {
        const fields = parseLine(line);
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
        ] = fields;
        return {
          name,
          shopName: shopName || "",
          description: description || "",
          category, // initially the raw value; will be mapped below
          supplier,
          unit,
          quantity: quantity === "" ? 0 : Number(quantity),
          pieces: pieces === "" ? 1 : Number(pieces),
          minQuantity: minQuantity === "" ? 5 : Number(minQuantity),
          priceNetto:
            priceNetto === "" ? 0 : Number(priceNetto.replace(",", ".")),
          url: url || "",
        };
      });

      // Map category, supplier, and unit names to their IDs if possible.
      materials = materials.map((material) => ({
        ...material,
        category:
          categories.find(
            (cat) => cat.name.toLowerCase() === material.category.toLowerCase()
          )?._id || material.category,
        supplier:
          suppliers.find(
            (sup) => sup.name.toLowerCase() === material.supplier.toLowerCase()
          )?._id || material.supplier,
        unit:
          units.find(
            (u) => u.name.toLowerCase() === material.unit.toLowerCase()
          )?._id || material.unit,
      }));

      // Check if each parsed material already exists (by comparing name and shopName).
      materials = materials.map((material) => {
        const existing = existingMaterials.find(
          (m) =>
            (m.shopName || "").trim().toLowerCase() ===
            (material.shopName || "").trim().toLowerCase()
        );
        if (existing) {
          material.existingId = existing._id;
          material.oldPrice = existing.priceNetto;
          material.oldQuantity = existing.quantity;
          material.newQuantity = material.quantity;
          material.totalQuantity = (existing.quantity || 0) + material.quantity;
          // Flag update if price differs or new quantity is provided.
          material.needsUpdate =
            existing.priceNetto !== material.priceNetto ||
            material.quantity > 0;
        } else {
          material.needsUpdate = false;
        }
        return material;
      });

      setParsedMaterials(materials);
    } catch (error) {
      console.error("Parsing error:", error);
      toast.error("Failed to parse input. Ensure it's formatted correctly.");
    }
  };

  /**
   * Save materials:
   * - For existing items, update quantity (sum old + new) and price if different.
   * - For new items, create a new material.
   * After saving, clear the input and refresh the existing materials.
   */
  const saveMaterials = async () => {
    try {
      await Promise.all(
        parsedMaterials.map(async (material) => {
          if (material.existingId) {
            // Prepare patch update: always update quantity to totalQuantity.
            const patchObj: any = {
              quantity: material.totalQuantity,
              updatedAt: new Date().toISOString(),
            };
            if (material.oldPrice !== material.priceNetto) {
              patchObj.priceNetto = material.priceNetto;
            }
            await client.patch(material.existingId).set(patchObj).commit();
          } else {
            await client.create({
              _type: "material",
              ...material,
              category: { _type: "reference", _ref: material.category },
              supplier: { _type: "reference", _ref: material.supplier },
              unit: { _type: "reference", _ref: material.unit },
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          }
        })
      );
      toast.success("Bulk update successful!");
      setIsOpen(false);
      refreshMaterials();
      // Clear input and parsed preview.
      setRawData("");
      setParsedMaterials([]);
      fetchExistingMaterials();
    } catch (error) {
      console.error("Bulk save error:", error);
      toast.error("Failed to save materials.");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="w-full md:w-auto" variant="outline">
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent>
        <ScrollArea className="max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Bulk Import Materials</DialogTitle>
          </DialogHeader>
          <Textarea
            placeholder={`Paste materials with fields separated by ';':
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
                    <strong>Quantity:</strong>{" "}
                    {material.existingId ? (
                      <span>
                        Old: {material.oldQuantity}, New: {material.newQuantity}
                        , Total: {material.totalQuantity}
                      </span>
                    ) : (
                      <span>{material.quantity}</span>
                    )}
                  </div>
                  <div>
                    <strong>Pieces:</strong> {material.pieces}
                  </div>
                  <div>
                    <strong>Min Quantity:</strong> {material.minQuantity}
                  </div>
                  <div>
                    <strong>Price:</strong> {material.priceNetto} zł{" "}
                    {material.existingId &&
                      material.oldPrice !== material.priceNetto && (
                        <span className="text-orange-600">
                          (Old: {material.oldPrice} zł vs New:{" "}
                          {material.priceNetto} zł)
                        </span>
                      )}
                  </div>
                  <div>
                    <strong>URL:</strong> {material.url}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    {material.existingId ? (
                      material.needsUpdate ? (
                        <span className="flex items-center text-orange-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Update needed
                        </span>
                      ) : (
                        <span className="flex items-center text-green-600">
                          <Check className="h-4 w-4 mr-1" />
                          Already exists
                        </span>
                      )
                    ) : (
                      <span className="flex items-center text-blue-600">
                        <Check className="h-4 w-4 mr-1" />
                        New Material
                      </span>
                    )}
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
