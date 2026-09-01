import { L, topic, type SyllabusSubject } from "./syllabusTypes.js";

const SRC = [
  "https://ncert.nic.in/textbook.php",
  "https://asi.nic.in/",
];

const AN = "History of India and Indian National Movement.";
const MOD =
  "Modern Indian history from about the middle of the eighteenth century until the present- significant events, personalities, issues. The Freedom Struggle - its various stages and important contributors/contributions from different parts of the country.";
const CULT =
  "Indian culture will cover the salient aspects of Art Forms, Literature and Architecture from ancient to modern times.";
const POST = "Post-independence consolidation and reorganization within the country.";

export const UPSC_HISTORY_CORPUS: SyllabusSubject[] = [
  {
    slug: "upsc-history",
    name: "History & Indian Heritage",
    description:
      "GS Paper I history and heritage at topic granularity: one page per concept the exam actually tests.",
    paper: "GS Paper I",
    sources: SRC,
    topics: [
      topic("ancient-medieval", "Ancient and Medieval India", AN, [
        L("ivc-harappan", "Indus Valley Civilisation: Urban Form and Evidence", [
          "Planned streets, baked brick, covered drains and the citadel–lower-town layout as archaeological signatures",
          "Craft specialisation: beads, bronze, and seals in a still-undeciphered script",
          "Keep sites distinct: Harappa and Mohenjo-daro (core), Dholavira (water), Rakhigarhi (extent), Kalibangan (plough mark), Lothal (dockyard claim and the debate)",
          "Why invasion-as-destruction is not what the archaeology now supports: climate, river shift and de-urbanisation as working explanations",
        ], "hierarchy", ["Indus Valley Civilisation UPSC", "Harappan sites"]),
        L("vedic-age", "Vedic and Later Vedic Society and Polity", [
          "Early Vedic pastoralism versus later Vedic agriculture and the janapada",
          "Sabha, samiti and the raja — what the texts actually allow you to claim",
          "Varna as a later Vedic ordering, not a ready-made caste census of the Rigveda",
          "Painted Grey Ware and later Vedic geography in the Ganga plain as an archaeological counterpart",
        ], "compare", ["Vedic age UPSC", "later Vedic polity"]),
        L("jainism-buddhism", "Jainism and Buddhism: Why They Arose and What They Changed", [
          "The mahajanapada urban and heterodox context of the mid-first millennium BCE",
          "Jain anekantavada and the Buddhist middle path as answers to Vedic ritual and Upanishadic speculation",
          "Ashoka's dhamma is not identical with canonical Buddhism — keep the edicts and the sangha distinct",
          "Why both traditions left a larger archaeological footprint (stupas, caves) than contemporary Brahmanical cult",
        ], "compare", ["Jainism Buddhism UPSC", "Ashoka dhamma"]),
        L("mauryan-state", "The Mauryan State: Administration, Ashoka and Collapse", [
          "Magadha's rise: iron, the Ganga corridor and the Nanda inheritance",
          "Megasthenes and the Arthashastra as sources — what each can and cannot prove",
          "Ashoka's edicts: dhamma, Kalinga as a turning point in royal self-presentation, and dhamma versus a state religion",
          "Why a highly centralised picture of the Mauryan state is now qualified by regional variation",
        ], "hierarchy", ["Mauryan administration UPSC", "Ashoka edicts"]),
        L("gupta-age", "The Gupta Age: Polity, Economy and the Classical Label", [
          "Samudragupta's Allahabad prashasti as a source for conquest and court ideology",
          "Land grants and the debate on Indian feudalism — what the inscriptions show",
          "Why 'golden age' is a literary-scientific peak, not a claim about everyone",
          "Fahien's account as a check on courtly sources",
        ], "cards", ["Gupta age UPSC", "Allahabad prashasti"]),
        L("sangam-tamilakam", "Sangam Age and Early Tamilakam", [
          "Three crowned kings: Chera, Chola, Pandya and the tinai landscape of the poems",
          "Roman trade: coins, Arikamedu and the Muziris evidence without inflating a colony",
          "Megalithic burials as the archaeological counterpart of the poems",
          "Why Sangam is a literary corpus, not a single political empire",
        ], "cards", ["Sangam age UPSC", "Tamilakam Chera Chola Pandya"]),
        L("delhi-sultanate", "Delhi Sultanate: Iqta and the Khalji–Tughlaq Experiments", [
          "Slave, Khalji, Tughlaq, Sayyid and Lodi as successive regimes, not one static Sultanate system",
          "Iqta as an assignment of revenue, not a hereditary European fief",
          "Alauddin Khalji: market control, branding of horses and the standing army as one package",
          "Muhammad bin Tughlaq's token currency, Daulatabad and the Doab tax as failures of information and logistics",
        ], "timeline", ["Delhi Sultanate UPSC", "Alauddin Khalji market reforms"]),
        L("vijayanagara-empire", "Vijayanagara: Nayakas, Temples and Hampi", [
          "Harihara–Bukka and the Deccan frontier against the Bahmani and successor sultanates",
          "Amara-nayaka system: military tenure and temple-centred redistribution",
          "Hampi as a capital landscape: royal centre, sacred centre, bazaars",
          "Talikota (Rakshasa-Tangadi) 1565 as a political fracture, not the overnight end of South Indian statecraft",
        ], "hierarchy", ["Vijayanagara empire UPSC", "amara-nayaka"]),
        L("bhakti-sufi", "Bhakti and Sufi Movements: Saints, Silsilas and Social Reach", [
          "Nirguna (Kabir, Nanak) versus saguna (Tulsidas, Chaitanya, Alvars, Nayanars) as two registers, not two religions",
          "Chishti, Suhrawardi, Qadiri, Naqshbandi silsilas and why the Chishti khanqah sat close to towns",
          "Why Bhakti is not a Protestant Reformation imported from Europe",
          "Shared idioms: guru/pir, vernacular, and the limit of how far caste was actually dissolved",
        ], "compare", ["Bhakti movement UPSC", "Sufi silsilas India"]),
        L("mughal-administration", "Mughal Administration: Mansab, Jagir and Zabt", [
          "Mansab as zat and sawar — rank, not a feudal title",
          "Jagirdari: transferable revenue assignment and the crisis when jagir land ran short",
          "Zabt and Todar Mal's measurement — a revenue method, not a tax rate to memorise as a number",
          "Akbar's sulh-i-kul as court policy, distinct from Aurangzeb's later emphasis on sharia and the jizya revival",
        ], "flow", ["mansabdari jagirdari UPSC", "Todar Mal zabt"]),
        L("chola-state", "The Cholas: Assemblies, Temple Economy and Expeditions", [
          "Rajaraja I and Rajendra I: the Ganga raid and the Srivijaya expedition as projection, not a standing overseas empire",
          "Ur, sabha and nagaram: inscriptions on local assemblies and the brahmadeya",
          "Brihadisvara at Thanjavur as a state temple that stored land, labour and ritual",
          "Why 'Chola navy ruled the Bay' is a claim that must be tied to specific expeditions",
        ], "hierarchy", ["Chola administration UPSC", "sabha ur nagaram"]),
        L("sher-shah-sur", "Sher Shah Suri: The Interregnum that Taught the Mughals", [
          "Grand Trunk alignment, sarais and dak as a communications state",
          "The silver rupiya as a standard later taken into Mughal use",
          "Revenue: measurement and the rai (crop-rate) idea without inventing a percentage",
          "Why a short Sur regime is over-represented in the exam: it bridges Sultanate practice and Akbar",
        ], "timeline", ["Sher Shah Suri UPSC", "rupiya Grand Trunk"]),
      ]),
      topic("modern-india", "Modern India and the Freedom Struggle", MOD, [
        L("eighteenth-century-india", "Eighteenth-Century India: Decline and Regional States", [
          "Jagirdari crisis, Nadir Shah 1739 and Ahmad Shah Abdali as shocks, not a single cause",
          "Successor states: Awadh, Bengal, Hyderabad as Mughal provincial elites made sovereign",
          "Maratha confederacy, Sikh misls and Mysore under Haidar–Tipu as non-Mughal alternatives",
          "Why 'anarchy' is a Company-era story; the eighteenth century was a redistribution of power",
        ], "cards", ["eighteenth century India UPSC", "successor states"]),
        L("plassey-buxar-diwani", "Plassey, Buxar and the Company State", [
          "Plassey 1757 as a palace coup backed by the Company, not a national war",
          "Buxar 1764 and the Treaty of Allahabad: diwani of Bengal, Bihar and Orissa",
          "Dual government: nizamat left with the Nawab, revenue with the Company",
          "Why diwani without responsibility for order made the 1770 Bengal famine a political fact",
        ], "timeline", ["Battle of Plassey Buxar", "diwani Bengal"]),
        L("colonial-land-settlements", "Permanent Settlement, Ryotwari and Mahalwari", [
          "Cornwallis 1793: zamindar as proprietor, Company as rentier, peasant as tenant",
          "Ryotwari (Munro–Read) in Madras and Bombay: the state as landlord of the cultivator",
          "Mahalwari in the North-Western Provinces: village/mahal as the unit",
          "Commercialisation and the cash-revenue demand as the common pressure across all three",
        ], "compare", ["Permanent Settlement Ryotwari Mahalwari", "Cornwallis 1793"]),
        L("revolt-of-1857", "The Revolt of 1857: Causes, Spread and Aftermath", [
          "Greased cartridges as the spark; agrarian, sepoy-service and annexed-state grievances as the structure",
          "Centres: Delhi, Kanpur, Lucknow, Jhansi, Bareilly — and regions that did not rise",
          "Bahadur Shah as a symbolic head, not a commander of a national army",
          "Crown rule 1858, army reorganisation, and the end of the Doctrine of Lapse as lessons the Raj drew",
        ], "flow", ["Revolt of 1857 UPSC", "Government of India Act 1858"]),
        L("socio-religious-reform", "Nineteenth-Century Socio-Religious Reform", [
          "Rammohan Roy and Brahmo Samaj: sati, theistic monotheism and scripture used against custom",
          "Arya Samaj, Ramakrishna–Vivekananda, Aligarh and Deoband as different answers to colonial modernity",
          "Women: the 1856 widow remarriage law, age of consent, and the gap between statute and practice",
          "Why reform is not a single liberal wave: revival, purification and social boycott ran together",
        ], "cards", ["socio religious reform UPSC", "Brahmo Arya Aligarh"]),
        L("congress-moderates", "Early Congress and the Moderate Method", [
          "1885 foundation: Hume, the safety-valve debate, and what the first sessions actually demanded",
          "Constitutional agitation: petitions, the press, and the claim to speak for educated India",
          "Economic critique: drain theory (Naoroji) as a shared Moderate platform",
          "Why Moderates look timid only if the legal space of the 1880s–90s is forgotten",
        ], "timeline", ["Indian National Congress Moderates", "drain theory Naoroji"]),
        L("extremists-swadeshi", "Extremists, Swadeshi and the Split of 1907", [
          "Lal-Bal-Pal: Swadeshi and Boycott after the 1905 Partition of Bengal",
          "Methods: boycott of foreign cloth, national education, and the samitis",
          "Surat 1907: Moderates versus Extremists over the creed of the Congress",
          "Why Swadeshi was strongest in Bengal and why it did not become an all-India peasant war",
        ], "compare", ["Swadeshi movement UPSC", "Surat split 1907"]),
        L("home-rule-rowlatt", "Home Rule, Rowlatt and Jallianwala Bagh", [
          "Tilak and Annie Besant: Home Rule Leagues as a wartime constitutional demand",
          "Rowlatt Act 1919: detention without ordinary trial, and Gandhi's first all-India satyagraha",
          "Jallianwala Bagh 13 April 1919 and the Hunter Committee versus the Congress Punjab report",
          "Why 1919 is the hinge from Moderate petitioning to mass satyagraha",
        ], "timeline", ["Rowlatt Act Jallianwala Bagh", "Home Rule League"]),
        L("non-cooperation-khilafat", "Non-Cooperation and the Khilafat Alliance", [
          "1920 programme: titles, schools, courts, and boycott of the impending councils",
          "Khilafat as a Caliphate question tied to the Ottoman defeat, not as a separate Muslim party",
          "Chauri Chaura 1922 and Gandhi's withdrawal — discipline over momentum",
          "Why the alliance was conjunctural and did not dissolve communal politics",
        ], "flow", ["Non-Cooperation Movement", "Khilafat Chauri Chaura"]),
        L("civil-disobedience", "Civil Disobedience: Salt, the Pact and Aftermath", [
          "Dandi March 1930: salt as a tax the poor paid, chosen to be broken everywhere",
          "Gandhi–Irwin Pact 1931 and why Congress entered the Second Round Table",
          "Regional spread: North-West Frontier (Khan Abdul Ghaffar Khan), Tamil salt pans, forest satyagrahas",
          "Why Civil Disobedience was suspended and restarted — not a single continuous campaign",
        ], "flow", ["Civil Disobedience Salt March", "Gandhi Irwin Pact"]),
        L("quit-india-1942", "Quit India, 1942: A Leaderless Wartime Surge", [
          "8 August 1942 Bombay resolution and the immediate arrest of the working committee",
          "Parallel governments, underground radio and Do or Die as a leaderless surge",
          "Why the Communist Party stayed out after 1941 (People's War) and why that mattered later",
          "Cripps Mission's failure as the immediate political prelude, not a separate chapter",
        ], "cards", ["Quit India Movement 1942", "Cripps Mission"]),
        L("revolutionary-nationalism", "Revolutionary Nationalism: Bengal to HSRA", [
          "Anushilan, Yugantar and the Alipore case as the early Bengal strand",
          "Ghadar on the Pacific coast and the wartime attempt of 1915",
          "HSRA: Saunders, the Assembly bomb, and Bhagat Singh's turn to propaganda of the deed plus ideas",
          "Chittagong Armoury Raid (Surya Sen) and why revolutionaries never replaced mass movements as the main anti-Raj force",
        ], "timeline", ["revolutionary nationalism UPSC", "HSRA Bhagat Singh"]),
        L("ina-and-bose", "Subhas Chandra Bose, the INA and the Red Fort Trials", [
          "Bose's break with Gandhi-Congress, the Forward Bloc, and the escape to Germany then Japan",
          "INA: Mohan Singh's first army, then Bose's Azad Hind, and Imphal–Kohima as a military failure",
          "Red Fort trials and the 1946 naval ratings' revolt: why the Raj treated INA as a political problem",
          "Why INA is not who won independence and not a footnote either",
        ], "timeline", ["Indian National Army Bose", "INA trials Red Fort"]),
        L("councils-act-1909", "Indian Councils Act 1909: Separate Electorates", [
          "Morley–Minto: more non-officials and an elected element, with the executive still unaccountable",
          "Separate electorates for Muslims as the structural novelty, after the Simla Deputation and the League (1906)",
          "Why constitutional progress and communal constitutionalism arrived in the same Act",
          "What 1909 did not do: responsible government, a parliamentary cabinet, or adult franchise",
        ], "hierarchy", ["Morley Minto 1909", "separate electorates UPSC"]),
        L("goi-act-1919", "Government of India Act 1919: Dyarchy", [
          "Montagu's 1917 statement: responsible government as a goal, not a gift of 1919",
          "Dyarchy in the provinces: transferred versus reserved subjects",
          "Bicameralism at the centre, a Chamber of Princes, and the continued official bloc",
          "Why dyarchy trained ministers without giving them finance or law and order",
        ], "flow", ["Government of India Act 1919", "dyarchy UPSC"]),
        L("goi-act-1935", "Government of India Act 1935: Autonomy and a Federation that Never Was", [
          "Provincial autonomy and the end of dyarchy in the provinces",
          "All-India Federation of British provinces and princely states — why the princes never acceded",
          "Residual powers, the Governor's special responsibilities, and a federal court",
          "1937 elections: Congress ministries and the 1939 resignation over the war without consultation",
        ], "hierarchy", ["Government of India Act 1935", "provincial autonomy 1937"]),
        L("communal-award-poona-pact", "Communal Award and the Poona Pact", [
          "Ramsay MacDonald's 1932 Award: separate electorates extended to Depressed Classes",
          "Gandhi's fast and the Poona Pact: reserved seats in a joint electorate, not separate electorates",
          "Ambedkar's position: why he had asked for separate electorates and what he accepted",
          "Why this is a constitutional event, not only a social-reform story",
        ], "compare", ["Communal Award Poona Pact", "Ambedkar Gandhi 1932"]),
        L("partition-transfer-1947", "Partition and the Transfer of Power", [
          "Cabinet Mission 1946: three-tier, grouping, and why Congress and League read grouping differently",
          "Direct Action Day 1946, the interim government, and Mountbatten's 3 June plan",
          "Radcliffe Line as a hurried boundary, not a negotiated ethnographic map",
          "Indian Independence Act 1947: two dominions, lapse of paramountcy, and the violence that accompanied transfer",
        ], "timeline", ["Partition 1947 Cabinet Mission", "Indian Independence Act 1947"]),
      ]),
      topic("art-culture", "Art, Architecture and Performing Traditions", CULT, [
        L("nagara-temple-style", "Nagara Temple Style: Shikhara and the North Indian Plan", [
          "Square sanctum, curvilinear shikhara, and the absence of a dominating gateway gopuram",
          "Latina, phamsana and valabhi as roof types in the north",
          "Khajuraho (Chandela) and Konark (Eastern Ganga) as regional Nagara peaks",
          "Panchayatana and the distinction from Dravida — not a better or later style",
        ], "hierarchy", ["Nagara temple style UPSC", "shikhara Khajuraho"]),
        L("dravida-temple-style", "Dravida Temple Style: Vimana, Gopuram and the Tamil Country", [
          "Stepped pyramidal vimana over the garbhagriha, and the later rise of the gopuram",
          "Shore Temple and Brihadisvara as Pallava-to-Chola development",
          "Temple as a landed institution: donations recorded on walls",
          "Why a Dravida temple is a complex (prakara, mandapa, tank), not a single tower",
        ], "hierarchy", ["Dravida temple style UPSC", "vimana gopuram"]),
        L("vesara-temple-style", "Vesara: Chalukya–Hoysala Experiments in the Deccan", [
          "Vesara as a hybrid label: northern and southern elements in the Deccan, not a third pure order",
          "Badami Chalukya (Aihole, Pattadakal) as a laboratory of styles on one site",
          "Hoysala stellate plan and soapstone carving at Belur, Halebidu, Somanathapura",
          "Pattadakal as an ensemble where Nagara and Dravida sit side by side",
        ], "compare", ["Vesara temple style UPSC", "Pattadakal Hoysala"]),
        L("stupa-chaitya-vihara", "Stupas, Chaityas and Viharas", [
          "Sanchi: torana reliefs, harmika, chhatra and the vedika vocabulary",
          "Chaitya hall (Karla, Ajanta) versus vihara as monastery",
          "Ashokan pillars and the lion capital as imperial Buddhist visual language",
          "Why a stupa is a reliquary mound, not a temple in the Nagara sense",
        ], "hierarchy", ["Sanchi stupa UPSC", "chaitya vihara"]),
        L("mural-painting", "Mural Painting: Ajanta, Ellora and Later Walls", [
          "Ajanta: jataka narratives, the usual fresco-secco description, and Vakataka patronage",
          "Ellora's painted and sculpted mix across Buddhist, Hindu and Jain caves",
          "Later murals: Badami, Sittanavasal, Lepakshi — a chain, not a one-site wonder",
          "What a mural can tell you that a shastra cannot: costume, trade, court and forest",
        ], "cards", ["Ajanta murals UPSC", "Ellora caves painting"]),
        L("miniature-painting-schools", "Miniature Schools: Mughal, Rajasthani and Pahari", [
          "Mughal atelier: Persian draftsmanship, naturalistic portrait, and Akbar–Jahangir patronage",
          "Rajasthani (Mewar, Marwar, Kishangarh, Bundi-Kota) as courtly and Krishna-lila idioms",
          "Pahari (Basohli, Kangra) and the Gita Govinda as a hill-court corpus",
          "Company painting as a colonial market style, not a school of resistance",
        ], "compare", ["Mughal miniature UPSC", "Rajasthani Pahari painting"]),
        L("classical-dance", "Classical Dance: Natyashastra to Recognised Forms", [
          "Natyashastra: nritta, nritya, natya and abhinaya as the shared grammar",
          "Forms the Sangeet Natak Akademi treats as classical: Bharatanatyam, Kathak, Kathakali, Kuchipudi, Odissi, Manipuri, Mohiniyattam, Sattriya",
          "Temple, court and modern stage as three patronage settings",
          "Why classical versus folk is an institutional line, not a value ranking",
        ], "cards", ["classical dance India UPSC", "Natyashastra Sangeet Natak"]),
        L("hindustani-carnatic", "Hindustani and Carnatic Music: Two Classical Systems", [
          "Raga and tala as shared ideas with different raga-ragini and kriti/alapana practice",
          "Hindustani gharanas versus Carnatic bani; the Trinity (Tyagaraja, Muthuswami Dikshitar, Syama Sastri)",
          "Dhrupad, khayal, thumri as Hindustani genres; kriti and varnam as Carnatic compositional core",
          "Bhakti and court patronage as historical engines, not a simple folk-versus-elite split",
        ], "compare", ["Hindustani Carnatic UPSC", "raga tala gharana"]),
        L("colonial-indo-saracenic", "Colonial and Indo-Saracenic Architecture", [
          "Indo-Saracenic: Mughal-Gothic mash at public buildings (Madras High Court, Victoria Terminus/CSTM)",
          "Lutyens–Baker New Delhi: axis, bungalow, and the Capitol complex as imperial urbanism",
          "Utility architecture: railways, cantonments, hill stations",
          "Why colonial architecture is several registers, not one mosque-with-a-clock-tower",
        ], "cards", ["Indo-Saracenic architecture UPSC", "Lutyens Delhi"]),
        L("rock-cut-architecture", "Rock-Cut Architecture from Barabar to Ellora", [
          "Barabar (Mauryan) as the earliest surviving rock-cut caves in India",
          "Buddhist chaitya-vihara sequence: Ajanta, Karla, Bhaja",
          "Hindu and Jain: Elephanta, Ellora Kailasa (monolithic excavation), Udayagiri-Khandagiri",
          "Rock-cut is a technique, not a religion: the same hill can host more than one community",
        ], "timeline", ["rock-cut architecture UPSC", "Ellora Kailasa"]),
      ]),
      topic("post-independence", "Post-Independence Consolidation", POST, [
        L("princely-state-integration", "Integration of the Princely States", [
          "Instrument of Accession: defence, external affairs and communications as the three surrendered subjects",
          "States Department under Patel and V.P. Menon: persuasion, a privy-purse promise, and the threat of isolation",
          "Why internally sovereign princely states could not sit inside one territorial republic",
          "Standstill agreements as a stopgap, not a third path between accession and independence",
        ], "flow", ["princely states integration", "Instrument of Accession"]),
        L("junagadh-hyderabad-kashmir", "Junagadh, Hyderabad and Jammu & Kashmir", [
          "Junagadh: Muslim ruler, Hindu-majority population, accession to Pakistan, then Indian intervention and a plebiscite",
          "Hyderabad: Nizam, Razakars, and Police Action (Operation Polo) 1948",
          "J&K: Instrument of Accession October 1947 after the tribal invasion, and why this case did not close like the other two",
          "Three different legal-political problems, not one stubborn-prince story",
        ], "compare", ["Junagadh Hyderabad Kashmir", "Operation Polo"]),
        L("states-reorganisation-1956", "States Reorganisation, 1956", [
          "Dhar Commission (administrative units) versus the JVP Committee (no immediate linguistic redrawing)",
          "Fazl Ali Commission: language as a principal but not exclusive factor",
          "States Reorganisation Act 1956 as that year's settlement of boundaries",
          "Andhra 1953 after Potti Sriramulu as the precedent that made 1956 unavoidable",
        ], "timeline", ["States Reorganisation Act 1956", "Fazl Ali Commission"]),
        L("later-linguistic-states", "After 1956: Bombay, Punjab and the North-East", [
          "Bombay State split 1960: Maharashtra and Gujarat after the Samyukta Maharashtra movement",
          "Punjab 1966: Punjabi Suba, Haryana, and the hill areas to Himachal",
          "Nagaland 1963, then later North-Eastern states under the 1971 reorganisation",
          "Article 3: Parliament may form new states — linguistic reorganisation is a process, not a one-time 1956 event",
        ], "timeline", ["States Reorganisation after 1956", "Punjabi Suba"]),
        L("land-reforms", "Land Reforms: Zamindari Abolition to Ceilings", [
          "Abolition of intermediaries as the first generation: zamindari, jagirdari, inamdari",
          "Tenancy regulation and occupancy rights — why implementation varied by state",
          "Land ceilings and benami evasion as the weak third generation",
          "Bhoodan as a voluntary counterpart, not a substitute for statute",
        ], "flow", ["land reforms India UPSC", "zamindari abolition"]),
        L("planning-commission-era", "The Planning Commission Era", [
          "1950 Planning Commission: Nehru–Mahalanobis heavy-industry bias in the Second Plan",
          "Community Development and the contradiction between industrial targets and agrarian reality",
          "Plan holiday after 1966 and why drought and wars interrupted the sequence",
          "Why planned economy here means a mixed economy with licensing, not a Soviet replica",
        ], "timeline", ["Planning Commission Five Year Plans", "Mahalanobis Second Plan"]),
        L("emergency-1975-77", "The Emergency, 1975–77, as a Political Event", [
          "25 June 1975: Article 352, the Allahabad judgment on Indira Gandhi's election, and the JP movement as the cluster",
          "42nd Amendment as the constitutional payload: Directive Principles' primacy, curtailed judicial review, extended term",
          "Press censorship, MISA, and the 1977 election that undid it",
          "44th Amendment as the later lock on repeating the same emergency design",
        ], "timeline", ["Emergency 1975 UPSC", "42nd Amendment"]),
        L("partition-rehabilitation", "Rehabilitation after Partition", [
          "Refugee movement across Punjab and Bengal as two different scales and speeds",
          "Evacuee property and the state's role in allotment, not a market clearing",
          "The Constituent Assembly sitting through 1947–49 while the territory was still being settled",
          "Why rehabilitation is part of consolidation, not a footnote to 15 August",
        ], "cards", ["Partition rehabilitation UPSC", "evacuee property"]),
      ]),
    ],
  },
];
