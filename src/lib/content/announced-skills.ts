// Student-facing announced skills are manually curated curriculum metadata.
// This helper intentionally makes no inference from internal concept names.
export function hasCuratedAnnouncedSkill(announcedSkill: string | null | undefined): boolean {
  return typeof announcedSkill === 'string' && announcedSkill.trim().length > 0;
}
