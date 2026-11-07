/**
 * Plain-text copy of the site's policies, used only to render the PDF
 * (scripts/gen-policies-pdf.mjs -> public/octoodds-policies.pdf).
 * Keep it in step with src/components/legal/* and regenerate the PDF whenever
 * a policy changes. Shared facts mirror src/lib/legal.ts.
 */
export const DOC = {
  title: "OctoOdds — Terms, Policies & Legal Information",
  updated: "Last updated: 7 November 2026",
  contact: "OctoOdds · support@octoodds.com",
  policies: [
    {
      title: "1. Terms & Conditions",
      sections: [
        {
          title: "What OctoOdds is",
          body: [
            "OctoOdds is a subscription analytics and information service. It shows bookmaker odds from public data sources, helps you compare prices, and provides calculators for planning how a stake could be split across outcomes.",
            "We are not a bookmaker. We do not accept, place, hold or settle bets, we do not hold customer funds for betting, and we do not pay out winnings. Any bet you choose to place is placed by you, directly with a bookmaker of your choice, under that bookmaker's own rules and licence. Nothing on the service is betting, financial or investment advice, and nothing is a promise of profit.",
          ],
        },
        {
          title: "Who may use the service",
          body: [
            "You must be at least 18 years old, or the age of majority where you live if that is higher.",
            "You are responsible for checking that using the service, and betting at any bookmaker, is lawful where you are. We do not offer the service where it is prohibited.",
            "You must give accurate details when you register and keep them up to date.",
          ],
        },
        {
          title: "Your account",
          body: [
            "One account per person. Do not create duplicate accounts or register again under another name or email.",
            "Keep your password confidential. Everything done through your account is treated as done by you, and you must tell us promptly at the address below if you think someone else has access.",
            "Accounts are personal. You may not share, sell, rent or transfer an account or its access.",
            "We may suspend or close an account that breaks these Terms, is used fraudulently, or is used to abuse the service, with no refund.",
          ],
        },
        {
          title: "Subscription: one month, one payment",
          body: [
            "The only plan we sell is 1 Month of access for a single payment of $5 (or the local-currency equivalent shown at payment).",
            "Access starts when your payment is confirmed and lasts for one calendar month from that moment. It does not renew automatically and we never charge you again without you choosing to pay again.",
            "When the month ends, paid features lock until you choose to buy another month. Your account and saved data remain.",
            "We may change the price or features for future purchases. A change never affects a month you have already paid for.",
          ],
        },
        {
          title: "Payments, fees and charges",
          body: [
            "Payments are taken through a third-party mobile money or payment provider. We do not receive or store your card number, PIN, bank login or any other banking details.",
            "You are responsible for every fee, levy, exchange-rate difference and charge made by your bank, mobile network operator, wallet or payment provider in connection with your payment, including any charge that arises from a failed, reversed, disputed or charged-back payment.",
            "If a payment is reversed, charged back or disputed, we may suspend the account immediately and recover from you the amount reversed together with the fees and costs we were charged.",
            "You confirm that the account, number or card you pay with is yours or that you have the owner's permission to use it.",
          ],
        },
        {
          title: "No refunds and no cancellation",
          body: [
            "Because access is digital and starts immediately, all payments are final and non-refundable, and a paid month cannot be cancelled part-way through. There are no returns. This is explained in full in our Refunds & Cancellation Policy, which forms part of these Terms. A free read-only sample is available on the site so you can see how the service works before you pay.",
            "If our own error means you paid but access was not activated, contact us and we will put it right by activating the access you paid for.",
          ],
        },
        {
          title: "Acceptable use",
          body: [
            "You agree not to: copy, scrape, resell or republish the service's data, odds or results, or use bots or automated tools to collect them; attempt to bypass the paywall, probe or disrupt the service, or interfere with other users; use the service for anything unlawful, or to defraud a bookmaker, a payment provider or us; misuse the payment dispute process, for example by disputing a payment for access you received.",
          ],
        },
        {
          title: "Data accuracy and availability",
          body: [
            "Odds and fixtures come from third-party sources and change constantly. They may be late, wrong or unavailable, and a price shown here may no longer exist at the bookmaker. Always check at the bookmaker before acting.",
            "Calculators work from the figures you enter or load. Results are only as good as those inputs, and rounding, tax and bookmaker rules can change real outcomes.",
            "We aim for a reliable service but do not promise it will be uninterrupted or error-free.",
          ],
        },
        {
          title: "Liability",
          body: [
            "You use the service and make every betting decision at your own risk. We are not responsible for any bet you place or any loss, missed profit or other consequence of relying on the service.",
            "To the fullest extent the law allows, our total liability to you for any claim is limited to the amount you paid for the month in which the claim arose.",
            "Nothing in these Terms removes rights you have under law that cannot be excluded.",
          ],
        },
        {
          title: "Responsible use",
          body: [
            "Betting can be addictive and you can lose money. Only stake what you can afford to lose, never chase losses, and seek help if gambling stops being fun. If you want to stop, you can ask us to close your account at any time, and you should also use the self-exclusion tools offered by your bookmaker.",
          ],
        },
        {
          title: "Complaints",
          body: [
            "Write to support@octoodds.com within 10 days of the issue, giving your account email and what happened, with any proof. We will reply within 30 days. Please contact us before raising a dispute with your bank or mobile operator, so we can try to fix it first.",
          ],
        },
        {
          title: "Changes, ending and law",
          body: [
            "We may update these Terms. The current version is always on the website, and a material change applies from your next sign-up or purchase.",
            "You may stop using the service at any time. Closing your account does not entitle you to a refund.",
            "These Terms are governed by the laws of the Republic of Zambia, and its courts have jurisdiction over any dispute, unless the law where you live gives you the right to bring a claim elsewhere.",
          ],
        },
      ],
    },
    {
      title: "2. Refunds, Returns, Chargebacks & Cancellation",
      sections: [
        {
          title: "In short",
          body: [
            "We sell one product: 1 Month of access for $5, paid once. No refunds. No returns. No cancellation of a paid month. It never renews, so there is nothing to cancel and nothing is charged again unless you choose to buy again. You carry any bank, mobile operator or provider charges, including those from reversed or charged-back payments.",
          ],
        },
        {
          title: "Customer return policy",
          body: [
            "OctoOdds is digital. Nothing is shipped, so there is nothing to return, and we do not accept returns. Access is delivered instantly to your account when payment is confirmed.",
          ],
        },
        {
          title: "Refund policy",
          body: [
            "All payments are final and non-refundable. This applies whether or not you used the service, and whether you changed your mind, bought by mistake, did not find it suitable, or did not use all of the month.",
            "We make this clear because access starts the moment you pay, and the free sample shows how the calculator, scanner and bet stats work before you spend anything.",
            "If our system fails (for example you paid and access was not activated, or a technical error on our side blocked a paid month), we will not refund but will correct the problem by activating the access you paid for.",
          ],
        },
        {
          title: "Chargebacks, reversals and bank charges",
          body: [
            "Please contact us before disputing a payment with your bank, mobile operator or provider. Most problems can be solved quickly that way.",
            "You are responsible for all fees, levies and charges made by your bank, mobile network operator, wallet or payment provider, including any charge that arises from a failed, reversed, disputed or charged-back payment.",
            "If a payment is charged back or reversed, we may immediately suspend or close the account and lock paid features. We may recover from you the amount reversed plus the chargeback and processing fees we are charged.",
            "A dispute for access you received and used, or one made fraudulently or in bad faith, is a breach of our Terms. We may supply the provider with the evidence of your sign-up, your acceptance of these policies, and your usage, and we may refuse to sell to you again.",
          ],
        },
        {
          title: "Cancellation policy",
          body: [
            "The plan is a single month bought with a single payment. It does not renew automatically, so there is no recurring charge to cancel.",
            "Once paid, the month cannot be cancelled, shortened or paused, and the unused part is not refunded.",
            "Your access runs to the end of the paid month. After that, paid features lock until you choose to buy another month.",
            "You can ask us to close your account at any time. Closing it ends your access straight away and does not entitle you to a refund.",
            "Before payment is confirmed, you can simply leave the payment screen or decline the prompt on your phone and nothing is charged.",
          ],
        },
      ],
    },
    {
      title: "3. Privacy Policy & Data Protection Notice",
      sections: [
        {
          title: "Data protection & gathering notice",
          body: [
            "When you register or use OctoOdds, we collect and process personal data about you. OctoOdds is the controller of your data; contact support@octoodds.com.",
            "We collect only what is listed below — no more than we need. We use it to create and secure your account, give you access to the tools you paid for, keep your saved work, and handle payments and support. We use it for nothing else.",
            "You give consent by ticking the box when you register, and you may withdraw it by asking us to delete your account. Providing data is voluntary, but without a name and email we cannot create an account.",
          ],
        },
        {
          title: "What we collect",
          body: [
            "Account details: your full name, email address and password. The password is handled by our authentication provider and stored only in protected, hashed form. We cannot read it.",
            "Proof of agreement: the date and version of the Terms you accepted at sign-up.",
            "Subscription status: whether you have paid, which month, and when it started and ends.",
            "Payment record: a payment reference, amount, status and date. The mobile number you pay from goes to the payment provider to request your approval and is not used for anything else. We do not receive or store card numbers, PINs or bank logins.",
            "What you create: the plans, teams, odds, stakes and results you save in the calculator and bet tracker.",
            "Basic technical data: like most websites, our hosting records your IP address, browser type, pages requested and the time, for security and fixing faults.",
            "We do not ask for your date of birth, address, identity documents or bank details, and we do not knowingly collect data from anyone under 18.",
          ],
        },
        {
          title: "How we use it",
          body: [
            "To create your account, sign you in and keep it secure; to give you the paid features for the month you bought and to lock them when it ends; to save and show your own plans and bet history to you, and nobody else; to process and reconcile your payment and answer support requests, complaints or payment disputes; to send service emails you need, such as your sign-up confirmation or a password reset; to prevent fraud, abuse and breaches of our Terms, and to meet legal obligations.",
            "We do not sell your data, rent it out, or use it for advertising, and we do not send marketing messages.",
          ],
        },
        {
          title: "Who we share it with",
          body: [
            "Only the providers needed to run the service, and only what each needs: Supabase, which provides our database and sign-in and stores your account and saved work; Railway, which hosts the application and its server logs; our payment provider, which receives your mobile number and the amount to request and confirm your payment; and authorities or courts where the law requires it, or to protect our rights, other users or the public.",
            "Odds data comes from third-party sources, and no personal data about you is sent to them. Our servers or these providers may be located outside your country, so your data may be transferred abroad. We use providers that apply appropriate security, and we only send what is necessary.",
          ],
        },
        {
          title: "Security",
          body: [
            "Connections to the site are encrypted. Sign-in uses secure tokens, your saved work is protected so each account can only read its own records, and access keys for third-party services stay on our servers. No system is perfectly secure, so please use a strong, unique password and keep it private.",
          ],
        },
        {
          title: "How long we keep it",
          body: [
            "We keep your account and saved work while your account exists. If you ask us to delete it we remove your profile and saved work. We may keep a minimal payment record (reference, amount, date) for as long as needed for accounting, fraud prevention or to answer a dispute, and technical logs are kept by our host for a short, limited period.",
          ],
        },
        {
          title: "Your rights",
          body: [
            "Under the Data Protection Act No. 3 of 2023 of Zambia and similar laws, you may ask us to: tell you what personal data we hold about you and give you a copy; correct anything that is wrong or out of date; delete your data and close your account; or stop or restrict how we use your data, and withdraw your consent at any time.",
            "Email support@octoodds.com from your account email address. We may need to confirm it is you first. Withdrawing consent or deleting your account ends your access and does not entitle you to a refund. If you are unhappy with how we handle your data, you may also complain to your national data protection authority.",
          ],
        },
        {
          title: "Other websites and changes",
          body: [
            "The service may mention or link to bookmakers and other sites we do not control. They have their own privacy practices, and this policy does not cover them.",
            "We may update this policy. The current version is always on the website with its date. If a change is significant we will say so at sign-up or sign-in.",
          ],
        },
      ],
    },
    {
      title: "4. Cookie & Browser Storage Policy",
      sections: [
        {
          title: "What this means",
          body: [
            "Websites can save small pieces of information in your browser (cookies and local storage). We use this only to make the service work for you, and not to follow you around the web or to profile you.",
          ],
        },
        {
          title: "What we store in your browser",
          body: [
            "Your login session (from our authentication provider): keeps you signed in so you do not have to enter your password on every page. It is removed when you log out.",
            "Calculator data: your draft plan and any combo you send from the scanner to the calculator.",
            "Scanner settings and last scan: your filters, and the most recent odds results so they stay on screen until you scan again.",
            "Interface preferences: for example whether the side menu is open, and that you have seen the notice about browser storage.",
            "All of this stays on your device. It is essential to the service, so it is not used for advertising or analytics.",
          ],
        },
        {
          title: "What we do not do",
          body: [
            "We do not use advertising, tracking or analytics cookies. We do not store card numbers, PINs, mobile money details or any banking information in your browser or on our servers. We do not sell or share browser data with advertisers.",
          ],
        },
        {
          title: "Third-party content",
          body: [
            "To display text in our chosen typefaces, your browser loads fonts from Google Fonts. When it does, Google receives your IP address and browser details as part of that request, under Google's own privacy policy. Our payment provider may use its own cookies on its payment pages, which we do not control.",
          ],
        },
        {
          title: "Your choices",
          body: [
            "You can clear or block site data in your browser settings at any time. Because the login session is essential, blocking it means you will not be able to stay signed in. Clearing it will also remove your saved drafts and settings from that device. Your saved plans stored in your account are not affected.",
          ],
        },
      ],
    },
  ],
};
