"use client";

import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { client } from "@/sanity/client"; // Sanity client
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
import { useRouter } from "next/navigation";

// ✅ Define type for timeline events
interface TimelineEvent {
  _key: string;
  _type: "event";
  time: string; // ISO string date
  comment: string;
  author: { _ref: string };
}

// ✅ Define type for project
interface Project {
  _id: string;
  timeline: TimelineEvent[];
}

// ✅ Define type for authors
interface AdminUser {
  _id: string;
  name: string;
}

/**
 * Returns the current date/time in datetime-local format
 */
function getDefaultDatetimeLocalValue() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
}

/**
 * Project Timeline Component
 */
export function ProjectTimeline({ project }: { project: Project }) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>(
    project.timeline || []
  );
  const [newComment, setNewComment] = useState("");
  const [newTime, setNewTime] = useState(getDefaultDatetimeLocalValue());
  const [newAuthor, setNewAuthor] = useState("");
  const [authors, setAuthors] = useState<AdminUser[]>([]);
  const router = useRouter();

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

  /**
   * Formats date to readable format
   */
  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  /**
   * Adds a new event to the timeline
   */
  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    const newEvent: TimelineEvent = {
      _key: nanoid(),
      _type: "event",
      time: new Date(newTime).toISOString(),
      comment: newComment,
      author: { _ref: newAuthor },
    };

    try {
      await client
        .patch(project._id)
        .setIfMissing({ timeline: [] })
        .append("timeline", [newEvent])
        .commit();

      setTimeline((prev) => [...prev, newEvent]);
      setNewComment("");
      setNewTime(getDefaultDatetimeLocalValue());
      toast.success("Added new timeline event.");
      router.refresh();
    } catch (error) {
      toast.error("Could not add timeline event.");
      console.error("Error posting timeline event:", error);
    }
  };

  /**
   * Deletes an event from the timeline
   */
  const handleDelete = async (eventKey: string) => {
    if (!eventKey) return;
    try {
      await client
        .patch(project._id)
        .unset([`timeline[_key=="${eventKey}"]`])
        .commit();
      setTimeline((prev) => prev.filter((ev) => ev._key !== eventKey));
      router.refresh();
      toast.success("Deleted timeline event.");
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error("Could not delete timeline event.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Project Timeline</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Timeline Display */}
        {timeline.length > 0 && (
          <div className="space-y-4 mb-6">
            {timeline.map((event) => (
              <div
                key={event._key}
                className="flex gap-4 items-center border-2 rounded-md p-2 border-gray-200"
              >
                <div className="text-sm font-bold text-muted-foreground text-nowrap">
                  {authors.find((a) => a._id === event.author._ref)?.name ||
                    "Unknown Author"}{" "}
                  - <span className="font-thin">{formatDate(event.time)}</span>:
                </div>
                <div className="w-full">
                  <p className="text-sm">{event.comment}</p>
                </div>

                {/* Delete Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive">Delete</Button>
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
            ))}
          </div>
        )}

        {/* New Event Form */}
        <div>
          <Label htmlFor="comment">Add Comment</Label>
          <textarea
            id="comment"
            className="w-full border rounded p-2"
            placeholder="Enter comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
          />
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="datetime-local"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
            <div className="flex-1">
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
          <Button onClick={handleSendComment} className="md:w-auto w-full mt-4">
            Send Comment
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
