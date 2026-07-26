"use client"
import React, { useState, useEffect } from "react"
import styles from "./pinky-news-letter.module.css"

const SLIDESHOW_IMAGES = [
  { src: "/images/RMFC.PNG", alt: "Real Madrid Kit", duration: 5000 },
  { src: "/images/MCFC.PNG", alt: "Man City Kit", duration: 4000 },
  { src: "/images/FCBA.PNG", alt: "Barcelona Kit", duration: 4000 },
  { src: "/images/ACM.PNG", alt: "AC Milan Kit", duration: 4000 },
  { src: "/images/CHELSEA.PNG", alt: "Chelsea Kit", duration: 4000 },
]

export default function NewsLetter() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDESHOW_IMAGES.length)
    }, SLIDESHOW_IMAGES[currentSlide].duration)
    return () => clearTimeout(timer)
  }, [currentSlide])

  useEffect(() => {
    const targetDate = new Date("2026-08-10T00:00:00").getTime()
    const interval = setInterval(() => {
      const now = new Date().getTime()
      const distance = targetDate - now
      if (distance < 0) { clearInterval(interval); return }
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <main className={styles.page}>
      {/* Background Slideshow */}
      <div className={styles.slideshowBg}>
        {SLIDESHOW_IMAGES.map((image, index) => (
          <div key={image.src} className={`${styles.slide} ${index === currentSlide ? styles.slideActive : styles.slideHidden}`}>
            <img src={image.src} alt={image.alt} className={styles.slideImg} />
          </div>
        ))}
        <div className={styles.overlay} />
      </div>

      {/* Top bar — Brand name only */}
      <div className={styles.topBar}>
        <span className={styles.brand}>
          <span className={styles.white}>D</span><span className={styles.green}>ual</span>{' '}
          <span className={styles.white}>T</span><span className={styles.green}>urf</span>
        </span>
      </div>

      {/* Bottom Left — Coming Soon + Timer + Dots */}
      <div className={styles.bottomLeft}>

        <h1 className={styles.heading}>Coming Soon</h1>
        <p className={styles.launchDate}>Launching on 10th August 2026</p>

        {/* Countdown */}
        <div className={styles.timerRow}>
          <div className={styles.timerUnit}>
            <span className={styles.timerNum}>{String(timeLeft.days).padStart(2, '0')}</span>
            <span className={styles.timerLabel}>Days</span>
          </div>
          <span className={styles.timerSep}>:</span>
          <div className={styles.timerUnit}>
            <span className={styles.timerNum}>{String(timeLeft.hours).padStart(2, '0')}</span>
            <span className={styles.timerLabel}>Hours</span>
          </div>
          <span className={styles.timerSep}>:</span>
          <div className={styles.timerUnit}>
            <span className={styles.timerNum}>{String(timeLeft.minutes).padStart(2, '0')}</span>
            <span className={styles.timerLabel}>Mins</span>
          </div>
          <span className={styles.timerSep}>:</span>
          <div className={styles.timerUnit}>
            <span className={styles.timerNum}>{String(timeLeft.seconds).padStart(2, '0')}</span>
            <span className={styles.timerLabel}>Secs</span>
          </div>
        </div>

        {/* Slide Dots */}
        <div className={styles.dots}>
          {SLIDESHOW_IMAGES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`${styles.dot} ${index === currentSlide ? styles.dotActive : ''}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

      </div>
    </main>
  )
}
