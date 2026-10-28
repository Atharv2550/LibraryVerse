# BookVerse API Documentation 📚🔌

This document provides a comprehensive specification of all REST endpoints, authentication protocols, real-time Socket.IO events, and response models implemented in BookVerse.

---

## Base URL & Configuration

- **Development Base URL**: `http://localhost:5000/api`
- **Socket.IO Endpoint**: `http://localhost:5000`
- **Default Content-Type**: `application/json`

---

## Standard Response Schemas

### 1. Success Response
```json
{
  "statusCode": 200,
  "data": { ... },
  "message": "Resource fetched successfully",
  "success": true
}
```

### 2. Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "message": "Validation Error",
  "errors": [
    { "field": "email", "message": "Please enter a valid email address" }
  ]
}
```

---

## 1. System & Health Check

### `GET /api/health`
Checks application and database readiness.

- **Auth**: None
- **Response `200 OK`**:
```json
{
  "status": "healthy",
  "service": "BookVerse API",
  "database": {
    "connected": true,
    "type": "MongoDB"
  },
  "uptime": 1420,
  "timestamp": "2026-10-06T12:00:00.000Z"
}
```

---

## 2. Authentication (`/api/auth`)

### `POST /api/auth/register`
Creates a new user profile and returns a signed JWT.

- **Auth**: Public
- **Rate Limit**: 30 requests / 15 min
- **Request Body**:
```json
{
  "name": "Jane Reader",
  "email": "jane@example.com",
  "password": "SecurePassword123!",
  "bio": "Avid sci-fi reader.",
  "favoriteGenres": ["Sci-Fi", "Fiction"]
}
```
- **Response `201 Created`**:
```json
{
  "statusCode": 201,
  "data": {
    "_id": "6701c9...",
    "name": "Jane Reader",
    "email": "jane@example.com",
    "avatar": "https://...",
    "bio": "Avid sci-fi reader.",
    "role": "user",
    "favoriteGenres": ["Sci-Fi", "Fiction"],
    "readingGoal": 12,
    "token": "eyJhbGciOi..."
  },
  "message": "Registration successful",
  "success": true
}
```

### `POST /api/auth/login`
Authenticates existing credentials and returns a signed JWT.

- **Auth**: Public
- **Rate Limit**: 30 requests / 15 min
- **Request Body**:
```json
{
  "email": "jane@example.com",
  "password": "SecurePassword123!"
}
```
- **Response `200 OK`**: Returns user profile and `token`.

### `GET /api/auth/me`
Retrieves currently authenticated session user.

- **Auth**: `Bearer <token>`
- **Response `200 OK`**: Current user document (excluding password).

---

## 3. Books (`/api/books`)

### `GET /api/books`
Paginated book discovery with genre and multi-field search.

- **Auth**: Public
- **Query Parameters**:
  - `search` (string): Search title, author, or genre keyword.
  - `genre` (string): Filter by genre (e.g. `'Sci-Fi'`, `'Fiction'`).
  - `sort` (string): `'rating'` (default), `'newest'`, `'reviews'`, `'title'`, `'pages'`.
  - `page` (number): Page number (default: `1`).
  - `limit` (number): Items per page (default: `12`, max: `50`).
- **Response `200 OK`**:
```json
{
  "statusCode": 200,
  "data": {
    "books": [ ... ],
    "pagination": {
      "total": 48,
      "page": 1,
      "limit": 12,
      "totalPages": 4
    }
  },
  "message": "Books retrieved successfully",
  "success": true
}
```

### `GET /api/books/featured`
Returns top-rated and trending books.

- **Auth**: Public
- **Response `200 OK`**: Array of top 6 books.

### `GET /api/books/:id`
Retrieves full book details with creator/addedBy populated.

- **Auth**: Public
- **Response `200 OK`**: Book document.
- **Error `404 Not Found`**: Book not found.

### `POST /api/books`
Adds a new book to the platform library.

- **Auth**: `Bearer <token>`
- **Request Body**:
```json
{
  "title": "Neuromancer",
  "author": "William Gibson",
  "genre": "Sci-Fi",
  "description": "Case was the sharpest data-thief in the matrix...",
  "pageCount": 271,
  "publishedYear": 1984,
  "isbn": "9780441569595",
  "coverImage": "https://..."
}
```
- **Response `201 Created`**: Newly created book.

---

## 4. Reviews (`/api/reviews`)

### `GET /api/reviews/book/:bookId`
Retrieves all reviews for a specific book, sorted by newest first.

- **Auth**: Public
- **Response `200 OK`**: Array of reviews with reviewer `name` and `avatar` populated.

### `POST /api/reviews`
Submits a review for a book. Automatically recalculates the book's aggregate rating and review count. Enforces one review per user per book.

- **Auth**: `Bearer <token>`
- **Request Body**:
```json
{
  "bookId": "6701c9...",
  "rating": 5,
  "comment": "Exceptional worldbuilding and unforgettable pacing."
}
```
- **Response `201 Created`**: Review document.
- **Error `409 Conflict`**: User has already reviewed this book.

### `PUT /api/reviews/:id`
Updates user's own review and updates book aggregate rating.

- **Auth**: `Bearer <token>` (Owner or Admin)
- **Request Body**: `{ "rating": 4, "comment": "Updated thoughts..." }`
- **Response `200 OK`**: Updated review.

### `DELETE /api/reviews/:id`
Deletes user's own review and updates book aggregate rating.

- **Auth**: `Bearer <token>` (Owner or Admin)
- **Response `200 OK`**: `{ "message": "Review deleted successfully" }`

---

## 5. Reading Tracker (`/api/progress`)

### `GET /api/progress`
Retrieves reading progress records for current user with computed statistics.

- **Auth**: `Bearer <token>`
- **Response `200 OK`**:
```json
{
  "statusCode": 200,
  "data": {
    "items": [
      {
        "_id": "...",
        "book": { "title": "Dune", "pageCount": 688, ... },
        "currentPage": 340,
        "totalPages": 688,
        "status": "reading"
      }
    ],
    "stats": {
      "totalTracked": 5,
      "completed": 2,
      "reading": 2,
      "wantToRead": 1,
      "totalPagesRead": 1044,
      "goal": 12,
      "goalPercentage": 17
    }
  }
}
```

### `POST /api/progress`
Upserts reading progress for a book. Validates that `currentPage <= totalPages` and `currentPage >= 0`. Automatically transitions status to `'completed'` when `currentPage === totalPages`.

- **Auth**: `Bearer <token>`
- **Request Body**:
```json
{
  "bookId": "6701c9...",
  "currentPage": 250,
  "totalPages": 688,
  "status": "reading"
}
```
- **Response `200 OK`**: Progress record.

### `DELETE /api/progress/:bookId`
Removes a book from user's reading tracker.

- **Auth**: `Bearer <token>`
- **Response `200 OK`**: `{ "message": "Reading progress removed successfully" }`

---

## 6. Reading Clubs (`/api/clubs`)

### `GET /api/clubs`
Lists reading clubs with member count and current reading title.

- **Auth**: Public
- **Query Parameters**: `genre`, `search`
- **Response `200 OK`**: Array of clubs.

### `GET /api/clubs/:id`
Retrieves club details and full member list. If club is private, unauthenticated/non-member visitors receive a restricted summary.

- **Auth**: Optional `Bearer <token>`
- **Response `200 OK`**: Club object with `membersCount`, `isMember`, and `isCreator`.

### `POST /api/clubs`
Creates a new reading club. Creator is automatically enrolled as the first member.

- **Auth**: `Bearer <token>`
- **Request Body**:
```json
{
  "name": "Sci-Fi Explorers",
  "genre": "Sci-Fi",
  "description": "Weekly deep dives into classic and modern space opera.",
  "coverImage": "https://...",
  "currentBook": "6701c9...",
  "isPrivate": false
}
```
- **Response `201 Created`**: Club document.

### `POST /api/clubs/:id/join`
Enrolls authenticated user into club membership.

- **Auth**: `Bearer <token>`
- **Response `200 OK`**: Updated club document.

### `POST /api/clubs/:id/leave`
Removes authenticated user from club. If club creator leaves, ownership transfers to the next member; if last member leaves, club is safely cleaned up.

- **Auth**: `Bearer <token>`
- **Response `200 OK`**: Updated club document or deletion notice.

### `GET /api/clubs/:id/messages`
Retrieves chat history for club room (max 100 messages).

- **Auth**: Optional for public clubs; required for private clubs.
- **Response `200 OK`**: Array of messages.

### `POST /api/clubs/:id/messages`
Publishes a message to the club room. Validates sender, persists to MongoDB, and broadcasts to real-time Socket.IO room.

- **Auth**: `Bearer <token>`
- **Request Body**: `{ "text": "What does everyone think of chapter 3?" }`
- **Response `201 Created`**: Persisted message.

---

## 7. User Profile (`/api/users`)

### `GET /api/users/profile`
Retrieves authenticated user profile along with reading analytics.

- **Auth**: `Bearer <token>`
- **Response `200 OK`**: `{ user: { ... }, stats: { ... }, recentActivity: [ ... ] }`

### `PUT /api/users/profile`
Updates profile information.

- **Auth**: `Bearer <token>`
- **Request Body**:
```json
{
  "name": "Jane Reader",
  "bio": "Avid reader exploring hard sci-fi.",
  "avatar": "https://...",
  "readingGoal": 20,
  "favoriteGenres": ["Sci-Fi", "Fantasy"]
}
```
- **Response `200 OK`**: Updated safe user document.

---

## 8. Socket.IO Real-Time Protocol

### Connection Handshake
Clients authenticate during handshake:
```javascript
const socket = io('http://localhost:5000', {
  auth: { token: localStorage.getItem('bookverse_token') }
});
```

### Client Events
| Event | Payload | Description |
|---|---|---|
| `join_club` | `clubId: string` | Joins club socket room (enforces private authorization) |
| `leave_club` | `clubId: string` | Leaves club socket room |
| `send_message` | `{ clubId, text }` | Sends authenticated message to room; persisted to MongoDB |

### Server Events
| Event | Payload | Description |
|---|---|---|
| `joined_club` | `{ clubId }` | Confirms room entry |
| `receive_message` | `Message document` | Delivers real-time message to room participants |
| `error` | `{ message }` | Emits authorization or validation failure notice |
