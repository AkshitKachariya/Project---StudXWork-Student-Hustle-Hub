import React from 'react';
import { motion } from 'framer-motion';

const Logo = ({ className = "", showTagline = false, light = false }) => {
  return (
    <div className={`flex flex-col leading-none ${className}`}>
      <motion.div 
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-center font-black uppercase tracking-tighter text-2xl md:text-3xl"
      >
        <span className={light ? 'text-white' : 'text-brand-dark'}>Stud</span>
        
        <div className="relative mx-1 w-[1.2em] h-[1.2em] flex items-center justify-center">
          {/* The Yellow Box */}
          <motion.div 
            initial={{ scale: 0, rotate: 0 }}
            animate={{ scale: 1, rotate: -3 }}
            transition={{ delay: 0.1 }}
            className="absolute w-full h-full bg-brand-accent border-2 border-brand-dark shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
          />
          {/* The X */}
          <span className="relative z-10 text-brand-primary text-xl">X</span>
        </div>

        <span className={light ? 'text-white' : 'text-brand-dark'}>Work</span>
      </motion.div>
      
      {showTagline && (
        <motion.span 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className={`text-[9px] md:text-[10px] font-bold uppercase tracking-[0.3em] mt-1 ml-0.5 ${light ? 'text-white/60' : 'text-brand-muted'}`}
        >
          Student Hustle Hub
        </motion.span>
      )}
    </div>
  );
};

export default Logo;
