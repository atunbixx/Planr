'use client';

import UserProfileButton from './UserProfileButton';

interface HeaderClientProps {
  firstName: string | null | undefined;
}

export default function HeaderClient({ firstName }: HeaderClientProps) {
  return (
    <div className="flex items-center space-x-4">
      <div className="hidden sm:block">
        <span className="text-sm text-gray-600">
          Welcome, {firstName || 'there'}!
        </span>
      </div>
      <UserProfileButton />
    </div>
  );
}
