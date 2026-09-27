/* ==========================================================================
   Rogue Pirates — site content & behaviour
   Everything you are likely to edit lives in the CONFIG block below.
   ========================================================================== */

/* ------------------------------ CONFIG ---------------------------------- */

// Social / community links. Leave "" to show a "coming soon" toast instead.
const LINKS = {
  x: "https://x.com/RoguePiratesFun",
  instagram: "https://www.instagram.com/roguepiratesfun/",
  discord: "https://discord.gg/mU9ys5VQMY", // also used by the "Join us" button
};

// Store listings (the section says "Launching soon on"). Leave "" until live.
const STORES = {
  seeker: "",
  apple: "",
  steam: "",
  google: "",
};

// Our Story trailer. The promo video is already in index.html (assets/video/).
// To use YouTube/Vimeo instead, put its *embed* URL here,
// e.g. "https://www.youtube.com/embed/VIDEO_ID". Leave "" to keep the local video.
const STORY_VIDEO = "";

// Gameplay carousel. Each item: { src: "/assets/img/gameplay/01.webp", alt: "…" }
// or { video: "/assets/video/clip.mp4", poster: "…" } or { embed: "https://www.youtube.com/embed/…" }.
// While empty, PLACEHOLDER_SLIDES dark cards are shown (as in the design).
const GAMEPLAY_MEDIA = [];
const PLACEHOLDER_SLIDES = 6;

// Captains, in the order they appear in the picker.
// `h` is the height (px) of the source character art — keeps everyone at the same scale.
//
// Stats are 0–6 bars, derived from the Narrative Bible (v1):
//   durability <- Hull   (85 -> 2, 90 -> 3, 100 -> 4, 110 -> 5)
//   speed      <- Speed  (5.7 m/s -> 3, 6.0 m/s -> 4, 6.3 m/s -> 5)
//   firepower / handling <- read from each captain's weapon & gameplay notes
//                           (the bible has no numbers for these two).
// Abilities are each captain's passive from the bible.
// `icon` is optional — without it the captain's emblem is shown as a placeholder.
const CAPTAINS = [
  {
    key: "rook", name: "Rook", h: 1054,
    // Generalist · Deck Cannon · Hull 100 · 6.0 m/s
    stats: { firepower: 4, durability: 4, speed: 4, handling: 4 },
    ability: { name: "Exactly As Planned", desc: "Grows stronger every level, up to +25% damage." },
  },
  {
    key: "richie", name: "Richie", h: 1047,
    // Smuggler · Broadside · Hull 90 · 6.0 m/s
    stats: { firepower: 3, durability: 3, speed: 4, handling: 4 },
    ability: { name: "Golden Hoard", desc: "Richer Gold pickups. Unspent Gold boosts damage." },
  },
  {
    key: "hank", name: "Hank", h: 1041,
    // Tank · Deck Cannon · Hull 110 · 5.7 m/s
    stats: { firepower: 4, durability: 5, speed: 3, handling: 3 },
    ability: { name: "Stand Your Ground", desc: "Gains Armor every level. Dodging is optional." },
  },
  {
    key: "roxie", name: "Roxie", h: 1080,
    // Stormchaser · Lightning Mast · Hull 85 · 6.3 m/s
    stats: { firepower: 4, durability: 2, speed: 5, handling: 6 },
    ability: { name: "Close Call", desc: "Near misses supercharge her lightning damage." },
  },
  {
    key: "sparky", name: "Sparky", h: 981,
    // Powderrunner · Powder Kegs · Hull 90 · 6.3 m/s
    stats: { firepower: 5, durability: 3, speed: 5, handling: 4 },
    ability: { name: "Powder Trail", desc: "Drops kegs in his wake. More speed, bigger blasts." },
  },
  {
    key: "ember", name: "Ember", h: 1077,
    // Firekeeper · Flamethrower · Hull 90 · 6.0 m/s
    stats: { firepower: 5, durability: 3, speed: 4, handling: 3 },
    ability: { name: "Slow Burn", desc: "Hotter burns every level. Burning kills restore Hull." },
  },
];
const DEFAULT_CAPTAIN = "hank";
const MAX_STAT = 6;

/* ----------------------------- BEHAVIOUR -------------------------------- */

(() => {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const img = (key, part) => `/assets/img/captains/${key}-${part}.webp`;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.documentElement.classList.add("js");
  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* ---- toast ---- */
  const toast = $("#toast");
  let toastTimer;
  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("is-shown");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-shown"), 2400);
  }

  /* ---- links ---- */
  $$("[data-link]").forEach((a) => {
    const url = LINKS[a.dataset.link];
    if (url) a.href = url;
  });
  const storeKeys = ["seeker", "apple", "steam", "google"];
  $$(".store").forEach((a, i) => {
    const url = STORES[storeKeys[i]];
    if (url) {
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      a.removeAttribute("data-soon");
      a.setAttribute("aria-label", a.getAttribute("aria-label").replace(" (coming soon)", ""));
    }
  });
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || a.getAttribute("href") !== "#") return;
    e.preventDefault();
    showToast(a.classList.contains("store") ? "Coming soon — stay tuned, matey!" : "Our port opens soon — stay tuned!");
  });

  /* ---- media helper ---- */
  function fillMedia(slot, item, title) {
    if (!item) return;
    slot.textContent = "";
    if (item.embed) {
      const f = document.createElement("iframe");
      f.src = item.embed;
      f.title = title;
      f.loading = "lazy";
      f.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
      f.allowFullscreen = true;
      slot.append(f);
    } else if (item.video) {
      const v = document.createElement("video");
      Object.assign(v, { src: item.video, controls: true, playsInline: true, preload: "metadata" });
      if (item.poster) v.poster = item.poster;
      slot.append(v);
    } else if (item.src) {
      const i = document.createElement("img");
      Object.assign(i, { src: item.src, alt: item.alt || title, loading: "lazy", decoding: "async" });
      slot.append(i);
    }
  }

  if (STORY_VIDEO) {
    const isFile = /\.(mp4|webm|mov)(\?|$)/i.test(STORY_VIDEO);
    fillMedia($("#story-video"), isFile ? { video: STORY_VIDEO } : { embed: STORY_VIDEO }, "Rogue Pirates — Our Story");
  }

  // Promo video: poster + big play button until the first play, then native controls.
  const promo = $("#promo");
  const playBtn = $(".play-btn");
  if (promo && playBtn) {
    const start = () => {
      promo.controls = true;
      playBtn.hidden = true;
      const p = promo.play();
      if (p && p.catch) p.catch(() => { playBtn.hidden = false; promo.controls = false; });
    };
    playBtn.addEventListener("click", start);
    promo.addEventListener("play", () => { playBtn.hidden = true; promo.controls = true; });
    promo.addEventListener("ended", () => { playBtn.hidden = false; });
    // pause when scrolled out of view
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => { if (!en.isIntersecting && !promo.paused) promo.pause(); }, { threshold: 0.2 }).observe(promo);
    }
  }

  /* ---- gameplay carousel ---- */
  const track = $("#gameplay-track");
  const items = GAMEPLAY_MEDIA.length ? GAMEPLAY_MEDIA : Array.from({ length: PLACEHOLDER_SLIDES }, () => null);
  items.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "slide";
    li.setAttribute("role", "group");
    li.setAttribute("aria-roledescription", "slide");
    li.setAttribute("aria-label", `${i + 1} of ${items.length}`);
    const slot = document.createElement("div");
    slot.className = "media-slot";
    slot.innerHTML = '<span class="media-slot__hint">Gameplay coming soon</span>';
    fillMedia(slot, item, `Gameplay ${i + 1}`);
    li.append(slot);
    track.append(li);
  });

  function step(dir) {
    const slide = track.querySelector(".slide");
    if (!slide) return;
    const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
    const w = slide.getBoundingClientRect().width + gap;
    const max = track.scrollWidth - track.clientWidth - 2;
    let target = track.scrollLeft + dir * w;
    if (dir > 0 && track.scrollLeft >= max) target = 0;           // wrap to start
    else if (dir < 0 && track.scrollLeft <= 2) target = max + 2;  // wrap to end
    track.scrollTo({ left: target, behavior: reduceMotion ? "auto" : "smooth" });
  }
  $(".carousel__arrow--prev").addEventListener("click", () => step(-1));
  $(".carousel__arrow--next").addEventListener("click", () => step(1));
  $(".carousel__viewport").addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1); }
    if (e.key === "ArrowRight") { e.preventDefault(); step(1); }
  });

  /* ---- captains ---- */
  const panel = $(".cap-panel");
  const list = $(".cap-list");
  const details = $(".cap-details");
  const charImg = $(".cap-char");
  const nameEl = $(".cap-name");
  const emblemEl = $(".cap-emblem");
  const abilityName = $(".cap-ability__name");
  const abilityDesc = $(".cap-ability__desc");
  const abilityIcon = $(".cap-ability__icon");
  const statRows = $$(".stat");
  const statKeys = ["firepower", "durability", "speed", "handling"];
  const statParts = ["cannon", "shield", "ship", "wheel"];
  let current = null;

  // picker
  list.textContent = "";
  const cards = CAPTAINS.map((c) => {
    const b = document.createElement("button");
    b.className = "cap-card";
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-controls", "cap-details");
    b.setAttribute("aria-selected", "false");
    b.tabIndex = -1;
    b.dataset.key = c.key;
    b.innerHTML = `<img src="${img(c.key, "portrait")}" width="300" height="300" alt="${c.name}">`;
    b.addEventListener("click", () => select(c.key));
    list.append(b);
    return b;
  });
  list.addEventListener("keydown", (e) => {
    const keys = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    let idx = cards.indexOf(document.activeElement);
    if (idx < 0) return;
    if (e.key in keys) idx = (idx + keys[e.key] + cards.length) % cards.length;
    else if (e.key === "Home") idx = 0;
    else if (e.key === "End") idx = cards.length - 1;
    else return;
    e.preventDefault();
    cards[idx].focus();
    select(cards[idx].dataset.key);
  });

  // stat bars
  statRows.forEach((row) => {
    const bar = $(".stat__bar", row);
    bar.textContent = "";
    for (let i = 0; i < MAX_STAT; i++) {
      const s = document.createElement("span");
      s.className = "seg";
      s.style.setProperty("--i", i);
      bar.append(s);
    }
  });

  // Shrink a single-line heading until it fits in `room` px.
  function fitText(el, room) {
    el.style.fontSize = "";
    const w = el.scrollWidth;
    if (w > room && room > 0) {
      const base = parseFloat(getComputedStyle(el).fontSize);
      el.style.fontSize = `${Math.floor(base * (room / w) * 0.98)}px`;
    }
  }

  function fitName() {
    const head = nameEl.parentElement;
    fitText(nameEl, head.clientWidth - emblemEl.offsetWidth - parseFloat(getComputedStyle(head).columnGap || 0));
    const nameStyle = getComputedStyle(abilityName);
    fitText(abilityName, abilityName.parentElement.getBoundingClientRect().right
      - abilityName.getBoundingClientRect().left - parseFloat(nameStyle.marginRight || 0));
  }

  function renderStats(c) {
    statRows.forEach((row, r) => {
      $(".stat__icon", row).src = img(c.key, statParts[r]);
      const value = c.stats[statKeys[r]] ?? 0;
      const bar = $(".stat__bar", row);
      bar.setAttribute("role", "meter");
      bar.setAttribute("aria-valuemin", "0");
      bar.setAttribute("aria-valuemax", String(MAX_STAT));
      bar.setAttribute("aria-valuenow", String(value));
      bar.setAttribute("aria-label", `${statKeys[r]} ${value} of ${MAX_STAT}`);
      bar.style.setProperty("--up", `url(${img(c.key, "up")})`);
      bar.style.setProperty("--down", `url(${img(c.key, "down")})`);
      $$(".seg", bar).forEach((s, i) => s.classList.remove("is-on"));
    });
    // next frame: fill segments so the transition plays
    requestAnimationFrame(() => requestAnimationFrame(() => {
      statRows.forEach((row, r) => {
        const value = CAPTAINS.find((x) => x.key === c.key).stats[statKeys[r]] ?? 0;
        $$(".seg", row).forEach((s, i) => s.classList.toggle("is-on", i < value));
      });
    }));
  }

  function renderText(c) {
    nameEl.textContent = c.name;
    emblemEl.style.setProperty("--emblem", `url(${img(c.key, "emblem")})`);
    abilityName.textContent = c.ability.name;
    abilityDesc.textContent = c.ability.desc;
    abilityIcon.style.setProperty("--emblem", `url(${img(c.key, "emblem")})`);
    if (c.ability.icon) {
      abilityIcon.className = "cap-ability__icon";
      abilityIcon.innerHTML = `<img src="${c.ability.icon}" alt="">`;
    } else {
      abilityIcon.className = "cap-ability__icon cap-ability__icon--emblem";
      abilityIcon.textContent = "";
    }
    fitName();
  }

  function swapCharacter(c) {
    const src = img(c.key, "character");
    const apply = () => {
      charImg.src = src;
      charImg.style.setProperty("--h", c.h);
      charImg.alt = "";
    };
    if (reduceMotion || !current) { apply(); return; }
    charImg.classList.add("is-leaving");
    const pre = new Image();
    pre.src = src;
    const ready = (pre.decode ? pre.decode() : Promise.resolve()).catch(() => {});
    Promise.all([ready, new Promise((r) => setTimeout(r, 180))]).then(() => {
      if (panel.dataset.captain !== c.key) return; // user moved on
      apply();
      charImg.classList.remove("is-leaving");
      charImg.classList.add("is-entering");
      requestAnimationFrame(() => requestAnimationFrame(() => charImg.classList.remove("is-entering")));
    });
  }

  function select(key) {
    if (key === current) return;
    const c = CAPTAINS.find((x) => x.key === key);
    if (!c) return;
    panel.dataset.captain = key;
    cards.forEach((b) => {
      const on = b.dataset.key === key;
      b.classList.toggle("is-active", on);
      b.setAttribute("aria-selected", String(on));
      b.tabIndex = on ? 0 : -1;
    });
    details.setAttribute("aria-label", `Captain ${c.name}`);
    swapCharacter(c);
    renderStats(c);
    if (current && !reduceMotion) {
      details.classList.add("is-swapping");
      setTimeout(() => {
        renderText(c);
        details.classList.remove("is-swapping");
      }, 150);
    } else {
      renderText(c);
    }
    current = key;
  }

  // ?captain=roxie deep-links straight to a captain
  const wanted = new URLSearchParams(location.search).get("captain");
  select(CAPTAINS.some((c) => c.key === wanted) ? wanted : DEFAULT_CAPTAIN);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitName);
  window.addEventListener("resize", fitName);

  // Warm the cache so switching captains is instant.
  const warm = () => CAPTAINS.forEach((c) => {
    ["character", "cannon", "shield", "ship", "wheel", "up", "down", "emblem"].forEach((p) => { new Image().src = img(c.key, p); });
  });
  if ("requestIdleCallback" in window) requestIdleCallback(warm, { timeout: 4000 });
  else setTimeout(warm, 2500);

  /* ---- scroll reveal ---- */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) {
          en.target.classList.add("is-visible");
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: "0px 0px -4% 0px", threshold: 0.05 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }
})();
