"use client";

import React, { useRef } from "react";
// @ts-ignore
import { useDrag, useDrop } from "react-dnd";
import { GripVertical } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const ItemType = "SORTABLE_ITEM";

interface SortableItemProps {
  id: string | number;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
}

const SortableItem = ({ id, index, moveItem, children }: SortableItemProps) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ handlerId }, drop] = useDrop({
    accept: ItemType,
    collect(monitor: any) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: any, monitor: any) {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current?.getBoundingClientRect();
      const hoverMiddleY = (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
      const clientOffset = monitor.getClientOffset();
      const hoverClientY = (clientOffset as any).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;

      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: () => ({ id, index }),
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  drag(drop(ref));

  return (
    <div
      ref={ref}
      data-handler-id={handlerId}
      className={cn(
        "flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl mb-2 transition-all group",
        isDragging ? "opacity-30 scale-95" : "opacity-100 hover:border-blue-500/50"
      )}
    >
      <div className="cursor-grab active:cursor-grabbing text-slate-300 dark:text-slate-600 group-hover:text-slate-400">
        <GripVertical size={18} />
      </div>
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
};

interface SortableListProps<T> {
  items: T[];
  onOrderChange: (items: T[]) => void;
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string | number;
  className?: string;
}

export function SortableList<T>({
  items,
  onOrderChange,
  renderItem,
  keyExtractor,
  className,
}: SortableListProps<T>) {
  const moveItem = (dragIndex: number, hoverIndex: number) => {
    const dragItem = items[dragIndex];
    const newItems = [...items];
    newItems.splice(dragIndex, 1);
    newItems.splice(hoverIndex, 0, dragItem);
    onOrderChange(newItems);
  };

  return (
    <div className={cn("flex flex-col", className)}>
      {items.map((item, index) => (
        <SortableItem
          key={keyExtractor(item)}
          id={keyExtractor(item)}
          index={index}
          moveItem={moveItem}
        >
          {renderItem(item)}
        </SortableItem>
      ))}
    </div>
  );
}
