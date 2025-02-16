"use client";

import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { client } from "@/sanity/client";
import { groq } from "next-sanity";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash } from "lucide-react";

// TimelineEvent interface with minimal fields
interface TimelineEvent {
  _key: string;
  _type: "event";
  time: string;
  comment: string;
  // Author is a reference that may be resolved to include a name
  author: { _ref: string; _type?: string } & Partial<{ name: string }>;
}

interface AdminUser {
  _id: string;
  name: string;
}

// Returns a default datetime-local string for the form
function getDefaultDatetimeLocalValue() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

export function ProjectTimeline() {
  // Get project id from URL parameters
  const { id } = useParams() as { id: string };
  const router = useRouter();

  // Local state for timeline events, loading, form fields, and authors
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [newTime, setNewTime] = useState(getDefaultDatetimeLocalValue());
  const [newAuthor, setNewAuthor] = useState("");
  const [authors, setAuthors] = useState<AdminUser[]>([]);

  // GROQ query to load only the necessary timeline fields from the project
  const timelineQuery = groq`
    *[_type == "project" && _id == $id][0]{
      _id,
      timeline[] {
        _key,
        time,
        author-> { name },
        comment
      }
    }
  `;

  // Fetch timeline data from Sanity
  const fetchTimeline = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await client.fetch(timelineQuery, { id });
      setTimeline(data?.timeline || []);
    } catch (error) {
      console.error("Error fetching timeline:", error);
      toast.error("Failed to load project timeline.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch timeline on mount and refresh every 60 seconds
  useEffect(() => {
    if (!id) return;
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 60000); // refresh every 60 sec
    return () => clearInterval(interval);
  }, [id]);

  // Fetch available admin users for the author selection
  useEffect(() => {
    async function fetchAuthors() {
      try {
        const query = '*[_type == "admins"] { _id, name }';
        const data: AdminUser[] = await client.fetch(query);
        setAuthors(data);
        if (data.length > 0) {
          setNewAuthor(data[0]._id);
        }
      } catch (err) {
        console.error("Error fetching admins:", err);
      }
    }
    fetchAuthors();
  }, []);

  // Helper to format the date for display
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("pl", {
      hour: "numeric",
      minute: "numeric",
      month: "short",
      day: "numeric",
    });

  // Handle new comment submission
  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    // Prepare new event with a proper reference for the author
    const newEvent: TimelineEvent = {
      _key: nanoid(),
      _type: "event",
      time: new Date(newTime).toISOString(),
      comment: newComment,
      author: { _ref: newAuthor, _type: "reference" },
    };

    try {
      // Append new event to the timeline in Sanity using the project id
      await client
        .patch(id)
        .setIfMissing({ timeline: [] })
        .append("timeline", [newEvent])
        .commit();

      // Update local state for immediate UI feedback
      setTimeline((prev) => [...prev, newEvent]);
      setNewComment("");
      setNewTime(getDefaultDatetimeLocalValue());
      toast.success("Added new comment event.");
      router.refresh();
    } catch (error) {
      console.error("Error posting comment event:", error);
      toast.error("Could not add comment event.");
    }
  };

  // Handle deletion of a timeline event
  const handleDelete = async (eventKey: string) => {
    try {
      await client
        .patch(id)
        .unset([`timeline[_key=="${eventKey}"]`])
        .commit();

      // Remove deleted event from local state
      setTimeline((prev) => prev.filter((ev) => ev._key !== eventKey));
      toast.success("Deleted comment.");
      router.refresh();
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Could not delete comment.");
    }
  };

  // Show a loading state until timeline data is available
  if (loading) {
    return <p>Loading timeline...</p>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {timeline.length > 0 ? (
          <div className="space-y-4 mb-6">
            {timeline.map((event) => {
              // Determine the display name: use resolved author or fallback to authors list
              const displayName =
                event.author.name ||
                authors.find((a) => a._id === event.author._ref)?.name ||
                "Unknown Author";

              return (
                <div
                  key={event._key}
                  className="flex flex-col md:flex-row gap-4 items-start md:items-center ring-1 rounded-md px-3 py-1 border-gray-100/50"
                >
                  <div className="text-sm font-bold text-muted-foreground w-full md:w-auto">
                    {displayName} -{" "}
                    <span className="font-thin">{formatDate(event.time)}</span>:
                  </div>
                  <div className="flex-1">
                    <p className="text-sm">{event.comment}</p>
                  </div>

                  {/* Delete button with confirmation dialog */}
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="icon"
                        className="ml-auto"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Deletion</DialogTitle>
                        <DialogDescription>
                          {formatDate(event.time)} - {event.comment}. <br />
                          <span className="font-bold">
                            Are you sure you want to delete this event?
                          </span>
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button
                            variant="destructive"
                            onClick={() => handleDelete(event._key)}
                          >
                            Yes, Delete
                          </Button>
                        </DialogClose>
                        <DialogClose asChild>
                          <Button variant="outline">Cancel</Button>
                        </DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              );
            })}
          </div>
        ) : (
          <p>No timeline events yet.</p>
        )}

        {/* New event form */}
        <div className="space-y-4">
          <Label htmlFor="comment">Add Comment</Label>
          <textarea
            id="comment"
            className="w-full bg-transparent border rounded p-2 resize-y"
            placeholder="Enter comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="datetime-local"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="author">Author</Label>
              <Select onValueChange={(value) => setNewAuthor(value)}>
                <SelectTrigger>
                  <SelectValue
                    defaultValue={newAuthor}
                    placeholder="Select author"
                  />
                </SelectTrigger>
                <SelectContent>
                  {authors.map((author) => (
                    <SelectItem key={author._id} value={author._id}>
                      {author.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleSendComment} className="w-full md:w-auto mt-4">
            Send Comment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
