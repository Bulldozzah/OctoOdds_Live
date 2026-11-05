import type { ReactNode } from "react";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

/**
 * Slide-over menu for the hero's mobile bar, built on the project's shadcn
 * Sheet (Radix Dialog) so focus trapping, Esc and the overlay come for free.
 * Wrap links in `SheetClose asChild` to close the drawer on navigation.
 */
export default function MotionDrawer({
  direction = "left",
  width = 300,
  btnClassName,
  contentClassName,
  children,
}: {
  direction?: "left" | "right";
  width?: number;
  btnClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button aria-label="Open menu" className={btnClassName}>
          <Menu className="h-5 w-5" />
        </button>
      </SheetTrigger>
      <SheetContent side={direction} style={{ width }} className={contentClassName}>
        <SheetTitle className="sr-only">Menu</SheetTitle>
        {children}
      </SheetContent>
    </Sheet>
  );
}
