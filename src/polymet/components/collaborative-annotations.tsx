import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MessageSquareIcon,
  SendIcon,
  ThumbsUpIcon,
  ReplyIcon,
  MoreVerticalIcon,
  PinIcon,
  TrashIcon,
  EditIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface User {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
}

interface Annotation {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  userRole?: string;
  content: string;
  timestamp: number;
  likes: string[]; // Array of user IDs who liked
  replies: Annotation[];
  isPinned?: boolean;
  isEdited?: boolean;
}

interface TimelineEvent {
  id: string;
  type: "decision" | "outcome" | "adjustment" | "review";
  date: number;
  title: string;
  description: string;
}

interface CollaborativeAnnotationsProps {
  event: TimelineEvent;
  annotations: Annotation[];
  currentUser: User;
  onAddAnnotation: (eventId: string, content: string) => void;
  onReplyToAnnotation: (
    annotationId: string,
    content: string,
    eventId: string
  ) => void;
  onLikeAnnotation: (annotationId: string, eventId: string) => void;
  onPinAnnotation?: (annotationId: string, eventId: string) => void;
  onDeleteAnnotation?: (annotationId: string, eventId: string) => void;
  onEditAnnotation?: (
    annotationId: string,
    content: string,
    eventId: string
  ) => void;
}

export function CollaborativeAnnotations({
  event,
  annotations,
  currentUser,
  onAddAnnotation,
  onReplyToAnnotation,
  onLikeAnnotation,
  onPinAnnotation,
  onDeleteAnnotation,
  onEditAnnotation,
}: CollaborativeAnnotationsProps) {
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(
    new Set()
  );

  const handleAddComment = () => {
    if (newComment.trim()) {
      onAddAnnotation(event.id, newComment);
      setNewComment("");
    }
  };

  const handleReply = (annotationId: string) => {
    if (replyContent.trim()) {
      onReplyToAnnotation(annotationId, replyContent, event.id);
      setReplyContent("");
      setReplyingTo(null);
    }
  };

  const handleEdit = (annotationId: string) => {
    if (editContent.trim()) {
      onEditAnnotation?.(annotationId, editContent, event.id);
      setEditContent("");
      setEditingId(null);
    }
  };

  const toggleReplies = (annotationId: string) => {
    const newExpanded = new Set(expandedReplies);
    if (newExpanded.has(annotationId)) {
      newExpanded.delete(annotationId);
    } else {
      newExpanded.add(annotationId);
    }
    setExpandedReplies(newExpanded);
  };

  const formatTimestamp = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (60 * 1000));
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(diff / (24 * 60 * 60 * 1000));

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const sortedAnnotations = [...annotations].sort((a, b) => {
    // Pinned first
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    // Then by timestamp (newest first)
    return b.timestamp - a.timestamp;
  });

  const renderAnnotation = (annotation: Annotation, isReply = false) => {
    const isLiked = annotation.likes.includes(currentUser.id);
    const isOwner = annotation.userId === currentUser.id;
    const isEditing = editingId === annotation.id;

    return (
      <div
        key={annotation.id}
        className={cn(
          "space-y-3",
          isReply && "ml-12 mt-3",
          annotation.isPinned && !isReply && "border-l-2 border-primary pl-4"
        )}
      >
        <div className="flex items-start gap-3">
          <Avatar className="w-8 h-8">
            {annotation.userAvatar && (
              <AvatarImage src={annotation.userAvatar} />
            )}
            <AvatarFallback className="text-xs">
              {getInitials(annotation.userName)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-semibold text-foreground">
                {annotation.userName}
              </span>
              {annotation.userRole && (
                <Badge variant="outline" className="text-xs">
                  {annotation.userRole}
                </Badge>
              )}
              {annotation.isPinned && (
                <Badge className="text-xs bg-primary/10 text-primary">
                  <PinIcon className="w-3 h-3 mr-1" />
                  Pinned
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {formatTimestamp(annotation.timestamp)}
              </span>
              {annotation.isEdited && (
                <span className="text-xs text-muted-foreground italic">
                  (edited)
                </span>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="Edit your comment..."
                  className="min-h-[60px]"
                />

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleEdit(annotation.id)}
                    disabled={!editContent.trim()}
                  >
                    Save
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setEditingId(null);
                      setEditContent("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground whitespace-pre-wrap">
                {annotation.content}
              </p>
            )}

            {!isEditing && (
              <div className="flex items-center gap-4 mt-2">
                <button
                  onClick={() => onLikeAnnotation(annotation.id, event.id)}
                  className={cn(
                    "flex items-center gap-1 text-xs transition-colors",
                    isLiked
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  <ThumbsUpIcon
                    className={cn("w-3 h-3", isLiked && "fill-current")}
                  />

                  {annotation.likes.length > 0 && (
                    <span>{annotation.likes.length}</span>
                  )}
                </button>

                {!isReply && (
                  <button
                    onClick={() => setReplyingTo(annotation.id)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <ReplyIcon className="w-3 h-3" />
                    Reply
                  </button>
                )}

                {annotation.replies.length > 0 && !isReply && (
                  <button
                    onClick={() => toggleReplies(annotation.id)}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {expandedReplies.has(annotation.id) ? "Hide" : "Show"}{" "}
                    {annotation.replies.length} repl
                    {annotation.replies.length === 1 ? "y" : "ies"}
                  </button>
                )}

                {(isOwner || onPinAnnotation || onDeleteAnnotation) && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="ml-auto text-muted-foreground hover:text-foreground transition-colors">
                        <MoreVerticalIcon className="w-4 h-4" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {isOwner && onEditAnnotation && (
                        <DropdownMenuItem
                          onClick={() => {
                            setEditingId(annotation.id);
                            setEditContent(annotation.content);
                          }}
                        >
                          <EditIcon className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                      )}
                      {onPinAnnotation && !isReply && (
                        <DropdownMenuItem
                          onClick={() =>
                            onPinAnnotation(annotation.id, event.id)
                          }
                        >
                          <PinIcon className="w-4 h-4 mr-2" />

                          {annotation.isPinned ? "Unpin" : "Pin"}
                        </DropdownMenuItem>
                      )}
                      {isOwner && onDeleteAnnotation && (
                        <DropdownMenuItem
                          onClick={() =>
                            onDeleteAnnotation(annotation.id, event.id)
                          }
                          className="text-destructive"
                        >
                          <TrashIcon className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reply Input */}
        {replyingTo === annotation.id && (
          <div className="ml-12 space-y-2">
            <Textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder={`Reply to ${annotation.userName}...`}
              className="min-h-[60px]"
            />

            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => handleReply(annotation.id)}
                disabled={!replyContent.trim()}
              >
                <SendIcon className="w-3 h-3 mr-2" />
                Reply
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent("");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Replies */}
        {expandedReplies.has(annotation.id) &&
          annotation.replies.length > 0 && (
            <div className="space-y-3">
              {annotation.replies.map((reply) => renderAnnotation(reply, true))}
            </div>
          )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquareIcon className="w-4 h-4 text-primary" />
              Team Discussion
            </CardTitle>
            <CardDescription className="text-xs mt-1">
              {event.title} • {annotations.length} comment
              {annotations.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Comment Input */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <Avatar className="w-8 h-8">
              {currentUser.avatar && <AvatarImage src={currentUser.avatar} />}
              <AvatarFallback className="text-xs">
                {getInitials(currentUser.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-2">
              <Textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="min-h-[80px]"
              />

              <Button
                onClick={handleAddComment}
                disabled={!newComment.trim()}
                size="sm"
              >
                <SendIcon className="w-3 h-3 mr-2" />
                Comment
              </Button>
            </div>
          </div>
        </div>

        {/* Annotations List */}
        {sortedAnnotations.length > 0 ? (
          <div className="space-y-6 pt-4 border-t border-border">
            {sortedAnnotations.map((annotation) =>
              renderAnnotation(annotation)
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            No comments yet. Be the first to share your thoughts!
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Dialog wrapper for collaborative annotations
 */
interface CollaborativeAnnotationsDialogProps
  extends CollaborativeAnnotationsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CollaborativeAnnotationsDialog({
  open,
  onOpenChange,
  ...props
}: CollaborativeAnnotationsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Team Discussion</DialogTitle>
          <DialogDescription>
            Collaborate with your team on this timeline event
          </DialogDescription>
        </DialogHeader>
        <CollaborativeAnnotations {...props} />
      </DialogContent>
    </Dialog>
  );
}
