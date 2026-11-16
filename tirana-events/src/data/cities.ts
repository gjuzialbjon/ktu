import type { Lang } from '@/lib/i18n';

/**
 * The cities the app covers. Adding one = adding an entry here (plus events);
 * the feed, filters, map, create form and city picker all read from this list.
 */
export type CityId = 'tirana' | 'durres' | 'vlore' | 'shkoder' | 'korce' | 'sarande' | 'berat' | 'gjirokaster';

/** A neighbourhood/area id, unique within its city (e.g. 'qendra' exists in several). */
export type AreaId = string;

export interface Area {
  id: AreaId;
  sq: string;
  en: string;
}

export interface MapBounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

export interface City {
  id: CityId;
  /** sq uses the definite form people say ("Durrësi", "Vlora"), en the map name */
  name: Record<Lang, string>;
  areas: Area[];
  /** the slice of the real map the stylized map covers */
  bounds: MapBounds;
  /** big water for the generic drawn map: which edge it sits on */
  water?: { kind: 'sea' | 'lake'; side: 'west' | 'south' | 'southwest' };
}

const CENTRE: Area = { id: 'qendra', sq: 'Qendra', en: 'Centre' };

/** Bounds of ~0.04° lat by ~0.06° lng around a centre: a walkable city core. */
const around = (lat: number, lng: number, dLat = 0.022, dLng = 0.032): MapBounds => ({
  latMin: lat - dLat,
  latMax: lat + dLat,
  lngMin: lng - dLng,
  lngMax: lng + dLng,
});

export const CITIES: Record<CityId, City> = {
  tirana: {
    id: 'tirana',
    name: { sq: 'Tirana', en: 'Tirana' },
    areas: [
      CENTRE,
      { id: 'blloku', sq: 'Blloku', en: 'Blloku' },
      { id: 'liqeni', sq: 'Liqeni & Parku', en: 'Lake and park' },
      { id: 'pazari', sq: 'Pazari i Ri', en: 'New Bazaar' },
      { id: 'periferia', sq: 'Jashte qendres', en: 'Outside the centre' },
    ],
    bounds: { latMin: 41.3, latMax: 41.345, lngMin: 19.77, lngMax: 19.875 },
  },
  durres: {
    id: 'durres',
    name: { sq: 'Durrësi', en: 'Durrës' },
    areas: [
      CENTRE,
      { id: 'plazhi', sq: 'Plazhi', en: 'The beach' },
      { id: 'currila', sq: 'Currilat', en: 'Currila' },
      { id: 'golemi', sq: 'Golemi', en: 'Golem' },
    ],
    bounds: around(41.315, 19.47, 0.03, 0.05),
    water: { kind: 'sea', side: 'southwest' },
  },
  vlore: {
    id: 'vlore',
    name: { sq: 'Vlora', en: 'Vlorë' },
    areas: [
      CENTRE,
      { id: 'lungomare', sq: 'Lungomare', en: 'Lungomare' },
      { id: 'skela', sq: 'Skela', en: 'Skela' },
      { id: 'radhima', sq: 'Radhima', en: 'Radhimë' },
    ],
    bounds: around(40.455, 19.485, 0.03, 0.045),
    water: { kind: 'sea', side: 'west' },
  },
  shkoder: {
    id: 'shkoder',
    name: { sq: 'Shkodra', en: 'Shkodër' },
    areas: [
      CENTRE,
      { id: 'pedonalja', sq: 'Pedonalja', en: 'Pedestrian street' },
      { id: 'rozafa', sq: 'Rozafa', en: 'Rozafa' },
      { id: 'liqeni', sq: 'Liqeni', en: 'The lake' },
    ],
    bounds: around(42.065, 19.505),
    water: { kind: 'lake', side: 'west' },
  },
  korce: {
    id: 'korce',
    name: { sq: 'Korça', en: 'Korçë' },
    areas: [
      CENTRE,
      { id: 'pazari', sq: 'Pazari i Vjeter', en: 'Old Bazaar' },
      { id: 'parku', sq: 'Parku Rinia', en: 'Rinia park' },
      { id: 'dardha', sq: 'Dardha', en: 'Dardhë' },
    ],
    bounds: around(40.615, 20.78),
  },
  sarande: {
    id: 'sarande',
    name: { sq: 'Saranda', en: 'Sarandë' },
    areas: [
      CENTRE,
      { id: 'shetitorja', sq: 'Shetitorja', en: 'Promenade' },
      { id: 'ksamil', sq: 'Ksamili', en: 'Ksamil' },
      { id: 'butrinti', sq: 'Butrinti', en: 'Butrint' },
    ],
    bounds: around(39.87, 20.01),
    water: { kind: 'sea', side: 'south' },
  },
  berat: {
    id: 'berat',
    name: { sq: 'Berati', en: 'Berat' },
    areas: [
      CENTRE,
      { id: 'mangalemi', sq: 'Mangalemi', en: 'Mangalem' },
      { id: 'gorica', sq: 'Gorica', en: 'Gorica' },
      { id: 'kalaja', sq: 'Kalaja', en: 'The castle' },
    ],
    bounds: around(40.705, 19.952, 0.015, 0.022),
  },
  gjirokaster: {
    id: 'gjirokaster',
    name: { sq: 'Gjirokastra', en: 'Gjirokastër' },
    areas: [
      CENTRE,
      { id: 'pazari', sq: 'Pazari', en: 'Old Bazaar' },
      { id: 'kalaja', sq: 'Kalaja', en: 'The castle' },
    ],
    bounds: around(40.075, 20.138, 0.015, 0.022),
  },
};

/** Order in pickers: the capital, then roughly by size. */
export const CITY_ORDER: CityId[] = ['tirana', 'durres', 'vlore', 'shkoder', 'korce', 'sarande', 'berat', 'gjirokaster'];

export const DEFAULT_CITY: CityId = 'tirana';

/**
 * Cities people can see right now. The others stay fully defined above (areas, map,
 * seed events, partners) and are ready to switch on: add the id here and the city
 * picker on home, the profile setting and the create form's city row reappear by
 * themselves (they only show when more than one city is live).
 *
 * Tirana only for now: the board asked to own one city before spreading (founder/board.md, round 5).
 */
export const LIVE_CITIES: CityId[] = ['tirana'];
export const isLiveCity = (x: unknown): x is CityId => typeof x === 'string' && (LIVE_CITIES as string[]).includes(x);
/** Whether there is a city choice to show at all. */
export const CAN_PICK_CITY = LIVE_CITIES.length > 1;

export const isCityId = (x: unknown): x is CityId => typeof x === 'string' && x in CITIES;

export const cityName = (id: CityId, lang: Lang): string => CITIES[id].name[lang];

/** Falls back to the raw id so a stale or unknown area still shows something readable. */
export function areaName(city: CityId, area: AreaId, lang: Lang): string {
  return CITIES[city].areas.find((a) => a.id === area)?.[lang] ?? area;
}
