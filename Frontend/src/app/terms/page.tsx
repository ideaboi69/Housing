import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using cribb.",
  alternates: { canonical: "https://findyourcribb.com/terms" },
};

const LAST_UPDATED = "March 1, 2026";

export default function TermsPage() {
  return (
    <article className="mx-auto max-w-3xl px-6 py-16 prose prose-slate">
      <h1 className="text-3xl font-extrabold text-[#1B2D45]">Terms of Service</h1>
      <p className="text-sm text-[#1B2D45]/60">Last updated: {LAST_UPDATED}</p>

      <h2>1. Acceptance</h2>
      <p>
        By using cribb, you agree to these Terms. If you do not agree, do not use the
        service.
      </p>

      <h2>2. Who can use cribb</h2>
      <ul>
        <li>Students: you must be a current University of Guelph student with a valid @uoguelph.ca email and be at least 18 years old.</li>
        <li>Landlords: you must own or have legal authority to list the property and pass our identity verification.</li>
        <li>Writers: you must apply and be approved.</li>
      </ul>

      <h2>3. What cribb does and does not do</h2>
      <p>
        cribb is a listing and discovery platform. We connect students with landlords,
        roommates, and a peer marketplace. We do not:
      </p>
      <ul>
        <li>Manage leases or rent payments.</li>
        <li>Mediate disputes between students and landlords.</li>
        <li>Guarantee the accuracy of listings, prices, photos, or reviews.</li>
        <li>Inspect properties or vouch for their condition.</li>
      </ul>
      <p>
        You are responsible for doing your own due diligence — visiting properties, reading
        leases carefully, and understanding tenant rights under Ontario law.
      </p>

      <h2>4. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Post false, misleading, discriminatory, or harmful content.</li>
        <li>Impersonate another person, landlord, or business.</li>
        <li>Scrape, copy, or republish listings or reviews without permission.</li>
        <li>Use cribb to send spam, solicit unrelated services, or run scams.</li>
        <li>Attempt to bypass identity verification, rate limits, or other security measures.</li>
        <li>Upload illegal content or content that infringes intellectual property.</li>
      </ul>

      <h2>5. Content you post</h2>
      <p>
        You retain ownership of the content you post (listings, photos, posts, messages).
        By posting, you grant cribb a non-exclusive, royalty-free, worldwide license to
        host, display, and distribute that content for the purpose of operating the
        platform.
      </p>
      <p>
        Reviews are stars-only by design. We do not host review comments to reduce
        defamation risk.
      </p>

      <h2>6. Verification and moderation</h2>
      <p>
        We may verify landlord documents using automated extraction and manual review. We
        may remove content, suspend accounts, or revoke access without notice if we believe
        these Terms have been violated. We may also flag content that has been reported by
        the community for review.
      </p>

      <h2>7. Roommate matching</h2>
      <p>
        Roommate matching is for groups of students who already know each other or want to
        find others through quizzes and groups. cribb does not vet roommate compatibility
        and is not responsible for disputes between roommates.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        cribb is provided &quot;as is&quot; and &quot;as available&quot; without warranty of
        any kind, express or implied. We disclaim all warranties to the maximum extent
        permitted by law, including fitness for a particular purpose, accuracy of listings,
        and uninterrupted service.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, cribb and its operators will not be liable
        for indirect, incidental, special, consequential, or punitive damages, or for any
        loss of profits, data, or goodwill, arising from your use of the service.
      </p>

      <h2>10. Termination</h2>
      <p>
        You may delete your account at any time via Settings. We may suspend or terminate
        your account for violations of these Terms, illegal activity, or to protect the
        community.
      </p>

      <h2>11. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Province of Ontario and the applicable
        laws of Canada. Disputes will be resolved in Guelph, Ontario.
      </p>

      <h2>12. Changes</h2>
      <p>
        We may update these Terms from time to time. We&apos;ll announce material changes
        via email. Continued use of cribb after changes means you accept the updated Terms.
      </p>

      <h2>13. Contact</h2>
      <p>
        Questions: <a href="mailto:hello@findyourcribb.com">hello@findyourcribb.com</a>
      </p>
    </article>
  );
}
