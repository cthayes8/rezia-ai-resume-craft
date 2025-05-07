
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const testimonials = [
  {
    name: "Alex Johnson",
    position: "Software Engineer",
    company: "TechCorp",
    avatar: "AJ",
    content: "After using Rezia to optimize my resume, I received calls from 3 of the 5 companies I applied to. The AI suggestions were spot-on for matching what employers were looking for."
  },
  {
    name: "Sarah Williams",
    position: "Marketing Manager",
    company: "BrandGrowth",
    avatar: "SW",
    content: "Rezia helped me tailor my resume perfectly for a senior role I was aiming for. The specific keyword optimizations made all the difference in getting past the ATS screening."
  },
  {
    name: "Michael Chen",
    position: "Data Analyst",
    company: "DataInsights",
    avatar: "MC",
    content: "As someone transitioning careers, I needed to highlight transferable skills. Rezia's suggestions helped me reframe my experience in a way that resonated with employers in my new field."
  }
];

const Testimonials = () => {
  return (
    <section id="testimonials" className="py-20 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">What Job Seekers Say</h2>
          <p className="text-lg text-gray-700">
            Thousands of professionals have boosted their careers by optimizing their resumes with Rezia.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div 
              key={index}
              className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 animate-fade-in"
              style={{animationDelay: `${index * 0.2}s`}}
            >
              <div className="flex items-center mb-4">
                <Avatar className="h-12 w-12 mr-4">
                  <AvatarFallback className="bg-rezia-blue text-white">
                    {testimonial.avatar}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-semibold">{testimonial.name}</h4>
                  <p className="text-sm text-gray-500">{testimonial.position}, {testimonial.company}</p>
                </div>
              </div>
              <p className="text-gray-600 italic">"{testimonial.content}"</p>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center bg-white border border-gray-200 rounded-xl p-8 shadow-sm animate-fade-in" style={{animationDelay: '0.6s'}}>
          <div className="flex flex-col md:flex-row items-center justify-between max-w-3xl mx-auto">
            <div className="mb-6 md:mb-0 md:mr-8 text-left">
              <div className="font-semibold text-xl mb-2 text-rezia-blue">Results That Matter</div>
              <h3 className="text-2xl font-bold">80% of users report more interview invitations</h3>
            </div>
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-rezia-blue">3x</div>
                <div className="text-sm text-gray-600">Increase in response rate</div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-3xl font-bold text-rezia-blue">94%</div>
                <div className="text-sm text-gray-600">Pass ATS systems</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
