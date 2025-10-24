"use client";

import { Button } from '@/components/ui/button';
import { CATEGORIES, Category } from '@/lib/types';

interface CategoryFilterProps {
  selected: Category;
  onSelect: (category: Category) => void;
}

export default function CategoryFilter({ selected, onSelect }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {CATEGORIES.map((category) => (
        <Button
          key={category}
          variant={selected === category ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  );
}
