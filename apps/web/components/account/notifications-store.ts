"use client"

import * as React from "react"

import { SAMPLE_NOTIFICATIONS, type AppNotification } from "@/lib/mock/account"

// Shared by the header bell and the Notifications page so "read" state stays in sync.
// In-memory until the notifications API exists.

let items: AppNotification[] = SAMPLE_NOTIFICATIONS
const listeners = new Set<() => void>()

function set(next: AppNotification[]) {
  items = next
  listeners.forEach((l) => l())
}

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function markRead(id: string) {
  set(items.map((n) => (n.id === id ? { ...n, read: true } : n)))
}

export function markUnread(id: string) {
  set(items.map((n) => (n.id === id ? { ...n, read: false } : n)))
}

export function markAllRead() {
  set(items.map((n) => ({ ...n, read: true })))
}

export function removeNotification(id: string) {
  set(items.filter((n) => n.id !== id))
}

export function useNotifications() {
  const list = React.useSyncExternalStore(subscribe, () => items, () => SAMPLE_NOTIFICATIONS)
  return { items: list, unread: list.filter((n) => !n.read).length }
}
