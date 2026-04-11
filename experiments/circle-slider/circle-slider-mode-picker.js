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
   * @param {{ syncValues?: boolean } | undefined} opt — syncValues: copy value between sliders (use when the user switches mode, not on first paint).
   */
  function setMode(mode, opt) {
    const m = mode === "range" ? "range" : "standard";
    const syncValues = !!(opt && opt.syncValues);
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
    if (syncValues && m === "range" && rangeApi) {
      rangeApi.setValue(Math.max(0, Math.min(100, standardApi.getValue())));
    }
    if (syncValues && m === "standard" && rangeApi) {
      standardApi.setValue(rangeApi.getValue());
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
      setMode(pick, { syncValues: true });
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
