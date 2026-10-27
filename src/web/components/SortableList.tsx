import type { CSSProperties, HTMLAttributes, ReactNode } from "react";
import { DndContext, KeyboardSensor, PointerSensor, closestCenter, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";

/** Spread onto the element that starts a drag (the grip). */
export type DragHandleProps = HTMLAttributes<HTMLElement> & { ref: (el: HTMLElement | null) => void };

interface Props<T extends { id: number }> {
  items: T[];
  onReorder: (items: T[]) => void;
  renderItem: (item: T, handle: DragHandleProps) => ReactNode;
  className?: string;
}

// Vertical drag-to-reorder list. Works with mouse, touch (via the grip) and keyboard (Space + arrows).
export function SortableList<T extends { id: number }>({ items, onReorder, renderItem, className = "" }: Props<T>) {
  const sensors = useSensors(
    // A few px of movement before a drag starts, so taps on the grip don't count as drags.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    const from = items.findIndex((i) => i.id === active.id);
    const to = items.findIndex((i) => i.id === over.id);
    if (from >= 0 && to >= 0) onReorder(arrayMove(items, from, to));
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis, restrictToParentElement]} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <ul className={className}>
          {items.map((item) => (
            <SortableRow key={item.id} id={item.id}>
              {(handle) => renderItem(item, handle)}
            </SortableRow>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}

function SortableRow({ id, children }: { id: number; children: (handle: DragHandleProps) => ReactNode }) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    position: "relative",
    zIndex: isDragging ? 10 : undefined,
  };
  return (
    <li ref={setNodeRef} style={style} className={isDragging ? "rounded-lg bg-white shadow-lg ring-1 ring-stone-300" : "bg-white"}>
      {children({ ...attributes, ...listeners, ref: setActivatorNodeRef })}
    </li>
  );
}

export function DragHandle({ label, ...props }: DragHandleProps & { label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      title="Drag to reorder"
      className="flex h-9 w-7 shrink-0 cursor-grab touch-none items-center justify-center rounded text-stone-400 hover:bg-stone-100 hover:text-stone-700 active:cursor-grabbing"
      {...props}
    >
      <svg width="12" height="18" viewBox="0 0 12 18" fill="currentColor" aria-hidden="true">
        {[3, 9].flatMap((x) => [3, 9, 15].map((y) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" />))}
      </svg>
    </button>
  );
}
