// ============================================================
// MathAthlone — Competition Identity Resolver
// lib/identity-resolver.ts
//
// Returns the right identity label for each mathlete based on
// what competition level they're competing at. The higher the
// stage, the more geographic context viewers need.
//
// © Mpingo Systems LLC
// ============================================================

export type CompetitionLevel =
  | 'classroom'
  | 'school'
  | 'district'
  | 'regional'
  | 'state'
  | 'national'
  | 'international';

export interface AthleteProfile {
  id: string;
  display_name: string;
  first_name: string;
  last_name: string;
  grade_level: number | null;           // 3-12
  school_name: string | null;
  school_mascot: string | null;   // "Eagles", "Panthers"
  school_colors: [string, string] | null; // primary, secondary hex
  city: string | null;
  district_name: string | null;   // "CMS District 7"
  state_code: string | null;      // "NC"
  state_name: string | null;      // "North Carolina"
  country_code: string | null;    // "US"
  country_name: string | null;    // "United States"
  country_flag: string | null;    // "🇺🇸"
  avatar_url: string | null;
  division: string;               // "D1", "D2", etc.
}

export interface IdentityTag {
  /** Primary display name */
  display_name: string;

  /** Secondary line (school, location, etc.) */
  subtitle: string | null;

  /** Short version for tight spaces (bracket cards, mobile) */
  compact: string;

  /** Flag emoji if applicable */
  flag: string | null;

  /** School colors for team/school pride theming */
  school_colors: [string, string] | null;

  /** Mascot for broadcast/commentary use */
  mascot: string | null;

  /** Full formal version for certificates/medals */
  formal: string;
}

/**
 * Resolve the identity tag for a mathlete at a given competition level.
 *
 * The principle: at classroom level, everyone knows each other — just a name.
 * As the stage grows, viewers need more context to place the competitor.
 * At nationals, you represent your school and state. At internationals,
 * you represent your country.
 */
export function resolveIdentity(
  athlete: AthleteProfile,
  level: CompetitionLevel
): IdentityTag {
  const { display_name, first_name, last_name } = athlete;
  const lastInitial = `${first_name} ${last_name[0]}.`;

  switch (level) {
    // ── Classroom: everyone knows you ─────────────────────
    case 'classroom':
      return {
        display_name: first_name,
        subtitle: null,
        compact: first_name,
        flag: null,
        school_colors: null,
        mascot: null,
        formal: display_name,
      };

    // ── School: grade differentiates you ──────────────────
    case 'school':
      return {
        display_name: display_name,
        subtitle: athlete.grade_level ? `Grade ${athlete.grade_level}` : null,
        compact: lastInitial,
        flag: null,
        school_colors: athlete.school_colors,
        mascot: athlete.school_mascot,
        formal: `${display_name}${athlete.grade_level ? `, Grade ${athlete.grade_level}` : ''}`,
      };

    // ── District: which school are you from? ──────────────
    case 'district':
      return {
        display_name: display_name,
        subtitle: athlete.school_name,
        compact: `${lastInitial} · ${abbreviateSchool(athlete.school_name)}`,
        flag: null,
        school_colors: athlete.school_colors,
        mascot: athlete.school_mascot,
        formal: `${display_name}, ${athlete.school_name || 'Independent'}`,
      };

    // ── Regional: school + city ───────────────────────────
    case 'regional':
      return {
        display_name: display_name,
        subtitle: joinParts([athlete.school_name, athlete.city]),
        compact: `${lastInitial} · ${abbreviateSchool(athlete.school_name)}`,
        flag: null,
        school_colors: athlete.school_colors,
        mascot: athlete.school_mascot,
        formal: `${display_name}, ${joinParts([athlete.school_name, athlete.city])}`,
      };

    // ── State: school + city (everyone's in the same state) ─
    case 'state':
      return {
        display_name: display_name,
        subtitle: joinParts([athlete.school_name, athlete.city]),
        compact: `${lastInitial} · ${athlete.city || abbreviateSchool(athlete.school_name)}`,
        flag: null,
        school_colors: athlete.school_colors,
        mascot: athlete.school_mascot,
        formal: `${display_name}, ${joinParts([athlete.school_name, athlete.city, athlete.state_code])}`,
      };

    // ── National: school + state — you represent your state ─
    case 'national':
      return {
        display_name: display_name,
        subtitle: joinParts([athlete.school_name, athlete.state_code]),
        compact: `${lastInitial} · ${athlete.state_code || abbreviateSchool(athlete.school_name)}`,
        flag: athlete.country_flag,
        school_colors: athlete.school_colors,
        mascot: athlete.school_mascot,
        formal: `${display_name}, ${joinParts([athlete.school_name, athlete.city, athlete.state_name])}`,
      };

    // ── International: school + country — you represent your nation ─
    case 'international':
      return {
        display_name: display_name,
        subtitle: joinParts([athlete.school_name, athlete.country_name]),
        compact: `${lastInitial} · ${athlete.country_code || ''}`,
        flag: athlete.country_flag,
        school_colors: athlete.school_colors,
        mascot: athlete.school_mascot,
        formal: `${display_name}, ${joinParts([athlete.school_name, athlete.city, athlete.country_name])}`,
      };
  }
}

// ────────────────────────────────────────────────────────────
// BROADCAST / COMMENTARY HELPERS
// ────────────────────────────────────────────────────────────

/**
 * Generate the announcer-style introduction.
 * "From Lincoln Middle School in Charlotte, North Carolina... Amara Osei!"
 */
export function announcerIntro(
  athlete: AthleteProfile,
  level: CompetitionLevel
): string {
  switch (level) {
    case 'classroom':
    case 'school':
      return `${athlete.display_name}!`;

    case 'district':
      return `From ${athlete.school_name || 'Independent'}... ${athlete.display_name}!`;

    case 'regional':
      return `From ${joinParts([athlete.school_name, athlete.city])}... ${athlete.display_name}!`;

    case 'state':
      return `From ${joinParts([athlete.school_name, `in ${athlete.city}`])}... ${athlete.display_name}!`;

    case 'national':
      return `Representing ${athlete.state_name || athlete.state_code}! From ${joinParts([athlete.school_name, `in ${athlete.city}`])}... ${athlete.display_name}!`;

    case 'international':
      return `Representing ${athlete.country_name}! ${athlete.country_flag || ''} From ${joinParts([athlete.school_name, `in ${athlete.city}`])}... ${athlete.display_name}!`;
  }
}

/**
 * Generate the bracket card display for a specific level.
 * Returns { line1, line2 } for the two-line bracket slot layout.
 */
export function bracketCardLines(
  athlete: AthleteProfile,
  level: CompetitionLevel
): { line1: string; line2: string | null } {
  const tag = resolveIdentity(athlete, level);
  return {
    line1: tag.display_name,
    line2: tag.subtitle,
  };
}

/**
 * Generate certificate/medal inscription text.
 */
export function certificateText(
  athlete: AthleteProfile,
  level: CompetitionLevel,
  placement: number,
  eventName: string
): string {
  const tag = resolveIdentity(athlete, level);
  const placeLabel = placementLabel(placement);
  return `${placeLabel} Place — ${eventName}\nAwarded to ${tag.formal}\nDivision: ${athlete.division}`;
}

// ────────────────────────────────────────────────────────────
// UTILITIES
// ────────────────────────────────────────────────────────────

function joinParts(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(', ');
}

function abbreviateSchool(name: string | null): string {
  if (!name) return '—';
  // "Lincoln Middle School" → "Lincoln MS"
  return name
    .replace(/Middle School/i, 'MS')
    .replace(/High School/i, 'HS')
    .replace(/Elementary School/i, 'ES')
    .replace(/Preparatory/i, 'Prep')
    .replace(/Academy/i, 'Acad.');
}

function placementLabel(n: number): string {
  if (n === 1) return '1st';
  if (n === 2) return '2nd';
  if (n === 3) return '3rd';
  return `${n}th`;
}

// ────────────────────────────────────────────────────────────
// DATABASE COLUMNS NEEDED (reference for SQL migration)
// ────────────────────────────────────────────────────────────
//
// These fields should exist on the `users` table (or a joined
// `athlete_profiles` table):
//
//   grade           SMALLINT        -- 3-12
//   school_id       UUID FK         -- links to schools table
//
// The `schools` table should have:
//
//   name            TEXT            -- "Lincoln Middle School"
//   mascot          TEXT            -- "Eagles"
//   primary_color   TEXT            -- "#1e40af"
//   secondary_color TEXT            -- "#fbbf24"
//   city            TEXT            -- "Charlotte"
//   district_name   TEXT            -- "CMS District 7"
//   state_code      CHAR(2)        -- "NC"
//   state_name      TEXT            -- "North Carolina"
//   country_code    CHAR(2)        -- "US"
//   country_name    TEXT            -- "United States"
//   country_flag    TEXT            -- "🇺🇸"
//
// ────────────────────────────────────────────────────────────

export default {
  resolveIdentity,
  announcerIntro,
  bracketCardLines,
  certificateText,
};
