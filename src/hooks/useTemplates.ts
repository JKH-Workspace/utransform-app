import { useState, useEffect, useCallback } from "react";
import type { Template } from "../lib/types";
import * as api from "../lib/tauri";

export function useTemplates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await api.listTemplates();
      setTemplates(list);
    } catch (e) {
      console.error("Failed to load templates:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const create = async (
    name: string,
    description: string,
    jsonSchema: Record<string, unknown>
  ) => {
    const t = await api.createTemplate(name, description, jsonSchema);
    await refresh();
    return t;
  };

  const update = async (
    id: string,
    name: string,
    description: string,
    jsonSchema: Record<string, unknown>
  ) => {
    const t = await api.updateTemplate(id, name, description, jsonSchema);
    await refresh();
    return t;
  };

  const remove = async (id: string) => {
    await api.deleteTemplate(id);
    await refresh();
  };

  return { templates, loading, refresh, create, update, remove };
}
