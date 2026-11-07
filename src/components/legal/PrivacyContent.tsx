import { Link } from "@tanstack/react-router";
import { BUSINESS_NAME, DATA_LAW, MIN_AGE, SUPPORT_EMAIL } from "@/lib/legal";
import { LegalLayout, LegalList, LegalSection } from "./LegalLayout";

export function PrivacyContent() {
  return (
    <LegalLayout
      title="Privacy Policy & Data Protection Notice"
      intro={`${BUSINESS_NAME} keeps very little about you: your name and email, plus what you create in the tools. We never store card numbers, PINs or banking details. This page explains what we hold, why, who helps us hold it, and your rights under ${DATA_LAW} and similar laws that may apply to you.`}
    >
      <LegalSection id="data-notice" title="Data protection & gathering notice">
        <p>
          When you register or use {BUSINESS_NAME}, we collect and process personal data about you.
          This notice tells you, before you give it, what we collect and why:
        </p>
        <LegalList
          items={[
            <>
              <b>Who is responsible:</b> {BUSINESS_NAME} is the controller of your data. Contact:{" "}
              {SUPPORT_EMAIL}.
            </>,
            <>
              <b>What we collect:</b> only what is listed in section 1 below. We do not collect more
              than we need.
            </>,
            <>
              <b>Why:</b> to create and secure your account, give you access to the tools you paid
              for, keep your saved work, and handle payments and support. We use it for nothing
              else.
            </>,
            <>
              <b>Your consent:</b> you give it by ticking the box when you register. You may
              withdraw it by asking us to delete your account (section 7).
            </>,
            <>
              <b>Is providing it voluntary?</b> Yes, but without a name and email we cannot create
              an account.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection id="collect" title="1. What we collect">
        <LegalList
          items={[
            <>
              <b>Account details:</b> your full name, email address and password. The password is
              handled by our authentication provider and stored only in protected, hashed form. We
              cannot read it.
            </>,
            <>
              <b>Proof of agreement:</b> the date and version of the Terms you accepted at sign-up.
            </>,
            <>
              <b>Subscription status:</b> whether you have paid, which month, and when it started
              and ends.
            </>,
            <>
              <b>Payment record:</b> a payment reference, amount, status and date. The mobile number
              you pay from goes to the payment provider to request your approval and is not used for
              anything else. We do not receive or store card numbers, PINs or bank logins.
            </>,
            <>
              <b>What you create:</b> the plans, teams, odds, stakes and results you save in the
              calculator and bet tracker.
            </>,
            <>
              <b>Basic technical data:</b> like most websites, our hosting records your IP address,
              browser type, pages requested and the time, for security and fixing faults.
            </>,
          ]}
        />
        <p>
          We do not ask for your date of birth, address, identity documents or bank details, and we
          do not knowingly collect data from anyone under {MIN_AGE}.
        </p>
      </LegalSection>

      <LegalSection id="use" title="2. How we use it">
        <LegalList
          items={[
            "to create your account, sign you in and keep it secure;",
            "to give you the paid features for the month you bought and to lock them when it ends;",
            "to save and show your own plans and bet history to you, and nobody else;",
            "to process and reconcile your payment and answer support requests, complaints or payment disputes;",
            "to send service emails you need, such as your sign-up confirmation or a password reset;",
            "to prevent fraud, abuse and breaches of our Terms, and to meet legal obligations.",
          ]}
        />
        <p>
          We do not sell your data, rent it out, or use it for advertising, and we do not send
          marketing messages.
        </p>
      </LegalSection>

      <LegalSection id="share" title="3. Who we share it with">
        <p>Only the providers needed to run the service, and only what each needs:</p>
        <LegalList
          items={[
            "Supabase, which provides our database and sign-in and stores your account and saved work;",
            "Railway, which hosts the application and its server logs;",
            "our payment provider, which receives your mobile number and the amount to request and confirm your payment;",
            "authorities or courts where the law requires it, or to protect our rights, other users or the public.",
          ]}
        />
        <p>
          Odds data comes from third-party sources, and no personal data about you is sent to them.
          Our servers or these providers may be located outside your country, so your data may be
          transferred abroad. We use providers that apply appropriate security, and we only send
          what is necessary.
        </p>
      </LegalSection>

      <LegalSection id="security" title="4. Security">
        <p>
          Connections to the site are encrypted. Sign-in uses secure tokens, your saved work is
          protected so each account can only read its own records, and access keys for third-party
          services stay on our servers. No system is perfectly secure, so please use a strong,
          unique password and keep it private.
        </p>
      </LegalSection>

      <LegalSection id="retention" title="5. How long we keep it">
        <p>
          We keep your account and saved work while your account exists. If you ask us to delete it
          we remove your profile and saved work. We may keep a minimal payment record (reference,
          amount, date) for as long as needed for accounting, fraud prevention or to answer a
          dispute, and technical logs are kept by our host for a short, limited period.
        </p>
      </LegalSection>

      <LegalSection id="browser" title="6. Information kept in your browser">
        <p>
          The site stores a small amount of data in your own browser, such as your login session and
          tool settings. We do not store banking details there or anywhere. Details are in our{" "}
          <Link to="/cookies" className="font-semibold text-primary underline">
            Cookie Policy
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection id="rights" title="7. Your rights">
        <p>Under {DATA_LAW} and similar laws, you may ask us to:</p>
        <LegalList
          items={[
            "tell you what personal data we hold about you and give you a copy;",
            "correct anything that is wrong or out of date;",
            "delete your data and close your account;",
            "stop or restrict how we use your data, and withdraw your consent at any time.",
          ]}
        />
        <p>
          Email {SUPPORT_EMAIL} from your account email address. We may need to confirm it is you
          first. Withdrawing consent or deleting your account ends your access and does not entitle
          you to a refund (see our{" "}
          <Link to="/refunds" className="font-semibold text-primary underline">
            Refunds &amp; Cancellation Policy
          </Link>
          ). If you are unhappy with how we handle your data, you may also complain to your national
          data protection authority.
        </p>
      </LegalSection>

      <LegalSection id="links" title="8. Other websites">
        <p>
          The service may mention or link to bookmakers and other sites we do not control. They have
          their own privacy practices, and this policy does not cover them.
        </p>
      </LegalSection>

      <LegalSection id="changes" title="9. Changes">
        <p>
          We may update this policy. The current version is always on this page with its date. If a
          change is significant we will say so at sign-up or sign-in.
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
