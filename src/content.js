// Every piece of text and every photo on the site lives here. Edit this file only.
const img = (id, w) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`

export const couple = {
  one: 'Maaz',
  two: 'Bushra',
  // Local time of the ceremony; the countdown targets this.
  date: '2026-11-20T16:30:00',
  dateLabel: '20th November 2026',
  place: 'Napa Valley, California',
  heroPhoto: img('1583939003579-730e3918a45a', 1400),
}

export const story = {
  photo: img('1465495976277-4387d4b0b4c6', 700),
  paragraphs: [
    'It all started with a conversation neither of us expected to remember. A quick exchange between friends turned into long walks, late dinners, and somehow the hours always disappeared before we were ready to say goodnight.',
    'Over the years we’ve collected a thousand little moments: missed trains and found coffee shops, road trips with no plan, quiet Sunday mornings and loud kitchen dances. Somewhere between all of it, we found home in each other.',
    'And now we’d love for you to be there as we begin the next chapter.',
  ],
}

export const events = [
  { title: 'Ceremony', time: '4:30 PM', place: 'Calder & Vine Estate', note: 'Garden Terrace' },
  { title: 'Cocktail Hour', time: '5:30 PM', place: 'Vineyard Lawn', note: 'An hour of champagne, conversation, and golden-hour views.' },
  { title: 'Dinner & Dancing', time: '7:00 PM', place: 'The Barrel Hall', note: 'Toasts, a long-table dinner, and dancing until late.' },
]

export const rsvp = {
  deadline: '1st November 2026',
  photo: img('1606800052052-a08af7148866', 1200),
}
