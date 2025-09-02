// Mobile nav toggle
const btn = document.querySelector(".nav-toggle");
const menu = document.getElementById("menu");
btn?.addEventListener("click", () => {
  const open = menu.classList.toggle("open");
  btn.setAttribute("aria-expanded", open ? "true" : "false");
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const id = a.getAttribute("href").slice(1);
    const el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  });
});

// Current year in footer
document.getElementById("year").textContent = new Date().getFullYear();

// ======= Schedule / Calendar =======

// Catalog of classes with start dates and weekly recurrence (0=Sun ... 6=Sat)
const CLASS_CATALOG = [
  {
    key: "japanese",
    name: "Japanese Yoga (Signature)",
    startDate: "2025-09-08", // Mon
    weekly: [
      { weekday: 1, time: "07:30", location: "London" },
      { weekday: 3, time: "18:30", location: "Tokyo" },
      { weekday: 6, time: "09:00", location: "Online" },
    ],
  },
  {
    key: "hatha",
    name: "Hatha Basics",
    startDate: "2025-09-02", // Tue
    weekly: [
      { weekday: 2, time: "08:00", location: "Online" },
      { weekday: 4, time: "17:30", location: "London" },
    ],
  },
  {
    key: "vinyasa",
    name: "Vinyasa Flow",
    startDate: "2025-09-03", // Wed
    weekly: [
      { weekday: 3, time: "07:00", location: "Online" },
      { weekday: 5, time: "18:00", location: "Tokyo" },
    ],
  },
  {
    key: "yin",
    name: "Yin & Stretch",
    startDate: "2025-09-04", // Thu
    weekly: [
      { weekday: 4, time: "19:00", location: "Online" },
      { weekday: 0, time: "10:30", location: "London" }, // Sun
    ],
  },
  {
    key: "restorative",
    name: "Restorative",
    startDate: "2025-09-05", // Fri
    weekly: [
      { weekday: 5, time: "19:30", location: "London" },
      { weekday: 1, time: "20:00", location: "Online" },
    ],
  },
  {
    key: "prenatal",
    name: "Prenatal",
    startDate: "2025-09-06", // Sat
    weekly: [{ weekday: 6, time: "11:00", location: "Tokyo" }],
  },
  {
    key: "private",
    name: "Private 1:1",
    startDate: "2025-09-02",
    weekly: [{ weekday: 2, time: "12:30", location: "By request (Online)" }],
  },
  {
    key: "workshop",
    name: "Workshop: Japanese Breathwork",
    startDate: "2025-09-14", // Sun workshop anchor
    // Example: first workshop appears on/after startDate on Sundays at 14:00 (monthly feel kept simple here)
    weekly: [{ weekday: 0, time: "14:00", location: "Online" }],
  },
];

// Write start dates into the legend
(function populateStartDates() {
  const fmt = (d) =>
    new Date(d + "T00:00:00").toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  const byKey = Object.fromEntries(
    CLASS_CATALOG.map((c) => [c.key, c.startDate])
  );
  const ids = {
    japanese: "start-japanese",
    hatha: "start-hatha",
    vinyasa: "start-vinyasa",
    yin: "start-yin",
    restorative: "start-restorative",
    prenatal: "start-prenatal",
    private: "start-private",
    workshop: "start-workshop",
  };
  Object.entries(ids).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (el && byKey[k]) el.textContent = fmt(byKey[k]);
  });
})();

// Calendar state
let calRef = (function getFirstOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
})();

// Render calendar
function renderCalendar() {
  const titleEl = document.getElementById("cal-title");
  const cellsWrap = document.getElementById("cal-cells");
  if (!titleEl || !cellsWrap) return;

  // Title
  titleEl.textContent = calRef.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  // Build the 6x7 grid (42 days), starting from the Sunday before (or on) the first of the month
  const firstDay = new Date(calRef.getFullYear(), calRef.getMonth(), 1);
  const gridStart = new Date(firstDay);
  gridStart.setDate(firstDay.getDate() - firstDay.getDay()); // back to Sunday
  const todayKey = ymd(new Date());

  // Clear
  cellsWrap.innerHTML = "";

  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);

    const inMonth = d.getMonth() === calRef.getMonth();
    const dateKey = ymd(d);

    // Cell
    const cell = document.createElement("div");
    cell.className = "cal-cell";
    cell.setAttribute("role", "gridcell");
    cell.setAttribute("aria-label", d.toDateString());

    // Date header
    const dateRow = document.createElement("div");
    dateRow.className = "cal-date";

    const left = document.createElement("span");
    left.textContent = d.getDate();
    if (!inMonth) left.classList.add("muted", "muted-date");
    dateRow.appendChild(left);

    const right = document.createElement("span");
    if (dateKey === todayKey) {
      const badge = document.createElement("span");
      badge.className = "today";
      badge.textContent = "Today";
      right.appendChild(badge);
    }
    dateRow.appendChild(right);

    cell.appendChild(dateRow);

    // Events
    const eventsWrap = document.createElement("div");
    eventsWrap.className = "cal-events";
    const events = eventsForDate(d);

    // Limit visible event chips per cell, show "+N more" if overflow
    const maxChips = 3;
    events.slice(0, maxChips).forEach((ev) => {
      const chip = document.createElement("div");
      chip.className = "event";
      chip.innerHTML = `<strong>${ev.name}</strong><small>${ev.time} • ${ev.location}</small>`;
      eventsWrap.appendChild(chip);
    });
    if (events.length > maxChips) {
      const more = document.createElement("div");
      more.className = "more-chip";
      more.textContent = `+${events.length - maxChips} more`;
      eventsWrap.appendChild(more);
    }

    cell.appendChild(eventsWrap);
    cellsWrap.appendChild(cell);
  }
}

// Gather events for a specific date based on weekly recurrence and start dates
function eventsForDate(dateObj) {
  const out = [];
  const w = dateObj.getDay(); // 0..6
  CLASS_CATALOG.forEach((c) => {
    const start = new Date(c.startDate + "T00:00:00");
    // Don't schedule before the class's start date
    if (dateObj < start) return;
    c.weekly.forEach((slot) => {
      if (slot.weekday === w) {
        out.push({
          key: c.key,
          name: c.name,
          time: slot.time,
          location: slot.location,
        });
      }
    });
  });
  // Optional: sort by time
  out.sort((a, b) => a.time.localeCompare(b.time));
  return out;
}

// Helper: YYYY-MM-DD
function ymd(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Controls
document.querySelectorAll(".cal-btn[data-cal]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const dir = btn.getAttribute("data-cal");
    if (dir === "prev") {
      calRef = new Date(calRef.getFullYear(), calRef.getMonth() - 1, 1);
    } else if (dir === "next") {
      calRef = new Date(calRef.getFullYear(), calRef.getMonth() + 1, 1);
    }
    renderCalendar();
  });
});

// Initial render
renderCalendar();

// ======= Gallery Slider =======
(function () {
  const slider = document.getElementById("gallery-slider");
  if (!slider) return;

  const track = slider.querySelector(".slides");
  const slides = Array.from(slider.querySelectorAll(".slide"));
  const prevBtn = slider.querySelector(".s-arrow.prev");
  const nextBtn = slider.querySelector(".s-arrow.next");
  const dotsWrap = slider.querySelector(".dots");

  let index = 0;
  let timer = null;

  // Build dots
  slides.forEach((_, i) => {
    const b = document.createElement("button");
    b.className = "dot";
    b.type = "button";
    b.setAttribute("role", "tab");
    b.setAttribute("aria-label", `Go to slide ${i + 1}`);
    b.addEventListener("click", () => {
      go(i);
      resetAuto();
    });
    dotsWrap.appendChild(b);
  });

  function update() {
    track.style.transform = `translateX(-${index * 100}%)`;
    dotsWrap.querySelectorAll(".dot").forEach((d, i) => {
      d.classList.toggle("active", i === index);
      d.setAttribute("aria-selected", i === index ? "true" : "false");
    });
  }

  function go(i) {
    const len = slides.length;
    index = (i + len) % len;
    update();
  }

  // Buttons
  prevBtn.addEventListener("click", () => {
    go(index - 1);
    resetAuto();
  });
  nextBtn.addEventListener("click", () => {
    go(index + 1);
    resetAuto();
  });

  // Keyboard (when slider is focused)
  slider.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      go(index - 1);
      resetAuto();
    }
    if (e.key === "ArrowRight") {
      go(index + 1);
      resetAuto();
    }
  });

  // Basic swipe support
  let startX = 0,
    swiping = false,
    pid = null;
  track.addEventListener("pointerdown", (e) => {
    swiping = true;
    startX = e.clientX;
    pid = e.pointerId;
    track.setPointerCapture(pid);
  });
  track.addEventListener("pointerup", (e) => {
    if (!swiping) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 40) {
      if (dx < 0) go(index + 1);
      else go(index - 1);
      resetAuto();
    }
    swiping = false;
    pid = null;
  });

  // Autoplay
  function startAuto() {
    stopAuto();
    timer = setInterval(() => go(index + 1), 5000);
  }
  function stopAuto() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
  }
  function resetAuto() {
    stopAuto();
    startAuto();
  }

  slider.addEventListener("mouseenter", stopAuto);
  slider.addEventListener("mouseleave", startAuto);

  // Init
  go(0);
  startAuto();
})();

const modal = document.getElementById("welcome-modal");

const dialog = modal.querySelector(".modal-dialog");
const closeBtn = modal.querySelector(".modal-close");

const openModal = () => {
  modal.classList.add("open");
  document.body.classList.add("no-scroll");
  modal.setAttribute("aria-hidden", "false");
};

const closeModal = () => {
  modal.classList.remove("open");
  document.body.classList.remove("no-scroll");
  modal.setAttribute("aria-hidden", "true");
};

// Open on page load
openModal();

// Close on any click anywhere (inside or outside)
document.addEventListener("click", () => {
  if (modal.classList.contains("open")) closeModal();
});

// Also close on Escape
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modal.classList.contains("open")) {
    closeModal();
  }
});

// Prevent clicks inside the dialog from triggering twice
// (document-level handler will still close it; we just avoid extra bubbling noise)
dialog.addEventListener("click", (e) => {
  // no stopPropagation so it still closes when clicking inside, per requirement
});

// Explicit close button
closeBtn.addEventListener("click", () => closeModal());
