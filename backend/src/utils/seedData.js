const initialBooks = [
  {
    title: 'Dune',
    author: 'Frank Herbert',
    genre: 'Sci-Fi',
    description: 'Set on the desert planet Arrakis, Dune is the story of the boy Paul Atreides, heir to a noble family tasked with ruling an inhospitable world where the only article of value is the spice melange.',
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600',
    rating: 4.8,
    numReviews: 124,
    pageCount: 688,
    publishedYear: 1965,
    isbn: '9780441172719'
  },
  {
    title: 'The Midnight Library',
    author: 'Matt Haig',
    genre: 'Fiction',
    description: 'Between life and death there is a library, and within that library, the shelves go on forever. Every book provides a chance to try another life you could have lived.',
    coverImage: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600',
    rating: 4.6,
    numReviews: 98,
    pageCount: 304,
    publishedYear: 2020,
    isbn: '9780525559474'
  },
  {
    title: 'Project Hail Mary',
    author: 'Andy Weir',
    genre: 'Sci-Fi',
    description: 'Ryland Grace is the sole survivor on a desperate, last-chance mission—and if he fails, humanity and the earth itself will perish.',
    coverImage: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600',
    rating: 4.9,
    numReviews: 215,
    pageCount: 496,
    publishedYear: 2021,
    isbn: '9780593135204'
  },
  {
    title: 'Atomic Habits',
    author: 'James Clear',
    genre: 'Self-Help',
    description: 'An easy & proven way to build good habits & break bad ones. No matter your goals, Atomic Habits offers a proven framework for improving every day.',
    coverImage: 'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=600',
    rating: 4.9,
    numReviews: 340,
    pageCount: 320,
    publishedYear: 2018,
    isbn: '9780735211292'
  },
  {
    title: 'The Hobbit',
    author: 'J.R.R. Tolkien',
    genre: 'Fantasy',
    description: 'Bilbo Baggins is a hobbit who enjoys a comfortable, unambitious life, seldom heading further than the pantry. But his contentment is disturbed when the wizard Gandalf arrives.',
    coverImage: 'https://images.unsplash.com/photo-1629992101753-56d196c8aced?w=600',
    rating: 4.7,
    numReviews: 180,
    pageCount: 310,
    publishedYear: 1937,
    isbn: '9780547928227'
  },
  {
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    genre: 'Non-Fiction',
    description: 'From examining the role that evolving humans have played in the global ecosystem to charting the rise of empires, Sapiens integrates history and science to reconsider accepted narratives.',
    coverImage: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=600',
    rating: 4.7,
    numReviews: 290,
    pageCount: 443,
    publishedYear: 2014,
    isbn: '9780062316097'
  },
  {
    title: 'The Silent Patient',
    author: 'Alex Michaelides',
    genre: 'Mystery',
    description: 'Alicia Berenson’s life is seemingly perfect. One evening she shoots her husband five times in the face, and then never speaks another word.',
    coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=600',
    rating: 4.5,
    numReviews: 165,
    pageCount: 336,
    publishedYear: 2019,
    isbn: '9781250301697'
  },
  {
    title: 'Klara and the Sun',
    author: 'Kazuo Ishiguro',
    genre: 'Fiction',
    category: 'Fiction',
    publisher: 'Faber & Faber',
    edition: '1st Edition',
    shelfLocation: 'Fiction Shelf F-4',
    description: 'From Nobel laureate Kazuo Ishiguro, Klara and the Sun tells the story of Klara, an Artificial Friend with outstanding observational qualities, who watches the behavior of those who come in to browse.',
    coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=600',
    rating: 4.4,
    numReviews: 88,
    pageCount: 303,
    publishedYear: 2021,
    isbn: '9780593318171'
  }
];

const initialUsers = [
  {
    name: 'Chief Librarian Sarah Vance',
    email: 'admin@libraryverse.test',
    password: 'AdminPassword123!',
    role: 'admin',
    membershipId: 'LIB-ADMIN-001',
    membershipStatus: 'active',
    maxBorrowLimit: 10,
    phone: '+1 (555) 019-2834',
    address: 'Central Library Head Office, Suite 400',
    bio: 'Lead System Administrator & Chief Curator of Library Services.'
  },
  {
    name: 'Julian Hayes',
    email: 'librarian@libraryverse.test',
    password: 'LibrarianPassword123!',
    role: 'librarian',
    membershipId: 'LIB-STAFF-102',
    membershipStatus: 'active',
    maxBorrowLimit: 8,
    phone: '+1 (555) 014-9982',
    address: 'Circulation Desk, Main Campus Library',
    bio: 'Circulation & Cataloging Specialist.'
  },
  {
    name: 'Marcus Chen',
    email: 'student@libraryverse.test',
    password: 'StudentPassword123!',
    role: 'member',
    membershipId: 'LIB-2026-782103',
    membershipStatus: 'active',
    maxBorrowLimit: 5,
    phone: '+1 (555) 012-3456',
    address: 'Campus West Dormitory, Room 314',
    bio: 'Literature and Computer Science Student.'
  }
];

module.exports = { initialBooks, initialUsers };

