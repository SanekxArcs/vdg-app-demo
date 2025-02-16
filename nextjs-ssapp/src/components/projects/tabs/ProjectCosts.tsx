"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { client } from "@/sanity/client";
import { nanoid } from "nanoid";
import { toast } from "sonner";
import { groq } from "next-sanity";

// Define interfaces for the necessary data
interface UsedMaterial {
  _key: string;
  quantity: number;
  id: string;
  material: {
    name: string;
    priceNetto: number;
    unit: { name: string };
    pieces: number;
  } | null;
}

interface AdditionalCost {
  _key: string;
  description: string;
  amount: number;
}

interface ProjectData {
  _id: string;
  materials: UsedMaterial[];
  additionalCosts: AdditionalCost[];
  totalBudget: number;
}

export function ProjectCosts() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  // Local state for project data and loading indicator
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // Local state for the "Add New Cost" form
  const [newCostName, setNewCostName] = useState<string>("");
  const [newCostAmount, setNewCostAmount] = useState<string>("");

  // GROQ query to load only necessary fields
  const projectQuery = groq`
    *[_type=="project" && _id==$id][0]{
      _id,
      materials[] {
        "material": material-> { name, priceNetto, unit->{name}, pieces },
        quantity,
        id
      },
      additionalCosts,
      totalBudget
    }
  `;

  // Fetch project data from Sanity
  const fetchProject = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await client.fetch<ProjectData>(projectQuery, { id });
      setProject(data);
    } catch (error) {
      console.error("Error fetching project data:", error);
      toast.error("Failed to load project data.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount
  useEffect(() => {
    fetchProject();
  }, [id]);

  // Helper: Calculate total cost of all materials using same formula as in the Materials tab.
  const calculateMaterialsCost = (): number => {
    if (!project) return 0;
    return project.materials.reduce((acc, mat) => {
      if (!mat.material) return acc;
      // Total = (quantity / pieces) * priceNetto
      return (
        acc +
        (mat.quantity / (mat.material.pieces || 1)) * mat.material.priceNetto
      );
    }, 0);
  };

  // Helper: Calculate overall project cost (materials + additional)
  const calculateTotalCost = (): number => {
    if (!project) return 0;
    const materialsCost = calculateMaterialsCost();
    const additionalCosts = project.additionalCosts.reduce(
      (acc, cost) => acc + cost.amount,
      0
    );
    return materialsCost + additionalCosts;
  };

  // Handler for adding a new additional cost
  const handleAddCost = async () => {
    if (!newCostName || !newCostAmount || !project?._id) return;

    const costValue = parseFloat(newCostAmount);
    if (isNaN(costValue)) {
      console.error("Invalid cost amount:", newCostAmount);
      return;
    }

    try {
      // Append new cost to additionalCosts array
      await client
        .patch(project._id)
        .setIfMissing({ additionalCosts: [] })
        .append("additionalCosts", [
          {
            description: newCostName,
            amount: costValue,
            _key: nanoid(),
          },
        ])
        .commit();

      // Update totalBudget (overwrite with recalculated total)
      await client
        .patch(project._id)
        .set({ totalBudget: calculateTotalCost() })
        .commit();

      // Clear form and refresh data
      setNewCostName("");
      setNewCostAmount("");
      toast.success("Cost added successfully");
      router.refresh();
      fetchProject();
    } catch (error) {
      console.error("Failed to add cost:", error);
      toast.error("Failed to add cost");
    }
  };

  // Handler for deleting an additional cost by its _key
  const handleDeleteCost = async (costKey: string) => {
    if (!project?._id) return;
    try {
      await client
        .patch(project._id)
        .unset([`additionalCosts[_key=="${costKey}"]`])
        .commit();

      await client
        .patch(project._id)
        .set({ totalBudget: calculateTotalCost() })
        .commit();

      toast.success("Cost deleted successfully");
      router.refresh();
      fetchProject();
    } catch (error) {
      console.error("Failed to delete cost:", error);
      toast.error("Failed to delete cost");
    }
  };

  if (loading || !project) return <p>Loading project costs...</p>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cost Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Materials Cost Table */}
          <div>
            <h4 className="text-sm font-medium mb-4">Materials Cost</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-nowrap">Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.materials.map((mat, index) => {
                  const materialName = mat.material?.name || "N/A";
                  const quantity = mat.quantity;
                  const priceNetto = mat.material?.priceNetto || 0;
                  const unitName = mat.material?.unit?.name || "";
                  const pieces = mat.material?.pieces || 1;
                  // Calculate total as (quantity / pieces) * priceNetto
                  const total = (quantity / pieces) * priceNetto;
                  return (
                    <TableRow key={index}>
                      <TableCell className="w-full p-1 text-nowrap">
                        {materialName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap p-1 text-center">
                        {quantity} {unitName}
                      </TableCell>
                      <TableCell className="whitespace-nowrap p-1 text-center">
                        {priceNetto} <span className="text-gray-500">zl</span>
                      </TableCell>
                      <TableCell className="whitespace-nowrap p-1 text-right">
                        {total.toLocaleString()}{" "}
                        <span className="text-gray-500">zl</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Additional Costs Table & Add Cost Form */}
          <div>
            {project.additionalCosts.length > 0 && (
              <>
                <h4 className="text-sm font-medium mb-4">Additional Costs</h4>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-left">Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {project.additionalCosts.map((cost, index) => (
                      <TableRow key={index}>
                        <TableCell className="p-1 w-full text-nowrap">
                          {cost.description}
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right p-1">
                          {cost.amount.toLocaleString()}{" "}
                          <span className="text-gray-500">zl</span>
                        </TableCell>
                        <TableCell className="whitespace-nowrap text-right p-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeleteCost(cost._key)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            )}

            {/* Add New Cost Form */}
            <div className="border-t pt-4">
              <h4 className="text-2xl font-bold my-4">Add New Cost</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newCostName}
                    onChange={(e) => setNewCostName(e.target.value)}
                    placeholder="e.g., Hotel Stay, Equipment Rental"
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={newCostAmount}
                    onChange={(e) => setNewCostAmount(e.target.value)}
                    placeholder="Enter amount"
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="flex items-end">
                  <Button onClick={handleAddCost} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Cost
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Summary Section */}
          <div className="pt-4 border-t">
            <div className="flex justify-between">
              <span className="font-medium">Total Materials Cost:</span>
              <span>{calculateMaterialsCost().toLocaleString()} zl</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-medium">Total Additional Costs:</span>
              <span>
                {project.additionalCosts
                  .reduce((acc, cost) => acc + cost.amount, 0)
                  .toLocaleString()}{" "}
                zl
              </span>
            </div>
            <div className="flex justify-between mt-4 text-lg font-bold">
              <span>Total Project Cost:</span>
              <span>{calculateTotalCost().toLocaleString()} zl</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
