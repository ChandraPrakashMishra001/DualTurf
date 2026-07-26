'use client'

import React, { useRef, useState } from 'react'

export default function GlowCard({ children, className = '', style = {}, href }) {
  const cardRef = useRef(null)
  const [glowPos, setGlowPos] = useState({ x: 50, y: 50, opacity: 0 })

  const handleMouseMove = (e) => {
    const card = cardRef.current
    if (!card) return
    const rect = card.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setGlowPos({ x, y, opacity: 1 })
  }

  const handleMouseLeave = () => {
    setGlowPos((p) => ({ ...p, opacity: 0 }))
  }

  const glowStyle = {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    background: `radial-gradient(280px circle at ${glowPos.x}% ${glowPos.y}%, rgba(196, 255, 61, 0.22), rgba(0, 255, 102, 0.06) 40%, transparent 70%)`,
    opacity: glowPos.opacity,
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none',
    zIndex: 3,
  }

  const borderGlowStyle = {
    position: 'absolute',
    inset: 0,
    borderRadius: 'inherit',
    background: `radial-gradient(200px circle at ${glowPos.x}% ${glowPos.y}%, rgba(196, 255, 61, 0.6), transparent 60%)`,
    opacity: glowPos.opacity * 0.7,
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none',
    zIndex: 1,
    // Mask to only show as border glow
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    padding: '1px',
  }

  const containerStyle = {
    position: 'relative',
    ...style,
    transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease',
  }

  const hoverCSS = `
    .glow-card:hover {
      transform: translateY(-6px) scale(1.02);
      box-shadow: 0 20px 50px rgba(196, 255, 61, 0.15), 0 0 0 1px rgba(196, 255, 61, 0.3);
    }
  `

  const Tag = href ? 'a' : 'div'

  return (
    <>
      <style>{hoverCSS}</style>
      <Tag
        ref={cardRef}
        href={href}
        className={`glow-card ${className}`}
        style={containerStyle}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Spotlight glow layer */}
        <div style={glowStyle} />
        {children}
      </Tag>
    </>
  )
}
