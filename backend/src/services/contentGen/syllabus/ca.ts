import { L, topic, type SyllabusSubject } from "./syllabusTypes.js";

const SRC = [
  "https://www.icai.org/",
  "https://www.mca.gov.in/",
  "https://www.cbic.gov.in/",
  "https://www.incometaxindia.gov.in/",
];

const FR = "CA Final Paper 1 (Financial Reporting) — Conceptual Framework and Indian Accounting Standards.";
const AUD = "CA Intermediate Paper 5 (Auditing and Ethics) — Standards on Auditing, company audit and the Code of Ethics.";
const DT = "CA Intermediate Paper 3 Section A (Income-tax Law) — Residential status, heads of income, set-off and Chapter VI-A.";
const GST = "CA Intermediate Paper 3 Section B (Goods and Services Tax) — Supply, time and place of supply, ITC and reverse charge.";
const LAW = "CA Intermediate Paper 2 (Corporate and Other Laws) — Companies Act, 2013: incorporation, directors and related party transactions.";
const CRAFT = "ICAI Scheme of Education and Training, 2023 — assessment pattern, study material and presentation.";

export const CA_CORPUS: SyllabusSubject[] = [
  {
    slug: "ca-accounting",
    name: "Accounting & Financial Reporting",
    description:
      "Ind AS framework, presentation, revenue, leases, PPE, control and associates at the granularity ICAI papers test.",
    paper: "CA Intermediate & Final",
    sources: SRC,
    topics: [
      topic("framework-and-presentation", "Framework and Presentation", FR, [
        L("conceptual-framework-qualitative", "Conceptual Framework: Objective, Characteristics and Elements", [
          "Objective of general purpose financial reporting and the primary users it serves",
          "Relevance and faithful representation as fundamental qualitative characteristics, and the four enhancing characteristics",
          "Definitions of asset, liability, equity, income and expense, and the recognition and derecognition ideas the Framework permits",
          "Measurement bases the Framework discusses and why mixed measurement is the working model",
        ], "hierarchy", ["conceptual framework Ind AS", "qualitative characteristics"]),
        L("ind-as-roadmap-and-101", "Ind AS Roadmap and First-Time Adoption", [
          "How the Companies (Indian Accounting Standards) Rules bring entities onto Ind AS by listing status and size category, without quoting the figures",
          "Why the move is one-way, and what a first-time adopter must present as comparatives",
          "Ind AS 101: the opening Ind AS statement of financial position as the starting point",
          "Mandatory exceptions versus optional exemptions on first-time adoption, conceptually",
        ], "timeline", ["Ind AS applicability roadmap", "Ind AS 101 first-time adoption"]),
        L("ind-as-1-presentation", "Ind AS 1: Complete Set, Going Concern and OCI", [
          "The complete set of financial statements and the fair-presentation overlay",
          "Going concern and accrual as underlying assumptions, materiality and aggregation, and the prohibition on offsetting",
          "Current versus non-current classification and when a liquidity presentation is used instead",
          "Other comprehensive income: which items reclassify to profit or loss and which never do",
        ], "cards", ["Ind AS 1 presentation", "OCI reclassification"]),
        L("ind-as-7-cash-flows", "Ind AS 7: Operating, Investing and Financing", [
          "The three activity classifications and what belongs in each",
          "The cash-equivalent test: short maturity and insignificant risk of value change, not management intention",
          "How interest, dividends and income taxes are classified, including the policy choices",
          "The indirect method: profit before tax adjusted for non-cash items, working-capital movements and items reclassified as investing or financing",
        ], "flow", ["Ind AS 7 cash flow", "indirect method cash equivalents"]),
      ]),
      topic("revenue-five-steps", "Ind AS 115: The Five-Step Model", FR, [
        L("ind-as-115-steps-one-two", "Ind AS 115 Steps 1 and 2: Contract and Performance Obligations", [
          "When an arrangement with a customer meets the contract criteria, and what happens if it does not",
          "Identifying promised goods or services and testing whether each is distinct within the context of the contract",
          "A series of distinct goods or services treated as a single performance obligation when the criteria are met",
          "Why a warranty, a shipping term or an option for extra goods can be a separate obligation or merely an activity",
        ], "flow", ["Ind AS 115 performance obligation", "distinct goods or services"]),
        L("ind-as-115-price-and-allocate", "Ind AS 115 Steps 3 and 4: Transaction Price and Allocation", [
          "Determining the transaction price, including variable consideration as expected value or most likely amount",
          "The constraint on variable consideration that is highly susceptible to reversal",
          "Significant financing components, non-cash consideration and consideration payable to a customer",
          "Allocating on relative standalone selling prices, and when a discount is allocated to specific obligations only",
        ], "compare", ["transaction price Ind AS 115", "variable consideration constraint"]),
        L("ind-as-115-control-and-principal", "Ind AS 115 Step 5: Control, Over Time and Principal versus Agent", [
          "Recognising revenue when the customer obtains control, and the indicators of a point-in-time transfer",
          "The criteria that make an obligation satisfied over time, and output versus input measures of progress",
          "Principal versus agent: the control indicators, and gross consideration versus a net commission",
          "Contract assets, contract liabilities and receivables, and costs to obtain or fulfil a contract",
        ], "flow", ["control transfer Ind AS 115", "principal versus agent revenue"]),
      ]),
      topic("leases-and-ppe", "Leases and Property, Plant and Equipment", FR, [
        L("ind-as-116-lease-definition", "Ind AS 116: Identified Asset and Right to Direct Use", [
          "The lease definition: an identified asset, the right to obtain substantially all economic benefits, and the right to direct use",
          "Substitutive rights and capacity portions: when a contract is a lease and when it is a service",
          "The short-term and low-value recognition exemptions as elections, applied to the underlying asset, not a portfolio",
          "Why the lessor model still classifies finance versus operating leases, making lessee and lessor accounting asymmetric",
        ], "compare", ["Ind AS 116 lease definition", "short-term low-value exemption"]),
        L("ind-as-116-lessee-measurement", "Ind AS 116: Right-of-Use Asset and Lease Liability", [
          "Initial measurement: lease liability at the present value of lease payments, discounted at the rate implicit in the lease or the incremental borrowing rate",
          "The right-of-use asset as the liability plus initial direct costs, prepaid payments and dismantling obligations, less incentives",
          "Subsequent measurement: depreciation of the right-of-use asset plus interest on the liability, and why the total charge is front-loaded against straight-line rent",
          "Reassessment and modification: when the liability is remeasured and how the adjustment hits the asset",
        ], "flow", ["right of use asset", "lease liability subsequent measurement"]),
        L("ind-as-16-cost-and-components", "Ind AS 16: Cost Model, Components and Depreciation", [
          "Recognition and the elements of cost, including directly attributable costs and dismantling obligations",
          "Subsequent expenditure that is capitalised rather than expensed, and the replacement of a component",
          "Component accounting: significant parts with different useful lives depreciated separately",
          "Depreciation as an accounting estimate whose method, useful life and residual value are reviewed and changed prospectively",
        ], "hierarchy", ["Ind AS 16 component accounting", "PPE cost model"]),
        L("ind-as-16-revaluation-and-oci", "Ind AS 16: Revaluation Model and Class-Wide Application", [
          "The revaluation model as an alternative to cost, applied to an entire class, not a single asset",
          "A revaluation increase through other comprehensive income, and how a later decrease is split between OCI and profit or loss",
          "The frequency of revaluation and why a stale valuation defeats the model",
          "How depreciation after a revaluation is computed from the revalued carrying amount",
        ], "flow", ["Ind AS 16 revaluation surplus", "revaluation decrease OCI"]),
      ]),
      topic("control-and-associates", "Control, Consolidation and Associates", FR, [
        L("ind-as-110-control-three-tests", "Ind AS 110: Power, Variable Returns and the Link", [
          "The three elements of control: power over the investee, exposure or rights to variable returns, and the ability to use that power to affect those returns",
          "Relevant activities and how existing rights that give current ability to direct them are identified",
          "Protective rights distinguished from substantive rights",
          "Why a majority of voting rights is neither necessary nor always sufficient",
        ], "hierarchy", ["Ind AS 110 control definition", "power variable returns"]),
        L("ind-as-110-control-without-majority", "Control without a Majority of Votes", [
          "De facto control when holdings and the dispersion of other votes give practical ability to direct",
          "Potential voting rights that are substantive, and rights held through contractual arrangements",
          "Principal versus agent: delegated decision rights that do not confer control on the decision maker",
          "Structured entities: why legal form does not settle the control question",
        ], "cards", ["de facto control Ind AS 110", "potential voting rights"]),
        L("consolidation-procedures-nci", "Consolidation Procedures, Goodwill and NCI", [
          "Line-by-line aggregation, elimination of intra-group balances and transactions, uniform policies and aligned reporting dates",
          "Goodwill at acquisition as residual, and the choice of measuring NCI at fair value or at the proportionate share of identifiable net assets",
          "NCI presented within equity, and the allocation of profit and OCI between owners and NCI",
          "Unrealised intra-group profits sitting in inventory or non-current assets, and who they are attributed to",
        ], "flow", ["consolidated financial statements", "NCI measurement goodwill"]),
        L("ownership-changes-after-control", "Changes in Ownership that Keep or Lose Control", [
          "An increase or decrease in stake that does not lose control treated as an equity transaction, not a remeasurement through profit or loss",
          "Why no additional goodwill arises after control already exists",
          "Loss of control: derecognition of assets, liabilities and NCI, recognition of any retained interest at fair value, and the resulting gain or loss",
          "How that retained interest then sits as an associate, joint arrangement or financial asset",
        ], "compare", ["loss of control Ind AS 110", "equity transaction NCI"]),
        L("ind-as-28-equity-method", "Associates, Significant Influence and the Equity Method", [
          "Significant influence as the power to participate in financial and operating policy decisions, not control or joint control",
          "The equity method: cost plus post-acquisition share of profit or loss and OCI, less distributions, with goodwill embedded in the carrying amount",
          "Upstream and downstream adjustments for unrealised profits with an associate",
          "Ind AS 111: joint operations recognised line by line versus joint ventures accounted for under the equity method",
        ], "compare", ["Ind AS 28 equity method", "joint operation versus joint venture"]),
      ]),
    ],
  },
  {
    slug: "ca-audit",
    name: "Auditing & Assurance",
    description:
      "Standards on Auditing from objectives to the opinion, with company-audit provisions and independence.",
    paper: "CA Intermediate & Final",
    sources: SRC,
    topics: [
      topic("planning-and-risk", "Objectives, Risk, Response and Evidence", AUD, [
        L("sa-200-assurance-scepticism", "SA 200: Reasonable Assurance and Professional Scepticism", [
          "The overall objectives of the independent auditor and the meaning of reasonable, not absolute, assurance",
          "Inherent limitations of an audit: judgement, sampling, management override and the nature of evidence",
          "Professional scepticism as an active attitude, and professional judgement as the application of training to facts",
          "The ethical requirements that SA 200 assumes, including independence",
        ], "cards", ["SA 200 reasonable assurance", "professional scepticism"]),
        L("sa-315-entity-and-risks", "SA 315: Understanding the Entity and Assessing Risk", [
          "Understanding the entity and its environment, including the applicable financial reporting framework",
          "The components of internal control and why the auditor must understand them even when not relying on them",
          "Identifying and assessing risks of material misstatement at the financial-statement level and the assertion level",
          "Significant risks, and the split of the risk of material misstatement into inherent risk and control risk",
        ], "hierarchy", ["SA 315 risk assessment", "assertion level RMM"]),
        L("sa-330-further-procedures", "SA 330: Responses to Assessed Risks", [
          "Overall responses at the financial-statement level, including scepticism, staffing and unpredictability",
          "Further audit procedures: tests of controls versus substantive procedures, and tests of details versus substantive analytical procedures",
          "When substantive procedures alone cannot provide sufficient appropriate evidence",
          "Evaluating the operating effectiveness of controls and the consequences if they fail",
        ], "flow", ["SA 330 responses", "tests of controls versus substantive"]),
        L("sa-320-performance-materiality", "SA 320: Materiality and Performance Materiality", [
          "Materiality for the financial statements as a whole as a professional judgement, not a single published percentage",
          "Performance materiality as an amount set lower to reduce the risk that uncorrected and undetected misstatements exceed overall materiality",
          "Materiality for particular classes of transactions, account balances or disclosures when needed",
          "Revision of materiality as the audit progresses when circumstances change",
        ], "compare", ["SA 320 performance materiality", "class-specific materiality"]),
        L("sa-500-sufficiency-appropriateness", "SA 500: Sufficiency and Appropriateness of Evidence", [
          "Sufficiency as quantity and appropriateness as quality: relevance and reliability",
          "How the source of evidence — entity, auditor, or third party — affects reliability",
          "Assertions about classes of transactions, balances and presentation, and designing procedures to hit the assertion at risk",
          "Information prepared by management's expert, and using the work of an auditor's expert, conceptually",
        ], "cards", ["SA 500 audit evidence", "relevance reliability assertions"]),
        L("sa-230-experienced-auditor-test", "SA 230: Audit Documentation", [
          "The experienced-auditor test: documentation sufficient for an experienced auditor with no previous connection to understand the work",
          "What to document: nature, timing and extent of procedures, results, and significant matters arising",
          "Assembly of the final audit file after the report date, and the prohibition on deleting or discarding documentation",
          "How documentation supports the report and enables quality review",
        ], "none", ["SA 230 documentation", "experienced auditor test"]),
      ]),
      topic("reporting", "The Auditor's Report", AUD, [
        L("sa-700-unmodified-opinion", "SA 700: Forming an Opinion and the Unmodified Report", [
          "The elements of the auditor's report in order, and exactly what the opinion paragraph asserts",
          "Evaluating whether the financial statements are prepared, in all material respects, in accordance with the framework",
          "The basis-for-opinion section, including independence and the audit evidence obtained",
          "Other reporting responsibilities that sit after the opinion when law or regulation requires them",
        ], "hierarchy", ["SA 700 unmodified opinion", "auditor report elements"]),
        L("sa-705-706-modifications-eom", "SA 705 and SA 706: Modifications, Emphasis and Other Matter", [
          "SA 705: qualified, adverse and disclaimer of opinion, decided by the nature of the matter and whether its effect is pervasive",
          "Inability to obtain sufficient appropriate evidence versus a material misstatement as the two starting points",
          "SA 706: emphasis of matter and other matter paragraphs, and why neither modifies the opinion",
          "Why an emphasis of matter cannot patch a disclosure deficiency that actually requires a modified opinion",
        ], "compare", ["SA 705 modified opinion", "SA 706 emphasis of matter"]),
        L("sa-701-key-audit-matters", "SA 701: Key Audit Matters", [
          "How KAMs are selected from matters communicated to those charged with governance",
          "The matters that required significant auditor attention: significant risks, high estimation uncertainty, and significant events or transactions",
          "How a KAM is described: why it was significant and how it was addressed",
          "Why a KAM is not a modification, and when a matter is reported as a modification instead of a KAM",
        ], "flow", ["SA 701 key audit matters", "KAM versus modified opinion"]),
        L("sa-570-going-concern-reporting", "SA 570: Going Concern Assessment and Reporting", [
          "Management's responsibility to assess going concern, and the auditor's responsibility to conclude on that assessment",
          "Events or conditions that may cast significant doubt, and the additional procedures they trigger",
          "Material uncertainty: whether disclosure is adequate, and the reporting outcome in each situation",
          "Why an adequately disclosed material uncertainty does not, by itself, modify the opinion",
        ], "flow", ["SA 570 going concern", "material uncertainty reporting"]),
      ]),
      topic("company-audit-ethics", "Company Audit and Ethics", AUD, [
        L("companies-act-139-144", "Companies Act Sections 139 to 144: Appointment to Prohibited Services", [
          "Section 139: appointment and reappointment, and rotation of auditors and firms as a category, without quoting the tenure figures",
          "Removal and resignation, and the filings and representations that follow",
          "Powers and duties of the auditor, including access to books and the duty to report",
          "Section 144: services an auditor is prohibited from rendering to the company and its holding or subsidiary",
        ], "timeline", ["Section 139 auditor rotation", "Section 144 prohibited services"]),
        L("ethics-independence-threats", "Code of Ethics: Principles, Threats and Independence", [
          "The fundamental principles and why independence in appearance matters as well as independence in fact",
          "The five categories of threat, and safeguards at the profession, firm and engagement levels",
          "Self-review, familiarity and advocacy as the threats that most often sit on a company audit",
          "How the prohibited non-audit services in the Act and the Code reinforce each other",
        ], "hierarchy", ["ICAI code of ethics independence", "threats and safeguards audit"]),
      ]),
    ],
  },
  {
    slug: "ca-taxation",
    name: "Taxation",
    description:
      "Residence, the five heads, set-off and Chapter VI-A as a structure; GST supply, time, place, ITC and reverse charge — never rates or limits.",
    paper: "CA Intermediate & Final",
    sources: SRC,
    topics: [
      topic("residence-and-scope", "Residence and Scope of Total Income", DT, [
        L("section-6-individual-residence", "Section 6: Individual Residence by Presence", [
          "The basic conditions based on days of stay in India, and how the period of stay is counted, without stating the day counts",
          "How the day-count conditions are relaxed for an individual leaving India for employment or as a crew member",
          "The stricter presence test for certain Indian citizens or persons of Indian origin visiting India, described as a category",
          "Why residential status is determined afresh for every previous year and is not citizenship",
        ], "flow", ["Section 6 residential status", "days of stay individual"]),
        L("section-6-ror-rnor-entities", "Section 6: ROR, RNOR, Companies and Other Entities", [
          "The additional conditions that separate a resident and ordinarily resident from a resident but not ordinarily resident",
          "Deemed residence for an Indian citizen not liable to tax in any other country, as a category, without quoting the income figure",
          "Residence of a company including place of effective management",
          "Residence of a firm, Hindu undivided family and association of persons",
        ], "compare", ["ROR versus RNOR", "place of effective management"]),
        L("section-5-scope-total-income", "Section 5: Scope of Total Income by Status", [
          "What is included in total income for a resident, an RNOR and a non-resident",
          "Income received in India, income accruing or arising in India, and income deemed to accrue or arise in India",
          "Why business controlled from India and a profession set up in India remain relevant for an RNOR",
          "Why status is decided first, then scope, never the other way around",
        ], "compare", ["Section 5 scope of total income", "RNOR foreign income"]),
      ]),
      topic("five-heads", "The Five Heads of Income", DT, [
        L("five-heads-sequence", "Five Heads: Sequence from Head Income to GTI", [
          "The five heads and why income is computed under each head before aggregation",
          "The order of computation: head income, clubbing, set-off, gross total income, then Chapter VI-A",
          "Clubbing as a category: transfer of income without the asset, spouse, minor child and HUF",
          "Why a receipt that is capital in nature never enters a head",
        ], "flow", ["five heads of income", "gross total income sequence"]),
        L("salary-head-structure", "Salary: Charge, Perquisites and the Structure of the Head", [
          "When salary is charged: due or receipt, whichever is earlier, and the employer–employee relationship as the gate",
          "The components of salary as a category: pay, allowances, perquisites and profits in lieu of salary — without exemption figures",
          "Perquisites: when they are taxable, and the distinction between specified and unspecified employees as a classification",
          "Standard deduction and professional tax as deductions from the head, named as items not as amounts",
        ], "hierarchy", ["salary head income tax", "perquisites classification"]),
        L("house-property-annual-value", "House Property: Annual Value and Deductions as Categories", [
          "When the head applies: buildings or land appurtenant, and the owner as the person charged",
          "Gross annual value as a concept: expected rent, actual rent and vacancy, without quoting municipal percentages",
          "Deductions from net annual value as categories — municipal taxes paid, a standard deduction, and interest on borrowed capital — without stating the figures",
          "Self-occupied, let-out and deemed let-out as the three treatments, conceptually",
        ], "flow", ["house property annual value", "self-occupied versus let-out"]),
        L("pgbps-and-capital-gains", "Business Profits and Capital Gains as Heads", [
          "Profits and gains of business or profession: the charging section, the general deduction test, and disallowed expenses as a category",
          "Presumptive taxation as a scheme that exists, described without the turnover or rate figures that trigger it",
          "Capital gains: the capital-asset definition, transfer, and the short-term versus long-term classification by holding period as a rule, without the periods quoted as exam numbers to memorise in isolation",
          "Cost of acquisition, cost of improvement and the concept of indexation as a method, without quoting index figures",
        ], "compare", ["PGBP versus capital gains", "short-term long-term classification"]),
        L("income-from-other-sources", "Income from Other Sources as the Residual Head", [
          "When the residual head catches a receipt that does not sit under the first four heads",
          "Dividends, interest and winnings as typical inclusions, treated as categories",
          "Deductions allowable against this head versus those that are not",
          "Why the residual head is not a dumping ground for items that belong under business or salary",
        ], "cards", ["income from other sources", "residual head income tax"]),
      ]),
      topic("set-off-and-via", "Set-Off and Chapter VI-A", DT, [
        L("set-off-intra-inter-head", "Intra-Head and Inter-Head Set-Off", [
          "Intra-head set-off under Section 70 and inter-head set-off under Section 71",
          "Restrictions that apply to specified losses, including speculative business and capital losses, as a category",
          "Why a loss under house property, business or capital gains is not freely interchangeable",
          "The order of set-off between current-year depreciation, brought-forward business loss and unabsorbed depreciation",
        ], "flow", ["Section 70 71 set-off", "speculative loss restriction"]),
        L("carry-forward-of-losses", "Carry Forward of Losses as a Structure", [
          "Which losses may be carried forward and what they can later be set off against",
          "Continuity conditions: return filed, and the same business or the same assessee where the statute requires it",
          "The distinction between carry-forward of loss and carry-forward of unabsorbed depreciation",
          "Why a carry-forward is not a refund and does not survive every kind of reorganisation",
        ], "timeline", ["carry forward of losses", "unabsorbed depreciation"]),
        L("chapter-via-framework", "Chapter VI-A: Structure without Figures", [
          "The structure of the chapter: deductions from gross total income, and the rule that total deductions cannot exceed GTI",
          "The split between payment-based deductions and income-based deductions as a classification",
          "How the default regime and the optional old regime differ on which deductions survive, without quoting slab rates",
          "Why VI-A is applied after set-off, never before head computation",
        ], "hierarchy", ["Chapter VI-A deductions", "default versus old regime"]),
      ]),
      topic("gst-mechanics", "GST: Supply, Time, Place, ITC and RCM", GST, [
        L("gst-supply-section-7", "Section 7: Supply, Schedules I to III", [
          "Section 7: supply for consideration in the course or furtherance of business",
          "Schedule I: specified transactions treated as supply even without consideration, including related and distinct persons",
          "Schedule II: classification of specified activities as goods or services",
          "Schedule III: activities that fall outside the charge altogether",
        ], "hierarchy", ["Section 7 CGST supply", "Schedule I II III"]),
        L("gst-time-of-supply", "Time of Supply of Goods and Services", [
          "Time of supply of goods and of services under the forward charge, and how the earliest of the specified events is identified",
          "Time of supply under reverse charge",
          "Time of supply where there is a change in the rate of tax, as a sequencing rule, without quoting rates",
          "Why an invoice date, a payment date and a removal date are not interchangeable",
        ], "timeline", ["time of supply GST", "TOS reverse charge"]),
        L("gst-place-of-supply", "Place of Supply and Intra-State versus Inter-State", [
          "Place of supply of goods, including supplies involving movement and bill-to ship-to",
          "Place of supply of services: the general rule against the specific rules",
          "How location of supplier together with place of supply decides intra-state or inter-state, and therefore CGST with SGST or IGST",
          "Why the billing address is not the statutory test",
        ], "flow", ["place of supply GST", "IGST versus CGST SGST"]),
        L("gst-itc-sections-16-17", "Input Tax Credit: Sections 16 and 17", [
          "Section 16 conditions: tax invoice, receipt of goods or services, tax reaching the government, and the supplier having furnished the return",
          "Goods received in lots, and the consequence of not paying the supplier within the prescribed period, named as a condition not a figure",
          "Section 17: apportionment between business and non-business, and between taxable and exempt supplies",
          "Blocked credits under Section 17(5) as categories: specified vehicles, specified employee-related supplies, works contract and immovable property, and goods lost, stolen, destroyed or given as free samples",
        ], "cards", ["ITC Section 16 conditions", "blocked credits 17(5)"]),
        L("gst-reverse-charge-mechanism", "Reverse Charge: Liability, Cash and Credit", [
          "Reverse charge under the notified categories and the recipient-of-supply from unregistered-person provision, as a structure, without listing turnover tests",
          "Why the recipient becomes the person liable to pay",
          "Why reverse charge liability is discharged through the cash ledger, and when credit of that tax becomes available",
          "The order in which IGST, CGST and SGST credit is utilised, as a sequence, not as rates",
        ], "flow", ["reverse charge mechanism GST", "cash ledger RCM"]),
      ]),
    ],
  },
  {
    slug: "ca-law-and-strategy",
    name: "Corporate Law & Exam Strategy",
    description:
      "Types of companies, memorandum and articles doctrines, directors and related party transactions, plus ICAI exam craft.",
    paper: "CA Intermediate & Final",
    sources: SRC,
    topics: [
      topic("company-forms-and-documents", "Companies, Memorandum and Articles", LAW, [
        L("types-of-companies", "Types of Companies under the Companies Act", [
          "Classification by liability, by membership and by listing status, described by the conditions that define each rather than by figures",
          "Private company versus public company: the restrictions that make a company private",
          "One person company and Section 8 company as distinct forms, conceptually",
          "Holding, subsidiary and associate as control relationships, not as shareholding percentages to be quoted",
        ], "hierarchy", ["types of companies 2013", "private versus public company"]),
        L("moa-and-ultra-vires", "Memorandum of Association and Ultra Vires", [
          "The clauses of the memorandum and what each clause does",
          "Alteration of the memorandum: which clauses need special procedure",
          "The doctrine of ultra vires and its consequences for the company and for outsiders",
          "Why an ultra vires act cannot be ratified by the shareholders",
        ], "cards", ["memorandum of association", "doctrine of ultra vires"]),
        L("aoa-indoor-management", "Articles, Constructive Notice and Indoor Management", [
          "The articles of association, entrenchment, and how the memorandum prevails on a conflict",
          "The doctrine of constructive notice: outsiders are deemed to know public documents",
          "The doctrine of indoor management: outsiders may assume internal procedure was followed",
          "Recognised exceptions to indoor management: knowledge of irregularity, suspicion, and forgery",
        ], "compare", ["doctrine of indoor management", "constructive notice articles"]),
      ]),
      topic("directors-and-rpt", "Directors and Related Party Transactions", LAW, [
        L("directors-149-appointment", "Section 149: Board Composition and Appointment", [
          "Board composition: minimum and maximum as a framework, independent directors and woman director as categories, without quoting the numbers that trigger them",
          "Who can be appointed, and the disqualifications and vacation of office",
          "Additional, alternate, nominee and independent directors as distinct roles",
          "The idea of a lead independent director and the board's collective responsibility",
        ], "hierarchy", ["Section 149 directors", "independent director appointment"]),
        L("directors-166-179-duties-powers", "Sections 166 to 179: Duties and Board Powers", [
          "Section 166 duties: act in good faith, due and reasonable care, independent judgement, and the no-conflict rule",
          "Powers exercisable only at a board meeting versus those that may be delegated",
          "Section 179 as the residual board-power provision, and the matters that still need shareholder approval",
          "How a director's duty of care interacts with reliance on officers and committees",
        ], "cards", ["Section 166 director duties", "Section 179 board powers"]),
        L("board-meetings-and-committees", "Board Meetings, Resolutions and Committees", [
          "When a board meeting is required, and the distinction between a resolution at a meeting and a circular resolution",
          "Notice, quorum and minutes as the record of the meeting, conceptually, without quoting the statutory day counts",
          "Audit committee and other board committees as a governance overlay, without quoting membership figures the Act triggers by size",
          "How committee recommendations still leave the board accountable",
        ], "flow", ["board meetings Companies Act", "audit committee board"]),
        L("related-party-section-188", "Section 188: Related Party Transactions", [
          "Who is a related party for Section 188, as a category",
          "The kinds of transaction that the section covers",
          "Board approval, and when member approval is required, including the arm's-length and ordinary-course exception",
          "Why interested directors and related shareholders do not vote on the approval",
        ], "flow", ["Section 188 related party", "arm's length ordinary course"]),
      ]),
      topic("exam-craft", "ICAI Exam Craft", CRAFT, [
        L("icai-scheme-and-papers", "ICAI 2023 Scheme: Levels, Groups and Papers", [
          "Foundation, Intermediate and Final as three levels, and where self-paced online modules sit",
          "The objective and descriptive split, and why the objective portion rewards precision on standards and sections",
          "Group-wise attempt planning: one group or both, and the idea of paper exemption and aggregate, without quoting pass marks as a target to game",
          "Why the ICAI study material and its illustrations come before any reference book",
        ], "hierarchy", ["ICAI 2023 scheme", "CA group attempt"]),
        L("icai-rtp-mtp-working-notes", "RTPs, MTPs, Working Notes and Presentation", [
          "Revision Test Papers and Mock Test Papers: what each is designed to test, and when to attempt them relative to a first reading",
          "Working notes as part of the answer, not an afterthought, in accounts and tax computations",
          "Prescribed formats for financial statements and tax workings, and citing the standard or section relied on",
          "Why a correct final figure without a working note still loses presentation marks",
        ], "none", ["CA RTP MTP", "working notes presentation"]),
        L("icai-provision-apply-conclude", "Law and Audit Answers: Provision, Apply, Conclude", [
          "The three-step law or audit answer: state the provision, apply it to the facts, then conclude",
          "How to use the given facts: every number or date in the question is usually there for a reason",
          "When to quote the section or SA number, and when a paraphrase of the principle is enough",
          "A last-month plan built on timed papers and error logs, not on new compilers",
        ], "flow", ["CA law answer format", "provision apply conclude"]),
      ]),
    ],
  },
];
