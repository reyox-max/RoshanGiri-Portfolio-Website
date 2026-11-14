(() => {
  const CONTACT_EMAIL = "hello@roshangiri.com";

  const clamp01 = (n) => Math.min(1, Math.max(0, n));

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

  function initPageLoader() {
    const loader = document.querySelector(".site-loader");
    if (!loader) return;

    const progress = loader.querySelector(".loader-progress");
    const images = [...document.images].filter((image) => image.loading !== "lazy");
    const hasFonts = Boolean(document.fonts && document.fonts.ready);
    const total = images.length + (hasFonts ? 1 : 0);
    const minimumDisplayTime = 2500;
    const startedAt = performance.now();
    let completed = 0;
    let ready = false;
    let finished = false;
    let fallback;
    let minimumDelay;

    const finish = () => {
      if (finished || !ready) return;
      const remaining = minimumDisplayTime - (performance.now() - startedAt);
      if (remaining > 0) {
        if (!minimumDelay) minimumDelay = window.setTimeout(finish, remaining);
        return;
      }

      finished = true;
      window.clearTimeout(fallback);
      window.clearTimeout(minimumDelay);
      if (progress) progress.textContent = "100%";
      loader.setAttribute("aria-valuenow", "100");
      loader.classList.add("is-complete");

      const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 50 : 760;
      window.setTimeout(() => {
        loader.classList.add("is-hidden");
        document.documentElement.classList.remove("is-loading");
        window.setTimeout(() => loader.remove(), 250);
      }, delay);
    };

    const settle = () => {
      if (finished) return;
      completed += 1;
      const value = total ? Math.min(99, Math.round((completed / total) * 100)) : 99;
      if (progress) progress.textContent = `${value}%`;
      loader.setAttribute("aria-valuenow", String(value));
      if (completed >= total) {
        ready = true;
        finish();
      }
    };

    document.documentElement.classList.add("is-loading");
    fallback = window.setTimeout(() => {
      ready = true;
      finish();
    }, 5000);

    images.forEach((image) => {
      if (image.complete) {
        settle();
        return;
      }
      image.addEventListener("load", settle, { once: true });
      image.addEventListener("error", settle, { once: true });
    });

    if (hasFonts) {
      Promise.race([
        document.fonts.ready,
        new Promise((resolve) => window.setTimeout(resolve, 1500)),
      ]).then(settle, settle);
    }

    if (total === 0) {
      ready = true;
      finish();
    }
  }

  function pinProgress(section) {
    const range = section.offsetHeight - window.innerHeight;
    if (range <= 0) return 0;
    const progress = clamp01((window.scrollY - sectionOffset(section.id)) / range);
    if (progress <= 0.001) return 0;
    if (progress >= 0.999) return 1;
    return progress;
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

  function initFlightScene() {
    const trigger = document.querySelector(".cloud-flight-trigger");
    const scene = document.querySelector(".flight-scene");
    if (!trigger || !scene) return;

    const transitionDuration = 900;
    const sceneDuration = 5000;
    let timer = 0;

    const close = () => {
      if (!scene.classList.contains("is-open")) return;
      window.clearTimeout(timer);
      scene.classList.remove("is-open", "is-flying");
      timer = window.setTimeout(() => {
        scene.classList.remove("is-visible");
        document.body.classList.remove("is-flight-scene");
        timer = 0;
      }, transitionDuration);
    };

    const open = () => {
      if (scene.classList.contains("is-visible")) return;

      const bounds = trigger.getBoundingClientRect();
      scene.style.setProperty("--origin-x", `${bounds.left + bounds.width / 2}px`);
      scene.style.setProperty("--origin-y", `${bounds.top + bounds.height / 2}px`);
      scene.classList.add("is-visible");
      document.body.classList.add("is-flight-scene");
      scene.getBoundingClientRect();
      scene.classList.add("is-open", "is-flying");

      timer = window.setTimeout(close, sceneDuration - transitionDuration);
    };

    trigger.addEventListener("click", open);
    window.addEventListener("keydown", (event) => {
      if (event.key === "Escape") close();
    });
  }

  function initCvViewer() {
    const dialog = document.getElementById("cv-dialog");
    const openButton = document.querySelector("[data-cv-open]");
    const closeButton = dialog?.querySelector(".cv-close");
    if (!dialog || !openButton || !closeButton) return;

    openButton.addEventListener("click", () => dialog.showModal());
    closeButton.addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
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
    const main = document.querySelector("main");
    const navButtons = document.querySelectorAll(".nav-tabs button");
    const contact = document.getElementById("contact");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const stackMotion = window.matchMedia(
      "(min-width: 821px) and (pointer: fine) and (prefers-reduced-motion: no-preference)",
    );
    const sectionColors = new Map(
      sections.map((section) => [section, getComputedStyle(section).backgroundColor]),
    );
    let currentUnderlayColor = "";
    let frame = 0;
    let resizeFrame = 0;

    const layout = () => {
      const vh = window.innerHeight;
      const tops = sections.map((section) => Math.min(0, vh - section.offsetHeight));
      sections.forEach((section, i) => {
        const top = tops[i];
        section.style.setProperty("--stick-top", `${top}px`);
        if (stackMotion.matches) {
          section.style.transformOrigin = `50% ${-top + vh / 2}px`;
        }
      });
    };

    const update = () => {
      frame = 0;
      const vh = window.innerHeight;
      const tops = sections.map((section) => sectionOffset(section.id) - window.scrollY);
      const nextTops = sections.slice(1).map((section) => section.getBoundingClientRect().top);
      const contactTop = contact?.getBoundingClientRect().top;
      let active = sections[0]?.dataset.stack || "home";
      let underlaySection = sections[0];

      sections.forEach((section, i) => {
        if (tops[i] <= vh * 0.45) {
          active = section.dataset.stack || active;
        }
        let cover = 0;
        if (nextTops[i] !== undefined && stackMotion.matches && !reduce.matches) {
          cover = clamp01((vh - nextTops[i]) / vh);
        }
        section.style.setProperty("--cover", cover.toFixed(3));
      });

      if (contactTop !== undefined && contactTop <= vh * 0.6) {
        active = "contact";
      }

      underlaySection =
        sections.find((section) => section.dataset.stack === active) ||
        sections[sections.length - 1];
      const underlayColor = sectionColors.get(underlaySection);
      if (
        main &&
        underlayColor &&
        underlayColor !== "rgba(0, 0, 0, 0)" &&
        underlayColor !== currentUnderlayColor
      ) {
        currentUnderlayColor = underlayColor;
        main.style.setProperty("--stack-underlay", underlayColor);
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

    const scheduleRelayout = () => {
      if (!resizeFrame) {
        resizeFrame = requestAnimationFrame(() => {
          resizeFrame = 0;
          relayout();
        });
      }
    };

    const resizeObserver = new ResizeObserver(scheduleRelayout);
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
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
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
      const mediaFrame = section.querySelector(".service-media-frame");
      const content = section.querySelector(".service-media-content");
      const image = content?.querySelector("img");
      const imageTemplate = content?.querySelector(".service-image-steps");
      const captionNumber = section.querySelector(".service-caption span");
      const captionText = section.querySelector(".service-caption p");
      if (!mediaFrame || !content || !image || !imageTemplate || !captionNumber || !captionText) return;

      const imageSteps = [image, ...imageTemplate.content.querySelectorAll("img")].map((img) => ({
        src: img.getAttribute("src"),
        alt: img.alt,
      }));
      imageSteps.slice(1).forEach(({ src }) => {
        const preload = new Image();
        preload.src = src;
      });
      let currentStep = 0;
      let currentImage = 0;

      const setStepUI = (step) => {
        if (step === currentStep && captionText.textContent === captions[step]) return;
        currentStep = step;
        captionNumber.textContent = `${String(step + 1).padStart(2, "0")} / ${String(count).padStart(2, "0")}`;
        captionText.textContent = captions[step];
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
        const bounds = section.getBoundingClientRect();
        if (bounds.bottom < 0 || bounds.top > window.innerHeight) return;

        const p = pinProgress(section);
        const q = clamp01(p);
        section.style.setProperty("--progress", q.toFixed(4));

        const pos = q * (count - 1);
        const from = Math.floor(pos);
        const to = Math.min(count - 1, from + 1);
        const flip = from === to ? 0 : pos - from;
        const easedFlip = flip * flip * (3 - 2 * flip);
        const step = Math.round(pos);
        setStepUI(step);

        const imageStep = flip >= 0.5 ? to : from;
        if (imageStep !== currentImage) {
          currentImage = imageStep;
          image.src = imageSteps[imageStep].src;
          image.alt = imageSteps[imageStep].alt;
        }

        if (reduceMotion || from === to) {
          mediaFrame.style.transform = "none";
          content.style.transform = "none";
          return;
        }

        const depth = Math.sin(Math.PI * easedFlip);
        const angle = 180 * easedFlip;
        const x = 10 * depth;
        const y = -5 * depth;
        const z = -24 * depth;
        const scale = 1 - 0.025 * depth;
        mediaFrame.style.transform = `translate3d(${x.toFixed(2)}px, ${y.toFixed(2)}px, ${z.toFixed(2)}px) rotateY(${angle.toFixed(2)}deg) scale(${scale.toFixed(4)})`;
        content.style.transform = flip >= 0.5 ? "rotateY(180deg)" : "none";
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
          const targetY = sectionOffset(id) + (count > 1 ? i / (count - 1) : 0) * range;
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

    const measure = () => {
      if (!track) return;
      distance = Math.max(0, track.scrollWidth - track.clientWidth);
      section.style.height = `${window.innerHeight + distance}px`;
    };

    let measureFrame = 0;
    const scheduleMeasure = () => {
      if (!measureFrame) {
        measureFrame = requestAnimationFrame(() => {
          measureFrame = 0;
          measure();
        });
      }
    };

    const observer = new ResizeObserver(scheduleMeasure);
    if (track) observer.observe(track);
    window.addEventListener("resize", measure);
    measure();

    let frame = 0;
    const onScrollFrame = () => {
      frame = 0;
      const p = clamp01(pinProgress(section));
      if (track) {
        track.style.setProperty("--shift", `${(-p * distance).toFixed(1)}px`);
        track.style.setProperty(
          "--first-card-squeeze",
          (0.96 + 0.04 * clamp01(p / 0.12)).toFixed(3),
        );
        track.style.setProperty(
          "--last-card-squeeze",
          (0.96 + 0.04 * clamp01((1 - p) / 0.12)).toFixed(3),
        );
      }
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

  initPageLoader();

  // Initialize all after DOM ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      initHeroEntrance();
      initFlightScene();
      initCvViewer();
      initNavigation();
      initScrollStack();
      initServiceSections();
      initProjectsSection();
      initContactForm();
    });
  } else {
    initHeroEntrance();
    initFlightScene();
    initCvViewer();
    initNavigation();
    initScrollStack();
    initServiceSections();
    initProjectsSection();
    initContactForm();
  }
})();

