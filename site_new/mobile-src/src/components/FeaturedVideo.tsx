import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { featuredVideo } from '../data';
export function FeaturedVideo() {
  const [isPlaying, setIsPlaying] = useState(false);
  if (!featuredVideo) return null;
  const { youtubeId, tag, title, subtitle } = featuredVideo;
  const thumbnail = `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`;
  return (
    <motion.section
      initial={{
        opacity: 0,
        y: 12
      }}
      animate={{
        opacity: 1,
        y: 0
      }}
      transition={{
        duration: 0.4
      }}
      className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface shadow-float"
      aria-label="Featured promo video">
      
      <div className="relative aspect-video bg-black">
        {isPlaying ?
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen /> :


        <button
          type="button"
          onClick={() => setIsPlaying(true)}
          className="group absolute inset-0 h-full w-full focus:outline-none"
          aria-label={`Play video: ${title}`}>
          
            <img
            src={thumbnail}
            alt=""
            className="absolute inset-0 h-full w-full object-cover"
            onError={(e) => {
              // maxres isn't always available — fall back to hqdefault.
              e.currentTarget.src = `https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`;
            }} />
          
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/20" />

            <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
              {tag}
            </span>

            <motion.span
            whileHover={{
              scale: 1.08
            }}
            whileTap={{
              scale: 0.95
            }}
            className="absolute left-1/2 top-1/2 flex h-14 w-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-black shadow-lg">
            
              <Play size={22} className="ml-0.5 fill-current" />
            </motion.span>

            <div className="absolute inset-x-0 bottom-0 p-3 text-left">
              <h3 className="text-sm font-bold leading-tight text-white">
                {title}
              </h3>
              <p className="mt-0.5 text-xs text-white/80">{subtitle}</p>
            </div>
          </button>
        }
      </div>
    </motion.section>);

}