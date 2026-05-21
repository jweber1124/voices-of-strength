// Logic for whether a Manager-made assignment matches the Helper's stated
// preferences. A volunteer "needs confirmation" if they're assigned to a role
// they didn't explicitly opt into AND General event support doesn't cover it.

const EXPLICIT_ONLY_CATEGORIES = new Set(['set-up', 'clean-up']);

export function needsConfirmation(
  categoryId: string,
  volunteerCategories: readonly string[],
): boolean {
  // Explicitly preferred for this role → no confirmation needed.
  if (volunteerCategories.includes(categoryId)) return false;

  // Set-up and Clean-up always require explicit availability (they fall outside
  // the event runtime, so general flexibility doesn't cover them).
  if (EXPLICIT_ONLY_CATEGORIES.has(categoryId)) return true;

  // General event support covers other in-event roles.
  if (volunteerCategories.includes('general')) return false;

  return true;
}
