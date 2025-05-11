"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Users } from "lucide-react";

interface AvatarData {
  src?: string;
  alt: string;
  name: string;
  initials: string;
}

interface TrustedAvatarGroupProps {
  avatars?: AvatarData[];
  maxVisible?: number;
  totalCount?: number;
  className?: string;
  showTooltips?: boolean;
}

const DEFAULT_AVATARS: AvatarData[] = [
  {
    src: "https://randomuser.me/api/portraits/women/17.jpg",
    alt: "Emma Johnson",
    name: "Emma Johnson",
    initials: "EJ",
  },
  {
    src: "https://randomuser.me/api/portraits/men/32.jpg",
    alt: "John Doe",
    name: "John Doe",
    initials: "JD",
  },
  {
    src: "https://randomuser.me/api/portraits/women/44.jpg",
    alt: "Sarah Smith",
    name: "Sarah Smith",
    initials: "SS",
  },
  {
    src: "https://randomuser.me/api/portraits/men/91.jpg",
    alt: "Alex Wong",
    name: "Alex Wong",
    initials: "AW",
  },
  {
    src: "https://randomuser.me/api/portraits/women/63.jpg",
    alt: "Lisa Chen",
    name: "Lisa Chen",
    initials: "LC",
  },
  {
    src: "https://randomuser.me/api/portraits/men/54.jpg",
    alt: "Michael Brown",
    name: "Michael Brown",
    initials: "MB",
  },
];

export function TrustedAvatarGroup({
  avatars = DEFAULT_AVATARS,
  maxVisible = 5,
  totalCount = 75000,
  className,
  showTooltips = true,
}: TrustedAvatarGroupProps) {
  const [hoveredIdx, setHoveredIdx] = React.useState<number | null>(null);
  const visibleAvatars = avatars.slice(0, maxVisible);

  const formattedCount = new Intl.NumberFormat().format(totalCount);

  return (
    <div className={cn("flex flex-col sm:flex-row items-center gap-3", className)}>
      <div className="flex items-center">
        {showTooltips ? (
          <TooltipProvider delayDuration={300}>
            <div className="flex">
              {visibleAvatars.map((avatar, index) => (
                <Tooltip key={index}>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "relative hover:z-10 transition-transform duration-200 hover:-translate-y-1",
                        index > 0 && "-ml-3"
                      )}
                      onMouseEnter={() => setHoveredIdx(index)}
                      onMouseLeave={() => setHoveredIdx(null)}
                    >
                      <Avatar className="border-2 border-background shadow-sm">
                        <AvatarImage src={avatar.src} alt={avatar.alt} />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {avatar.initials}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="font-medium">
                    {avatar.name}
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </TooltipProvider>
        ) : (
          <div className="flex">
            {visibleAvatars.map((avatar, index) => (
              <div
                key={index}
                className={cn(
                  "relative hover:z-10 transition-transform duration-200 hover:-translate-y-1",
                  index > 0 && "-ml-3"
                )}
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                <Avatar className="border-2 border-background shadow-sm">
                  <AvatarImage src={avatar.src} alt={avatar.alt} />
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {avatar.initials}
                  </AvatarFallback>
                </Avatar>
                <AnimatePresence>
                  {hoveredIdx === index && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: -5 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute z-20 left-1/2 -translate-x-1/2 px-2 py-1 bg-background border text-xs rounded-md shadow-md whitespace-nowrap"
                    >
                      {avatar.name}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <div className="flex items-center justify-center bg-primary/10 rounded-full p-1.5">
          <Users size={16} className="text-primary" />
        </div>
        <p className="text-sm font-medium">
          Trusted by <span className="font-bold">{formattedCount}+</span> job seekers
        </p>
      </div>
    </div>
  );
}

export default TrustedAvatarGroup; 