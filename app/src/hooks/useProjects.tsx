import { createContext, useContext, useState, useEffect, useMemo, type ReactNode } from 'react';
import { projects as presetProjects } from '@/data/mockData';
import type { Project } from '@/types';
import { useAuth } from '@/hooks/useAuth';
import { fetchProjectOverrides, addProject as apiAddProject, removeProject as apiRemoveProject } from '@/lib/backend';

interface ProjectsContextValue {
  projects: Project[];
  loading: boolean;
  error: string | null;
  addProject: (name: string, description: string) => Promise<void>;
  removeProject: (id: string) => Promise<void>;
  reload: () => void;
}

const ProjectsContext = createContext<ProjectsContextValue | null>(null);

export function ProjectsProvider({ children }: { children: ReactNode }) {
  const { user, users } = useAuth();
  const [added, setAdded] = useState<Project[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const ov = await fetchProjectOverrides();
        if (!cancelled) { setAdded(ov.added); setRemovedIds(ov.removedIds); }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  // 合并：预置项目（去掉被移除的）+ 新增项目
  const projects = useMemo(
    () => [...presetProjects.filter((p) => !removedIds.includes(p.id)), ...added],
    [added, removedIds],
  );

  const addProject = async (name: string, description: string) => {
    const me = users.find((u) => u.id === user?.id) ?? users[0];
    const creds = { name: user?.name ?? '', password: me?.password ?? '' };
    const project: Project = {
      id: `pr-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      status: 'active',
      lead: me,
      members: [me],
      startDate: new Date().toLocaleString('sv').slice(0, 10),
    };
    const saved = await apiAddProject(project, creds);
    setAdded((prev) => [...prev, saved]);
    setRemovedIds((prev) => prev.filter((x) => x !== saved.id));
  };

  const removeProject = async (id: string) => {
    const me = users.find((u) => u.id === user?.id) ?? users[0];
    const creds = { name: user?.name ?? '', password: me?.password ?? '' };
    await apiRemoveProject(id, creds);
    setAdded((prev) => {
      const inAdded = prev.some((p) => p.id === id);
      if (inAdded) return prev.filter((p) => p.id !== id);
      setRemovedIds((r) => (r.includes(id) ? r : [...r, id]));
      return prev;
    });
  };

  const value: ProjectsContextValue = {
    projects,
    loading,
    error,
    addProject,
    removeProject,
    reload: () => setRefreshKey((k) => k + 1),
  };

  return <ProjectsContext.Provider value={value}>{children}</ProjectsContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProjects() {
  const ctx = useContext(ProjectsContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectsProvider');
  return ctx;
}