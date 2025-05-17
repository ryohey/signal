import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import { restrictToVerticalAxis } from "@dnd-kit/modifiers"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

interface SortableItemProps<ID extends string | number> {
  id: ID
  children: React.ReactNode
}

const SortableItem = <ID extends string | number>(
  props: SortableItemProps<ID>,
) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: props.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      tabIndex={-1}
    >
      {props.children}
    </div>
  )
}

export interface DraggableListProps<T, ID extends string | number> {
  items: T[]
  render: (item: T) => React.ReactNode
  getItemId: (item: T) => ID
  onItemMoved: (oldId: ID, newId: ID) => void
}

export const DraggableList = <T extends object, ID extends string | number>({
  items: _items,
  render,
  getItemId,
  onItemMoved,
}: DraggableListProps<T, ID>) => {
  const items = _items.map((item) => ({ id: getItemId(item), item }))

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // Enable item click
      },
    }),
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={(event) => {
        const { active, over } = event

        if (over !== null && active.id !== over.id) {
          onItemMoved(active.id as ID, over.id as ID)
        }
      }}
      modifiers={[restrictToVerticalAxis]}
    >
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        {items.map((item) => (
          <SortableItem key={item.id} id={item.id}>
            {render(item.item)}
          </SortableItem>
        ))}
      </SortableContext>
    </DndContext>
  )
}
