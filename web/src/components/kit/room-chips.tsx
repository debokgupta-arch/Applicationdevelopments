import { Plus } from "lucide-react";
import { copy } from "@/lib/copy";
import { ToggleChip } from "./chip";

type Room = { id: string; name: string };

type RoomChipsProps = {
  rooms: readonly Room[];
  selected: readonly string[];
  onToggle: (roomId: string) => void;
  onAddRoom: () => void;
  label: string;
};

/** Multi-select room chips with a dashed "+ Room" chip to create a new room. */
export function RoomChips({ rooms, selected, onToggle, onAddRoom, label }: RoomChipsProps) {
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {rooms.map((room) => (
        <ToggleChip
          key={room.id}
          pressed={selected.includes(room.id)}
          onPressedChange={() => onToggle(room.id)}
        >
          {room.name}
        </ToggleChip>
      ))}
      <button
        type="button"
        onClick={onAddRoom}
        aria-label={copy.chips.addRoomLabel}
        className="inline-flex min-h-11 items-center gap-1 rounded-full border border-dashed border-input px-4 text-body font-semibold text-primary outline-none hover:bg-primary-tint focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <Plus className="size-4" aria-hidden="true" />
        {copy.chips.addRoom}
      </button>
    </div>
  );
}
