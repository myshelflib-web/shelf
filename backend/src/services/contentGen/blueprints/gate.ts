import type { StarterSubject } from "../types.js";

const NPTEL = "https://nptel.ac.in/";
const IITM = "https://www.iitm.ac.in/";

export const GATE_MATHEMATICS: StarterSubject = {
  slug: "gate-engineering-mathematics",
  name: "Engineering Mathematics",
  description:
    "Linear algebra, calculus, differential equations, probability and numerical methods as they are actually tested in GATE.",
  paper: "Common to all papers",
  topics: [
    {
      slug: "linear-algebra",
      title: "Linear Algebra",
      articles: [
        {
          slug: "matrix-rank-and-consistency-of-linear-systems",
          title: "Matrix Rank and the Consistency of AX = B",
          syllabusAnchor:
            "GATE Engineering Mathematics — Linear Algebra: matrix algebra, systems of linear equations, rank and determinants.",
          mustCover: [
            "Matrix operations and when each is defined; why multiplication is associative but not commutative, checked by writing the orders out",
            "Elementary row operations and reduction to row echelon form, with rank read off as the number of non-zero rows",
            "The consistency rule: a unique solution when rank(A) = rank([A|B]) = n, infinitely many when both equal r < n, and no solution when the two ranks differ",
            "Homogeneous systems AX = 0 are always consistent, and the number of independent solutions equals n minus rank",
            "Determinant properties: a row swap flips the sign, a common factor pulls out of one row, det(AB) = det(A)det(B), det(A transpose) = det(A), and a zero determinant means singular",
            "Inverse by the adjoint route and by Gauss-Jordan, and why it exists only for a non-singular square matrix",
            "Every symbol defined with its size: A is m by n, X is n by 1, B is m by 1, n is the number of unknowns and r the rank — all are counts, so these quantities are dimensionless",
            "Cramer's rule stated, and why row reduction is faster in the exam for 3 by 3 systems and larger",
          ],
          worked: [
            "Solve a 3 by 3 system by row reduction, read rank(A) and rank([A|B]) off the echelon form, and state from that comparison whether the solution is unique, infinite or non-existent",
            "Find the parameter value for which a given 3 by 3 system has infinitely many solutions, by forcing the determinant to zero and then checking consistency of the augmented matrix",
          ],
          traps: [
            "Concluding 'no solution' from det(A) = 0 alone — a singular system may still have infinitely many solutions",
            "Reporting the rank as the number of free variables instead of n minus rank",
            "Mixing column operations into a rank computation and then misreading which variables are free",
          ],
          officialSources: [NPTEL, IITM],
          diagram: "flow",
          keywords: [
            "matrix rank GATE",
            "consistency of linear equations",
            "rank of augmented matrix",
            "row echelon form method",
          ],
          order: 0,
        },
        {
          slug: "eigenvalues-cayley-hamilton-and-diagonalisation",
          title: "Eigenvalues, Cayley-Hamilton and Diagonalisation",
          syllabusAnchor:
            "GATE Engineering Mathematics — Linear Algebra: eigenvalues and eigenvectors, Cayley-Hamilton theorem, diagonalisation.",
          mustCover: [
            "The eigenvalue problem AX = (lambda)X, and why demanding a non-trivial X forces the characteristic equation det(A - lambda*I) = 0",
            "Why the sum of eigenvalues equals the trace and the product equals the determinant, and how that pair of checks recovers a missing eigenvalue without expanding the polynomial",
            "Eigenvalues of A transpose, A raised to k, A inverse, kA and A + kI written directly in terms of the eigenvalues of A",
            "Algebraic multiplicity versus geometric multiplicity, the latter equal to n minus rank(A - lambda*I)",
            "Cayley-Hamilton theorem: a square matrix satisfies its own characteristic equation, used both to obtain A inverse and to reduce high powers of A",
            "Diagonalisation A = P D P inverse, and the exact condition that A must have n linearly independent eigenvectors",
            "Real symmetric matrices have real eigenvalues, mutually orthogonal eigenvectors for distinct eigenvalues, and are always diagonalisable; real skew-symmetric matrices have purely imaginary or zero eigenvalues, and orthogonal matrices have eigenvalues of unit modulus",
            "Symbols defined: lambda is a scalar and dimensionless, X is a non-zero n by 1 column vector, I is the n by n identity",
          ],
          worked: [
            "Find all eigenvalues and eigenvectors of a 3 by 3 matrix, verify them against the trace and determinant checks, then apply Cayley-Hamilton to compute A inverse",
          ],
          traps: [
            "Accepting X = 0 as an eigenvector",
            "Assuming a repeated eigenvalue always blocks diagonalisation — it blocks it only when geometric multiplicity falls below algebraic multiplicity",
          ],
          officialSources: [NPTEL, IITM],
          diagram: "compare",
          keywords: [
            "eigenvalues and eigenvectors GATE",
            "Cayley Hamilton theorem",
            "diagonalisation of a matrix",
            "trace determinant eigenvalue shortcut",
          ],
          order: 1,
        },
      ],
    },
    {
      slug: "calculus-and-differential-equations",
      title: "Calculus & Differential Equations",
      articles: [
        {
          slug: "calculus-limits-extrema-and-integration",
          title: "Calculus: Limits, Extrema, Partial Derivatives and Integrals",
          syllabusAnchor:
            "GATE Engineering Mathematics — Calculus: limits, continuity and differentiability, maxima and minima, partial derivatives, total derivative, double and triple integrals.",
          mustCover: [
            "A limit exists only when the left-hand and right-hand limits agree; continuity additionally requires them to equal the function value at the point",
            "Differentiability implies continuity but not the converse, with the absolute value function at the origin as the standard counterexample",
            "Indeterminate forms, the conditions under which L'Hopital's rule may be applied, and Taylor or Maclaurin expansion as the faster route to many limits",
            "Rolle's theorem and Lagrange's mean value theorem: the exact hypotheses of each and what each says geometrically",
            "Stationary points from the first derivative, the second derivative test and its inconclusive case, and the comparison against endpoint values needed for a global extremum on a closed interval",
            "Partial derivatives with the other variables held fixed, equality of mixed partials when the second derivatives are continuous, and the total derivative and chain rule for z = f(x, y) with x and y both functions of t",
            "Two-variable extrema: stationary points from both first partials, the discriminant test built from the second partials, and Lagrange multipliers for a constrained extremum",
            "Double and triple integrals — sketch the region before writing any limit, change the order of integration when it makes the inner integral tractable, and carry the Jacobian, which is the factor r in a polar conversion",
            "Define symbols with units in applied problems: a length variable in metres gives an area objective in square metres, and a density in kilograms per cubic metre integrated over cubic metres returns kilograms",
          ],
          worked: [
            "Maximise the volume of an open box cut from a sheet of stated dimensions: set up the objective, apply the first and second derivative tests, and report the answer with units",
            "Evaluate a double integral by reversing the order of integration — sketch the region, write both sets of limits explicitly, and confirm the two orders give the same value",
          ],
          traps: [
            "Applying L'Hopital's rule to a form that is not actually indeterminate",
            "Swapping the order of integration without redrawing the region, so the new limits describe a different area",
            "Using the single-variable second derivative test on a two-variable stationary point, or dropping the Jacobian factor r in polar coordinates",
          ],
          officialSources: [NPTEL, IITM],
          diagram: "flow",
          keywords: [
            "maxima and minima GATE",
            "double integral change of order",
            "partial derivatives chain rule",
            "GATE calculus engineering mathematics",
          ],
          order: 0,
        },
        {
          slug: "ordinary-differential-equations",
          title: "Ordinary Differential Equations: First and Second Order",
          syllabusAnchor:
            "GATE Engineering Mathematics — Differential Equations: first order equations, linear ODEs with constant coefficients, initial and boundary value problems.",
          mustCover: [
            "Order, degree and linearity of a differential equation, and why that classification decides which method applies",
            "Variable separable form, and the homogeneous case cleared by the substitution y = vx, always retaining the arbitrary constant",
            "Linear first order form solved with the integrating factor taken as the exponential of the integral of the coefficient of y",
            "Exact equations: the test comparing the two cross partial derivatives, and the solution procedure once the test passes",
            "Second order constant coefficient equations: the auxiliary equation and the complementary function for each of the three root cases — real distinct, real repeated, complex conjugate",
            "Particular integral for exponential, sinusoidal and polynomial forcing, and the failure case where the forcing duplicates a root of the auxiliary equation",
            "General solution as complementary function plus particular integral, with initial or boundary conditions fixing the constants; in an applied RL circuit or spring-mass-damper problem, state the units of every coefficient so the time constant comes out in seconds",
          ],
          worked: [
            "Solve a second order constant coefficient ODE with a stated forcing term: find the complementary function and the particular integral, then apply two initial conditions to determine both constants",
          ],
          traps: [
            "Losing the constant of integration and reporting a particular solution as the general one",
            "Using the standard particular integral form when the forcing duplicates a complementary function term, instead of multiplying by the independent variable",
          ],
          officialSources: [NPTEL, IITM],
          diagram: "hierarchy",
          keywords: [
            "first order differential equations GATE",
            "integrating factor method",
            "complementary function particular integral",
            "second order linear ODE",
          ],
          order: 1,
        },
      ],
    },
    {
      slug: "probability-and-numerical-methods",
      title: "Probability & Numerical Methods",
      articles: [
        {
          slug: "probability-bayes-and-distributions",
          title: "Probability, Bayes' Theorem and Standard Distributions",
          syllabusAnchor:
            "GATE Engineering Mathematics — Probability and Statistics: conditional probability, random variables, discrete and continuous distributions, mean and variance.",
          mustCover: [
            "Sample space and events, and the addition rule with the intersection term subtracted exactly once",
            "Conditional probability as the joint probability divided by the probability of the conditioning event, and the multiplication rule that follows from it",
            "Independence contrasted with mutual exclusivity: two events of non-zero probability cannot be both at the same time",
            "Bayes' theorem with the total probability expansion in the denominator, stated over a partition of the sample space",
            "Discrete distributions: binomial with parameters n and p, mean np and variance np(1 - p); Poisson with parameter lambda, mean and variance both lambda",
            "Continuous distributions: uniform on an interval, exponential specified by its rate parameter, and normal specified by mean and standard deviation, with the density integrating to one over its range",
            "Expectation and variance definitions, the identity that variance equals the expectation of X squared minus the square of the expectation, and linearity of expectation which holds whether or not the variables are independent",
            "Variance of a sum equals the sum of variances only for independent variables; state the units of the random variable and note that variance carries squared units while standard deviation carries the same units as the variable",
          ],
          worked: [
            "Work a Bayes' theorem problem end to end — two machines feeding a common output at different defect rates — computing the posterior probability that a defective item came from a named machine",
          ],
          traps: [
            "Treating independent events as mutually exclusive and dropping the intersection term",
            "Adding variances of dependent random variables",
            "Interchanging the exponential rate parameter with its mean, which is the reciprocal",
          ],
          officialSources: [NPTEL, IITM],
          diagram: "hierarchy",
          keywords: [
            "Bayes theorem GATE",
            "binomial and Poisson distribution",
            "expectation and variance formulas",
            "probability GATE engineering mathematics",
          ],
          order: 0,
        },
        {
          slug: "numerical-root-finding-and-integration",
          title: "Numerical Methods: Root Finding and Integration",
          syllabusAnchor:
            "GATE Engineering Mathematics — Numerical Methods: solution of nonlinear equations, numerical integration by trapezoidal and Simpson's rules.",
          mustCover: [
            "Bisection: the bracketing requirement that the function changes sign across the interval, interval halving, guaranteed but slow convergence, and estimating the iterations needed for a target tolerance",
            "Newton-Raphson iteration as the current value minus f divided by f prime, read geometrically as the tangent's intercept on the axis, with quadratic convergence near a simple root",
            "Failure modes of Newton-Raphson: a near-zero derivative, a poor starting guess, and oscillation between two points",
            "Secant method as Newton-Raphson with the derivative replaced by a finite difference, and the trade-off in convergence rate",
            "Composite trapezoidal rule over n subintervals, and the fact that it is exact for a linear integrand",
            "Simpson's one-third rule, why the number of subintervals must be even, and why it is exact for cubics even though it fits parabolas",
            "Error behaviour: trapezoidal error scales with the square of the step size h and Simpson's one-third error with the fourth power, so halving h reduces them by four and sixteen; h carries the units of the independent variable, and the integral carries the product of the integrand and abscissa units",
          ],
          worked: [
            "Evaluate a definite integral with a stated number of subintervals by both the trapezoidal rule and Simpson's one-third rule, tabulating every ordinate and comparing both results against the exact value",
          ],
          traps: [
            "Applying Simpson's one-third rule with an odd number of subintervals",
            "Running Newton-Raphson in degrees when the derivative of a trigonometric term assumes radians",
            "Weighting the end ordinates like the interior ones in the composite formulas",
          ],
          officialSources: [NPTEL, IITM],
          diagram: "flow",
          keywords: [
            "Newton Raphson method GATE",
            "bisection method convergence",
            "Simpson one third rule",
            "trapezoidal rule error order",
          ],
          order: 1,
        },
      ],
    },
  ],
};

export const GATE_CORE: StarterSubject = {
  slug: "gate-core-concepts",
  name: "Core Engineering Concepts",
  description:
    "Signals and systems, mechanics of materials, thermodynamics and fluid mechanics at the derivation level GATE expects.",
  paper: "Branch core",
  topics: [
    {
      slug: "signals-and-systems",
      title: "Signals & Systems",
      articles: [
        {
          slug: "system-properties-and-convolution",
          title: "Signal Classification, System Properties and Convolution",
          syllabusAnchor:
            "GATE Signals and Systems — Classification of signals and systems, linear time invariant systems, impulse response and convolution.",
          mustCover: [
            "Signal classification: continuous versus discrete, periodic versus aperiodic, energy versus power, even versus odd, deterministic versus random",
            "Fundamental period of a discrete-time sinusoid, and the rationality condition that decides whether it is periodic at all",
            "Linearity tested by superposition, with additivity and homogeneity both checked rather than one assumed from the other",
            "Time invariance tested symbolically by comparing the response to a delayed input against the delayed response",
            "Causality as dependence only on present and past inputs, and why having memory does not by itself make a system non-causal",
            "Bounded-input bounded-output stability, and its equivalence to an absolutely integrable impulse response in continuous time or an absolutely summable one in discrete time",
            "Convolution integral and convolution sum, with the impulse response as the complete descriptor of an LTI system; properties are commutative, associative and distributive, convolution with an impulse reproduces the signal, and the discrete result has length equal to the sum of the input lengths minus one",
            "State the units of the input, the impulse response and the output, then confirm the convolution integral is dimensionally consistent once the differential element is included",
          ],
          worked: [
            "Convolve two finite-duration discrete signals both graphically and by direct summation, state the resulting length, and verify one interior sample by hand",
          ],
          traps: [
            "Calling a system time invariant because no explicit time appears in the coefficient, without doing the delay test",
            "Assuming a bounded impulse response implies stability — the condition is absolute integrability, not boundedness",
          ],
          officialSources: [NPTEL, IITM],
          diagram: "hierarchy",
          keywords: [
            "linear time invariant system properties",
            "convolution sum GATE",
            "BIBO stability condition",
            "signal classification GATE",
          ],
          order: 0,
        },
        {
          slug: "fourier-laplace-and-z-transforms",
          title: "Fourier, Laplace and Z Transforms with Sampling",
          syllabusAnchor:
            "GATE Signals and Systems — Fourier series and Fourier transform, Laplace transform, Z transform, sampling theorem and aliasing.",
          mustCover: [
            "Fourier series in trigonometric and exponential form, and how even or odd symmetry removes half the coefficients before any integration is done",
            "Dirichlet conditions as the existence requirement for the Fourier series",
            "Fourier transform properties: linearity, time shift as a pure phase factor, frequency shift, time scaling with its reciprocal amplitude factor, duality, and convolution in time becoming multiplication in frequency",
            "Parseval's relation linking energy computed in the time domain to energy computed in the frequency domain",
            "Laplace transform definition and region of convergence, and why the algebraic expression alone does not identify a signal without its ROC",
            "Stability in the Laplace domain: a causal LTI system is stable when every pole lies in the left half plane, so the ROC includes the imaginary axis; initial and final value theorems, with the conditions under which the final value theorem is valid at all",
            "Z transform with the ROC as a ring in the z plane, and the discrete stability condition that the ROC contains the unit circle, with all poles inside it for a causal system",
            "Sampling theorem: the sampling rate must exceed twice the highest frequency present; what aliasing does to the reconstructed signal, the role of the anti-aliasing filter, and the discipline of stating frequency in hertz and angular frequency in radians per second without mixing them",
          ],
          worked: [
            "Given a transfer function, locate its poles, sketch the region of convergence for the causal case, decide stability, then compute the minimum sampling rate in hertz for a stated signal bandwidth",
          ],
          traps: [
            "Judging stability from pole locations alone without establishing which ROC is intended",
            "Mixing frequency in hertz with angular frequency in radians per second and losing a factor of two pi",
            "Applying the final value theorem to a signal that has no limit, such as a sustained sinusoid",
          ],
          officialSources: [NPTEL, IITM],
          diagram: "compare",
          keywords: [
            "Laplace transform region of convergence",
            "Z transform stability unit circle",
            "sampling theorem aliasing GATE",
            "Fourier transform properties",
          ],
          order: 1,
        },
      ],
    },
    {
      slug: "engineering-mechanics-and-materials",
      title: "Engineering Mechanics & Strength of Materials",
      articles: [
        {
          slug: "equilibrium-stress-strain-and-bending",
          title: "Equilibrium, Stress-Strain and Bending Moment Diagrams",
          syllabusAnchor:
            "GATE Engineering Mechanics and Strength of Materials — Equilibrium of force systems, free body diagrams, stress and strain, shear force and bending moment diagrams, bending and torsion.",
          mustCover: [
            "Free body diagrams: isolate the body and show every external force and reaction, with the correct number of reaction components for hinge, roller and fixed supports",
            "Equilibrium of a coplanar force system — two force summations and one moment summation set to zero — and how many unknowns that can resolve",
            "Static determinacy decided by comparing unknown reactions against the available equilibrium equations",
            "Stress and strain with units: normal stress in pascals, that is newtons per square metre, strain dimensionless, and a stated sign convention for tension and compression",
            "The mild steel stress-strain curve: proportional limit, elastic limit, upper and lower yield points, ultimate strength and fracture, with Hooke's law valid only up to the proportional limit",
            "Elastic constants and their relationships — Young's modulus expressed through the shear modulus and Poisson's ratio, and through the bulk modulus and Poisson's ratio — with the units of each",
            "The differential relations linking load intensity, shear force and bending moment, so each diagram is the slope of the next, and the need to fix one sign convention and hold it throughout",
            "The flexure formula relating bending moment, second moment of area, bending stress, distance from the neutral axis, elastic modulus and radius of curvature, with every symbol and unit defined, plus the section modulus",
            "Torsion of circular shafts relating torque, polar moment of inertia, shear stress, radius, shear modulus, angle of twist and length, for both solid and hollow sections",
          ],
          worked: [
            "Draw shear force and bending moment diagrams for a simply supported beam carrying one point load and a uniformly distributed load: find the reactions, locate the maximum bending moment where the shear force crosses zero, and report values in kilonewtons and kilonewton-metres",
          ],
          traps: [
            "Giving a roller support two reaction components, or a hinge only one",
            "Assuming the maximum bending moment sits at midspan instead of where the shear force changes sign",
            "Applying the flexure formula beyond the elastic limit, or measuring the distance from an axis other than the neutral axis",
          ],
          officialSources: [NPTEL, IITM],
          diagram: "flow",
          keywords: [
            "shear force bending moment diagram GATE",
            "stress strain curve mild steel",
            "elastic constants relationship",
            "torsion of circular shaft",
          ],
          order: 0,
        },
      ],
    },
    {
      slug: "thermodynamics-and-fluids",
      title: "Thermodynamics & Fluid Mechanics",
      articles: [
        {
          slug: "energy-entropy-and-fluid-flow",
          title: "Energy, Entropy and the Fundamentals of Fluid Flow",
          syllabusAnchor:
            "GATE Thermodynamics and Fluid Mechanics — First and second laws, entropy, control volume analysis, fluid statics, continuity, Bernoulli and momentum equations, laminar and turbulent flow.",
          mustCover: [
            "System, control volume, property, state and process, and the distinction between intensive and extensive properties",
            "First law for a closed system and for a complete cycle, with the sign convention for heat added and work done stated before any substitution",
            "Steady flow energy equation for a control volume with every term named — enthalpy, kinetic energy, potential energy, heat and shaft work — and all terms reduced to consistent units of joules per kilogram",
            "Second law statements, reversibility, and entropy as a property with units of joules per kelvin",
            "Carnot efficiency for a reversible cycle between two reservoirs, with both temperatures in kelvin, and why every real cycle falls below it",
            "Fluid statics: pressure variation with depth, gauge versus absolute pressure, and converting a manometer reading using the density of the manometric fluid",
            "Continuity for steady incompressible flow, and Bernoulli's equation together with its four assumptions — steady, incompressible, inviscid, and along a streamline",
            "Momentum equation applied to a control volume, for instance the resultant force on a pipe bend, with the direction of each term fixed by a chosen axis system",
            "Laminar versus turbulent flow, the Reynolds number as the dimensionless ratio of inertial to viscous forces, and the standard critical value used for internal pipe flow",
          ],
          worked: [
            "Compute the Reynolds number for a stated pipe flow from diameter, mean velocity, density and dynamic viscosity, carrying SI units through to confirm the result is dimensionless, then classify the regime",
            "Apply continuity and Bernoulli to a converging section to find the pressure change, naming each assumption at the point where it is used",
          ],
          traps: [
            "Substituting gauge pressure where absolute pressure is required, or degrees Celsius where kelvin is required",
            "Applying Bernoulli's equation across a pump, a turbine, or a region with significant friction loss",
            "Interchanging dynamic and kinematic viscosity in the Reynolds number, which differ by a factor of density",
          ],
          officialSources: [NPTEL, IITM],
          diagram: "compare",
          keywords: [
            "Reynolds number calculation GATE",
            "steady flow energy equation",
            "Bernoulli equation assumptions",
            "first and second law thermodynamics",
          ],
          order: 0,
        },
      ],
    },
  ],
};

export const GATE_APTITUDE_STRATEGY: StarterSubject = {
  slug: "gate-aptitude-and-strategy",
  name: "General Aptitude & Exam Strategy",
  description:
    "The compulsory General Aptitude section plus the marking rules, planning and revision discipline that decide the final score.",
  paper: "Common to all papers",
  topics: [
    {
      slug: "general-aptitude",
      title: "General Aptitude",
      articles: [
        {
          slug: "verbal-quantitative-and-data-interpretation",
          title: "General Aptitude: Verbal, Quantitative and Data Interpretation",
          syllabusAnchor:
            "GATE General Aptitude — Verbal aptitude, quantitative aptitude, analytical aptitude and spatial aptitude, common to every paper.",
          mustCover: [
            "The section is common to every GATE paper and carries a fixed share of the total marks; confirm the current split from the official information brochure rather than assuming it",
            "Verbal aptitude: subject-verb agreement, tense, articles, prepositions and conditionals, plus vocabulary inferred from context and word-pair analogies rather than memorised lists",
            "Reading comprehension: locate what the passage states explicitly, separate inference from assumption, and reject options that overstate the passage",
            "Quantitative core: ratio and proportion, percentages and successive percentage change, profit and loss, and simple and compound interest",
            "Time, speed and distance including relative speed, work and time by the unitary or LCM approach, and mensuration of standard shapes keeping areas in square units and volumes in cubic units",
            "Data interpretation from tables, bar charts, line graphs and pie charts — read the axis scale and its units before computing, and estimate when the options are far apart — plus logical and spatial reasoning patterns such as series, syllogisms, seating and ordering puzzles, mirror images and cube nets",
            "Why this is the highest return per hour of preparation: the syllabus is small and fixed, the questions are branch-independent, and the same patterns repeat, so it protects the aggregate when a core topic is weak",
          ],
          worked: [
            "Work a complete data interpretation set from a table: compute a percentage change, a ratio and an average across rows, writing the units at every step",
          ],
          traps: [
            "Averaging percentages directly instead of returning to the underlying quantities",
            "Combining successive percentage changes by adding them",
          ],
          officialSources: [NPTEL],
          diagram: "none",
          keywords: [
            "GATE general aptitude preparation",
            "data interpretation practice GATE",
            "quantitative aptitude ratio percentage",
            "verbal aptitude reading comprehension",
          ],
          order: 0,
        },
      ],
    },
    {
      slug: "exam-craft",
      title: "Exam Craft",
      articles: [
        {
          slug: "question-types-marking-and-preparation-plan",
          title: "MCQ, MSQ and NAT: Marking Rules and a Preparation Plan",
          syllabusAnchor:
            "GATE examination pattern — multiple choice, multiple select and numerical answer type questions, negative marking, and syllabus-based preparation.",
          mustCover: [
            "The three formats and how each is answered: single-correct MCQ, multiple-select MSQ, and numerical answer type entered on a virtual keypad",
            "Negative marking applies only to MCQs; MSQ and NAT questions carry no penalty, which changes entirely whether a guess is worth making",
            "Because MSQ and NAT carry no penalty every such question should be attempted, while an MCQ guess is worth it only after options have been eliminated; MSQ scoring is all-or-nothing, so one half-sure extra selection costs the whole mark",
            "NAT answers must match the precision the question asks for, so rounding belongs at the end rather than at intermediate steps",
            "Building the plan from the official syllabus: turn each syllabus line into a checklist item and schedule it across weeks, keeping General Aptitude and Engineering Mathematics in every week instead of deferring them",
            "Using previous year questions to set topic priority: solve them topic-wise after first study, then paper-wise under time, and record which syllabus lines keep repeating",
            "Formula sheet and revision note discipline: one page per topic holding only what cannot be re-derived quickly, revised on a fixed cycle",
            "Virtual calculator practice, since the exam supplies an on-screen scientific calculator — rehearse the keystroke sequences for roots, powers, logarithms and trigonometric functions on it rather than on a physical calculator",
            "Mock cadence and analysis: fewer full mocks reviewed deeply beats many left unexamined; classify every wrong answer as a concept gap, a calculation slip or a time loss, because each needs a different fix",
          ],
          worked: [
            "Take one mock test score sheet and rebuild it into an action list, separating concept gaps from calculation slips and time overruns, and converting each into a specific revision task for the coming week",
          ],
          traps: [
            "Guessing MCQs blindly, where the negative mark makes random guessing a losing strategy over a full paper",
            "Leaving NAT and MSQ questions blank despite there being no penalty for a wrong answer",
            "Rounding intermediate steps in a NAT question and landing outside the accepted answer range",
          ],
          officialSources: [NPTEL, IITM],
          diagram: "flow",
          keywords: [
            "GATE negative marking MSQ NAT",
            "GATE preparation strategy plan",
            "GATE previous year questions analysis",
            "GATE virtual calculator practice",
          ],
          order: 0,
        },
      ],
    },
  ],
};
