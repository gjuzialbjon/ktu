import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { type Comment, type EventItem, type GoingVisibility, type Profile, type PublicUser, type Rsvp, DraftInput, eventsForCity, makeComment, makeDraftEvent, makeRsvp, orderFeedEvents, CityId, DEFAULT_CITY, isLiveCity, DEMO_APPROVE_AFTER_MS, hiddenTopicOf, visibleInFeed, nextEditions, nextRollAt, HostStanding, HostTier, eventTier, outcomeOf, standingsFor, canSeeGoing, DEFAULT_SHOW_GOING, GOING_VISIBILITIES, autoAccepts, makeRating, type Rating, type RatingIssue } from '@ktu/shared';
import { DEMO_RSVPS, SEED_COMMENTS, SEED_EVENTS, SEED_PEOPLE } from './seed';
import { hostHistory } from './hostHistory';
import { KEYS, asArray, asRecord, clearStorage, migrateStorage, readJson, writeJson } from './storage';
import { track } from '@/lib/analytics';
import { createLogger } from '@/lib/log';

/**
 * Local-first store: every user action in the app is a method here. It is the single boundary
 * the backend (../backend) replaces: keep the method names, swap storage reads/writes for API
 * calls (order in docs/FEATURES.md, section 10). Business rules live in @ktu/shared (pure);
 * this file only holds state and persistence.
 */
const log = createLogger('store');

interface StoreCtx {
  /** every published event, all cities (event pages, plans) */
  events: EventItem[];
  /** published events in the profile's city that this person may see in a feed, sponsored pinned (feed, map, dice) */
  cityEvents: EventItem[];
  people: PublicUser[];
  /** the people going to an event whose going you may see (their own choice); counts use goingUserIds */
  goersOf: (e: EventItem) => PublicUser[];
  /** people you follow whose going you may see: the only friends that may shape the feed */
  friendsShown: string[];
  rsvps: Record<string, Rsvp>;
  profile: Profile;
  comments: Comment[];
  addComment: (eventId: string, text: string) => void;
  join: (eventId: string) => void;
  cancel: (eventId: string) => void;
  toggleFollow: (userId: string) => void;
  setName: (name: string) => void;
  /** who may see the events you are going to */
  setShowGoing: (v: GoingVisibility) => void;
  setCity: (city: CityId, source: 'home' | 'profile') => void;
  toggleInterest: (tag: string) => void;
  /** "never show me this topic"; removes it from interests */
  toggleHidden: (tag: string) => void;
  /** events in the city the feed leaves out because of a hidden topic (for "N hidden, change") */
  hiddenEvents: EventItem[];
  /** ask the host (approved after a short delay in the demo); in at once if the host lets a shared interest in */
  requestJoin: (eventId: string) => void;
  likes: Record<string, true>;
  saved: Record<string, true>;
  toggleLike: (eventId: string) => void;
  toggleSave: (eventId: string) => void;
  /** partner id → first check-in time */
  stamps: Record<string, string>;
  collectStamp: (partnerId: string) => void;
  submitDraft: (input: DraftInput) => void;
  /** event id → your rating of it (see ratings.ts) */
  ratings: Record<string, Rating>;
  /** rate an event you went to; replaces your earlier rating of it */
  rate: (eventId: string, stars: number, issues: RatingIssue[], note: string) => void;
  /** host id → standing, from past outcomes (see hostStanding) */
  standings: Record<string, HostStanding>;
  /** the feed tier of an event's host */
  tierOf: (e: EventItem) => HostTier;
  /** events you created, still waiting for a curator */
  myDrafts: EventItem[];
  /** Debug only: wipe device data and return to first-run state. */
  resetLocalData: () => Promise<void>;
}

const Ctx = createContext<StoreCtx | null>(null);

/** A few starter interests so private events have something to match before the user picks their own. */
export const DEFAULT_INTERESTS = ['meet-people', 'outdoor', 'books'];
const DEFAULT_PROFILE: Profile = {
  name: '',
  follows: ['u2', 'u3'],
  city: DEFAULT_CITY,
  interests: DEFAULT_INTERESTS,
  hidden: [],
  showGoing: DEFAULT_SHOW_GOING,
};

/** Accepts older or partly broken profiles: keeps what is valid, defaults the rest. */
const asProfile = (x: unknown): Profile | null => {
  const p = asRecord<Partial<Profile>>(x);
  if (!p || typeof p.name !== 'string' || !Array.isArray(p.follows)) return null;
  return {
    name: p.name,
    follows: p.follows,
    // a city saved while it was live, then switched off, falls back to the default
    city: isLiveCity(p.city) ? p.city : DEFAULT_CITY,
    interests: Array.isArray(p.interests) ? p.interests.filter((x) => typeof x === 'string') : DEFAULT_INTERESTS,
    hidden: Array.isArray(p.hidden) ? p.hidden.filter((x) => typeof x === 'string') : [],
    // profiles saved before the setting existed start at "nobody", like everyone else
    showGoing: GOING_VISIBILITIES.includes(p.showGoing as GoingVisibility) ? (p.showGoing as GoingVisibility) : DEFAULT_SHOW_GOING,
  };
};

/** Adds `id` to a set-like record, or removes it if present. */
function toggleKey(set: Record<string, true>, id: string): Record<string, true> {
  const { [id]: had, ...rest } = set;
  return had ? rest : { ...rest, [id]: true };
}

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
  const [likes, setLikes] = useState<Record<string, true>>({});
  const [saved, setSaved] = useState<Record<string, true>>({});
  const [stamps, setStamps] = useState<Record<string, string>>({});
  const [ratings, setRatings] = useState<Record<string, Rating>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      await migrateStorage();
      // each key loads on its own: one corrupt value cannot wipe the others
      const [r, p, d, c, l, sv, st, rt] = await Promise.all([
        // a first run starts with the demo's past event, so there is something to rate
        readJson(KEYS.rsvps, DEMO_RSVPS, asRecord<Record<string, Rsvp>>),
        readJson(KEYS.profile, DEFAULT_PROFILE, asProfile),
        readJson(KEYS.drafts, [], asArray<EventItem>),
        readJson(KEYS.comments, [], asArray<Comment>),
        readJson(KEYS.likes, {}, asRecord<Record<string, true>>),
        readJson(KEYS.saved, {}, asRecord<Record<string, true>>),
        readJson(KEYS.stamps, {}, asRecord<Record<string, string>>),
        readJson(KEYS.ratings, {}, asRecord<Record<string, Rating>>),
      ]);
      if (!alive) return;
      setLikes(l);
      setSaved(sv);
      setStamps(st);
      setRatings(rt);
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
  usePersist(KEYS.likes, likes, hydrated);
  usePersist(KEYS.saved, saved, hydrated);
  usePersist(KEYS.stamps, stamps, hydrated);
  usePersist(KEYS.ratings, ratings, hydrated);

  // recurring events: the next edition appears the moment the latest one starts. `clock` only
  // moves at those moments (a timer set for the next one), not every minute.
  const [clock, setClock] = useState(() => Date.now());
  const baseEvents = useMemo(() => [...SEED_EVENTS, ...drafts].filter((e) => isLiveCity(e.city)), [drafts]);
  const allEvents = useMemo(() => [...baseEvents, ...nextEditions(baseEvents, new Date(clock))], [baseEvents, clock]);
  useEffect(() => {
    const due = nextRollAt(allEvents, new Date(clock));
    if (due == null) return;
    // timers cannot wait longer than ~24 days; check again hourly at most
    const timer = setTimeout(() => setClock(Date.now()), Math.min(Math.max(due - Date.now(), 0) + 50, 3600_000));
    return () => clearTimeout(timer);
  }, [allEvents, clock]);
  const events = useMemo(() => orderFeedEvents(allEvents), [allEvents]);
  // host standing: the demo history plus every event that has ended or was cancelled since.
  // Recomputed when `clock` moves (an edition starting), which is often enough for a ranking.
  const standings = useMemo(() => {
    const now = new Date(clock);
    const ended = allEvents
      .map((e) => outcomeOf(e, now, ratings[e.id] ? [ratings[e.id]] : []))
      .filter((o) => o != null);
    return standingsFor([...hostHistory(now), ...ended], now);
  }, [allEvents, clock, ratings]);
  const tierOf = useCallback((e: EventItem) => eventTier(e, standings), [standings]);
  const myDrafts = useMemo(() => drafts.filter((d) => d.status === 'draft' && isLiveCity(d.city)), [drafts]);
  // whose plans you may see: each person's own choice (canSeeGoing). In the demo the seed people
  // carry their choice and whether they follow you; the server decides this per viewer.
  const shownIds = useMemo(
    () => new Set(SEED_PEOPLE.filter((p) => canSeeGoing(p.showGoing, { followedByGoer: !!p.followsYou })).map((p) => p.id)),
    [],
  );
  const goersOf = useCallback(
    (e: EventItem) => SEED_PEOPLE.filter((p) => shownIds.has(p.id) && e.goingUserIds.includes(p.id)),
    [shownIds],
  );
  const friendsShown = useMemo(() => profile.follows.filter((id) => shownIds.has(id)), [profile.follows, shownIds]);
  // a private event reaching you because a friend is going would give their plan away, so only
  // friends who share their plans count
  const feedProfile = useMemo(() => ({ ...profile, follows: friendsShown }), [profile, friendsShown]);
  const cityEvents = useMemo(
    () => eventsForCity(allEvents, profile.city).filter((e) => visibleInFeed(e, feedProfile, rsvps[e.id])),
    [allEvents, profile.city, feedProfile, rsvps],
  );
  const hiddenEvents = useMemo(
    () =>
      profile.hidden.length === 0
        ? []
        : eventsForCity(allEvents, profile.city).filter(
            (e) => !rsvps[e.id] && hiddenTopicOf(e, profile.hidden) && visibleInFeed(e, { ...feedProfile, hidden: [] }, undefined),
          ),
    [allEvents, profile, feedProfile, rsvps],
  );

  // Demo host: a pending request is accepted a few seconds after it was sent (also on the
  // next app start, if the app closed while waiting). A backend replaces this with real answers.
  const pendingIds = Object.values(rsvps)
    .filter((r) => r.status === 'requested')
    .map((r) => r.eventId)
    .join(',');
  useEffect(() => {
    if (!pendingIds) return;
    const timer = setInterval(() => {
      const nowMs = Date.now();
      setRsvps((prev) => {
        let changed = false;
        const next = { ...prev };
        for (const r of Object.values(prev)) {
          if (r.status !== 'requested' || nowMs - new Date(r.createdAt).getTime() < DEMO_APPROVE_AFTER_MS) continue;
          const ev = allEvents.find((e) => e.id === r.eventId);
          if (!ev) continue;
          next[r.eventId] = makeRsvp(ev, new Date(nowMs).toISOString());
          changed = true;
          track('join_request_approved', { eventId: r.eventId });
        }
        return changed ? next : prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [pendingIds, allEvents]);

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
  const setShowGoing = useCallback((v: GoingVisibility) => {
    setProfile((p) => {
      if (p.showGoing !== v) track('going_visibility_changed', { from: p.showGoing, to: v });
      return { ...p, showGoing: v };
    });
  }, []);

  const setCity = useCallback((city: CityId, source: 'home' | 'profile') => {
    if (!isLiveCity(city)) return;
    setProfile((p) => {
      if (p.city !== city) track('city_changed', { from: p.city, to: city, source });
      return { ...p, city };
    });
  }, []);

  const toggleInterest = useCallback(
    (tag: string) =>
      setProfile((p) => ({
        ...p,
        interests: p.interests.includes(tag) ? p.interests.filter((x) => x !== tag) : [...p.interests, tag],
        hidden: p.hidden.filter((x) => x !== tag),
      })),
    [],
  );
  const toggleHidden = useCallback((tag: string) => {
    setProfile((p) => {
      const hiding = !p.hidden.includes(tag);
      track(hiding ? 'topic_hidden' : 'topic_unhidden', { tag });
      return {
        ...p,
        hidden: hiding ? [...p.hidden, tag] : p.hidden.filter((x) => x !== tag),
        interests: hiding ? p.interests.filter((x) => x !== tag) : p.interests,
      };
    });
  }, []);

  const requestJoin = useCallback(
    (eventId: string) => {
      const ev = events.find((e) => e.id === eventId);
      const nowIso = new Date().toISOString();
      track('join_requested', { eventId });
      // the host chose to let people with a shared interest straight in
      if (ev && autoAccepts(ev, profile.interests)) {
        setRsvps((prev) => ({ ...prev, [eventId]: makeRsvp(ev, nowIso) }));
        track('join_request_auto_accepted', { eventId });
        return;
      }
      setRsvps((prev) => ({ ...prev, [eventId]: { eventId, status: 'requested', createdAt: nowIso } }));
    },
    [events, profile.interests],
  );

  const toggleLike = useCallback((id: string) => {
    track('event_liked', { eventId: id });
    setLikes((prev) => toggleKey(prev, id));
  }, []);
  const toggleSave = useCallback((id: string) => {
    track('event_saved', { eventId: id });
    setSaved((prev) => toggleKey(prev, id));
  }, []);

  const collectStamp = useCallback((partnerId: string) => {
    setStamps((prev) => {
      if (prev[partnerId]) return prev;
      track('partner_stamp', { partnerId });
      return { ...prev, [partnerId]: new Date().toISOString() };
    });
  }, []);

  const rate = useCallback((eventId: string, stars: number, issues: RatingIssue[], note: string) => {
    const r = makeRating(eventId, stars, issues, note, new Date().toISOString());
    if (!r) return;
    setRatings((prev) => ({ ...prev, [eventId]: r }));
    // the note stays out of analytics: it is for the team and the host only
    track('event_rated', { eventId, stars: r.stars, issues: r.issues, changed: !!ratings[eventId] });
  }, [ratings]);

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
    setRsvps(DEMO_RSVPS);
    setRatings({});
    setDrafts([]);
    setProfile(DEFAULT_PROFILE);
    setUserComments([]);
    setLikes({});
    setSaved({});
    setStamps({});
  }, []);

  // memoised so screens only re-render when something they read actually changed
  const value = useMemo<StoreCtx>(
    () => ({
      events,
      cityEvents,
      hiddenEvents,
      people: SEED_PEOPLE,
      goersOf,
      friendsShown,
      rsvps,
      profile,
      comments,
      addComment,
      join,
      cancel,
      toggleFollow,
      setName,
      setShowGoing,
      setCity,
      toggleInterest,
      toggleHidden,
      requestJoin,
      likes,
      saved,
      toggleLike,
      toggleSave,
      stamps,
      collectStamp,
      submitDraft,
      standings,
      tierOf,
      myDrafts,
      ratings,
      rate,
      resetLocalData,
    }),
    [
      ratings,
      rate,
      goersOf,
      friendsShown,
      setShowGoing,
      standings,
      tierOf,
      myDrafts,
      toggleInterest,
      toggleHidden,
      requestJoin,
      likes,
      saved,
      toggleLike,
      toggleSave,
      stamps,
      collectStamp,
      events,
      cityEvents,
      hiddenEvents,
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

  // Draw nothing until saved data is read (a few ms): drawing defaults first and then the real
  // profile, plans and hidden topics would rearrange the screen right after it appears.
  if (!hydrated) return null;
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): StoreCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore must be used inside <StoreProvider>');
  return v;
}
