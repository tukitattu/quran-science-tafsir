/* ux-mobile.js — shared mobile/a11y upgrades: skip link, scroll progress, swipe nav */
(function () {
  "use strict";
  if (window.__uxMobile) return;
  window.__uxMobile = true;

  var docEl = document.documentElement;
  var dir = docEl.getAttribute("dir") || "ltr";

  /* ---------- 1. Skip link ---------- */
  var main = document.querySelector("main");
  if (main && !main.id) main.id = "main";
  if (main) {
    var skip = document.createElement("a");
    skip.href = "#main";
    skip.className = "skip-link";
    skip.setAttribute("data-i18n", "skip");
    skip.textContent = "Skip to content";
    document.body.insertBefore(skip, document.body.firstChild);
  }

  /* ---------- 2. Reading progress bar ---------- */
  var bar = document.createElement("div");
  bar.id = "read-progress";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);
  var raf = null;
  function paint() {
    raf = null;
    var h = docEl.scrollHeight - window.innerHeight;
    var p = h > 0 ? Math.min(1, Math.max(0, window.scrollY / h)) : 0;
    bar.style.transform = "scaleX(" + p + ")";
  }
  window.addEventListener("scroll", function () {
    if (raf == null) raf = requestAnimationFrame(paint);
  }, { passive: true });
  paint();

  /* ---------- 3. Swipe navigation (mobile) ---------- */
  var sx = 0, sy = 0, st = 0, tracking = false;

  function navLinks() {
    var nav = document.querySelector(".ayah-nav, .read-nav, .pager, nav");
    if (!nav) return { next: null, prev: null };
    var links = [].slice.call(nav.querySelectorAll("a[href]"));
    function pick(patterns) {
      for (var i = 0; i < links.length; i++) {
        var txt = (links[i].textContent || "") + " " + (links[i].className || "");
        for (var j = 0; j < patterns.length; j++) {
          if (patterns[j].test(txt)) return links[i].getAttribute("href");
        }
      }
      return null;
    }
    return {
      next: pick([/→/, /next|following|التالية/]),
      prev: pick([/←/, /prev|previous|السابقة/])
    };
  }

  function pageNeighbor(delta) {
    var m = location.pathname.match(/page(\d+)\.html$/);
    if (!m) return null;
    var n = parseInt(m[1], 10) + delta;
    if (n < 1) return null;
    var base = location.pathname.replace(/page\d+\.html$/, "page" + n + ".html");
    return base.replace(/^.*?(?=\/chapters\/)/, location.origin + "/");
  }

  function cacheGet(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } }
  function cacheSet(k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} }

  function maybeGo(delta) {
    var nav = navLinks();
    var url = delta > 0 ? (nav.next || null) : (nav.prev || null);
    if (!url) url = pageNeighbor(delta);
    if (!url) return;
    /* verify the target exists before navigating (handles page-range edges) */
    var ck = "ux404:" + url;
    if (cacheGet(ck) === "1") return;
    var xhr = new XMLHttpRequest();
    xhr.open("HEAD", url);
    xhr.onload = function () {
      if (xhr.status < 400) location.href = url;
      else cacheSet(ck, "1");
    };
    xhr.onerror = function () { cacheSet(ck, "1"); };
    xhr.send();
  }

  document.addEventListener("touchstart", function (e) {
    if (e.touches.length !== 1) { tracking = false; return; }
    var t = e.target;
    /* never hijack words, player controls, or any interactive element */
    if (t.closest && t.closest(".wbw, .wbw-pop, audio, video, button, a, input, select, textarea, .langbtns, .top-actions, #qp-toggle, #qp-close, .knowledge-pill, .note-controls")) {
      tracking = false; return;
    }
    tracking = true;
    sx = e.touches[0].clientX;
    sy = e.touches[0].clientY;
    st = Date.now();
  }, { passive: true });

  document.addEventListener("touchend", function (e) {
    if (!tracking) return;
    tracking = false;
    if (Date.now() - st > 800) return;
    var dx = e.changedTouches[0].clientX - sx;
    var dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) < 70 || Math.abs(dx) < 1.6 * Math.abs(dy)) return;
    /* LTR: left = next / RTL: right = next  */
    var wantNext = dir === "rtl" ? dx > 0 : dx < 0;
    maybeGo(wantNext ? 1 : -1);
  }, { passive: true });
})();
