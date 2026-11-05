import React, { type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import { SheetClose } from "@/components/ui/sheet";
import { TimelineAnimation } from "@/components/ui/hero-financial-utils/timeline-animation";
import MotionDrawer from "@/components/ui/hero-financial-utils/motion-drawer";

const NAV = [
  { label: "Features", href: "#features" },
  { label: "Sample", to: "/sample" },
] as const;

const darkBtn =
  "bg-neutral-900 text-white px-3 py-2.5 flex gap-1 items-center rounded-xl font-bold text-sm hover:bg-black transition shadow-[inset_2px_2px_5px_0px_rgba(0,0,0,0.5),inset_-2px_-2px_6px_1px_rgba(80,78,78,0.5)]";

/** Forwards extra props so `SheetClose asChild` can attach its close handler. */
function NavItem({
  item,
  ...props
}: {
  item: (typeof NAV)[number];
  className: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
}) {
  return "to" in item ? (
    <Link to={item.to} {...props}>
      {item.label}
    </Link>
  ) : (
    <a href={item.href} {...props}>
      {item.label}
    </a>
  );
}

/**
 * Landing hero adapted from 21st.dev's "hero-financial" for OctoOdds: same
 * layout and staggered entrance, with the app's own links, copy and a live
 * product preview in place of the placeholder dashboard image.
 */
export const HeroFinancial = ({
  appLabel,
  appTo,
  preview,
}: {
  /** "Log in" for visitors, "Open app" once signed in. */
  appLabel: string;
  appTo: "/login" | "/calculator";
  /** Rendered inside the frosted product frame below the copy. */
  preview?: ReactNode;
}) => {
  const timelineRef = React.useRef<HTMLElement>(null);

  return (
    <section
      ref={timelineRef}
      className="relative flex min-h-screen flex-col items-center overflow-hidden bg-[#f7f9fc] pb-16 text-[#1e293b]"
    >
      <svg
        width="358"
        height="483"
        viewBox="0 0 358 483"
        className="absolute left-0 top-0 z-1"
        fill="none"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g filter="url(#hero_blur_a)">
          <rect
            x="-86.9961"
            y="-33.114"
            width="72"
            height="541"
            rx="36"
            transform="rotate(-30.8182 -86.9961 -33.114)"
            fill="url(#hero_grad_a)"
          />
        </g>
        <g filter="url(#hero_blur_b)">
          <rect
            x="-17"
            y="-135.113"
            width="50.0937"
            height="541"
            rx="25.0469"
            transform="rotate(-30.8182 -17 -135.113)"
            fill="url(#hero_grad_b)"
          />
        </g>
        <defs>
          <filter
            id="hero_blur_a"
            x="-137.641"
            y="-120.646"
            width="440.285"
            height="602.787"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="32" result="effect1_foregroundBlur" />
          </filter>
          <filter
            id="hero_blur_b"
            x="-71.707"
            y="-215.486"
            width="429.598"
            height="599.69"
            filterUnits="userSpaceOnUse"
            colorInterpolationFilters="sRGB"
          >
            <feFlood floodOpacity="0" result="BackgroundImageFix" />
            <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
            <feGaussianBlur stdDeviation="32" result="effect1_foregroundBlur" />
          </filter>
          <linearGradient
            id="hero_grad_a"
            x1="-50.9961"
            y1="-33.114"
            x2="-50.9961"
            y2="507.886"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#91bbfb" />
            <stop offset="1" stopColor="#E6F1FF" />
          </linearGradient>
          <linearGradient
            id="hero_grad_b"
            x1="8.04686"
            y1="-135.113"
            x2="8.04686"
            y2="405.887"
            gradientUnits="userSpaceOnUse"
          >
            <stop stopColor="#8dbafd" />
            <stop offset="1" stopColor="#c1d9f8" />
          </linearGradient>
        </defs>
      </svg>

      {/* Soft background gradient */}
      <TimelineAnimation
        timelineRef={timelineRef}
        animationNum={5}
        className="absolute left-0 top-0 h-[600px] w-full bg-linear-to-b from-blue-50 via-blue-100 to-transparent"
      />

      {/* Mobile bar */}
      <div className="relative z-10 flex w-full items-center justify-between gap-4 px-5 pt-4 md:hidden">
        <MotionDrawer
          direction="left"
          width={300}
          contentClassName="bg-white border-r border-neutral-200 text-black"
          btnClassName="bg-white text-black relative w-fit p-2 rounded-full shadow-xs border border-neutral-200"
        >
          <nav className="space-y-4">
            <img src="/octoodds-logo.png" alt="OctoOdds" className="h-9 w-auto" />
            {NAV.map((item) => (
              <SheetClose asChild key={item.label}>
                <NavItem
                  item={item}
                  className="block rounded-sm p-2 hover:bg-neutral-200 hover:text-black"
                />
              </SheetClose>
            ))}
            <SheetClose asChild>
              <Link
                to={appTo}
                className="block rounded-sm p-2 hover:bg-neutral-200 hover:text-black"
              >
                {appLabel}
              </Link>
            </SheetClose>
          </nav>
        </MotionDrawer>
        <Link to={appTo} className={darkBtn}>
          {appLabel} <ChevronRight size={20} />
        </Link>
      </div>

      {/* Desktop header */}
      <header className="relative z-10 mx-auto mt-4 hidden w-full max-w-7xl p-2 md:block">
        <TimelineAnimation
          animationNum={1}
          timelineRef={timelineRef}
          className="flex items-center justify-between rounded-xl border border-white bg-white/80 p-2 shadow-sm backdrop-blur-xl"
        >
          <Link to="/" className="flex items-center gap-2">
            <img src="/octoodds-logo.png" alt="OctoOdds" className="h-9 w-auto" />
          </Link>
          <nav className="flex items-center gap-10 text-sm font-semibold text-neutral-500">
            {NAV.map((item) => (
              <NavItem key={item.label} item={item} className="transition hover:text-[#3b82f6]" />
            ))}
          </nav>
          <Link to={appTo} className={darkBtn}>
            {appLabel} <ChevronRight size={20} />
          </Link>
        </TimelineAnimation>
      </header>

      {/* Hero content */}
      <div className="relative z-10 flex flex-col gap-6 px-4 pb-10 pt-16 text-center md:pt-24">
        <TimelineAnimation
          animationNum={1}
          timelineRef={timelineRef}
          className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border-2 border-white bg-white px-1.5 py-1 text-black shadow-lg shadow-blue-500/20"
        >
          <span className="rounded-full bg-linear-to-br from-blue-500 to-blue-200 px-2 py-0.5 text-xs font-medium uppercase tracking-widest text-white">
            New
          </span>
          <span className="text-sm font-medium">Live odds scanner + cover calculator</span>
        </TimelineAnimation>

        <TimelineAnimation
          as="h1"
          animationNum={2}
          timelineRef={timelineRef}
          className="mx-auto max-w-6xl text-5xl font-medium tracking-tight text-neutral-900 sm:text-6xl md:text-8xl"
        >
          Cover every outcome. <br /> Know your edge.
        </TimelineAnimation>

        <TimelineAnimation
          as="p"
          animationNum={3}
          timelineRef={timelineRef}
          className="mx-auto max-w-3xl px-4 text-xl font-medium leading-relaxed text-neutral-500 md:text-2xl"
        >
          OctoOdds scans bookmaker odds, finds dutching and arbitrage combos, and plans your stakes
          across every result. Analytics only — no bets are placed on OctoOdds.
        </TimelineAnimation>

        <TimelineAnimation
          animationNum={4}
          timelineRef={timelineRef}
          className="flex flex-wrap justify-center gap-4"
        >
          <Link
            to={appTo}
            className="rounded-lg border border-blue-300 bg-linear-to-br from-blue-500 via-blue-400 to-blue-200 px-4 py-2.5 text-xl text-white shadow-sm transition hover:brightness-105"
          >
            {appLabel}
          </Link>
          <Link
            to="/sample"
            className="rounded-lg border border-neutral-300 bg-linear-to-br from-neutral-50 via-neutral-100 to-neutral-300 px-4 py-2.5 text-xl text-black shadow-sm transition hover:brightness-95"
          >
            View sample
          </Link>
        </TimelineAnimation>
      </div>

      {/* Product frame */}
      {preview && (
        <div className="relative z-10 mx-auto mt-4 w-full max-w-5xl px-3">
          <TimelineAnimation
            animationNum={6}
            timelineRef={timelineRef}
            className="rounded-2xl bg-white/50 p-3 shadow-xl shadow-blue-500/10 backdrop-blur-lg sm:p-4"
          >
            {preview}
          </TimelineAnimation>
        </div>
      )}
    </section>
  );
};

export default HeroFinancial;
