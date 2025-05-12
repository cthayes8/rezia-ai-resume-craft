'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold mb-8">Rezia Privacy Policy</h1>
          
          <div className="text-sm text-gray-600 mb-8">
            <p>Effective Date: March 19, 2024</p>
            <p>Last Updated: March 19, 2024</p>
          </div>

          <div className="mb-8">
            <p className="text-lg">
              Rezia AI LLC ("Rezia", "we", or "us") respects your privacy and is committed to protecting your personal data. This Privacy Policy describes how we collect, use, share, and protect your data when you access or use our AI-powered resume optimization service (the "Service").
            </p>
            <p className="mt-4">
              By accessing the Service, you agree to this Privacy Policy and our Terms of Use.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Information We Collect</h2>
            <p className="mb-4">We may collect the following types of personal data:</p>
            
            <h3 className="text-xl font-semibold mt-6 mb-3">a. Account Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Name, email, password, and contact details</li>
              <li>Subscription tier, payment method (processed by Stripe), and billing history</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">b. Uploaded Content</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Resume text, job descriptions, and any other user-submitted data</li>
              <li>AI-generated resume outputs based on your content</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">c. Technical & Usage Information</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>IP address, browser type, device type, and OS</li>
              <li>Session data, clickstream, timestamps, referring URLs</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">d. Communications</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Emails, messages, or support tickets submitted to Rezia</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">e. Third-Party Sources</h3>
            <ul className="list-disc pl-6 space-y-2">
              <li>Information from analytics tools, fraud prevention providers, and payment processors</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How We Use Your Data</h2>
            <p className="mb-4">We use your data to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Deliver and improve the Service</li>
              <li>Generate optimized resumes based on your inputs</li>
              <li>Train and refine our AI models (including by using your uploaded data)</li>
              <li>Provide customer support and resolve disputes</li>
              <li>Detect fraud or misuse</li>
              <li>Comply with legal requirements</li>
            </ul>
            <p className="mt-4">
              We may anonymize and aggregate your data for statistical, research, or commercial purposes. We will never attempt to re-identify anonymized data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. AI Content and Data Usage</h2>
            <p className="mb-4">By uploading resumes or job descriptions, you agree that:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Rezia may store, process, and reuse your inputs and AI-generated outputs</li>
              <li>Rezia may use your data for internal training, evaluation, marketing, or product improvement</li>
              <li>Rezia retains commercial rights to de-identified and AI-generated data</li>
            </ul>
            
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="font-semibold mb-2">⚠️ Please do not upload sensitive or confidential information, including:</p>
              <ul className="list-disc pl-6 space-y-1">
                <li>Social Security Numbers</li>
                <li>Health data or biometric identifiers</li>
                <li>Proprietary company or employer secrets</li>
                <li>Personal data of others without consent</li>
              </ul>
            </div>
            <p className="mt-4">
              You are solely responsible for the content you provide. Rezia is not liable for unauthorized or inappropriate content uploads.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Disclosure of Personal Data</h2>
            <p className="mb-4">We may share your data only as necessary to operate and protect the Service:</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Category</th>
                    <th className="text-left py-2 px-4">Examples</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4">Vendors</td>
                    <td className="py-2 px-4">OpenAI (AI processing), Stripe (payments), Clerk (auth), analytics tools</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">Legal Compliance</td>
                    <td className="py-2 px-4">Courts, law enforcement, or regulators when required by law</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">Business Transactions</td>
                    <td className="py-2 px-4">In the event of an acquisition, merger, bankruptcy, or asset transfer</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">Affiliates</td>
                    <td className="py-2 px-4">Any affiliated entities under common ownership</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">With Your Consent</td>
                    <td className="py-2 px-4">When you explicitly authorize us to share information</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Retention</h2>
            <p className="mb-4">We retain your data as long as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your account remains active</li>
              <li>Required to provide or improve the Service</li>
              <li>Necessary for fraud prevention, dispute resolution, or legal obligations</li>
            </ul>
            <p className="mt-4">
              You may request account deletion at any time by emailing privacy@rezia.ai.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Your Rights</h2>
            <p className="mb-4">Depending on your jurisdiction, you may have rights to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Access or obtain a copy of your data</li>
              <li>Correct or update your information</li>
              <li>Delete your personal data</li>
              <li>Object to processing or request restriction</li>
              <li>Withdraw consent (if processing is based on consent)</li>
              <li>Port data to another service</li>
            </ul>
            <p className="mt-4">
              You may exercise your rights by contacting privacy@rezia.ai. We may require identity verification. If you authorize an agent to submit a request on your behalf, written consent and verification will be required.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Accuracy of Outputs</h2>
            <p>
              AI-generated resume content is based on predictive algorithms and may be inaccurate or misleading. Rezia does not guarantee factual correctness of any output. You are solely responsible for verifying the accuracy and legality of AI-generated resumes.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Children's Privacy</h2>
            <p>
              The Service is not directed to children under 13, and we do not knowingly collect data from anyone under 13. If we learn that we have collected data from a child without consent, we will delete it promptly.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
            <p>
              If you access the Service from outside the United States, you acknowledge and agree that your data may be transferred to and processed in the United States and other jurisdictions. We apply strong data protection standards regardless of your location.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Security Measures</h2>
            <p className="mb-4">We implement administrative, technical, and physical safeguards to protect your data, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>HTTPS encryption</li>
              <li>Role-based access controls</li>
              <li>Secure cloud infrastructure and audit logging</li>
            </ul>
            <p className="mt-4">
              However, no system is 100% secure. You use the Service at your own risk.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Business Transfers</h2>
            <p>
              If Rezia undergoes a merger, acquisition, reorganization, bankruptcy, or sale of assets, your data may be transferred as part of that transaction.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Changes to this Policy</h2>
            <p>
              We may update this Privacy Policy at any time. We will post the revised version on our website with a new effective date. Continued use of the Service constitutes your acceptance of the revised policy.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact</h2>
            <p>For privacy inquiries or requests, contact:</p>
            <ul className="list-none pl-0 mt-2">
              <li>📧 privacy@rezia.ai</li>
              <li>📍 Rezia AI LLC – Tampa, FL, USA</li>
            </ul>
          </section>

          <div className="mt-12 p-6 bg-gray-50 rounded-lg">
            <p className="font-medium">
              By using Rezia, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
