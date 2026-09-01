import type { StarterSubject } from "../types.js";

const ICAI = "https://www.icai.org/";
const MCA = "https://www.mca.gov.in/";
const CBIC = "https://www.cbic.gov.in/";
const GST = "https://www.gst.gov.in/";
const ITD = "https://www.incometaxindia.gov.in/";

export const CA_ACCOUNTING: StarterSubject = {
  slug: "ca-accounting",
  name: "Accounting & Financial Reporting",
  description:
    "Ind AS framework, recognition and measurement, and group accounts, worked the way ICAI papers ask for them.",
  paper: "CA Intermediate & Final",
  topics: [
    {
      slug: "framework-and-presentation",
      title: "Framework & Presentation",
      articles: [
        {
          slug: "ind-as-framework-and-presentation",
          title: "The Ind AS Framework: Applicability, Presentation and Cash Flows",
          syllabusAnchor:
            "CA Final Paper 1 (Financial Reporting) — Conceptual Framework for Financial Reporting under Indian Accounting Standards; Application of Ind AS 1 and Ind AS 7.",
          mustCover: [
            "The Companies (Indian Accounting Standards) Rules, 2015: how the phased roadmap brings companies in by listing status and net worth, why the move is one-way, and the role of Ind AS 101 on first-time adoption",
            "The Conceptual Framework: the objective of general purpose financial reporting, the fundamental qualitative characteristics of relevance and faithful representation, and the four enhancing characteristics",
            "Framework definitions of asset, liability, equity, income and expense, together with the recognition, derecognition and measurement bases the Framework permits",
            "Ind AS 1: the complete set of financial statements, going concern and accrual, materiality and aggregation, the prohibition on offsetting, and current versus non-current classification",
            "Other comprehensive income under Ind AS 1: which items are subsequently reclassified to profit or loss and which are never reclassified",
            "Ind AS 7: the three activity classifications, what qualifies as a cash equivalent, and how interest, dividends and income taxes are classified",
            "The indirect method: profit before tax adjusted for non-cash items, working capital movements, and items presented as investing or financing",
            "Where Ind AS departs from the earlier AS regime: fair value measurement, substance-driven consolidation, and the OCI concept that AS has no equivalent for",
          ],
          worked: [
            "Prepare cash flow from operating activities by the indirect method from an illustrative profit figure carrying depreciation, a fixed asset sale and working capital movements",
            "Classify an illustrative list of transactions into operating, investing and financing, flagging the ones where the classification is a policy choice",
          ],
          traps: [
            "Treating any short-term investment as a cash equivalent — the test is short maturity and insignificant risk of change in value, not management intention",
            "Presenting a loan repayment wholly as financing when part of the outflow is interest the entity has elected to present elsewhere",
          ],
          officialSources: [ICAI, MCA],
          diagram: "hierarchy",
          keywords: [
            "Ind AS applicability rules 2015",
            "conceptual framework qualitative characteristics",
            "Ind AS 1 presentation of financial statements",
            "Ind AS 7 cash flow statement indirect method",
          ],
        },
      ],
    },
    {
      slug: "recognition-and-measurement",
      title: "Recognition & Measurement",
      articles: [
        {
          slug: "ind-as-115-revenue-recognition",
          title: "Ind AS 115: The Five-Step Revenue Model Applied",
          syllabusAnchor:
            "CA Final Paper 1 (Financial Reporting) — Application of Indian Accounting Standards: Ind AS 115 Revenue from Contracts with Customers.",
          mustCover: [
            "Steps 1 and 2: identifying the contract with a customer, and identifying performance obligations by testing whether each promised good or service is distinct within the context of the contract",
            "Step 3: determining the transaction price, variable consideration measured as expected value or most likely amount, and the constraint on amounts highly susceptible to reversal",
            "Step 4: allocating the transaction price on relative standalone selling prices, and when a discount is allocated to specific performance obligations instead of all of them",
            "Step 5: recognising revenue when control transfers, the criteria that make an obligation satisfied over time, and output versus input measures of progress",
            "Principal versus agent: the control indicators, and the difference between recognising gross consideration and a net commission",
            "Significant financing components, non-cash consideration, and consideration payable to a customer",
            "Contract assets, contract liabilities and receivables, and the treatment of costs to obtain and to fulfil a contract",
          ],
          worked: [
            "Allocate the transaction price of a bundled contract (equipment plus a service period) across two performance obligations using illustrative standalone selling prices, then show revenue for the first year",
            "Decide principal versus agent for an illustrative intermediated arrangement and present the same transaction both ways to show the revenue difference",
          ],
          traps: [
            "Recognising the whole contract price on delivery when the contract in substance carries a separate unsatisfied service obligation",
            "Including variable consideration in full without applying the constraint, or reassessing it only at contract inception",
          ],
          officialSources: [ICAI],
          diagram: "flow",
          keywords: [
            "Ind AS 115 five step model",
            "performance obligation identification",
            "variable consideration constraint",
            "principal versus agent revenue",
          ],
        },
        {
          slug: "ind-as-116-leases-and-ind-as-16-fixed-assets",
          title: "Ind AS 116 and Ind AS 16: Right-of-Use Assets and Fixed Assets",
          syllabusAnchor:
            "CA Final Paper 1 (Financial Reporting) — Indian Accounting Standards on assets of financial statements: Ind AS 16 Property, Plant and Equipment; Ind AS 116 Leases.",
          mustCover: [
            "The Ind AS 116 lease definition: an identified asset, the right to obtain substantially all of its economic benefits, and the right to direct its use",
            "Lessee accounting: a right-of-use asset and a lease liability measured at the present value of lease payments, discounted at the rate implicit in the lease or the incremental borrowing rate",
            "Subsequent measurement: depreciation of the right-of-use asset plus interest on the liability, and why the total charge is front-loaded against straight-line rent",
            "The short-term and low-value asset recognition exemptions as elections, how each is applied, and the disclosure that replaces recognition",
            "Why the lessor model retains the finance versus operating lease classification, making lessee and lessor accounting deliberately asymmetric",
            "Ind AS 16 recognition and the elements of cost, including directly attributable costs and dismantling obligations, and subsequent expenditure that is capitalised rather than expensed",
            "Component accounting, and depreciation as an accounting estimate whose method, useful life and residual value are reviewed and changed prospectively",
            "The revaluation model: revaluation surplus through OCI, how a later decrease is split between OCI and profit or loss, and the requirement to revalue the whole class",
          ],
          worked: [
            "Compute the right-of-use asset and lease liability at commencement from an illustrative payment schedule and an assumed discount rate, then split the first-year charge between depreciation and interest",
            "Depreciate an asset with two significant components having different useful lives, then account for a revaluation increase followed by a later decrease",
          ],
          traps: [
            "Treating the lessee exemptions as mandatory relief rather than elections, and applying the low-value test to a portfolio instead of the underlying asset",
            "Routing a revaluation decrease entirely through profit or loss when a surplus for the same asset still stands in other comprehensive income",
          ],
          officialSources: [ICAI],
          diagram: "compare",
          keywords: [
            "Ind AS 116 right of use asset",
            "lease liability computation",
            "Ind AS 16 component accounting",
            "revaluation model OCI",
          ],
        },
      ],
    },
    {
      slug: "consolidation",
      title: "Consolidation & Group Accounts",
      articles: [
        {
          slug: "consolidation-control-and-group-accounts",
          title: "Consolidation: Control, Non-Controlling Interest and Associates",
          syllabusAnchor:
            "CA Final Paper 1 (Financial Reporting) — Consolidated and separate financial statements: Ind AS 110, Ind AS 111 and Ind AS 28.",
          mustCover: [
            "The Ind AS 110 definition of control: power over the investee, exposure to variable returns, and the ability to use that power to affect those returns",
            "Control without a majority of votes: de facto control, potential voting rights, and rights held through contractual arrangements",
            "Consolidation procedures: line-by-line aggregation, elimination of intra-group balances and transactions, uniform accounting policies and aligned reporting dates",
            "Goodwill at acquisition, and the choice of measuring non-controlling interest at fair value or at the proportionate share of identifiable net assets",
            "Non-controlling interest presented within equity, and the allocation of profit and other comprehensive income between owners and NCI",
            "Changes in ownership that do not result in loss of control treated as equity transactions, against the gain or loss recognised when control is lost",
            "Ind AS 111 joint operations against joint ventures, and Ind AS 28 significant influence with the mechanics of the equity method",
          ],
          worked: [
            "Compute goodwill and non-controlling interest at acquisition from illustrative figures under both NCI measurement choices, then eliminate an intra-group sale with unrealised profit sitting in closing inventory",
          ],
          traps: [
            "Equating control with holding more than half the shares and skipping the substance tests in Ind AS 110",
            "Treating an increase in stake after control already exists as generating additional goodwill",
          ],
          officialSources: [ICAI],
          diagram: "hierarchy",
          keywords: [
            "Ind AS 110 control definition",
            "non controlling interest measurement",
            "consolidated financial statements CA Final",
            "equity method Ind AS 28",
          ],
        },
      ],
    },
  ],
};

export const CA_AUDIT: StarterSubject = {
  slug: "ca-audit",
  name: "Auditing & Assurance",
  description:
    "Standards on Auditing from risk assessment to the opinion, with the ethics and company audit provisions that frame them.",
  paper: "CA Intermediate & Final",
  topics: [
    {
      slug: "audit-process",
      title: "The Audit Process",
      articles: [
        {
          slug: "risk-based-audit-planning-and-evidence",
          title: "The Risk-Based Audit: From SA 315 Risk to SA 500 Evidence",
          syllabusAnchor:
            "CA Intermediate Paper 5 (Auditing and Ethics) — Audit strategy, audit planning and audit programme; risk assessment and internal control; audit evidence.",
          mustCover: [
            "SA 200: reasonable and not absolute assurance, the inherent limitations of an audit, and professional scepticism as an active attitude rather than a stated one",
            "SA 315: understanding the entity and its environment, the components of internal control, and identifying risks of material misstatement at the financial statement and assertion levels",
            "Significant risks, and the split of the risk of material misstatement into inherent risk and control risk",
            "SA 330: overall responses and further audit procedures, tests of controls against substantive procedures, and where substantive procedures alone cannot give sufficient evidence",
            "SA 320: materiality for the financial statements as a whole, performance materiality, and materiality for particular classes of transactions and disclosures",
            "SA 500: sufficiency and appropriateness of audit evidence, relevance and reliability, and how the source of evidence affects reliability",
            "SA 530 sampling risk and the projection of misstatements to the population, SA 520 analytical procedures in both risk assessment and substantive roles, and SA 230 documentation judged by the experienced auditor test",
          ],
          worked: [
            "Take an illustrative revenue balance: name the assertion at risk, the risk assessment procedure that surfaced it, the SA 330 response chosen, and how performance materiality drives the extent of testing",
          ],
          traps: [
            "Treating materiality as one number for the whole audit rather than a set that includes performance materiality and class-specific levels",
            "Reducing substantive testing because controls look strong, without actually testing those controls",
          ],
          officialSources: [ICAI],
          diagram: "flow",
          keywords: [
            "SA 315 risk assessment audit",
            "SA 330 responses to assessed risks",
            "performance materiality SA 320",
            "audit evidence SA 500 sampling",
          ],
        },
      ],
    },
    {
      slug: "reporting-and-ethics",
      title: "Reporting, Ethics & Company Audit",
      articles: [
        {
          slug: "audit-report-ethics-and-company-audit",
          title: "Audit Report, Ethics and Company Audit under the Companies Act",
          syllabusAnchor:
            "CA Intermediate Paper 5 (Auditing and Ethics) — Audit report; company audit; ethics and terms of audit engagements.",
          mustCover: [
            "SA 700: the elements of the auditor's report in order, and exactly what the opinion paragraph asserts",
            "SA 705: qualified, adverse and disclaimer of opinion, decided by the nature of the matter and whether its effect is pervasive",
            "SA 706: emphasis of matter and other matter paragraphs, and why neither modifies the opinion",
            "SA 701: how key audit matters are selected from matters communicated to those charged with governance, and how they differ from a modification",
            "SA 570: management's going concern assessment, material uncertainty, the adequacy of disclosure, and the reporting outcome in each situation",
            "The Code of Ethics: the fundamental principles, the five categories of threat, safeguards at engagement and firm level, and independence in appearance as well as in fact",
            "Companies Act, 2013 Sections 139 to 144: appointment and reappointment, rotation of auditors and firms, removal and resignation, powers and duties, and the services an auditor is prohibited from rendering",
            "Reporting under CARO as an additional requirement attached to the audit report, and the kinds of matters on which it seeks comment",
          ],
          worked: [
            "Take an illustrative uncorrected misstatement and reason step by step to a qualified or an adverse opinion, then set out the basis for opinion paragraph that supports it",
          ],
          traps: [
            "Using an emphasis of matter paragraph to patch a disclosure deficiency that actually requires a modified opinion",
            "Assuming a material uncertainty on going concern always modifies the opinion — adequately disclosed, it goes in a separate section",
          ],
          officialSources: [ICAI, MCA],
          diagram: "flow",
          keywords: [
            "SA 700 audit report structure",
            "SA 705 modified opinion types",
            "key audit matters SA 701",
            "auditor rotation Section 139",
          ],
        },
      ],
    },
  ],
};

export const CA_TAXATION: StarterSubject = {
  slug: "ca-taxation",
  name: "Taxation",
  description:
    "Income-tax computation and GST mechanics, built around the sections and the order in which they are applied.",
  paper: "CA Intermediate & Final",
  topics: [
    {
      slug: "direct-tax",
      title: "Direct Tax",
      articles: [
        {
          slug: "residential-status-and-scope-of-total-income",
          title: "Residential Status and Scope of Total Income",
          syllabusAnchor:
            "CA Intermediate Paper 3 Section A (Income-tax Law) — Residential status and scope of total income; incomes which do not form part of total income.",
          mustCover: [
            "Section 6: the basic conditions based on days of stay in India, and how the period of stay is counted",
            "The additional conditions that separate a resident and ordinarily resident from a resident but not ordinarily resident",
            "How the day-count conditions are relaxed for an individual leaving India for employment or as a crew member, and the stricter test for certain Indian citizens visiting India",
            "Deemed residence for an Indian citizen not liable to tax in any other country, and how the income threshold in that provision operates",
            "Residence of a company including place of effective management, and of a firm, Hindu undivided family and association of persons",
            "Section 5: the scope of total income for a resident, a resident but not ordinarily resident, and a non-resident",
            "Income received in India, income accruing or arising in India, and income deemed to accrue or arise in India, and why status is determined afresh for every previous year",
          ],
          worked: [
            "Determine residential status for an illustrative individual from a table of days present across several previous years, then mark four illustrative income items as taxable or not for a resident, an RNOR and a non-resident",
          ],
          traps: [
            "Deciding residence from citizenship or from where income arises instead of the day-count tests in Section 6",
            "Forgetting that business income controlled from India and professional income set up in India remain taxable for an RNOR",
          ],
          officialSources: [ITD],
          diagram: "flow",
          keywords: [
            "residential status Section 6",
            "scope of total income Section 5",
            "resident but not ordinarily resident",
            "deemed resident income tax",
          ],
        },
        {
          slug: "total-income-set-off-and-tax-payment",
          title: "Computing Total Income: Heads, Set-Off, Deductions and Payment",
          syllabusAnchor:
            "CA Intermediate Paper 3 Section A (Income-tax Law) — Heads of income and computation under each head; aggregation of income, set-off and carry forward of losses; deductions from gross total income; advance tax and tax deducted at source.",
          mustCover: [
            "The five heads of income, and the sequence in which income under each head is computed before aggregation into gross total income",
            "Clubbing provisions: transfer of income without transfer of the asset, income arising to a spouse or minor child, and transfers to a Hindu undivided family",
            "Intra-head set-off under Section 70 and inter-head set-off under Section 71, together with the restrictions that apply to specified losses",
            "Carry forward under Sections 72 to 74: which losses may be carried forward, what they can later be set off against, and the continuity conditions",
            "The order of set-off between current year depreciation, brought forward business loss and unabsorbed depreciation",
            "Chapter VI-A: the structure of the chapter, the rule that total deductions cannot exceed gross total income, and the split between payment-based and income-based deductions",
            "The old regime against the default regime under Section 115BAC: which deductions and exemptions are forgone, and how the option is exercised and withdrawn",
            "Advance tax liability and its instalment structure, credit for tax deducted at source, and interest under Sections 234A, 234B and 234C with the base each is computed on",
          ],
          worked: [
            "Compute total income for an illustrative assessee with income under three heads, one current-year loss and one brought forward business loss, showing the set-off order at each stage",
            "Structure a comparison of the old and default regimes on the same illustrative gross total income, showing which deductions drop out and how the choice is reasoned without quoting rates",
          ],
          traps: [
            "Setting off a speculative business loss against normal business profit, or a long-term capital loss against short-term gains",
            "Claiming Chapter VI-A deductions against income already excluded from the computation, or claiming regime-specific deductions under the wrong regime",
          ],
          officialSources: [ITD],
          diagram: "flow",
          keywords: [
            "set off and carry forward of losses",
            "clubbing of income provisions",
            "Chapter VI-A deductions",
            "advance tax interest 234B 234C",
          ],
        },
      ],
    },
    {
      slug: "indirect-tax",
      title: "Indirect Tax (GST)",
      articles: [
        {
          slug: "gst-supply-time-and-place-of-supply",
          title: "GST: Scope of Supply, Time of Supply and Place of Supply",
          syllabusAnchor:
            "CA Intermediate Paper 3 Section B (Goods and Services Tax) — Supply under GST; charge of tax; time and value of supply; place of supply.",
          mustCover: [
            "Section 7 of the CGST Act: supply for consideration in the course or furtherance of business, and the activities treated as supply even without consideration",
            "Schedule I: the specified transactions treated as supply without consideration, including those between related persons and distinct persons",
            "Schedule II: classification of specified activities as a supply of goods or of services, and Schedule III activities that fall outside the charge altogether",
            "Composite supply and the identification of its principal supply, against mixed supply, and the different treatment each attracts",
            "Time of supply of goods and of services under the forward charge, and how the earliest of the specified events is identified",
            "Time of supply under reverse charge, and time of supply where there is a change in the rate of tax",
            "Place of supply of goods, including supplies involving movement and bill-to ship-to transactions",
            "Place of supply of services: the general rule against the specific rules, and how location of supplier with place of supply decides intra-state or inter-state, and therefore CGST with SGST or IGST",
          ],
          worked: [
            "Take three illustrative transactions: classify one bundled offering as composite or mixed, and determine place of supply for the other two to conclude whether IGST or CGST with SGST applies",
          ],
          traps: [
            "Treating every bundle as a composite supply without asking whether the elements are naturally bundled and supplied together in the ordinary course of business",
            "Deciding intra-state or inter-state from the billing address rather than the statutory place of supply",
          ],
          officialSources: [CBIC, GST],
          diagram: "flow",
          keywords: [
            "scope of supply Section 7 CGST",
            "Schedule I II III CGST Act",
            "composite and mixed supply",
            "place of supply intra state inter state",
          ],
        },
        {
          slug: "input-tax-credit-and-reverse-charge",
          title: "Input Tax Credit and Reverse Charge under GST",
          syllabusAnchor:
            "CA Intermediate Paper 3 Section B (Goods and Services Tax) — Input tax credit; charge of tax and reverse charge mechanism; payment of tax.",
          mustCover: [
            "Section 16 conditions for credit: possession of a tax invoice, receipt of the goods or services, tax actually reaching the government, and the supplier having furnished the return",
            "Goods received in lots or instalments, and the consequence of not paying the supplier within the prescribed period",
            "How the time limit for claiming credit on an invoice operates, expressed by reference to the return and annual return deadlines rather than a fixed date",
            "Section 17: apportionment of credit between business and non-business use, and between taxable and exempt supplies",
            "Blocked credits under Section 17(5): motor vehicles subject to their exceptions, specified employee-related supplies, works contract and construction of immovable property, and goods lost, stolen, destroyed or given as free samples",
            "Reverse charge under Sections 9(3) and 9(4) of the CGST Act with the corresponding IGST provision, and why the recipient becomes the person liable to pay",
            "Why reverse charge liability must be discharged in cash rather than from credit, when credit of that tax becomes available, and the order in which IGST, CGST and SGST credit is utilised",
          ],
          worked: [
            "Determine eligible input tax credit from an illustrative purchase list containing two blocked items and one input used partly for exempt supplies, then show how an illustrative reverse charge liability is paid and when its credit is claimed",
          ],
          traps: [
            "Claiming credit on a valid invoice when the supplier has not reported the supply, ignoring the condition in Section 16",
            "Setting off reverse charge liability against the electronic credit ledger instead of paying it through the cash ledger",
          ],
          officialSources: [CBIC, GST],
          diagram: "flow",
          keywords: [
            "input tax credit Section 16",
            "blocked credits Section 17(5)",
            "reverse charge mechanism GST",
            "electronic credit ledger utilisation",
          ],
        },
      ],
    },
  ],
};

export const CA_LAW_STRATEGY: StarterSubject = {
  slug: "ca-law-and-strategy",
  name: "Corporate Law & Exam Strategy",
  description:
    "Companies Act provisions the papers actually test, plus how the ICAI scheme rewards material, practice and presentation.",
  paper: "CA Intermediate & Final",
  topics: [
    {
      slug: "corporate-law",
      title: "Corporate Law",
      articles: [
        {
          slug: "companies-act-incorporation-and-board-governance",
          title: "Companies Act 2013: Incorporation, Capital and Board Governance",
          syllabusAnchor:
            "CA Intermediate Paper 2 (Corporate and Other Laws) — The Companies Act, 2013: incorporation of company and matters incidental thereto; prospectus and allotment; share capital; appointment and qualifications of directors; meetings of Board and its powers.",
          mustCover: [
            "Sections 3 to 12: classification of companies by liability, membership and control, the incorporation documents, and the effect of the certificate of incorporation",
            "One person company, small company, and private against public company, described by the conditions that define each rather than by figures",
            "The memorandum of association: its clauses, the alteration procedure, and the doctrine of ultra vires with its consequences for the company and for outsiders",
            "The articles of association, entrenchment provisions, and how the memorandum and articles interact when they conflict",
            "The doctrine of constructive notice, the doctrine of indoor management, and the recognised exceptions to indoor management",
            "Prospectus and allotment: the kinds of prospectus, liability for misstatement, and private placement against a public offer",
            "Share capital: kinds of shares, the further issue routes under Section 62 including rights issue and preferential allotment, and reduction of capital in outline",
            "Sections 149 to 179: board composition, independent directors and their role, appointment, disqualification and vacation of office, powers exercisable only at a board meeting, Section 188 related party transactions with the arm's length exception, and the audit committee",
          ],
          worked: [
            "Apply constructive notice and indoor management to an illustrative contract signed by an officer acting beyond internal authority, and reason out who bears the loss",
          ],
          traps: [
            "Treating an ultra vires act as capable of ratification by the shareholders",
            "Assuming every related party transaction needs member approval, ignoring the arm's length and ordinary course of business exception",
          ],
          officialSources: [MCA, ICAI],
          diagram: "hierarchy",
          keywords: [
            "incorporation Companies Act 2013",
            "doctrine of indoor management",
            "independent directors Section 149",
            "related party transactions Section 188",
          ],
        },
      ],
    },
    {
      slug: "exam-craft",
      title: "Exam Craft",
      articles: [
        {
          slug: "ca-exam-strategy-and-presentation",
          title: "CA Exam Strategy: Paper Pattern, Material and Presentation Marks",
          syllabusAnchor:
            "ICAI Scheme of Education and Training, 2023 — assessment pattern for Foundation, Intermediate and Final, including objective and descriptive question papers and self-paced online modules.",
          mustCover: [
            "The 2023 scheme structure: the Foundation, Intermediate and Final papers, how papers are grouped, and where the self-paced online modules sit",
            "The objective and descriptive split in the question papers, and why the objective portion rewards precision on standards and sections rather than broad reading",
            "Why the ICAI study material and its illustrations come before any reference book, and how the modules map onto syllabus headings",
            "Revision Test Papers and Mock Test Papers: what each is designed to test, and the order in which to attempt them relative to a first reading",
            "Presentation marks: working notes as part of the answer, prescribed formats for accounts and computations, and citing the standard or section relied on",
            "How to write a law or audit answer: state the provision, apply it to the facts, then conclude",
            "Group-wise attempt planning: choosing one group or both, how the paper exemption rule works, and the aggregate and individual paper requirements to clear a group",
          ],
          worked: [
            "Build a study plan for one group across the available months, allocating first reading, module practice, RTP and MTP attempts and a final timed revision cycle",
          ],
          traps: [
            "Re-reading theory without ever writing a full paper under exam timing",
            "Skipping working notes because the final figure is right — in ICAI papers the marks sit in the reasoning",
          ],
          officialSources: [ICAI],
          diagram: "none",
          keywords: [
            "ICAI 2023 scheme paper pattern",
            "CA study material RTP MTP",
            "presentation marks working notes",
            "CA group attempt strategy",
          ],
        },
      ],
    },
  ],
};
