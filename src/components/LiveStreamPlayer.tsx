import React from 'react';

interface LiveStreamPlayerProps {
  streamUrl?: string;
  streamKey?: string;
  autoPlay?: boolean;
  controls?: boolean;
  className?: string;
  modelId?: string;
  modelName?: string;
  modelPhoto?: string;
}

export function LiveStreamPlayer({ className, ...props }: LiveStreamPlayerProps) {
  return (
    <div className={`flex items-center justify-center bg-black rounded-lg aspect-video ${className ?? ''}`}>
      <p className="text-white text-sm opacity-60">Live Stream Player</p>
    </div>
  );
}

export default LiveStreamPlayer;
