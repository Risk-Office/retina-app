import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { PlusIcon, TrashIcon, UsersIcon, MailIcon, XIcon } from "lucide-react";
import {
  getDistributionLists,
  createDistributionList,
  deleteDistributionList,
  addRecipientToList,
  removeRecipientFromList,
  getRecipientsFromLists,
  initializeDefaultLists,
  type DistributionList,
  type Recipient,
} from "@/polymet/data/distribution-lists";

interface DistributionListManagerProps {
  tenantId: string;
  onRecipientsSelected: (recipients: Recipient[]) => void;
  selectedRecipients?: Recipient[];
}

export function DistributionListManager({
  tenantId,
  onRecipientsSelected,
  selectedRecipients = [],
}: DistributionListManagerProps) {
  const [open, setOpen] = useState(false);
  const [lists, setLists] = useState<DistributionList[]>(
    getDistributionLists(tenantId)
  );
  const [selectedListIds, setSelectedListIds] = useState<string[]>([]);
  const [showCreateList, setShowCreateList] = useState(false);
  const [showAddRecipient, setShowAddRecipient] = useState<string | null>(null);

  // Create list form
  const [newListName, setNewListName] = useState("");
  const [newListDescription, setNewListDescription] = useState("");

  // Add recipient form
  const [newRecipientEmail, setNewRecipientEmail] = useState("");
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newRecipientRole, setNewRecipientRole] = useState("");

  const refreshLists = () => {
    setLists(getDistributionLists(tenantId));
  };

  const handleInitialize = () => {
    initializeDefaultLists(tenantId);
    refreshLists();
  };

  const handleCreateList = () => {
    if (!newListName.trim()) return;

    createDistributionList(tenantId, newListName, newListDescription, []);
    refreshLists();
    setNewListName("");
    setNewListDescription("");
    setShowCreateList(false);
  };

  const handleDeleteList = (listId: string) => {
    deleteDistributionList(tenantId, listId);
    setSelectedListIds((prev) => prev.filter((id) => id !== listId));
    refreshLists();
  };

  const handleToggleList = (listId: string) => {
    setSelectedListIds((prev) =>
      prev.includes(listId)
        ? prev.filter((id) => id !== listId)
        : [...prev, listId]
    );
  };

  const handleAddRecipient = (listId: string) => {
    if (!newRecipientEmail.trim() || !newRecipientName.trim()) return;

    const recipient: Recipient = {
      email: newRecipientEmail.trim(),
      name: newRecipientName.trim(),
      role: newRecipientRole.trim() || undefined,
    };

    addRecipientToList(tenantId, listId, recipient);
    refreshLists();
    setNewRecipientEmail("");
    setNewRecipientName("");
    setNewRecipientRole("");
    setShowAddRecipient(null);
  };

  const handleRemoveRecipient = (listId: string, email: string) => {
    removeRecipientFromList(tenantId, listId, email);
    refreshLists();
  };

  const handleApplySelection = () => {
    const recipients = getRecipientsFromLists(tenantId, selectedListIds);
    onRecipientsSelected(recipients);
    setOpen(false);
  };

  const totalRecipients = getRecipientsFromLists(
    tenantId,
    selectedListIds
  ).length;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <UsersIcon className="w-4 h-4 mr-2" />
          Distribution Lists
          {selectedRecipients.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {selectedRecipients.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Distribution Lists</DialogTitle>
          <DialogDescription>
            Select distribution lists to add recipients
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Initialize if empty */}
          {lists.length === 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    No distribution lists found
                  </p>
                  <Button onClick={handleInitialize}>
                    Initialize Default Lists
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Create new list */}
          {lists.length > 0 && (
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                {selectedListIds.length} list(s) selected • {totalRecipients}{" "}
                recipient(s)
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateList(!showCreateList)}
              >
                <PlusIcon className="w-4 h-4 mr-2" />
                New List
              </Button>
            </div>
          )}

          {showCreateList && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Create New List</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-list-name">List Name</Label>
                  <Input
                    id="new-list-name"
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="e.g., Stakeholders"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-list-description">Description</Label>
                  <Textarea
                    id="new-list-description"
                    value={newListDescription}
                    onChange={(e) => setNewListDescription(e.target.value)}
                    placeholder="Brief description"
                    rows={2}
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleCreateList}>Create</Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateList(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lists */}
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-3">
              {lists.map((list) => (
                <Card key={list.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={selectedListIds.includes(list.id)}
                          onCheckedChange={() => handleToggleList(list.id)}
                        />

                        <div className="flex-1">
                          <div className="font-semibold">{list.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {list.description}
                          </div>
                          <Badge variant="outline" className="mt-2">
                            {list.recipients.length} recipient(s)
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteList(list.id)}
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>

                  {list.recipients.length > 0 && (
                    <CardContent>
                      <div className="space-y-2">
                        {list.recipients.map((recipient) => (
                          <div
                            key={recipient.email}
                            className="flex items-center justify-between p-2 bg-muted rounded text-sm"
                          >
                            <div>
                              <div className="font-medium">
                                {recipient.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {recipient.email}
                                {recipient.role && ` • ${recipient.role}`}
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                handleRemoveRecipient(list.id, recipient.email)
                              }
                            >
                              <XIcon className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}

                  <CardContent className="pt-0">
                    {showAddRecipient === list.id ? (
                      <div className="space-y-3 p-3 border border-border rounded-lg">
                        <div className="space-y-2">
                          <Label htmlFor={`email-${list.id}`}>Email</Label>
                          <Input
                            id={`email-${list.id}`}
                            type="email"
                            value={newRecipientEmail}
                            onChange={(e) =>
                              setNewRecipientEmail(e.target.value)
                            }
                            placeholder="email@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`name-${list.id}`}>Name</Label>
                          <Input
                            id={`name-${list.id}`}
                            value={newRecipientName}
                            onChange={(e) =>
                              setNewRecipientName(e.target.value)
                            }
                            placeholder="Full Name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor={`role-${list.id}`}>
                            Role (optional)
                          </Label>
                          <Input
                            id={`role-${list.id}`}
                            value={newRecipientRole}
                            onChange={(e) =>
                              setNewRecipientRole(e.target.value)
                            }
                            placeholder="e.g., Director"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleAddRecipient(list.id)}
                          >
                            Add
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowAddRecipient(null)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddRecipient(list.id)}
                      >
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Add Recipient
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          {/* Actions */}
          <Separator />

          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {totalRecipients} recipient(s) will be added
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleApplySelection}
                disabled={totalRecipients === 0}
              >
                <MailIcon className="w-4 h-4 mr-2" />
                Add Recipients
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
