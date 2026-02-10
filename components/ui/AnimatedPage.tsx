import React from 'react';
import { motion, Transition } from 'framer-motion';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  in: { opacity: 1, y: 0 },
  out: { opacity: 0, y: -10 }
};

const pageTransition: Transition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.3
};

interface AnimatedPageProps {
  children: React.ReactNode;
  className?: string;
}

export const AnimatedPage: React.FC<AnimatedPageProps> = ({ children, className = '' }) => {
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
      className={`w-full h-full ${className}`}
    >
      {children}
    </motion.div>
  );
};
