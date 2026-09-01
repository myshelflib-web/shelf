import { L, topic, type SyllabusSubject } from "./syllabusTypes.js";

const SRC = [
  "https://www.nmc.org.in/",
  "https://mohfw.gov.in/",
  "https://www.nhm.gov.in/",
];

const PATH = "NEET PG — Pathology: cell injury, inflammation, repair and neoplasia.";
const PHARM = "NEET PG — Pharmacology: general pharmacology, autonomic nervous system and chemotherapy.";
const MICRO = "NEET PG — Microbiology and Biochemistry: immunity, hypersensitivity and metabolism.";
const MED = "NEET PG — General Medicine: acid-base, electrolytes, cardiology, endocrinology and clinical approach.";
const SURG = "NEET PG — Surgery: trauma, shock and acute abdomen.";
const OBG = "NEET PG — Obstetrics: labour, postpartum haemorrhage and hypertensive disorders of pregnancy.";
const PED = "NEET PG — Paediatrics: neonatal resuscitation, immunisation structure and developmental framework.";
const CM = "NEET PG — Community Medicine: epidemiology, screening and national programme architecture.";
const CRAFT = "NEET PG — Examination scheme and preparation method: vignettes, recall and test analysis.";

export const NEET_PG_CORPUS: SyllabusSubject[] = [
  {
    slug: "neet-pg-preclinical",
    name: "Pre & Para-clinical Sciences",
    description:
      "Cell injury, inflammation, neoplasia, PK/PD, antimicrobial classes, autonomic map, immunity and metabolism — conceptually, without doses.",
    paper: "NEET PG",
    sources: SRC,
    topics: [
      topic("cell-injury-and-death", "Cell Injury and Cell Death", PATH, [
        L("cellular-adaptations-four", "Cellular Adaptations: Hypertrophy, Hyperplasia, Atrophy, Metaplasia", [
          "The stimulus that drives each adaptation, and whether the change is reversible if the stimulus is removed",
          "Hypertrophy versus hyperplasia, and when they coexist",
          "Atrophy: decreased workload, denervation, ischaemia and ageing as typical settings",
          "Metaplasia as a reversible change of one differentiated cell type to another, and why it can be a precursor to dysplasia",
        ], "compare", ["cellular adaptations pathology", "metaplasia versus dysplasia"]),
        L("reversible-irreversible-injury", "Reversible Injury versus the Point of No Return", [
          "Cellular swelling and fatty change as reversible patterns, and why the cell can still recover",
          "ATP depletion as the central event: pump failure, a shift to anaerobic glycolysis, and ribosomal detachment",
          "The point of no return: irreversible membrane damage and mitochondrial permeability transition",
          "Free-radical injury and the added damage of ischaemia-reperfusion",
        ], "flow", ["reversible versus irreversible injury", "ATP depletion cell injury"]),
        L("necrosis-patterns-associations", "Necrosis: Nuclear Change and Tissue Patterns", [
          "Nuclear morphology: pyknosis, karyorrhexis and karyolysis",
          "Coagulative necrosis in ischaemic infarcts of most solid organs, and liquefactive necrosis in brain infarcts and abscesses",
          "Caseous necrosis in tuberculosis, fat necrosis in pancreatitis, fibrinoid necrosis in immune vasculitis, and gangrenous necrosis in limb ischaemia",
          "Why membrane integrity is lost and neighbouring inflammation is expected",
        ], "cards", ["types of necrosis NEET PG", "caseous versus coagulative"]),
        L("apoptosis-intrinsic-extrinsic", "Apoptosis: Intrinsic and Extrinsic Pathways", [
          "The intrinsic mitochondrial pathway: Bcl-2 family regulation and cytochrome-c release",
          "The extrinsic death-receptor pathway, and how both pathways converge on executioner caspases",
          "Necrosis versus apoptosis on membrane integrity, energy requirement, surrounding inflammation, and whether the process can be physiological",
          "Why apoptosis does not provoke inflammation",
        ], "compare", ["apoptosis intrinsic extrinsic", "necrosis versus apoptosis"]),
      ]),
      topic("inflammation-and-neoplasia", "Inflammation, Repair and Neoplasia", PATH, [
        L("acute-inflammation-events", "Acute Inflammation: Vascular and Cellular Events", [
          "Vascular events: transient vasoconstriction, vasodilatation, increased permeability and stasis, and why the fluid is an exudate",
          "Cellular events in sequence: margination, selectin-mediated rolling, integrin-mediated firm adhesion, transmigration and chemotaxis",
          "Chemical mediators grouped by source: vasoactive amines, arachidonic-acid metabolites, cytokines, complement and kinins",
          "Outcomes: resolution, abscess, fibrosis, or progression to chronic inflammation",
        ], "flow", ["acute inflammation mediators", "leukocyte adhesion cascade"]),
        L("chronic-inflammation-granuloma", "Chronic Inflammation and Granulomas", [
          "The mononuclear infiltrate as the histologic signature of chronic inflammation",
          "Granuloma formation: epithelioid cells and giant cells",
          "Caseating versus non-caseating patterns, and why not every granuloma is tuberculous",
          "When chronic inflammation is the first pattern rather than a sequel of acute inflammation",
        ], "compare", ["granuloma caseating non-caseating", "chronic inflammation histology"]),
        L("repair-healing-intention", "Repair: Cell Populations and Intention of Healing", [
          "Labile, stable and permanent cell populations, and what that means for regeneration",
          "Granulation tissue, and healing by primary versus secondary intention",
          "Local and systemic factors that delay healing",
          "Abnormal outcomes: keloid, hypertrophic scar and contracture",
        ], "timeline", ["phases of wound healing", "primary versus secondary intention"]),
        L("neoplasia-grade-stage", "Neoplasia: Hallmarks, Grading and Staging", [
          "Hallmarks of cancer as a framework, and benign versus malignant lesions on differentiation, growth rate, local invasion and metastasis",
          "Grading as degree of differentiation versus staging as anatomic extent",
          "Why staging usually carries the stronger prognostic weight",
          "Tumour markers: monitoring response and detecting recurrence rather than making the diagnosis",
        ], "hierarchy", ["grading versus staging", "hallmarks of cancer"]),
      ]),
      topic("pharmacology-core", "Pharmacokinetics, Dynamics and Autonomic Map", PHARM, [
        L("pharmacokinetics-adme", "Pharmacokinetics: Absorption to Elimination", [
          "Absorption and bioavailability, the first-pass effect, and how route of administration changes both",
          "Volume of distribution as a proportionality constant, plasma protein binding, and displacement as an interaction idea",
          "Phase I versus phase II metabolism, cytochrome P450, and enzyme induction versus inhibition",
          "Clearance, half-life and steady state as relationships, and first-order versus zero-order elimination conceptually, without doses",
        ], "flow", ["pharmacokinetics ADME", "first-pass bioavailability"]),
        L("pharmacodynamics-agonists", "Pharmacodynamics: Agonists, Antagonists and Curves", [
          "Full agonist, partial agonist, inverse agonist, and competitive versus non-competitive antagonist",
          "Potency versus efficacy read off a dose-response curve: a rightward shift versus a lowered plateau",
          "Why a competitive antagonist is surmountable and a non-competitive antagonist is not",
          "Therapeutic index as a margin-of-safety idea, without quoting numeric indices",
        ], "compare", ["agonist versus antagonist", "potency versus efficacy"]),
        L("autonomic-receptor-map", "Autonomic Receptors and Toxidromes", [
          "Muscarinic and nicotinic cholinergic receptors, and the dominant organ response of each",
          "Alpha-1, alpha-2, beta-1 and beta-2 adrenergic receptors and their dominant organ responses",
          "Drug classes mapped onto that receptor grid as a classification, without doses",
          "Cholinergic excess and the anticholinergic syndrome as toxidrome patterns",
        ], "hierarchy", ["autonomic receptors NEET PG", "cholinergic toxidrome"]),
      ]),
      topic("antimicrobials-immunity-metabolism", "Antimicrobials, Immunity and Metabolism", MICRO, [
        L("antimicrobial-mechanism-classes", "Antimicrobial Mechanism Classes", [
          "Cell-wall inhibitors, protein-synthesis inhibitors at the 30S and 50S subunits, nucleic-acid inhibitors, and folate-pathway inhibitors",
          "Beta-lactams as a family: penicillins, cephalosporins by generation as a structure, carbapenems and monobactams, and what a beta-lactamase inhibitor adds",
          "Bactericidal versus bacteriostatic, and concentration-dependent versus time-dependent killing, conceptually",
          "First-line antitubercular drugs as a set of characteristic adverse-effect patterns, without doses or durations",
        ], "hierarchy", ["antimicrobial mechanism classes", "beta-lactam generations"]),
        L("resistance-and-stewardship", "Resistance Mechanisms and Stewardship Logic", [
          "Enzymatic inactivation, target modification, reduced permeability and efflux pumps",
          "MRSA and ESBL producers as worked examples of those mechanisms",
          "Why tuberculosis is treated with multi-drug regimens as a principle, without quoting the regimen calendar",
          "Prophylactic versus empirical versus definitive therapy, and the logic of stewardship",
        ], "cards", ["antibiotic resistance mechanisms", "antimicrobial stewardship"]),
        L("innate-adaptive-immunity", "Innate versus Adaptive Immunity", [
          "Innate immunity: barriers, phagocytes, natural killer cells and complement, and the absence of memory",
          "Adaptive immunity: humoral and cell-mediated arms, and immunological memory",
          "Antigen presentation on MHC class I versus class II",
          "Immunoglobulin classes and the distinguishing role of each",
        ], "compare", ["innate versus adaptive immunity", "MHC class I II"]),
        L("hypersensitivity-types-i-iv", "Hypersensitivity Types I to IV", [
          "Type I: IgE-mediated mast-cell degranulation, with anaphylaxis and atopy as classic examples",
          "Type II: antibody-mediated cytotoxicity, as in autoimmune haemolytic anaemia",
          "Type III: immune-complex deposition, as in serum sickness",
          "Type IV: delayed T-cell mediated reactions, as in the tuberculin test and contact dermatitis",
        ], "cards", ["hypersensitivity types examples", "type IV delayed"]),
        L("metabolism-inborn-errors", "Metabolic Pathways and Inborn Errors as a Framework", [
          "Glycolysis, the citric-acid cycle, oxidative phosphorylation, gluconeogenesis and the urea cycle, with cellular location as the discriminator",
          "Inborn errors as a category: enzyme deficiency leading to substrate accumulation and product deficiency",
          "Why newborn screening exists as a public-health idea, without listing numeric cut-offs",
          "How a vignette of a metabolic crisis is read: timing, precipitant and the pathway that fits",
        ], "hierarchy", ["inborn errors of metabolism", "urea cycle glycolysis location"]),
      ]),
    ],
  },
  {
    slug: "neet-pg-medicine",
    name: "Medicine & Allied",
    description:
      "ABG approach, electrolytes, ECG and murmurs, heart-failure framework, TFT patterns, and chest-pain, dyspnoea and fever algorithms — no numeric cut-offs.",
    paper: "NEET PG",
    sources: SRC,
    topics: [
      topic("acid-base-electrolytes", "Acid-Base and Electrolytes", MED, [
        L("abg-interpretation-order", "ABG: A Fixed Interpretation Order", [
          "What each measured ABG variable actually represents in the Henderson-Hasselbalch relationship",
          "Read the pH first, name the primary disorder, then test whether compensation is appropriate",
          "Why bicarbonate alone never names the disorder",
          "Acute versus established respiratory compensation as a direction of change, without quoting expected-compensation formulae as numbers to plug in",
        ], "flow", ["ABG interpretation order", "primary acid-base disorder"]),
        L("anion-gap-mixed-disorders", "Anion Gap and Mixed Acid-Base Disorders", [
          "The anion gap, its correction for albumin, and why hypoalbuminaemia hides a gap",
          "High-gap versus normal-gap metabolic acidosis, including renal tubular acidosis and gastrointestinal bicarbonate loss as categories",
          "The delta-delta idea used to unmask a second disorder, as a comparison, not a numeric threshold",
          "The two checks that expose a mixed disorder: inadequate or excessive compensation, and a gap mismatch",
        ], "compare", ["anion gap metabolic acidosis", "mixed acid-base disorder"]),
        L("metabolic-alkalosis-respiratory", "Metabolic Alkalosis and Respiratory Disorders", [
          "Metabolic alkalosis split into chloride-responsive and chloride-resistant causes",
          "Respiratory acidosis and alkalosis, and how the kidney's slower compensation differs from immediate buffering",
          "When a chronic respiratory disorder makes a 'normal' pH expected rather than reassuring",
          "How history of vomiting, diuretic use or lung disease is the discriminator, not a lab number",
        ], "cards", ["chloride responsive alkalosis", "respiratory acidosis compensation"]),
        L("hyponatraemia-volume-tonicity", "Hyponatraemia: Tonicity and Volume as a Framework", [
          "Assess tonicity first, then volume status, then the renal response as a sequence",
          "Why the rate of correction matters as a principle, without quoting millimole targets",
          "The clinical settings that produce hypotonic hyponatraemia, grouped by volume status",
          "Why hyperglycaemia and pseudohyponatraemia are classified before treatment thinking begins",
        ], "flow", ["hyponatraemia approach", "tonicity volume status"]),
        L("hyperkalaemia-three-step", "Hyperkalaemia: Membrane, Shift, Remove", [
          "The ECG progression as a sequence of patterns, without voltage cut-offs",
          "The three-step management principle: stabilise the membrane, shift potassium into cells, then remove it from the body",
          "Why a 'normal' ECG does not exclude dangerous hyperkalaemia",
          "The usual clinical settings, grouped as reduced excretion versus transcellular shift",
        ], "flow", ["hyperkalaemia management steps", "ECG hyperkalaemia progression"]),
      ]),
      topic("heart-and-thyroid", "Heart Failure, ECG, Murmurs and Thyroid", MED, [
        L("ecg-reading-order", "ECG: A Reproducible Reading Order", [
          "Rate, rhythm, axis, intervals, chamber enlargement, then ST-segment and T-wave changes",
          "The recurring exam tracings: ischaemic ST-T patterns with anatomical territories as a map, atrial fibrillation, and degrees of atrioventricular block as a ladder",
          "Why a systematic order beats pattern-spotting from the first glance",
          "What a single tracing cannot exclude when serial comparison is the standard",
        ], "flow", ["ECG interpretation order", "AV block degrees"]),
        L("murmurs-and-manoeuvres", "Murmurs: Timing, Site and Manoeuvres", [
          "Systolic versus diastolic, site of maximal intensity, and radiation as the first localising clues",
          "Bedside manoeuvres — respiration, Valsalva, handgrip and squatting — through their effect on preload and afterload",
          "Why most murmurs soften when preload falls, and which lesion is the classic exception",
          "How a vignette hides the valve: one manoeuvre plus one radiation clue is usually enough",
        ], "compare", ["murmur manoeuvres Valsalva", "systolic versus diastolic murmur"]),
        L("heart-failure-framework", "Heart Failure as a Classification Framework", [
          "Classification by ejection-fraction category, by functional class, and as acute versus chronic decompensation — as labels, not as numeric cut-offs",
          "Forward versus backward failure as a bedside idea",
          "The usual precipitants of decompensation as a checklist",
          "Why treatment logic follows phenotype and congestion, not a single imaging number",
        ], "hierarchy", ["heart failure classification", "acute decompensated HF"]),
        L("tft-patterns-tsh-t4", "Thyroid Function: TSH and Free T4 Patterns", [
          "Primary hypothyroidism, subclinical disease, primary hyperthyroidism and central patterns read from the TSH and free-T4 pair",
          "Why a raised TSH is not overt hypothyroidism until free T4 is read",
          "When a third test (free T3 or antibody) is the next step, as a branch, not as a numeric trigger",
          "Sick euthyroid as a pattern that warns against treating a number in isolation",
        ], "compare", ["TFT patterns TSH T4", "central versus primary thyroid"]),
        L("diabetes-as-concept", "Diabetes and Hyperglycaemic Crises as Concepts", [
          "The diagnostic tests as a set — fasting plasma glucose, oral glucose tolerance, HbA1c and a symptomatic random value — and the requirement for confirmation, without quoting the cut-offs",
          "Diabetic ketoacidosis versus hyperosmolar hyperglycaemic state on discriminating clinical and biochemical features, without numeric thresholds",
          "Why a single abnormal value in an asymptomatic person is not a diagnosis",
          "How a vignette of a hyperglycaemic crisis is branched: pace, volume status and ketosis, not a lab cut-off",
        ], "compare", ["DKA versus HHS", "diabetes diagnostic tests concept"]),
        L("adrenal-primary-versus-secondary", "Adrenal Insufficiency: Primary versus Secondary", [
          "The direction cortisol and ACTH move in primary versus secondary disease",
          "The pigmentation clue that follows from ACTH, and why it is absent in secondary disease",
          "Mineralocorticoid involvement as a discriminator of primary disease, conceptually",
          "Why an adrenal crisis vignette is resuscitated first and investigated second, without quoting replacement doses",
        ], "compare", ["primary versus secondary adrenal", "adrenal crisis approach"]),
      ]),
      topic("presenting-algorithms", "Chest Pain, Dyspnoea and Fever", MED, [
        L("chest-pain-algorithm", "Chest Pain: Stabilise, Exclude, Narrow, Confirm", [
          "The shape of the algorithm: stabilise first, exclude immediately life-threatening causes, narrow by history and examination, then confirm with a targeted test",
          "Separating cardiac, aortic, pulmonary, gastrointestinal and musculoskeletal causes on character, radiation, duration and aggravating factors",
          "What a single normal early investigation does not exclude",
          "The red flags that force immediate escalation rather than further history",
        ], "flow", ["approach to chest pain", "life-threatening chest pain"]),
        L("dyspnoea-algorithm", "Dyspnoea: Airway to Non-Cardiorespiratory", [
          "An airway, parenchymal, pulmonary-vascular, cardiac and non-cardiorespiratory framework",
          "Bedside discriminators: orthopnoea, paroxysmal nocturnal dyspnoea, wheeze and the jugular venous pressure",
          "Why hypoxaemia, anaemia and acidosis can all present as breathlessness",
          "How the vignette's one examination sign is usually the branch point",
        ], "flow", ["dyspnoea differential", "cardiac versus respiratory breathlessness"]),
        L("fever-algorithm", "Fever: Duration, Localising Clues and PUO as a Structure", [
          "Duration-based thinking and localising symptoms as the first split",
          "The point at which a fever meets the definition of pyrexia of unknown origin as a category, without quoting the day count as a memorised cut-off",
          "Community versus healthcare-associated versus travel-related as epidemiologic frames",
          "Red flags that force immediate escalation",
        ], "flow", ["approach to fever", "pyrexia of unknown origin"]),
      ]),
    ],
  },
  {
    slug: "neet-pg-clinical",
    name: "Surgery, Obstetrics & Paediatrics",
    description:
      "ATLS primary survey, shock as a conceptual classification, acute abdomen, PPH, hypertensive disorders, labour stages, NRP, immunisation structure and milestone domains.",
    paper: "NEET PG",
    sources: SRC,
    topics: [
      topic("trauma-and-shock", "Trauma and Shock", SURG, [
        L("atls-abcde-order", "ATLS Primary Survey: Why the Order Cannot Move", [
          "Airway with cervical-spine control, breathing, circulation, disability, exposure — in that order",
          "Why a later letter is not started while an earlier problem is unresolved",
          "The secondary survey as a head-to-toe examination performed only once primary-survey problems are corrected",
          "Adjuncts that must not delay resuscitation",
        ], "flow", ["ATLS primary survey ABCDE", "secondary survey timing"]),
        L("atls-airway-breathing", "Primary Survey: Airway and Breathing", [
          "Airway assessment with cervical-spine protection, and when a definitive airway is a decision rather than a device name",
          "Immediately life-threatening chest injuries identified at the breathing step",
          "Tension pneumothorax, open chest wound, massive haemothorax and flail chest as a recognition set",
          "Why a normal initial oxygen saturation does not exclude an evolving chest injury",
        ], "cards", ["life-threatening chest injuries", "airway with C-spine"]),
        L("atls-circulation-disability", "Primary Survey: Circulation, Disability and Exposure", [
          "Control of external haemorrhage, vascular access, and the anatomical sites where large volumes of blood can be concealed",
          "Disability: the three components of the Glasgow Coma Scale as a structure, without using a score as a treatment cut-off",
          "Exposure and temperature control, and the lethal triad of hypothermia, acidosis and coagulopathy",
          "Where focused ultrasound and radiographs fit as adjuncts",
        ], "flow", ["concealed haemorrhage sites", "Glasgow Coma Scale components"]),
        L("shock-by-mechanism", "Shock Classified by Mechanism", [
          "Hypovolaemic, cardiogenic, obstructive and distributive shock, with the haemodynamic profile that separates them",
          "Why blood pressure is a late and misleading indicator",
          "Obstructive shock as tamponade or tension physiology until proven otherwise in trauma",
          "Distributive shock as a vasodilation pattern, with sepsis and anaphylaxis as the usual exam settings",
        ], "compare", ["types of shock haemodynamics", "obstructive versus hypovolaemic"]),
        L("haemorrhagic-shock-conceptual", "Haemorrhagic Shock Classes as a Conceptual Ladder", [
          "A four-class ladder of progressive blood loss, described by which vital-sign change appears first, without quoting percentage blood-loss figures",
          "Tachycardia and a narrowed pulse pressure as earlier clues than hypotension",
          "Why a normal initial haemoglobin does not exclude significant acute haemorrhage",
          "Damage-control resuscitation as a principle: haemorrhage control, balanced products, and avoiding the lethal triad — without doses or ratios as numbers",
        ], "timeline", ["haemorrhagic shock classes", "damage control resuscitation"]),
      ]),
      topic("acute-abdomen", "Acute Abdomen", SURG, [
        L("acute-abdomen-approach", "Acute Abdomen: Pain Character and Peritoneal Signs", [
          "Pain character, migration and peritoneal signs as the first discriminators",
          "A rigid, silent abdomen as a surgical emergency rather than an observation ward problem",
          "Intestinal obstruction versus perforation on clinical presentation and the idea of an erect radiograph",
          "When resuscitation and urgent surgery outrank further imaging",
        ], "flow", ["acute abdomen approach", "peritoneal signs"]),
        L("acute-abdomen-localising", "Localising the Acute Abdomen", [
          "Right iliac fossa differentials, and the signs classically described in appendicitis",
          "Upper abdominal differentials: perforated peptic ulcer, acute cholecystitis with Murphy's sign, and acute pancreatitis",
          "Wound healing phases and surgical-site infection as a prevention bundle, including the idea of prophylaxis timed to incision, without quoting minutes or doses",
          "Clean-to-dirty wound classification as a risk framework, not as percentages",
        ], "compare", ["RIF pain differentials", "surgical site infection prevention"]),
      ]),
      topic("obstetrics-emergencies", "PPH, Hypertension and Labour", OBG, [
        L("pph-four-ts", "Postpartum Haemorrhage: Tone, Trauma, Tissue, Thrombin", [
          "Primary versus secondary PPH by timing, and why visual estimation of blood loss is unreliable",
          "The four-T framework, with the clinical clue that points to each cause",
          "Uterine atony as the commonest cause",
          "Risk factors that allow anticipation, and active management of the third stage as prevention, without quoting drug doses",
        ], "cards", ["four T causes of PPH", "primary versus secondary PPH"]),
        L("pph-stepwise-response", "PPH: Stepwise Response without Doses", [
          "Call for help, uterine massage, uterotonics as a class, then examination for genital-tract trauma and retained tissue",
          "Escalation when medical measures fail: tamponade, compression sutures, stepwise devascularisation, hysterectomy as the final step",
          "Why surgical measures are not the first step in atonic haemorrhage",
          "Concurrent resuscitation: airway, access and blood products as a principle, without transfusion-ratio numbers",
        ], "flow", ["PPH stepwise management", "uterine atony response"]),
        L("htn-disorders-pregnancy", "Hypertensive Disorders of Pregnancy as a Spectrum", [
          "Chronic hypertension, gestational hypertension, pre-eclampsia, eclampsia, and pre-eclampsia superimposed on chronic hypertension",
          "The features that define severe disease as end-organ involvement, without quoting blood-pressure cut-offs",
          "Why proteinuria is not required when end-organ features are present",
          "Delivery as the definitive treatment, and why risk does not end at delivery",
        ], "hierarchy", ["hypertensive disorders of pregnancy", "pre-eclampsia spectrum"]),
        L("eclampsia-immediate-priorities", "Eclampsia: Airway, Seizure Control, then Delivery", [
          "Immediate priorities: airway protection, seizure control and prevention of recurrence before planning delivery",
          "Magnesium sulphate as the agent of choice for prophylaxis and recurrence prevention, named without a dose",
          "Monitoring for toxicity as a clinical sequence (respiratory effort, reflexes), not as a serum-level number",
          "Why seizures can occur postpartum",
        ], "flow", ["eclampsia management priorities", "magnesium sulphate toxicity watch"]),
        L("labour-four-stages", "Labour: Stages and Cardinal Movements", [
          "What marks the beginning and end of each stage of labour",
          "The cardinal movements of normal labour as an ordered mechanical sequence",
          "Assessment of progress: cervical dilatation, descent, contractions and fetal heart-rate monitoring as a set",
          "Why latent and active phases must be distinguished before delay is judged",
        ], "timeline", ["stages of labour", "cardinal movements"]),
        L("partograph-as-structure", "The Partograph as a Decision Tool", [
          "What is plotted, and what the alert line and action line mean for management, as a structure",
          "Why the partograph is a decision tool, not a retrospective record",
          "The antenatal-visit idea: content changes as pregnancy advances, danger signs to report, without quoting visit-week schedules as numbers",
          "Routine antenatal investigations as a screening set, each named by purpose",
        ], "flow", ["partograph alert action line", "antenatal care structure"]),
      ]),
      topic("newborn-and-child", "NRP, Immunisation Structure and Milestones", PED, [
        L("nrp-algorithm", "Neonatal Resuscitation: Assessment then Escalation", [
          "The rapid assessment at birth that decides routine care with the mother versus resuscitation",
          "Initial steps: warmth, positioning, clearing the airway only if required, drying and stimulation",
          "Escalation in order: effective positive-pressure ventilation, heart rate as the primary indicator of response, then compressions, with medication as the last step — without doses",
          "Why colour is not the indicator used to judge response",
        ], "flow", ["neonatal resuscitation algorithm", "NRP heart rate response"]),
        L("immunisation-schedule-structure", "Immunisation Schedule as a Structure", [
          "Birth dose, primary series, boosters and catch-up as the architecture of a programme, without quoting ages or doses",
          "Route of administration as a discriminator between vaccines in the Universal Immunisation Programme",
          "True versus false contraindications, and why minor illness is not a reason to defer",
          "How a missed opportunity is created when a false contraindication is applied",
        ], "hierarchy", ["UIP schedule structure", "true versus false contraindications"]),
        L("milestones-as-framework", "Developmental Milestones as Parallel Domains", [
          "Gross motor, fine motor, language and social domains learnt as parallel sequences, not as isolated age facts",
          "Why a lost milestone is more serious than a late one",
          "Growth plotted on charts: weight, length and head circumference, and what crossing centiles signifies as a pattern, without quoting centile cut-offs",
          "Red-flag thinking as a domain-wise checklist",
        ], "cards", ["developmental milestone domains", "lost versus delayed milestone"]),
      ]),
    ],
  },
  {
    slug: "neet-pg-community-and-strategy",
    name: "Community Medicine & Exam Strategy",
    description:
      "Study designs, bias, screening indices, incidence and prevalence, national programmes as architecture, and NEET PG exam craft.",
    paper: "NEET PG",
    sources: SRC,
    topics: [
      topic("study-designs-and-bias", "Study Designs and Bias", CM, [
        L("observational-study-designs", "Observational Designs: Cohort and Case-Control", [
          "Descriptive versus analytical questions, and which design is built to answer each",
          "Cohort studies: direction in time, incidence, relative risk, and the strengths and weaknesses that follow",
          "Case-control studies: the odds ratio, when it approximates relative risk, and why rare diseases suit this design",
          "Why relative risk cannot be calculated from a case-control study",
        ], "compare", ["cohort versus case-control", "relative risk versus odds ratio"]),
        L("rct-experimental-design", "Experimental Design: The Randomised Trial", [
          "Randomisation as the method that balances both known and unknown confounders",
          "Blinding: who is blinded, and what each layer prevents",
          "Intention-to-treat as analysing as randomised",
          "Why a trial answers a different question from a cohort, even when both follow people forward",
        ], "flow", ["randomised controlled trial", "intention to treat"]),
        L("selection-information-bias", "Selection Bias and Information Bias", [
          "Selection bias: who enters the study, with a recognisable example",
          "Information bias: how exposure or outcome is measured, including recall and observer bias",
          "How each bias distorts association in a predictable direction",
          "Why a larger sample does not fix a biased measurement",
        ], "cards", ["selection bias epidemiology", "information bias recall"]),
        L("confounding-versus-bias", "Confounding: Design and Analysis Handles", [
          "Confounding as a mixing of effects, and how it differs from bias",
          "Handling at design: restriction, matching, randomisation",
          "Handling at analysis: stratification and multivariable adjustment as ideas",
          "Why better data collection alone does not remove a confounder that was not measured",
        ], "compare", ["confounding versus bias", "matching stratification"]),
      ]),
      topic("screening-and-occurrence", "Screening, Incidence and Prevalence", CM, [
        L("sensitivity-specificity", "Sensitivity and Specificity as Test Properties", [
          "Sensitivity as the true-positive rate among those with disease, specificity as the true-negative rate among those without",
          "How a two-by-two table is built, and which cell belongs where",
          "Why sensitivity and specificity do not move when prevalence changes",
          "The trade-off when a cut-off on a continuous test is shifted, described as a direction, not a number",
        ], "compare", ["sensitivity specificity", "screening two-by-two"]),
        L("ppv-npv-prevalence", "Predictive Values and Prevalence", [
          "Positive and negative predictive value, and why they are not properties of the test alone",
          "How prevalence moves predictive values while leaving sensitivity and specificity unchanged",
          "Why a highly sensitive test need not have a high PPV in a low-prevalence population",
          "Screening criteria: the disease and the test as a pair of suitability questions",
        ], "flow", ["PPV NPV prevalence", "predictive value screening"]),
        L("incidence-versus-prevalence", "Incidence, Prevalence and Duration", [
          "Incidence as new cases in a population at risk, prevalence as existing cases at a point or period",
          "The relationship through duration of disease",
          "Why standardisation is needed to compare populations with different age structures",
          "When prevalence is the wrong measure for aetiology",
        ], "compare", ["incidence versus prevalence", "duration of disease"]),
      ]),
      topic("programmes-and-exam-craft", "National Programmes and Exam Craft", CRAFT, [
        L("national-programmes-framework", "National Programmes as a Framework", [
          "How India's national health programmes are grouped under the National Health Mission as architecture, not as current numerical targets",
          "Reproductive, maternal, newborn, child and adolescent health as one pillar; communicable disease control as another; non-communicable disease programmes as a third",
          "Why a programme is a delivery system (people, facilities, commodities, information) rather than a named scheme to be memorised as a list",
          "How a vignette that names a programme is usually asking the strategy (screening, treatment, follow-up), not a coverage figure",
        ], "hierarchy", ["NHM programme architecture", "RMNCH+A framework"]),
        L("nhm-delivery-structure", "NHM Delivery: Levels of Care", [
          "Sub-centre, primary health centre, community health centre and district hospital as a referral ladder, conceptually",
          "The idea of a frontline worker and a facility-based team, without quoting population norms as figures",
          "Surveillance as a function that sits across programmes",
          "Why a weak peripheral facility shows up as late presentation in a clinical vignette",
        ], "flow", ["levels of care India", "NHM referral ladder"]),
        L("neet-pg-vignette-technique", "NEET PG Vignettes: Find the Discriminator", [
          "Read the stem for the one history detail or examination sign that is the discriminator; the rest is distractor",
          "Stabilise-first stems: investigations are wrong until the airway, breathing or circulation step is done",
          "Image-based questions: a deliberate bank across pathology, radiology, dermatology and instruments",
          "Why looking at options before the stem trains you to match rather than to reason",
        ], "flow", ["NEET PG vignette technique", "clinical discriminator"]),
        L("neet-pg-recall-and-error-log", "Recall, Grand Tests and the Error Log", [
          "Why active recall outperforms rereading, and how to convert a chapter into prompts",
          "Spaced repetition applied to a medical syllabus: what deserves scheduling",
          "Grand-test discipline: full-length timed papers rather than untimed subject-wise quizzes",
          "Classify every mistake as knowledge gap, misread stem, calculation slip or guess, then review by category — including lucky correct guesses",
        ], "hierarchy", ["NEET PG error log", "active recall grand test"]),
        L("neet-pg-last-month-plan", "Last-Month Consolidation, Not New Sources", [
          "A last-month plan built on consolidation, daily tests and no new books",
          "Pacing across a long single-best-answer paper, and flagging for review as a method",
          "Where marks concentrate as a revision-order idea, without quoting paper-wise mark tables",
          "Why adding a new source in the final month usually costs more than it returns",
        ], "none", ["NEET PG last month plan", "single best answer pacing"]),
      ]),
    ],
  },
];
