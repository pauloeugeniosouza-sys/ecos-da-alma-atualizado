import React, { useEffect, useRef, useState } from 'react';
import { LrcLine, parseLrc } from '@/lib/lrcParser';
import { ScrollArea } from '@/components/ui/scroll-area';

interface KaraokeProps {
  songName: string;
  currentTime: number;
  language: 'pt' | 'en';
  isVisible: boolean;
}

export const Karaoke: React.FC<KaraokeProps> = ({ songName, currentTime, language, isVisible }) => {
  const [lyrics, setLyrics] = useState<LrcLine[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLyrics = async () => {
      try {
        const langSuffix = language.toUpperCase();
        const response = await fetch(`/Lyrics/${songName}-${langSuffix}.lrc`);
        if (response.ok) {
          const text = await response.text();
          setLyrics(parseLrc(text));
        } else {
          setLyrics([]);
        }
      } catch (error) {
        console.error('Error loading lyrics:', error);
        setLyrics([]);
      }
    };

    if (songName) {
      fetchLyrics();
    }
  }, [songName, language]);

  useEffect(() => {
    const index = lyrics.findIndex((line, i) => {
      const nextLine = lyrics[i + 1];
      return currentTime >= line.time && (!nextLine || currentTime < nextLine.time);
    });
    setActiveIndex(index);
  }, [currentTime, lyrics]);

  useEffect(() => {
    if (activeLineRef.current && isVisible) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, isVisible]);

  if (!isVisible || lyrics.length === 0) return null;

  return (
    <div className="mt-4 p-4 rounded-lg bg-slate-900/80 border border-cyan-500/30 max-h-60 overflow-hidden">
      <ScrollArea className="h-48 pr-4" ref={scrollRef}>
        <div className="flex flex-col items-center space-y-4 py-10">
          {lyrics.map((line, index) => (
            <div
              key={index}
              ref={index === activeIndex ? activeLineRef : null}
              className={`text-center transition-all duration-300 text-lg md:text-xl font-medium ${
                index === activeIndex
                  ? 'text-cyan-300 scale-110 glow-cyan'
                  : 'text-slate-500 opacity-50'
              }`}
            >
              {line.text}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
