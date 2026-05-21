export type Category = {
  id: string;
  name: string;
  description: string;
};

// The id is what's stored in the database (volunteers.categories[]). Don't rename
// ids after launch unless you also migrate existing rows. The name and description
// are display-only and safe to edit anytime.
export const CATEGORIES: readonly Category[] = [
  {
    id: 'general',
    name: 'General event support',
    description:
      "General availability during part or all of the event to assist with anything and everything.",
  },
  {
    id: 'set-up',
    name: 'Set-up',
    description:
      'Help set up tables, chairs, dividers, performer area, sound equipment, decorations, and other fixtures.',
  },
  {
    id: 'welcome-table',
    name: 'Welcome table & usher',
    description:
      'Greet attendees, check in performers, distribute food/drink tickets, and facilitate impromptu sign-ups. Ushers also help direct attendees to open seats.',
  },
  {
    id: 'food-drink',
    name: 'Food & drink',
    description:
      'Collect tickets and hand out food and drinks to event attendees during the intermission.',
  },
  {
    id: 'clean-up',
    name: 'Clean-up',
    description:
      'Help clean up after the event and break down and store equipment and decorations.',
  },
];
