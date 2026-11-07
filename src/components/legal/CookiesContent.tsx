import { Link } from "@tanstack/react-router";
import { BUSINESS_NAME, SUPPORT_EMAIL } from "@/lib/legal";
import { LegalLayout, LegalList, LegalSection } from "./LegalLayout";

export function CookiesContent() {
  return (
    <LegalLayout
      title="Cookie & Browser Storage Policy"
      intro={`${BUSINESS_NAME} only uses your web browser's storage for things the site needs in order to work: keeping you signed in and remembering your settings. We use no advertising or tracking cookies, and we never store banking details.`}
    >
      <LegalSection id="what" title="1. What this means">
        <p>
          Websites can save small pieces of information in your browser (cookies and local storage).
          We use this only to make the service work for you, and not to follow you around the web or
          to profile you.
        </p>
      </LegalSection>

      <LegalSection id="used" title="2. What we store in your browser">
        <LegalList
          items={[
            <>
              <b>Your login session</b> (from our authentication provider): keeps you signed in so
              you do not have to enter your password on every page. It is removed when you log out.
            </>,
            <>
              <b>Calculator data:</b> your draft plan and any combo you send from the scanner to the
              calculator.
            </>,
            <>
              <b>Scanner settings and last scan:</b> your filters, and the most recent odds results
              so they stay on screen until you scan again.
            </>,
            <>
              <b>Interface preferences:</b> for example whether the side menu is open, and that you
              have seen the notice about browser storage.
            </>,
          ]}
        />
        <p>
          All of this stays on your device. It is essential to the service, so it is not used for
          advertising or analytics.
        </p>
      </LegalSection>

      <LegalSection id="not" title="3. What we do not do">
        <LegalList
          items={[
            "We do not use advertising, tracking or analytics cookies.",
            "We do not store card numbers, PINs, mobile money details or any banking information in your browser or on our servers.",
            "We do not sell or share browser data with advertisers.",
          ]}
        />
      </LegalSection>

      <LegalSection id="third" title="4. Third-party content">
        <p>
          To display text in our chosen typefaces, your browser loads fonts from Google Fonts. When
          it does, Google receives your IP address and browser details as part of that request,
          under Google's own privacy policy. Our payment provider may use its own cookies on its
          payment pages, which we do not control.
        </p>
      </LegalSection>

      <LegalSection id="control" title="5. Your choices">
        <p>
          You can clear or block site data in your browser settings at any time. Because the login
          session is essential, blocking it means you will not be able to stay signed in. Clearing
          it will also remove your saved drafts and settings from that device. Your saved plans
          stored in your account are not affected.
        </p>
      </LegalSection>

      <LegalSection id="more" title="6. More information">
        <p>
          See our{" "}
          <Link to="/privacy" className="font-semibold text-primary underline">
            Privacy Policy
          </Link>{" "}
          for how we handle your personal data, or email {SUPPORT_EMAIL}.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
