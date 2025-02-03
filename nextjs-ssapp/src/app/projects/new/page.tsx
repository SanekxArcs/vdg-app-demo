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
import { nanoid } from "nanoid";

import { client } from "@/sanity/client";

// A small helper to build a reference object for Sanity
function buildReference(_id: string) {
  return { _type: "reference", _ref: _id };
}

// For holding each reference doc from Sanity
type SanityRef = {
  _id: string;
  name: string;
};

// For timeline local state
interface TimelineEvent {
  time: string; // a string date/time
  comment: string; // text comment
}

// For additional costs local state
interface AdditionalCost {
  description: string;
  amount: number;
}

export default function NewProjectPage() {
  const router = useRouter();

  // Loading state for submission
  const [isLoading, setIsLoading] = useState(false);

  // Each array of documents (type, status, firm, ekipa)
  const [types, setTypes] = useState<SanityRef[]>([]);
  const [statuses, setStatuses] = useState<SanityRef[]>([]);
  const [firms, setFirms] = useState<SanityRef[]>([]);
  const [ekipas, setEkipas] = useState<SanityRef[]>([]);

  // User’s choice (ID) for each reference
  const [selectedType, setSelectedType] = useState("none");
  const [selectedStatus, setSelectedStatus] = useState("none");
  const [selectedFirm, setSelectedFirm] = useState("none");
  const [selectedEkipa, setSelectedEkipa] = useState("none");

  // Basic form fields for the project
  const [formData, setFormData] = useState({
    mpk: "", // number
    city: "", // string
    address: "", // string
    postal: "", // string (Polish postal code)
    idq: "", // number (Firm code)
    startDate: "",
    endDate: "",
    deadlineDate: "",
    description: "",
  });

  // Timeline local state
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  // For new “in-progress” timeline entry
  const [timelineDraft, setTimelineDraft] = useState<TimelineEvent>({
    time: "",
    comment: "",
  });

  // Additional costs local state
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);
  // For new “in-progress” cost entry
  const [costDraft, setCostDraft] = useState<AdditionalCost>({
    description: "",
    amount: 0,
  });

  // ------------------------------
  // 1) Fetch data for references
  // ------------------------------
  useEffect(() => {
    // One GROQ query returning four lists:
    const query = groq`
      {
        "types": *[_type == "typ"]{_id, name},
        "statuses": *[_type == "status"]{_id, name},
        "firms": *[_type == "firm"]{_id, name},
        "ekipas": *[_type == "ekipa"]{_id, name}
      }
    `;
    client
      .fetch(query)
      .then((data) => {
        setTypes(data.types || []);
        setStatuses(data.statuses || []);
        setFirms(data.firms || []);
        setEkipas(data.ekipas || []);
      })
      .catch((err) => console.error("Error fetching reference docs:", err));
  }, []);

  // ------------------------------
  // 2) Handlers
  // ------------------------------
  // Update the non-reference text/number fields
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Handler to add an event to the timeline
  const handleAddTimelineEvent = () => {
    if (!timelineDraft.time || !timelineDraft.comment) {
      alert("Please provide both time and comment for the event.");
      return;
    }
    setTimelineEvents((prev) => [...prev, timelineDraft]);
    // Reset the draft
    setTimelineDraft({ time: "", comment: "" });
  };

  // Handler to remove an event from the timeline
  const handleRemoveTimelineEvent = (index: number) => {
    setTimelineEvents((prev) => prev.filter((_, i) => i !== index));
  };

  // Handler to add an additional cost
  const handleAddCost = () => {
    if (!costDraft.description || !costDraft.amount) {
      alert("Please provide cost description and amount.");
      return;
    }
    setAdditionalCosts((prev) => [...prev, costDraft]);
    setCostDraft({ description: "", amount: 0 });
  };

  // Handler to remove an additional cost
  const handleRemoveCost = (index: number) => {
    setAdditionalCosts((prev) => prev.filter((_, i) => i !== index));
  };

  // ------------------------------
  // 3) Submit to Sanity
  // ------------------------------
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Build a new `project` doc
      const newProjectDoc = {
        _type: "project",
        // numeric
        number: Number(formData.mpk) || 0,
        // string fields
        city: formData.city,
        address: formData.address,
        postal: formData.postal,
        // firm code
        idq: Number(formData.idq) || 0,

        // dates => convert to ISO if they exist
        startDate: formData.startDate
          ? new Date(formData.startDate).toISOString()
          : null,
        endDate: formData.endDate
          ? new Date(formData.endDate).toISOString()
          : null,
        deadlineDate: formData.deadlineDate
          ? new Date(formData.deadlineDate).toISOString()
          : null,

        // any custom fields (e.g. "description" if your schema has it)
        description: formData.description || "",

        // references: only store if user didn’t pick “none”
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

        // timeline array
        timeline: timelineEvents.map((ev) => ({
          _key: nanoid(),
          _type: "event", // matches the "type" field in your schema
          time: ev.time || null,
          comment: ev.comment || "",
        })),

        // additionalCosts array
        additionalCosts: additionalCosts.map((cost) => ({
          _key: nanoid(),
          _type: "object", // or you can name it something else
          description: cost.description,
          amount: cost.amount,
        })),
      };

      const createdDoc = await client.create(newProjectDoc);
      console.log("Project created in Sanity:", createdDoc);
      router.push("/projects");
    } catch (error) {
      console.error("Error creating project in Sanity:", error);
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
            {/* Project Info */}
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

            {/* Additional Costs Card */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Costs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Draft fields for new cost */}
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

                  {/* List of existing costs */}
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
                              {c.amount.toFixed(2)} zl
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

            {/* Timeline Card */}
            <Card>
              <CardHeader>
                <CardTitle>Timeline Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Draft fields for new event */}
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

                  {/* List of existing events */}
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
          </div>

          {/* Buttons */}
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
