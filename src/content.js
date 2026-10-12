// Every piece of text and every photo on the site lives here. Edit this file only.
const maps = (q) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`

export const couple = {
  one: 'Maaz',
  two: 'Bushra',
  // Nikah start in Mumbai time (after Asr); the countdown targets this.
  date: '2026-11-20T16:30:00+05:30',
  dateLabel: '20th November 2026',
  heroPhoto: '/images/masjid.jpg',
}

export const nikah = {
  bismillah: 'بِسْمِ ٱللَّٰهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ',
  groom: 'Mohamed Maaz Basar',
  groomParents: 'Beloved s/o Mrs & Mr Zulfiqar Basar',
  bride: 'Bushra Shaikh',
  brideParents: 'D/o Mrs & Mr Zubair Shaikh',
  date: '20th November 2026',
  hijri: '10th Jumada al-Thani 1448 AH',
  time: 'After Salah al-Asr',
  venue: 'Hamidiya Masjid',
  address: 'Opp. Pydhonie Police Station',
  map: maps('Hamidiya Masjid, Pydhonie, Mumbai'),
  photo: '/images/nikah.jpg',
}

export const walima = {
  verseArabic: 'وَخَلَقْنَاكُمْ أَزْوَاجًا',
  verse: 'And We created you in pairs',
  verseRef: 'Surah An-Naba (78:8)',
  names: ['Mohamed Maaz', 'Bushra'],
  line: 'Join us in celebrating their beginning.',
  day: 'Sunday',
  date: '22 November 2026',
  hijri: '12 Jumada al-Thani 1448 AH',
  event: 'Reception & Dinner',
  time: '8:30 p.m. onwards',
  venue: 'Hajj House',
  address: 'Palton Road, MRA Marg, CST, Mumbai – 400001',
  map: maps('Hajj House, Palton Road, Mumbai 400001'),
  blessing: 'With Love & Blessings',
  family: 'Mohammed Zulfiqar Hanif Basar & Family',
  photo: '/images/walima.jpg',
}
