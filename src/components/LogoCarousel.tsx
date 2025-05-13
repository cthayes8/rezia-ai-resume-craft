"use client";

import * as React from "react";
import AutoScroll from "embla-carousel-auto-scroll";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";

interface Logo {
  id: string;
  description: string;
  image: string;
  className?: string;
}

interface LogoCarouselProps {
  heading?: string;
  logos?: Logo[];
  className?: string;
}

const LogoCarousel = ({
  heading = "Reslo resumes helped applicants stand out at top companies like...",
  logos = [
    {
      id: "logo-1",
      description: "Google",
      image: "https://www.shadcnblocks.com/images/block/logos/google.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-2",
      description: "Microsoft",
      image: "https://www.shadcnblocks.com/images/block/logos/microsoft.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-3",
      description: "Amazon",
      image: "https://www.shadcnblocks.com/images/block/logos/amazon.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-4",
      description: "Apple",
      image: "https://www.shadcnblocks.com/images/block/logos/apple.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-5",
      description: "Meta",
      image: "https://www.shadcnblocks.com/images/block/logos/meta.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-6",
      description: "Netflix",
      image: "https://www.shadcnblocks.com/images/block/logos/netflix.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-7",
      description: "Tesla",
      image: "https://www.shadcnblocks.com/images/block/logos/tesla.svg",
      className: "h-7 w-auto",
    },
    {
      id: "logo-8",
      description: "IBM",
      image: "https://www.shadcnblocks.com/images/block/logos/ibm.svg",
      className: "h-7 w-auto",
    },
  ],
}: LogoCarouselProps) => {
  return (
    <section className="py-20">
      <div className="container flex flex-col items-center text-center">
        <h2 className="my-6 text-pretty text-base font-semibold lg:text-xl">
          {heading}
        </h2>
      </div>
      <div className="pt-8 md:pt-12 lg:pt-16">
        <div className="relative mx-auto flex items-center justify-center lg:max-w-5xl">
          <Carousel
            opts={{ loop: true }}
            plugins={[AutoScroll({ playOnInit: true, speed: 0.5 })]}
          >
            <CarouselContent className="ml-0">
              {logos.map((logo) => (
                <CarouselItem
                  key={logo.id}
                  className="flex basis-1/3 justify-center pl-0 sm:basis-1/4 md:basis-1/5 lg:basis-1/6"
                >
                  <div className="mx-10 flex shrink-0 items-center justify-center">
                    <div>
                      <img
                        src={logo.image}
                        alt={logo.description}
                        className={logo.className}
                      />
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-background to-transparent"></div>
          <div className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-background to-transparent"></div>
        </div>
      </div>
    </section>
  );
};

export default LogoCarousel; 