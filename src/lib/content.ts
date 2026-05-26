import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const CONTENT_DIR = path.join(process.cwd(), 'content');

function readDir(folder: string) {
  const dir = path.join(CONTENT_DIR, folder);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter(f => f.endsWith('.md'));
}

function readFile(folder: string, filename: string): unknown {
  const full = path.join(CONTENT_DIR, folder, filename);
  if (!fs.existsSync(full)) return null;
  const raw = fs.readFileSync(full, 'utf-8');
  const { data, content } = matter(raw);
  const slug = filename.replace(/\.md$/, '');
  return { slug, ...data, body: content };
}

function readSingleton<T>(filename: string, fallback: T): T {
  const file = readFile('pages', filename);
  return file ? (file as T) : fallback;
}

function versionedPublicAsset(assetPath: string): string {
  if (!assetPath.startsWith('/') || assetPath.includes('?')) return assetPath;

  const publicFile = path.join(process.cwd(), 'public', assetPath);
  if (!fs.existsSync(publicFile)) return assetPath;

  const version = Math.floor(fs.statSync(publicFile).mtimeMs);
  return `${assetPath}?v=${version}`;
}

export interface LinkItem {
  label: string;
  href: string;
}

export interface SiteSettings {
  logo: string;
  footerDescription: string;
  contactEmail: string;
  websiteUrl: string;
  ctaLabel: string;
  ctaHref: string;
  navLinks: LinkItem[];
  socialLinks: LinkItem[];
  footerColumns: Array<{ title: string; links: LinkItem[] }>;
}

export interface HomeContent {
  heroTitleLine1: string;
  heroTitleLine2: string;
  heroTitleLine3: string;
  heroEmphasis: string;
  heroDescription: string;
  heroPrimaryLabel: string;
  heroPrimaryHref: string;
  heroSecondaryLabel: string;
  heroSecondaryHref: string;
  heroStats: Array<{ value: string; suffix?: string; label: string }>;
  chapters: string[];
  aboutTag: string;
  aboutTitle: string;
  aboutTitleEmphasis: string;
  aboutParagraphs: string[];
  founderQuote: string;
  founderCredit: string;
  aboutCtaLabel: string;
  aboutCtaHref: string;
  emergencyTitle: string;
  emergencyDescription: string;
  emergencyCtaLabel: string;
  emergencyCtaHref: string;
  meetupsTag: string;
  meetupsTitle: string;
  meetupsTitleEmphasis: string;
  pastMeetupsTag: string;
  pastMeetupsTitle: string;
  pastMeetupsTitleEmphasis: string;
  workshopsTag: string;
  workshopsTitle: string;
  workshopsTitleEmphasis: string;
  valuesTag: string;
  valuesTitle: string;
  valuesTitleEmphasis: string;
  values: Array<{ number: string; title: string; emphasis?: string; description: string }>;
  joinTag: string;
  joinTitle: string;
  joinTitleEmphasis: string;
  joinDescription: string;
  joinPrimaryLabel: string;
  joinPrimaryHref: string;
  joinSecondaryLabel: string;
  joinSecondaryHref: string;
}

export interface ResourcePageContent {
  heroTag: string;
  heroTitle: string;
  heroTitleEmphasis: string;
  heroDescription: string;
  categories: Array<{
    id: string;
    icon: string;
    title: string;
    items: Array<{ title: string; desc: string }>;
  }>;
  emergencyText: string;
  emergencyCtaLabel: string;
  emergencyCtaHref: string;
}

export interface EmergencyPageContent {
  heroTag: string;
  heroTitle: string;
  heroTitleEmphasis: string;
  heroDescription: string;
  emergencyEmail: string;
  urgentTitle: string;
  urgentDescription: string;
  hotlines: Array<{ name: string; number: string; note: string; href: string }>;
  sections: Array<{
    cat: string;
    items: Array<{ title: string; desc: string; links?: LinkItem[] }>;
  }>;
  reachTitle: string;
  reachTitleEmphasis: string;
  reachDescription: string;
}

export interface AboutPageContent {
  heroTag: string;
  heroTitle: string;
  heroTitleEmphasis: string;
  heroDescription: string;
  storyTag: string;
  storyTitle: string;
  storyTitleEmphasis: string;
  storyParagraphs: string[];
  founderTag: string;
  founderQuote: string;
  founderCredit: string;
  missionTitle: string;
  missionDescription: string;
  visionTitle: string;
  visionDescription: string;
  cultureTag: string;
  cultureTitle: string;
  cultureTitleEmphasis: string;
  cultureDescription: string;
  cultureCards: Array<{ icon: string; title: string; desc: string }>;
  valuesTag: string;
  valuesTitle: string;
  valuesTitleEmphasis: string;
  values: Array<{ number: string; title: string; description: string }>;
  stats: Array<{ n: string; l: string }>;
  ctaTitle: string;
  ctaTitleEmphasis: string;
  ctaPrimaryLabel: string;
  ctaPrimaryHref: string;
  ctaSecondaryLabel: string;
  ctaSecondaryHref: string;
}

export interface JoinPageContent {
  heroTag: string;
  heroTitle: string;
  heroTitleEmphasis: string;
  heroDescription: string;
  paths: Array<{
    tag: string;
    title: string;
    desc: string;
    perks: string[];
    url: string;
    cta: string;
    accent: string;
  }>;
  processTag: string;
  processTitle: string;
  processTitleEmphasis: string;
  steps: Array<{ n: string; title: string; desc: string }>;
  questionsText: string;
  questionsCtaLabel: string;
  questionsCtaHref: string;
}

export interface ContactPageContent {
  heroTag: string;
  heroTitle: string;
  heroTitleEmphasis: string;
  heroDescription: string;
  infoTag: string;
  infoTitle: string;
  infoTitleEmphasis: string;
  contacts: Array<{ icon: string; label: string; href: string; text: string }>;
  socials: LinkItem[];
  successTitle: string;
  successDescription: string;
  submitLabel: string;
}

export function getSiteSettings(): SiteSettings {
  const settings = readSingleton<SiteSettings>('site.md', {
    logo: '/images/logos/upsa-logo.png',
    footerDescription: 'United Pakistani Students & Alumni Association.',
    contactEmail: 'info@unitedpsa.org',
    websiteUrl: 'https://unitedpsa.org',
    ctaLabel: 'Join the Network',
    ctaHref: '/join',
    navLinks: [],
    socialLinks: [],
    footerColumns: [],
  });

  return {
    ...settings,
    logo: versionedPublicAsset(settings.logo),
  };
}

export function getHomeContent(): HomeContent {
  return readSingleton<HomeContent>('home.md', {} as HomeContent);
}

export function getResourcePageContent(): ResourcePageContent {
  return readSingleton<ResourcePageContent>('resources.md', {} as ResourcePageContent);
}

export function getEmergencyPageContent(): EmergencyPageContent {
  return readSingleton<EmergencyPageContent>('emergency.md', {} as EmergencyPageContent);
}

export function getAboutPageContent(): AboutPageContent {
  return readSingleton<AboutPageContent>('about.md', {} as AboutPageContent);
}

export function getJoinPageContent(): JoinPageContent {
  return readSingleton<JoinPageContent>('join.md', {} as JoinPageContent);
}

export function getContactPageContent(): ContactPageContent {
  return readSingleton<ContactPageContent>('contact.md', {} as ContactPageContent);
}

// ---- Events ----

export interface Event {
  slug: string;
  title: string;
  date: string;
  endDate?: string;
  location: string;
  state?: string;
  category: string;
  description: string;
  image?: string;
  registerUrl?: string;
  status: 'upcoming' | 'past';
  featured?: boolean;
  body: string;
}

export function getEvents(): Event[] {
  return readDir('events')
    .map(f => readFile('events', f) as unknown as Event)
    .filter(Boolean)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getEvent(slug: string): Event | null {
  const f = readFile('events', `${slug}.md`);
  return f ? (f as unknown as Event) : null;
}

// ---- Workshops ----

export interface Workshop {
  slug: string;
  title: string;
  date: string;
  location: string;
  host: string;
  type: string;
  description: string;
  image?: string;
  registerUrl?: string;
  seats?: number;
  status: 'upcoming' | 'past';
  featured?: boolean;
  displayOnHomepage?: boolean;
  homepageOrder?: number;
  body: string;
}

export function getWorkshops(): Workshop[] {
  return readDir('workshops')
    .map(f => readFile('workshops', f) as unknown as Workshop)
    .filter(Boolean)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getWorkshop(slug: string): Workshop | null {
  const f = readFile('workshops', `${slug}.md`);
  return f ? (f as unknown as Workshop) : null;
}

// ---- Meetups ----

export interface Meetup {
  slug: string;
  title: string;
  city: string;
  state: string;
  stateCode: string;
  date: string;
  status?: 'upcoming' | 'past';
  coverImage: string;
  homepageImage?: string;
  registerUrl?: string;
  displayOnHomepage?: boolean;
  homepageOrder?: number;
  photos: string[];
  description: string;
  attendees?: number;
  body: string;
}

export function getMeetups(): Meetup[] {
  return readDir('meetups')
    .map(f => readFile('meetups', f) as unknown as Meetup)
    .filter(Boolean)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getMeetup(slug: string): Meetup | null {
  const f = readFile('meetups', `${slug}.md`);
  return f ? (f as unknown as Meetup) : null;
}

export function getMeetupsByState(): Record<string, Meetup[]> {
  const all = getMeetups();
  return all.reduce<Record<string, Meetup[]>>((acc, m) => {
    const s = m.state || 'Other';
    if (!acc[s]) acc[s] = [];
    acc[s].push(m);
    return acc;
  }, {});
}

// ---- Team ----

export interface TeamMember {
  slug: string;
  name: string;
  role: string;
  bio?: string;
  photo?: string;
  linkedin?: string;
  email?: string;
  order?: number;
  body: string;
}

export function getTeam(): TeamMember[] {
  return readDir('team')
    .map(f => readFile('team', f) as unknown as TeamMember)
    .filter(Boolean)
    .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
}

// ---- Chapters ----

export interface Chapter {
  slug: string;
  university: string;
  city: string;
  state: string;
  stateCode: string;
  logo?: string;
  instagram?: string;
  email?: string;
  founded?: string;
  memberCount?: number;
  body: string;
}

export function getChapters(): Chapter[] {
  return readDir('chapters')
    .map(f => readFile('chapters', f) as unknown as Chapter)
    .filter(Boolean)
    .sort((a, b) => a.university.localeCompare(b.university));
}

function parseContentDate(value: unknown): Date | null {
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value;
  if (typeof value !== 'string') return null;

  const trimmed = value.trim();
  if (!trimmed) return null;

  const dateOnly = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const normalized = dateOnly ? `${dateOnly[1]}-${dateOnly[2]}-${dateOnly[3]}T12:00:00` : trimmed;
  const parsed = new Date(normalized);

  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function formatDate(iso: string): string {
  const d = parseContentDate(iso);
  if (!d) return 'Date TBD';

  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}

export function formatDateWithWeekday(iso: string): string {
  const d = parseContentDate(iso);
  if (!d) return 'Date TBD';

  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

export function isUpcoming(iso: string): boolean {
  const d = parseContentDate(iso);
  return d ? d > new Date() : false;
}
