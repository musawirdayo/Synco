import type { ElementType, ReactNode } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  type HTMLMotionProps,
  type Variants,
} from "framer-motion";

const revealEase = [0.22, 1, 0.36, 1] as const;
const revealViewport = { once: true, amount: 0.22, margin: "0px 0px -120px" };

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
  mask?: boolean;
  scale?: number;
  staggerItem?: boolean;
};

type StaggerContainerProps = SharedMotionProps & {
  as?: MotionElement;
  children: ReactNode;
  delay?: number;
  stagger?: number;
};

export function Reveal({
  as = "div",
  blur = true,
  children,
  delay = 0,
  duration = 0.82,
  mask = false,
  scale = 1,
  staggerItem = false,
  style,
  ...props
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const MotionComponent = motionElements[as] as ElementType;

  const variants: Variants = reduceMotion
    ? {
        hidden: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
        show: { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" },
      }
    : {
        hidden: {
          opacity: 0,
          y: 34,
          scale,
          clipPath: mask ? "inset(0 0 28% 0 round 8px)" : undefined,
          filter: blur ? "blur(10px)" : "blur(0px)",
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
      initial={staggerItem ? undefined : "hidden"}
      whileInView={staggerItem ? undefined : "show"}
      viewport={staggerItem ? undefined : revealViewport}
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
  stagger = 0.14,
  ...props
}: StaggerContainerProps) {
  const reduceMotion = useReducedMotion();
  const MotionComponent = motionElements[as] as ElementType;

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
      initial="hidden"
      whileInView="show"
      viewport={revealViewport}
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
