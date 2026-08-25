import React, { ReactNode, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FaXmark } from 'react-icons/fa6';
import './modals-shared.css';

interface ModalBackdropProps {
  children: ReactNode;
  onClose: () => void;
  onOpen: boolean;
  dismissible?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.22 } },
  exit: { opacity: 0, transition: { duration: 0.18 } },
};

const panelVariants = {
  hidden: { y: 30, opacity: 0, scale: 0.98 },
  visible: { y: 0, opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 320, damping: 28 } },
  exit: { y: 18, opacity: 0, scale: 0.985, transition: { duration: 0.16 } },
};

const FOCUSABLE = [
  'button:not([disabled])',
  '[href]',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const ModalBackdrop: React.FC<ModalBackdropProps> = ({
  children,
  onClose,
  onOpen,
  dismissible = true,
  label = 'Dialog',
  size = 'lg',
}) => {
  const shellRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!onOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusFirstControl = window.requestAnimationFrame(() => {
      const firstControl = shellRef.current?.querySelector<HTMLElement>(FOCUSABLE);
      (firstControl ?? shellRef.current)?.focus();
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !shellRef.current) return;
      const controls = Array.from(shellRef.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (controls.length === 0) {
        event.preventDefault();
        shellRef.current.focus();
        return;
      }
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFirstControl);
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [dismissible, onOpen]);

  const modal = (
    <AnimatePresence>
      {onOpen && (
        <motion.div
          className="modal-backdrop"
          onClick={(event) => {
            if (dismissible && event.target === event.currentTarget) onClose();
          }}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <motion.div
            ref={shellRef}
            className={`modal-shell modal-shell--${size}`}
            onClick={(e) => e.stopPropagation()}
            variants={panelVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-label={label}
            tabIndex={-1}
          >
            {dismissible && (
              <button type="button" className="modal-close" onClick={onClose} aria-label="Close dialog">
                <FaXmark aria-hidden/>
              </button>
            )}
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(modal, document.body);
};

export default ModalBackdrop;
