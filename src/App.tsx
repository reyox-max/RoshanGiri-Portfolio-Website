import {
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentType,
  type CSSProperties,
  type RefObject,
  type TransitionEvent,
} from "react";
import {
  ArrowUpRight,
  FileText,
  Mail,
  MessagesSquare,
  PenTool,
  Plane,
  Send,
} from "lucide-react";

type Icon = ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }>;

// Replace with your real inbox — the contact form opens a pre-filled email to this address.
const CONTACT_EMAIL = "hello@roshangiri.com";

const ICON_STROKE = 2.75;

const unsplash = (id: string, w = 1400) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const assets = {
  portrait: "/assets/d2d59.png",
  aerospace: "/assets/6272d.png",
  visual: "/assets/8f103.png",
};

const services = [
  {
    id: "aerospace",
    heading: ["Built to", "fly"],
    body: "In my aerospace studies I model, test and refine components from first sketch to final simulation — and I'm ready to bring that rigour to a real engineering team.",
    title: ["Aerospace", "Engineering"],
    cta: "See Engineering Work",
    icon: Plane as Icon,
    tone: "blue",
    tools: ["SolidWorks", "ANSYS", "MATLAB", "Blender", "Fusion 360", "VS Code", "XFLR5"],
    steps: [
      {
        label: "CAD & CAE Modelling",
        caption: "Parametric models built for analysis from day one.",
        image: unsplash("photo-1581092580497-e0d23cbdf1dc"),
        alt: "Engineer reviewing a 3D CAD model on a monitor",
      },
      {
        label: "Flow Simulation",
        caption: "CFD studies that show how air really moves.",
        image: unsplash("photo-1605590427165-3884d6aa6731"),
        alt: "Aircraft wing slicing through a layer of clouds",
      },
      {
        label: "Technical Research",
        caption: "Digging into propulsion, materials and test data.",
        image: unsplash("photo-1540575861501-7cf05a4b125a"),
        alt: "Close-up of an airliner turbofan engine",
      },
      {
        label: "Concept Design",
        caption: "Bold ideas, sketched, rendered and sanity-checked.",
        image: assets.aerospace,
        alt: "A blended-wing aircraft concept flying above the clouds",
      },
    ],
  },
  {
    id: "visual",
    heading: ["Designed to", "land"],
    body: "Alongside my degree I design brands, interfaces and pitch decks that make complex ideas feel simple — a second skill set I bring to every team I join.",
    title: ["Visual", "Design"],
    cta: "See Design Work",
    icon: PenTool as Icon,
    tone: "light",
    tools: ["Figma", "Illustrator", "Photoshop", "Affinity", "Canva"],
    steps: [
      {
        label: "UI/UX Design",
        caption: "Flows and interfaces people understand at a glance.",
        image: unsplash("photo-1522542550221-31fd19575a2d"),
        alt: "Hand-drawn wireframe sketches of web layouts",
      },
      {
        label: "Brand Identity",
        caption: "Marks and systems with a clear point of view.",
        image: unsplash("photo-1763705857736-2b4f16a33758"),
        alt: "Branded cards laid out on a table",
      },
      {
        label: "Graphic Design",
        caption: "Posters, social and print that earn a second look.",
        image: unsplash("photo-1558655146-9f40138edfeb"),
        alt: "Designer sketching on a tablet beside open books",
      },
      {
        label: "Pitch Decks",
        caption: "Stories that help founders win the room.",
        image: unsplash("photo-1590098563734-bcea80ce34c7"),
        alt: "Presentation slides open on a laptop",
      },
    ],
  },
] as const;

type Service = (typeof services)[number];

const projects = [
  {
    title: "Blended-Wing Concept",
    tags: "Aerodynamics · CAD",
    image: assets.aerospace,
    alt: "Blended-wing aircraft above the clouds",
  },
  {
    title: "Turbofan Inlet Study",
    tags: "Propulsion · CFD",
    image: unsplash("photo-1696238628662-e820babaf1e3", 900),
    alt: "Large jet engine on an airport apron",
  },
  {
    title: "Survey UAV Airframe",
    tags: "Structures · SolidWorks",
    image: unsplash("photo-1473968512647-3e447244af8f", 900),
    alt: "Drone flying against the sky",
  },
  {
    title: "Sounding Rocket Nozzle",
    tags: "Propulsion · MATLAB",
    image: unsplash("photo-1517976487492-5750f3195933", 900),
    alt: "Rocket lifting off from the launch pad",
  },
  {
    title: "Higher Tomorrow Campaign",
    tags: "Brand · Campaign",
    image: assets.visual,
    alt: "Design workspace with aviation campaign artwork",
  },
  {
    title: "Flight Companion App",
    tags: "UI/UX · Figma",
    image: unsplash("photo-1767449441925-737379bc2c4d", 900),
    alt: "Mobile app interface screens",
  },
  {
    title: "Aero Startup Pitch Deck",
    tags: "Pitch Deck · Storytelling",
    image: unsplash("photo-1590098563176-07884b06d7f7", 900),
    alt: "Laptop showing presentation slides",
  },
];

const navItems = [
  ["home", "Home"],
  ["projects", "Work"],
  ["contact", "Contact"],
] as const;

const footerColumns = [
  {
    title: "Explore",
    links: [
      ["aerospace", "Engineering"],
      ["visual", "Design"],
      ["projects", "Selected Work"],
    ],
  },
  {
    title: "Navigate",
    links: [
      ["home", "Home"],
      ["about", "About Me"],
      ["contact", "Contact"],
    ],
  },
] as const;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Natural (un-stuck) document offset of a section or an element inside one. */
function sectionOffset(id: string) {
  const target = document.getElementById(id);
  const section = target?.closest<HTMLElement>("[data-stack]") ?? target;
  if (!section) return 0;
  let y = 0;
  let node = section.previousElementSibling as HTMLElement | null;
  while (node) {
    if (node.hasAttribute("data-stack")) {
      y += node.offsetHeight + parseFloat(getComputedStyle(node).marginBottom || "0");
    }
    node = node.previousElementSibling as HTMLElement | null;
  }
  return y + (target && target !== section ? target.offsetTop : 0);
}

/** 0 → 1 progress while a tall (pinned) section scrolls past its sticky panel. */
function pinProgress(section: HTMLElement) {
  const range = section.offsetHeight - window.innerHeight;
  if (range <= 0) return 0;
  const progress = clamp01((window.scrollY - sectionOffset(section.id)) / range);
  if (progress <= 0.001) return 0;
  if (progress >= 0.999) return 1;
  return progress;
}

/** Calls `onFrame` with the section's pin progress on every scroll / resize frame. */
function usePinProgress(ref: RefObject<HTMLElement | null>, onFrame: (p: number) => void) {
  useEffect(() => {
    let frame = 0;
    const tick = () => {
      frame = 0;
      if (ref.current) onFrame(pinProgress(ref.current));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [ref, onFrame]);
}

/**
 * Stacked scroll: every section is sticky. Sections taller than the viewport
 * stick once their bottom reaches the viewport bottom, and the next section
 * slides over while the covered one recedes.
 */
function useScrollStack(onActive: (id: string) => void) {
  useEffect(() => {
    const sections = [...document.querySelectorAll<HTMLElement>("[data-stack]")];
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;

    const layout = () => {
      const vh = window.innerHeight;
      sections.forEach((section) => {
        const top = Math.min(0, vh - section.offsetHeight);
        section.style.setProperty("--stick-top", `${top}px`);
        section.style.transformOrigin = `50% ${-top + vh / 2}px`;
      });
    };

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const tops = sections.map((section) => section.getBoundingClientRect().top);
      const contact = document.getElementById("contact");
      const contactTop = contact?.getBoundingClientRect().top;
      let active = sections[0]?.dataset.stack ?? "home";
      sections.forEach((section, i) => {
        if (tops[i] <= vh * 0.45) {
          active = section.dataset.stack ?? active;
        }
        let cover = 0;
        if (tops[i + 1] !== undefined && !reduce.matches) {
          cover = clamp01((vh - tops[i + 1]) / vh);
        }
        section.style.setProperty("--cover", cover.toFixed(3));
      });
      if (contactTop !== undefined && contactTop <= vh * 0.6) active = "contact";
      onActive(active);
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const relayout = () => {
      layout();
      schedule();
    };

    const resizeObserver = new ResizeObserver(relayout);
    sections.forEach((section) => resizeObserver.observe(section));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", relayout);
    relayout();

    const revealObserver = new IntersectionObserver(
      (entries) =>
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else if (entry.boundingClientRect.top > 0) {
            // Left through the bottom (scrolled back up): reset so it plays again on the way down.
            entry.target.classList.remove("is-visible");
          }
        }),
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));

    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      revealObserver.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", relayout);
    };
  }, [onActive]);
}

/**
 * Pixel-art sky square: three layers of pixel clouds drift across a fixed blue
 * tile at different speeds. Each layer is a 16-unit tile drawn three times
 * (-16, 0, 16), so a -16 unit shift loops without a seam.
 */
type Cloud = { x: number; y: number; size: "s" | "m" | "l" };

// Row profiles for each cloud size: [offsetX, width] per row, top to bottom; last row is the shaded underside.
const CLOUD_SHAPES: Record<Cloud["size"], [number, number][]> = {
  s: [
    [1, 2],
    [0, 4],
    [0, 4],
  ],
  m: [
    [2, 2],
    [1, 5],
    [0, 7],
    [1, 5],
  ],
  l: [
    [2, 3],
    [1, 6],
    [0, 9],
    [0, 9],
    [1, 7],
  ],
};

const CLOUD_LAYERS = [
  {
    className: "cloud-far",
    fill: "#6f8ffc",
    shade: "#5c7ffb",
    clouds: [
      { x: 1, y: 1, size: "s" },
      { x: 9, y: 5, size: "m" },
      { x: 4, y: 12, size: "s" },
    ],
  },
  {
    className: "cloud-mid",
    fill: "#c6d2fe",
    shade: "#9fb3fd",
    clouds: [
      { x: 10, y: 0, size: "m" },
      { x: 1, y: 7, size: "m" },
    ],
  },
  {
    className: "cloud-near",
    fill: "#ffffff",
    shade: "#c6d2fe",
    clouds: [
      { x: 6, y: 10, size: "l" },
      { x: 13, y: 4, size: "s" },
    ],
  },
] as const satisfies readonly { className: string; fill: string; shade: string; clouds: Cloud[] }[];

function CloudMark() {
  return (
    <svg aria-hidden className="cloud-mark" viewBox="0 0 16 16">
      <defs>
        <clipPath id="cloud-clip">
          <rect height="16" width="16" />
        </clipPath>
      </defs>
      <g clipPath="url(#cloud-clip)">
        <rect fill="#2a56fb" height="16" width="16" />
        {CLOUD_LAYERS.map((layer) => {
          // One path per tone: shared row edges rasterise as a single shape, so no hairline seams.
          let body = "";
          let shade = "";
          for (const offset of [-16, 0, 16]) {
            for (const cloud of layer.clouds) {
              const rows = CLOUD_SHAPES[cloud.size];
              rows.forEach(([dx, w], row) => {
                const d = `M${cloud.x + dx + offset} ${cloud.y + row}h${w}v1h${-w}z`;
                if (row === rows.length - 1) shade += d;
                else body += d;
              });
            }
          }
          return (
            <g className={layer.className} key={layer.className}>
              <path d={shade} fill={layer.shade} />
              <path d={body} fill={layer.fill} />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

function ActionButton({
  label,
  icon: IconComponent,
  variant = "light",
  large = false,
  onClick,
}: {
  label: string;
  icon: Icon;
  variant?: "light" | "solid";
  large?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`action-button action-button--${variant} ${large ? "action-button--large" : ""}`}
      onClick={onClick}
      type="button"
    >
      <span>{label}</span>
      <IconComponent aria-hidden size={large ? 22 : 18} strokeWidth={ICON_STROKE} />
    </button>
  );
}

function ServiceSection({ service, goTo }: { service: Service; goTo: (id: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [faceSteps, setFaceSteps] = useState<[number, number]>([0, 0]);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const count = service.steps.length;
  const visibleStep = faceSteps[isFlipped ? 1 : 0];

  const onFrame = useCallback(
    (p: number) => {
      const section = ref.current;
      if (!section) return;
      const q = clamp01(p);
      section.style.setProperty("--progress", q.toFixed(4));
      setStep(Math.round(q * (count - 1)));
    },
    [count],
  );
  usePinProgress(ref, onFrame);

  useEffect(() => {
    const targetFace = isAnimating ? (isFlipped ? 1 : 0) : isFlipped ? 0 : 1;
    if (faceSteps[targetFace] !== step) {
      setFaceSteps((current) => {
        const next: [number, number] = [...current];
        next[targetFace] = step;
        return next;
      });
    }

    if (!isAnimating && step !== visibleStep) {
      setIsAnimating(true);
      setIsFlipped((flipped) => !flipped);
    }
  }, [faceSteps, isAnimating, isFlipped, step, visibleStep]);

  const jumpTo = (i: number) => {
    const section = ref.current;
    if (!section) return;
    const range = section.offsetHeight - window.innerHeight;
    const intervalCount = Math.max(1, count - 1);
    const progress =
      i === 0
        ? 0.25 / intervalCount
        : i === count - 1
          ? 1 - 0.25 / intervalCount
          : i / intervalCount;
    window.scrollTo({
      top: sectionOffset(service.id) + progress * range,
      behavior: "smooth",
    });
  };

  const handleCardFlipEnd = (event: TransitionEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget || event.propertyName !== "transform" || !isAnimating)
      return;
    setIsAnimating(false);
  };

  return (
    <section
      className={`stack-section service-section service-section--${service.tone}`}
      data-stack={service.id}
      id={service.id}
      ref={ref}
      style={{ "--transitions": count - 1 } as CSSProperties}
    >
      <div className="pin">
        <div className="service-grid">
          <div className="service-intro" data-reveal>
            <h2>
              {service.heading[0]} <span>{service.heading[1]}</span>
            </h2>
            <p>{service.body}</p>
            <div className="service-cta service-cta--top">
              <ActionButton
                icon={service.icon}
                label={service.cta}
                onClick={() => goTo("projects")}
                variant={service.tone === "light" ? "solid" : "light"}
              />
            </div>
          </div>

          <div
            className="service-media"
            data-reveal="self"
            style={{ "--d": "120ms" } as CSSProperties}
          >
            <span className="accent-square" />
            <div className="service-media-frame flip-card">
              <div
                className={`flip-card-inner${isFlipped ? " is-flipped" : ""}`}
                onTransitionEnd={handleCardFlipEnd}
              >
                <div className="flip-card-face flip-card-front" aria-hidden={isFlipped}>
                  <img
                    alt={service.steps[faceSteps[0]].alt}
                    decoding="async"
                    src={service.steps[faceSteps[0]].image}
                  />
                  <div className="service-caption" aria-live="polite">
                    <span>
                      {String(faceSteps[0] + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                    </span>
                    <p>{service.steps[faceSteps[0]].caption}</p>
                  </div>
                </div>
                <div className="flip-card-face flip-card-back" aria-hidden={!isFlipped}>
                  <img
                    alt={service.steps[faceSteps[1]].alt}
                    decoding="async"
                    src={service.steps[faceSteps[1]].image}
                  />
                  <div className="service-caption" aria-live="polite">
                    <span>
                      {String(faceSteps[1] + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
                    </span>
                    <p>{service.steps[faceSteps[1]].caption}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="service-detail" data-reveal style={{ "--d": "220ms" } as CSSProperties}>
            <h3>
              {service.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h3>
            <span className="detail-rule">
              <i />
            </span>
            <ul>
              {service.steps.map((item, i) => (
                <li key={item.label}>
                  <button
                    aria-current={i === step ? "step" : undefined}
                    className={i === step ? "is-active" : ""}
                    onClick={() => jumpTo(i)}
                    type="button"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* On touch layouts the CTA moves to the bottom of the panel, within thumb reach. */}
        <div className="service-cta service-cta--bottom">
          <ActionButton
            icon={service.icon}
            label={service.cta}
            onClick={() => goTo("projects")}
            variant={service.tone === "light" ? "solid" : "light"}
          />
        </div>

        <div className="tool-strip">
          <span>My toolkit</span>
          <div className="tool-dots" aria-label="Tools used">
            {service.tools.map((tool) => (
              <span key={tool}>{tool}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function ProjectsSection({ goTo }: { goTo: (id: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const distance = useRef(0);
  const [current, setCurrent] = useState(1);

  // Section height = one viewport + the horizontal distance, so vertical scroll maps 1:1 to the track.
  useEffect(() => {
    const measure = () => {
      const section = ref.current;
      const track = trackRef.current;
      if (!section || !track) return;
      distance.current = Math.max(0, track.scrollWidth - track.clientWidth);
      section.style.height = `${window.innerHeight + distance.current}px`;
    };
    const observer = new ResizeObserver(measure);
    if (trackRef.current) observer.observe(trackRef.current);
    window.addEventListener("resize", measure);
    measure();
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const onFrame = useCallback((raw: number) => {
    const track = trackRef.current;
    if (!track) return;
    const p = clamp01(raw);
    track.style.setProperty("--shift", `${(-p * distance.current).toFixed(1)}px`);
    const firstSqueeze = 0.96 + 0.04 * clamp01(p / 0.12);
    const lastSqueeze = 0.96 + 0.04 * clamp01((1 - p) / 0.12);
    track.style.setProperty("--first-card-squeeze", firstSqueeze.toFixed(3));
    track.style.setProperty("--last-card-squeeze", lastSqueeze.toFixed(3));
    ref.current?.style.setProperty("--progress", p.toFixed(4));
    setCurrent(Math.min(projects.length, Math.round(p * (projects.length - 1)) + 1));
  }, []);
  usePinProgress(ref, onFrame);

  return (
    <section className="stack-section projects" data-stack="projects" id="projects" ref={ref}>
      <div className="pin">
        <div className="projects-heading" data-reveal>
          <div>
            <h2>Projects worth bragging about</h2>
            <p>
              Coursework, competition entries and personal projects I&apos;ve designed, simulated
              and shipped — keep scrolling to fly through them.
            </p>
          </div>
          <div className="projects-progress" aria-hidden>
            <span>
              {String(current).padStart(2, "0")}
              <small> / {String(projects.length).padStart(2, "0")}</small>
            </span>
            <i>
              <b />
            </i>
          </div>
        </div>

        <div className="project-track" ref={trackRef}>
          <div className="project-rail">
            {projects.map((project, i) => (
              <article className="project-card" key={project.title}>
                <img alt={project.alt} decoding="async" src={project.image} />
                <span className="project-index">{String(i + 1).padStart(2, "0")}</span>
                <div className="project-label">
                  <h3>{project.title}</h3>
                  <p>{project.tags}</p>
                </div>
              </article>
            ))}
            <div className="project-card project-card--cta">
              <p>Your team could be next.</p>
              <ActionButton
                icon={MessagesSquare}
                label="Let's Work Together"
                onClick={() => goTo("contact")}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function App() {
  const [active, setActive] = useState("home");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const activeRef = useRef(active);

  const handleActive = useCallback((id: string) => {
    if (activeRef.current !== id) {
      activeRef.current = id;
      setActive(id);
    }
  }, []);
  useScrollStack(handleActive);

  // Start the hero entrance once fonts are in (capped so a slow font never blocks it).
  useEffect(() => {
    let cancelled = false;
    const ready = () => {
      if (!cancelled)
        requestAnimationFrame(() => document.documentElement.classList.add("is-ready"));
    };
    Promise.race([document.fonts?.ready, new Promise((r) => setTimeout(r, 900))]).then(
      ready,
      ready,
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const goTo = useCallback((id: string) => {
    window.scrollTo({ top: sectionOffset(id), behavior: "smooth" });
  }, []);

  const sendMessage = (event: FormEvent) => {
    event.preventDefault();
    if (!message.trim()) return;
    const subject = encodeURIComponent("Hello from your portfolio");
    const body = encodeURIComponent(message.trim());
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
    setSent(true);
  };

  const navActive =
    active === "aerospace" || active === "visual"
      ? "home"
      : active === "about"
        ? "contact"
        : active;

  return (
    <main>
        <nav className="site-nav" aria-label="Primary navigation">
          <div className="nav-tabs">
            {navItems.map(([id, label]) => (
              <button
                aria-current={navActive === id ? "true" : undefined}
                className={navActive === id ? "active" : ""}
                key={id}
                onClick={() => goTo(id)}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
        <button className="cv-button" onClick={() => goTo("contact")} type="button">
          <span>View My CV</span>
          <FileText aria-hidden size={16} strokeWidth={ICON_STROKE} />
        </button>
        </nav>

        <section className="stack-section hero" data-reveal="hero" data-stack="home" id="home">
          <div className="hero-copy">
            <p className="hello">Hello, I&rsquo;m</p>
            <h1>
              <span className="hero-word hero-word--ink">
                <span>Roshan</span>
              </span>{" "}
              <span className="hero-word">
                <span>Giri</span>
              </span>
            </h1>
            <div className="title-line">
              <i />
              <p>Aerospace Engineering Student</p>
            </div>
            <p className="hero-description">
              An aerospace engineering student looking for internships and early-career roles —
              bringing an engineer&apos;s precision to every part and a designer&apos;s eye to every
              pixel.
            </p>
            <div className="hero-actions">
              <ActionButton
                icon={ArrowUpRight}
                label="Explore My Work"
                onClick={() => goTo("aerospace")}
                variant="solid"
              />
              <span className="availability">
                <i aria-hidden /> Open to internships
              </span>
            </div>
          </div>
          <img className="portrait" src={assets.portrait} alt="Portrait of Roshan Giri" />
        </section>

        {services.map((service) => (
          <ServiceSection goTo={goTo} key={service.id} service={service} />
        ))}

        <ProjectsSection goTo={goTo} />

        <section className="stack-section about-contact" data-stack="about" id="about">
          <div className="about-contact-body">
            <div className="about">
              <h2>
                <span className="about-line" data-reveal>
                  <span className="about-word">Engineer</span>
                  <CloudMark />
                  <span className="about-word">Designer</span>
                </span>
                <span
                  className="about-sub"
                  data-reveal="self"
                  style={{ "--d": "330ms" } as CSSProperties}
                >
                  and everything in between
                </span>
              </h2>
              <p data-reveal="self">
                I&apos;m an aerospace engineering student based in Nepal who never stopped
                sketching. My work lives where analysis meets aesthetics — I run simulations to
                understand how things behave, then design how they should look and feel. Now
                I&apos;m looking for an internship or graduate role where I can learn fast and add a
                little lift from day one.
              </p>
            </div>

            <div className="contact" id="contact">
              <div className="contact-main" data-reveal>
                <h2>
                  Have an opportunity that needs <span>lift-off?</span>
                </h2>
                <form onSubmit={sendMessage}>
                  <input
                    aria-label="Your message"
                    onChange={(event) => {
                      setMessage(event.target.value);
                      setSent(false);
                    }}
                    placeholder="Write your message…"
                    required
                    value={message}
                  />
                  <button type="submit">
                    <span>Send</span>
                    <Send aria-hidden size={16} strokeWidth={ICON_STROKE} />
                  </button>
                </form>
                <p className="form-note" aria-live="polite">
                  {sent
                    ? "Your email app is open — add your address and hit send. Thank you!"
                    : "Opens your email app — internships, projects and good jokes welcome."}
                </p>
              </div>

              <div className="footer-links" data-reveal style={{ "--d": "120ms" } as CSSProperties}>
                {footerColumns.map((column) => (
                  <div key={column.title}>
                    <h3>{column.title}</h3>
                    {column.links.map(([id, label]) => (
                      <a
                        href={`#${id}`}
                        key={label}
                        onClick={(event) => {
                          event.preventDefault();
                          goTo(id);
                        }}
                      >
                        {label}
                      </a>
                    ))}
                  </div>
                ))}
                <div>
                  <h3>Say Hello</h3>
                  <a href={`mailto:${CONTACT_EMAIL}`}>
                    <Mail aria-hidden size={14} strokeWidth={2.25} /> Email me
                  </a>
                  <span>Remote or on-site</span>
                </div>
              </div>
            </div>
          </div>
          <div className="footer-bar" />
        </section>
    </main>
  );
}
