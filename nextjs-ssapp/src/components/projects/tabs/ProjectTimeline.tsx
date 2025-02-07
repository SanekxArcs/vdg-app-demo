"use client";

import { useState, useEffect } from "react";
import { nanoid } from "nanoid";
import { client } from "@/sanity/client"; // Ваш сконфігурований Sanity-клієнт
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

/**
 * Повертає поточну дату/час у форматі datetime-local
 */
function getDefaultDatetimeLocalValue() {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = now.getFullYear();
  const mm = pad(now.getMonth() + 1);
  const dd = pad(now.getDate());
  const hh = pad(now.getHours());
  const min = pad(now.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

/**
 * Компонент ProjectTimeline
 *  - Відображає список подій (timeline)
 *  - Завантажує список авторів (admins) із Sanity
 *  - Додає нові події та видаляє існуючі через patch-запити
 */
export function ProjectTimeline({ project }: { project: any }) {
  const [timeline, setTimeline] = useState(project.timeline || []);
  const [newComment, setNewComment] = useState("");
  const [newTime, setNewTime] = useState(getDefaultDatetimeLocalValue());
  const [newAuthor, setNewAuthor] = useState("");
  const [authors, setAuthors] = useState<any[]>([]);
    const router = useRouter();

  useEffect(() => {
    async function fetchAuthors() {
      try {
        const query = '*[_type == "admins"] { _id, name, _ref }';
        const data = await client.fetch(query);
        setAuthors(data);
        console.log(project.timeline);
        if (data.length > 0) {
          setNewAuthor(data[0]._id); // автоматично обираємо першого в списку
        }
      } catch (err) {
        console.error("Error fetching admins:", err);
      }
    }
    fetchAuthors();
  }, []);

  /**
   * Форматує дату у читабельний рядок
   */
  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  /**
   * Додає нову подію (comment) в timeline
   */
  const handleSendComment = async () => {
    if (!newComment.trim()) return;

    const newEvent = {
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
   * Видаляє подію з timeline за її унікальним _key
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
        {/* Display updated timeline */}
        {timeline.length === 0 ? (
          ""
        ) : (
          <div className="space-y-4 mb-6">
            {timeline.map((event: any, index: number) => (
              <div
                key={event._key || index}
                className="flex gap-4 items-center border-2 rounded-md p-2 border-gray-200"
              >
                <div className="text-sm font-bold text-muted-foreground text-nowrap">
                  {event.author?.name || "Unknown Author"} -{" "}
                  <span className="font-thin">{formatDate(event.time)}</span>:
                </div>
                <div className="w-full">
                  <p className="text-sm">{event.comment}</p>
                </div>

                {/* Delete button with confirmation dialog */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="">
                      Delete
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Confirm Deletion</DialogTitle>
                      <DialogDescription>
                        {event.author?.name || "Unknown Author"} -{" "}
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

        {/* Форма для додавання нової події */}
        <div>
          <Label htmlFor="comment">
            Add {timeline.length === 0 ? "First Comment" : "Comment"}
          </Label>
          <textarea
            id="comment"
            className="w-full border rounded p-2"
            placeholder="Enter comment..."
            value={newComment}
            onChange={(e) => {
              // Після першого введення оновлюємо час на поточний
              if (!newComment) {
                setNewTime(getDefaultDatetimeLocalValue());
              }
              setNewComment(e.target.value);
            }}
          />
          <div className="flex flex-col md:flex-row gap-4">
            {/* Вибір часу */}
            <div className="flex-1">
              <Label htmlFor="time">Time</Label>
              <Input
                id="time"
                type="datetime-local"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
              />
            </div>
            {/* Вибір автора */}
            <div className="flex-1">
              <Label htmlFor="Author">Author</Label>
              <Select value={newAuthor} onValueChange={setNewAuthor}>
                <SelectTrigger>
                  <SelectValue id="Author" placeholder="Select author" />
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
