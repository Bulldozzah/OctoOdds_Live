import { Link } from "@tanstack/react-router";
import { SALE_PLAN } from "@/lib/supabase";
import { BUSINESS_NAME, SUPPORT_EMAIL } from "@/lib/legal";
import { LegalLayout, LegalList, LegalSection } from "./LegalLayout";

export function RefundsContent() {
  return (
    <LegalLayout
      title="Refunds, Returns, Chargebacks & Cancellation"
      intro={`This policy covers what happens after you pay for ${BUSINESS_NAME}. Please read it before you buy. By paying you confirm you have read and accepted it.`}
    >
      <LegalSection id="summary" title="In short">
        <LegalList
          items={[
            <>
              We sell{" "}
              <b>
                one product: {SALE_PLAN.name} of access for ${SALE_PLAN.price}
              </b>
              , paid once.
            </>,
            <>
              <b>No refunds. No returns. No cancellation</b> of a paid month.
            </>,
            "It never renews, so there is nothing to cancel and nothing is charged again unless you choose to buy again.",
            "You carry any bank, mobile operator or provider charges, including those from reversed or charged-back payments.",
          ]}
        />
      </LegalSection>

      <LegalSection id="returns" title="Customer return policy">
        <p>
          {BUSINESS_NAME} is digital. Nothing is shipped, so there is nothing to return, and we do
          not accept returns. Access is delivered instantly to your account when payment is
          confirmed.
        </p>
      </LegalSection>

      <LegalSection id="refunds" title="Refund policy">
        <p>
          <b>All payments are final and non-refundable.</b> This applies whether or not you used the
          service, and whether you changed your mind, bought by mistake, did not find it suitable,
          or did not use all of the month.
        </p>
        <p>
          We make this clear because access starts the moment you pay, and the free{" "}
          <Link to="/sample" className="font-semibold text-primary underline">
            sample
          </Link>{" "}
          shows how the calculator, scanner and bet stats work before you spend anything.
        </p>
        <p>
          <b>If our system fails</b> (for example you paid and access was not activated, or a
          technical error on our side blocked a paid month), we will not refund but will correct the
          problem by activating the access you paid for. Send us your account email and payment
          reference at {SUPPORT_EMAIL}.
        </p>
      </LegalSection>

      <LegalSection id="chargebacks" title="Chargebacks, reversals and bank charges">
        <LegalList
          items={[
            "Please contact us at the address below before disputing a payment with your bank, mobile operator or provider. Most problems can be solved quickly that way.",
            "You are responsible for all fees, levies and charges made by your bank, mobile network operator, wallet or payment provider, including any charge that arises from a failed, reversed, disputed or charged-back payment.",
            "If a payment is charged back or reversed, we may immediately suspend or close the account and lock paid features. We may recover from you the amount reversed plus the chargeback and processing fees we are charged.",
            "A dispute for access you received and used, or one made fraudulently or in bad faith, is a breach of our Terms. We may supply the provider with the evidence of your sign-up, your acceptance of these policies, and your usage, and we may refuse to sell to you again.",
            "We never store card numbers, PINs or banking details, so a payment can only be confirmed, reversed or disputed through your own bank or mobile money provider.",
          ]}
        />
      </LegalSection>

      <LegalSection id="cancellation" title="Cancellation policy">
        <LegalList
          items={[
            <>
              The plan is a single month ({SALE_PLAN.name}) bought with a single payment.{" "}
              <b>It does not renew automatically</b>, so there is no recurring charge to cancel.
            </>,
            "Once paid, the month cannot be cancelled, shortened or paused, and the unused part is not refunded.",
            "Your access runs to the end of the paid month. After that, paid features lock until you choose to buy another month.",
            "You can ask us to close your account at any time. Closing it ends your access straight away and does not entitle you to a refund.",
            "Before payment is confirmed, you can simply leave the payment screen or decline the prompt on your phone and nothing is charged.",
          ]}
        />
      </LegalSection>

      <LegalSection id="contact" title="Questions">
        <p>
          Email <b>{SUPPORT_EMAIL}</b> with your account email and, where relevant, the payment
          reference. See also our{" "}
          <Link to="/terms" className="font-semibold text-primary underline">
            Terms &amp; Conditions
          </Link>
          .
        </p>
      </LegalSection>
    </LegalLayout>
  );
}
