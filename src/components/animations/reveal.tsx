import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";

const revealEase = [0.22, 1, 0.36, 1] as const;
const revealRootMargin = "0px 0px -80px 0px";
const revealThreshold = 0.08;

const motionElements = {
  article: motion.article,
  div: motion.div,
  h1: motion.h1,
  h2: motion.h2,
  li: motion.li,
  ol: motion.ol,
  p: motion.p,
  section: motion.section,
  span: motion.span,
  ul: motion.ul,
} as const;

type MotionElement = keyof typeof motionElements;

type SharedMotionProps = Omit<
  HTMLMotionProps<"div">,
  "animate" | "children" | "initial" | "transition" | "variants" | "viewport" | "whileInView"
>;

type RevealProps = SharedMotionProps & {
  as?: MotionElement;
  blur?: boolean;
  children: ReactNode;
  delay?: number;
  duration?: number;
  immediate?: boolean;
  mask?: boolean;
  scale?: number;
  staggerItem?: boolean;
};

type StaggerContainerProps = SharedMotionProps & {
  as?: MotionElement;
  children: ReactNode;
  delay?: number;
  immediate?: boolean;
  stagger?: number;
};

function useRevealObserver(disabled = false, immediate = false) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(disabled || immediate);

  useEffect(() => {
    if (disabled || immediate) {
      setVisible(true);
      return;
    }

    const node = ref.current;
    if (!node) return;

    const revealIfInViewport = () => {
      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      const viewportWidth = window.innerWidth || document.documentElement.clientWidth;

      if (
        rect.top < viewportHeight + 80 &&
        rect.bottom > -80 &&
        rect.left < viewportWidth + 80 &&
        rect.right > -80
      ) {
        setVisible(true);
      }
    };

    const frame = window.requestAnimationFrame(revealIfInViewport);
    const fallback = window.setTimeout(revealIfInViewport, 180);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      {
        root: null,
        rootMargin: revealRootMargin,
        threshold: revealThreshold,
      },
    );

    observer.observe(node);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(fallback);
      observer.disconnect();
    };
  }, [disabled, immediate]);

  return [ref, visible] as const;
}

export function Reveal({
  as = "div",
  blur = true,
  children,
  delay = 0,
  duration = 0.64,
  immediate = false,
  mask = false,
  scale = 1,
  staggerItem = false,
  style,
  ...props
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const MotionComponent = motionElements[as] as ElementType;
  const showImmediately = Boolean(reduceMotion) || immediate;
  const [ref, visible] = useRevealObserver(showImmediately || staggerItem, immediate);

  const variants: Variants = reduceMotion
    ? {
        hidden: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
        show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
      }
    : {
        hidden: {
          opacity: 0,
          y: 24,
          scale,
          clipPath: mask ? "inset(0 0 28% 0 round 8px)" : undefined,
          filter: blur ? "blur(6px)" : "blur(0px)",
        },
        show: {
          opacity: 1,
          y: 0,
          scale: 1,
          clipPath: mask ? "inset(0 0 0% 0 round 8px)" : undefined,
          filter: "blur(0px)",
          transition: { delay, duration, ease: revealEase },
        },
      };

  return (
    <MotionComponent
      ref={staggerItem ? undefined : ref}
      initial={staggerItem ? undefined : immediate ? false : "hidden"}
      animate={staggerItem ? undefined : visible ? "show" : "hidden"}
      variants={variants}
      style={{
        willChange: reduceMotion ? undefined : "opacity, transform, filter, clip-path",
        ...style,
      }}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

export function StaggerContainer({
  as = "div",
  children,
  delay = 0,
  immediate = false,
  stagger = 0.14,
  ...props
}: StaggerContainerProps) {
  const reduceMotion = useReducedMotion();
  const MotionComponent = motionElements[as] as ElementType;
  const [ref, visible] = useRevealObserver(Boolean(reduceMotion) || immediate, immediate);

  const variants: Variants = reduceMotion
    ? { hidden: {}, show: {} }
    : {
        hidden: {},
        show: {
          transition: {
            delayChildren: delay,
            staggerChildren: stagger,
          },
        },
      };

  return (
    <MotionComponent
      ref={ref}
      initial={immediate ? false : "hidden"}
      animate={visible ? "show" : "hidden"}
      variants={variants}
      {...props}
    >
      {children}
    </MotionComponent>
  );
}

export function ScrollProgress() {
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    damping: 28,
    mass: 0.25,
    stiffness: 160,
  });

  if (reduceMotion) {
    return null;
  }

  return (
    <motion.div
      aria-hidden="true"
      className="fixed left-0 top-0 z-50 h-[3px] w-full origin-left bg-[color:var(--color-accent)]"
      style={{ scaleX }}
    />
  );
}
