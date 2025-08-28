import { useEffect, useRef } from 'react'

export function useClickOutside<T extends HTMLElement>(onOutside: () => void) {
  const ref = useRef<T>(null)
  useEffect(() => {
    function handler(e: MouseEvent) {
      const el = ref.current
      if (!el) return
      if (!el.contains(e.target as Node)) onOutside()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onOutside])
  return ref
}

export default useClickOutside

