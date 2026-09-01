import { L, topic, type SyllabusSubject } from "./syllabusTypes.js";

const SRC = ["https://nptel.ac.in/"];

const EM = "GATE Engineering Mathematics (common): linear algebra, calculus, differential equations, probability and statistics, numerical methods.";
const CORE = "GATE core engineering: signals and systems, engineering mechanics, strength of materials, thermodynamics, fluid mechanics.";
const GA = "GATE General Aptitude and exam craft: verbal, quantitative and spatial aptitude; MCQ/MSQ/NAT marking; virtual calculator; previous-year method.";

export const GATE_CORPUS: SyllabusSubject[] = [
  {
    slug: "gate-engineering-mathematics",
    name: "Engineering Mathematics",
    description:
      "The mathematics section common to GATE engineering papers, at one-page granularity for rank, ODEs, distributions and numerical rules.",
    paper: "Engineering Mathematics",
    sources: SRC,
    topics: [
      topic("linear-algebra", "Linear Algebra", EM, [
        L("matrix-rank", "Matrix Rank: Row Echelon and Column Space", [
          "Define rank(A) as dim(col(A)), a dimensionless integer equal to the number of pivots after row reduction",
          "Show that row rank equals column rank on a 3×3 example with one zero row after elimination (rank 2)",
          "Rank-nullity: rank(A)+nullity(A)=n for A in R^{m×n}; work n=3, rank=2 so nullity=1",
          "A full-rank square matrix is invertible; check det≠0 as a GATE-speed test, not a substitute for rank",
        ], "hierarchy", ["matrix rank GATE", "rank nullity"]),
        L("ax-b-consistency", "Consistency of Ax = b", [
          "Write Ax=b with A dimensionless (or N/m coefficients) and b a load vector; consistency iff rank(A)=rank([A|b])",
          "Unique solution when rank(A)=rank([A|b])=n; infinite when rank < n; none when ranks differ",
          "Work 2x+y=3 and 4x+2y=6 (consistent, dependent) versus 4x+2y=7 (inconsistent)",
          "Homogeneous Ax=0 always has the trivial solution; nontrivial iff det(A)=0 for square A",
        ], "flow", ["Ax=b consistency GATE", "augmented matrix rank"]),
        L("eigenvalues-eigenvectors", "Eigenvalues and Eigenvectors", [
          "Define Av=λv with v≠0; λ has the units of A’s diagonal (s⁻¹ for a rate matrix, else often dimensionless)",
          "Characteristic equation det(A−λI)=0; compute λ=3 and λ=1 for A=[[2,1],[1,2]]",
          "Trace equals Σλ_i and det equals Πλ_i as a two-second check on a 2×2",
          "A defective matrix lacks a full eigenvector basis; GATE usually stays with diagonalisable examples",
        ], "flow", ["eigenvalues GATE", "characteristic polynomial"]),
        L("cayley-hamilton", "Cayley–Hamilton Theorem", [
          "If p(λ)=det(A−λI), then p(A)=0 (the zero matrix); powers of A inherit the characteristic polynomial",
          "For A=[[1,1],[0,2]], p(λ)=(λ−1)(λ−2); reduce A² to a linear combination of A and I",
          "Use CH to compute A⁻¹ from A²+c₁A+c₀I=0 when A is invertible (c₀=±det)",
          "Do not confuse CH with the minimal polynomial; GATE asks the matrix identity, not Jordan form",
        ], "cards", ["Cayley Hamilton GATE", "characteristic polynomial matrix"]),
        L("matrix-diagonalisation", "Diagonalisation A = PDP⁻¹", [
          "A is diagonalisable if it has n independent eigenvectors; then D=diag(λ_i) and P’s columns are the v_i",
          "Work a symmetric 2×2 with λ₁=3, λ₂=1 and orthonormal P (PᵀP=I) so A=PDPᵀ",
          "A^k = PD^k P⁻¹; compute A³ from the eigenvalues rather than multiplying A three times",
          "Real symmetric matrices are always orthogonally diagonalisable — the GATE default case",
        ], "flow", ["diagonalisation GATE", "orthogonal diagonalisation"]),
        L("gauss-elimination", "Gauss Elimination and Pivoting", [
          "Forward elimination to upper triangular U, then back-substitution; operations count ~n³/3 for an n×n system",
          "Work the 2×2 [[2,1],[4,3]] [x,y]ᵀ=[5,11]ᵀ: R2←R2−2 R1, then y=1, x=2 (dimensionless coefficients, b in the unknown’s units)",
          "Partial pivoting swaps rows so the largest |a_ik| is the pivot; skip it and a 10⁻⁸ pivot wrecks a well-posed system",
          "Rank is the number of nonzero rows in U; a zero row with a nonzero augmented entry is inconsistency of Ax=b",
        ], "flow", ["Gauss elimination GATE", "partial pivoting"]),
      ]),
      topic("calculus", "Calculus", EM, [
        L("limits-continuity-differentiability", "Limits, Continuity and Differentiability", [
          "Define lim_{x→a} f(x)=L; L has the same units as f (m, s, or dimensionless)",
          "Continuity at a: limit exists, f(a) exists, and they match; fill (x²−1)/(x−1) at x=1",
          "Differentiability implies continuity; |x| is continuous at 0 but not differentiable — a standard counterexample",
          "L’Hôpital for 0/0 or ∞/∞: work lim_{x→0} sin(x)/x = 1 with x in radians (dimensionless)",
        ], "compare", ["limits continuity GATE", "L'Hopital GATE"]),
        L("maxima-minima-of-functions", "Maxima and Minima of Functions of One Variable", [
          "Stationary points from f'(x)=0; second-derivative test f''(x)>0 min, f''(x)<0 max (units of f per x²)",
          "Find the local max/min of f(x)=x³−3x on [−2,2] and compare with endpoint values",
          "Closed interval: always check endpoints; GATE often hides the global max at a boundary",
          "Inflection where f'' changes sign is not an extremum unless f' is also zero",
        ], "flow", ["maxima minima GATE", "second derivative test"]),
        L("partial-derivatives-total-differential", "Partial Derivatives and the Total Differential", [
          "Define ∂f/∂x as the rate of f with respect to x holding y fixed (units of f per unit x, e.g. K/m)",
          "Total differential df = f_x dx + f_y dy; for f=x²y at (1,2) with dx=0.1, dy=0.05 estimate Δf",
          "Clairaut: f_xy = f_yx when both are continuous; a mixed-partial check, not a computation trick",
          "Chain rule for z(x(t),y(t)): dz/dt = z_x x' + z_y y'; work a numerical t=1 example",
        ], "cards", ["partial derivatives GATE", "total differential"]),
        L("multiple-integrals-change-of-order", "Multiple Integrals and Change of Order", [
          "∬_D f dA: if f is density in kg/m² then the integral is mass in kg; dA in m²",
          "Evaluate ∫₀¹ ∫₀ˣ (x+y) dy dx and reverse the order to confirm the same number",
          "Jacobian for polar: dA = r dr dθ with r in m and θ in rad; compute ∬_disk x²+y² over unit disk",
          "Change of order is a geometry problem first: sketch the region before writing limits",
        ], "flow", ["double integral GATE", "change of order of integration"]),
        L("mean-value-theorems", "Rolle and Lagrange Mean Value Theorems", [
          "Rolle: f(a)=f(b) ⇒ f'(c)=0 for some c in (a,b); f' has units of f per unit x",
          "Lagrange MVT: f(b)−f(a)=f'(c)(b−a); apply to f(x)=x² on [1,3] and find c=2",
          "Cauchy MVT as the ratio form used to prove L’Hôpital; GATE rarely asks the proof",
          "Hypotheses matter: continuity on [a,b] and differentiability on (a,b) — a corner kills Rolle",
        ], "compare", ["Lagrange MVT GATE", "Rolle theorem"]),
        L("taylor-maclaurin-series", "Taylor and Maclaurin Truncation", [
          "f(x)=f(a)+f'(a)(x−a)+f''(a)(x−a)²/2!+… ; remainder R_n has the units of f",
          "Maclaurin of e^x, sin x, cos x (x in rad, dimensionless): e^{0.1}≈1.105 from 1+x+x²/2",
          "Linearisation f(a)+f'(a)h is the GATE default for small h; state the dropped O(h²) term",
          "Radius of convergence is not the same as a useful truncation; a series that converges slowly is still a bad numerical tool",
        ], "hierarchy", ["Taylor series GATE", "Maclaurin expansion"]),
      ]),
      topic("differential-equations", "Ordinary Differential Equations", EM, [
        L("first-order-ode", "First-Order ODEs: Separable, Linear and Exact", [
          "Write dy/dx = f(x,y); y in m and x in s makes dy/dx a velocity in m/s — name the units on every term",
          "Linear form y'+P(x)y=Q(x) with integrating factor μ=exp(∫P dx); solve y'+2y=e^{−x}, y(0)=1",
          "Exact M dx+N dy=0 when ∂M/∂y=∂N/∂x; work (2x+y)dx+(x+2y)dy=0",
          "Separable dy/dx=g(x)h(y): separate, integrate, apply one initial condition to fix the constant",
        ], "flow", ["first order ODE GATE", "integrating factor"]),
        L("second-order-linear-ode", "Second-Order Linear ODEs with Constant Coefficients", [
          "Write a ÿ + b ẏ + c y = g(t); if y is in m and t in s then a is in kg when the equation is Newton’s law",
          "Characteristic r²+3r+2=0 → r=−1,−2; solve ÿ+3ẏ+2y=0 with y(0)=1, ẏ(0)=0",
          "Repeated root r: (c₁+c₂ t)e^{rt}; complex α±jω: e^{αt}(A cos ωt + B sin ωt) with ω in rad/s",
          "Particular solution by undetermined coefficients for g=e^{at}, sin ωt, or a polynomial — variation of parameters as backup",
        ], "flow", ["second order ODE GATE", "characteristic equation ODE"]),
      ]),
      topic("probability-statistics", "Probability and Statistics", EM, [
        L("bayes-theorem", "Conditional Probability and Bayes’ Theorem", [
          "Define P(A|B)=P(A∩B)/P(B), all probabilities dimensionless in [0,1]",
          "Bayes: P(A|B)=P(B|A)P(A)/P(B); work P(D)=0.01, P(+|D)=0.9, P(+|¬D)=0.05 for P(D|+)",
          "Law of total probability: P(B)=Σ P(B|A_i)P(A_i) over a partition — write the tree before the formula",
          "Independence is P(A∩B)=P(A)P(B), not ‘they look unrelated’; GATE traps mix independence with mutual exclusivity",
        ], "flow", ["Bayes theorem GATE", "total probability"]),
        L("binomial-poisson-distributions", "Binomial and Poisson Distributions", [
          "Binomial: P(X=k)=C(n,k) p^k (1−p)^{n−k}; E[X]=np, Var(X)=np(1−p); X is a count (dimensionless)",
          "Compute P(X=2) for n=10, p=0.1 and compare with Poisson λ=np=1: e^{−1}/2!",
          "Poisson: P(X=k)=e^{−λ} λ^k / k! with λ in events per interval (e.g. 3 failures/hour × 2 h = 6)",
          "Use Poisson as a binomial limit when n is large and p is small with λ=np held fixed",
        ], "compare", ["binomial Poisson GATE", "Poisson approximation"]),
        L("normal-distribution", "Normal Distribution and Standardisation", [
          "X ~ N(μ,σ²) with μ and σ in the same units as X (MPa, mm, s); z=(x−μ)/σ is dimensionless",
          "P(|X−μ|<σ)≈0.6827, <2σ ≈0.9545; GATE expects these two numbers without a table",
          "Linear combo: aX+b is normal with mean aμ+b and variance a²σ² — shift units carefully",
          "CLT: sample mean of n i.i.d. with finite σ is approximately N(μ, σ²/n); work n=25, σ=10 mm",
        ], "cards", ["normal distribution GATE", "z-score"]),
        L("expectation-variance", "Expectation, Variance and Linearity", [
          "E[X]=Σ x p(x) or ∫ x f(x) dx; E[X] has the units of X (m, s, MPa). Var(X)=E[X²]−(E[X])² has units of X²",
          "Linearity: E[aX+bY]=a E[X]+b E[Y] always; Var(aX+bY)=a²Var(X)+b²Var(Y) only if uncorrelated",
          "Fair die: E[X]=3.5, Var(X)=35/12. Two independent dice: E[sum]=7, Var(sum)=35/6",
          "A constant shift changes the mean and leaves the variance; GATE traps add Var(X+c) as Var(X)+c",
        ], "cards", ["expectation variance GATE", "linearity of expectation"]),
      ]),
      topic("numerical-methods", "Numerical Methods", EM, [
        L("newton-raphson-method", "Newton–Raphson Iteration", [
          "x_{n+1}=x_n − f(x_n)/f'(x_n); x has the units of the unknown (m, s, or dimensionless)",
          "Find a root of f(x)=x³−x−1=0 from x₀=1: one step gives x₁=1.5, next ≈1.347",
          "Quadratic convergence when f'(root)≠0; a multiple root drops the order — check f' at the iterate",
          "Division by a small f' is a stop condition, not a licence to continue; compare with bisection’s guaranteed bracket",
        ], "cycle", ["Newton Raphson GATE", "rate of convergence"]),
        L("trapezoidal-simpson-rules", "Trapezoidal and Simpson Integration", [
          "Trapezoidal: I≈(h/2)(y₀+2Σ y_i + y_n) with h in the x-unit (s or m) and y in f’s units",
          "Simpson 1/3 needs even n: I≈(h/3)(y₀+4y_odd+2y_even+y_n); integrate e^{−x} on [0,1] with n=4 both ways",
          "Local error: trapezoidal O(h³) per panel, Simpson O(h⁵); global one order lower",
          "Unequal spacing kills Simpson; fall back to trapezoidal or a spline — GATE will specify equal h",
        ], "compare", ["trapezoidal rule GATE", "Simpson rule error"]),
      ]),
    ],
  },
  {
    slug: "gate-core-concepts",
    name: "Core Engineering Concepts",
    description:
      "Cross-paper GATE core: LTI systems, mechanics of materials, first and second law, and elementary fluids.",
    paper: "Core engineering",
    sources: SRC,
    topics: [
      topic("signals-and-systems", "Signals and Systems", CORE, [
        L("lti-system-tests", "Linearity, Time-Invariance, Causality and Stability", [
          "A system T is linear if T{a x₁+b x₂}=a T{x₁}+b T{x₂}; x in V (or N) and t in s",
          "Time-invariant: a delay of τ s at the input is the same delay at the output — test with a step at t=1 s versus t=3 s",
          "Causal: y(t) depends only on x(τ) for τ≤t; y(t)=x(t+1) fails; memoryless is a stricter special case",
          "BIBO stable iff ∫|h(τ)| dτ < ∞; an integrator of a unit step grows without bound — not BIBO",
        ], "cards", ["LTI tests GATE", "BIBO stability"]),
        L("convolution-impulse-response", "Convolution and the Impulse Response", [
          "y(t)=(x*h)(t)=∫ x(τ) h(t−τ) dτ; if x is in V and h in s⁻¹ then y is in V",
          "h(t) is the output to δ(t); for an RC low-pass, h(t)=(1/RC) e^{−t/RC} u(t) with RC in s",
          "Convolve a unit pulse of width 1 s with itself: a triangular pulse of width 2 s, peak 1 (dimensionless if x is)",
          "Discrete convolution y[n]=Σ x[k] h[n−k]; length of the result is L_x+L_h−1 samples",
        ], "flow", ["convolution GATE", "impulse response"]),
        L("fourier-transform-properties", "Fourier Transform Properties", [
          "X(jω)=∫ x(t) e^{−jωt} dt; ω in rad/s; if x is in V then X is in V·s",
          "Linearity, time shift x(t−t₀) ↔ e^{−jω t₀} X(jω), and differentiation d/dt ↔ jω — the GATE workhorses",
          "Parseval: energy in time equals energy in frequency; check a rectangular pulse of height 1 V, width T s",
          "Convolution in time is multiplication in frequency; dual: windowing in time smears X(jω)",
        ], "cards", ["Fourier transform properties GATE", "Parseval theorem"]),
        L("laplace-transform-roc", "Laplace Transform and Region of Convergence", [
          "X(s)=∫ x(t) e^{−st} dt with s=σ+jω in s⁻¹; ROC is a half-plane in the s-plane, not a single point",
          "e^{−at} u(t) ↔ 1/(s+a) with ROC Re(s)>−a; the left-sided −e^{−at} u(−t) has the same algebra and opposite ROC",
          "Poles sit outside the ROC; a causal stable system has all poles in Re(s)<0 and ROC a right half-plane including jω",
          "Final-value theorem: lim_{t→∞} x(t)=lim_{s→0} s X(s) only if all poles of sX(s) are in the open left half-plane",
        ], "compare", ["Laplace ROC GATE", "final value theorem"]),
        L("sampling-theorem-aliasing", "Sampling Theorem and Aliasing", [
          "Nyquist: sample at f_s > 2 f_max; f_s and f_max in Hz (s⁻¹). A 4 kHz tone needs f_s > 8 kHz",
          "Aliasing: a sinusoid at f folds to |f − k f_s|; 5 kHz sampled at 8 kHz appears as 3 kHz",
          "Ideal reconstruction is a sinc interpolator; practical anti-alias filters cut before f_s/2",
          "Under-sampling a baseband signal is an error; bandpass undersampling is a different, intentional design",
        ], "timeline", ["sampling theorem GATE", "aliasing Nyquist"]),
      ]),
      topic("mechanics-of-materials", "Mechanics and Strength of Materials", CORE, [
        L("fbd-particle-rigid-equilibrium", "Free-Body Diagrams and Equilibrium", [
          "ΣF=0 and ΣM=0 for statics; forces in N, moments in N·m; draw every reaction before writing equations",
          "Particle: three scalar equations in 3D (or two in 2D); rigid body in 2D: ΣF_x, ΣF_y, ΣM_A",
          "Work a simply supported beam of span 4 m with a 10 kN mid-span load: reactions 5 kN each",
          "Internal forces appear only after a cut; an FBD of the whole body cannot find a shear at mid-span",
        ], "flow", ["free body diagram GATE", "equilibrium equations"]),
        L("stress-strain-hooke", "Stress, Strain and Hooke’s Law", [
          "Normal stress σ=P/A in Pa (N/m²); strain ε=δL/L is dimensionless. Work P=20 kN on A=400 mm² → σ=50 MPa",
          "Hooke: σ=E ε in the linear range; E in GPa (steel ~200 GPa). Recover δL=σ L / E",
          "Shear τ=V/A_s and γ=δs/L; G=E/(2(1+ν)) with ν dimensionless (~0.3 for steel)",
          "Thermal strain α ΔT is dimensionless (α in /K); a constrained bar grows stress E α ΔT, not free expansion",
        ], "compare", ["stress strain GATE", "Hooke's law units"]),
        L("sfd-bmd-beams", "Shear Force and Bending Moment Diagrams", [
          "dV/dx=−w(x) and dM/dx=V with V in N, M in N·m, w in N/m, x in m",
          "Simply supported 4 m beam, 10 kN mid-point: V jumps ±5 kN, M_max=10 kN·m at mid-span",
          "A uniformly distributed load gives a linear V and a parabolic M; concentrated loads jump V",
          "Sign convention: GATE accepts either, but the diagram must be consistent with the cut used to derive V and M",
        ], "flow", ["SFD BMD GATE", "bending moment diagram"]),
        L("torsion-circular-shafts", "Torsion of Circular Shafts", [
          "τ/r = T/J = Gθ/L; τ in Pa, T in N·m, J in m⁴, θ in rad, L in m, G in Pa",
          "Solid shaft: J=π d⁴/64. A 40 mm shaft with T=200 N·m: τ_max at the outer radius",
          "Angle of twist θ=T L /(G J); hollow shafts put more J per unit mass at the rim",
          "Power P=T ω with ω in rad/s (P in W); do not mix rpm with rad/s without 2π/60",
        ], "flow", ["torsion of shaft GATE", "polar moment of inertia"]),
        L("elastic-constants-relations", "Elastic Constants E, G, K and ν", [
          "Isotropic linear elastic solid: only two independent constants; E, G, K in Pa, ν dimensionless",
          "G=E/(2(1+ν)), K=E/(3(1−2ν)); for ν=0.3, G≈0.385 E and K≈0.833 E",
          "ν→0.5 is incompressible (K→∞); rubber-like GATE traps sit near this limit",
          "Uniaxial: ε_lat=−ν ε_axial; a bar stretched 1 mm in 1 m with ν=0.3 contracts 0.3 mm/m laterally",
        ], "hierarchy", ["elastic constants GATE", "bulk modulus Poisson"]),
      ]),
      topic("thermo-fluids", "Thermodynamics and Fluids", CORE, [
        L("first-and-second-laws", "First and Second Laws of Thermodynamics", [
          "First law (closed): ΔU=Q−W with U, Q, W in J (or kJ); sign convention must be stated (heat in, work out)",
          "Work a 2 kg ideal gas heated 10 K at c_v=0.7 kJ/kg·K: ΔU=14 kJ; if W=4 kJ then Q=18 kJ",
          "Second law: ΔS≥∫δQ/T with S in J/K; equality for reversible. Clausius: ∮ δQ/T ≤ 0",
          "Kelvin–Planck and Clausius statements are equivalent; a 100% heat-to-work engine violates Kelvin–Planck",
        ], "compare", ["first law second law GATE", "Clausius inequality"]),
        L("sfee-open-systems", "Steady-Flow Energy Equation", [
          "SFEE per unit mass: h₁+½V₁²+g z₁+q = h₂+½V₂²+g z₂+w_s with h, q, w in J/kg, V in m/s, z in m",
          "Drop KE and PE for a slow heater: q=h₂−h₁. Work 200 kJ/kg enthalpy rise as the heat transfer",
          "Nozzle: w_s=0, q≈0 so Δh+Δ(V²/2)=0; 200 kJ/kg drop in h gives V≈632 m/s from rest",
          "h=u+p v; p in Pa, v in m³/kg so p v is J/kg. Never mix gauge and absolute pressure in p v",
        ], "flow", ["SFEE GATE", "steady flow energy equation"]),
        L("bernoulli-equation", "Bernoulli Equation along a Streamline", [
          "p/ρ + V²/2 + g z = const for steady, incompressible, inviscid, along a streamline; p in Pa, ρ in kg/m³, V in m/s, z in m",
          "Pitot: V=√(2 Δp/ρ). Air ρ=1.2 kg/m³, Δp=600 Pa → V=31.6 m/s",
          "Head form: p/ρg + V²/2g + z in metres; do not add a pressure in kPa to a head in m",
          "A pump or a loss term breaks the constant; Bernoulli is not a momentum balance on a control volume",
        ], "flow", ["Bernoulli equation GATE", "pitot tube"]),
        L("reynolds-number-regimes", "Reynolds Number and Flow Regime", [
          "Re=ρ V D / μ = V D / ν, dimensionless. Pipe: Re<2300 laminar, >4000 turbulent (GATE band)",
          "Water μ≈10⁻³ Pa·s, ρ=1000 kg/m³, V=1 m/s, D=20 mm → Re=2×10⁴ (turbulent)",
          "Dynamic viscosity μ in Pa·s = N·s/m²; kinematic ν=μ/ρ in m²/s — mixing them is a classic unit trap",
          "Similarity: match Re (and geometry) for inertia–viscous scaling; unmatched Re means unmatched drag coefficient",
        ], "compare", ["Reynolds number GATE", "laminar turbulent pipe"]),
        L("continuity-equation", "Continuity: Mass Conservation", [
          "Steady incompressible: A₁ V₁ = A₂ V₂ with A in m² and V in m/s so Q in m³/s",
          "A pipe from 100 mm to 50 mm diameter doubles velocity fourfold (area ∝ d²)",
          "Compressible steady: ρ₁ A₁ V₁ = ρ₂ A₂ V₂; density ρ in kg/m³ must travel with the area-velocity product",
          "A leak or a tank fill is an unsteady control-volume problem: d/dt ∭ ρ dV + ∯ ρ V·dA = 0",
        ], "flow", ["continuity equation GATE", "discharge Q=AV"]),
        L("carnot-efficiency", "Carnot Efficiency as a Second-Law Bound", [
          "η_C=1−T_C/T_H with T on an absolute scale (K), never °C. 800 K to 300 K → η_C=0.625",
          "No cyclic engine between those two reservoirs exceeds η_C; a claimed 70% at these T is a second-law violation",
          "Refrigerator COP_rev=T_C/(T_H−T_C); 250 K cold, 300 K hot → COP=5 (dimensionless)",
          "Carnot is reversible and infinitely slow; it is a bound, not a machine you size for power in kW",
        ], "cycle", ["Carnot efficiency GATE", "COP refrigerator"]),
      ]),
    ],
  },
  {
    slug: "gate-aptitude-and-strategy",
    name: "General Aptitude and Exam Strategy",
    description:
      "Compulsory GA plus GATE-specific marking, previous-year method and the on-screen calculator.",
    paper: "General Aptitude",
    sources: SRC,
    topics: [
      topic("general-aptitude", "Verbal, Quantitative and Spatial Aptitude", GA, [
        L("verbal-aptitude", "Verbal Aptitude: Grammar, Vocabulary and RC", [
          "Subject–verb agreement, articles and prepositions as the high-frequency grammar set",
          "Synonym/antonym and word-in-context: eliminate options that change register, not just meaning",
          "Sentence completion: the blank must satisfy both syntax and the passage’s logical connective",
          "RC: main idea versus inference; GATE inference stays inside the paragraph, never world knowledge",
        ], "cards", ["GATE verbal aptitude", "reading comprehension GATE"]),
        L("percentages-ratio-proportion", "Percentages, Ratio and Proportion", [
          "Percent is dimensionless; ‘20% of 150’ is 30 of the same unit (marks, kg, Rs)",
          "Successive: 20% up then 20% down is net −4%, not zero — work 100 → 120 → 96",
          "a:b=2:3 and b:c=4:5 ⇒ a:b:c=8:12:15; keep one common term, never add ratios of different bases",
          "Mixture: alligation as a weighted mean; 20% and 50% to make 30% is a 2:1 part ratio",
        ], "flow", ["percentage ratio GATE", "successive percentage"]),
        L("time-speed-distance-work", "Time–Speed–Distance and Work", [
          "s=v t with s in km or m, v in km/h or m/s, t in h or s; 1 m/s=3.6 km/h is the conversion GATE expects",
          "Average speed is total distance / total time, not the mean of speeds; 60 km at 30 km/h then 60 km at 60 km/h is 40 km/h",
          "Relative speed: same direction subtract, opposite add; two trains 100 m and 150 m at 10 and 15 m/s opposite: 10 s to cross",
          "Work: 1/t_together=1/t_A+1/t_B; A in 6 days and B in 12 days finish in 4 days — rates in day⁻¹",
        ], "flow", ["time speed distance GATE", "work rate"]),
        L("data-interpretation", "Data Interpretation from Tables and Charts", [
          "Read the unit on the axis first (Rs lakh, %, tonnes); a missing 10³ is the usual trap",
          "Pie: 360°=100%; 72° is 20% of the total — convert before comparing to a table in absolute units",
          "Growth rate (new−old)/old, not (new−old)/new; a bar from 40 to 50 is +25%, not +20%",
          "Two-step DI: compute a ratio from the chart, then apply it to a given total — do not mix series",
        ], "cards", ["data interpretation GATE", "pie chart percentage"]),
        L("spatial-aptitude", "Spatial Aptitude: Rotation, Mirrors and Nets", [
          "Rotation in 90° steps about a stated axis; track one marked vertex rather than the whole figure",
          "Mirror versus water image: left–right flip versus up–down; GATE options mix the two",
          "Cube nets: opposite faces never share an edge on a valid net; dice problems use opposite-sum or opposite-pair rules",
          "Paper folding: punch after folds, then unfold; count holes as 2^n for n equivalent folds only when folds stack the punch",
        ], "cards", ["spatial aptitude GATE", "cube nets"]),
      ]),
      topic("exam-craft", "Marking, PYQs and the Virtual Calculator", GA, [
        L("mcq-msq-nat-marking", "MCQ versus MSQ versus NAT Marking", [
          "MCQ: one correct option; wrong answer draws negative marking (one-third of the marks on that question in the usual scheme)",
          "MSQ: one or more correct; no partial credit and typically no negative marking — a single extra tick zeros the item",
          "NAT: numerical entry, no options, no negative marking; match the required decimal places and units (often SI, no unit typed)",
          "Read the year’s information brochure for the live scheme; do not import last year’s negatives onto this year’s MSQs",
        ], "compare", ["GATE MCQ MSQ NAT", "negative marking GATE"]),
        L("pyq-led-method", "Previous-Year Questions as the Syllabus Filter", [
          "Tag each PYQ to a syllabus unit and a formula; frequency × marks is the ranking key, not chapter length",
          "Separate archetypes (eigenvalue of 2×2, Bernoulli pitot, NAT on Re) from one-off derivations",
          "Build a one-page formula sheet from what PYQs actually require; drop identities that never appear",
          "Re-rank after every mock cycle: a unit that keeps leaking marks outranks a unit that is merely ‘important’",
        ], "flow", ["GATE PYQ method", "syllabus prioritisation"]),
        L("virtual-calculator", "On-Screen Virtual Calculator Discipline", [
          "Layout is a scientific calculator: MC, MR, M+ and 1/x; never assume a handheld’s RPN or Ans key",
          "Degree versus radian: a trig NAT in a mechanics question is usually degree; a signals ω t is radian",
          "Chain 2π/60 and 10^n conversions in one expression; rounding only at the last step to the NAT tolerance",
          "Timed drills: evaluate τ=L/R, Re=ρVD/μ, and a 2×2 determinant without paper transcription",
        ], "cards", ["GATE virtual calculator", "degree radian mode"]),
        L("expected-value-mcq-guess", "When a Guess Has Positive Expected Value", [
          "MCQ expected value: if one of four options remains after a kill, EV = (1/3)(+M) + (2/3)(−M/3) > 0 for typical +M / −M/3",
          "Blind 1-in-4 with −1/3 is EV=0 on a 1-mark item? Compute it; many schemes are slightly negative — skip",
          "MSQ: extra ticks destroy the mark; never ‘complete the set’ unless every tick is independently justified",
          "NAT: a dimensional estimate (order of 10^n) is worth typing; a unit-mismatch guess is not",
        ], "flow", ["GATE guess expected value", "MCQ elimination"]),
        L("profit-loss-averages", "Averages, Profit–Loss and Elementary Counting", [
          "Weighted average: (n₁ x₁+n₂ x₂)/(n₁+n₂); 3 tests of 80 and 2 of 50 is 68, not 65",
          "Profit % = (SP−CP)/CP × 100; a 20% loss then 25% gain on the new price is not +5% on CP — work Rs 100",
          "Simple vs compound: SI=P r t /100 with r in /year and t in year; CI uses (1+r)^t − 1",
          "nPr and nCr: ⁵P₂=20, ⁵C₂=10; GATE GA counting stays in this range, not generating functions",
        ], "cards", ["profit loss GATE aptitude", "permutation combination"]),
      ]),
    ],
  },
];
