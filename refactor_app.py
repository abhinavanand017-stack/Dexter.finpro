import codecs
import re

print("Starting refactor...")

with codecs.open('app.js', 'r', 'utf-8') as f:
    js = f.read()

# Fix 1: localStorage Try-Catch in initTrackerModule
old_tracker_init = "let trackerData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];"
new_tracker_init = """let trackerData = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) trackerData = JSON.parse(raw);
  } catch (e) {
    console.warn("localStorage corrupted, resetting tracker.");
  }"""
js = js.replace(old_tracker_init, new_tracker_init)

old_tracker_save = "localStorage.setItem(STORAGE_KEY, JSON.stringify(trackerData));"
new_tracker_save = """try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trackerData));
    } catch (e) {
      console.warn("localStorage quota exceeded.");
    }"""
js = js.replace(old_tracker_save, new_tracker_save)

# Fix 2: Canvas High-DPI Scaling for renderPerformanceChart
old_canvas_init = """  const W = canvas.width = canvas.offsetWidth || 800;
  const H = canvas.height;"""
new_canvas_init = """  const W = canvas.offsetWidth || 800;
  const H = canvas.offsetHeight || 300;
  
  // High-DPI scaling
  const dpr = window.devicePixelRatio || 1;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx.scale(dpr, dpr);"""
js = js.replace(old_canvas_init, new_canvas_init)

# Fix 3: Fallback STOCKS_DB and TOP_FUNDS_DB
if "window.STOCKS_DB =" not in js:
    js = "window.STOCKS_DB = window.STOCKS_DB || [];\nwindow.TOP_FUNDS_DB = window.TOP_FUNDS_DB || [];\n" + js

with codecs.open('app.js', 'w', 'utf-8') as f:
    f.write(js)
print("app.js refactored!")

with codecs.open('styles.css', 'r', 'utf-8') as f:
    css = f.read()

# Fix responsive screener flex wrap
new_css_rule = """
/* Responsive Screeners */
@media (max-width: 768px) {
  #panel-mutualfunds > div, 
  #panel-equity > div {
    flex-wrap: wrap;
    height: auto !important;
  }
  #panel-mutualfunds .card:first-child,
  #panel-equity .card:first-child {
    flex: 1 1 100% !important;
    max-height: 200px;
    border-right: none !important;
    border-bottom: 1px solid var(--border);
  }
}
"""
if "Responsive Screeners" not in css:
    css += new_css_rule

with codecs.open('styles.css', 'w', 'utf-8') as f:
    f.write(css)
print("styles.css refactored!")
