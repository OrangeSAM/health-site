// 「长命百岁」筛选：纯前端，按标题/一句话回答/关键词过滤已渲染的卡片。
// 规则：多标签之间为 OR（并集）；关键词与标签结果之间为 AND；未选标签时不过滤标签。
// 支持分组：组内全部隐藏时整组隐藏。无 JS 时所有内容完整显示（渐进增强）。

// 纯函数：单个条目是否匹配。供页面与回归测试共用。
function longevityMatch(query, activeTags, searchableText, itemTags) {
  var q = (query || "").trim().toLowerCase();
  var okQuery = !q || searchableText.toLowerCase().indexOf(q) !== -1;
  var okTags =
    !activeTags || !activeTags.length ||
    activeTags.some(function (t) {
      return (itemTags || []).indexOf(t) !== -1;
    });
  return okQuery && okTags;
}

(function () {
  "use strict";

  function setup(root) {
    var input = root.querySelector("[data-filter-input]");
    var chips = Array.prototype.slice.call(root.querySelectorAll("[data-tag]"));
    var items = Array.prototype.slice.call(root.querySelectorAll("[data-searchable]"));
    var groups = Array.prototype.slice.call(root.querySelectorAll("[data-filter-group]"));
    var count = root.querySelector("[data-count]");
    var empty = root.querySelector("[data-empty]");
    if (!input || !items.length) return;

    var activeTags = [];

    // 性能优化：初始化时预缓存条目的可搜索文本与标签，避免用户键入时重复穿透 DOM 读取大属性及反复 split 数组
    var itemStore = items.map(function (el) {
      return {
        el: el,
        searchable: (el.getAttribute("data-searchable") || "").toLowerCase(),
        tags: (el.getAttribute("data-tags") || "").split(/\s+/)
      };
    });

    function syncUrl(q, tags) {
      try {
        var url = new URL(window.location.href);
        var currentQ = url.searchParams.get("q") || "";
        var currentTag = url.searchParams.get("tag") || "";
        var newQ = (q || "").trim();
        var newTag = (tags && tags.length) ? tags.join(",") : "";

        if (newQ !== currentQ || newTag !== currentTag) {
          if (newQ) {
            url.searchParams.set("q", newQ);
          } else {
            url.searchParams.delete("q");
          }
          if (newTag) {
            url.searchParams.set("tag", newTag);
          } else {
            url.searchParams.delete("tag");
          }
          var searchStr = url.searchParams.toString();
          var newPath = url.pathname + (searchStr ? "?" + searchStr : "") + url.hash;
          window.history.replaceState({ q: newQ, tag: newTag }, "", newPath);
        }
      } catch (e) {
        // 环境不支持时静默跳过
      }
    }

    function apply(skipUrlSync) {
      var q = (input.value || "").trim().toLowerCase();
      var shown = 0;
      var hasTags = activeTags.length > 0;

      for (var i = 0; i < itemStore.length; i++) {
        var it = itemStore[i];
        var okQuery = !q || it.searchable.indexOf(q) !== -1;
        var okTags = !hasTags || activeTags.some(function (t) {
          return it.tags.indexOf(t) !== -1;
        });
        var show = okQuery && okTags;
        if (it.el.hidden !== !show) {
          it.el.hidden = !show;
        }
        if (show) shown++;
      }

      for (var j = 0; j < groups.length; j++) {
        var g = groups[j];
        var groupItems = g.querySelectorAll("[data-searchable]");
        var visible = false;
        for (var k = 0; k < groupItems.length; k++) {
          if (!groupItems[k].hidden) {
            visible = true;
            break;
          }
        }
        if (g.hidden !== !visible) {
          g.hidden = !visible;
        }
      }

      if (count) count.textContent = "共 " + items.length + " 篇，当前显示 " + shown + " 篇";
      if (empty) {
        var emptyHidden = shown !== 0;
        if (empty.hidden !== emptyHidden) {
          empty.hidden = emptyHidden;
        }
      }

      if (!skipUrlSync) {
        syncUrl(q, activeTags);
      }
    }

    function resetAll() {
      input.value = "";
      activeTags = [];
      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", "false");
      });
      apply();
      input.focus();
    }

    // 中文输入法组合输入支持：输入合成时不提前过滤或污染 URL，合成结束立即触发
    var isComposing = false;
    input.addEventListener("compositionstart", function () {
      isComposing = true;
    });
    input.addEventListener("compositionend", function () {
      isComposing = false;
      apply();
    });
    input.addEventListener("input", function (e) {
      if (isComposing || (e && e.isComposing)) return;
      apply();
    });
    input.addEventListener("search", function () { apply(); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "Escape") {
        resetAll();
      }
    });

    root.addEventListener("click", function (e) {
      var target = e.target;
      if (target && (target.hasAttribute("data-filter-reset") || (target.closest && target.closest("[data-filter-reset]")))) {
        e.preventDefault();
        resetAll();
      }
    });

    chips.forEach(function (chip) {
      chip.addEventListener("click", function () {
        var t = chip.getAttribute("data-tag");
        var i = activeTags.indexOf(t);
        if (i === -1) {
          activeTags.push(t);
          chip.setAttribute("aria-pressed", "true");
        } else {
          activeTags.splice(i, 1);
          chip.setAttribute("aria-pressed", "false");
        }
        apply();
      });
    });

    // 监听前进/后退
    window.addEventListener("popstate", function () {
      var params = new URLSearchParams(window.location.search);
      var currentQ = params.get("q") || "";
      var tagParam = params.get("tag") || "";
      var newTags = tagParam ? tagParam.split(",").map(function(s){return s.trim();}).filter(Boolean) : [];

      var changed = false;
      if (input.value !== currentQ) {
        input.value = currentQ;
        changed = true;
      }

      var currentTagsStr = activeTags.slice().sort().join(",");
      var newTagsStr = newTags.slice().sort().join(",");
      if (currentTagsStr !== newTagsStr) {
        activeTags = newTags;
        chips.forEach(function (c) {
          var t = c.getAttribute("data-tag");
          var isPressed = activeTags.indexOf(t) !== -1;
          c.setAttribute("aria-pressed", isPressed ? "true" : "false");
        });
        changed = true;
      }

      if (changed) {
        apply(true);
      }
    });

    // 支持 /library/?q=词&tag=标签 深链：进入时预填并过滤
    var params = new URLSearchParams(location.search);
    var initialQ = params.get("q");
    var initialTag = params.get("tag");
    if (initialQ) {
      input.value = initialQ;
    }
    if (initialTag) {
      var tagsFromUrl = initialTag.split(",").map(function(s){return s.trim();}).filter(Boolean);
      tagsFromUrl.forEach(function (t) {
        if (activeTags.indexOf(t) === -1) {
          activeTags.push(t);
        }
      });
      chips.forEach(function (c) {
        var t = c.getAttribute("data-tag");
        if (activeTags.indexOf(t) !== -1) {
          c.setAttribute("aria-pressed", "true");
        }
      });
    }
    apply(true);
  }

  Array.prototype.slice
    .call(document.querySelectorAll("[data-filter-scope]"))
    .forEach(setup);
})();
