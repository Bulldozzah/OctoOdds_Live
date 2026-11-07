import { Link } from "@tanstack/react-router";
import { SALE_PLAN } from "@/lib/supabase";
import { BUSINESS_NAME, GOVERNING_LAW, MIN_AGE, SUPPORT_EMAIL } from "@/lib/legal";
import { LegalLayout, LegalList, LegalSection } from "./LegalLayout";

export function TermsContent() {
  return (
    <LegalLayout
      title="Terms & Conditions"
      intro={`These Terms govern your use of the ${BUSINESS_NAME} website and software. By creating an account you confirm that you have read, understood and accepted them, together with our Privacy Policy, Cookie Policy and Refunds & Cancellation Policy.`}
    >
      <LegalSection title="1. What OctoOdds is">
        <p>
          {BUSINESS_NAME} is a subscription analytics and information service. It shows bookmaker
          odds from public data sources, helps you compare prices, and provides calculators for
          planning how a stake could be split across outcomes.
        </p>
        <LegalList
          items={[
            <>
              <b>We are not a bookmaker.</b> We do not accept, place, hold or settle bets, we do not
              hold customer funds for betting, and we do not pay out winnings.
            </>,
            "Any bet you choose to place is placed by you, directly with a bookmaker of your choice, under that bookmaker's own rules and licence.",
            "Nothing on the service is betting, financial or investment advice, and nothing is a promise of profit.",
          ]}
        />
      </LegalSection>

      <LegalSection title="2. Who may use the service">
        <LegalList
          items={[
            `You must be at least ${MIN_AGE} years old, or the age of majority where you live if that is higher.`,
            "You are responsible for checking that using the service, and betting at any bookmaker, is lawful where you are. We do not offer the service where it is prohibited.",
            "You must give accurate details when you register and keep them up to date.",
          ]}
        />
      </LegalSection>

      <LegalSection title="3. Your account">
        <LegalList
          items={[
            "One account per person. Do not create duplicate accounts or register again under another name or email.",
            "Keep your password confidential. Everything done through your account is treated as done by you, and you must tell us promptly at the address below if you think someone else has access.",
            "Accounts are personal. You may not share, sell, rent or transfer an account or its access.",
            "We may suspend or close an account that breaks these Terms, is used fraudulently, or is used to abuse the service, with no refund.",
          ]}
        />
      </LegalSection>

      <LegalSection id="subscription" title="4. Subscription: one month, one payment">
        <LegalList
          items={[
            <>
              The only plan we sell is <b>{SALE_PLAN.name}</b> of access for a single payment of{" "}
              <b>${SALE_PLAN.price}</b> (or the local-currency equivalent shown at payment).
            </>,
            "Access starts when your payment is confirmed and lasts for one calendar month from that moment. It does not renew automatically and we never charge you again without you choosing to pay again.",
            "When the month ends, paid features lock until you choose to buy another month. Your account and saved data remain.",
            "We may change the price or features for future purchases. A change never affects a month you have already paid for.",
          ]}
        />
      </LegalSection>

      <LegalSection id="payments" title="5. Payments, fees and charges">
        <LegalList
          items={[
            "Payments are taken through a third-party mobile money or payment provider. We do not receive or store your card number, PIN, bank login or any other banking details.",
            "You are responsible for every fee, levy, exchange-rate difference and charge made by your bank, mobile network operator, wallet or payment provider in connection with your payment, including any charge that arises from a failed, reversed, disputed or charged-back payment.",
            "If a payment is reversed, charged back or disputed, we may suspend the account immediately and recover from you the amount reversed together with the fees and costs we were charged.",
            "You confirm that the account, number or card you pay with is yours or that you have the owner's permission to use it.",
          ]}
        />
      </LegalSection>

      <LegalSection id="no-refunds" title="6. No refunds and no cancellation">
        <p>
          Because access is digital and starts immediately,{" "}
          <b>all payments are final and non-refundable</b>, and a paid month cannot be cancelled
          part-way through. There are no returns. This is explained in full in our{" "}
          <Link to="/refunds" className="font-semibold text-primary underline">
            Refunds &amp; Cancellation Policy
          </Link>
          , which forms part of these Terms. A free read-only{" "}
          <Link to="/sample" className="font-semibold text-primary underline">
            sample
          </Link>{" "}
          is available so you can see how the service works before you pay.
        </p>
        <p>
          If our own error means you paid but access was not activated, contact us and we will put
          it right by activating the access you paid for.
        </p>
      </LegalSection>

      <LegalSection title="7. Acceptable use">
        <p>You agree not to:</p>
        <LegalList
          items={[
            "copy, scrape, resell or republish the service's data, odds or results, or use bots or automated tools to collect them;",
            "attempt to bypass the paywall, probe or disrupt the service, or interfere with other users;",
            "use the service for anything unlawful, or to defraud a bookmaker, a payment provider or us;",
            "misuse the payment dispute process, for example by disputing a payment for access you received.",
          ]}
        />
      </LegalSection>

      <LegalSection title="8. Data accuracy and availability">
        <LegalList
          items={[
            "Odds and fixtures come from third-party sources and change constantly. They may be late, wrong or unavailable, and a price shown here may no longer exist at the bookmaker. Always check at the bookmaker before acting.",
            "Calculators work from the figures you enter or load. Results are only as good as those inputs, and rounding, tax and bookmaker rules can change real outcomes.",
            "We aim for a reliable service but do not promise it will be uninterrupted or error-free.",
          ]}
        />
      </LegalSection>

      <LegalSection title="9. Liability">
        <LegalList
          items={[
            "You use the service and make every betting decision at your own risk. We are not responsible for any bet you place or any loss, missed profit or other consequence of relying on the service.",
            "To the fullest extent the law allows, our total liability to you for any claim is limited to the amount you paid for the month in which the claim arose.",
            "Nothing in these Terms removes rights you have under law that cannot be excluded.",
          ]}
        />
      </LegalSection>

      <LegalSection title="10. Responsible use">
        <p>
          Betting can be addictive and you can lose money. Only stake what you can afford to lose,
          never chase losses, and seek help if gambling stops being fun. If you want to stop, you
          can ask us to close your account at any time, and you should also use the self-exclusion
          tools offered by your bookmaker.
        </p>
      </LegalSection>

      <LegalSection title="11. Complaints">
        <p>
          Write to <b>{SUPPORT_EMAIL}</b> within 10 days of the issue, giving your account email and
          what happened, with any proof. We will reply within 30 days. Please contact us before
          raising a dispute with your bank or mobile operator, so we can try to fix it first.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes, ending and law">
        <LegalList
          items={[
            "We may update these Terms. The current version is always on this page, and a material change applies from your next sign-up or purchase.",
            "You may stop using the service at any time. Closing your account does not entitle you to a refund.",
            `These Terms are governed by the laws of ${GOVERNING_LAW}, and its courts have jurisdiction over any dispute, unless the law where you live gives you the right to bring a claim elsewhere.`,
          ]}
        />
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          {BUSINESS_NAME} · <b>{SUPPORT_EMAIL}</b>
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
