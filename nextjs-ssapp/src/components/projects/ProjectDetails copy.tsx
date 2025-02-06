"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  DollarSign,
  MapPin,
  Users,
  Plus,
  ExternalLink,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { client } from "@/sanity/client"; // Your configured Sanity client

export function ProjectDetails({ project }: { project: any }) {
  // State for active tab (Overview, Materials, Timeline, Costs)
  const [activeTab, setActiveTab] = useState("overview");

  // States for fields used in other tabs (if needed)
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [materialQuantity, setMaterialQuantity] = useState("");
  const [newCostName, setNewCostName] = useState("");
  const [newCostAmount, setNewCostAmount] = useState("");

  // --- NEW: State for all materials from Sanity ---
  const [allMaterials, setAllMaterials] = useState<any[]>([]);
  // State to track the "project quantity" input for each material
  const [materialQuantities, setMaterialQuantities] = useState<{
    [id: string]: string;
  }>({});

  // Fetch the list of materials from Sanity on component mount
  useEffect(() => {
    const fetchMaterials = async () => {
      const query = `*[_type == "material"]{
        _id,
        name,
        priceNetto,
        quantity,
        pieces,
        "unitName": unit->name
      } | order(_createdAt desc)`;
      const data = await client.fetch(query);
      setAllMaterials(data);
    };
    fetchMaterials();
  }, []);

  // Get the current project quantity for a material (defaulting to "0")
  const getQuantity = (id: string): string => materialQuantities[id] || "0";

  // Handler to update the quantity input for a material
  const handleQuantityChange = (id: string, value: string) => {
    setMaterialQuantities((prev) => ({ ...prev, [id]: value }));
  };

  // Calculate material subtotal:
  // Unit cost = priceNetto divided by pieces (avoid division by 0 by defaulting pieces to 1)
  // Subtotal = unit cost * project quantity
  const calcMaterialSubtotal = (material: any) => {
    const quantity = parseInt(getQuantity(material._id), 10) || 0;
    const pieceCount = material.pieces || 1;
    const unitCost = material.priceNetto / pieceCount;
    return unitCost * quantity;
  };

  // --- Existing Helper Functions ---
  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const calculateProgress = () => {
    const total =
      new Date(project.endDate).getTime() -
      new Date(project.startDate).getTime();
    const current = Date.now() - new Date(project.startDate).getTime();
    return Math.min(Math.max(Math.round((current / total) * 100), 0), 100);
  };

  const calculateMaterialsCost = () =>
    project.materials.reduce(
      (acc: number, mat: any) => acc + mat.quantity * mat.material.priceNetto,
      0
    );

  const calculateTotalCost = () => {
    const materialsCost = calculateMaterialsCost();
    const additionalCosts = project.additionalCosts.reduce(
      (acc: number, cost: any) => acc + cost.amount,
      0
    );
    return materialsCost + additionalCosts;
  };

  // Placeholder handler for adding a material to the project (if needed)
  const handleAddMaterial = () => {
    if (!selectedMaterial || !materialQuantity) return;
    console.log("Adding material:", selectedMaterial, materialQuantity);
    setSelectedMaterial("");
    setMaterialQuantity("");
  };

  // Placeholder handler for adding a new cost
  const handleAddCost = () => {
    if (!newCostName || !newCostAmount) return;
    console.log("Adding cost:", newCostName, newCostAmount);
    setNewCostName("");
    setNewCostAmount("");
  };

  // Build a Google Maps URL for the project location
  const getGoogleMapsUrl = () => {
    const address = `${project.postal}, ${project.city}, ${project.address} `;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  };

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">
              MPK: {project.number}
            </h2>
            <Badge
              variant="outline"
              className={` 
                            ${
                              project.status.name === "Completed"
                                ? "bg-green-100 text-green-800"
                                : project.status.name === "In progress"
                                  ? "bg-blue-100 text-blue-800"
                                  : project.status.name === "On Hold"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : project.status.name === "Planned"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-gray-50 text-gray-600"
                            }`}
            >
              {project.status.name}
            </Badge>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            className="hover:text-blue-600 hover:bg-gray-200 transition-all"
          >
            <a
              href={project.link}
              target="_blanc"
              className="flex items-center "
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Project files
            </a>
          </Button>
          <Button variant="outline">Edit Project</Button>
          <Button variant="destructive">Delete Project</Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Location Card */}
        <Card
          className=" cursor-pointer hover:scale-105 transition-all hover:shadow-xl"
          onClick={() => window.open(getGoogleMapsUrl(), "_blank")}
        >
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="font-medium">Location</CardTitle>
            <MapPin className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-medium">{project.city}</div>
            <p className="text-xs text-muted-foreground">
              {project.address}, {project.postal}
            </p>
            <Button
              variant="link"
              className="p-0 mt-2 text-blue-600"
              onClick={() => window.open(getGoogleMapsUrl(), "_blank")}
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              View on Google Maps
            </Button>
          </CardContent>
        </Card>
        {/* Timeline Card */}
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="font-medium">Timeline</CardTitle>
            <Calendar className="text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-medium">
              Deadline: {formatDate(project.deadlineDate)}
            </div>
            <p className="text-xs text-muted-foreground">
              Start:{formatDate(project.startDate)} - End:
              {formatDate(project.endDate)}
            </p>
          </CardContent>
        </Card>
        {/* Budget Card */}
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Budget</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-medium">
              ${project.totalBudget.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total allocated</p>
          </CardContent>
        </Card>
        {/* Team Card */}
        <Card>
          <CardHeader className="flex items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="font-medium">{project.ekipa.name}</div>
            <p className="text-xs text-muted-foreground">{project.firm.name}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for various project details */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="costs">Costs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Overall Progress</span>
                  <span>{calculateProgress()}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${calculateProgress()}%` }}
                  ></div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Project Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium">Project Type:</dt>
                    <dd className="text-sm text-muted-foreground">
                      {project.type.name}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium">Firm Code:</dt>
                    <dd className="text-sm text-muted-foreground">
                      {project.idq}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium">Status:</dt>
                    <dd className="text-sm text-muted-foreground">
                      {project.status.name}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            {/* Location Information Card */}
            <Card>
              <CardHeader>
                <CardTitle>Location Information</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium">City:</dt>
                    <dd className="text-sm text-muted-foreground">
                      {project.city}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium">Address:</dt>
                    <dd className="text-sm text-muted-foreground">
                      {project.address}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-sm font-medium">Postal Code:</dt>
                    <dd className="text-sm text-muted-foreground">
                      {project.postal}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Materials Tab: Render list of all materials fetched from Sanity */}
        <TabsContent value="materials" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Price Netto</TableHead>
                    <TableHead>Stored Qty</TableHead>
                    <TableHead>Project Qty</TableHead>
                    <TableHead>Subtotal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allMaterials.map((mat) => {
                    // Parse current project quantity and calculate subtotal
                    const projectQty = parseInt(getQuantity(mat._id), 10) || 0;
                    const subtotal = calcMaterialSubtotal(mat);
                    return (
                      <TableRow key={mat._id}>
                        <TableCell>{mat.name}</TableCell>
                        <TableCell>
                          {mat.priceNetto.toFixed(2)} zl{" "}
                          <span className="text-gray-400 text-xs">
                            x {mat.pieces}
                          </span>
                        </TableCell>
                        <TableCell>
                          {mat.quantity} {mat.unitName || "N/A"}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min="0"
                            className="w-20"
                            value={String(getQuantity(mat._id))}
                            onChange={(e) =>
                              handleQuantityChange(mat._id, e.target.value)
                            }
                          />
                        </TableCell>
                        <TableCell>{subtotal.toFixed(2)} zl</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Timeline Tab */}
        <TabsContent value="timeline" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Project Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {project.timeline.map((event: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="w-24 text-sm text-muted-foreground">
                      {formatDate(event.time)}
                    </div>
                    <div className="flex-1 rounded-lg border p-4">
                      <p className="text-sm">{event.comment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
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
                      {project.additionalCosts.map(
                        (cost: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell>{cost.description}</TableCell>
                            <TableCell>
                              ${cost.amount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        )
                      )}
                    </TableBody>
                  </Table>

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
                        .reduce(
                          (acc: number, cost: any) => acc + cost.amount,
                          0
                        )
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
