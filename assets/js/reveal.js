// 首页滚动显现：进入视野一次性显示。无 IO 或减少动画时直接全部可见。
(function () {
  "use strict";
  var targets = document.querySelectorAll(".reveal");
  if (!targets.length) return;
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function showAll() {
    Array.prototype.forEach.call(targets, function (t) { t.classList.add("in"); });
  }
  if (reduce || !("IntersectionObserver" in window)) {
    showAll();
    return;
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add("in");
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
  Array.prototype.forEach.call(targets, function (t) { io.observe(t); });
})();
