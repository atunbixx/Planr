'use client'

import { UserButton } from '@clerk/nextjs'

export default function UserProfileButton() {
  return <UserButton afterSignOutUrl="/" />
}