'use client';

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function CookiePolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow container mx-auto px-4 py-8 max-w-4xl">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-3xl font-bold mb-8">Rezia Cookie Policy</h1>
          
          <div className="text-sm text-gray-600 mb-8">
            <p>Effective Date: March 19, 2024</p>
            <p>Last Updated: March 19, 2024</p>
          </div>

          <div className="mb-8">
            <p className="text-lg">
              This Cookie Policy explains how Rezia AI LLC ("Rezia", "we", "us", or "our") uses cookies and similar technologies to recognize you when you visit our website at https://rezia.ai (the "Site") or use our web-based resume optimization platform (the "Service"). It explains what these technologies are, why we use them, and your choices regarding their use.
            </p>
            <p className="mt-4">
              For additional details on how we use your data, please refer to our Privacy Policy.
            </p>
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies?</h2>
            <p className="mb-4">
              Cookies are small data files placed on your device (computer, smartphone, or tablet) when you visit a website. They allow websites to recognize your browser and capture user preferences and usage data.
            </p>
            <p>
              Cookies may be first-party (set by Rezia) or third-party (set by external services such as analytics or payment platforms).
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Why We Use Cookies</h2>
            <p className="mb-4">We use cookies and similar technologies for the following purposes:</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">a. Essential Cookies</h3>
            <p className="mb-2">These are necessary for the core functionality of our Site and Service, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>User authentication (via Clerk)</li>
              <li>Secure logins and session management</li>
              <li>Payment processing (via Stripe)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">b. Performance & Analytics Cookies</h3>
            <p className="mb-2">These help us analyze how visitors use the Site, including:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Traffic sources</li>
              <li>Page interaction metrics</li>
              <li>Error logging</li>
            </ul>
            <p className="mt-2">
              We currently use Google Analytics and other third-party tools to collect anonymized statistical data.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">c. Functional Cookies</h3>
            <p className="mb-2">These remember your preferences and improve your experience, such as:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Remembering login state</li>
              <li>Storing selected resume templates</li>
              <li>Saving dark mode or UI settings</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">d. Marketing & Third-Party Cookies</h3>
            <p>
              We may partner with third-party platforms (e.g. Google Ads, LinkedIn, Meta) to deliver relevant advertising or measure campaign performance. These cookies may track you across websites.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Cookies We Use</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-4">Cookie Type</th>
                    <th className="text-left py-2 px-4">Purpose</th>
                    <th className="text-left py-2 px-4">Duration</th>
                    <th className="text-left py-2 px-4">Provider</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="py-2 px-4">__stripe_*</td>
                    <td className="py-2 px-4">Secure payment processing</td>
                    <td className="py-2 px-4">Session / persistent</td>
                    <td className="py-2 px-4">Stripe</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">_clerk_session</td>
                    <td className="py-2 px-4">User authentication & session</td>
                    <td className="py-2 px-4">Session</td>
                    <td className="py-2 px-4">Clerk</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">_ga, _gid, _gat</td>
                    <td className="py-2 px-4">Google Analytics tracking</td>
                    <td className="py-2 px-4">Varies (1 day to 2 years)</td>
                    <td className="py-2 px-4">Google</td>
                  </tr>
                  <tr className="border-b">
                    <td className="py-2 px-4">__cf_bm</td>
                    <td className="py-2 px-4">Bot protection / load balancing</td>
                    <td className="py-2 px-4">30 minutes</td>
                    <td className="py-2 px-4">Cloudflare</td>
                  </tr>
                  <tr>
                    <td className="py-2 px-4">rezia_prefs</td>
                    <td className="py-2 px-4">User-selected resume templates, themes</td>
                    <td className="py-2 px-4">Persistent</td>
                    <td className="py-2 px-4">Rezia</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              Note: Exact names may vary depending on platform configuration.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Your Choices</h2>
            <p className="mb-4">You have several options for controlling cookies:</p>

            <h3 className="text-xl font-semibold mt-6 mb-3">a. Cookie Banner</h3>
            <p className="mb-2">On your first visit, you will be presented with a cookie consent banner allowing you to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Accept all cookies</li>
              <li>Reject non-essential cookies</li>
              <li>Customize your cookie preferences</li>
            </ul>
            <p className="mt-2">
              You can update your preferences at any time by clicking the "Cookie Settings" link in the footer.
            </p>

            <h3 className="text-xl font-semibold mt-6 mb-3">b. Browser Settings</h3>
            <p className="mb-2">Most browsers allow you to block or delete cookies. Please note that blocking essential cookies may affect your ability to use the Service.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Chrome instructions</li>
              <li>Safari instructions</li>
              <li>Firefox instructions</li>
              <li>Edge instructions</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6 mb-3">c. "Do Not Track" Signals</h3>
            <p>
              We do not currently respond to "Do Not Track" browser signals. However, we honor your explicit cookie preferences selected via our banner or settings panel.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Third-Party Tools and Pixels</h2>
            <p className="mb-4">
              Third parties (such as analytics providers or ad networks) may use cookies, tags, or pixels on our Site. These third parties may use data collected from you in accordance with their own privacy policies, which we encourage you to review.
            </p>
            <p>
              Rezia is not responsible for how third parties manage cookies or personal data.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention via Cookies</h2>
            <p>
              We retain cookie data for as long as necessary to fulfill their purposes, or as required by law. Cookies may remain on your device for varying durations depending on type and provider.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time. When we do, we will revise the "Last Updated" date at the top of the policy. Material changes may also be communicated through our cookie banner or a pop-up notice.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
            <p>If you have any questions about our use of cookies or your cookie preferences, please contact:</p>
            <ul className="list-none pl-0 mt-2">
              <li>privacy@rezia.ai</li>
              <li>📍 Rezia AI LLC — Tampa, Florida</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}
