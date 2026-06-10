import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "The rules for using cribb.",
  alternates: { canonical: "https://findyourcribb.com/terms" },
};

const LAST_UPDATED = "June 10, 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F4]">
      <article className="mx-auto max-w-3xl px-6 py-16 sm:py-20">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm text-[#1B2D45]/60 hover:text-[#FF6B35] transition-colors"
        >
          ← Back to cribb
        </Link>

        <header className="mt-8 mb-12 pb-8 border-b border-[#1B2D45]/10">
          <h1 className="font-extrabold text-4xl sm:text-5xl text-[#1B2D45] tracking-tight">
            Terms of Service
          </h1>
          <p className="mt-4 text-sm text-[#1B2D45]/55">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        <p className="text-[17px] leading-relaxed text-[#1B2D45]/85">
          By using cribb (&quot;cribb&quot;, &quot;we&quot;, &quot;us&quot;),
          you agree to these Terms of Service and our{" "}
          <A href="/privacy">Privacy Policy</A>. If you don&apos;t agree, please
          don&apos;t use the service. cribb is operated by Adeoluwa Ojulari and
          David Amaefula as individuals.
        </p>

        <Section n={1} title="Who can use cribb">
          <List>
            <Item>
              Students must be 17 or older and use a valid uoguelph.ca email.
            </Item>
            <Item>
              Landlords must own or have legal authority to list the property
              and pass our identity verification.
            </Item>
            <Item>Writers must apply and be approved.</Item>
          </List>
        </Section>

        <Section n={2} title="What cribb does and does not do">
          <P>
            cribb is a listing and discovery platform. We connect students with
            landlords, roommates, and a peer marketplace. We do not:
          </P>
          <List>
            <Item>Manage leases or rent payments.</Item>
            <Item>Mediate disputes between students and landlords.</Item>
            <Item>
              Guarantee the accuracy of listings, prices, photos, or reviews.
            </Item>
            <Item>Inspect properties or vouch for their condition.</Item>
          </List>
          <P>
            You are responsible for doing your own due diligence — visiting
            properties, reading leases carefully, and understanding tenant
            rights under Ontario law.
          </P>
        </Section>

        <Section n={3} title="Acceptable use">
          <P>You agree not to:</P>
          <List>
            <Item>
              Post false, misleading, discriminatory, or harmful content.
            </Item>
            <Item>
              Impersonate another person, landlord, or business.
            </Item>
            <Item>
              Scrape, copy, or republish listings or reviews without permission.
            </Item>
            <Item>
              Use cribb to send spam, solicit unrelated services, or run scams.
            </Item>
            <Item>
              Attempt to bypass identity verification, rate limits, or other
              security measures.
            </Item>
            <Item>
              Upload illegal content or content that infringes intellectual
              property.
            </Item>
          </List>
        </Section>

        <Section n={4} title="Content you post">
          <P>
            You retain ownership of the content you post (listings, photos,
            posts, messages). By posting, you grant cribb a non-exclusive,
            royalty-free, worldwide license to host, display, and distribute
            that content for the purpose of operating the platform.
          </P>
          <P>
            Reviews are stars-only by design. We do not host review comments to
            reduce defamation risk.
          </P>
        </Section>

        <Section n={5} title="Verification and moderation">
          <P>
            We may verify landlord documents using automated extraction and
            manual review. We may remove content, suspend accounts, or revoke
            access without notice if we believe these Terms have been violated.
            We may also flag content that has been reported by the community
            for review.
          </P>
        </Section>

        <Section n={6} title="Roommate matching">
          <P>
            Roommate matching is for groups of students who already know each
            other or want to find others through quizzes and groups. cribb does
            not vet roommate compatibility and is not responsible for disputes
            between roommates.
          </P>
        </Section>

        <Section n={7} title="Marketplace">
          <P>
            Marketplace transactions happen directly between buyers and
            sellers. cribb does not process payments, hold funds, ship items,
            verify item condition, or mediate disputes. Meet in safe public
            locations, inspect items before paying, and use your best
            judgement.
          </P>
        </Section>

        <Section n={8} title="Disclaimers">
          <P>
            cribb is provided &quot;as is&quot; and &quot;as available&quot;
            without warranty of any kind, express or implied. We disclaim all
            warranties to the maximum extent permitted by law, including
            fitness for a particular purpose, accuracy of listings, and
            uninterrupted service.
          </P>
        </Section>

        <Section n={9} title="Limitation of liability">
          <P>
            To the maximum extent permitted by law, cribb and its operators
            will not be liable for indirect, incidental, special,
            consequential, or punitive damages, or for any loss of profits,
            data, or goodwill, arising from your use of the service.
          </P>
          <P>
            Our total aggregate liability for any claim relating to cribb will
            not exceed CAD $100.
          </P>
        </Section>

        <Section n={10} title="Indemnification">
          <P>
            You agree to indemnify and hold cribb and its operators (Adeoluwa
            Ojulari and David Amaefula) harmless from any claim, demand, or
            damages, including reasonable legal fees, arising from your use of
            cribb, the content you post, your interactions with other users,
            or your violation of these Terms.
          </P>
        </Section>

        <Section n={11} title="Termination">
          <P>
            You may delete your account at any time via Settings. We may
            suspend or terminate your account for violations of these Terms,
            illegal activity, or to protect the community.
          </P>
        </Section>

        <Section n={12} title="Governing law">
          <P>
            These Terms are governed by the laws of the Province of Ontario
            and the applicable laws of Canada. Disputes will be resolved in
            Guelph, Ontario.
          </P>
        </Section>

        <Section n={13} title="Changes">
          <P>
            We may update these Terms from time to time. We&apos;ll announce
            material changes via email. Continued use of cribb after changes
            means you accept the updated Terms.
          </P>
        </Section>

        <Section n={14} title="Contact">
          <P>
            Questions:{" "}
            <A href="mailto:hello@findyourcribb.com">
              hello@findyourcribb.com
            </A>
          </P>
          <P>
            You can also reach the people behind cribb directly: Adeoluwa
            Ojulari (
            <A href="mailto:adeoluwaojulari@gmail.com">
              adeoluwaojulari@gmail.com
            </A>
            ) and David Amaefula (
            <A href="mailto:professionaldavid14@gmail.com">
              professionaldavid14@gmail.com
            </A>
            ).
          </P>
        </Section>
      </article>
    </div>
  );
}

function Section({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <h2 className="font-extrabold text-2xl text-[#1B2D45] tracking-tight mb-4">
        <span className="text-[#FF6B35]">{n}.</span> {title}
      </h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[16px] leading-relaxed text-[#1B2D45]/85">{children}</p>
  );
}

function List({ children }: { children: React.ReactNode }) {
  return <ul className="space-y-2.5 pl-1">{children}</ul>;
}

function Item({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-3 text-[16px] leading-relaxed text-[#1B2D45]/85">
      <span
        aria-hidden
        className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-[#FF6B35] shrink-0"
      />
      <span>{children}</span>
    </li>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-[#FF6B35] underline-offset-4 hover:underline"
    >
      {children}
    </a>
  );
}
