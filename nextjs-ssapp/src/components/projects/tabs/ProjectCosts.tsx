"use client";

import { useState } from "react";
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
import { useRouter } from "next/navigation";
import { client } from "@/sanity/client";
import { nanoid } from "nanoid";
import { toast } from "sonner";

export function ProjectCosts({ project }: { project: any }) {
  const router = useRouter();
  const [newCostName, setNewCostName] = useState("");
  const [newCostAmount, setNewCostAmount] = useState("");

  // Calculate total materials cost
  const calculateMaterialsCost = () =>
    project.materials.reduce(
      (acc: number, mat: any) => acc + mat.quantity * mat.material.priceNetto,
      0
    );

    console.log("Tolal:", project.totalBudget);

  // Calculate overall project cost (materials + additional)
  const calculateTotalCost = () => {
    const materialsCost = calculateMaterialsCost();
    const additionalCosts = project.additionalCosts.reduce(
      (acc: number, cost: any) => acc + cost.amount,
      0
    );
    return materialsCost + additionalCosts;
  };

  // Handler for adding a new cost
  const handleAddCost = async () => {
    // 1. Basic validation: Make sure we have a name and an amount.
    if (!newCostName || !newCostAmount) return;

    // 2. Convert the cost amount to a float; guard against NaN.
    const costValue = parseFloat(newCostAmount);
    if (isNaN(costValue)) {
      console.error("Invalid cost amount:", newCostAmount);
      return;
    }

    try {
      // 3. First patch: Append to `additionalCosts`.
      //    setIfMissing({ additionalCosts: [] }) ensures there's an array to append to.
      await client
        .patch(project._id)
        .set({ additionalCosts: [] })
        .append("additionalCosts", [
          {
            description: newCostName,
            amount: costValue,
            _key: nanoid(), // Make sure nanoid() is imported
          },
        ])
        .commit();

      // 4. Second patch: Update or set `totalBudget`.
      //    Notice that `setIfMissing` will only set `totalBudget` if it doesn’t exist.
      //    If you want to overwrite it every time, use `.set()` instead.
      await client
        .patch(project._id)
        .set({ totalBudget: calculateTotalCost() })
        .commit();

      // 5. Clear inputs and refresh.
      setNewCostName("");
      setNewCostAmount("");
      router.refresh();
      toast.success("Cost added successfully");
    } catch (error) {
      toast.error("Failed to add cost");
      console.error("Failed to add cost:", error);
    }
  };

  const handleDeleteCost = async (costKey: string) => {
    try {
      await client
        .patch(project._id)
        .unset([`additionalCosts[_key=="${costKey}"]`])
        .commit();

        await client
          .patch(project._id)
          .setIfMissing({ totalBudget: calculateTotalCost() })
          .commit();

      toast.success("Cost deleted successfully");
      router.refresh();
    } catch (error) {
      toast.error("Failed to delete cost");
      console.error("Failed to delete cost:", error);
    }
  };

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
                {project.materials.map((mat: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell className="w-full p-1 text-nowrap">
                      {mat.material.name}
                    </TableCell>
                    <TableCell className="whitespace-nowrap p-1 text-center">
                      {mat.quantity} {mat.unit}
                    </TableCell>
                    <TableCell className="whitespace-nowrap p-1 text-center">
                      {mat.material.priceNetto}{" "}
                      <span className="text-gray-500">zl</span>
                    </TableCell>
                    <TableCell className="whitespace-nowrap p-1 text-right">
                      {(
                        mat.quantity * mat.material.priceNetto
                      ).toLocaleString()}{" "}
                      <span className="text-gray-500">zl</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Additional Costs Table & Add Cost Form */}
          {/*if no aditional costs, do not display the table*/}

          <div>
            {project.additionalCosts.length > 0 ? (
              <h4 className="text-sm font-medium mb-4">Additional Costs</h4>
            ) : null}
            {project.additionalCosts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-left">Description</TableHead>
                    <TableHead className="text-right">Amount</TableHead>

                    <TableHead className=" text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {project.additionalCosts.map((cost: any, index: number) => (
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
            ) : null}

            {/* Add New Cost Form */}
            <div className=" border-t pt-4">
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
                <div className="">
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
              <span>{calculateMaterialsCost().toLocaleString()}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-medium">Total Additional Costs:</span>
              <span>
                {project.additionalCosts
                  .reduce((acc: number, cost: any) => acc + cost.amount, 0)
                  .toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between mt-4 text-lg font-bold">
              <span>Total Project Cost:</span>
              <span>{calculateTotalCost().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
