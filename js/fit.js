// The backstop that keeps every game on the screen.
// css/layout.css gives each board the right size; if one is still too big for the space (an unusual screen,
// or a game somebody has just written), this shrinks it to fit, so nothing hides under the grass.
"use strict";

(() => {
  const stage = document.getElementById("stage");
  let board = null, smallest = 1, space = "", recheck = 0;

  function fit() {
    const el = stage.firstElementChild;
    // the home screen scrolls, and the balloons always fill the sky
    if (!el || !route || el.matches(".sky-row")) return;
    const cs = getComputedStyle(stage);
    const padL = parseFloat(cs.paddingLeft), padT = parseFloat(cs.paddingTop);
    const w = stage.clientWidth - padL - parseFloat(cs.paddingRight), hh = stage.clientHeight - padT - parseFloat(cs.paddingBottom);
    if (w <= 0 || hh <= 0) return;
    // On a new board or screen size start again. Otherwise only ever shrink, so targets don't jump about mid-round.
    if (el !== board || space !== `${w}x${hh}`) { board = el; smallest = 1; space = `${w}x${hh}`; }

    el.style.scale = el.style.translate = "";
    const boxW = el.offsetWidth, boxH = el.offsetHeight; // unaffected by animations
    // a bump or wobble briefly pokes out of the board: that is no reason to shrink it
    const moving = el.getAnimations?.({ subtree: true }).some((a) => a.playState === "running" && a.effect.getTiming().iterations !== Infinity);
    clearTimeout(recheck);
    if (moving) recheck = setTimeout(fit, 400); // look again once it has settled
    const fullW = moving ? boxW : Math.max(boxW, el.scrollWidth), fullH = moving ? boxH : Math.max(boxH, el.scrollHeight);
    const s = Math.min(smallest, (w + 1) / fullW, (hh + 1) / fullH);
    if (s >= 1) return;
    smallest = s;
    // scale about the middle of the board's box, then slide whatever it really covers into the middle of the stage
    const midX = el.offsetLeft + boxW / 2, midY = el.offsetTop + boxH / 2;
    const dx = padL + w / 2 - midX - (s * (fullW - boxW)) / 2;
    const dy = padT + hh / 2 - midY - (s * (fullH - boxH)) / 2;
    el.style.scale = `${s}`;
    el.style.translate = `${dx}px ${dy}px`;
  }

  const sizes = new ResizeObserver(fit);
  function watch() {
    sizes.disconnect();
    sizes.observe(stage);
    if (stage.firstElementChild) sizes.observe(stage.firstElementChild);
  }
  // runs before the next paint, so a too-big board is never seen
  new MutationObserver(() => {
    if (stage.firstElementChild !== board) watch();
    fit();
  }).observe(stage, { childList: true, subtree: true, attributes: true, attributeFilter: ["hidden"] });
  watch();
  document.fonts?.ready.then(fit);
})();
