const Pricing = () => {
  return (
    <section id="pricing" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 max-w-2xl mx-auto">
          <div className="inline-block rounded-full bg-rezia-blue/10 text-rezia-blue font-semibold uppercase text-xs px-4 py-1 mb-4">Pricing</div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-600 text-lg">
            Start free. Upgrade when you're ready to optimize every resume and cover letter.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {/* Free Plan */}
          <div className="border border-gray-200 rounded-xl p-8 shadow-sm bg-gray-50">
            <h3 className="text-xl font-semibold mb-2">Free</h3>
            <p className="text-gray-600 mb-6">One-time resume optimization to try Rezia.</p>
            <ul className="space-y-3 text-sm text-gray-700 mb-6">
              <li>✅ 1 resume optimization</li>
              <li>✅ Keyword analysis</li>
              <li>✅ AI-powered bullet rewrites</li>
              <li>🚫 No cover letter generation</li>
              <li>🚫 No resume re-optimization</li>
            </ul>
            <p className="text-3xl font-bold text-gray-800">Free</p>
            <a
              href="#try"
              className="inline-block mt-4 bg-rezia-blue text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-rezia-blue/90 transition"
            >
              Get Started
            </a>
          </div>

          {/* Pro Plan */}
          <div className="border-2 border-rezia-blue rounded-xl p-8 shadow-md bg-white">
            <h3 className="text-xl font-semibold mb-2 text-rezia-blue">Pro</h3>
            <p className="text-gray-600 mb-6">Unlimited resume + cover letter generation.</p>
            <ul className="space-y-3 text-sm text-gray-700 mb-6">
              <li>✅ Unlimited resume optimizations</li>
              <li>✅ AI-generated cover letters</li>
              <li>✅ Tailored rewrites for each job</li>
              <li>✅ .docx export for easy editing</li>
              <li>✅ Priority support</li>
            </ul>
            <p className="text-3xl font-bold text-rezia-blue mb-4">$29.99<span className="text-base font-medium text-gray-500">/month</span></p>
            <a
              href="#try"
              className="inline-block bg-rezia-blue text-white font-semibold px-6 py-3 rounded-lg shadow hover:bg-rezia-blue/90 transition"
            >
              Try Rezia Pro
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Pricing; 