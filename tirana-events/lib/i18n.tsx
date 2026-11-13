import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Lang = 'sq' | 'en';

const dict = {
  sq: {
    feed_title: 'Java në Tiranë',
    feed_subtitle: (n: number) => `${n} evente këtë javë`,
    all: 'Të gjitha',
    free: 'Falas',
    ticketed: 'Me biletë',
    sponsored: 'Sponsorizuar',
    going_count: (n: number) => `${n} vetë po vijnë`,
    im_going: 'Po vij',
    reserve: 'Rezervo — paguaj cash te dera',
    cancel_rsvp: 'Anulo pjesëmarrjen',
    youre_going: 'Je i regjistruar ✓',
    reserved_code: 'Kodi i rezervimit',
    pay_at_door: (p: number) => `Paguaj ${p} Lekë cash te dera. Trego këtë kod.`,
    share: 'Ndaje me shokët',
    share_msg: (title: string, when: string, venue: string) =>
      `${title}\n${when} · ${venue}\nPo vij unë — hajde edhe ti! `,
    my_events: 'Eventet e mia',
    upcoming: 'Në vijim',
    past: 'Të kaluara',
    no_events: 'Asnjë event ende — gjej diçka në fletën kryesore.',
    profile: 'Profili',
    language: 'Gjuha',
    your_name: 'Emri yt',
    people_you_know: 'Njerëz që ndjek',
    following: 'Po e ndjek',
    follow: 'Ndiq',
    create_event: 'Krijo event',
    create_hint: 'Eventi dërgohet për miratim te kuratori para se të publikohet.',
    ev_title: 'Titulli',
    ev_desc: 'Përshkrimi',
    ev_venue: 'Vendi',
    ev_date: 'Data',
    ev_time: 'Ora',
    ev_tags: 'Etiketa (ndarë me presje, p.sh. yoga, outdoor)',
    ev_price: 'Çmimi në Lekë (bosh = falas)',
    submit: 'Dërgo për miratim',
    submitted: 'U dërgua! Kuratori do ta shikojë së shpejti.',
    when: 'Kur',
    where: 'Ku',
    organizer: 'Organizatori',
    about: 'Rreth eventit',
    friends_going: 'Nga ata që ndjek',
    open_map: 'Hape në hartë',
    today: 'Sot',
    tomorrow: 'Nesër',
    required: 'Plotëso fushat e detyrueshme.',
    capacity_left: (n: number) => `${n} vende të lira`,
    cat_community: 'Komunitet',
    cat_music: 'Muzikë',
    cat_nightlife: 'Jetë nate',
    cat_culture: 'Kulturë',
    cat_sports: 'Sport',
    cat_business: 'Biznes',
    cat_food: 'Ushqim',
    cat_outdoors: 'Natyrë',
    map: 'Harta',
    map_subtitle: 'Trokit një pikë për eventin',
    faq_title: 'Pyetje të shpeshta',
    good_to_know: 'Mirë me ditë',
    comments_title: (n: number) => `Pyetje & komente (${n})`,
    comment_placeholder: 'Bëj një pyetje ose lër një koment…',
    send: 'Dërgo',
    organizer_badge: 'Organizatori',
    popular: '🔥 Popullor',
    stylized_map: 'Hartë e stilizuar e Tiranës — jo në shkallë',
    ev_photo: 'Fotoja e eventit',
    ev_photo_hint: 'Trokit për të zgjedhur një foto',
    ev_photo_remove: 'Hiqe foton',
    err_required: 'Kjo fushë është e detyrueshme',
    err_title_short: 'Titulli duhet të ketë të paktën 5 shkronja',
    err_date_format: 'Format i pavlefshëm — shkruaj p.sh. 25.11 19:00',
    err_date_past: 'Data duhet të jetë në të ardhmen',
    err_price: 'Çmimi duhet të jetë numër pozitiv (ose lëre bosh për falas)',
    err_tags: 'Shto të paktën një etiketë (max 6)',
    fix_errors: 'Korrigjo fushat e shënuara me të kuqe',
  },
  en: {
    feed_title: 'This week in Tirana',
    feed_subtitle: (n: number) => `${n} events this week`,
    all: 'All',
    free: 'Free',
    ticketed: 'Ticketed',
    sponsored: 'Sponsored',
    going_count: (n: number) => `${n} people going`,
    im_going: "I'm going",
    reserve: 'Reserve — pay cash at the door',
    cancel_rsvp: 'Cancel RSVP',
    youre_going: "You're going ✓",
    reserved_code: 'Reservation code',
    pay_at_door: (p: number) => `Pay ${p} Lek cash at the door. Show this code.`,
    share: 'Share with friends',
    share_msg: (title: string, when: string, venue: string) =>
      `${title}\n${when} · ${venue}\nI'm going — join me! `,
    my_events: 'My events',
    upcoming: 'Upcoming',
    past: 'Past',
    no_events: 'Nothing yet — find something on the feed.',
    profile: 'Profile',
    language: 'Language',
    your_name: 'Your name',
    people_you_know: 'People you follow',
    following: 'Following',
    follow: 'Follow',
    create_event: 'Create event',
    create_hint: 'Your event goes to the curator for approval before it is published.',
    ev_title: 'Title',
    ev_desc: 'Description',
    ev_venue: 'Venue',
    ev_date: 'Date',
    ev_time: 'Time',
    ev_tags: 'Tags (comma separated, e.g. yoga, outdoor)',
    ev_price: 'Price in Lek (empty = free)',
    submit: 'Submit for approval',
    submitted: 'Submitted! The curator will review it shortly.',
    when: 'When',
    where: 'Where',
    organizer: 'Organizer',
    about: 'About',
    friends_going: 'People you follow',
    open_map: 'Open in maps',
    today: 'Today',
    tomorrow: 'Tomorrow',
    required: 'Fill the required fields.',
    capacity_left: (n: number) => `${n} spots left`,
    cat_community: 'Community',
    cat_music: 'Music',
    cat_nightlife: 'Nightlife',
    cat_culture: 'Culture',
    cat_sports: 'Sports',
    cat_business: 'Business',
    cat_food: 'Food',
    cat_outdoors: 'Outdoors',
    map: 'Map',
    map_subtitle: 'Tap a pin to open the event',
    faq_title: 'FAQ',
    good_to_know: 'Good to know',
    comments_title: (n: number) => `Questions & comments (${n})`,
    comment_placeholder: 'Ask a question or leave a comment…',
    send: 'Send',
    organizer_badge: 'Organizer',
    popular: '🔥 Popular',
    stylized_map: 'Stylized map of Tirana — not to scale',
    ev_photo: 'Event photo',
    ev_photo_hint: 'Tap to pick a photo',
    ev_photo_remove: 'Remove photo',
    err_required: 'This field is required',
    err_title_short: 'Title must be at least 5 characters',
    err_date_format: 'Invalid format — write e.g. 25.11 19:00',
    err_date_past: 'The date must be in the future',
    err_price: 'Price must be a positive number (or leave empty for free)',
    err_tags: 'Add at least one tag (max 6)',
    fix_errors: 'Fix the fields marked in red',
  },
};

type Dict = (typeof dict)['sq'];

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('sq');

  useEffect(() => {
    AsyncStorage.getItem('lang')
      .then((v) => {
        if (v === 'en' || v === 'sq') setLangState(v);
      })
      .catch(() => {});
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem('lang', l).catch(() => {});
  };

  return <Ctx.Provider value={{ lang, setLang, t: dict[lang] }}>{children}</Ctx.Provider>;
}

export function useI18n(): I18nCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error('useI18n outside provider');
  return v;
}
