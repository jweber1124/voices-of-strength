// Event details for the current Open Mic. Hardcoded for now; move to the
// events table when we want a Manager UI to edit these.

type Contact = {
  role: string;
  name: string;
  email: string;
  phone: string;
};

export type EventDetails = {
  date: string;
  headliner: string;
  location: { name: string; address: string };
  times: {
    setUpStart: string;
    headliner: string;
    openMic: string;
    cleanUpEnd: string;
  };
  urls: { eventbrite: string; performerSignup: string };
  contacts: Contact[];
  ccEmails: string[];
};

export const EVENT_DETAILS: EventDetails = {
  date: 'Saturday, May 30, 2026',
  headliner: 'Solis Rough',
  location: {
    name: 'Communities for Recovery',
    address: '4110 Guadalupe St. Bldg. 635, Austin, TX 78751',
  },
  times: {
    setUpStart: '4:00 PM',
    headliner: '6:00 – 7:00 PM',
    openMic: '7:00 – 8:30 PM',
    cleanUpEnd: '9:30 PM',
  },
  urls: {
    eventbrite:
      'https://www.eventbrite.com/e/voices-of-strength-open-mic-tickets-1989189801243?aff=oddtdtcreator',
    performerSignup: 'https://forms.office.com/r/2tqn7jqjww',
  },
  contacts: [
    {
      role: 'Volunteer Event-Day Manager',
      name: 'Jordyn Benson',
      email: 'jbenson@driftwoodrecovery.com',
      phone: '(254) 681-7529',
    },
    {
      role: 'Volunteer Event Coordinator',
      name: 'Jake Weber',
      email: 'jaw1124@gmail.com',
      phone: '(858) 444-5589',
    },
    {
      role: 'Communities for Recovery Center & Volunteer Services Manager',
      name: 'Arza Demi',
      email: 'arza.demi@cforr.org',
      phone: '(512) 952-0755',
    },
  ],
  ccEmails: [
    'jaw1124@gmail.com',
    'jbenson@driftwoodrecovery.com',
    'arza.demi@cforr.org',
  ],
};
