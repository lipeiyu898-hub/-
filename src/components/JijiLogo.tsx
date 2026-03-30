import React from 'react';
import { cn } from '../lib/utils';
import HamsterIcon from './HamsterIcon';

const JijiLogo = ({ className, size = "h-8" }: { className?: string, size?: string }) => (
  <div className={cn("relative inline-flex items-center justify-center", className)}>
    <HamsterIcon className={cn("object-contain", size)} />
  </div>
);

export default JijiLogo;
