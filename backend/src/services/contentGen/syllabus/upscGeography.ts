import { L, topic, type SyllabusSubject } from "./syllabusTypes.js";

const SRC = [
  "https://mausam.imd.gov.in/",
  "https://ncert.nic.in/textbook.php",
];

const PHY = "Salient features of world's physical geography.";
const IND =
  "Indian and World Geography - Physical, Social, Economic Geography of India and the World. Important Geophysical phenomena such as earthquakes, Tsunami, Volcanic activity, cyclone etc.";
const RES =
  "Distribution of key natural resources across the world (including South Asia and the Indian sub-continent); factors responsible for the location of primary, secondary, and tertiary sector industries in various parts of the world (including India).";

export const UPSC_GEOGRAPHY_CORPUS: SyllabusSubject[] = [
  {
    slug: "upsc-geography",
    name: "Geography",
    description:
      "GS Paper I geography at topic granularity: one page per concept the exam actually tests.",
    paper: "GS Paper I",
    sources: SRC,
    topics: [
      topic("physical", "World Physical Geography", PHY, [
        L("earth-interior", "Interior of the Earth and Seismic Waves", [
          "Crust, mantle, outer and inner core as inferred layers, not as directly sampled below the crust",
          "P-waves travel through solids and liquids; S-waves drop in the outer core — the main evidence for a liquid outer core",
          "Shadow zones as geometry, not as places with no earthquakes",
          "Mohorovicic discontinuity as crust–mantle, Gutenberg as mantle–core",
        ], "hierarchy", ["earth interior UPSC", "P waves S waves"]),
        L("plate-tectonics", "Plate Tectonics: From Drift to a Mechanism", [
          "Wegener's continental drift: fit, fossils, glacial till — and why it lacked a driving mechanism",
          "Lithospheric plates move on the asthenosphere; boundaries: divergent, convergent, transform",
          "Indian plate's northward collision with Eurasia as the Himalayan story",
          "Hotspots (Hawaii) as intra-plate volcanism that plate interiors must still explain",
        ], "flow", ["plate tectonics UPSC", "continental drift Wegener"]),
        L("geomorphic-landforms", "Landforms: Fluvial, Glacial, Aeolian, Karst and Coastal", [
          "Fluvial: potholes, ox-bow, floodplain, delta; the youthful–mature–old sketch as a teaching device, not a law",
          "Glacial: cirque, horn, U-valley, moraine; aeolian: yardang, dune, loess",
          "Karst: limestone solution — sinkhole, cave, stalactite",
          "Coastal: cliff, stack, beach, spit; why west and east Indian coasts do not yield the same suite",
        ], "cards", ["geomorphic landforms UPSC", "fluvial glacial karst"]),
        L("atmosphere-structure", "Atmosphere: Composition, Layers and the Heat Budget", [
          "Troposphere to exosphere: temperature trend with height in each layer",
          "Insolation, albedo, terrestrial radiation and the greenhouse effect as a budget, not a slogan",
          "Why the troposphere holds weather: lapse rate and water vapour concentrated here",
          "Stratospheric ozone as a UV filter, distinct from tropospheric ozone as a pollutant",
        ], "hierarchy", ["structure of atmosphere UPSC", "heat budget albedo"]),
        L("pressure-belts-winds", "Pressure Belts, Planetary Winds and Coriolis", [
          "Equatorial low, subtropical high, subpolar low, polar high as a schematic, shifted seasonally",
          "Trade winds, westerlies and polar easterlies as the surface wind response",
          "Coriolis deflection and why it is zero at the equator",
          "Land–sea breeze and monsoon as interruptions of the planetary pattern, not replacements for it",
        ], "cycle", ["pressure belts UPSC", "planetary winds Coriolis"]),
        L("jet-streams-tricellular", "Tri-cellular Circulation and Jet Streams", [
          "Hadley, Ferrel and Polar cells as a meridional engine",
          "Subtropical and polar-front jets as upper-level westerlies",
          "Polar-front jet meander (Rossby) and temperate cyclone formation",
          "Tibetan easterly jet and the tropical easterly jet as monsoon-season features over India",
        ], "flow", ["jet stream UPSC", "Hadley Ferrel Polar cell"]),
        L("tropical-cyclones", "Tropical Cyclones: Formation, Structure and Tracks", [
          "Warm ocean, Coriolis, low shear and a pre-existing disturbance as the formation checklist",
          "Eye, eyewall, spiral bands; energy from latent heat, not from a vacuum",
          "Bay of Bengal versus Arabian Sea: why the Bay dominates Indian landfall climatology",
          "Naming and IMD's intensity scale as operational, not as a physical law",
        ], "flow", ["tropical cyclone UPSC", "Bay of Bengal cyclone"]),
        L("ocean-currents", "Ocean Currents: Warm, Cold and the Gyres", [
          "Wind-driven gyres: Gulf Stream, Kuroshio, Canary, California as type cases",
          "Humboldt and Benguela as cold eastern-boundary currents and the aridity onshore",
          "Indian Ocean: monsoon reversal of the Somali current, unlike a stable North Atlantic gyre",
          "Why currents move heat and fisheries, and why a map of arrows is not a climate forecast",
        ], "cycle", ["ocean currents UPSC", "Somali current monsoon"]),
        L("tides-and-waves", "Tides, Waves and Lunar–Solar Forcing", [
          "Spring and neap from sun–moon alignment; semi-diurnal as the common Indian pattern",
          "Why tidal range is a local coastal geometry, not a world constant",
          "Waves: wind sea versus swell; tsunamis are not wind waves",
          "Tidal energy as a site-specific resource (funnel-shaped estuaries), not a national substitute for coal",
        ], "cycle", ["tides spring neap UPSC", "semi-diurnal tide India"]),
        L("rock-cycle", "Rocks and the Rock Cycle", [
          "Igneous, sedimentary, metamorphic as origin classes, not as hardness ranks",
          "Rock cycle: melting, weathering, lithification, metamorphism as transfers, not a one-way ladder",
          "Indian examples: Deccan basalt, Gondwana coal measures, khondalite — named, not counted",
          "Why a mineral is not a rock, and why coal is a rock but not a mineral in the strict sense",
        ], "cycle", ["rock cycle UPSC", "igneous sedimentary metamorphic"]),
        L("enso-and-iod", "El Nino, La Nina and the Indian Ocean Dipole", [
          "Walker circulation and its Pacific reversal as El Nino; the opposite as La Nina",
          "Why an El Nino year is a raised drought risk for the Indian monsoon, not a guarantee of failure",
          "IOD: western versus eastern Indian Ocean SST dipole, and why it can offset or reinforce ENSO",
          "Teleconnection as a statistical tendency, not a switch",
        ], "compare", ["El Nino Indian monsoon", "Indian Ocean Dipole"]),
        L("earthquakes-volcanoes", "Earthquakes, Volcanoes and the Global Pattern", [
          "Focus, epicentre, magnitude versus intensity",
          "Ring of Fire and mid-ocean ridges as plate-boundary volcanism",
          "Tsunami: vertical seafloor displacement, not every undersea earthquake",
          "Why India's west coast is not a high-tsunami coast in the same way as the Andaman arc",
        ], "cards", ["earthquake volcano tsunami UPSC", "Ring of Fire"]),
      ]),
      topic("indian-climate-drainage", "Indian Climate, Drainage and Disasters", IND, [
        L("monsoon-mechanism", "Mechanism of the Indian Monsoon", [
          "Differential heating of land and the Indian Ocean as the seasonal pressure reversal",
          "ITCZ / monsoon trough shift, Tibetan Plateau heating, and the Somali jet as the dynamic package",
          "Tropical easterly jet and the Mascarene high as Southern Hemisphere anchors",
          "Breaks and active spells as the trough shifting, not as monsoon failure in every dry week",
        ], "flow", ["Indian monsoon mechanism UPSC", "ITCZ monsoon trough"]),
        L("indian-seasons", "Seasons of India: Hot Weather to Retreating Monsoon", [
          "Hot weather: western disturbances fading, loo, pre-monsoon thunderstorms (Kal Baisakhi, mango showers, blossom showers)",
          "Southwest monsoon as the rain-bearing season for most of the country",
          "Retreating monsoon: October heat, and Tamil Nadu's north-east monsoon rain",
          "Cold weather: western disturbances as winter rain in the north-west",
        ], "timeline", ["seasons of India UPSC", "retreating monsoon Tamil Nadu"]),
        L("himalayan-peninsular-drainage", "Himalayan versus Peninsular Drainage", [
          "Himalayan rivers: snow-and-rain fed, antecedent (Indus, Brahmaputra, Sutlej), long courses, high sediment",
          "Peninsular: rain-fed, superimposed/relic, graded profiles, east-flowing deltas versus west-flowing Narmada–Tapi rifts",
          "Ganga system versus Godavari–Krishna–Cauvery as two templates of use and flood",
          "Why Himalayan rivers can be perennial without being unlimited water",
        ], "compare", ["Himalayan vs peninsular drainage", "antecedent rivers India"]),
        L("soils-of-india", "Soils of India: Origin, Order and Constraint", [
          "Alluvial, black (regur), red, laterite, arid, forest/mountain, saline-alkaline as the NCERT working set",
          "Black soil and cotton; laterite and leaching under high rainfall; alluvial and the canal belts",
          "Soil degradation: erosion, salinity, waterlogging as geography, not only agronomy",
          "Why a soil map is not a crop map — irrigation and price can override",
        ], "cards", ["soils of India UPSC", "black soil laterite alluvial"]),
        L("natural-vegetation-india", "Natural Vegetation and Forest Types of India", [
          "Champion–Seth as the working classification: tropical wet evergreen through alpine",
          "Rainfall and temperature as first-order controls; soil and biotic pressure as modifiers",
          "Mangrove (Sundarbans, Bhitarkanika, Pichavaram) as a tidal forest, not a rainfall forest",
          "Forest cover as an FSI category is not the same thing as natural vegetation still in place",
        ], "hierarchy", ["natural vegetation India UPSC", "Champion Seth forest"]),
        L("physiographic-divisions", "Physiographic Divisions of India", [
          "Himalayas, Northern Plains, Peninsular Plateau, Indian Desert, Coastal Plains, Islands as the standard six",
          "Himalaya: Himadri, Himachal, Shiwalik, and the syntaxial bends",
          "Peninsular plateau: Deccan, Central Highlands, Malwa, Chotanagpur — distinct mineral and drainage roles",
          "Why the Thar is a rain-shadow and monsoon-margin desert, not a trade-wind Sahara analogue",
        ], "hierarchy", ["physiographic divisions India", "Himalaya Peninsular Plateau"]),
        L("climatic-regions-india", "Climatic Regions of India", [
          "Koppen applied to India: Am, Aw, BSh, BWh, Cwg and highland types as a map, not a list of area shares",
          "Why the same latitude is not the same climate: monsoon and relief override",
          "Western coast versus Tamil Nadu versus interior rain-shadow (Vidarbha, Rayalaseema)",
          "Climate region as a teaching map; IMD operational forecasts use a different subdivision",
        ], "cards", ["Koppen India UPSC", "climatic regions of India"]),
        L("western-disturbances", "Western Disturbances and Extra-Tropical Weather over India", [
          "Origin: Mediterranean / West Asian extra-tropical cyclones steered by the westerly jet",
          "Winter rain and snow in the north-west; why this moisture matters for rabi wheat",
          "Induced hail, cold waves and fog in the plains",
          "Not a monsoon system: different season, different jet, different moisture source",
        ], "flow", ["western disturbances UPSC", "westerly jet winter rain"]),
        L("cyclones-indian-coasts", "Cyclones on the Indian Coasts", [
          "Bay of Bengal: recurving tracks, high storm surge on a shallow, densely settled deltaic coast",
          "Arabian Sea: fewer landfalls, but a post-monsoon season that still matters for Gujarat–Maharashtra",
          "Storm surge versus heavy rain versus wind as three different damage mechanisms",
          "IMD cyclone warnings as a lead-time system, not as prevention of formation",
        ], "compare", ["cyclones India UPSC", "storm surge Bay of Bengal"]),
        L("floods-and-droughts", "Floods and Droughts as Indian Hydro-Climate", [
          "Flood: Himalayan sediment, encroached floodplains, and synchronised tributary peaks",
          "Drought: meteorological, hydrological and agricultural as nested, not identical",
          "Why a normal all-India monsoon can still leave a meteorological subdivision in deficit",
          "Reservoirs and embankments as double-edged: peak-cutting versus a false sense of a tamed river",
        ], "compare", ["floods droughts India UPSC", "monsoon deficit subdivision"]),
        L("landslides-glof", "Landslides, Cloudbursts and Glacial Lake Outburst Floods", [
          "Western Himalaya and the Western Ghats as two landslide provinces with different triggers",
          "Cloudburst: intense convective rain on steep catchments, not a synonym for every flood",
          "GLOF: moraine-dammed lakes and why warming is a trend risk without quoting a lake count",
          "Road cuts, hydropower and deforestation as anthropogenic loaders on a seismic, steep landscape",
        ], "cards", ["landslides Himalaya UPSC", "GLOF cloudburst"]),
        L("seismic-zoning-india", "Seismic Zoning and Tsunamis in the Indian Context", [
          "Himalayan collision belt versus the peninsula: intra-plate shocks (Latur, Bhuj) still happen",
          "BIS seismic zones as a building-code map, not a prediction of the next epicentre",
          "2004 Indian Ocean tsunami: Sumatra megathrust, and the Andaman–Nicobar / Tamil Nadu hit",
          "Why tsunami warning is a basin-scale instrumentation problem, not a district rain-gauge problem",
        ], "hierarchy", ["seismic zones India UPSC", "2004 tsunami India"]),
      ]),
      topic("resources-agri-industry", "Resources, Agriculture and Industry", RES, [
        L("mineral-belts-india", "Mineral Belts of India", [
          "Chotanagpur, Odisha–Chhattisgarh, and the Dharwar belts as the iron–manganese–bauxite spine",
          "Copper (Khetri, Malanjkhand, Singhbhum), mica (Kodarma belt), gold (Kolar as a historic field)",
          "Why distribution is geological, while production is a policy and infrastructure overlay",
          "Critical minerals as a new locational question (beach sands, lithium prospects) without treating newspaper figures as syllabus facts",
        ], "cards", ["mineral belts India UPSC", "Chotanagpur iron ore"]),
        L("coal-petroleum-gas", "Coal, Petroleum and Natural Gas in India", [
          "Gondwana coalfields (Damodar, Son, Mahanadi, Godavari, Wardha) versus tertiary coal of the North-East",
          "Petroleum: Mumbai High, Cambay, Assam, KG basin as producing provinces",
          "Why coal is inland and thermal plants followed the coal, while oil refining also follows the coast and the pipeline",
          "Coking versus thermal coal as a location factor for steel, not a trivia percentage",
        ], "hierarchy", ["coalfields India UPSC", "Mumbai High KG basin"]),
        L("energy-geography", "Energy Geography: Thermal, Hydro, Nuclear and Renewables", [
          "Thermal clustered on coal belts and pit-head plants; hydro on Himalayan and peninsular fall",
          "Nuclear: raw-material versus coastal cooling and exclusion zones as location logic",
          "Solar in the north-west arid belt and wind in southern/western coasts and passes — potential is not generation",
          "Why a capacity mix in GW is not the same as a generation mix in GWh",
        ], "compare", ["energy resources India geography", "pit-head thermal plants"]),
        L("cropping-patterns", "Cropping Patterns and Agricultural Regions", [
          "Kharif, rabi and zaid as rainfall-and-temperature seasons, not as crop lists",
          "Rice–wheat in the irrigated north-west; rice in the deltas and coastal plains; millets in the rainfed interior",
          "Intensity: single, double, triple cropping as a function of water and frost-free days",
          "Why MSP-plus-procurement can freeze a pattern that climate and soil would otherwise shift",
        ], "cards", ["cropping patterns India UPSC", "kharif rabi zaid"]),
        L("green-revolution-irrigation", "Green Revolution as a Geography of Irrigation", [
          "HYV wheat–rice succeeded where controlled irrigation, canals and tube-wells already existed — Punjab, Haryana, western UP",
          "Bhakra–Nangal and the canal commands as the hydraulic skeleton, not a miracle-seed story alone",
          "Groundwater: the same tube-well that made the revolution now defines its water constraint",
          "Spatial unevenness: why eastern India and the rainfed peninsula did not copy the north-west package on the same timetable",
        ], "flow", ["Green Revolution irrigation UPSC", "Bhakra Nangal canal"]),
        L("industrial-location-factors", "Industrial Location: Factors and Classical Models", [
          "Weber: transport of raw material versus product; weight-losing versus weight-gaining",
          "Footloose industries and agglomeration as limits to a pure least-cost map",
          "Von Thunen as an agricultural-location sketch: distance to market under a simplifying plain",
          "In India: coal–iron for steel, humidity-plus-ports for early textiles, perishable cane for sugar",
        ], "compare", ["industrial location Weber UPSC", "weight losing industry"]),
        L("iron-steel-location", "Iron and Steel: Why the Eastern Belt", [
          "Coal, iron ore, limestone and water within a short haul: Jamshedpur, Rourkela, Bhilai, Durgapur as an eastern cluster",
          "Coastal plants (Visakhapatnam, later import-based plants) as a different logic — imported coking coal and export",
          "Why steel is not footloose: bulk, energy and sunk plant",
          "Mini-steel and sponge iron as a dispersed overlay, not a replacement of the integrated belt",
        ], "hierarchy", ["iron steel industry India location", "Jamshedpur Bhilai Rourkela"]),
        L("cotton-textile-sugar", "Cotton Textile and Sugar: Two Agro-Industrial Maps", [
          "Cotton textile: Mumbai–Ahmedabad as early humidity-plus-port-plus-capital; then dispersal to Coimbatore, Indore, Kanpur",
          "Why textiles can leave the cotton tract once raw cotton is rail-movable, unlike sugar",
          "Sugar: cane's weight and perishability pin mills to the western Maharashtra–UP belt",
          "Cooperative sugar in Maharashtra as an institutional location factor, not a climate factor",
        ], "compare", ["cotton textile location India", "sugar industry Maharashtra UP"]),
        L("water-resources-basins", "Water Resources and River Basin Geography", [
          "Himalayan versus peninsular yield: snow storage versus monsoon flash",
          "Inter-state basins and why river-water disputes are geographic before they are legal",
          "Groundwater: alluvial aquifers versus hard-rock peninsula, and recharge versus extraction",
          "Multipurpose projects as flood–irrigation–power packages with a downstream and a displacement cost",
        ], "flow", ["water resources India UPSC", "river basin groundwater"]),
        L("population-distribution", "Population Distribution and Density", [
          "High density: Ganga plain, coastal Kerala–Bengal; low density: Thar, Himalaya, interior Bastar–Arunachal",
          "Physical controls (water, terrain, climate) versus socio-economic (irrigation, industry, partition-era settlement)",
          "Census concepts: density, urban, literacy as measurement — no single year's headcount is the point of the page",
          "Why a density map is not a carrying-capacity map",
        ], "cards", ["population distribution India UPSC", "density Ganga plain"]),
        L("urbanisation-settlements", "Urbanisation and Settlement Geography of India", [
          "Urban as a Census category (statutory plus census towns) — the count of towns is a definition, not a boom by itself",
          "Million-plus agglomerations on the ports, the northern rail-Ganga corridor, and southern industrial cities",
          "Urban morphology: old core, civil lines, cantonment, planned extension, and the census-town fringe",
          "Functional types: mining, industrial, cantonment, pilgrimage, port — a town is not only a primate-city story",
        ], "hierarchy", ["urbanisation India UPSC", "census towns"]),
        L("industrial-corridors-ports", "Industrial Corridors, Ports and the Coastal Turn", [
          "DMIC and successor corridors as a locational bet on the Delhi–Mumbai axis of ports, power and urban demand",
          "Major ports versus minor ports; west-coast versus east-coast hinterlands",
          "SEZs as a policy overlay on geography, not a natural resource",
          "Why logistics cost and turnaround can relocate an industry that Weber would have left at the mine",
        ], "flow", ["industrial corridors India UPSC", "DMIC ports"]),
      ]),
    ],
  },
];
