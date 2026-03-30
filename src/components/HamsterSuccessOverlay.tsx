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
      {/* Body Outline */}
      <motion.path
        d="M40 120 C40 70 70 60 100 60 C130 60 160 70 160 120 C160 170 130 180 100 180 C70 180 40 170 40 120 Z"
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
      {/* Main Body */}
      <motion.path
        d="M46 120 C46 76 73 66 100 66 C127 66 154 76 154 120 C154 164 127 174 100 174 C73 174 46 164 46 120 Z"
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
      {/* White Belly */}
      <motion.path
        d="M46 130 C46 170 73 174 100 174 C127 174 154 170 154 130 C154 115 100 115 46 130 Z"
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
      
      {/* Ears */}
      <g>
        <circle cx="65" cy="70" r="15" fill="#3d1a11" />
        <circle cx="65" cy="70" r="10" fill="#f7c694" />
        <circle cx="135" cy="70" r="15" fill="#3d1a11" />
        <circle cx="135" cy="70" r="10" fill="#f7c694" />
      </g>

      {/* Eyes */}
      <g>
        <circle cx="75" cy="115" r="14" fill="#3d1a11" />
        <circle cx="80" cy="110" r="5" fill="white" />
        <circle cx="72" cy="118" r="2" fill="white" />
        
        <circle cx="125" cy="115" r="14" fill="#3d1a11" />
        <circle cx="130" cy="110" r="5" fill="white" />
        <circle cx="122" cy="118" r="2" fill="white" />
      </g>

      {/* Cheeks */}
      <ellipse cx="55" cy="135" rx="12" ry="8" fill="#ffb5a7" opacity="0.6" />
      <ellipse cx="145" cy="135" rx="12" ry="8" fill="#ffb5a7" opacity="0.6" />

      {/* Mouth */}
      <motion.path
        d={type === 'saving' ? "M95 130 Q100 135 105 130" : "M95 130 L105 130"}
        fill="none"
        stroke="#3d1a11"
        strokeWidth="3"
        strokeLinecap="round"
        animate={type === 'saving' ? {
          d: [
            "M95 130 Q100 135 105 130",
            "M95 132 Q100 130 105 132",
            "M95 130 Q100 135 105 130"
          ]
        } : {}}
        transition={{
          repeat: Infinity,
          duration: 0.4,
          ease: "easeInOut"
        }}
      />

      {/* Seed */}
      <motion.g
        animate={type === 'saving' ? {
          y: [0, -3, 0],
          rotate: [0, 2, -2, 0]
        } : {}}
        transition={{
          repeat: Infinity,
          duration: 0.4,
          ease: "easeInOut"
        }}
        style={{ originX: "50%", originY: "75%" }}
      >
        <g transform="translate(100, 150) rotate(10)">
          <path
            d="M0 -15 C10 0 10 15 0 20 C-10 15 -10 0 0 -15 Z"
            fill="#3d1a11"
          />
          <path d="M-4 0 L-4 10 M0 -5 L0 15 M4 0 L4 10" stroke="#f7c694" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      </motion.g>

      {/* Hands */}
      <path d="M80 155 Q75 160 80 165" fill="none" stroke="#3d1a11" strokeWidth="4" strokeLinecap="round" />
      <path d="M120 155 Q125 160 120 165" fill="none" stroke="#3d1a11" strokeWidth="4" strokeLinecap="round" />

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
