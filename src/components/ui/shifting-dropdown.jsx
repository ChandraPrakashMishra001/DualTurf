'use client';

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Shield,
  Zap,
  Sparkles,
  Flame,
  Tag,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export function ShiftingDropDown() {
  return (
    <div className="relative flex justify-center text-white">
      <Tabs />
    </div>
  );
}

const Tabs = () => {
  const [selected, setSelected] = useState(null);
  const [dir, setDir] = useState(null);

  const handleSetSelected = (val) => {
    if (typeof selected === "number" && typeof val === "number") {
      setDir(selected > val ? "r" : "l");
    } else if (val === null) {
      setDir(null);
    }
    setSelected(val);
  };

  return (
    <div
      onMouseLeave={() => handleSetSelected(null)}
      className="relative flex h-fit gap-2 items-center"
    >
      {TABS.map((t) => {
        return (
          <Tab
            key={t.id}
            selected={selected}
            handleSetSelected={handleSetSelected}
            tab={t.id}
          >
            {t.title}
          </Tab>
        );
      })}

      <AnimatePresence>
        {selected && <Content dir={dir} selected={selected} />}
      </AnimatePresence>
    </div>
  );
};

const Tab = ({ children, tab, handleSetSelected, selected }) => {
  return (
    <button
      id={`shift-tab-${tab}`}
      onMouseEnter={() => handleSetSelected(tab)}
      onClick={() => handleSetSelected(tab)}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        padding: '0.375rem 0.875rem',
        borderRadius: '9999px',
        fontSize: '0.9375rem',
        fontWeight: '600',
        color: selected === tab ? '#c4ff3d' : '#ffffff',
        backgroundColor: selected === tab ? 'rgba(196, 255, 61, 0.15)' : 'transparent',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        border: 'none',
      }}
    >
      <span>{children}</span>
      <ChevronDown
        size={16}
        style={{
          transition: 'transform 0.2s ease',
          transform: selected === tab ? 'rotate(180deg)' : 'rotate(0deg)',
          color: selected === tab ? '#c4ff3d' : '#999999',
        }}
      />
    </button>
  );
};

const Content = ({ selected, dir }) => {
  return (
    <motion.div
      id="overlay-content"
      initial={{
        opacity: 0,
        y: 8,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      exit={{
        opacity: 0,
        y: 8,
      }}
      style={{
        position: 'absolute',
        left: '-80px',
        top: 'calc(100% + 14px)',
        width: '520px',
        borderRadius: '16px',
        border: '1px solid rgba(255, 255, 255, 0.12)',
        backgroundColor: '#0d0d0d',
        color: '#ffffff',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(196, 255, 61, 0.1)',
        padding: '1.25rem',
        zIndex: 50,
      }}
    >
      <Bridge />
      <Nub selected={selected} />

      {TABS.map((t) => {
        return (
          <div style={{ overflow: 'hidden' }} key={t.id}>
            {selected === t.id && (
              <motion.div
                initial={{
                  opacity: 0,
                  x: dir === "l" ? 60 : dir === "r" ? -60 : 0,
                }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                <t.Component />
              </motion.div>
            )}
          </div>
        );
      })}
    </motion.div>
  );
};

const Bridge = () => (
  <div style={{ position: 'absolute', top: '-14px', left: 0, right: 0, height: '14px' }} />
);

const Nub = ({ selected }) => {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    moveNub();
  }, [selected]);

  const moveNub = () => {
    if (selected) {
      const hoveredTab = document.getElementById(`shift-tab-${selected}`);
      const overlayContent = document.getElementById("overlay-content");

      if (!hoveredTab || !overlayContent) return;

      const tabRect = hoveredTab.getBoundingClientRect();
      const { left: contentLeft } = overlayContent.getBoundingClientRect();

      const tabCenter = tabRect.left + tabRect.width / 2 - contentLeft;

      setLeft(tabCenter);
    }
  };

  return (
    <motion.span
      style={{
        clipPath: "polygon(0 0, 100% 0, 50% 50%, 0% 100%)",
        position: 'absolute',
        top: 0,
        height: '16px',
        width: '16px',
        transform: 'translateX(-50%) translateY(-50%) rotate(45deg)',
        backgroundColor: '#0d0d0d',
        border: '1px solid rgba(255, 255, 255, 0.12)',
      }}
      animate={{ left }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
    />
  );
};

/* Categories Content 1: Club Kits & Player Editions */
const ClubKits = () => {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '2rem' }}>
        <div>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#c4ff3d', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Zap size={14} /> Season 26-27
          </h3>
          <Link href="/collections/2026-27-season-kits" style={{ display: 'block', fontSize: '0.875rem', color: '#ccc', marginBottom: '0.5rem' }}>
            Real Madrid Home
          </Link>
          <Link href="/collections/2026-27-season-kits" style={{ display: 'block', fontSize: '0.875rem', color: '#ccc', marginBottom: '0.5rem' }}>
            Arsenal Home
          </Link>
          <Link href="/collections/2026-27-season-kits" style={{ display: 'block', fontSize: '0.875rem', color: '#ccc' }}>
            Liverpool FC Home
          </Link>
        </div>

        <div>
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#c4ff3d', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
            <Sparkles size={14} /> Special Edition
          </h3>
          <Link href="/products/portugal-pantera-negra-special-edition-fan-version" style={{ display: 'block', fontSize: '0.875rem', color: '#ccc', marginBottom: '0.5rem' }}>
            Portugal Pantera Negra Special Edition
          </Link>
        </div>
      </div>

      <Link
        href="/collections/all"
        style={{
          marginLeft: 'auto',
          marginTop: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.375rem',
          fontSize: '0.8125rem',
          fontWeight: 700,
          color: '#c4ff3d',
        }}
      >
        <span>Explore All Club Kits</span>
        <ArrowRight size={14} />
      </Link>
    </div>
  );
};

/* Categories Content 2: Retro Jerseys */
const RetroSets = () => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
      <Link
        href="/collections/retro-jerseys"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          padding: '1.25rem',
          backgroundColor: '#141414',
          borderRadius: '10px',
          border: '1px solid rgba(255,255,255,0.08)',
          transition: 'all 0.2s ease',
        }}
      >
        <div style={{ padding: '0.75rem', borderRadius: '50%', backgroundColor: 'rgba(196, 255, 61, 0.1)' }}>
          <Flame size={22} style={{ color: '#c4ff3d' }} />
        </div>
        <div style={{ textAlign: 'left' }}>
          <span style={{ display: 'block', fontSize: '1rem', fontWeight: 700, color: '#ffffff' }}>Retro Classics Collection</span>
          <span style={{ fontSize: '0.8125rem', color: '#888', marginTop: '0.25rem', display: 'block' }}>Explore iconic 2006-07 Milan & Golden Era vintage kits</span>
        </div>
        <ArrowRight size={18} style={{ marginLeft: 'auto', color: '#c4ff3d' }} />
      </Link>
    </div>
  );
};

const TABS = [
  {
    title: "Club Kits",
    Component: ClubKits,
  },
  {
    title: "Retro Jerseys",
    Component: RetroSets,
  },
].map((n, idx) => ({ ...n, id: idx + 1 }));
