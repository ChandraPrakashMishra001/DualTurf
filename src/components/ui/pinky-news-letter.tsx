"use client"
import React, { useState, useEffect } from "react"
import Image from "next/image"
import styles from "./pinky-news-letter.module.css"

const SLIDESHOW_IMAGES = [
  { src: "/images/RMFC.PNG", alt: "Real Madrid Kit", duration: 3000 },
  { src: "/images/MCFC.PNG", alt: "Man City Kit", duration: 3500 },
  { src: "/images/FCBA.PNG", alt: "Barcelona Kit", duration: 3500 },
  { src: "/images/ACM.PNG", alt: "AC Milan Kit", duration: 3500 },
  { src: "/images/CHELSEA.PNG", alt: "Chelsea Kit", duration: 3500 },
]

export default function NewsLetter() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [imagesLoaded, setImagesLoaded] = useState<boolean[]>(new Array(SLIDESHOW_IMAGES.length).fill(false))
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })

  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDESHOW_IMAGES.length)
    }, SLIDESHOW_IMAGES[currentSlide].duration)
    return () => clearTimeout(timer)
  }, [currentSlide])

  useEffect(() => {
    // Extended target date to 15th August 2026
    const targetDate = new Date("2026-08-15T00:00:00").getTime()
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

  const handleImageLoad = (index: number) => {
    setImagesLoaded(prev => {
      const updated = [...prev]
      updated[index] = true
      return updated
    })
  }

  return (
    <main className={styles.page}>
      {/* Background Slideshow */}
      <div className={styles.slideshowBg}>
        {SLIDESHOW_IMAGES.map((image, index) => (
          <div
            key={image.src}
            className={`${styles.slide} ${index === currentSlide ? styles.slideActive : styles.slideHidden}`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              sizes="100vw"
              quality={80}
              priority={index === 0}
              className={styles.slideImg}
              onLoad={() => handleImageLoad(index)}
            />
          </div>
        ))}
        <div className={styles.overlay} />
      </div>

      {/* Top Bar — Dual Turf Brand */}
      <div className={styles.topBar}>
        <span className={styles.brand}>
          <span className={styles.white}>D</span><span className={styles.green}>ual</span>{' '}
          <span className={styles.white}>T</span><span className={styles.green}>urf</span>
        </span>
      </div>

      {/* Main Content — Coming Soon + Countdown Timer + Message */}
      <div className={styles.bottomLeft}>
        <h1 className={styles.heading}>Coming Soon</h1>
        <p className={styles.launchDate}>Great things take time. We will be back shortly!</p>

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
