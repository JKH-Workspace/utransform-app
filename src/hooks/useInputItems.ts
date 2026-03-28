import { useState } from "react";

export function useInputItems() {
  const [items, setItems] = useState<string[]>([]);

  const add = (value: string) => {
    if (!value.trim()) return;
    setItems((prev) => [...prev, value.trim()]);
  };

  const remove = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const clear = () => setItems([]);

  return { items, add, remove, clear };
}
