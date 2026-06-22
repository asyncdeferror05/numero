import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TagInputProps {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function TagInput({ value, onChange, placeholder = "Type and press Enter...", className }: TagInputProps) {
  const [inputValue, setInputValue] = useState("");

  const addTag = (tag: string) => {
    const trimmed = tag.trim().replace(/,$/, "").trim();
    if (trimmed && !value.includes(trimmed)) {
      onChange([...value, trimmed]);
    }
    setInputValue("");
  };

  const removeTag = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      removeTag(value.length - 1);
    }
  };

  return (
    <div className={cn("flex flex-wrap gap-1.5 p-2 border border-input rounded-md bg-background min-h-10 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1", className)}>
      {value.map((tag, i) => (
        <span
          key={i}
          className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/15 text-primary text-xs rounded-md font-medium"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(i)}
            className="hover:text-primary/70 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={(e) => {
          const v = e.target.value;
          if (v.endsWith(",")) {
            addTag(v);
          } else {
            setInputValue(v);
          }
        }}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (inputValue.trim()) addTag(inputValue); }}
        placeholder={value.length === 0 ? placeholder : ""}
        className="flex-1 min-w-24 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
        data-testid="tag-input"
      />
    </div>
  );
}
