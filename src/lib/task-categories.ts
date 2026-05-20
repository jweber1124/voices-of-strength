export type SubTask = {
  id: string;
  title: string;
};

export type TaskCategory = {
  id: string;
  name: string;
  // When false, the category is Manager reference only — no volunteer
  // assignment UI. Today only "Run-of-show" has this set to false.
  acceptsAssignments: boolean;
  subTasks: SubTask[];
};

// Static config. The category ids align with the Helper-side categories in
// categories.ts where they overlap (set-up, welcome-table, food-drink, clean-up).
// Sub-task ids are stable database keys; don't rename them after launch.
export const TASK_CATEGORIES: readonly TaskCategory[] = [
  {
    id: 'run-of-show',
    name: 'Run-of-show',
    acceptsAssignments: false,
    subTasks: [
      { id: 'run-of-show.headliner', title: 'Touch base with headliner manager' },
      { id: 'run-of-show.performer', title: 'Touch base with performer manager' },
      { id: 'run-of-show.flashlight', title: 'Use flashlight to indicate to MC transitions' },
      { id: 'run-of-show.rearrange', title: 'Rearrange stage and equipment during food and drink period to switch to open mic phase' },
    ],
  },
  {
    id: 'set-up',
    name: 'Set-up',
    acceptsAssignments: true,
    subTasks: [
      { id: 'set-up.tables-chairs', title: 'Arrange tables and chairs' },
      { id: 'set-up.stage-headliner', title: 'Set up stage for headliner phase' },
      { id: 'set-up.neon-sign', title: 'Hang neon "Voices of Strength" sign' },
      { id: 'set-up.decorate', title: 'Decorate main room' },
      { id: 'set-up.dividers', title: 'Set up dividers' },
      { id: 'set-up.curtains', title: 'Hang entry hallway curtains' },
      { id: 'set-up.sound', title: 'Set up and test sound equipment' },
      { id: 'set-up.emergency-light', title: 'Cover emergency light' },
    ],
  },
  {
    id: 'welcome-table',
    name: 'Welcome table & usher',
    acceptsAssignments: true,
    subTasks: [
      { id: 'welcome-table.qr-codes', title: 'Printed QR codes in plastic stands for Eventbrite and donation links' },
      { id: 'welcome-table.tablet', title: 'Tablet with Eventbrite pulled up' },
      { id: 'welcome-table.performer-signup', title: 'Printed on-site performer sign-up sheet' },
      { id: 'welcome-table.fd-tickets', title: 'Food and drink tickets' },
      { id: 'welcome-table.attendee-list', title: 'Printed Eventbrite attendee list' },
      { id: 'welcome-table.media-release', title: 'Printed media release forms' },
      { id: 'welcome-table.brief-volunteers', title: 'Walk welcome table volunteers through all forms and processes' },
      { id: 'welcome-table.greeter', title: 'Assign volunteer to stand at the threshold into main room to greet attendees and direct them to seats' },
    ],
  },
  {
    id: 'food-drink',
    name: 'Food & drink',
    acceptsAssignments: true,
    subTasks: [
      { id: 'food-drink.check-in', title: 'Check in with food and drink manager (William Parsley)' },
      { id: 'food-drink.set-up-table', title: 'Set up table in lobby for food and drink distribution during intermission' },
      { id: 'food-drink.confirm-limits', title: 'Confirm food and drink limits for attendees per ticket' },
      { id: 'food-drink.brief-volunteers', title: 'Brief food and drink volunteer(s) on limits, food and drink service time, and clean up' },
    ],
  },
  {
    id: 'clean-up',
    name: 'Clean-up',
    acceptsAssignments: true,
    subTasks: [
      { id: 'clean-up.decorations', title: 'Pack up and store all decorations' },
      { id: 'clean-up.sound', title: 'Break down and store sound equipment' },
      { id: 'clean-up.stage', title: 'Break down stage setup' },
      { id: 'clean-up.tables-chairs', title: 'Return tables and chairs to normal places' },
      { id: 'clean-up.dividers', title: 'Collapse and store dividers' },
      { id: 'clean-up.curtains', title: 'Take down and store hallway curtains' },
      { id: 'clean-up.emergency-light', title: 'Take down and store emergency light cover' },
      { id: 'clean-up.front-desk', title: 'Store front desk documents, tablet, and flyers' },
    ],
  },
];
