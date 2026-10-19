(() => {
  const SITE = window.SITE || {};
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /* ───────── typing ───────── */

  const GLYPHS = "$%^#@&*!?/\\<>{}[]=+~";
  const glyph = () => GLYPHS[(Math.random() * GLYPHS.length) | 0];

  // types `text` into `el` as flickering gibberish ($%^#@...), slow at first
  // and speeding up, then snaps each character to the real word once it's
  // fully typed. starting a new one on the same element cancels the old one.
  //   slow / fast → ms per character at the start / end of typing
  //   hold        → pause on the full gibberish before it resolves
  //   resolve     → ms between each character turning into the real letter
  function typeOut(el, text, { slow = 170, fast = 45, hold = 140, resolve = 28 } = {}) {
    const run = (el._typeRun = (el._typeRun || 0) + 1);
    if (reduceMotion) { el.textContent = text; return Promise.resolve(); }

    const n = text.length;
    const at = [];
    let t = 0;
    for (let i = 0; i < n; i++) {
      const k = n > 1 ? i / (n - 1) : 1;
      t += fast + (slow - fast) * (1 - k) ** 2; // ease: slow → fast
      at.push(t);
    }
    const typedEnd = t + hold;

    return new Promise((done) => {
      const start = performance.now();
      let junk = [], lastShuffle = -1;
      el.textContent = "";

      const frame = (now) => {
        if (el._typeRun !== run) return done();
        const e = now - start;
        let typed = 0;
        while (typed < n && at[typed] <= e) typed++;
        const resolved = e < typedEnd ? 0 : Math.floor((e - typedEnd) / resolve) + 1;

        const shuffle = Math.floor(e / 60);
        if (shuffle !== lastShuffle) { junk = Array.from({ length: n }, glyph); lastShuffle = shuffle; }

        let out = "";
        for (let i = 0; i < typed; i++) out += i < resolved || text[i] === " " ? text[i] : junk[i];
        el.textContent = out;

        if (resolved >= n) { el.textContent = text; return done(); }
        requestAnimationFrame(frame);
      };
      requestAnimationFrame(frame);
    });
  }

  // retypes an element's text whenever `trigger` is hovered or focused.
  // an invisible copy holds the width so nothing shifts while typing.
  function typer(el, trigger = el) {
    const text = el.textContent.trim();
    el.classList.add("type");
    el.textContent = "";
    const ghost = Object.assign(document.createElement("span"), { className: "t-ghost", textContent: text });
    const live = Object.assign(document.createElement("span"), { className: "t-live", textContent: text });
    el.append(ghost, live);

    const run = () => typeOut(live, text, { slow: 320, fast: 130, hold: 260, resolve: 75 });
    trigger.addEventListener("mouseenter", run);
    trigger.addEventListener("focus", run);
    return run;
  }

  /* ───────── reviews ───────── */

  const reviews = SITE.reviews || [];
  const reviewsList = $("#reviews-list");
  reviews.forEach((r) => {
    const li = document.createElement("li");
    li.className = "review";
    const el = (tag, cls, text) => {
      const n = Object.assign(document.createElement(tag), { className: cls, textContent: text });
      return n;
    };
    if (r.stars) {
      const n = Math.min(Math.max(Math.round(r.stars), 0), 5);
      const stars = el("span", "review-stars", "★".repeat(n) + "☆".repeat(5 - n));
      stars.setAttribute("aria-label", `${n} out of 5`);
      li.append(stars);
    }
    li.append(el("p", "review-text", r.text || ""));
    const who = el("p", "review-who", "");
    who.append(el("span", "review-name", `— ${r.name || "anonymous"}`));
    if (r.project) who.append(el("span", "review-project", r.project));
    li.append(who);
    reviewsList.append(li);
  });
  if (!reviews.length) {
    reviewsList.append(Object.assign(document.createElement("li"), { className: "review-empty", textContent: "no reviews yet_" }));
  }
  $("#reviews-count").textContent = `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}`;

  /* ───────── inquiries form ───────── */

  const inq = $("#inq");
  const inqLabel = $("#inq-label");
  const inqStatus = $("#inq-status");
  const inqBtn = $(".inq-send", inq);
  const inqCfg = SITE.inquiries || {};
  const discord = (SITE.elsewhere || []).find((c) => c.label === "discord")?.handle;

  // message box grows as you type
  const msg = inq.elements.message;
  const grow = () => { msg.style.height = "auto"; msg.style.height = `${msg.scrollHeight}px`; };
  msg.addEventListener("input", grow);

  // the message box placeholder types out example site ideas, one after another
  const IDEAS = [
    "a portfolio to show off my art...",
    "a landing page for my clothing brand drop...",
    "a page for my music with a player built in...",
    "a menu + hours site for my food spot...",
  ];
  if (!reduceMotion) {
    (async () => {
      for (let n = 0; ; n = (n + 1) % IDEAS.length) {
        const idea = IDEAS[n];
        for (let i = 1; i <= idea.length; i++) { msg.placeholder = idea.slice(0, i); await wait(40 + Math.random() * 35); }
        await wait(2200);
        for (let i = idea.length; i >= 0; i--) { msg.placeholder = idea.slice(0, i); await wait(14); }
        await wait(350);
      }
    })();
  }

  // "something else" chip: picking it opens a text box, and whatever they
  // type becomes the site type that gets sent
  const otherRadio = $("#other-radio");
  const otherText = $("#other-text");
  const syncOther = () => {
    const typed = otherText.value.trim();
    otherRadio.value = typed ? `something else: ${typed}` : "something else";
  };
  $$('input[name="site_type"]', inq).forEach((r) =>
    r.addEventListener("change", () => { if (otherRadio.checked) setTimeout(() => otherText.focus(), 0); })
  );
  otherText.addEventListener("input", syncOther);
  otherText.addEventListener("focus", () => { otherRadio.checked = true; });
  otherText.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); msg.focus(); } });

  // "how should i contact you?" — the box under the chips changes to match
  const contactInput = $("#contact-input");
  const CONTACT = {
    email:     { type: "email", name: "email",   placeholder: "you@example.com",        autocomplete: "email" },
    instagram: { type: "text",  name: "contact", placeholder: "@yourhandle",            autocomplete: "off" },
    text:      { type: "tel",   name: "contact", placeholder: "(555) 555-5555",         autocomplete: "tel" },
    other:     { type: "text",  name: "contact", placeholder: "the app + your username", autocomplete: "off" },
  };
  $$('input[name="contact_method"]', inq).forEach((r) =>
    r.addEventListener("change", () => {
      Object.assign(contactInput, CONTACT[r.value]);
      contactInput.value = "";
      contactInput.closest(".field").classList.remove("is-bad");
      contactInput.focus();
    })
  );

  const status = (text, isError = false) => {
    inqStatus.textContent = text;
    inqStatus.classList.toggle("is-error", isError);
  };

  // clear the red state as soon as a field is fixed
  $$(".field > input, .field > textarea", inq).forEach((f) =>
    f.addEventListener("input", () => { if (f.checkValidity()) f.closest(".field").classList.remove("is-bad"); })
  );

  inq.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (inq.elements._honey.value) return; // bot

    let firstBad = null;
    $$(".field > input, .field > textarea", inq).forEach((f) => {
      const bad = !f.value.trim() || !f.checkValidity();
      f.closest(".field").classList.toggle("is-bad", bad);
      if (bad && !firstBad) firstBad = f;
    });
    if (firstBad) {
      firstBad.focus();
      return status(firstBad.type === "email" && firstBad.value ? "that email doesn't look right." : "fill in every field first.", true);
    }

    const name = inq.elements.name.value.trim();
    const method = inq.elements.contact_method.value;
    const contact = contactInput.value.trim();
    const message = msg.value.trim();

    if (inqCfg.endpoint && location.protocol === "file:") {
      // formsubmit rejects pages opened straight from the computer
      status("the form only sends once the site is online (or run through a local server).", true);
    } else if (inqCfg.endpoint) {
      inqBtn.disabled = true;
      status("");
      typeOut(inqLabel, "sending...", { slow: 90, fast: 30, hold: 60, resolve: 18 });
      try {
        // formsubmit only accepts json (plain form data gets a server error)
        const data = Object.fromEntries(new FormData(inq));
        delete data._honey;
        const res = await fetch(inqCfg.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(data),
        });
        const reply = await res.json().catch(() => ({}));
        if (!res.ok || String(reply.success) === "false") throw new Error(reply.message || res.status);
        inq.reset();
        syncOther();
        Object.assign(contactInput, CONTACT.email);
        grow();
        inqBtn.classList.add("is-sent");
        typeOut(inqLabel, "sent", { slow: 90, fast: 30, hold: 60, resolve: 18 });
        status("got it. i'll get back to you soon.");
        setTimeout(() => {
          inqBtn.classList.remove("is-sent");
          inqBtn.disabled = false;
          typeOut(inqLabel, "send inquiry");
        }, 4000);
      } catch {
        inqBtn.disabled = false;
        typeOut(inqLabel, "send inquiry", { slow: 90, fast: 30, hold: 60, resolve: 18 });
        status(`couldn't send that. try again${discord ? ` or message me on discord: ${discord}` : ""}.`, true);
      }
    } else if (inqCfg.email) {
      const siteType = inq.elements.site_type.value;
      const subject = `website inquiry from ${name}${siteType ? ` (${siteType})` : ""}`;
      const body = `${siteType ? `site type: ${siteType}\n\n` : ""}${message}\n\n— ${name}\ncontact me ${method === "other" ? "here" : `on ${method}`}: ${contact}`;
      location.href = `mailto:${inqCfg.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      status("opening your email app...");
    } else {
      status(`inquiries aren't hooked up yet${discord ? ` — message me on discord: ${discord}` : ""}.`, true);
    }
  });

  /* ───────── elsewhere list ───────── */

  const elsewhereList = $("#elsewhere-list");
  (SITE.elsewhere || []).forEach((c, i) => {
    const a = document.createElement("a");
    a.className = "work-row connect-row";
    const cell = (cls, text) => {
      const s = Object.assign(document.createElement("span"), { className: cls, textContent: text });
      a.append(s);
      return s;
    };
    cell("w-num", String(i + 1).padStart(2, "0"));
    const label = cell("w-name", c.label || "");
    cell("w-kind", c.handle || "");
    const go = cell("w-go", c.url ? "open ↗" : c.copy ? "copy" : "soon");
    typer(label, a);

    if (c.url) {
      a.href = c.url;
      if (!c.url.startsWith("mailto:")) { a.target = "_blank"; a.rel = "noopener"; }
    } else if (c.copy) {
      a.href = "#";
      let reset;
      a.addEventListener("click", async (e) => {
        e.preventDefault();
        try {
          await navigator.clipboard.writeText(c.copy);
          go.textContent = "copied ✓";
        } catch {
          go.textContent = c.copy; // clipboard blocked — at least show it
        }
        clearTimeout(reset);
        reset = setTimeout(() => (go.textContent = "copy"), 1800);
      });
    } else {
      a.setAttribute("aria-disabled", "true");
      a.tabIndex = 0;
    }

    const li = document.createElement("li");
    li.append(a);
    elsewhereList.append(li);
  });

  /* ───────── custom background ───────── */

  const bg = SITE.background || {};
  if (bg.video) {
    const v = Object.assign(document.createElement("video"), {
      src: bg.video, autoplay: true, muted: true, loop: true, playsInline: true,
    });
    $(".bg-media").append(v);
  } else if (bg.image) {
    const img = Object.assign(new Image(), { src: bg.image, alt: "" });
    $(".bg-media").append(img);
  }

  /* ───────── work list ───────── */

  const list = $("#work-list");
  const work = SITE.work || [];
  const peek = $("#peek");
  const peekImg = $("#peek-img");
  const peekFallback = $("#peek-fallback");
  const peekCap = $("#peek-cap");

  const host = (url) => {
    try { return new URL(url).host.replace(/^www\./, ""); } catch { return url; }
  };

  function showPeek(p, i) {
    peekFallback.textContent = p.name;
    peekFallback.style.setProperty("--h", (i * 67 + 25) % 360);
    if (p.image) {
      peekImg.src = p.image;
      peekImg.hidden = false;
      peekFallback.hidden = true;
    } else {
      peekImg.hidden = true;
      peekFallback.hidden = false;
    }
    peekCap.textContent = p.url ? host(p.url) + " ↗" : "link coming soon";
    peek.classList.add("is-on");
  }
  peekImg.addEventListener("error", () => {
    peekImg.hidden = true;
    peekFallback.hidden = false;
  });

  work.forEach((p, i) => {
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.className = "work-row";
    if (p.url) {
      a.href = p.url;
      a.target = "_blank";
      a.rel = "noopener";
    } else {
      a.setAttribute("aria-disabled", "true");
      a.tabIndex = 0;
    }

    const cell = (cls, text) => {
      const s = document.createElement("span");
      s.className = cls;
      s.textContent = text;
      a.append(s);
      return s;
    };
    cell("w-num", String(i + 1).padStart(2, "0"));
    const name = cell("w-name", p.name || "untitled");
    cell("w-kind", p.kind || "");
    cell("w-year", p.year || "");
    cell("w-go", p.url ? "visit ↗" : "soon");

    typer(name, a);
    a.addEventListener("mouseenter", () => showPeek(p, i));
    a.addEventListener("mouseleave", () => peek.classList.remove("is-on"));

    li.append(a);
    list.append(li);
  });
  $("#work-count").textContent = `${work.length} ${work.length === 1 ? "entry" : "entries"}`;

  // preview follows the cursor with a little lag
  let mx = innerWidth / 2, my = innerHeight / 2, px = mx, py = my;
  addEventListener("mousemove", (e) => { mx = e.clientX; my = e.clientY; });
  (function followPeek() {
    px += (mx - px) * 0.14;
    py += (my - py) * 0.14;
    const w = peek.offsetWidth || 280;
    const x = px + 28 + w > innerWidth ? px - w - 28 : px + 28;
    const y = Math.min(Math.max(py - 110, 12), innerHeight - (peek.offsetHeight || 250) - 12);
    peek.style.transform = `translate(${x}px, ${y}px)`;
    requestAnimationFrame(followPeek);
  })();

  /* ───────── hover typing on nav + back links ───────── */

  $$(".nav a, .back").forEach((el) => typer(el));

  /* ───────── views (#work, #day, ...) ───────── */

  const views = $$(".view");
  const names = views.map((v) => v.dataset.view);

  function route() {
    const want = location.hash.slice(1);
    const name = names.includes(want) ? want : "home";
    views.forEach((v) => v.classList.toggle("is-active", v.dataset.view === name));
    document.body.dataset.view = name;
    peek.classList.remove("is-on");
    scrollTo(0, 0);
  }
  addEventListener("hashchange", route);
  route();

  $$(".back").forEach((a) => a.addEventListener("click", (e) => {
    e.preventDefault();
    history.pushState(null, "", location.pathname);
    route();
  }));

  addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.body.dataset.view !== "home") $(".back").click();
  });

  /* ───────── intro ───────── */

  // the title lines start empty and type in once the visitor enters
  const introEls = [$("#kicker"), $("#title-text"), $("#sub")];
  const introText = introEls.map((el) => el.textContent);
  introEls.forEach((el) => (el.textContent = ""));

  async function runIntro() {
    const [kicker, title, sub] = introEls;
    const [k, t, s] = introText;
    await wait(250);
    await typeOut(kicker, k, { slow: 120, fast: 25, hold: 80, resolve: 18 });
    await typeOut(title, t, { slow: 420, fast: 220, hold: 380, resolve: 110 });
    await wait(150);
    await typeOut(sub, s, { slow: 110, fast: 22, hold: 100, resolve: 16 });
  }

  /* ───────── click to enter ───────── */
  // browsers only allow sound after a click, so the site opens behind a
  // black screen. clicking it starts the music and fades into the site.

  const gate = $("#gate");
  const gateText = $("#gate-text");
  let entered = false;

  function enter() {
    if (entered) return;
    entered = true;
    play();
    gate.classList.add("is-leaving");
    document.body.classList.remove("is-gated");
    runIntro();
    setTimeout(() => gate.remove(), 1200);
  }

  // the menu + player fade in once, on entering. after that, drop the fade
  // so coming back to the home page shows them straight away.
  $$(".reveal").forEach((el) =>
    el.addEventListener("animationend", () => el.classList.remove("reveal"), { once: true })
  );

  gate.addEventListener("click", enter);
  addEventListener("keydown", (e) => {
    if (!entered && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); enter(); }
  });

  (async () => {
    await wait(300);
    await typeOut(gateText, gateText.dataset.text, { slow: 160, fast: 45, hold: 220, resolve: 45 });
    gate.classList.add("is-ready");
  })();

  /* ───────── music player ───────── */

  const player = $("#player");
  const tracks = SITE.tracks?.length ? SITE.tracks : [{ title: "placeholders", artist: "", src: "" }];
  const audio = new Audio();
  audio.preload = "metadata";

  const titleEl = $("#p-title"), artistEl = $("#p-artist");
  const wave = $("#p-wave"), cur = $("#p-cur"), dur = $("#p-dur");
  let idx = 0, flashTimer;

  // waveform bars — shape is generated from the track title so each song
  // gets its own consistent look. the accent copy on top is clipped to show progress.
  const BARS = 42;
  function drawWave(seedText) {
    let seed = 0;
    for (const ch of seedText) seed = (seed * 31 + ch.charCodeAt(0)) >>> 0;
    const rand = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32);
    const bars = Array.from({ length: BARS }, (_, i) => {
      const k = i / (BARS - 1);
      const envelope = 0.45 + 0.55 * Math.sin(Math.PI * k) ** 0.6; // quieter at the edges
      const h = Math.max(0.12, envelope * (0.35 + 0.65 * rand()));
      return `<i style="--h:${h.toFixed(3)};--d:${(-rand() * 1.2).toFixed(2)}s;--dur:${(0.5 + rand() * 0.7).toFixed(2)}s"></i>`;
    }).join("");
    $$(".wave-bars", wave).forEach((layer) => (layer.innerHTML = bars));
  }
  const setProgress = (pct) => {
    wave.style.setProperty("--p", `${pct}%`);
    wave.setAttribute("aria-valuenow", Math.round(pct));
  };

  const fmt = (sec) => {
    if (!isFinite(sec)) return "0:00";
    const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  function flash(msg) {
    clearTimeout(flashTimer);
    artistEl.textContent = msg;
    flashTimer = setTimeout(() => { artistEl.textContent = tracks[idx].artist || ""; }, 2800);
  }

  function load(i, autoplay = false) {
    idx = (i + tracks.length) % tracks.length;
    const t = tracks[idx];
    typeOut(titleEl, t.title || "untitled", { slow: 120, fast: 30, hold: 90, resolve: 20 });
    artistEl.textContent = t.artist || "";
    drawWave(t.title || "untitled");
    setProgress(0);
    cur.textContent = dur.textContent = "0:00";
    if (t.src) {
      audio.src = t.src;
      if (autoplay) play();
    } else {
      audio.removeAttribute("src");
      audio.load();
    }
  }

  // if a song's file is missing, skip ahead instead of going silent
  // (tries each track once, so a list of all-missing files can't loop forever)
  let wantPlay = false, misses = 0;
  function skipMissing() {
    if (!wantPlay) return; // only matters once someone's trying to listen
    flash("track not found");
    if (++misses < tracks.length) setTimeout(() => load(idx + 1, true), 1200);
  }

  function play() {
    wantPlay = true;
    // no file, or it already failed to load before anyone pressed play
    if (!tracks[idx].src || audio.error) return skipMissing();
    audio.play().catch(() => {}); // a missing file is handled by the error listener below
  }

  $("#p-play").addEventListener("click", () => {
    if (audio.paused) play();
    else { wantPlay = false; audio.pause(); }
  });
  $("#p-prev").addEventListener("click", () => {
    if (audio.currentTime > 3) audio.currentTime = 0;
    else load(idx - 1, !audio.paused);
  });
  $("#p-next").addEventListener("click", () => load(idx + 1, !audio.paused));

  audio.addEventListener("play", () => {
    misses = 0;
    player.classList.add("is-playing");
    $("#p-play").setAttribute("aria-label", "pause");
  });
  audio.addEventListener("pause", () => {
    player.classList.remove("is-playing");
    $("#p-play").setAttribute("aria-label", "play");
  });
  audio.addEventListener("loadedmetadata", () => { dur.textContent = fmt(audio.duration); });
  audio.addEventListener("timeupdate", () => {
    setProgress((audio.currentTime / audio.duration) * 100 || 0);
    cur.textContent = fmt(audio.currentTime);
  });
  audio.addEventListener("ended", () => load(idx + 1, true));
  audio.addEventListener("error", () => { if (tracks[idx].src) skipMissing(); });

  const waveFraction = (e) => {
    const r = wave.getBoundingClientRect();
    return Math.min(Math.max((e.clientX - r.left) / r.width, 0), 1);
  };
  wave.addEventListener("mousemove", (e) => wave.style.setProperty("--hover", `${waveFraction(e) * 100}%`));
  wave.addEventListener("click", (e) => {
    if (!isFinite(audio.duration)) return;
    audio.currentTime = waveFraction(e) * audio.duration;
  });
  wave.addEventListener("keydown", (e) => {
    if (!isFinite(audio.duration)) return;
    if (e.key === "ArrowRight") audio.currentTime = Math.min(audio.currentTime + 5, audio.duration);
    if (e.key === "ArrowLeft") audio.currentTime = Math.max(audio.currentTime - 5, 0);
  });

  /* volume */

  const volBox = $("#vol"), volTicks = $("#vol-ticks"), volNum = $("#vol-num");
  const TICKS = 18;
  volTicks.innerHTML = Array.from({ length: TICKS }, (_, i) => `<i style="--k:${(i / (TICKS - 1)).toFixed(3)}"></i>`).join("");
  const tickEls = $$("i", volTicks);

  let volume = 0.06, muted = false; // starting volume for first-time visitors (6)
  try {
    const saved = parseFloat(localStorage.getItem("day-volume"));
    if (saved >= 0 && saved <= 1) volume = saved;
  } catch {}

  function applyVolume() {
    audio.volume = volume;
    audio.muted = muted || volume === 0;
    const silent = audio.muted;
    const lit = Math.round(volume * TICKS);
    tickEls.forEach((t, i) => t.classList.toggle("on", i < lit));
    volNum.textContent = silent ? "off" : Math.round(volume * 100);
    volBox.classList.toggle("is-muted", silent);
    volBox.classList.toggle("is-low", !silent && volume < 0.4);
    volTicks.setAttribute("aria-valuenow", Math.round(volume * 100));
    $("#vol-btn").setAttribute("aria-label", silent ? "unmute" : "mute");
    try { localStorage.setItem("day-volume", volume); } catch {}
  }
  const setVolume = (v) => {
    volume = Math.min(Math.max(v, 0), 1);
    if (volume > 0) muted = false;
    applyVolume();
  };

  const volFromPointer = (e) => {
    const r = volTicks.getBoundingClientRect();
    setVolume(Math.ceil(((e.clientX - r.left) / r.width) * TICKS) / TICKS);
  };
  volTicks.addEventListener("pointerdown", (e) => {
    volTicks.setPointerCapture(e.pointerId);
    volFromPointer(e);
  });
  volTicks.addEventListener("pointermove", (e) => {
    if (volTicks.hasPointerCapture(e.pointerId)) volFromPointer(e);
  });
  volTicks.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); setVolume(volume + 0.05); }
    if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); setVolume(volume - 0.05); }
  });
  $("#vol-btn").addEventListener("click", () => {
    if (muted || volume === 0) { muted = false; if (volume === 0) volume = 0.5; }
    else muted = true;
    applyVolume();
  });
  applyVolume();

  drawWave(tracks[0].title || "untitled");
  titleEl.textContent = tracks[0].title;
  artistEl.textContent = tracks[0].artist || "";
  if (tracks[0].src) audio.src = tracks[0].src;

  /* ───────── footer clock ───────── */

  $("#year").textContent = new Date().getFullYear();
  const tick = () => {
    $("#clock").textContent = new Date()
      .toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
      .toLowerCase();
  };
  tick();
  setInterval(tick, 15000);

  /* ───────── rain ───────── */

  if (SITE.scene?.rain !== false && !reduceMotion) {
    const canvas = $(".rain");
    const ctx = canvas.getContext("2d");
    let W, H, dpr, drops = [];

    const drop = (anywhere) => ({
      x: Math.random() * W * 1.2 - W * 0.1,
      y: anywhere ? Math.random() * H : -20 * dpr,
      l: (10 + Math.random() * 20) * dpr,
      v: (7 + Math.random() * 9) * dpr,
      a: 0.04 + Math.random() * 0.1,
    });

    function size() {
      dpr = Math.min(devicePixelRatio || 1, 2);
      W = canvas.width = innerWidth * dpr;
      H = canvas.height = innerHeight * dpr;
      drops = Array.from({ length: Math.round(innerWidth / 12) }, () => drop(true));
    }
    size();
    addEventListener("resize", size);

    (function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = dpr;
      for (const d of drops) {
        ctx.strokeStyle = `rgba(200, 212, 235, ${d.a})`;
        ctx.beginPath();
        ctx.moveTo(d.x, d.y);
        ctx.lineTo(d.x + d.l * 0.12, d.y + d.l);
        ctx.stroke();
        d.y += d.v;
        d.x += d.v * 0.12;
        if (d.y > H) Object.assign(d, drop(false));
      }
      requestAnimationFrame(draw);
    })();
  }
})();
