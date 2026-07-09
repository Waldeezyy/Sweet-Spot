"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";

type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
};

const AUTO_SCROLL_MS = 4000;
const RESUME_AFTER_MS = 10000;

export function GalleryCarousel({ images }: { images: GalleryImage[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollPausedRef = useRef(false);
  const isAutoScrollingRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getSlideStep = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return 0;
    const slide = el.querySelector<HTMLElement>("[data-gallery-slide]");
    return (slide?.offsetWidth ?? 0) + 16;
  }, []);

  const pauseAutoScroll = useCallback(() => {
    autoScrollPausedRef.current = true;
    if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    resumeTimerRef.current = setTimeout(() => {
      autoScrollPausedRef.current = false;
    }, RESUME_AFTER_MS);
  }, []);

  const advanceAuto = useCallback(() => {
    const el = scrollRef.current;
    if (!el || autoScrollPausedRef.current) return;

    const step = getSlideStep();
    if (!step) return;

    isAutoScrollingRef.current = true;
    const maxScroll = el.scrollWidth - el.clientWidth;

    if (el.scrollLeft >= maxScroll - 2) {
      el.scrollTo({ left: 0, behavior: "smooth" });
    } else {
      el.scrollBy({ left: step, behavior: "smooth" });
    }

    window.setTimeout(() => {
      isAutoScrollingRef.current = false;
    }, 600);
  }, [getSlideStep]);

  const scrollManual = useCallback(
    (direction: "left" | "right") => {
      const el = scrollRef.current;
      if (!el) return;

      pauseAutoScroll();
      const step = getSlideStep();
      el.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
    },
    [getSlideStep, pauseAutoScroll]
  );

  const handleUserScroll = useCallback(() => {
    if (isAutoScrollingRef.current) return;
    pauseAutoScroll();
  }, [pauseAutoScroll]);

  useEffect(() => {
    if (images.length <= 2) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    const intervalId = window.setInterval(advanceAuto, AUTO_SCROLL_MS);
    return () => window.clearInterval(intervalId);
  }, [images.length, advanceAuto]);

  useEffect(() => {
    return () => {
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, []);

  if (!images.length) return null;

  const showControls = images.length > 2;

  return (
    <div className="relative mt-8">
      {showControls && (
        <>
          <button
            type="button"
            onClick={() => scrollManual("left")}
            className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl text-[var(--chocolate)] shadow-md hover:bg-[var(--cream)] md:flex"
            aria-label="Previous photos"
          >
            ‹
          </button>
          <button
            type="button"
            onClick={() => scrollManual("right")}
            className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-xl text-[var(--chocolate)] shadow-md hover:bg-[var(--cream)] md:flex"
            aria-label="Next photos"
          >
            ›
          </button>
        </>
      )}
      <div
        ref={scrollRef}
        onScroll={handleUserScroll}
        onPointerDown={pauseAutoScroll}
        onTouchStart={pauseAutoScroll}
        className="flex gap-4 overflow-x-auto scroll-smooth pb-2 snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((img) => (
          <div
            key={img.id}
            data-gallery-slide
            className="relative aspect-square w-[calc(50%-8px)] shrink-0 snap-start overflow-hidden rounded-2xl md:w-[calc(25%-12px)]"
          >
            <Image src={img.url} alt={img.alt ?? "Bakery creation"} fill className="object-cover" unoptimized />
          </div>
        ))}
      </div>
    </div>
  );
}
