"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/layout/layout";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { client } from "@/sanity/client";
import {
  ArrowDownAZ,
  ArrowDownZA,
  ArrowDown01,
  ArrowDown10,
} from "lucide-react";
import AddMaterialButton from "@/components/materials/AddMaterialButton";
import BulkImportMaterials from "@/components/materials/BulkImportMaterials";
import EditMaterialDialog from "@/components/materials/EditMaterialDialog";
import MaterialsDashboard from "@/components/materials/MaterialsDashboard";
import { toast } from "sonner";

/** Material interface matching the GROQ query fields */
interface Material {
  _id: string;
  name: string;
  shopName?: string;
  description: string;
  quantity: number;
  pieces: number;
  Unit: string; // from unit->name
  priceNetto: number;
  Supplier: string; // supplier->name
  Category: string; // category->name
  minQuantity?: number;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/** Allowed sortable keys */
export type SortableKey =
  | "name"
  | "Category"
  | "Supplier"
  | "quantity"
  | "priceNetto"
  | "updatedAt";

/** Single sort configuration */
type SortConfig = {
  key: SortableKey;
  direction: "asc" | "desc";
};

/** The query returns an additional 'shopName' field */
const DATA_QUERY = `{
  "materials": *[_type == "material"] {
    _id,
    name,
    shopName,
    url,
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

/**
 * Helper function to calculate stock status.
 * - "Critical": quantity < minQuantity
 * - "Low Stock": quantity >= minQuantity and quantity < minQuantity + 10
 * - "Good": quantity >= minQuantity + 10
 */
function getStockStatus(material: Material): "Good" | "Low Stock" | "Critical" {
  const min = material.minQuantity ?? 0;
  if (material.quantity < min) return "Critical";
  if (material.quantity < min + 10) return "Low Stock";
  return "Good";
}

export default function MaterialsPage() {
  const router = useRouter();

  // Data and filter option states
  const [materials, setMaterials] = useState<Material[]>([]);
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>(
    []
  );
  const [suppliers, setSuppliers] = useState<{ _id: string; name: string }[]>(
    []
  );

  // Search and filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSupplier, setSelectedSupplier] = useState("all");
  const [selectedStockStatus, setSelectedStockStatus] = useState("all");

  // Single sort configuration with default sort by name ascending
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "name",
    direction: "asc",
  });

  /** Fetch materials and filter options from Sanity */
  const fetchMaterials = () => {
    client
      .fetch<{
        materials: Material[];
        categories: { _id: string; name: string }[];
        suppliers: { _id: string; name: string }[];
      }>(DATA_QUERY)
      .then((data) => {
        setMaterials(data.materials);
        setCategories(data.categories);
        setSuppliers(data.suppliers);
      })
      .catch((error) => {
        console.error("Error fetching materials:", error);
        toast.error("Error fetching materials. See console for details.");
      });
  };

  /** Single-column sort function using the active sortConfig */
  const sortedMaterials = [...materials].sort((a, b) => {
    let aValue = a[sortConfig.key];
    let bValue = b[sortConfig.key];

    // For date comparisons, convert to numeric timestamps
    if (sortConfig.key === "updatedAt") {
      aValue = new Date(aValue).getTime();
      bValue = new Date(bValue).getTime();
    }

    // Compare strings
    if (typeof aValue === "string" && typeof bValue === "string") {
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    }

    // Compare numbers
    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    return 0;
  });

  /** Filter the sorted materials based on search query, category, supplier, and stock status */
  const filteredMaterials = sortedMaterials.filter((material) => {
    // Filter by search query (case-insensitive) on name, Category, or Supplier
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !(
          material.name.toLowerCase().includes(query) ||
          material.Category.toLowerCase().includes(query) ||
          material.Supplier.toLowerCase().includes(query)
        )
      ) {
        return false;
      }
    }
    // Filter by Category if one is selected
    if (selectedCategory !== "all" && material.Category !== selectedCategory) {
      return false;
    }
    // Filter by Supplier if one is selected
    if (selectedSupplier !== "all" && material.Supplier !== selectedSupplier) {
      return false;
    }
    // Filter by Stock Status if one is selected
    if (
      selectedStockStatus !== "all" &&
      getStockStatus(material) !== selectedStockStatus
    ) {
      return false;
    }
    return true;
  });

  /**
   * Handle column header click:
   * - If the same column is clicked, toggle its sort direction.
   * - Otherwise, change sortConfig to the new column (ascending by default).
   */
  const requestSort = (key: SortableKey) => {
    if (sortConfig.key === key) {
      setSortConfig({
        key,
        direction: sortConfig.direction === "asc" ? "desc" : "asc",
      });
    } else {
      setSortConfig({ key, direction: "asc" });
    }
  };

  /**
   * Render the appropriate sort icon.
   * If the column is active, the icon reflects the current sort direction.
   */
  const getSortIcon = (key: SortableKey) => {
    const isActive = sortConfig.key === key;
    const colorClass = isActive ? "text-emerald-600" : "text-gray-400";
    if (key === "name" || key === "Category" || key === "Supplier") {
      return isActive && sortConfig.direction === "asc" ? (
        <ArrowDownAZ className={`inline-block ml-2 ${colorClass}`} />
      ) : isActive ? (
        <ArrowDownZA className={`inline-block ml-2 ${colorClass}`} />
      ) : (
        <ArrowDownAZ className={`inline-block ml-2 ${colorClass}`} />
      );
    } else {
      return isActive && sortConfig.direction === "asc" ? (
        <ArrowDown01 className={`inline-block ml-2 ${colorClass}`} />
      ) : isActive ? (
        <ArrowDown10 className={`inline-block ml-2 ${colorClass}`} />
      ) : (
        <ArrowDown01 className={`inline-block ml-2 ${colorClass}`} />
      );
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    fetchMaterials();
  }, []);

  return (
    <Layout>
      <div className="p-1 space-y-4">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Materials</h2>
          <div className="flex items-center space-x-2">
            <AddMaterialButton refreshMaterials={fetchMaterials} />
          </div>
        </div>

        {/* Optional Dashboard Component */}
        <MaterialsDashboard refreshMaterials={fetchMaterials} />

        {/* Search and Filter Controls */}
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          {/* First group: Search, Category, Supplier */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            {/* Search Field – full width on mobile, limited width on desktop */}
            <Input
              placeholder="Search materials..."
              className="w-full md:max-w-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />

            {/* Category Filter – full width on mobile, fixed width on desktop */}
            <Select
              onValueChange={(val) => setSelectedCategory(val)}
              
            >
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat._id} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Supplier Filter – full width on mobile, fixed width on desktop */}
            <Select
              onValueChange={(val) => setSelectedSupplier(val)}
              
            >
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Supplier" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {suppliers.map((sup) => (
                  <SelectItem key={sup._id} value={sup.name}>
                    {sup.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Second group: Stock Status and Bulk Import */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            {/* Stock Status Filter */}
            <Select
              onValueChange={(val) => setSelectedStockStatus(val)}
              
            >
              <SelectTrigger className="w-full md:w-44">
                <SelectValue placeholder="Stock Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Good">Good</SelectItem>
                <SelectItem value="Low Stock">Low Stock</SelectItem>
                <SelectItem value="Critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            {/* Bulk Import Button */}
            {/* If BulkImportMaterials doesn't accept className, wrap it in a div with the classes */}
            <BulkImportMaterials
              refreshMaterials={fetchMaterials}
            />
          </div>
        </div>

        {/* Materials Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead onClick={() => requestSort("name")}>
                  <div className="cursor-pointer flex items-center flex-nowrap">
                    Name {getSortIcon("name")}
                  </div>
                </TableHead>
                <TableHead onClick={() => requestSort("Category")}>
                  <div className="cursor-pointer flex items-center flex-nowrap">
                    Category {getSortIcon("Category")}
                  </div>
                </TableHead>
                <TableHead onClick={() => requestSort("Supplier")}>
                  <div className="cursor-pointer flex items-center flex-nowrap">
                    Supplier {getSortIcon("Supplier")}
                  </div>
                </TableHead>
                <TableHead onClick={() => requestSort("quantity")}>
                  <div className="cursor-pointer flex items-center flex-nowrap">
                    Quantity {getSortIcon("quantity")}
                  </div>
                </TableHead>
                <TableHead onClick={() => requestSort("priceNetto")}>
                  <div className="cursor-pointer flex items-center flex-nowrap">
                    Price {getSortIcon("priceNetto")}
                  </div>
                </TableHead>
                <TableHead onClick={() => requestSort("updatedAt")}>
                  <div className="cursor-pointer flex items-center flex-nowrap">
                    Last Update {getSortIcon("updatedAt")}
                  </div>
                </TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMaterials.length > 0 ? (
                filteredMaterials.map((material) => (
                  <TableRow key={material._id} className="cursor-default">
                    <TableCell
                      className={`border-l-4 ${
                        material.quantity >= (material.minQuantity ?? 0) + 10
                          ? "border-l-green-500"
                          : material.quantity >= (material.minQuantity ?? 0)
                            ? "border-l-yellow-500"
                            : "border-l-red-500"
                      }`}
                    >
                      {material.name}
                    </TableCell>
                    <TableCell>{material.Category}</TableCell>
                    <TableCell>{material.Supplier}</TableCell>
                    <TableCell>
                      {material.quantity} {material.Unit}
                    </TableCell>
                    <TableCell>{material.priceNetto} zł</TableCell>
                    <TableCell>
                      {new Date(material.updatedAt).toLocaleString()}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <EditMaterialDialog
                        material={material}
                        refreshMaterials={fetchMaterials}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-4">
                    No materials found.
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
