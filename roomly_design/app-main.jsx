/* global React, ReactDOM */
const { useState, useEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "sage",
  "theme": "light",
  "showHeroTiles": true
}/*EDITMODE-END*/;

const ACCENT_PALETTES = {
  sage: { "--accent": "#5a7a6a", "--accent-deep": "#3f5a4c", "--accent-soft": "#d8e1d8", "--accent-tint": "#eef2ec" },
  ink: { "--accent": "#2d3436", "--accent-deep": "#1a1a17", "--accent-soft": "#dad9d4", "--accent-tint": "#ecebe6" },
  cobalt: { "--accent": "#3a5fbf", "--accent-deep": "#2a4694", "--accent-soft": "#d6dff0", "--accent-tint": "#eaeff9" },
  amber: { "--accent": "#b8794a", "--accent-deep": "#8a5733", "--accent-soft": "#ebd9c4", "--accent-tint": "#f5ebde" },
};
const ACCENT_DARK = {
  sage: { "--accent": "#8caf99", "--accent-deep": "#aac6b3", "--accent-soft": "#2c382f", "--accent-tint": "#1f2a23" },
  ink: { "--accent": "#cfcec8", "--accent-deep": "#e8e6e0", "--accent-soft": "#33312c", "--accent-tint": "#26241f" },
  cobalt: { "--accent": "#7c9ce8", "--accent-deep": "#a3baf0", "--accent-soft": "#1f2a44", "--accent-tint": "#1a2235" },
  amber: { "--accent": "#d09a73", "--accent-deep": "#e6b693", "--accent-soft": "#3b2b1f", "--accent-tint": "#2b2018" },
};

function applyAccent(name, theme) {
  const pal = (theme === "dark" ? ACCENT_DARK : ACCENT_PALETTES)[name] || ACCENT_PALETTES.sage;
  const root = document.documentElement;
  for (const [k, v] of Object.entries(pal)) root.style.setProperty(k, v);
}

function App() {
  const [tweaks, setTweak] = (window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : useFallback(TWEAK_DEFAULTS));
  const theme = tweaks.theme;

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    applyAccent(tweaks.accent, theme);
  }, [theme, tweaks.accent]);

  const setTheme = (t) => setTweak("theme", t);

  return (
    <>
      <Nav theme={theme} setTheme={setTheme} />
      <Hero />
      <Stats />
      <FeatureRows />
      <Steps />
      <FeatureGrid />
      <Pricing />
      <Quote />
      <Columns />
      <FinalCTA />
      <Footer />

      {window.TweaksPanel ? (
        <window.TweaksPanel>
          <window.TweakSection title="テーマ">
            <window.TweakRadio label="Mode" value={tweaks.theme} options={["light", "dark"]} onChange={(v) => setTweak("theme", v)} />
          </window.TweakSection>
          <window.TweakSection title="アクセントカラー">
            <window.TweakColor
              label="Accent"
              value={tweaks.accent}
              options={[
                ["#5a7a6a", "sage"],
                ["#2d3436", "ink"],
                ["#3a5fbf", "cobalt"],
                ["#b8794a", "amber"],
              ].map(([c]) => c)}
              onChange={(c) => {
                const map = { "#5a7a6a": "sage", "#2d3436": "ink", "#3a5fbf": "cobalt", "#b8794a": "amber" };
                setTweak("accent", map[c] || "sage");
              }}
            />
          </window.TweakSection>
        </window.TweaksPanel>
      ) : null}
    </>
  );
}

function useFallback(defaults) {
  const [state, setState] = useState(defaults);
  const set = (k, v) => {
    if (typeof k === "object") setState((s) => ({ ...s, ...k }));
    else setState((s) => ({ ...s, [k]: v }));
  };
  return [state, set];
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
