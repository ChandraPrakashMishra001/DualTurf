import Link from 'next/link'
import { HERO_SLIDES, CATEGORIES } from '@/data/products'
import { getAllProducts } from '@/lib/sanity'
import ScrollReveal from '@/components/ScrollReveal'
import GlowCard from '@/components/GlowCard'
import QuickAddButton from '@/components/QuickAddButton'
import styles from './page.module.css'

export const revalidate = 0

export default async function Home() {
  const productsList = await getAllProducts()
  const latestDropProducts = productsList || []
  const intlKitsProducts = (productsList || []).filter(p => p.category === 'international-kits')

  return (
    <div className={styles.homeContainer}>
      {/* Hero Section Banner */}
      <section className={styles.heroSection}>
        {HERO_SLIDES.map((slide) => (
          <div
            key={slide.id}
            className={`${styles.heroSlide} ${styles.activeSlide}`}
          >
            <div
              className={styles.heroBg}
              style={{ backgroundImage: `url(${slide.image})` }}
            />
            <div className={styles.heroOverlay} />
            <div className={styles.heroContent}>
              <ScrollReveal direction="up" delay={0.1}>
                <h1 className="font-display text-stroke">{slide.title}</h1>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.25}>
                <p className={styles.heroSubtitle}>{slide.subtitle}</p>
              </ScrollReveal>
              <ScrollReveal direction="scale" delay={0.4}>
                <Link href={slide.link || '/collections/all'} className="btn-primary">
                  SHOP NOW →
                </Link>
              </ScrollReveal>
            </div>
          </div>
        ))}
      </section>

      {/* Marquee Bar */}
      <div className={styles.marqueeSection}>
        <div className="animate-marquee">
          <span className={styles.marqueeItem}>★ SUPERIOR PRODUCT LINE ★</span>
          <span className={styles.marqueeItem}>UPTO 70% OFF ON CLEARANCE SALE</span>
          <span className={styles.marqueeItem}>★ OFFICIAL REPLICA KITS ★</span>
          <span className={styles.marqueeItem}>FAST SHIPPING ACROSS INDIA</span>
          <span className={styles.marqueeItem}>★ SUPERIOR PRODUCT LINE ★</span>
          <span className={styles.marqueeItem}>UPTO 70% OFF ON CLEARANCE SALE</span>
          <span className={styles.marqueeItem}>★ OFFICIAL REPLICA KITS ★</span>
          <span className={styles.marqueeItem}>FAST SHIPPING ACROSS INDIA</span>
        </div>
      </div>

      {/* Shop By Category */}
      <section className={`${styles.section} ${styles.sideTextSection}`}>
        {/* Horizontal top title */}
        <ScrollReveal direction="up">
          <h2 className={`font-display ${styles.seasonHeader}`}>2026 - 2027 SEASON</h2>
        </ScrollReveal>

        {/* Rotated side text */}
        <div className={styles.sideTextLeft}>
          <span className="font-display">New Season</span>
        </div>
        <div className={styles.sideTextRight}>
          <span className="font-display">KITS</span>
        </div>

        <div className="container">
          <div className={styles.categoryGrid}>
            {CATEGORIES.map((cat, idx) => (
              <ScrollReveal key={cat.id} direction="up" delay={idx * 0.1}>
                <GlowCard
                  href={`/collections/${cat.slug}`}
                  className={`product-card ${styles.categoryCard}`}
                >
                  <div
                    className={`product-card-img ${styles.cardBg}`}
                    style={{ backgroundImage: `url(${cat.image})` }}
                  />
                  <div className={styles.cardGradient} />
                  <div className={styles.categoryInfo}>
                    <h3 className="font-display">{cat.name}</h3>
                    <div className={styles.arrowCircle}>↗</div>
                  </div>
                </GlowCard>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Drop */}
      <section className={`${styles.section} ${styles.darkBg}`}>
        <div className="container">
          <ScrollReveal direction="up">
            <h2 className={`font-display title-underline ${styles.sectionTitle}`}>LATEST DROP</h2>
          </ScrollReveal>

          <div className={styles.productGrid}>
            {latestDropProducts.map((product, idx) => (
              <ScrollReveal key={product.id || product._id || idx} direction="scale" delay={idx * 0.12}>
                <div className={`product-card ${styles.productCard}`}>
                  <Link href={`/products/${product.slug}`} className={styles.productImgWrapper}>
                    <div
                      className={`product-card-img ${styles.cardBg}`}
                      style={{ backgroundImage: `url(${product.image})` }}
                    />
                    <span className={styles.newBadge}>NEW</span>
                    <QuickAddButton product={product} />
                  </Link>
                  <div className={styles.productMeta}>
                    <Link href={`/products/${product.slug}`}>
                      <h3 className={styles.productTitle}>{product.title || product.name}</h3>
                    </Link>
                    <div className={styles.priceRow}>
                      <span className={styles.price}>₹{product.price}</span>
                      {product.originalPrice && (
                        <span className={styles.originalPrice}>₹{product.originalPrice}</span>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </div>
      </section>

      {/* Best of International Home Kits Section */}
      {intlKitsProducts.length > 0 && (
        <section className={styles.section}>
          <div className="container">
            <ScrollReveal direction="up">
              <h2 className={`font-display title-underline ${styles.sectionTitle}`}>
                BEST OF INTERNATIONAL HOME KITS
              </h2>
            </ScrollReveal>
            <div className={styles.productGrid}>
              {intlKitsProducts.map((kit, idx) => (
                <ScrollReveal key={kit.id || kit._id || idx} direction="scale" delay={idx * 0.12}>
                  <div className={`product-card ${styles.productCard}`}>
                    <Link href={`/products/${kit.slug}`} className={styles.productImgWrapper}>
                      <div
                        className={`product-card-img ${styles.cardBg}`}
                        style={{ backgroundImage: `url(${kit.image})` }}
                      />
                      <QuickAddButton product={kit} />
                    </Link>
                    <div className={styles.productMeta}>
                      <Link href={`/products/${kit.slug}`}>
                        <h3 className={styles.productTitle}>{kit.title || kit.name}</h3>
                      </Link>
                      <div className={styles.priceRow}>
                        <span className={styles.price}>₹{kit.price}</span>
                      </div>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Brand Story & Stats Section */}
      <section className={`${styles.section} ${styles.brandSection}`}>
        <div className={`container ${styles.brandContainer}`}>
          <div className={styles.brandBox}>
            <ScrollReveal direction="up">
              <h2 className="font-display text-stroke">DUALTURF</h2>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.15}>
              <p className={styles.brandParagraph}>
                Football is more than just a sport — it's a passion, a community, and a way of life.
                At DualTurf, we bring fans across India the highest quality jerseys and matchwear so you can wear your passion with pride.
              </p>
            </ScrollReveal>
            <div className={styles.statsRow}>
              <ScrollReveal direction="scale" delay={0.3}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>200+</span>
                  <span className={styles.statLabel}>DESIGNS</span>
                </div>
              </ScrollReveal>
              <ScrollReveal direction="scale" delay={0.45}>
                <div className={styles.statItem}>
                  <span className={styles.statNumber}>60,000+</span>
                  <span className={styles.statLabel}>HAPPY CUSTOMERS</span>
                </div>
              </ScrollReveal>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
