import { useState } from "react";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import { useAuth } from "@/features/auth/auth-context";
import { useRooms } from "@/features/logistics/hooks/use-rooms";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@workspace/ui/components/alert-dialog";

export function RoomsPage() {
  const { user } = useAuth();
  const { rooms, isLoading, createRoom, isCreating, updateRoom, deleteRoom } =
    useRooms(user?.centerId);

  const [newRoomName, setNewRoomName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  const handleCreate = async () => {
    const trimmed = newRoomName.trim();
    if (!trimmed) return;

    try {
      await createRoom({ name: trimmed });
      setNewRoomName("");
      toast.success("Room created");
    } catch {
      toast.error("Failed to create room. It may already exist.");
    }
  };

  const handleUpdate = async (id: string) => {
    const trimmed = editingName.trim();
    if (!trimmed) return;

    try {
      await updateRoom({ id, input: { name: trimmed } });
      setEditingId(null);
      toast.success("Room updated");
    } catch {
      toast.error("Failed to update room. Name may already exist.");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRoom(id);
      toast.success("Room deleted");
    } catch {
      toast.error("Failed to delete room");
    }
  };

  const startEditing = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingName("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Rooms</h2>
        <p className="text-muted-foreground">
          Manage room names for scheduling. These appear in the room dropdown
          when creating or editing sessions.
        </p>
      </div>

      {/* Add Room */}
      <div className="flex gap-2">
        <Input
          placeholder="New room name (e.g., Room 101)"
          value={newRoomName}
          onChange={(e) => setNewRoomName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
          className="max-w-sm"
        />
        <Button
          onClick={handleCreate}
          disabled={isCreating || !newRoomName.trim()}
          size="sm"
        >
          {isCreating ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-2 h-4 w-4" />
          )}
          Add Room
        </Button>
      </div>

      {/* Room List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : rooms.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          No rooms defined yet. Add a room above.
        </div>
      ) : (
        <div className="border rounded-lg divide-y">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between px-4 py-3"
            >
              {editingId === room.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdate(room.id);
                      if (e.key === "Escape") cancelEditing();
                    }}
                    className="max-w-sm"
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleUpdate(room.id)}
                    disabled={!editingName.trim()}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={cancelEditing}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className="font-medium">{room.name}</span>
                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => startEditing(room.id, room.name)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Room</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{room.name}"?
                            Existing sessions using this room will keep their
                            room name but it won't appear in the dropdown.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(room.id)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
