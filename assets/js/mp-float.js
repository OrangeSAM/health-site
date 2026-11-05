// 小程序码浮层：宽屏（≥1440px）默认展开贴右缘；窄桌面默认小圆钮，点开浮层。
// 「×」或 Escape 收起；收起后可从圆钮恢复。浮层不占内容布局宽度。
(function () {
  "use strict";
  var aside = document.querySelector("[data-mp-float]");
  if (!aside) return;
  var chip = aside.querySelector("[data-mp-open]");
  var pop = aside.querySelector("[data-mp-pop]");
  var closeBtn = aside.querySelector("[data-mp-close]");
  if (!chip || !pop || !closeBtn) return;

  var wide = window.matchMedia("(min-width: 1440px)");

  function popOpen() {
    return !pop.hidden;
  }

  function render() {
    // 宽屏且未被用户收起：默认展开；其余显示圆钮
    var showPop = (wide.matches && !aside.classList.contains("is-dismissed")) || aside.classList.contains("is-open");
    pop.hidden = !showPop;
    chip.hidden = showPop;
    chip.setAttribute("aria-expanded", showPop ? "true" : "false");
    document.body.classList.toggle("mp-panel-open", showPop && !wide.matches);
  }

  chip.addEventListener("click", function () {
    aside.classList.remove("is-dismissed");
    aside.classList.add("is-open");
    render();
    closeBtn.focus();
  });
  closeBtn.addEventListener("click", function () {
    if (wide.matches) {
      aside.classList.add("is-dismissed"); // 宽屏收起后留在圆钮态
      aside.classList.remove("is-open");
    } else {
      aside.classList.remove("is-open"); // 窄桌面关掉浮层回到圆钮
    }
    render();
    chip.focus();
  });

  // 非模态浮层允许 Tab 离开；仅在焦点位于浮层内时响应 Escape。
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && popOpen() && pop.contains(document.activeElement)) {
      closeBtn.click();
    }
  });
  wide.addEventListener("change", render);
  var rT;
  window.addEventListener("resize", function () {
    clearTimeout(rT);
    rT = setTimeout(render, 120);
  });

  render();
})();
