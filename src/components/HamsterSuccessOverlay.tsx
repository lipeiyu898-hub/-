import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface HamsterSuccessOverlayProps {
  type: 'saving' | 'expense';
  open: boolean;
  onFinish?: () => void;
}

const HamsterSuccessOverlay: React.FC<HamsterSuccessOverlayProps> = ({ type, open, onFinish }) => {
  const [show, setShow] = useState(open);

  useEffect(() => {
    setShow(open);
    if (open) {
      const timer = setTimeout(() => {
        setShow(false);
        if (onFinish) onFinish();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [open, onFinish]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/10 backdrop-blur-[1px] pointer-events-none"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: -20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 400 }}
            className="bg-white/95 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-xl flex flex-col items-center gap-4 border border-white/80"
          >
            <div className="relative w-40 h-40">
              <HamsterAnimation type={type} />
            </div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold text-[#2D2D2D] tracking-tight"
            >
              {type === 'saving' ? '存钱成功' : '支出成功'}
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const HamsterAnimation: React.FC<{ type: 'saving' | 'expense' }> = ({ type }) => {
  return (
    <svg viewBox="0 0 200 200" className="w-full h-full">
      {/* Body Outline - Thick and Rounded */}
      <motion.path
        d="M45 120 C45 75 70 65 100 65 C130 65 155 75 155 120 C155 165 130 175 100 175 C70 175 45 165 45 120 Z"
        fill="#3d1a11"
        animate={{
          scale: [1, 1.02, 1],
          y: [0, -2, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut"
        }}
      />
      {/* Main Body - Light Beige Top */}
      <motion.path
        d="M50 120 C50 80 75 70 100 70 C125 70 150 80 150 120 C150 160 125 170 100 170 C75 170 50 160 50 120 Z"
        fill="#f7c694"
        animate={{
          scale: [1, 1.02, 1],
          y: [0, -2, 0]
        }}
        transition={{
          repeat: Infinity,
          duration: 2,
          ease: "easeInOut"
        }}
      />
      {/* White Bottom Area */}
      <motion.path
        d="M50 135 C50 170 75 170 100 170 C125 170 150 170 150 135 C150 125 100 125 50 135 Z"
        fill="white"
        animate={type === 'saving' ? {
          scaleX: [1, 1.05, 1],
          scaleY: [1, 1.02, 1]
        } : {}}
        transition={{
          repeat: Infinity,
          duration: 0.4,
          ease: "easeInOut"
        }}
        style={{ originX: "50%", originY: "70%" }}
      />
      
      {/* Ears - Small and Rounded */}
      <g>
        <circle cx="70" cy="75" r="12" fill="#3d1a11" />
        <circle cx="70" cy="75" r="8" fill="#f7c694" />
        <circle cx="130" cy="75" r="12" fill="#3d1a11" />
        <circle cx="130" cy="75" r="8" fill="#f7c694" />
      </g>

      {/* Eyes - Tiny and Black */}
      <g>
        <circle cx="85" cy="115" r="6" fill="#3d1a11" />
        <circle cx="87" cy="113" r="1.5" fill="white" />
        
        <circle cx="115" cy="115" r="6" fill="#3d1a11" />
        <circle cx="117" cy="113" r="1.5" fill="white" />
      </g>

      {/* Mouth - Tiny 'w' shape */}
      <motion.path
        d={type === 'saving' ? "M97 128 Q100 131 103 128" : "M97 130 L103 130"}
        fill="none"
        stroke="#3d1a11"
        strokeWidth="2"
        strokeLinecap="round"
        animate={type === 'saving' ? {
          d: [
            "M97 128 Q100 131 103 128",
            "M97 130 Q100 127 103 130",
            "M97 128 Q100 131 103 128"
          ]
        } : {}}
        transition={{
          repeat: Infinity,
          duration: 0.4,
          ease: "easeInOut"
        }}
      />

      {/* Paws - Tiny and Simple */}
      <path d="M85 145 Q82 148 85 151" fill="none" stroke="#3d1a11" strokeWidth="3" strokeLinecap="round" />
      <path d="M115 145 Q118 148 115 151" fill="none" stroke="#3d1a11" strokeWidth="3" strokeLinecap="round" />
      
      {/* Feet */}
      <path d="M75 170 Q70 175 78 175" fill="none" stroke="#3d1a11" strokeWidth="3" strokeLinecap="round" />
      <path d="M125 170 Q130 175 122 175" fill="none" stroke="#3d1a11" strokeWidth="3" strokeLinecap="round" />

      {/* Expense Particles */}
      {type === 'expense' && (
        <g>
          {[...Array(5)].map((_, i) => (
            <motion.circle
              key={i}
              r="2"
              fill="#3d1a11"
              initial={{ x: 100, y: 130, opacity: 1 }}
              animate={{
                x: 100 + (Math.random() - 0.5) * 60,
                y: 130 + Math.random() * 60,
                opacity: 0
              }}
              transition={{
                repeat: Infinity,
                duration: 0.8,
                delay: i * 0.1,
                ease: "easeOut"
              }}
            />
          ))}
        </g>
      )}
    </svg>
  );
};

export default HamsterSuccessOverlay;
