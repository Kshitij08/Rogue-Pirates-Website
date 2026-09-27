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

// Browser version (Unity WebGL build served from /play/). Flip `live` to true when the build is up:
// the "Coming soon" badges disappear and the buttons read "Play now".
const PLAY = {
  url: "/play/",
  live: false,
};

// Gameplay carousel. Each item: { src, srcset?, alt } for images,
// { video: "/assets/video/clip.mp4", poster: "…" } or { embed: "https://www.youtube.com/embed/…" }.
// While empty, PLACEHOLDER_SLIDES dark cards are shown.
const shot = (n, alt, w = 1600) => ({
  src: `/assets/img/gameplay/${n}-1600.webp`,
  srcset: `/assets/img/gameplay/${n}-800.webp 800w, /assets/img/gameplay/${n}-1600.webp ${w}w`,
  alt,
});
const GAMEPLAY_MEDIA = [
  shot("01", "Rook's ship blasts a ring of fire through an enemy fleet"),
  shot("02", "Critical hits land on a giant red sea beast near the islands", 1280),
  shot("03", "A PvP duel between two pirate ships on a blood-red sea"),
  shot("04", "A laser beam sweeps across a green sea full of loot"),
  shot("05", "Captain Richie fights a sea monster among palm-covered islands"),
  shot("06", "Sailing past islands while dodging a swarm of enemy boats", 1280),
  shot("07", "Lightning and cannon fire light up a coastal battle", 1280),
  shot("08", "Fire and cannonballs fly in a night battle on a red sea"),
  shot("09", "Racing rival ships across an emerald sea"),
];
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
  $$("[data-store]").forEach((a) => {
    const url = STORES[a.dataset.store];
    if (url) {
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener";
      a.setAttribute("aria-label", a.getAttribute("aria-label").replace(" (coming soon)", ""));
    }
  });
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a || a.getAttribute("href") !== "#") return;
    e.preventDefault();
    showToast(a.dataset.store ? "Coming soon — stay tuned, matey!" : "Our port opens soon — stay tuned!");
  });

  /* ---- browser version ---- */
  $$("[data-play]").forEach((a) => { a.href = PLAY.url; });
  if (PLAY.live) {
    $$("[data-play-soon]").forEach((el) => el.remove());
    $$("[data-play-label]").forEach((el) => { el.textContent = "Play now"; });
    $$(".platform--web").forEach((a) => a.setAttribute("aria-label", "Play in your web browser"));
  }

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
      if (item.srcset) {
        i.srcset = item.srcset;
        i.sizes = "(max-width: 899px) 90vw, 46vw";
      }
      slot.append(i);
    }
  }

  if (STORY_VIDEO) {
    const isFile = /\.(mp4|webm|mov)(\?|$)/i.test(STORY_VIDEO);
    fillMedia($("#story-video"), isFile ? { video: STORY_VIDEO } : { embed: STORY_VIDEO }, "Rogue Pirates — Our Story");
  }

  /* ---- promo video: themed controls ---- */
  const player = $(".player");
  const promo = $("#promo");
  if (player && promo && !STORY_VIDEO) {
    const playBtn = $(".play-btn", player);
    const bar = $(".player__bar", player);
    const seek = $(".player__seek", player);
    const time = $(".player__time", player);
    const fmt = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
    let idleTimer;

    const wake = () => {
      player.classList.remove("is-idle");
      clearTimeout(idleTimer);
      if (!promo.paused) idleTimer = setTimeout(() => player.classList.add("is-idle"), 2200);
    };
    const toggle = () => {
      if (promo.paused || promo.ended) {
        const p = promo.play();
        if (p && p.catch) p.catch(() => {});
      } else {
        promo.pause();
      }
    };

    playBtn.addEventListener("click", toggle);
    promo.addEventListener("click", toggle);
    $(".pbtn--toggle", player).addEventListener("click", toggle);
    $(".pbtn--mute", player).addEventListener("click", () => { promo.muted = !promo.muted; });
    $(".pbtn--fs", player).addEventListener("click", () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (player.requestFullscreen) player.requestFullscreen().catch(() => {});
      else if (promo.webkitEnterFullscreen) promo.webkitEnterFullscreen(); // iPhone
    });

    promo.addEventListener("play", () => {
      playBtn.hidden = true;
      bar.hidden = false;
      player.classList.remove("is-paused");
      $(".pbtn--toggle", player).setAttribute("aria-label", "Pause");
      wake();
    });
    promo.addEventListener("pause", () => {
      player.classList.add("is-paused");
      $(".pbtn--toggle", player).setAttribute("aria-label", "Play");
      wake();
    });
    promo.addEventListener("ended", () => {
      playBtn.hidden = false;
      bar.hidden = true;
    });
    promo.addEventListener("volumechange", () => {
      player.classList.toggle("is-muted", promo.muted);
      $(".pbtn--mute", player).setAttribute("aria-label", promo.muted ? "Unmute" : "Mute");
    });
    promo.addEventListener("timeupdate", () => {
      const d = promo.duration || 0;
      const pct = d ? (promo.currentTime / d) * 100 : 0;
      seek.value = String(Math.round(pct * 10));
      seek.style.setProperty("--p", `${pct}%`);
      time.textContent = fmt(promo.currentTime);
    });
    seek.addEventListener("input", () => {
      if (promo.duration) promo.currentTime = (seek.value / 1000) * promo.duration;
      seek.style.setProperty("--p", `${seek.value / 10}%`);
    });
    ["pointermove", "pointerdown", "focusin"].forEach((ev) => player.addEventListener(ev, wake));
    player.addEventListener("pointerleave", () => { if (!promo.paused) player.classList.add("is-idle"); });

    // pause when scrolled out of view
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([en]) => { if (!en.isIntersecting && !promo.paused) promo.pause(); }, { threshold: 0.25 }).observe(player);
    }
  }

  /* ---- gameplay carousel: one slide at a time ---- */
  const track = $("#gameplay-track");
  const dotsWrap = $("#gameplay-dots");
  const items = GAMEPLAY_MEDIA.length ? GAMEPLAY_MEDIA : Array.from({ length: PLACEHOLDER_SLIDES }, () => null);
  const dots = [];
  items.forEach((item, i) => {
    const li = document.createElement("li");
    li.className = "slide";
    li.setAttribute("role", "group");
    li.setAttribute("aria-roledescription", "slide");
    li.setAttribute("aria-label", `${i + 1} of ${items.length}`);
    const slot = document.createElement("div");
    slot.className = "media-slot";
    slot.innerHTML = `<span class="media-slot__hint"><b>${String(i + 1).padStart(2, "0")}</b>Gameplay footage coming soon</span>`;
    fillMedia(slot, item, `Gameplay ${i + 1}`);
    li.append(slot);
    track.append(li);

    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `Show slide ${i + 1}`);
    dot.addEventListener("click", () => go(i));
    dotsWrap.append(dot);
    dots.push(dot);
  });

  let slideIndex = 0;
  function markDot() {
    dots.forEach((d, i) => d.setAttribute("aria-current", String(i === slideIndex)));
  }
  function go(i, smooth = !reduceMotion) {
    slideIndex = (i + items.length) % items.length;
    track.scrollTo({ left: slideIndex * track.clientWidth, behavior: smooth ? "smooth" : "auto" });
    markDot();
  }
  let scrollTimer;
  track.addEventListener("scroll", () => {
    clearTimeout(scrollTimer);
    scrollTimer = setTimeout(() => {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      if (i !== slideIndex) { slideIndex = i; markDot(); }
    }, 80);
  }, { passive: true });
  window.addEventListener("resize", () => go(slideIndex, false));
  $(".carousel__arrow--prev").addEventListener("click", () => go(slideIndex - 1));
  $(".carousel__arrow--next").addEventListener("click", () => go(slideIndex + 1));
  track.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") { e.preventDefault(); go(slideIndex - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); go(slideIndex + 1); }
  });
  markDot();

  /* ---- captains ---- */
  const panel = $("#captains");
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

  /* ---- top bar + section dots ---- */
  const nav = $("#nav");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 40);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  if ("IntersectionObserver" in window) {
    const navIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        const id = en.target.id;
        $$("[data-nav]").forEach((a) => {
          const on = a.dataset.nav === id;
          a.classList.toggle("is-active", on);
          if (on) a.setAttribute("aria-current", "true");
          else a.removeAttribute("aria-current");
        });
      });
    }, { threshold: 0.55 });
    $$(".sec").forEach((sec) => navIO.observe(sec));
  }

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
    }, { threshold: 0.15 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }
})();
