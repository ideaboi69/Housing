import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How cribb collects, uses, and protects your information.",
  alternates: { canonical: "https://findyourcribb.com/privacy" },
};

const LAST_UPDATED = "June 10, 2026";

export default function PrivacyPage() {
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
            Privacy Policy
          </h1>
          <p className="mt-4 text-sm text-[#1B2D45]/55">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        <p className="text-[17px] leading-relaxed text-[#1B2D45]/85">
          cribb (&quot;cribb&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
          is a student housing platform for the University of Guelph community,
          operated by Adeoluwa Ojulari and David Amaefula as individuals. This
          Privacy Policy explains what information we collect, how we use it,
          who we share it with, and your rights under Canada&apos;s Personal
          Information Protection and Electronic Documents Act (PIPEDA).
        </p>

        <Section n={1} title="Information we collect">
          <List>
            <Item label="Account info">
              name, university email (uoguelph.ca), program, year, profile
              photo, bio.
            </Item>
            <Item label="Landlord info">
              name, email, phone, company name, government ID, and ownership
              documents (for verification).
            </Item>
            <Item label="Listings">
              property address, photos, rent, amenities, lease terms, viewing
              availability.
            </Item>
            <Item label="Roommate quiz answers">
              lifestyle preferences used for compatibility matching.
            </Item>
            <Item label="Messages">
              contents of conversations between students and landlords or
              marketplace buyers and sellers.
            </Item>
            <Item label="Usage data">
              pages viewed, searches performed, listing saves, IP address,
              browser type.
            </Item>
          </List>
        </Section>

        <Section n={2} title="How we use it">
          <List>
            <Item>
              To operate the platform — show listings, run the roommate match,
              deliver messages.
            </Item>
            <Item>
              To verify landlord identity before allowing them to publish
              listings.
            </Item>
            <Item>
              To send transactional emails (verification, password reset,
              viewing reminders).
            </Item>
            <Item>
              To detect abuse, fraud, and violations of our Terms.
            </Item>
            <Item>
              To improve the product (anonymized analytics).
            </Item>
          </List>
        </Section>

        <Section n={3} title="Who we share it with">
          <P>
            We do not sell your personal information. We share data only with:
          </P>
          <List>
            <Item label="Service providers used to run cribb">
              Neon (database), Render (hosting), Resend (email), Cloudinary and
              Amazon Web Services (image and document storage), Anthropic (AI
              features), Cloudflare (security and Turnstile bot protection),
              Sentry (error monitoring), Upstash (caching), Google Maps (maps
              and address lookup).
            </Item>
            <Item label="Other users, only where you choose">
              landlords see your name and program when you message them; group
              members see your roommate quiz answers if you join a group.
            </Item>
            <Item label="Authorities">
              only when legally required (court order, lawful warrant).
            </Item>
          </List>
          <P>
            Some of these providers process data in the United States. By using
            cribb you consent to your data being transferred and processed
            outside Canada under contractual safeguards.
          </P>
        </Section>

        <Section n={4} title="AI features">
          <P>
            Our AI listing comparison feature uses Anthropic&apos;s Claude
            model. When you compare listings, the relevant listing data (rent,
            amenities, location, Cribb score, landlord verification status) is
            sent to Anthropic to generate the comparison. We do not send your
            name, email, or messages. Anthropic does not train its models on
            this data under their commercial terms.
          </P>
        </Section>

        <Section n={5} title="Cookies and tracking">
          <P>
            We use a small number of essential cookies to keep you logged in
            and to remember your preferences. We do not run third-party
            advertising, ad-tech pixels, or cross-site tracking on cribb.
          </P>
        </Section>

        <Section n={6} title="Your rights">
          <P>Under PIPEDA, you have the right to:</P>
          <List>
            <Item>Access the personal information we hold about you.</Item>
            <Item>Request correction of inaccurate information.</Item>
            <Item>
              Withdraw consent and delete your account at any time (Settings →
              Delete Account).
            </Item>
            <Item>
              File a complaint with the Office of the Privacy Commissioner of
              Canada.
            </Item>
          </List>
        </Section>

        <Section n={7} title="Data retention">
          <P>
            Account data is retained while your account is active. When you
            delete your account, we remove your profile, listings, messages,
            and uploaded images within 30 days. Some records may be retained
            longer where required by law (e.g. fraud investigation).
          </P>
        </Section>

        <Section n={8} title="Security">
          <P>
            We use industry-standard practices including bcrypt password
            hashing, JWT authentication, HTTPS encryption in transit, and AWS
            S3 server-side encryption at rest. No system is perfectly secure —
            please use a unique password and report suspicious activity.
          </P>
        </Section>

        <Section n={9} title="Children">
          <P>
            cribb is restricted to verified University of Guelph students and
            landlords. We do not knowingly collect information from anyone
            under 17.
          </P>
        </Section>

        <Section n={10} title="Changes">
          <P>
            We may update this policy from time to time. Material changes will
            be announced via email and the &quot;Last updated&quot; date above.
          </P>
        </Section>

        <Section n={11} title="Contact">
          <P>
            Questions or requests:{" "}
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
  return (
    <ul className="space-y-2.5 pl-1">{children}</ul>
  );
}

function Item({
  label,
  children,
}: {
  label?: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 text-[16px] leading-relaxed text-[#1B2D45]/85">
      <span
        aria-hidden
        className="mt-2 inline-block h-1.5 w-1.5 rounded-full bg-[#FF6B35] shrink-0"
      />
      <span>
        {label && (
          <strong className="font-semibold text-[#1B2D45]">{label}:</strong>
        )}{" "}
        {children}
      </span>
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
