import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Comment, EventItem, Profile, PublicUser, Rsvp } from './types';
import { SEED_COMMENTS, SEED_EVENTS, SEED_PEOPLE } from './seed';
import { track } from './analytics';

/**
 * Local-first store. This is the single boundary to swap for Supabase later:
 * keep the same method names, replace AsyncStorage with postgrest calls.
 */

interface StoreCtx {
  events: EventItem[];
  people: PublicUser[];
  rsvps: Record<string, Rsvp>;
  profile: Profile;
  comments: Comment[];
  addComment: (eventId: string, text: string) => void;
  join: (eventId: string) => void;
  cancel: (eventId: string) => void;
  toggleFollow: (userId: string) => void;
  setName: (name: string) => void;
  submitDraft: (
    e: Pick<EventItem, 'title' | 'description' | 'venueName' | 'tags' | 'startsAt' | 'neighborhood'> & {
      ticketPriceLek?: number;
      /** data-URL or file URI from the image picker; falls back to a placeholder */
      coverImage?: string;
    },
  ) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

const newCode = () =>
  'TE-' + Math.random().toString(36).slice(2, 6).toUpperCase();

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [rsvps, setRsvps] = useState<Record<string, Rsvp>>({});
  const [drafts, setDrafts] = useState<EventItem[]>([]);
  const [profile, setProfile] = useState<Profile>({ name: '', follows: ['u2', 'u3'] });
  const [userComments, setUserComments] = useState<Comment[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [r, p, d, c] = await Promise.all([
          AsyncStorage.getItem('rsvps'),
          AsyncStorage.getItem('profile'),
          AsyncStorage.getItem('drafts'),
          AsyncStorage.getItem('comments'),
        ]);
        if (r) setRsvps(JSON.parse(r));
        if (p) setProfile(JSON.parse(p));
        if (d) {
          const parsed = JSON.parse(d) as EventItem[];
          // drafts saved before neighbourhoods existed
          setDrafts(parsed.map((x) => ({ ...x, neighborhood: x.neighborhood ?? 'qendra' })));
        }
        if (c) setUserComments(JSON.parse(c));
      } catch {
        // first run / storage unavailable: keep defaults
      } finally {
        setHydrated(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem('comments', JSON.stringify(userComments)).catch(() => {});
  }, [userComments, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem('rsvps', JSON.stringify(rsvps)).catch(() => {});
  }, [rsvps, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem('profile', JSON.stringify(profile)).catch(() => {});
  }, [profile, hydrated]);
  useEffect(() => {
    if (!hydrated) return;
    AsyncStorage.setItem('drafts', JSON.stringify(drafts)).catch(() => {});
  }, [drafts, hydrated]);

  const events = useMemo(() => {
    const all = [...SEED_EVENTS, ...drafts].filter((e) => e.status === 'published');
    // Sponsored (max 2) pinned on top, then by start time.
    const sponsored = all.filter((e) => e.isSponsored).slice(0, 2);
    const rest = all
      .filter((e) => !sponsored.includes(e))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    return [...sponsored, ...rest];
  }, [drafts]);

  const join = (eventId: string) => {
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;
    const ticketed = ev.priceType === 'ticketed';
    setRsvps((prev) => ({
      ...prev,
      [eventId]: {
        eventId,
        status: ticketed ? 'reserved' : 'going',
        reservationCode: ticketed ? newCode() : undefined,
        createdAt: new Date().toISOString(),
      },
    }));
    track('rsvp_created', { eventId, ticketed, tags: ev.tags });
  };

  const cancel = (eventId: string) => {
    setRsvps((prev) => {
      const next = { ...prev };
      delete next[eventId];
      return next;
    });
    track('rsvp_cancelled', { eventId });
  };

  const toggleFollow = (userId: string) =>
    setProfile((p) => ({
      ...p,
      follows: p.follows.includes(userId)
        ? p.follows.filter((f) => f !== userId)
        : [...p.follows, userId],
    }));

  const setName = (name: string) => setProfile((p) => ({ ...p, name }));

  const comments = useMemo(
    () =>
      [...SEED_COMMENTS, ...userComments].sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [userComments],
  );

  const addComment = (eventId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setUserComments((c) => [
      ...c,
      {
        id: 'uc' + Date.now(),
        eventId,
        author: profile.name.trim() || 'Ti',
        text: trimmed,
        isOrganizer: false,
        createdAt: new Date().toISOString(),
      },
    ]);
    track('comment_created', { eventId });
  };

  const submitDraft: StoreCtx['submitDraft'] = (e) => {
    const draft: EventItem = {
      id: 'd' + Date.now(),
      title: e.title,
      description: e.description,
      category: 'community',
      tags: e.tags,
      venueName: e.venueName,
      address: e.venueName,
      neighborhood: e.neighborhood,
      startsAt: e.startsAt,
      coverImage: e.coverImage ?? `https://picsum.photos/seed/${encodeURIComponent(e.title)}/900/560`,
      priceType: e.ticketPriceLek ? 'ticketed' : 'free',
      ticketPriceLek: e.ticketPriceLek,
      source: 'organizer',
      status: 'draft', // curator approves before publishing
      isSponsored: false,
      organizer: { id: 'me', name: 'Ti', verified: false },
      goingUserIds: [],
    };
    setDrafts((d) => [...d, draft]);
    track('event_draft_submitted', { tags: e.tags });
  };

  return (
    <Ctx.Provider
      value={{ events, people: SEED_PEOPLE, rsvps, profile, comments, addComment, join, cancel, toggleFollow, setName, submitDraft }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useStore(): StoreCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useStore outside provider');
  return v;
}
