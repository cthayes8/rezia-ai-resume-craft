'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function TermsOfUse() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold mb-8">Rezia Terms of Use</h1>
          
          <div className="text-sm text-gray-600 mb-8">
            <p>Effective Date: March 19, 2024</p>
            <p>Last Updated: March 19, 2024</p>
          </div>

          <div className="mb-8">
            <p className="text-lg">
              Welcome to Rezia! These Terms of Use ("Terms") form a binding legal agreement between you ("User" or "you") and Rezia AI LLC, a Florida limited liability company ("Rezia," "we," or "us"), governing your access to and use of our web-based services for resume optimization and AI-generated content (the "Service").
            </p>
            <p className="mt-4">
              By creating an account, accessing, or using the Service, you agree to these Terms. If you do not agree, you must not use the Service.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Eligibility</h2>
            <p>
              You must be at least 13 years old to use the Service. If you are under the age of majority in your jurisdiction, you must have permission from a parent or guardian. By using the Service, you represent that you meet these requirements.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Accounts & Subscriptions</h2>
            <p>
              To use certain features, you may be required to create an account through our identity and billing providers (Clerk and Stripe). You agree to provide accurate information and maintain the confidentiality of your login credentials.
            </p>
            <p className="mt-4">
              We offer free and paid subscriptions. Paid subscriptions are billed monthly through Stripe and are non-refundable. By subscribing, you authorize us to charge your payment method on a recurring basis.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Permitted Use</h2>
            <p>
              You may use the Service only for lawful, personal use. You agree not to use the Service for any purpose that is prohibited by these Terms, unlawful, or that could damage, disable, or impair the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Code of Conduct</h2>
            <p className="mb-4">By using the Service, you agree not to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Upload or submit any content that is unlawful, defamatory, harassing, discriminatory, sexually explicit, or otherwise offensive;</li>
              <li>Use the Service to generate resumes or content for impersonation, fraud, disinformation, or unlawful employment practices;</li>
              <li>Attempt to manipulate or "jailbreak" AI outputs using prompt engineering or adversarial inputs;</li>
              <li>Upload any content containing personal data of others without consent, including sensitive data such as social security numbers or biometric identifiers;</li>
              <li>Reverse-engineer, scrape, data mine, or copy the functionality of the Service or underlying models;</li>
              <li>Interfere with or abuse the Service through excessive usage, automated tools, denial of service attempts, or prompt-based manipulation;</li>
              <li>Infringe the intellectual property rights, privacy rights, or publicity rights of any person or entity.</li>
            </ul>
            <p className="mt-4">
              Rezia reserves the right to block, restrict, or remove any prompts, inputs, or outputs that violate this Code of Conduct, and to suspend or terminate any account for serious or repeated violations.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. User Content & AI Outputs</h2>
            <p className="mb-4">You may submit inputs such as resumes and job descriptions ("User Inputs"), and the Service may generate AI-enhanced resume content ("Outputs").</p>
            <p className="mb-4">By using the Service, you:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Grant Rezia a perpetual, worldwide, irrevocable, royalty-free license to store, use, reproduce, modify, and distribute both your Inputs and Outputs for purposes including model improvement, research, analytics, and marketing;</li>
              <li>Acknowledge that Outputs may not be unique, and that similar or identical results may be generated for other users;</li>
              <li>Understand that Rezia does not verify the factual accuracy, originality, or legality of any Output.</li>
            </ul>
            <p className="mt-4">
              You may use your AI-generated resume content for personal purposes, but you are solely responsible for ensuring that its use complies with applicable laws and third-party rights.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Ownership & Intellectual Property</h2>
            <p className="mb-4">
              All features, templates, software, and design elements of the Service are the exclusive property of Rezia or its licensors and are protected by U.S. and international copyright, trademark, and trade secret laws.
            </p>
            <p>
              Rezia grants you a limited, non-transferable, revocable license to use the Service and your AI-generated resume content for personal use. You may not reproduce, distribute, or modify any part of the Service without Rezia's written permission.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. No Reliance on Output</h2>
            <p className="mb-4">You understand and agree that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The Service is AI-powered and may produce content that is inaccurate, incomplete, or misleading;</li>
              <li>You should not rely on any Output for legal, medical, or professional advice;</li>
              <li>Rezia does not guarantee the accuracy, uniqueness, or effectiveness of any resume or Output;</li>
              <li>Use of the Service does not guarantee employment or hiring outcomes.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Third-Party Rights Disclaimer</h2>
            <p>
              Rezia makes no representation or warranty that any content generated by the Service is free from third-party intellectual property infringement, including copyright, trademark, or rights of publicity. You assume full responsibility for reviewing and verifying the legality of any resume or content prior to using or distributing it.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Privacy & Data Use</h2>
            <p>
              Use of the Service is also governed by our Privacy Policy, which explains how we collect, use, and protect your information. By using the Service, you consent to our collection and use of your data as described.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Feedback & Testimonials</h2>
            <p>
              If you provide Rezia with any feedback, testimonials, feature suggestions, or related content, you grant us a non-exclusive, perpetual, royalty-free license to use, publish, and display such content in any media without restriction or compensation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Termination & Suspension</h2>
            <p className="mb-4">We may suspend or terminate your account and access to the Service at any time, with or without notice, for any reason, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Violation of these Terms or the Code of Conduct;</li>
              <li>Repeated prompt abuse or model manipulation;</li>
              <li>Fraudulent or unlawful activity.</li>
            </ul>
            <p className="mt-4">
              You may cancel your account at any time through your account settings. No refunds will be issued upon cancellation.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Disclaimer of Warranties</h2>
            <p className="font-semibold mb-4">
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND. REZIA DISCLAIMS ALL EXPRESS OR IMPLIED WARRANTIES, INCLUDING BUT NOT LIMITED TO MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="font-semibold">
              REZIA DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF MALICIOUS CODE.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Limitation of Liability</h2>
            <p className="font-semibold mb-4">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, REZIA AND ITS AFFILIATES SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, CONSEQUENTIAL, SPECIAL, OR EXEMPLARY DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF THE SERVICE, INCLUDING LOSS OF DATA, LOSS OF PROFITS, OR EMPLOYMENT OPPORTUNITY.
            </p>
            <p className="font-semibold">
              IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED THE AMOUNT YOU PAID TO US IN THE TWELVE (12) MONTHS PRIOR TO THE CLAIM (OR $0 FOR FREE USERS).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">14. Indemnification</h2>
            <p className="mb-4">You agree to defend, indemnify, and hold harmless Rezia, its officers, affiliates, contractors, and agents from any claims, liabilities, damages, or expenses (including attorneys' fees) arising from:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use of the Service or AI Outputs;</li>
              <li>Your violation of these Terms or applicable law;</li>
              <li>Your infringement of third-party rights through your resume or content.</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">15. Dispute Resolution & Arbitration</h2>
            <p className="mb-4">
              If you reside in the United States, you agree to resolve any disputes with Rezia through binding arbitration conducted in Tampa, Florida, under the rules of the American Arbitration Association.
            </p>
            <p>
              You waive any right to participate in class-action lawsuits or class-wide arbitration. Each party shall bear its own legal fees and costs, unless otherwise required by law.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">16. Modifications</h2>
            <p>
              We may update these Terms at any time. Material changes will be posted on our website and reflected by an updated "Last Updated" date. By continuing to use the Service, you accept the revised Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">17. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the State of Florida, without regard to conflict of laws principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">18. Contact Information</h2>
            <p>For legal inquiries, please contact:</p>
            <ul className="list-none pl-0 mt-2">
              <li>📧 legal@rezia.ai</li>
              <li>📍 Rezia AI LLC</li>
              <li>Tampa, Florida, USA</li>
            </ul>
          </section>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">✅ Acceptance of Terms</h2>
            <p>
              By creating an account or using the Service, you agree to these Terms of Use and our Privacy Policy.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}