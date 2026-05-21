import React, { forwardRef, useRef, useState, useEffect } from 'react';

type MotionComponent = React.ForwardRefExoticComponent<any & React.RefAttributes<any>>;

const createMotionComponent = (tag: string): MotionComponent => {
  return forwardRef((props: any, ref: any) => {
    const {
      initial, animate, exit, transition, variants,
      whileHover, whileTap, whileInView, whileFocus, whileDrag,
      viewport, onAnimationStart, onAnimationComplete,
      layout, layoutId, drag, dragConstraints,
      ...domProps
    } = props;
    return React.createElement(tag, { ...domProps, ref });
  });
};

const motionHandler: ProxyHandler<any> = {
  get(_target, prop: string) {
    return createMotionComponent(prop);
  },
};

export const motion = new Proxy({}, motionHandler);

export const AnimatePresence: React.FC<{ children?: React.ReactNode; mode?: string; initial?: boolean }> = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};

export function useInView(ref?: any, options?: any) {
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const target = ref?.current;
    if (!target || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: options?.amount ?? 0, ...(options?.once ? {} : {}) }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, []);
  return inView;
}

export function useAnimation() {
  return {
    start: () => Promise.resolve(),
    stop: () => {},
    set: () => {},
  };
}

export function useMotionValue(initial: number) {
  return {
    get: () => initial,
    set: () => {},
    onChange: () => () => {},
  };
}

export function useTransform(value: any, input: any, output: any) {
  return { get: () => output?.[0] ?? 0, onChange: () => () => {} };
}

export function useSpring(value: any) {
  return value;
}

export function useScroll() {
  return {
    scrollY: { get: () => 0, onChange: () => () => {} },
    scrollX: { get: () => 0, onChange: () => () => {} },
    scrollYProgress: { get: () => 0, onChange: () => () => {} },
    scrollXProgress: { get: () => 0, onChange: () => () => {} },
  };
}

export const LayoutGroup: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return React.createElement(React.Fragment, null, children);
};

export const Reorder = {
  Group: forwardRef(({ children, ...props }: any, ref: any) => React.createElement('ul', { ...props, ref }, children)),
  Item: forwardRef(({ children, ...props }: any, ref: any) => React.createElement('li', { ...props, ref }, children)),
};
