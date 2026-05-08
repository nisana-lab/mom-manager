"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "@/components/providers/SupabaseAuthProvider";
import {
  hydratePersistedFromRemoteBlob,
  loadPersistedStateForUser,
  savePersistedStateForUser,
  tryConsumeLegacyImport,
} from "@/lib/persisted-state";
import type { MomManagerPersisted, StudioSession } from "@/types/mom-manager";
import { todayLocalISODate } from "@/lib/dates";

export type MomManagerContextValue = {
  state: MomManagerPersisted | null;
  ready: boolean;
  toggleTask: (taskId: string, done: boolean) => void;
  setSelection: (
    key: "sandwiches" | "dinner",
    value: string
  ) => void;
  setStudioSessions: (sessions: StudioSession[]) => void;
  dismissStudioMorning: () => void;
  hasStudioToday: boolean;
  todayStudioSessions: StudioSession[];
  showStudioMorningAlert: boolean;
  today: string;
  applyPersisted: (
    fn: (prev: MomManagerPersisted) => MomManagerPersisted
  ) => void;
};

const MomManagerContext = createContext<MomManagerContextValue | null>(null);

function hasMeaningfulRemoteState(remote: unknown): boolean {
  if (!remote || typeof remote !== "object") return false;
  const o = remote as Record<string, unknown>;
  return Object.keys(o).length > 0;
}

export function MomManagerProvider({ children }: { children: ReactNode }) {
  const { user, supabase } = useAuth();
  const userId = user?.id;
  const [state, setState] = useState<MomManagerPersisted | null>(null);
  const [cloudReady, setCloudReady] = useState(false);
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stateRef = useRef<MomManagerPersisted | null>(null);

  const flushCloud = useCallback(
    async (next: MomManagerPersisted) => {
      if (!supabase || !userId) return;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { error } = await supabase.from("mom_manager_state").upsert(
          {
            user_id: userId,
            state: next,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        if (!error) return;
        await new Promise((r) => setTimeout(r, 350 * (attempt + 1)));
      }
    },
    [supabase, userId]
  );

  const persistLocalAndScheduleCloud = useCallback(
    (next: MomManagerPersisted) => {
      if (!userId) return;
      savePersistedStateForUser(userId, next);
      /** שליחה מיידית לסופבייס — השהיה קודמת גרמה לשינויים שלא לעלות לענן לפני סגירת דף / מעבר אפליקציה */
      void flushCloud(next);
      if (cloudTimer.current) clearTimeout(cloudTimer.current);
      cloudTimer.current = setTimeout(() => {
        void flushCloud(next);
      }, 1200);
    },
    [userId, flushCloud]
  );

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    if (!supabase || !userId) return;
    const onPageHide = () => {
      const s = stateRef.current;
      if (s) void flushCloud(s);
    };
    window.addEventListener("pagehide", onPageHide);
    return () => window.removeEventListener("pagehide", onPageHide);
  }, [supabase, userId, flushCloud]);

  useEffect(() => {
    if (!userId) {
      setState(null);
      setCloudReady(false);
      return;
    }

    if (!supabase) {
      let local = loadPersistedStateForUser(userId);
      const legacy = tryConsumeLegacyImport(userId);
      if (legacy) {
        local = legacy;
      }
      setState(local);
      setCloudReady(true);
      return;
    }

    const uid = userId;
    const client = supabase;

    setState(null);
    setCloudReady(false);
    let cancelled = false;

    async function init() {
      const pushRow = async (s: MomManagerPersisted) => {
        const { error } = await client.from("mom_manager_state").upsert(
          {
            user_id: uid,
            state: s,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        return error;
      };

      try {
        const { data: row, error } = await client
          .from("mom_manager_state")
          .select("state, updated_at")
          .eq("user_id", uid)
          .maybeSingle();

        if (cancelled) return;

        const remote = row?.state;

        if (!error && hasMeaningfulRemoteState(remote)) {
          const h = hydratePersistedFromRemoteBlob(remote, uid);
          setState(h);
          savePersistedStateForUser(uid, h);
          setCloudReady(true);
          return;
        }

        if (error) {
          const local = loadPersistedStateForUser(uid);
          setState(local);
          setCloudReady(true);
          return;
        }

        let local = loadPersistedStateForUser(uid);
        const legacy = tryConsumeLegacyImport(uid);
        if (legacy) {
          local = legacy;
        }
        setState(local);
        setCloudReady(true);
        const pushErr = await pushRow(local);
        if (pushErr) {
          for (let attempt = 0; attempt < 2; attempt++) {
            await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
            const e = await pushRow(local);
            if (!e) break;
          }
        }
      } catch {
        if (cancelled) return;
        const local = loadPersistedStateForUser(uid);
        setState(local);
        setCloudReady(true);
      }
    }

    void init();

    return () => {
      cancelled = true;
    };
  }, [userId, supabase]);

  useEffect(() => {
    if (!supabase || !userId || !cloudReady) return;

    const channel = supabase
      .channel(`mom_manager_state:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "mom_manager_state",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as { state?: unknown };
          if (!row?.state || !hasMeaningfulRemoteState(row.state)) return;
          const incoming = hydratePersistedFromRemoteBlob(row.state, userId);
          setState(incoming);
          savePersistedStateForUser(userId, incoming);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, userId, cloudReady]);

  /** כשחוזרים ללשונית — שולחים שוב לענן (מובייל: רשת/רקע עשויים לעכב debounce) */
  useEffect(() => {
    if (!supabase || !userId || !cloudReady || state === null) return;
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      void flushCloud(state);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [supabase, userId, cloudReady, state, flushCloud]);

  const toggleTask = useCallback(
    (taskId: string, done: boolean) => {
      setState((prev) => {
        if (!prev) return prev;
        const next: MomManagerPersisted = {
          ...prev,
          checklist: { ...prev.checklist, [taskId]: done },
          checklistDay: prev.checklistDay || todayLocalISODate(),
        };
        persistLocalAndScheduleCloud(next);
        return next;
      });
    },
    [persistLocalAndScheduleCloud]
  );

  const setSelection = useCallback(
    (key: "sandwiches" | "dinner", value: string) => {
      setState((prev) => {
        if (!prev) return prev;
        const next: MomManagerPersisted = {
          ...prev,
          selections: { ...prev.selections, [key]: value },
        };
        persistLocalAndScheduleCloud(next);
        return next;
      });
    },
    [persistLocalAndScheduleCloud]
  );

  const setStudioSessions = useCallback(
    (sessions: StudioSession[]) => {
      setState((prev) => {
        if (!prev) return prev;
        const next: MomManagerPersisted = {
          ...prev,
          studioSessions: sessions,
        };
        persistLocalAndScheduleCloud(next);
        return next;
      });
    },
    [persistLocalAndScheduleCloud]
  );

  const dismissStudioMorning = useCallback(() => {
    const today = todayLocalISODate();
    setState((prev) => {
      if (!prev) return prev;
      const next: MomManagerPersisted = {
        ...prev,
        studioMorningDismissedDate: today,
      };
      persistLocalAndScheduleCloud(next);
      return next;
    });
  }, [persistLocalAndScheduleCloud]);

  const applyPersisted = useCallback(
    (fn: (prev: MomManagerPersisted) => MomManagerPersisted) => {
      setState((prev) => {
        if (!prev) return prev;
        const next = fn(prev);
        persistLocalAndScheduleCloud(next);
        return next;
      });
    },
    [persistLocalAndScheduleCloud]
  );

  const today = todayLocalISODate();

  const todayStudioSessions = useMemo(() => {
    if (!state) return [];
    return state.studioSessions.filter((s) => s.date === today);
  }, [state, today]);

  const hasStudioToday = todayStudioSessions.length > 0;

  const showStudioMorningAlert = useMemo(() => {
    if (!state) return false;
    return hasStudioToday && state.studioMorningDismissedDate !== today;
  }, [state, hasStudioToday, today]);

  const ready = state !== null && cloudReady;

  const value = useMemo(
    () => ({
      state,
      ready,
      toggleTask,
      setSelection,
      setStudioSessions,
      dismissStudioMorning,
      hasStudioToday,
      todayStudioSessions,
      showStudioMorningAlert,
      today,
      applyPersisted,
    }),
    [
      state,
      ready,
      toggleTask,
      setSelection,
      setStudioSessions,
      dismissStudioMorning,
      hasStudioToday,
      todayStudioSessions,
      showStudioMorningAlert,
      today,
      applyPersisted,
    ]
  );

  return (
    <MomManagerContext.Provider value={value}>
      {children}
    </MomManagerContext.Provider>
  );
}

export function useMomManager(): MomManagerContextValue {
  const ctx = useContext(MomManagerContext);
  if (!ctx) {
    throw new Error("useMomManager must be used within MomManagerProvider");
  }
  return ctx;
}
