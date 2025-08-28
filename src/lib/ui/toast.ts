"use client"

export function toastError(message: string) {
  if (typeof window !== 'undefined') {
    // Minimal centralized error toast; replace with a UI lib later
    window.alert(message)
  } else {
    console.error('[ToastError]', message)
  }
}

