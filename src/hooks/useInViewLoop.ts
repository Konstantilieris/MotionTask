import { useInView } from "framer-motion";
import React from "react";

export function useInViewLoop(
  duration: number = 1500,
  play = true,
  callback?: () => void
): [boolean, React.RefObject<HTMLDivElement | null>] {
  const [active, setActive] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const isInView = useInView(ref);

  React.useEffect(() => {
    if (!isInView || !play) return;
    const interval = setInterval(() => {
      setActive((a) => !a);
      callback?.();
    }, duration);
    return () => clearInterval(interval);
  }, [play, isInView]);

  return [active, ref];
}
