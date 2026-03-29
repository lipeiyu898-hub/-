import React from 'react';
import { cn } from './lib/utils';

const JijiLogo = ({ className, size = "text-lg" }: { className?: string, size?: string }) => (
  <div className={cn("relative inline-flex items-center", className)}>
    <img 
      src="https://ais-pre-qku6gadykrirhc6fuikqpw-489700228125.us-east1.run.app/logo.png" 
      alt="Jiji Logo" 
      className={cn("object-contain", size.includes('text-') ? size.replace('text-', 'h-') : 'h-8')}
      referrerPolicy="no-referrer"
      onError={(e) => {
        // Fallback to a local path if the absolute URL fails
        (e.target as HTMLImageElement).src = '/logo.png';
      }}
    />
  </div>
);

export default JijiLogo;
