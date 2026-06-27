import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Accessibility",
  description:
    "cribb's commitment to digital accessibility, our conformance target (WCAG 2.1 AA), and how to request support or give feedback.",
  alternates: { canonical: "https://findyourcribb.com/accessibility" },
};

const LAST_UPDATED = "June 26, 2026";

export default function AccessibilityPage() {
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
            Accessibility Statement
          </h1>
          <p className="mt-4 text-sm text-[#1B2D45]/55">
            Last updated: {LAST_UPDATED}
          </p>
        </header>

        <p className="text-[17px] leading-relaxed text-[#1B2D45]/85">
          cribb (&quot;cribb&quot;, &quot;we&quot;, &quot;us&quot;, &quot;our&quot;)
          is a student housing platform for the University of Guelph community,
          operated by Adeoluwa Ojulari and David Amaefula as individuals. We want
          everyone — including people with disabilities — to be able to find
          housing, message landlords, and use every part of cribb independently
          and with dignity. This statement explains the accessibility standard we
          work toward, what we have done so far, where we know we fall short, and
          how to get help or send feedback.
        </p>

        <Section n={1} title="Our commitment">
          <P>
            We treat accessibility as an ongoing responsibility, not a one-time
            project. We design and build cribb with the goal that people who use
            screen readers, keyboard-only navigation, screen magnification,
            speech-recognition software, or other assistive technologies can
            access the same information and complete the same tasks as anyone
            else.
          </P>
          <P>
            We also aim to meet our obligations under the{" "}
            <em>Accessibility for Ontarians with Disabilities Act, 2005</em>{" "}
            (AODA) and its Integrated Accessibility Standards Regulation
            (O. Reg. 191/11), including the principles of providing information in
            accessible formats and welcoming feedback on accessibility.
          </P>
        </Section>

        <Section n={2} title="Conformance target">
          <P>
            cribb aims to conform to the{" "}
            <A href="https://www.w3.org/TR/WCAG21/">
              Web Content Accessibility Guidelines (WCAG) 2.1, Level AA
            </A>
            , published by the World Wide Web Consortium (W3C). These guidelines
            explain how to make web content more accessible to people with a wide
            range of disabilities, including visual, auditory, physical, speech,
            cognitive, language, learning, and neurological disabilities.
          </P>
          <P>
            cribb is{" "}
            <strong className="font-semibold text-[#1B2D45]">
              partially conformant
            </strong>{" "}
            with WCAG 2.1 Level AA. &quot;Partially conformant&quot; means that
            some parts of the content do not yet fully meet the standard. We have
            not yet completed a formal third-party accessibility audit, and we do
            not claim full conformance. We are actively working to close the gaps
            described below.
          </P>
        </Section>

        <Section n={3} title="What we have done">
          <List>
            <Item label="Semantic structure">
              Pages use meaningful HTML headings, landmarks, lists, and labels so
              assistive technologies can convey page structure.
            </Item>
            <Item label="Keyboard access">
              Core flows — browsing listings, opening a listing, saving, and
              messaging — are operable with a keyboard, and interactive elements
              are reachable in a logical order. A &quot;Skip to main
              content&quot; link is available at the top of every page.
            </Item>
            <Item label="Visible focus">
              Interactive elements show a visible focus outline when navigating
              by keyboard, applied site-wide, so keyboard users can always see
              where they are.
            </Item>
            <Item label="Reduced motion">
              cribb honours the operating-system &quot;reduce motion&quot;
              setting; when it is enabled, animations and transitions are
              minimised across the site.
            </Item>
            <Item label="Text alternatives">
              Images include text descriptions (alt text), and key icons are
              paired with visible or accessible labels.
            </Item>
            <Item label="Responsive, resizable layouts">
              Content reflows on small screens and remains usable when text is
              zoomed, without horizontal scrolling at standard breakpoints.
            </Item>
          </List>
        </Section>

        <Section n={4} title="Areas we are still improving">
          <P>
            We want to be honest about where cribb does not yet fully meet our
            target. Known limitations include:
          </P>
          <List>
            <Item label="Interactive maps">
              Our maps use Google Maps. The map canvas itself may not be fully
              operable by keyboard or screen reader. Where a map appears, we also
              provide the property address in text, and nearby points of interest
              are listed in text below the map so the information is available
              without using the map.
            </Item>
            <Item label="User-generated content">
              Listing photos, marketplace photos, and profile images are uploaded
              by students and landlords. We cannot guarantee that every uploaded
              image includes a meaningful description written by the uploader.
            </Item>
            <Item label="Uploaded documents">
              Documents provided for landlord verification are supplied by third
              parties and may not be in an accessible format.
            </Item>
            <Item label="Some complex components">
              Certain interactive components (such as date pickers, sliders, and
              modal dialogs) are being reviewed and refined for full keyboard and
              screen-reader support.
            </Item>
            <Item label="Colour contrast">
              We have not yet completed a full colour-contrast review. Some lighter
              text and subtle UI elements may not meet the WCAG AA contrast ratio,
              and we are auditing and correcting these.
            </Item>
            <Item label="Icon-only controls and form labels">
              Most controls have text or accessible labels, but some icon-only
              buttons and form fields are still being given clearer names and
              programmatic labels for screen-reader users.
            </Item>
          </List>
        </Section>

        <Section n={5} title="Third-party content">
          <P>
            Some features rely on third-party services — for example Google Maps
            for maps and address lookup, and Cloudflare Turnstile for bot
            protection. We do not control the accessibility of these third-party
            components, but we choose providers that publish their own
            accessibility commitments and we provide text alternatives where we
            can. Content posted by other users (listings, reviews, marketplace
            items, and messages) is created by those users and is not authored by
            us.
          </P>
        </Section>

        <Section n={6} title="Compatibility with assistive technology">
          <P>
            cribb is designed to work with current versions of major browsers
            (Chrome, Safari, Firefox, and Edge) and with the assistive
            technologies built into modern operating systems, including screen
            readers and browser zoom. It may not work well with browsers or
            assistive technologies more than a few versions out of date. If you
            use a specific setup and run into a barrier, please tell us — it helps
            us prioritise.
          </P>
        </Section>

        <Section n={7} title="Accessible formats and communication support">
          <P>
            If you need information that is on cribb — such as a listing&apos;s
            details, our Terms, or this statement — in an accessible format or
            with communication support, contact us and we will work with you to
            provide it in a way that meets your needs, at no additional cost. We
            will consult with you about your needs and aim to provide the
            requested format in a timely manner.
          </P>
        </Section>

        <Section n={8} title="Feedback">
          <P>
            We welcome your feedback on the accessibility of cribb. If you
            encounter a barrier, or if something does not work with your
            assistive technology, please let us know — your reports directly shape
            what we fix next.
          </P>
          <List>
            <Item label="Email">
              <A href="mailto:hello@findyourcribb.com?subject=Accessibility%20feedback">
                hello@findyourcribb.com
              </A>{" "}
              (please put &quot;Accessibility&quot; in the subject line).
            </Item>
            <Item label="What helps us">
              the page or feature, what you were trying to do, the browser and
              assistive technology you were using, and what went wrong.
            </Item>
          </List>
          <P>
            We aim to acknowledge accessibility feedback within five business days
            and to give a substantive response — including next steps or a
            timeline — as soon as we reasonably can. Feedback is accepted by email
            and we will arrange an alternative method on request.
          </P>
        </Section>

        <Section n={9} title="Ongoing effort">
          <P>
            Accessibility is never &quot;done.&quot; As we add features and as
            standards evolve, we review new and existing pages, fix issues we find
            or that you report, and revisit this statement. We intend to pursue a
            more formal accessibility review as cribb grows.
          </P>
        </Section>

        <Section n={10} title="Changes to this statement">
          <P>
            We may update this statement as cribb changes and as our accessibility
            work progresses. The &quot;Last updated&quot; date above reflects the
            most recent revision.
          </P>
        </Section>

        <Section n={11} title="Contact">
          <P>
            For anything related to accessibility:{" "}
            <A href="mailto:hello@findyourcribb.com">hello@findyourcribb.com</A>
          </P>
          <P>
            You can also reach the people behind cribb directly: Adeoluwa Ojulari
            (
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
    <a href={href} className="text-[#FF6B35] underline-offset-4 hover:underline">
      {children}
    </a>
  );
}
