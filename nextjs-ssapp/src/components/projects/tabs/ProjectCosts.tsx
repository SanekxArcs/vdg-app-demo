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
import { Plus } from "lucide-react";

export function ProjectCosts({ project }: { project: any }) {
  // Local state for the "Add Cost" form
  const [newCostName, setNewCostName] = useState("");
  const [newCostAmount, setNewCostAmount] = useState("");

  // Calculate total materials cost
  const calculateMaterialsCost = () =>
    project.materials.reduce(
      (acc: number, mat: any) => acc + mat.quantity * mat.material.priceNetto,
      0
    );

  // Calculate overall project cost (materials + additional)
  const calculateTotalCost = () => {
    const materialsCost = calculateMaterialsCost();
    const additionalCosts = project.additionalCosts.reduce(
      (acc: number, cost: any) => acc + cost.amount,
      0
    );
    return materialsCost + additionalCosts;
  };

  // Handler for adding a new cost (placeholder)
  const handleAddCost = () => {
    if (!newCostName || !newCostAmount) return;
    console.log("Adding cost:", newCostName, newCostAmount);
    // Reset form values after adding
    setNewCostName("");
    setNewCostAmount("");
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
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.materials.map((mat: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{mat.material.name}</TableCell>
                    <TableCell>{mat.quantity}</TableCell>
                    <TableCell>${mat.material.priceNetto}</TableCell>
                    <TableCell>
                      $
                      {(
                        mat.quantity * mat.material.priceNetto
                      ).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Additional Costs Table & Add Cost Form */}
          <div>
            <h4 className="text-sm font-medium mb-4">Additional Costs</h4>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {project.additionalCosts.map((cost: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{cost.description}</TableCell>
                    <TableCell>${cost.amount.toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Add New Cost Form */}
            <div className="mt-4 border-t pt-4">
              <h4 className="text-sm font-medium mb-4">Add New Cost</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input
                    value={newCostName}
                    onChange={(e) => setNewCostName(e.target.value)}
                    placeholder="e.g., Hotel Stay, Equipment Rental"
                  />
                </div>
                <div className="space-y-2">
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
              <span>${calculateMaterialsCost().toLocaleString()}</span>
            </div>
            <div className="flex justify-between mt-2">
              <span className="font-medium">Total Additional Costs:</span>
              <span>
                $
                {project.additionalCosts
                  .reduce((acc: number, cost: any) => acc + cost.amount, 0)
                  .toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between mt-4 text-lg font-bold">
              <span>Total Project Cost:</span>
              <span>${calculateTotalCost().toLocaleString()}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
