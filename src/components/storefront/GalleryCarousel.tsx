"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";

type GalleryImage = {
  id: string;
  url: string;
  alt: string | null;
};

const SCROLL_SPEED_PX_PER_SEC = 36;
const RESUME_AFTER_MS = 10000;

export function GalleryCarousel({ images }: { images: GalleryImage[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const autoScrollPausedRef = useRef(false);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const slides = images.length > 1 ? [...images, ...images] : images;

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

  useEffect(() => {
    if (images.length <= 1) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) return;

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const el = scrollRef.current;
      if (el && !autoScrollPausedRef.current) {
        const loopWidth = el.scrollWidth / 2;
        if (loopWidth > 0) {
          const deltaSec = (now - lastTime) / 1000;
          el.scrollLeft += SCROLL_SPEED_PX_PER_SEC * deltaSec;
          if (el.scrollLeft >= loopWidth) {
            el.scrollLeft -= loopWidth;
          }
        }
      }
      lastTime = now;
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [images.length]);

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
        onPointerDown={pauseAutoScroll}
        onTouchStart={pauseAutoScroll}
        onWheel={pauseAutoScroll}
        className="flex gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {slides.map((img, index) => (
          <div
            key={`${img.id}-${index}`}
            data-gallery-slide
            className="relative aspect-square w-[calc(50%-8px)] shrink-0 overflow-hidden rounded-2xl md:w-[calc(25%-12px)]"
          >
            <Image src={img.url} alt={img.alt ?? "Bakery creation"} fill className="object-cover" unoptimized />
          </div>
        ))}
      </div>
    </div>
  );
}
