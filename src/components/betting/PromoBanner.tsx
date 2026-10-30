import { useEffect, useState } from "react";
import football from "@/assets/promo-football.jpg";
import casino from "@/assets/promo-casino.jpg";

const SLIDES = [
  {
    img: football,
    eyebrow: "Welcome bonus",
    title: "100% up to 5,000",
    text: "Double your first deposit and bet on 1,000+ daily events.",
    cta: "Get bonus",
  },
  {
    img: casino,
    eyebrow: "Casino",
    title: "Free spins every Friday",
    text: "Spin the wheel, play live tables and win big.",
    cta: "Play now",
  },
];

export function PromoBanner() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % SLIDES.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="relative h-40 overflow-hidden rounded-md shadow-card sm:h-48">
      {SLIDES.map((s, idx) => (
        <div
          key={s.title}
          className={`absolute inset-0 transition-opacity duration-700 ${
            idx === i ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <img
            src={s.img}
            alt=""
            width={1600}
            height={640}
            className="h-full w-full object-cover object-right"
          />
          <div className="absolute inset-0 bg-gradient-promo" />
          <div className="absolute inset-y-0 left-0 flex max-w-md flex-col justify-center gap-1.5 px-5 text-header-foreground sm:px-8">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-cta">
              {s.eyebrow}
            </span>
            <h2 className="font-display text-2xl font-bold leading-tight sm:text-3xl">{s.title}</h2>
            <p className="hidden text-sm text-header-muted sm:block">{s.text}</p>
            <button className="btn-cta mt-1 h-9 w-fit px-5 text-xs">{s.cta}</button>
          </div>
        </div>
      ))}
      <div className="absolute bottom-3 right-4 flex gap-1.5">
        {SLIDES.map((s, idx) => (
          <button
            key={s.title}
            aria-label={`Show slide ${idx + 1}`}
            onClick={() => setI(idx)}
            className={`h-1.5 rounded-full transition-all ${
              idx === i ? "w-6 bg-cta" : "w-1.5 bg-header-muted"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
