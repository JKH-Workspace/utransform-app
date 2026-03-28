import { useState } from "react";
import type { TransformResult } from "../lib/types";
import * as api from "../lib/tauri";

export function useTransform() {
  const [results, setResults] = useState<TransformResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async (inputs: string[], templateIds: string[]) => {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await api.runTransform(inputs, templateIds);
      setResults(res);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const clear = () => {
    setResults([]);
    setError(null);
  };

  return { results, loading, error, run, clear };
}
