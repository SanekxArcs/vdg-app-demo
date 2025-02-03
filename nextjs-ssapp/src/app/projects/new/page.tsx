"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { groq } from "next-sanity";

import { Layout } from "@/components/layout/layout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableHeader,
  TableHead,
  TableRow,
  TableBody,
  TableCell,
} from "@/components/ui/table";

import { client } from "@/sanity/client";

// A small helper to build references
function buildReference(_id: string) {
  return { _type: "reference", _ref: _id };
}

// For reference docs from Sanity
type SanityRef = {
  _id: string;
  name: string;
};

// For timeline local state
interface TimelineEvent {
  time: string;
  comment: string;
}

// For additional costs local state
interface AdditionalCost {
  description: string;
  amount: number;
}

// For material documents from your `material` schema
interface MaterialDoc {
  _id: string;
  name: string;
  priceNetto: number;
  quantity: number; // total available in the warehouse, etc.
  pieces: number;
  unitName?: string; // "unit->name" after GROQ expansion
}

// For the quantity that user wants to allocate to THIS project
interface MaterialQuantity {
  materialId: string;
  quantity: number; // how many user decides to add to the project
}

export default function NewProjectPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  // Arrays for references
  const [types, setTypes] = useState<SanityRef[]>([]);
  const [statuses, setStatuses] = useState<SanityRef[]>([]);
  const [firms, setFirms] = useState<SanityRef[]>([]);
  const [ekipas, setEkipas] = useState<SanityRef[]>([]);

  // Selected references
  const [selectedType, setSelectedType] = useState("none");
  const [selectedStatus, setSelectedStatus] = useState("none");
  const [selectedFirm, setSelectedFirm] = useState("none");
  const [selectedEkipa, setSelectedEkipa] = useState("none");

  // Project fields
  const [formData, setFormData] = useState({
    mpk: "",
    city: "",
    address: "",
    postal: "",
    idq: "",
    startDate: "",
    endDate: "",
    deadlineDate: "",
    description: "",
  });

  // Timeline events
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [timelineDraft, setTimelineDraft] = useState<TimelineEvent>({
    time: "",
    comment: "",
  });

  // Additional costs
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);
  const [costDraft, setCostDraft] = useState<AdditionalCost>({
    description: "",
    amount: 0,
  });

  // Materials from Sanity
  const [allMaterials, setAllMaterials] = useState<MaterialDoc[]>([]);
  // How many of each material the user wants to add to this project
  const [materialQuantities, setMaterialQuantities] = useState<
    MaterialQuantity[]
  >([]);

  // ------------------------------
  // 1) Fetch references + materials
  // ------------------------------
  useEffect(() => {
    const query = groq`
      {
        "types": *[_type == "typ"]{_id, name},
        "statuses": *[_type == "status"]{_id, name},
        "firms": *[_type == "firm"]{_id, name},
        "ekipas": *[_type == "ekipa"]{_id, name},
        "materials": *[_type == "material"]{
          _id,
          name,
          priceNetto,
          quantity,
          pieces,
          "unitName": unit->name
        } | order(_createdAt desc)
      }
    `;
    client
      .fetch(query)
      .then((data) => {
        // References
        setTypes(data.types || []);
        setStatuses(data.statuses || []);
        setFirms(data.firms || []);
        setEkipas(data.ekipas || []);
        // Materials
        setAllMaterials(data.materials || []);
      })
      .catch((err) => console.error("Error fetching data:", err));
  }, []);

  // ------------------------------
  // 2) Handlers
  // ------------------------------
  // Basic form
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Add a timeline event
  const handleAddTimelineEvent = () => {
    if (!timelineDraft.time || !timelineDraft.comment) {
      alert("Please provide both time and comment for the event.");
      return;
    }
    setTimelineEvents((prev) => [...prev, timelineDraft]);
    setTimelineDraft({ time: "", comment: "" });
  };
  const handleRemoveTimelineEvent = (index: number) => {
    setTimelineEvents((prev) => prev.filter((_, i) => i !== index));
  };

  // Additional cost
  const handleAddCost = () => {
    if (!costDraft.description || !costDraft.amount) {
      alert("Please provide cost description and amount.");
      return;
    }
    setAdditionalCosts((prev) => [...prev, costDraft]);
    setCostDraft({ description: "", amount: 0 });
  };
  const handleRemoveCost = (index: number) => {
    setAdditionalCosts((prev) => prev.filter((_, i) => i !== index));
  };

  // Materials
  const handleQuantityChange = (materialId: string, val: string) => {
    const quantity = val === "" ? 0 : parseInt(val, 10);
    setMaterialQuantities((prev) => {
      const existing = prev.find((mq) => mq.materialId === materialId);
      if (existing) {
        return prev.map((mq) =>
          mq.materialId === materialId ? { ...mq, quantity } : mq
        );
      }
      return [...prev, { materialId, quantity }];
    });
  };

  const getQuantity = (materialId: string): string => {
    const found = materialQuantities.find((mq) => mq.materialId === materialId);
    return found ? String(found.quantity) : "";
  };

  // Calculate a simple "Subtotal" of how many the user wants times the price
const calcMaterialSubtotal = (material: MaterialDoc) => {
  // How many items the user wants
  const quantity = parseInt(getQuantity(material._id), 10) || 0;

  // Avoid dividing by 0
  const pieceCount = material.pieces || 1;

  // “Unit cost” = priceNetto / pieces
  const unitCost = material.priceNetto / pieceCount;

  // Subtotal = unitCost * quantity
  return unitCost * quantity;
};

  // Calculate total budget from chosen materials + additional costs, for example
  const calculateBudget = () => {
    // Materials
    let materialsSum = 0;
    for (const mat of allMaterials) {
      materialsSum += calcMaterialSubtotal(mat);
    }
    // Additional costs
    let costsSum = 0;
    for (const cost of additionalCosts) {
      costsSum += cost.amount;
    }
    return materialsSum + costsSum;
  };

  // ------------------------------
  // 3) Submit to Sanity
  // ------------------------------
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Build timeline array with _key
      // We'll use a small function for unique keys:
      const nanoid = () => Math.random().toString(36).slice(2);

      const timelineWithKeys = timelineEvents.map((ev) => ({
        _key: nanoid(),
        _type: "event",
        time: ev.time || null,
        comment: ev.comment || "",
      }));

      // Additional costs array with _key
      const costsWithKeys = additionalCosts.map((cost) => ({
        _key: nanoid(),
        _type: "object",
        description: cost.description,
        amount: cost.amount,
      }));

      // Materials array: only items with quantity > 0
      // with `_key` for each item:
      const usedMaterials = materialQuantities
        .filter((mq) => mq.quantity > 0)
        .map((mq) => ({
          _key: nanoid(),
          _type: "usedMaterial",
          material: buildReference(mq.materialId),
          quantity: mq.quantity,
        }));

      // Build final doc
      const newProjectDoc = {
        _type: "project",
        // Basic fields
        number: Number(formData.mpk) || 0,
        city: formData.city,
        address: formData.address,
        postal: formData.postal,
        idq: Number(formData.idq) || 0,
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : null,
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : null,
        deadlineDate: formData.deadlineDate
          ? new Date(formData.deadlineDate).toISOString()
          : null,
        description: formData.description || "",

        // references
        type:
          selectedType !== "none" ? buildReference(selectedType) : undefined,
        status:
          selectedStatus !== "none"
            ? buildReference(selectedStatus)
            : undefined,
        firm:
          selectedFirm !== "none" ? buildReference(selectedFirm) : undefined,
        ekipa:
          selectedEkipa !== "none" ? buildReference(selectedEkipa) : undefined,

        // timeline, additionalCosts, materials
        timeline: timelineWithKeys,
        additionalCosts: costsWithKeys,
        materials: usedMaterials,

        // totalBudget if you want to store it
        totalBudget: calculateBudget(),
      };

      const createdDoc = await client.create(newProjectDoc);
      console.log("Project created in Sanity:", createdDoc);
      router.push("/projects");
    } catch (error) {
      console.error("Error creating project:", error);
      setIsLoading(false);
    }
  };

  // ------------------------------
  // 4) JSX
  // ------------------------------
  return (
    <Layout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">New Project</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Project Base Info */}
            <Card>
              <CardHeader>
                <CardTitle>Project Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* MPK */}
                <div className="space-y-1">
                  <Label htmlFor="mpk">MPK Number</Label>
                  <Input
                    id="mpk"
                    name="mpk"
                    type="number"
                    value={formData.mpk}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* City */}
                <div className="space-y-1">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Address */}
                <div className="space-y-1">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* Postal */}
                <div className="space-y-1">
                  <Label htmlFor="postal">Postal Code</Label>
                  <Input
                    id="postal"
                    name="postal"
                    type="text"
                    placeholder="00-000"
                    value={formData.postal}
                    onChange={handleChange}
                  />
                </div>

                {/* Firm Code */}
                <div className="space-y-1">
                  <Label htmlFor="idq">Firm Code</Label>
                  <Input
                    id="idq"
                    name="idq"
                    type="number"
                    value={formData.idq}
                    onChange={handleChange}
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Project overview..."
                    value={formData.description}
                    onChange={handleChange}
                  />
                </div>

                {/* Dates */}
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-1">
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="deadlineDate">Deadline Date</Label>
                    <Input
                      id="deadlineDate"
                      name="deadlineDate"
                      type="date"
                      value={formData.deadlineDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Type */}
                <div className="space-y-1">
                  <Label>Type (Reference)</Label>
                  <Select
                    value={selectedType}
                    onValueChange={(val) => setSelectedType(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Type</SelectItem>
                      {types.map((t) => (
                        <SelectItem key={t._id} value={t._id}>
                          {t.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <Label>Status (Reference)</Label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(val) => setSelectedStatus(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Status</SelectItem>
                      {statuses.map((st) => (
                        <SelectItem key={st._id} value={st._id}>
                          {st.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Firm */}
                <div className="space-y-1">
                  <Label>Firm (Reference)</Label>
                  <Select
                    value={selectedFirm}
                    onValueChange={(val) => setSelectedFirm(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a Firm" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Firm</SelectItem>
                      {firms.map((f) => (
                        <SelectItem key={f._id} value={f._id}>
                          {f.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Ekipa */}
                <div className="space-y-1">
                  <Label>Ekipa (Reference)</Label>
                  <Select
                    value={selectedEkipa}
                    onValueChange={(val) => setSelectedEkipa(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an Ekipa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No Ekipa</SelectItem>
                      {ekipas.map((e) => (
                        <SelectItem key={e._id} value={e._id}>
                          {e.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Materials Card */}
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
                      const projectQty =
                        parseInt(getQuantity(mat._id), 10) || 0;
                      const subtotal = calcMaterialSubtotal(mat);

                      return (
                        <TableRow key={mat._id}>
                          <TableCell>{mat.name}</TableCell>
                          <TableCell>{mat.priceNetto.toFixed(2)} zl <span className=" text-gray-400 text-xs">x {mat.pieces}</span> </TableCell>
                          <TableCell>{mat.quantity} {mat.unitName || "N/A"}</TableCell>
                          <TableCell>
                            <Input
                              type="number"
                              min="0"
                              className="w-20"
                              value={String(projectQty)}
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

            {/* Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="datetime-local"
                      value={timelineDraft.time}
                      onChange={(e) =>
                        setTimelineDraft((prev) => ({
                          ...prev,
                          time: e.target.value,
                        }))
                      }
                    />
                    <Input
                      type="text"
                      placeholder="Comment"
                      value={timelineDraft.comment}
                      onChange={(e) =>
                        setTimelineDraft((prev) => ({
                          ...prev,
                          comment: e.target.value,
                        }))
                      }
                    />
                    <Button type="button" onClick={handleAddTimelineEvent}>
                      Add Event
                    </Button>
                  </div>
                  {timelineEvents.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No timeline events added
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {timelineEvents.map((ev, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between border p-2 rounded"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {ev.time || "No date"}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {ev.comment}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            type="button"
                            size="sm"
                            onClick={() => handleRemoveTimelineEvent(idx)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Costs Card */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Input
                      type="text"
                      placeholder="Cost description"
                      value={costDraft.description}
                      onChange={(e) =>
                        setCostDraft((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                    />
                    <Input
                      type="number"
                      placeholder="0.00"
                      min="0"
                      step="0.01"
                      value={costDraft.amount || ""}
                      onChange={(e) =>
                        setCostDraft((prev) => ({
                          ...prev,
                          amount: parseFloat(e.target.value) || 0,
                        }))
                      }
                    />
                    <Button type="button" onClick={handleAddCost}>
                      Add Cost
                    </Button>
                  </div>
                  {additionalCosts.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No additional costs added
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {additionalCosts.map((c, idx) => (
                        <li
                          key={idx}
                          className="flex items-center justify-between border p-2 rounded"
                        >
                          <div className="space-y-1">
                            <p className="text-sm font-medium">
                              {c.description}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ${c.amount.toFixed(2)}
                            </p>
                          </div>
                          <Button
                            variant="destructive"
                            type="button"
                            size="sm"
                            onClick={() => handleRemoveCost(idx)}
                          >
                            Remove
                          </Button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Show a Calculated Budget from materials + additional costs */}
            <Card>
              <CardHeader>
                <CardTitle>Calculated Total Budget</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-lg font-semibold">
                  ${calculateBudget().toFixed(2)}
                </div>
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
