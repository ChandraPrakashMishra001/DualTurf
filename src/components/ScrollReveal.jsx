'use client'

import React, { useEffect, useRef } from 'react'

export default function ScrollReveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  style = {},
}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Set initial hidden state via inline style
    const transforms = {
      up: 'translateY(40px)',
      down: 'translateY(-40px)',
      left: 'translateX(40px)',
      right: 'translateX(-40px)',
      scale: 'scale(0.93)',
    }

    el.style.opacity = '0'
    el.style.transform = transforms[direction] || 'translateY(40px)'
    el.style.transition = `opacity 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.7s cubic-bezier(0.16,1,0.3,1) ${delay}s`
    el.style.willChange = 'opacity, transform'

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = '1'
          el.style.transform = 'none'
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '-40px' }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [direction, delay])

  return (
    <div ref={ref} className={className} style={style}>
      {children}
    </div>
  )
}
