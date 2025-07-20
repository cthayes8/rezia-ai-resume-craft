'use client';

import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { GripVertical, Eye, EyeOff } from 'lucide-react';

interface SortableSectionProps {
  id: string;
  title: string;
  visible: boolean;
  onToggleVisibility: () => void;
}

export const SortableSection: React.FC<SortableSectionProps> = ({
  id,
  title,
  visible,
  onToggleVisibility,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-2 p-2 rounded border ${
        visible ? 'bg-white border-gray-200' : 'bg-gray-100 border-gray-300'
      }`}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab hover:cursor-grabbing p-1"
      >
        <GripVertical className="w-4 h-4 text-gray-400" />
      </div>
      
      {/* Section Title */}
      <span className={`flex-1 text-sm ${visible ? 'text-gray-900' : 'text-gray-500'}`}>
        {title}
      </span>
      
      {/* Visibility Toggle */}
      <Button
        size="sm"
        variant="ghost"
        onClick={onToggleVisibility}
        className="p-1 h-6 w-6"
      >
        {visible ? (
          <Eye className="w-3 h-3" />
        ) : (
          <EyeOff className="w-3 h-3" />
        )}
      </Button>
    </div>
  );
};