(() => {
  const CONTACT_EMAIL = "hello@roshangiri.com";
  const PIN_LEAD = 0.12;

  const clamp01 = (n) => Math.min(1, Math.max(0, n));
  const leadIn = (p, lead = PIN_LEAD) => clamp01((p - lead) / (1 - 2 * lead));

  function sectionOffset(id) {
    const target = document.getElementById(id);
    const section = target?.closest("[data-stack]") || target;
    if (!section) return 0;
    let y = 0;
    let node = section.previousElementSibling;
    while (node) {
      if (node.hasAttribute("data-stack")) {
        y += node.offsetHeight + parseFloat(getComputedStyle(node).marginBottom || "0");
      }
      node = node.previousElementSibling;
    }
    return y + (target && target !== section ? target.offsetTop : 0);
  }

  function goTo(id) {
    window.scrollTo({ top: sectionOffset(id), behavior: "smooth" });
  }

  function pinProgress(section) {
    const range = section.offsetHeight - window.innerHeight;
    if (range <= 0) return 0;
    return clamp01(-section.getBoundingClientRect().top / range);
  }

  // Hero entrance animation once fonts are ready
  function initHeroEntrance() {
    let triggered = false;
    const ready = () => {
      if (triggered) return;
      triggered = true;
      requestAnimationFrame(() => document.documentElement.classList.add("is-ready"));
    };
    if (document.fonts && document.fonts.ready) {
      Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 900))]).then(ready, ready);
    } else {
      setTimeout(ready, 100);
    }
  }

  // Navigation and button click bindings
  function initNavigation() {
    document.querySelectorAll("[data-jump]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const targetId = el.getAttribute("data-jump");
        if (targetId) goTo(targetId);
      });
    });

    document.querySelectorAll(".nav-tabs button[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-nav");
        if (id) goTo(id);
      });
    });
  }

  // Stacked scroll & reveal observers
  function initScrollStack() {
    const sections = [...document.querySelectorAll("[data-stack]")];
    const navButtons = document.querySelectorAll(".nav-tabs button");
    const contact = document.getElementById("contact");
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
      let active = sections[0]?.dataset.stack || "home";

      sections.forEach((section, i) => {
        if (section.getBoundingClientRect().top <= vh * 0.45) {
          active = section.dataset.stack || active;
        }
        const next = sections[i + 1];
        let cover = 0;
        if (next && !reduce.matches) {
          cover = clamp01((vh - next.getBoundingClientRect().top) / vh);
        }
        section.style.setProperty("--cover", cover.toFixed(3));
      });

      if (contact && contact.getBoundingClientRect().top <= vh * 0.6) {
        active = "contact";
      }

      const navActive =
        active === "aerospace" || active === "visual"
          ? "home"
          : active === "about"
            ? "contact"
            : active;

      navButtons.forEach((btn) => {
        const isCurrent = btn.getAttribute("data-nav") === navActive;
        btn.classList.toggle("active", isCurrent);
        if (isCurrent) {
          btn.setAttribute("aria-current", "true");
        } else {
          btn.removeAttribute("aria-current");
        }
      });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    const relayout = () => {
      layout();
      schedule();
    };

    const resizeObserver = new ResizeObserver(relayout);
    sections.forEach((sec) => resizeObserver.observe(sec));
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", relayout);
    relayout();

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
          } else if (entry.boundingClientRect.top > 0) {
            entry.target.classList.remove("is-visible");
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    document.querySelectorAll("[data-reveal]").forEach((el) => revealObserver.observe(el));
  }

  // Service sections (pin progress, image scrub, captions, step switching)
  function initServiceSections() {
    const serviceData = {
      aerospace: [
        "Parametric models built for analysis from day one.",
        "CFD studies that show how air really moves.",
        "Digging into propulsion, materials and test data.",
        "Bold ideas, sketched, rendered and sanity-checked."
      ],
      visual: [
        "Flows and interfaces people understand at a glance.",
        "Marks and systems with a clear point of view.",
        "Posters, social and print that earn a second look.",
        "Stories that help founders win the room."
      ]
    };

    ["aerospace", "visual"].forEach((id) => {
      const section = document.getElementById(id);
      if (!section) return;

      const captions = serviceData[id] || [];
      const count = captions.length;
      const stepBtns = section.querySelectorAll(".service-detail button");
      const images = section.querySelectorAll(".service-media-frame img");
      const captionNumber = section.querySelector(".service-caption span");
      const captionText = section.querySelector(".service-caption p");
      let currentStep = 0;

      const setStepUI = (step) => {
        if (step === currentStep && captionText.textContent === captions[step]) return;
        currentStep = step;
        if (captionNumber) {
          captionNumber.textContent = `${String(step + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
        }
        if (captionText) {
          captionText.textContent = captions[step];
        }
        stepBtns.forEach((btn, i) => {
          const isActive = i === step;
          btn.classList.toggle("is-active", isActive);
          if (isActive) {
            btn.setAttribute("aria-current", "step");
          } else {
            btn.removeAttribute("aria-current");
          }
        });
      };

      const onScrollFrame = () => {
        const p = pinProgress(section);
        const q = leadIn(p);
        section.style.setProperty("--progress", q.toFixed(4));
        const step = Math.min(count - 1, Math.floor(q * count));
        setStepUI(step);

        const pos = Math.min(count - 1, Math.max(0, q * count - 0.5));
        images.forEach((img, i) => {
          const d = Math.abs(pos - i);
          img.style.opacity = clamp01(1 - (d - 0.2) / 0.6).toFixed(3);
          img.style.transform = `scale(${(1 + 0.08 * Math.min(1, d)).toFixed(4)})`;
        });
      };

      let frame = 0;
      const schedule = () => {
        if (!frame) {
          frame = requestAnimationFrame(() => {
            frame = 0;
            onScrollFrame();
          });
        }
      };

      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      schedule();

      stepBtns.forEach((btn, i) => {
        btn.addEventListener("click", () => {
          const range = section.offsetHeight - window.innerHeight;
          const targetY = sectionOffset(id) + (PIN_LEAD + ((i + 0.5) / count) * (1 - 2 * PIN_LEAD)) * range;
          window.scrollTo({ top: targetY, behavior: "smooth" });
        });
      });
    });
  }

  // Projects horizontal track section
  function initProjectsSection() {
    const section = document.getElementById("projects");
    if (!section) return;
    const track = section.querySelector(".project-track");
    const progressSpan = section.querySelector(".projects-current");
    const totalProjects = 7;
    let distance = 0;
    let lead = 0;

    const measure = () => {
      if (!track) return;
      distance = Math.max(0, track.scrollWidth - track.clientWidth);
      const buffer = window.innerHeight * 0.25;
      lead = buffer / (distance + 2 * buffer);
      section.style.height = `${window.innerHeight + distance + 2 * buffer}px`;
    };

    const observer = new ResizeObserver(measure);
    if (track) observer.observe(track);
    window.addEventListener("resize", measure);
    measure();

    let frame = 0;
    const onScrollFrame = () => {
      frame = 0;
      const raw = pinProgress(section);
      const p = leadIn(raw, lead);
      if (track) track.style.setProperty("--shift", `${(-p * distance).toFixed(1)}px`);
      section.style.setProperty("--progress", p.toFixed(4));
      const current = Math.min(totalProjects, Math.round(p * (totalProjects - 1)) + 1);
      if (progressSpan) {
        progressSpan.textContent = String(current).padStart(2, "0");
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(onScrollFrame);
    };

    window.addEventListener("scroll", schedule, { passive: true });
    schedule();
  }

  // Contact form submission
  function initContactForm() {
    const form = document.getElementById("contact-form");
    if (!form) return;
    const input = form.querySelector("input");
    const note = document.querySelector(".form-note");

    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const message = input.value.trim();
      if (!message) return;
      const subject = encodeURIComponent("Hello from your portfolio");
      const body = encodeURIComponent(message);
      window.location.href = `mailto:${CONTACT_EMAIL}?subject=${subject}&body=${body}`;
      if (note) {
        note.textContent = "Your email app is open — add your address and hit send. Thank you!";
      }
    });

    input.addEventListener("input", () => {
      if (note) {
        note.textContent = "Opens your email app — internships, projects and good jokes welcome.";
      }
    });
  }

  // Initialize all after DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initHeroEntrance();
      initNavigation();
      initScrollStack();
      initServiceSections();
      initProjectsSection();
      initContactForm();
    });
  } else {
    initHeroEntrance();
    initNavigation();
    initScrollStack();
    initServiceSections();
    initProjectsSection();
    initContactForm();
  }
})();

