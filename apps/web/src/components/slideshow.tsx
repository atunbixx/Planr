"use client";

import { useEffect, useState } from "react";

type Slide = { url: string; caption: string | null };

export function Slideshow({ slides }: { slides: Slide[] }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const t = setInterval(() => setI((p) => (p + 1) % slides.length), 4000);
    return () => clearInterval(t);
  }, [slides.length]);

  if (slides.length === 0) {
    return <p className="slide-empty">No photos yet — check back after the celebration.</p>;
  }
  const current = slides[i]!;

  return (
    <div className="slideshow">
      <div className="slide-stage">
        <img key={current.url} src={current.url} alt={current.caption ?? "Photo"} />
      </div>
      {current.caption ? <p className="slide-cap">{current.caption}</p> : null}
      <div className="slide-dots" aria-hidden="true">
        {slides.map((s, k) => (
          <span key={s.url} data-on={k === i} />
        ))}
      </div>
    </div>
  );
}
