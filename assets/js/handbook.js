// 手册章节轨高亮：滚动时标记当前章节。尊重减少动画；无 IntersectionObserver 时静默降级。
(function () {
  "use strict";
  if (!("IntersectionObserver" in window)) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    // 仍提供高亮，但不做平滑滚动（CSS 已处理）
  }
  var links = Array.prototype.slice.call(document.querySelectorAll("[data-chapter]"));
  if (!links.length) return;
  var map = {};
  links.forEach(function (l) {
    var el = document.getElementById(l.getAttribute("data-chapter"));
    if (el) map[el.id] = l;
  });
  var current = null;
  var slugEl = document.querySelector("[data-hb-slug]");
  var storeKey = slugEl ? "cm-hb-" + slugEl.getAttribute("data-hb-slug") : null;
  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          if (current) current.classList.remove("here");
          current = map[e.target.id];
          if (current) {
            current.classList.add("here");
            if (storeKey) {
              try { localStorage.setItem(storeKey, e.target.id); } catch (err) {}
            }
          }
        }
      });
    },
    { rootMargin: "-76px 0px -55% 0px", threshold: 0 }
  );
  Object.keys(map).forEach(function (id) {
    var el = document.getElementById(id);
    if (el) io.observe(el);
  });

  // 阅读进度：记住最近停留的章节；下次访问提供「继续」入口（可关闭）
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  {
    var key = storeKey;
    var saved = null;
    try { saved = localStorage.getItem(key); } catch (e) {}
    var banner = document.querySelector("[data-hb-resume]");
    var link = document.querySelector("[data-hb-resume-link]");
    var closeBtn = document.querySelector("[data-hb-resume-close]");
    var dismissed = false;
    try { dismissed = localStorage.getItem(key + "-off") === saved; } catch (e) {}
    if (saved && map[saved] && banner && link && !dismissed) {
      var label = map[saved].textContent.replace(/^第.章 · /, "");
      link.textContent = label;
      link.setAttribute("href", "#" + saved);
      banner.hidden = false;
      link.addEventListener("click", function (e) {
        e.preventDefault();
        var el = document.getElementById(saved);
        if (el) {
          var top = el.getBoundingClientRect().top + window.scrollY - 76;
          window.scrollTo({ top: top, behavior: reduce ? "auto" : "smooth" });
          el.setAttribute("tabindex", "-1");
          el.focus({ preventScroll: true });
        }
      });
      if (closeBtn) closeBtn.addEventListener("click", function () {
        banner.hidden = true;
        try { localStorage.setItem(key + "-off", saved); } catch (e) {}
        var nextTarget = document.querySelector(".hb-lead, .hb-toc, h1");
        if (nextTarget) {
          nextTarget.setAttribute("tabindex", "-1");
          nextTarget.focus({ preventScroll: true });
        }
      });
    }
  }
})();
