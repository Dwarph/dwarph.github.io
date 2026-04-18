const MODE_STORAGE_KEY = "dwarph.io.experiments.circleSlider.uiMode.v1";

/**
 * @param {{ getValue: () => number; setValue: (n: number) => void }} standardApi
 * @param {{ getValue: () => number; setValue: (n: number) => void } | null | undefined} rangeApi
 */
export function initModePicker(standardApi, rangeApi) {
  const demo = document.getElementById("cs-demo");
  const buttons = document.querySelectorAll("[data-cs-pick]");
  const panels = document.querySelectorAll("[data-cs-mode-panel]");

  if (!buttons.length || !panels.length) return;

  /**
   * @param {"standard" | "range"} mode
   * @param {{ setDefaultForMode?: boolean } | undefined} opt — setDefaultForMode: on user pick, range → 50, standard → 100 (not on first paint / storage restore).
   */
  function setMode(mode, opt) {
    const m = mode === "range" ? "range" : "standard";
    const setDefaultForMode = !!(opt && opt.setDefaultForMode);
    buttons.forEach(function (btn) {
      const on = btn.getAttribute("data-cs-pick") === m;
      btn.classList.toggle("cs-picker-row--active", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
    });
    panels.forEach(function (p) {
      const id = p.getAttribute("data-cs-mode-panel");
      if (!id) return;
      p.hidden = id !== m;
    });
    if (setDefaultForMode && m === "range" && rangeApi) {
      rangeApi.setValue(50);
    }
    if (setDefaultForMode && m === "standard") {
      standardApi.setValue(100);
    }
    try {
      localStorage.setItem(MODE_STORAGE_KEY, m);
    } catch (_) {
      /* ignore */
    }
  }

  buttons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      const pick = btn.getAttribute("data-cs-pick");
      if (pick !== "standard" && pick !== "range") return;
      setMode(pick, { setDefaultForMode: true });
      if (demo) {
        demo.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  });

  /** @type {"standard" | "range"} */
  let initial = "standard";
  try {
    const s = localStorage.getItem(MODE_STORAGE_KEY);
    if (s === "range" || s === "standard") initial = s;
  } catch (_) {
    /* ignore */
  }
  /* Restore panel visibility only; each slider keeps its own initial value from config. */
  setMode(initial);
}
