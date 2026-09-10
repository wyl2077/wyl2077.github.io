(() => {
  const papers = [...document.querySelectorAll(".pub-row")];
  const filter = document.querySelector(".publication-filter");
  const status = document.querySelector("#publication-status");

  filter.hidden = false;
  filter.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-filter]");
    if (!button) return;

    const selected = button.dataset.filter === "selected";
    papers.forEach((paper) => {
      paper.hidden = selected && !paper.classList.contains("highlighted");
    });
    filter.querySelectorAll("button").forEach((control) => {
      control.setAttribute("aria-pressed", String(control === button));
    });
    const count = papers.filter((paper) => !paper.hidden).length;
    status.textContent = `${count} ${selected ? "selected" : "total"} publications`;
  });

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const stopPreviews = new Map();
  const visibilityObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) stopPreviews.get(entry.target)();
    });
  });

  document.querySelectorAll(".media-frame:has(video)").forEach((frame) => {
    const video = frame.querySelector("video");
    const paper = frame.closest(".pub-row");
    const button = document.createElement("button");
    const icon = document.createElement("img");
    button.type = "button";
    button.className = "preview-toggle";
    icon.alt = "";
    icon.width = 16;
    icon.height = 16;
    button.append(icon);
    frame.append(button);
    let requested = false;
    let revision = 0;

    function updateButton(playing) {
      const label = playing ? "Pause video preview" : "Play video preview";
      button.title = label;
      button.setAttribute("aria-label", label);
      button.setAttribute("aria-pressed", String(playing));
      icon.src = `images/icons/${playing ? "pause" : "play"}.svg`;
      frame.classList.toggle("is-playing", playing);
    }

    function setPlaying(playing) {
      requested = playing;
      const currentRevision = ++revision;
      updateButton(playing);
      if (playing) {
        video.play().catch(() => {
          if (currentRevision === revision) {
            requested = false;
            updateButton(false);
          }
        });
      } else {
        video.pause();
      }
    }

    updateButton(false);
    button.addEventListener("click", () => setPlaying(!requested));
    paper.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse" && !reducedMotion.matches) setPlaying(true);
    });
    paper.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "mouse") setPlaying(false);
    });
    stopPreviews.set(frame, () => setPlaying(false));
    visibilityObserver.observe(frame);
  });

  const stopAllPreviews = () => stopPreviews.forEach((stop) => stop());
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) stopAllPreviews();
  });
  reducedMotion.addEventListener("change", stopAllPreviews);

  const navigation = document.querySelector(".site-nav");
  const navLinks = [...navigation.querySelectorAll(".nav-links a")];
  const sections = navLinks.map((link) => document.querySelector(link.getAttribute("href")));
  let scheduled = false;
  function updateNavigation() {
    const sticky = getComputedStyle(navigation).position === "sticky";
    const threshold = sticky ? navigation.getBoundingClientRect().bottom + 32 : 100;
    let current = 0;
    sections.forEach((section, index) => {
      if (section.getBoundingClientRect().top <= threshold) current = index;
    });
    if (scrollY > 0 && innerHeight + scrollY >= document.documentElement.scrollHeight - 4) {
      current = sections.length - 1;
    }
    navLinks.forEach((link, index) => {
      if (index === current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
    scheduled = false;
  }
  function scheduleNavigation() {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateNavigation);
    }
  }
  addEventListener("scroll", scheduleNavigation, { passive: true });
  addEventListener("resize", scheduleNavigation);
  updateNavigation();
})();
