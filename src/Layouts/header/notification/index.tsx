"use client";

import {
  Dropdown,
  DropdownContent,
  DropdownTrigger,
} from "@/components/ui/dropdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { BellIcon } from "./icons";

type UINotification = { id: string; title: string; body?: string | null; type: string; createdAt: string; entityRef?: string | null }

export function Notification() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDotVisible, setIsDotVisible] = useState(true);
  const isMobile = useIsMobile();
  const [items, setItems] = useState<UINotification[]>([])
  const [unread, setUnread] = useState(0)

  async function fetchNotifications() {
    try {
      const res = await fetch('/api/notifications?limit=10&unread=true', { cache: 'no-store' })
      const j = await res.json()
      if (j?.success) {
        setItems(j.data.notifications)
        setUnread(j.data.unread)
        setIsDotVisible(j.data.unread > 0)
      }
    } catch {}
  }

  useEffect(() => { fetchNotifications() }, [])
  useEffect(() => {
    const es = new EventSource('/api/notifications/stream')
    es.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data)
        if (typeof data.unread === 'number') {
          setUnread(data.unread)
          setIsDotVisible(data.unread > 0)
          // refresh list when unread changes
          fetchNotifications()
        }
      } catch {}
    }
    es.onerror = () => { try { es.close() } catch {} }
    return () => { try { es.close() } catch {} }
  }, [])

  return (
    <Dropdown
      isOpen={isOpen}
      setIsOpen={(open) => {
        setIsOpen(open);

        if (setIsDotVisible) setIsDotVisible(false);
      }}
    >
      <DropdownTrigger
        className="grid size-12 place-items-center rounded-full border bg-gray-2 text-dark outline-none hover:text-primary focus-visible:border-primary focus-visible:text-primary dark:border-dark-4 dark:bg-dark-3 dark:text-white dark:focus-visible:border-primary"
        aria-label="View Notifications"
      >
        <span className="relative">
          <BellIcon />

          {isDotVisible && (
            <span
              className={cn(
                "absolute right-0 top-0 z-1 size-2 rounded-full bg-red-light ring-2 ring-gray-2 dark:ring-dark-3",
              )}
            >
              <span className="absolute inset-0 -z-1 animate-ping rounded-full bg-red-light opacity-75" />
            </span>
          )}
        </span>
      </DropdownTrigger>

      <DropdownContent
        align={isMobile ? "end" : "center"}
        className="border border-stroke bg-white px-3.5 py-3 shadow-md dark:border-dark-3 dark:bg-gray-dark min-[350px]:min-w-[20rem]"
      >
        <div className="mb-1 flex items-center justify-between px-2 py-1.5">
          <span className="text-lg font-medium text-dark dark:text-white">
            Notifications
          </span>
          {unread > 0 && (
            <span className="rounded-md bg-primary px-[9px] py-0.5 text-xs font-medium text-white">
              {unread} new
            </span>
          )}
        </div>

        <ul className="mb-3 max-h-[23rem] space-y-1.5 overflow-y-auto">
          {items.length === 0 && (
            <li className="px-2 py-2 text-sm text-dark-5 dark:text-dark-6">No new notifications</li>
          )}
          {items.map((item) => (
            <li key={item.id} role="menuitem">
              <Link
                href={(() => {
                  const h = item.entityRef ? `?highlight=${encodeURIComponent(item.entityRef)}` : ''
                  if (item.type === 'budget') return `/dashboard/budget${h}`
                  if (item.type === 'guest' || item.type === 'rsvp') return `/dashboard/guests${h}`
                  if (item.type === 'vendor') return `/dashboard/vendors${h}`
                  if (item.type === 'task') return `/dashboard/tasks${h}`
                  return '/dashboard/notifications'
                })()}
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-4 rounded-lg px-2 py-1.5 outline-none hover:bg-gray-2 focus-visible:bg-gray-2 dark:hover:bg-dark-3 dark:focus-visible:bg-dark-3"
              >
                <div>
                  <strong className="block text-sm font-medium text-dark dark:text-white">
                    {item.title}
                  </strong>

                  <span className="truncate text-sm font-medium text-dark-5 dark:text-dark-6">
                    {item.body || item.type}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <Link
          href="/dashboard/notifications"
          onClick={() => { setIsOpen(false) }}
          className="block rounded-lg border border-primary p-2 text-center text-sm font-medium tracking-wide text-primary outline-none transition-colors hover:bg-blue-light-5 focus:bg-blue-light-5 focus:text-primary focus-visible:border-primary dark:border-dark-3 dark:text-dark-6 dark:hover:border-dark-5 dark:hover:bg-dark-3 dark:hover:text-dark-7 dark:focus-visible:border-dark-5 dark:focus-visible:bg-dark-3 dark:focus-visible:text-dark-7"
        >
          See all notifications
        </Link>
      </DropdownContent>
    </Dropdown>
  );
}
