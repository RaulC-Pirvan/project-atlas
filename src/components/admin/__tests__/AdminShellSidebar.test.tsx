import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AdminShell } from '../AdminShell';
import { AdminSidebar } from '../AdminSidebar';

describe('AdminShell', () => {
  it('renders title, subtitle, and children', () => {
    render(
      <AdminShell title="Admin dashboard" subtitle="Ops visibility">
        <div>Admin content</div>
      </AdminShell>,
    );

    expect(screen.getByRole('heading', { name: /admin dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('Ops visibility')).toBeInTheDocument();
    expect(screen.getByText('Admin Console')).toBeInTheDocument();
    expect(screen.getByText('Admin content')).toBeInTheDocument();
  });
});

describe('AdminSidebar', () => {
  it('renders navigation links', () => {
    render(<AdminSidebar />);

    expect(screen.getByRole('link', { name: /health/i })).toHaveAttribute('href', '/admin#health');
    expect(screen.getByRole('link', { name: /users/i })).toHaveAttribute('href', '/admin#users');
    expect(screen.getByRole('link', { name: /habits/i })).toHaveAttribute('href', '/admin#habits');
    expect(screen.getByRole('link', { name: /activity/i })).toHaveAttribute(
      'href',
      '/admin#activity',
    );
    expect(screen.getByRole('link', { name: /export/i })).toHaveAttribute('href', '/admin#export');

    expect(screen.getByRole('button', { name: /sign out/i })).toBeInTheDocument();
  });
});
