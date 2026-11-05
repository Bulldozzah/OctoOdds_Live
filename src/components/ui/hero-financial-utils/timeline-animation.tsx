import { useEffect, useState, type HTMLAttributes, type RefObject } from "react";

type Tag = "div" | "header" | "h1" | "h2" | "p" | "span";

/** True once `ref` scrolls into view (immediately when the user prefers reduced motion). */
function useInViewOnce(ref: RefObject<HTMLElement | null>) {
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!el || reduced || typeof IntersectionObserver === "undefined") {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref]);
  return seen;
}

/**
 * Blur-and-fade entrance, staggered by `animationNum`, triggered when the
 * shared `timelineRef` scrolls into view. Dependency-free stand-in for the
 * framer-motion version the original component used.
 */
export function TimelineAnimation({
  as = "div",
  animationNum,
  timelineRef,
  style,
  children,
  ...rest
}: {
  as?: Tag;
  animationNum: number;
  timelineRef: RefObject<HTMLElement | null>;
} & HTMLAttributes<HTMLElement>) {
  const seen = useInViewOnce(timelineRef);
  const delay = `${animationNum * 0.15}s`;
  const El = as;
  return (
    <El
      {...rest}
      style={{
        ...style,
        opacity: seen ? 1 : 0,
        filter: seen ? "blur(0px)" : "blur(10px)",
        transform: seen ? "none" : "translateY(-20px)",
        transition: `opacity 0.5s ease ${delay}, filter 0.5s ease ${delay}, transform 0.5s ease ${delay}`,
      }}
    >
      {children}
    </El>
  );
}
