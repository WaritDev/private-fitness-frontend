'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

type Slide = {
    img: string;
    heading?: string;
    sub?: string;
    ctaPrimary?: { href: string; label: string };
    ctaSecondary?: { href: string; label: string };
};

export default function HeroCarousel({
    slides,
    interval = 5000,
}: {
    slides: Slide[];
    interval?: number;
}) {
    const [index, setIndex] = useState(0);
    const timer = useRef<number | null>(null);
    const count = slides.length;

    const go = (next: number) => setIndex((p) => (p + next + count) % count);
    const goTo = (i: number) => setIndex(i);

    useEffect(() => {
        stop();
        timer.current = window.setInterval(() => go(1), interval);
        return stop;
    }, [index, interval]);

    const stop = () => {
        if (timer.current) {
        clearInterval(timer.current);
        timer.current = null;
        }
    };

    const s = slides[index];

    return (
        <div className="carousel container" onMouseEnter={stop} onMouseLeave={() => (timer.current = window.setInterval(() => go(1), interval))}>
        <div className="carousel-stage">
            <Image src={s.img} alt={s.heading ?? 'slide'} fill priority sizes="100vw" style={{ objectFit: 'cover' }} />
            <div className="carousel-panel">
            {s.heading && <h1 className="hero-heading">{s.heading}</h1>}
            {s.sub && <p className="hero-desc">{s.sub}</p>}
            <div className="hero-actions">
                {s.ctaPrimary && (
                <Link href={s.ctaPrimary.href} className="button">
                    {s.ctaPrimary.label}
                </Link>
                )}
                {s.ctaSecondary && (
                <Link href={s.ctaSecondary.href} className="button-outline inverse">
                    {s.ctaSecondary.label}
                </Link>
                )}
            </div>
            </div>

            <button aria-label="Previous" className="carousel-nav prev" onClick={() => go(-1)}>
            ‹
            </button>
            <button aria-label="Next" className="carousel-nav next" onClick={() => go(1)}>
            ›
            </button>
        </div>

        <div className="carousel-dots">
            {slides.map((_, i) => (
            <button
                key={i}
                aria-label={`Go to slide ${i + 1}`}
                className={`dot ${i === index ? 'active' : ''}`}
                onClick={() => goTo(i)}
            />
            ))}
        </div>
        </div>
    );
}