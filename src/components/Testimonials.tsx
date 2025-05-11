"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star } from "lucide-react";
import { useEffect, useRef } from "react";

// Improved testimonials with results and real value
const testimonials = [
  {
    id: 1,
    name: "Alex Johnson",
    role: "Software Engineer",
    content:
      "After months of silence on LinkedIn, I used Rezia—and landed 3 interviews in my first week. The AI nailed what I needed to change.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    id: 2,
    name: "Sarah Williams",
    role: "Marketing Manager",
    content:
      "Rezia helped me get past the ATS for a role I thought was out of reach. The keyword optimization was a total game changer.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    id: 3,
    name: "Michael Chen",
    role: "Data Analyst",
    content:
      "I was switching industries and struggling to frame my experience. Rezia translated my background into language that recruiters responded to.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/46.jpg",
  },
  {
    id: 4,
    name: "Priya Patel",
    role: "Product Manager",
    content:
      "Rezia's rewrite made me sound like the perfect candidate. I got interview invites from two dream companies within a week.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/68.jpg",
  },
  {
    id: 5,
    name: "David Kim",
    role: "UX Designer",
    content:
      "I never realized how generic my resume was. Rezia made it sharp, tailored, and keyword-rich—and I finally started hearing back.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/65.jpg",
  },
  {
    id: 6,
    name: "Maria Garcia",
    role: "HR Specialist",
    content:
      "I tell every job seeker I meet: use Rezia. It writes the resume recruiters *want* to read—no fluff, just impact.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/12.jpg",
  },
  {
    id: 7,
    name: "James Lee",
    role: "Business Analyst",
    content:
      "Before Rezia: silence. After Rezia: 4 callbacks in 5 days. I was honestly shocked by the difference.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/men/23.jpg",
  },
  {
    id: 8,
    name: "Emily Nguyen",
    role: "Operations Lead",
    content:
      "Rezia gave me the confidence to apply to roles I used to scroll past. It made me sound like a leader, not just an applicant.",
    rating: 5,
    avatar: "https://randomuser.me/api/portraits/women/50.jpg",
  },
];

const useMarqueeScroll = (speed = 0.5) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const container = ref.current;
    if (!container) return;

    let frame: number;
    let scrollLeft = 0;

    const animate = () => {
      if (container.scrollWidth - container.clientWidth <= 0) return;
      scrollLeft += speed;
      if (scrollLeft >= container.scrollWidth / 2) {
        scrollLeft = 0;
      }
      container.scrollLeft = scrollLeft;
      frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [speed]);

  return ref;
};

const Testimonials = () => {
  const marqueeRef = useMarqueeScroll(0.5);
  const cards = [...testimonials, ...testimonials];

  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            What Job Seekers Say
          </h2>
          <p className="text-lg text-gray-700">
            Thousands of professionals have boosted their careers with Rezia. Real results. Real interviews.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div
          className="relative overflow-x-auto whitespace-nowrap scrollbar-hide"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <div className="flex gap-6 min-w-max py-2">
            {cards.map((testimonial, idx) => (
              <Card
                key={idx}
                className="w-80 flex-shrink-0 bg-white shadow-md hover:shadow-lg transition"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={testimonial.avatar}
                        alt={testimonial.name}
                      />
                      <AvatarFallback>
                        {testimonial.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-yellow-500 text-yellow-500"
                      />
                    ))}
                  </div>
                  <p className="text-gray-700 italic whitespace-normal overflow-hidden text-ellipsis line-clamp-4">
                    "{testimonial.content}"
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Results Block */}
        <div className="mt-16 text-center bg-white border border-gray-200 rounded-xl p-8 shadow-sm max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between max-w-3xl mx-auto">
            <div className="mb-6 md:mb-0 md:mr-8 text-left">
              <div className="font-semibold text-xl mb-2 text-rezia-blue">
                Results That Matter
              </div>
              <h3 className="text-2xl font-bold">
                80% of users report more interview invitations
              </h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-rezia-blue">3x</div>
                <div className="text-sm text-gray-600">
                  Increase in response rate
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-rezia-blue">94%</div>
                <div className="text-sm text-gray-600">Pass ATS systems</div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-700 mb-4">
            Want results like these?
          </p>
          <a
            href="#try"
            className="inline-block bg-rezia-blue hover:bg-rezia-blue/90 text-white font-semibold px-6 py-3 rounded-lg shadow transition"
          >
            Try Rezia Free → Optimize Your Resume
          </a>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
