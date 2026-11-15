import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Comment, EventItem, Profile, PublicUser, Rsvp } from './types';
import { SEED_COMMENTS, SEED_EVENTS, SEED_PEOPLE } from './seed';
import { DraftInput, eventsForCity, makeComment, makeDraftEvent, makeRsvp, orderFeedEvents } from './events';
import { CityId, DEFAULT_CITY, isCityId } from './cities';
import { KEYS, asArray, asRecord, clearStorage, migrateStorage, readJson, writeJson } from './storage';
import { track } from '@/lib/analytics';
import { createLogger } from '@/lib/log';

/**
 * Local-first store. This is the single boundary to swap for Supabase later:
 * keep the method names, replace storage reads/writes with API calls.
 * Business rules live in ./events (pure); this file only holds state and persistence.
 */
const log = createLogger('store');

interface StoreCtx {
  /** every published event, all cities (event pages, plans) */
  events: EventItem[];
  /** published events in the profile's city, sponsored pinned (feed, map, dice) */
  cityEvents: EventItem[];
  people: PublicUser[];
  rsvps: Record<string, Rsvp>;
  profile: Profile;
  comments: Comment[];
  addComment: (eventId: string, text: string) => void;
  join: (eventId: string) => void;
  cancel: (eventId: string) => void;
  toggleFollow: (userId: string) => void;
  setName: (name: string) => void;
  setCity: (city: CityId, source: 'home' | 'profile') => void;
  submitDraft: (input: DraftInput) => void;
  /** Debug only: wipe device data and return to first-run state. */
  resetLocalData: () => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

const DEFAULT_PROFILE: Profile = { name: '', follows: ['u2', 'u3'], city: DEFAULT_CITY };

/** Accepts older or partly broken profiles: keeps what is valid, defaults the rest. */
const asProfile = (x: unknown): Profile | null => {
  const p = asRecord<Partial<Profile>>(x);
  if (!p || typeof p.name !== 'string' || !Array.isArray(p.follows)) return null;
  return { name: p.name, follows: p.follows, city: isCityId(p.city) ? p.city : DEFAULT_CITY };
};

/** Persist `value` under `key` whenever it changes, but only after the first load finished. */
function usePersist(key: (typeof KEYS)[keyof typeof KEYS], value: unknown, hydrated: boolean) {
  useEffect(() => {
    if (hydrated) writeJson(key, value);
  }, [key, value, hydrated]);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [rsvps, setRsvps] = useState<Record<string, Rsvp>>({});
  const [drafts, setDrafts] = useState<EventItem[]>([]);
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      await migrateStorage();
      // each key loads on its own: one corrupt value cannot wipe the others
      const [r, p, d, c] = await Promise.all([
        readJson(KEYS.rsvps, {}, asRecord<Record<string, Rsvp>>),
        readJson(KEYS.profile, DEFAULT_PROFILE, asProfile),
        readJson(KEYS.drafts, [], asArray<EventItem>),
        readJson(KEYS.comments, [], asArray<Comment>),
      ]);
      if (!alive) return;
      setRsvps(r);
      setProfile(p);
      setDrafts(d);
      setUserComments(c);
      setHydrated(true);
      log.debug('hydrated', { rsvps: Object.keys(r).length, drafts: d.length, comments: c.length });
    })();
    return () => {
      alive = false;
    };
  }, []);

  usePersist(KEYS.rsvps, rsvps, hydrated);
  usePersist(KEYS.profile, profile, hydrated);
  usePersist(KEYS.drafts, drafts, hydrated);
  usePersist(KEYS.comments, userComments, hydrated);

  const events = useMemo(() => orderFeedEvents([...SEED_EVENTS, ...drafts]), [drafts]);
  const cityEvents = useMemo(() => eventsForCity([...SEED_EVENTS, ...drafts], profile.city), [drafts, profile.city]);

  const comments = useMemo(
    () => [...SEED_COMMENTS, ...userComments].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [userComments],
  );

  const join = useCallback(
    (eventId: string) => {
      const ev = events.find((e) => e.id === eventId);
      if (!ev) {
        log.warn('join: unknown event', { eventId });
        return;
      }
      const rsvp = makeRsvp(ev, new Date().toISOString());
      setRsvps((prev) => ({ ...prev, [eventId]: rsvp }));
      track('rsvp_created', { eventId, ticketed: rsvp.status === 'reserved', tags: ev.tags });
    },
    [events],
  );

  const cancel = useCallback((eventId: string) => {
    setRsvps(({ [eventId]: _removed, ...rest }) => rest);
    track('rsvp_cancelled', { eventId });
  }, []);

  const toggleFollow = useCallback(
    (userId: string) =>
      setProfile((p) => ({
        ...p,
        follows: p.follows.includes(userId) ? p.follows.filter((f) => f !== userId) : [...p.follows, userId],
      })),
    [],
  );

  const setName = useCallback((name: string) => setProfile((p) => ({ ...p, name })), []);

  const setCity = useCallback((city: CityId, source: 'home' | 'profile') => {
    setProfile((p) => {
      if (p.city !== city) track('city_changed', { from: p.city, to: city, source });
      return { ...p, city };
    });
  }, []);

  const addComment = useCallback(
    (eventId: string, text: string) => {
      const c = makeComment(eventId, text, profile.name.trim() || 'Ti', 'uc' + Date.now(), new Date().toISOString());
      if (!c) return;
      setUserComments((prev) => [...prev, c]);
      track('comment_created', { eventId });
    },
    [profile.name],
  );

  const submitDraft = useCallback((input: DraftInput) => {
    setDrafts((d) => [...d, makeDraftEvent(input, 'd' + Date.now())]);
    track('event_draft_submitted', { tags: input.tags });
  }, []);

  const resetLocalData = useCallback(async () => {
    await clearStorage();
    setRsvps({});
    setDrafts([]);
    setProfile(DEFAULT_PROFILE);
    setUserComments([]);
  }, []);

  // memoised so screens only re-render when something they read actually changed
  const value = useMemo<StoreCtx>(
    () => ({
      events,
      cityEvents,
      people: SEED_PEOPLE,
      rsvps,
      profile,
      comments,
      addComment,
      join,
      cancel,
      toggleFollow,
      setName,
      setCity,
      submitDraft,
      resetLocalData,
    }),
    [
      events,
      cityEvents,
      rsvps,
      profile,
      comments,
      addComment,
      join,
      cancel,
      toggleFollow,
      setName,
      setCity,
      submitDraft,
      resetLocalData,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside <StoreProvider>');
  return v;
}
