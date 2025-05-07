
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does Rezia optimize my resume?",
    answer: "Rezia uses AI to analyze your resume against the job description, identifying missing keywords and skills. It then suggests specific improvements to increase your match rate with the employer's requirements and helps you bypass Applicant Tracking Systems (ATS)."
  },
  {
    question: "Is my resume data secure?",
    answer: "Yes, your data security is our priority. We use bank-level encryption to protect your information, and we never share your resume data with third parties. You can request deletion of your data at any time."
  },
  {
    question: "Can I use Rezia for multiple job applications?",
    answer: "Absolutely! Rezia is designed to help you customize your resume for each job application. We recommend creating a tailored version for every position you apply to for the best results."
  },
  {
    question: "How much does Rezia cost?",
    answer: "Rezia offers a free tier that allows for basic resume optimization. For advanced features and unlimited optimizations, we offer premium plans starting at $9.99/month. You can view all our pricing options on our pricing page."
  },
  {
    question: "Can Rezia help with career transitions?",
    answer: "Yes! Rezia is especially helpful for career changers. It identifies transferable skills in your background that match the new role and suggests how to highlight them effectively on your resume."
  },
  {
    question: "Does Rezia work with all resume formats?",
    answer: "Rezia supports all common resume formats including PDF, Word (.doc, .docx), and plain text files. Our system can analyze and optimize resumes regardless of their original format."
  }
];

const FAQ = () => {
  return (
    <section id="faq" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Frequently Asked Questions</h2>
          <p className="text-lg text-gray-700">
            Get answers to common questions about Rezia's resume optimization service.
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-gray-200">
                <AccordionTrigger className="text-left font-medium py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-gray-600 pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-2">Still have questions?</p>
          <a href="#" className="text-rezia-blue font-medium hover:underline">Contact our support team</a>
        </div>
      </div>
    </section>
  );
};

export default FAQ;
