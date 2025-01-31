"use client";

import { Layout } from "@/components/layout/layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Material } from "@/types";

// Mock materials data - this would come from your materials page
const materials: Material[] = [
  {
    id: "1",
    name: "Steel Pipes",
    description: "2-inch diameter steel pipes",
    quantity: 500,
    unit: "pieces",
    price: 25.99,
    supplier: "Steel Corp",
    category: "Metal",
    minQuantity: 100,
    location: "Warehouse A",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  {
    id: "2",
    name: "Copper Wire",
    description: "12 gauge copper wire",
    quantity: 1000,
    unit: "meters",
    price: 3.5,
    supplier: "Wire Co",
    category: "Metal",
    minQuantity: 200,
    location: "Warehouse B",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
];

interface MaterialQuantity {
  materialId: string;
  quantity: number;
}

export default function NewProjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [materialQuantities, setMaterialQuantities] = useState<
    MaterialQuantity[]
  >([]);
  const [formData, setFormData] = useState({
    projectNumber: "",
    address: "",
    brand: "",
    newBrand: "",
  });

  const handleQuantityChange = (materialId: string, quantity: string) => {
    const numericQuantity = quantity === "" ? 0 : parseInt(quantity, 10);

    setMaterialQuantities((prev) => {
      const existing = prev.find((m) => m.materialId === materialId);
      if (existing) {
        return prev.map((m) =>
          m.materialId === materialId ? { ...m, quantity: numericQuantity } : m
        );
      }
      return [...prev, { materialId, quantity: numericQuantity }];
    });
  };

  const getQuantity = (materialId: string): string => {
    const material = materialQuantities.find(
      (m) => m.materialId === materialId
    );
    return material?.quantity ? material.quantity.toString() : "";
  };

  const calculateBudget = (): number => {
    return materialQuantities.reduce((total, mq) => {
      const material = materials.find((m) => m.id === mq.materialId);
      if (material && mq.quantity > 0) {
        return total + material.price * mq.quantity;
      }
      return total;
    }, 0);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const projectData = {
      name: formData.get("name"),
      description: formData.get("description"),
      status: formData.get("status"),
      startDate: formData.get("startDate"),
      endDate: formData.get("endDate"),
      materials: materialQuantities.filter((mq) => mq.quantity > 0),
      budget: calculateBudget(),
    };

    console.log("Submitting project:", projectData);

    // Here you would submit the data to your backend

    setIsLoading(false);
    router.push("/projects");
  };

  return (
    <Layout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">New Project</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Project Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="Enter project name"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Enter project description"
                    className="min-h-[100px]"
                  />
                </div>

                {/* Number field */}
                <div className="mb-4">
                  <Label htmlFor="projectNumber">Project Number</Label>
                  <Input
                    id="projectNumber"
                    name="projectNumber"
                    type="number"
                    value={formData.projectNumber}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Replace 'name' with 'address' and button to open map */}
                <div className="mb-4">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                  <Button
                    variant="outline"
                    type="button"
                    onClick={() =>
                      window.open(
                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          formData.address
                        )}`,
                        "_blank"
                      )
                    }
                  >
                    Map
                  </Button>
                </div>

                {/* Button/options for status or firm */}
                <div className="mb-4">
                  <Label htmlFor="brand">Firm</Label>
                  <Select name="brand">
                    <SelectTrigger>
                      <SelectValue placeholder="Select firm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Biedronka">Biedronka</SelectItem>
                      <SelectItem value="in-progress">Aldi</SelectItem>
                    </SelectContent>
                  </Select>
                  {formData.brand === "New" && (
                    <Input
                      id="newBrand"
                      name="newBrand"
                      type="text"
                      placeholder="New firm name"
                      onChange={handleChange}
                    />
                  )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select name="status">
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="planned">Planned</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="budget">Total Budget</Label>
                    <Input
                      id="budget"
                      type="number"
                      value={calculateBudget().toFixed(2)}
                      disabled
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input id="endDate" name="endDate" type="date" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Materials</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Price (Netto)</TableHead>
                      <TableHead>Unit</TableHead>
                      <TableHead>Pieces</TableHead>
                      <TableHead>Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {materials.map((material) => {
                      const quantity =
                        parseInt(getQuantity(material.id), 10) || 0;
                      const subtotal = quantity * material.price;

                      return (
                        <TableRow key={material.id}>
                          <TableCell>{material.name}</TableCell>
                          <TableCell>${material.price.toFixed(2)}</TableCell>
                          <TableCell>{material.unit}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              value={getQuantity(material.id)}
                              onChange={(e) =>
                                handleQuantityChange(
                                  material.id,
                                  e.target.value
                                )
                              }
                              className="w-24"
                            />
                          </TableCell>
                          <TableCell>
                            ${quantity > 0 ? subtotal.toFixed(2) : "0.00"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>

          <div className="mt-4 flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => router.push("/projects")}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
