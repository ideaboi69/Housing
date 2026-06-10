import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How cribb collects, uses, and protects your information.",
  alternates: { canonical: "https://findyourcribb.com/privacy" },
};

const LAST_UPDATED = "March 1, 2026";

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 prose prose-slate">
      <h1 className="text-3xl font-extrabold text-[#1B2D45]">Privacy Policy</h1>
      <p className="text-sm text-[#1B2D45]/60">Last updated: {LAST_UPDATED}</p>

      <h2>1. Introduction</h2>
      <p>
        cribb (&quot;cribb&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is a student housing platform
        for the University of Guelph community. This Privacy Policy explains what
        information we collect, how we use it, who we share it with, and your rights under
        Canada&apos;s Personal Information Protection and Electronic Documents Act (PIPEDA).
      </p>

      <h2>2. Information we collect</h2>
      <ul>
        <li><strong>Account info:</strong> name, university email (uoguelph.ca), program, year, profile photo, bio.</li>
        <li><strong>Landlord info:</strong> name, email, phone, company name, government ID, and ownership documents (for verification).</li>
        <li><strong>Listings:</strong> property address, photos, rent, amenities, lease terms, viewing availability.</li>
        <li><strong>Roommate quiz answers:</strong> lifestyle preferences used for compatibility matching.</li>
        <li><strong>Messages:</strong> contents of conversations between students and landlords or marketplace buyers and sellers.</li>
        <li><strong>Usage data:</strong> pages viewed, searches performed, listing saves, IP address, browser type.</li>
      </ul>

      <h2>3. How we use it</h2>
      <ul>
        <li>To operate the platform — show listings, run the roommate match, deliver messages.</li>
        <li>To verify landlord identity before allowing them to publish listings.</li>
        <li>To send transactional emails (verification, password reset, viewing reminders).</li>
        <li>To detect abuse, fraud, and violations of our Terms.</li>
        <li>To improve the product (anonymized analytics).</li>
      </ul>

      <h2>4. Who we share it with</h2>
      <p>We do not sell your personal information. We share data only with:</p>
      <ul>
        <li><strong>Service providers</strong> used to run cribb: Neon (database), Render (hosting), Resend (email), Cloudinary and Amazon Web Services (image and document storage), Anthropic (AI features), Cloudflare (security), Sentry (error monitoring).</li>
        <li><strong>Other users</strong>, only where you choose — landlords see your name and program when you message them; group members see your roommate quiz answers if you join a group.</li>
        <li><strong>Authorities</strong>, only when legally required (court order, lawful warrant).</li>
      </ul>

      <h2>5. Your rights</h2>
      <p>Under PIPEDA, you have the right to:</p>
      <ul>
        <li>Access the personal information we hold about you.</li>
        <li>Request correction of inaccurate information.</li>
        <li>Withdraw consent and delete your account at any time (Settings → Delete Account).</li>
        <li>File a complaint with the Office of the Privacy Commissioner of Canada.</li>
      </ul>

      <h2>6. Data retention</h2>
      <p>
        Account data is retained while your account is active. When you delete your account,
        we remove your profile, listings, messages, and uploaded images within 30 days. Some
        records may be retained longer where required by law (e.g. fraud investigation).
      </p>

      <h2>7. Security</h2>
      <p>
        We use industry-standard practices including bcrypt password hashing, JWT
        authentication, HTTPS encryption in transit, and AWS S3 server-side encryption at
        rest. No system is perfectly secure — please use a unique password and report
        suspicious activity.
      </p>

      <h2>8. Children</h2>
      <p>
        cribb is restricted to verified University of Guelph students and landlords. We do
        not knowingly collect information from anyone under 18.
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update this policy from time to time. Material changes will be announced via
        email and the &quot;Last updated&quot; date above.
      </p>

      <h2>10. Contact</h2>
      <p>
        Questions or requests: <a href="mailto:hello@findyourcribb.com">hello@findyourcribb.com</a>
      </p>
    </article>
  );
}
