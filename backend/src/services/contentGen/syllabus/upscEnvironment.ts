import { L, topic, type SyllabusSubject } from "./syllabusTypes.js";

const SRC = [
  "https://moef.gov.in/",
  "https://unfccc.int/process-and-meetings/the-paris-agreement",
  "https://cpcb.nic.in/",
];

const ECO =
  "GS Paper III / Prelims — General issues on Environmental ecology, Bio-diversity and Climate Change - that do not require subject specialization.";
const CLIM =
  "GS Paper III — Conservation, environmental pollution and degradation, environmental impact assessment; climate change as a general issue that does not require subject specialisation.";
const CONS =
  "GS Paper III — Conservation, environmental pollution and degradation, environmental impact assessment.";

export const UPSC_ENVIRONMENT_CORPUS: SyllabusSubject[] = [
  {
    slug: "upsc-environment",
    name: "Environment & Ecology",
    description:
      "GS Paper III environment at topic granularity: ecology first principles, climate regime, and Indian conservation and pollution law.",
    paper: "GS Paper III",
    sources: SRC,
    topics: [
      topic("ecology", "Ecology: Ecosystems, Energy and Biodiversity", ECO, [
        L("ecosystem-structure-function", "Ecosystem: Structure, Function and Types", [
          "Abiotic versus biotic components and why both are needed for a functioning system",
          "Producers, consumers and decomposers as functional groups, not as a species list",
          "Habitat versus niche: the address versus the functional role",
          "Terrestrial, freshwater, marine and wetland as types the exam actually distinguishes",
        ], "hierarchy", ["ecosystem structure UPSC", "habitat vs niche"]),
        L("biomes-of-the-earth", "Biomes: Climate as the Organising Variable", [
          "What a biome is, and how it differs from an ecosystem and a habitat",
          "Why temperature and precipitation jointly set biome boundaries",
          "Tropical rainforest, savanna, desert, temperate forest, taiga and tundra as climate envelopes",
          "Why the same biome can occur on different continents with different species",
        ], "compare", ["biomes UPSC", "biome vs ecosystem"]),
        L("energy-flow-food-chains", "Energy Flow: Food Chains, Webs and Trophic Levels", [
          "Why energy flow is one-way while nutrients cycle",
          "Grazing versus detritus food chains and which dominates in most terrestrial systems",
          "Food web versus food chain: stability as redundancy of paths, not as length",
          "The 10 per cent transfer rule as a teaching approximation, not a measured constant",
        ], "flow", ["energy flow ecosystem", "grazing vs detritus chain"]),
        L("ecological-pyramids", "Ecological Pyramids: Number, Biomass and Energy", [
          "Pyramid of numbers versus biomass versus energy, and what each can invert",
          "Why a pyramid of energy cannot invert if the system is closed over the period measured",
          "Parasitic and pond examples as the classic inversions of numbers or biomass",
          "What a pyramid does not tell you: species identity, keystone roles, resilience",
        ], "compare", ["ecological pyramids UPSC", "pyramid of energy"]),
        L("productivity-gpp-npp", "Primary Productivity: GPP, NPP and Limitations", [
          "Gross versus net primary productivity and what respiration subtracts",
          "Why NPP, not GPP, is the energy available to heterotrophs",
          "Light, water, nutrients and growing season as the usual limiting factors",
          "Why open ocean can have high GPP per area in upwelling zones and still low global share",
        ], "flow", ["GPP vs NPP", "primary productivity UPSC"]),
        L("nutrient-cycles", "Biogeochemical Cycles: Carbon, Nitrogen and Phosphorus", [
          "Gaseous versus sedimentary cycles and why phosphorus is typically sedimentary",
          "Carbon: photosynthesis and respiration as the fast loop; fossil carbon as the slow loop",
          "Nitrogen: fixation, nitrification, assimilation, ammonification and denitrification as named steps",
          "Why eutrophication is a phosphorus and nitrogen problem in water, not a carbon problem",
        ], "cycle", ["nitrogen cycle steps", "carbon cycle UPSC"]),
        L("ecological-succession", "Ecological Succession: Primary, Secondary and Climax", [
          "Primary versus secondary succession: whether a soil seed bank already exists",
          "Pioneer species: what they do to the site that later species need",
          "Climax as a useful idea and why disturbance keeps many systems from a single end-state",
          "Hydrarch versus xerarch as moisture gradients, not as two unrelated stories",
        ], "timeline", ["ecological succession UPSC", "primary vs secondary succession"]),
        L("population-ecology", "Population Ecology: Growth Forms and Carrying Capacity", [
          "Exponential versus logistic growth and what carrying capacity means",
          "Density-dependent versus density-independent checks",
          "r-selected versus K-selected life histories as ends of a spectrum",
          "Why a population can overshoot K and then crash",
        ], "compare", ["carrying capacity ecology", "r vs K selection"]),
        L("species-interactions", "Species Interactions: From Competition to Mutualism", [
          "Competition, predation, parasitism, commensalism and mutualism as signed interactions",
          "Competitive exclusion versus resource partitioning",
          "Keystone species: disproportionate effect relative to biomass",
          "Invasive species as a community-reorganisation problem, not only a species-count problem",
        ], "cards", ["species interactions UPSC", "keystone species"]),
        L("biodiversity-levels", "Biodiversity: Genetic, Species and Ecosystem Levels", [
          "Why three levels are listed separately: genes, species, ecosystems",
          "Alpha, beta and gamma diversity as within, between and regional measures",
          "Hotspots as irreplaceability plus threat, not as a species-richness ranking alone",
          "India as a megadiverse country: what the label claims and what it does not",
        ], "hierarchy", ["levels of biodiversity", "alpha beta gamma diversity"]),
      ]),
      topic("climate", "Climate Change: Regime, Equity and India's Missions", CLIM, [
        L("unfccc-architecture", "UNFCCC: Objective, Parties and the Conference of Parties", [
          "The Convention's objective: stabilise greenhouse gas concentrations to prevent dangerous interference",
          "Annex I, Annex II and non-Annex I as the original party categories, and why they still matter historically",
          "COP as the supreme decision body; subsidiary bodies as the workhorses",
          "Common but differentiated responsibilities as a Convention principle, not a Paris invention",
        ], "hierarchy", ["UNFCCC COP", "Annex I Annex II"]),
        L("kyoto-protocol", "Kyoto Protocol: Binding Annex I Targets and Flexibility Mechanisms", [
          "Why Kyoto bound Annex I parties for a first commitment period and left others unbound",
          "Clean Development Mechanism, Joint Implementation and emissions trading as the three flexibility mechanisms",
          "Why a second commitment period had thin participation",
          "What Kyoto established that Paris later reused: MRV culture, carbon-unit accounting",
        ], "timeline", ["Kyoto Protocol UPSC", "CDM Joint Implementation"]),
        L("paris-agreement", "Paris Agreement: NDCs, Temperature Goal and Global Stocktake", [
          "The well-below 2°C goal and the 1.5°C pursuit as the temperature language",
          "Nationally Determined Contributions as nationally set, internationally recorded pledges",
          "The five-year NDC cycle and the global stocktake as the ratchet",
          "Why Paris is a hybrid of bottom-up pledges and top-down procedure",
        ], "flow", ["Paris Agreement NDCs", "global stocktake"]),
        L("cbdr-rc-equity", "CBDR-RC: Equity in the Climate Regime", [
          "Common but differentiated responsibilities and respective capabilities as one phrase",
          "Why historical emissions, current capability and development needs are the three equity arguments",
          "How Paris kept CBDR-RC while moving to a universal NDC form",
          "Climate finance and technology transfer as the operational face of differentiation",
        ], "compare", ["CBDR-RC UPSC", "climate equity"]),
        L("ndcs-and-transparency", "NDCs: Mitigation, Adaptation and the Enhanced Transparency Framework", [
          "Mitigation, adaptation and means of implementation as the three NDC baskets countries may include",
          "Unconditional versus conditional elements of an NDC",
          "Biennial Transparency Reports as the Paris MRV vehicle",
          "Why comparability of NDCs is limited when metrics and coverage differ",
        ], "cards", ["NDC transparency framework", "BTR UNFCCC"]),
        L("article-6-carbon-markets", "Article 6: Cooperative Approaches and Carbon Markets", [
          "Article 6.2 cooperative approaches versus the Article 6.4 mechanism",
          "Corresponding adjustment as the device that prevents double counting",
          "Why a carbon market is not the same as a domestic carbon tax",
          "What ITMOs are conceptually, without treating any year's traded volume as a fact to memorise",
        ], "flow", ["Paris Article 6", "corresponding adjustment carbon"]),
        L("ipcc-role", "IPCC: Assessment, Scenarios and What It Does Not Do", [
          "The IPCC as an assessment body, not a negotiating party",
          "Working Groups I, II and III: physical science, impacts/adaptation, mitigation",
          "Representative Concentration Pathways and Shared Socioeconomic Pathways as scenario families",
          "Why an IPCC report does not itself create a legal obligation",
        ], "hierarchy", ["IPCC working groups", "RCP SSP climate"]),
        L("mitigation-vs-adaptation", "Mitigation versus Adaptation versus Loss and Damage", [
          "Mitigation reduces the cause; adaptation reduces the harm of what is already locked in",
          "Why the two are complements, and when they trade off in a budget",
          "Loss and damage as residual harm after mitigation and adaptation",
          "Co-benefits: air quality and energy security as reasons mitigation is not only a climate story",
        ], "compare", ["mitigation vs adaptation", "loss and damage climate"]),
        L("napcc-and-missions", "India's Climate Missions: NAPCC as the Domestic Frame", [
          "National Action Plan on Climate Change as an umbrella of missions, not a statute",
          "The original eight missions as named headings the exam expects you to list",
          "Why a mission is a coordinating frame, not a substitute for a sectoral law or a carbon price",
          "State Action Plans on Climate Change as the sub-national counterpart",
        ], "hierarchy", ["NAPCC eight missions", "SAPCC India"]),
        L("india-ndc-architecture", "India's NDC Architecture: Intensity, Non-Fossil and Sinks", [
          "Emissions-intensity of GDP as a relative, not an absolute, mitigation form",
          "Non-fossil installed capacity as an energy-mix pledge, distinct from a generation-share pledge",
          "Additional carbon sink through forests and trees as a land-use contribution",
          "Why these three are not interchangeable metrics and should not be added as if they were",
        ], "cards", ["India NDC UPSC", "emissions intensity GDP"]),
      ]),
      topic("conservation-pollution", "Conservation Law, Protected Areas and Pollution Control", CONS, [
        L("wildlife-protection-act-1972", "Wildlife (Protection) Act, 1972: Schedules and Authorities", [
          "Schedules I to VI as graded protection, and why Schedule I is the strictest for animals",
          "What hunting, trade and possession controls the Act actually does",
          "National Board for Wildlife and State Boards as the statutory advisory bodies",
          "The 2022 amendment's addition of a new schedule for CITES-listed species as a category, not a species list to memorise",
        ], "hierarchy", ["Wildlife Protection Act 1972", "WPA schedules"]),
        L("biological-diversity-act-2002", "Biological Diversity Act, 2002: Access and Benefit Sharing", [
          "NBA, SBBs and BMCs as the three-tier institutional stack",
          "Access and benefit sharing as the Act's core bargain, not a wildlife-offence code",
          "People's Biodiversity Registers as the local knowledge instrument",
          "How the Act sits beside the WPA: genes and knowledge versus hunting and trade",
        ], "hierarchy", ["Biological Diversity Act 2002", "NBA SBB BMC"]),
        L("forest-conservation-act", "Forest (Conservation) Act: Diversion, Compensatory Afforestation", [
          "Why converting forest land to non-forest use needs prior central approval",
          "What 'forest' has meant after the Godavarman line, conceptually",
          "Compensatory afforestation and NPV as the two usual conditions on diversion",
          "The 2023 amendment's exemptions as a category of debate, without treating any gazette list as the page's payload",
        ], "flow", ["Forest Conservation Act UPSC", "compensatory afforestation"]),
        L("protected-area-network", "Protected Areas: National Parks, Sanctuaries and Reserves", [
          "National Park versus Wildlife Sanctuary: the grazing and private-rights distinction",
          "Conservation reserves and community reserves as the two later, more flexible categories",
          "Tiger Reserves as a Project Tiger overlay of core plus buffer, not a fifth PA type in the original Act",
          "Why a PA notification is a rights-and-livelihood decision as well as a biology decision",
        ], "compare", ["national park vs sanctuary", "conservation vs community reserve"]),
        L("project-tiger-elephant", "Flagship Species Programmes: Tiger, Elephant and Others", [
          "Why a flagship is a fundraising and enforcement vehicle, not a proof that only that species matters",
          "Core–buffer design in tiger reserves and why inviolate core is contested",
          "Project Elephant: corridors as the binding constraint, not only reserve area",
          "How these sit under the WPA rather than as stand-alone statutes",
        ], "cards", ["Project Tiger UPSC", "Project Elephant corridors"]),
        L("eia-process-india", "Environmental Impact Assessment: Process, Categories and Limits", [
          "Screening, scoping, public hearing, appraisal and clearance as the EIA sequence",
          "Category A versus B and the role of the Centre versus the State SEIAA",
          "Why EIA is ex ante and environmental audit is ex post",
          "Common failure modes: post-facto clearance, poor baseline, weak public hearing",
        ], "flow", ["EIA process India", "Category A vs B EIA"]),
        L("environment-protection-act-1986", "Environment (Protection) Act, 1986: Umbrella Powers", [
          "Why EPA 1986 is the residual umbrella after air and water statutes already existed",
          "Section 3 powers to set standards, restrict areas and issue directions",
          "How EIA notifications, CRZ and waste rules are issued under this Act",
          "The National Green Tribunal as the later specialised forum, not as a replacement for the Act",
        ], "hierarchy", ["Environment Protection Act 1986", "EPA umbrella legislation"]),
        L("air-act-and-ncap", "Air Pollution: Air Act, CPCB–SPCBs and NCAP", [
          "Air (Prevention and Control of Pollution) Act, 1981: consent, standards and the Board architecture",
          "CPCB versus SPCBs: standard-setting and coordination versus state enforcement",
          "National Ambient Air Quality Standards as the concentration benchmarks, not as an emissions cap",
          "NCAP as a city-centred programme with 2017 as the base year in its original design",
        ], "flow", ["NCAP India", "Air Act 1981 CPCB"]),
        L("water-act-and-pollution", "Water Pollution: Water Act, Discharge Standards and Rivers", [
          "Water (Prevention and Control of Pollution) Act, 1974 as the first national pollution statute",
          "Consent to establish and consent to operate as the two regulatory gates",
          "Why a river-cleaning programme is not the same as a discharge-standard regime",
          "Groundwater contamination as a state and Central Ground Water Authority problem as well as a Water Act problem",
        ], "flow", ["Water Act 1974 UPSC", "consent to operate pollution"]),
        L("waste-rules-india", "Waste: Solid, Plastic, Biomedical, Hazardous and E-Waste Rules", [
          "Why waste is regulated as separate rule-sets under EPA 1986, not as one Waste Act",
          "Extended producer responsibility as the plastic and e-waste design idea",
          "Polluter-pays and the hierarchy reduce–reuse–recycle–dispose",
          "Legacy dumps versus daily generation as two different municipal problems",
        ], "cards", ["EPR plastic waste India", "solid waste management rules"]),
        L("cpcb-standards-monitoring", "CPCB: Functions, Standards and the Monitoring Stack", [
          "CPCB as the technical apex under the Air and Water Acts, not as a ministry",
          "Emission standards versus ambient standards and why both are needed",
          "National Air Quality Index as a communication tool built on NAAQS pollutants",
          "What CPCB can direct and what only a state government or a court can compel",
        ], "hierarchy", ["CPCB functions UPSC", "NAAQS vs AQI"]),
        L("crz-and-wetlands", "Coastal Regulation and Wetlands: CRZ and Wetland Rules", [
          "CRZ zones as a spatial planning tool under EPA, not as a wildlife schedule",
          "Why hazard line and NDZ ideas keep returning in coastal regulation",
          "Wetlands (Conservation and Management) Rules: identification and prohibited activities",
          "Ramsar listing as an international designation that does not by itself create an Indian PA",
        ], "compare", ["CRZ notification UPSC", "Wetland Rules India"]),
      ]),
    ],
  },
];
