import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import BookCard from '../components/books/BookCard';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/common/Navbar';
import ThemeToggle from '../components/common/ThemeToggle';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

describe('Library Management System Component Test Suite', () => {
  const mockBook = {
    _id: 'b123',
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    genre: 'Computer Science',
    rating: 4.9,
    pageCount: 1312,
    availableCopies: 3,
    totalCopies: 5,
    coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c'
  };

  it('BookCard renders book title, author, and genre badge', () => {
    render(
      <BrowserRouter>
        <BookCard book={mockBook} />
      </BrowserRouter>
    );

    expect(screen.getByText('Introduction to Algorithms')).toBeInTheDocument();
    expect(screen.getByText('Thomas H. Cormen')).toBeInTheDocument();
    expect(screen.getByText('Computer Science')).toBeInTheDocument();
    expect(screen.getByText('1312p')).toBeInTheDocument();
  });

  it('Navbar renders unauthenticated state with Catalog, Sign In and Get Started links', () => {
    render(
      <AuthContext.Provider value={{ user: null, logout: vi.fn() }}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('LibraryVerse')).toBeInTheDocument();
    expect(screen.getByText('Smart LMS')).toBeInTheDocument();
    expect(screen.getByText('Catalog')).toBeInTheDocument();
    expect(screen.getByText('Sign In')).toBeInTheDocument();
    expect(screen.getByText('Get Started')).toBeInTheDocument();
  });

  it('Navbar renders authenticated member state with user avatar, role badge, and My Library', () => {
    const mockUser = {
      _id: 'u123',
      name: 'Elena Rostova',
      email: 'elena@library.test',
      role: 'member',
      membershipId: 'LIB-2026-0001',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb'
    };

    render(
      <AuthContext.Provider value={{ user: mockUser, logout: vi.fn() }}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Elena Rostova')).toBeInTheDocument();
    expect(screen.getByText('member')).toBeInTheDocument();
    expect(screen.getByText('My Library')).toBeInTheDocument();
    expect(screen.getByTitle('Logout')).toBeInTheDocument();
  });

  it('Navbar renders staff circulation, members, fines, and reports links for Librarian', () => {
    const mockLibrarian = {
      _id: 'lib123',
      name: 'Sarah Collins',
      email: 'sarah@library.test',
      role: 'librarian'
    };

    render(
      <AuthContext.Provider value={{ user: mockLibrarian, logout: vi.fn() }}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Circulation Desk')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Fines')).toBeInTheDocument();
    expect(screen.getByText('Reports')).toBeInTheDocument();
    expect(screen.getByText('librarian')).toBeInTheDocument();
  });

  it('Navbar renders Audit Trail link for Administrator', () => {
    const mockAdmin = {
      _id: 'admin123',
      name: 'Head Librarian',
      email: 'admin@library.test',
      role: 'admin'
    };

    render(
      <AuthContext.Provider value={{ user: mockAdmin, logout: vi.fn() }}>
        <BrowserRouter>
          <Navbar />
        </BrowserRouter>
      </AuthContext.Provider>
    );

    expect(screen.getByText('Audit Trail')).toBeInTheDocument();
    expect(screen.getByText('Circulation Desk')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('ThemeToggle opens dropdown and displays theme options', () => {
    render(<ThemeToggle />);
    const toggleBtn = screen.getByRole('button', { name: /toggle theme/i });
    expect(toggleBtn).toBeInTheDocument();

    fireEvent.click(toggleBtn);
    expect(screen.getByText('Light')).toBeInTheDocument();
    expect(screen.getByText('Dark')).toBeInTheDocument();
    expect(screen.getByText('System')).toBeInTheDocument();
  });

  it('Modal renders title and children when open', () => {
    const onClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={onClose} title="Issue Book Copy">
        <p>Confirm issue to member</p>
      </Modal>
    );

    expect(screen.getByText('Issue Book Copy')).toBeInTheDocument();
    expect(screen.getByText('Confirm issue to member')).toBeInTheDocument();
  });

  it('LoadingSpinner renders label', () => {
    render(<LoadingSpinner label="Loading library inventory..." />);
    expect(screen.getByText('Loading library inventory...')).toBeInTheDocument();
  });
});
