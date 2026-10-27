/*
 * Mini Browser
 * Data structure: two stacks (LIFO), each built on a fixed-size array.
 *   backStack    - pages visited before the current page
 *   forwardStack - pages you went Back from
 */
const MAX = 10; // pages remembered by each stack

class Stack {
  constructor(size) {
    this.size = size;
    this.items = new Array(size).fill(null);
    this.top = -1;
  }
  isEmpty() { return this.top === -1; }
  isFull() { return this.top === this.size - 1; }
  push(v) {                                  // O(1)
    if (this.isFull()) return false;
    this.items[++this.top] = v;
    return true;
  }
  pop() {                                    // O(1)
    if (this.isEmpty()) return null;
    const v = this.items[this.top];
    this.items[this.top--] = null;
    return v;
  }
  peek() { return this.isEmpty() ? null : this.items[this.top]; }
  clear() { this.items.fill(null); this.top = -1; }
  // Forget the oldest page (the bottom) when history is full. O(n)
  dropOldest() {
    for (let i = 0; i < this.top; i++) this.items[i] = this.items[i + 1];
    this.items[this.top--] = null;
  }
  // Bottom (oldest) to top (newest). O(n)
  toArray() {
    return this.items.slice(0, this.top + 1);
  }
}

// The "websites": an object of pages, each with text and links to other pages.
const PAGES = {
  home:    { title: "Home",    text: "Welcome to the mini browser. Pick a site to visit.", links: ["news", "weather", "maps", "shop"] },
  news:    { title: "News",    text: "Top stories of the day.",                            links: ["sports", "weather", "home"] },
  sports:  { title: "Sports",  text: "Scores and match reports.",                          links: ["news", "shop"] },
  weather: { title: "Weather", text: "Forecast for the week.",                             links: ["maps", "news", "home"] },
  maps:    { title: "Maps",    text: "Find places and directions.",                        links: ["weather", "shop", "home"] },
  shop:    { title: "Shop",    text: "Browse products and deals.",                         links: ["mail", "maps", "home"] },
  mail:    { title: "Mail",    text: "Your inbox.",                                        links: ["shop", "home"] }
};

const backStack = new Stack(MAX);
const forwardStack = new Stack(MAX);
let current = "home";

const $ = (id) => document.getElementById(id);
function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text !== undefined) e.textContent = text;
  return e;
}
function say(t) { $("message").textContent = t; }
const url = (slug) => "app://" + slug;

// Visit a NEW page: push the current page onto the back stack, clear forward.
function visit(slug) {
  if (slug === current) { say("You are already on " + url(slug)); return; }
  if (backStack.isFull()) backStack.dropOldest();
  backStack.push(current);
  forwardStack.clear();                      // a new visit ends the forward history
  current = slug;
  say("Opened " + url(slug));
  render();
}

// BACK: pop from back stack, push the page we leave onto forward stack.
function goBack(silent) {
  if (backStack.isEmpty()) { say("Nothing to go back to."); return; }
  if (forwardStack.isFull()) forwardStack.dropOldest();
  forwardStack.push(current);
  current = backStack.pop();
  if (!silent) { say("Back to " + url(current)); render(); }
}

// FORWARD: pop from forward stack, push the page we leave onto back stack.
function goForward(silent) {
  if (forwardStack.isEmpty()) { say("Nothing to go forward to."); return; }
  if (backStack.isFull()) backStack.dropOldest();
  backStack.push(current);
  current = forwardStack.pop();
  if (!silent) { say("Forward to " + url(current)); render(); }
}

// Jump several steps through history by repeating Back or Forward.
function jump(direction, steps) {
  for (let i = 0; i < steps; i++) direction === "back" ? goBack(true) : goForward(true);
  say("Jumped to " + url(current));
  render();
}

function clearHistory() {
  backStack.clear(); forwardStack.clear();
  say("History cleared.");
  render();
}

function goFromAddress() {
  const slug = $("address").value.trim().toLowerCase().replace(/^app:\/\//, "");
  if (!slug) return;
  if (PAGES[slug]) visit(slug);
  else say("No page called \"" + slug + "\". Try: " + Object.keys(PAGES).join(", "));
}

function historyItem(cls, slug, onClick) {
  const li = el("li", cls);
  li.append(el("span", "marker"), el("span", "", PAGES[slug].title), el("span", "url", url(slug)));
  if (onClick) {
    li.tabIndex = 0;
    li.addEventListener("click", onClick);
    li.addEventListener("keydown", (e) => { if (e.key === "Enter") onClick(); });
  }
  return li;
}

function drawHistory() {
  const list = $("historyList");
  list.innerHTML = "";
  const past = backStack.toArray();
  const future = forwardStack.toArray().reverse(); // nearest page first

  past.forEach((slug, i) => list.append(historyItem("past", slug, () => jump("back", past.length - i))));
  list.append(historyItem("current", current));
  future.forEach((slug, i) => list.append(historyItem("future", slug, () => jump("forward", i + 1))));

  if (!past.length && !future.length) {
    list.append(el("li", "empty", "Visit a page to start building history"));
  }
}

function render() {
  const p = PAGES[current];
  const page = $("page");
  page.innerHTML = "";
  page.style.animation = "none"; void page.offsetWidth; page.style.animation = "";
  page.append(el("h3", "", p.title), el("p", "", p.text));
  const links = el("div", "links");
  p.links.forEach((slug) => {
    const b = el("button", "", PAGES[slug].title);
    b.addEventListener("click", () => visit(slug));
    links.append(b);
  });
  page.append(links);

  $("address").value = url(current);
  $("backBtn").disabled = backStack.isEmpty();
  $("fwdBtn").disabled = forwardStack.isEmpty();
  drawHistory();
}

$("backBtn").addEventListener("click", () => goBack());
$("fwdBtn").addEventListener("click", () => goForward());
$("goBtn").addEventListener("click", goFromAddress);
$("clearBtn").addEventListener("click", clearHistory);
$("address").addEventListener("keydown", (e) => { if (e.key === "Enter") goFromAddress(); });
document.addEventListener("keydown", (e) => {
  if (e.altKey && e.key === "ArrowLeft") { e.preventDefault(); goBack(); }
  if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); goForward(); }
});

render();
say("Click a link to start browsing.");
