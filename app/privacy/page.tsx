import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | MoneyMath",
  description: "Privacy policy for MoneyMath — how we collect and use data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-8">Last updated: April 2025</p>

      <div className="prose prose-gray max-w-none space-y-6 text-gray-600 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Overview</h2>
          <p>
            MoneyMath ("we", "us", or "our") operates getmoneymath.com. This page explains what information
            we collect, how we use it, and your choices.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Information We Collect</h2>
          <p>
            MoneyMath does not require you to create an account or submit any personal information to use
            our calculators. All calculations are performed locally in your browser.
          </p>
          <p className="mt-2">
            We use third-party services that may automatically collect certain information:
          </p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li><strong>Google Analytics</strong> — collects anonymized usage data such as pages visited, time on site, and general location (country/city). This helps us understand how people use MoneyMath.</li>
            <li><strong>Google AdSense</strong> — displays advertisements and may use cookies to show relevant ads based on your browsing activity. See Google's privacy policy for details.</li>
            <li><strong>Cookies</strong> — our advertising partners may place cookies on your device to serve personalized ads.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">How We Use Information</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>To improve and maintain our calculators</li>
            <li>To display relevant advertising</li>
            <li>To analyze site traffic and usage patterns</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Third-Party Links</h2>
          <p>
            MoneyMath contains links to third-party websites, including affiliate partners. We are not
            responsible for the privacy practices of those sites. Some links on this site are affiliate
            links — we may earn a commission if you sign up or make a purchase, at no extra cost to you.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Advertising</h2>
          <p>
            We use Google AdSense to display ads. Google may use cookies to show ads based on your prior
            visits to this and other websites. You can opt out of personalized advertising by visiting{" "}
            <a href="https://www.google.com/settings/ads" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">
              Google's Ad Settings
            </a>.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Your Choices</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li>You can disable cookies in your browser settings</li>
            <li>You can opt out of Google's personalized ads at <a href="https://optout.aboutads.info" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">aboutads.info</a></li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Children's Privacy</h2>
          <p>
            MoneyMath is not directed at children under 13. We do not knowingly collect information from
            children under 13.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-bold text-gray-800 mb-2">Contact</h2>
          <p>
            Questions about this policy? Email us at{" "}
            <a href="mailto:hello@getmoneymath.com" className="text-blue-600 underline">
              hello@getmoneymath.com
            </a>.
          </p>
        </section>
      </div>
    </div>
  );
}
