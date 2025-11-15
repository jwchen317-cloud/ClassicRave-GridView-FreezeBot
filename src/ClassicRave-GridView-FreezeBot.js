/*!
 * Project: Classic Rave Freeze Automation in Grid View
 * Author: Jiun-Wei Chen (GitHub: jwchen317-cloud)
 * License: MIT
 * Created: 2025-11-14
 * Description: Zero-install browser automation for Rave grid freeze flow.
 */

javascript: (function () {
  var S = window,
    D = document,
    LS = S.localStorage,
    SS = S.sessionStorage;
  function mkRun() {
    function z2(n) {
      return String(n).padStart(2, "0");
    }
    var d = new Date();
    var ts =
      d.getFullYear() +
      z2(d.getMonth() + 1) +
      z2(d.getDate()) +
      "_" +
      z2(d.getHours()) +
      z2(d.getMinutes()) +
      z2(d.getSeconds());
    var rnd = Math.random().toString(16).slice(2, 6);
    return "FB_RUN_" + ts + "_" + rnd;
  }
  var RUN = SS.getItem("FB_RUN");
  if (!RUN) {
    RUN = mkRun();
    SS.setItem("FB_RUN", RUN);
  }
  function K(s) {
    return RUN + "_" + s;
  }
  var K_LIST = K("LIST"),
    K_DONE = K("DONE"),
    K_PHASE = K("PHASE"),
    K_CUR = K("CUR"),
    K_FAIL = K("FAIL");
  function trim(s) {
    return (s || "").trim();
  }
  function text(el) {
    return ((el && (el.textContent || el.innerText)) || "").trim();
  }
  function qsa(sel, sc) {
    return Array.prototype.slice.call((sc || D).querySelectorAll(sel));
  }
  function log(s) {
    console.log("[FreezeBot %s]", RUN, s);
  }
  function alertx(msg) {
    S.alert("FreezeBot (this tab)\n" + msg + "\n\nRunID: " + RUN);
  }
  function getJSON(k, def) {
    try {
      var v = LS.getItem(k);
      return v ? JSON.parse(v) : def;
    } catch (e) {
      return def;
    }
  }
  function setJSON(k, obj) {
    LS.setItem(k, JSON.stringify(obj));
  }
  function pushFail(name, reason) {
    var fails = getJSON(K_FAIL, []);
    fails.push({ name: name, reason: reason, ts: new Date().toISOString() });
    setJSON(K_FAIL, fails);
    uiUpdate();
  }
  function anchors() {
    return qsa('a[id^="_ctl0_Content__ctl0_LB_Instance"]');
  }
  function findAnchorByName(n) {
    var as = anchors();
    for (var i = 0; i < as.length; i++) {
      if (text(as[i]) === n) return as[i];
    }
    return null;
  }
  function findRowByName(n) {
    var a = findAnchorByName(n);
    if (a) {
      var tr = a.closest("tr");
      if (tr) return tr;
    }
    var tds = qsa("td.GridSelected");
    for (var i = 0; i < tds.length; i++) {
      if (text(tds[i]).indexOf(n) > -1) {
        var tr2 = tds[i].closest("tr");
        if (tr2) return tr2;
      }
    }
    return null;
  }
  function pageFrozenOK() {
    var cells = qsa("td.GridSelected");
    for (var i = 0; i < cells.length; i++) {
      var imgs = qsa("img", cells[i]);
      for (var j = 0; j < imgs.length; j++) {
        var im = imgs[j];
        var src = (im.getAttribute("src") || "").toLowerCase();
        var alt = (im.getAttribute("alt") || "").toLowerCase();
        if (src.indexOf("crf_fr") > -1 || alt.indexOf("freeze") > -1) {
          log("Verify: found crf_fr icon inside td.GridSelected → success");
          return true;
        }
      }
    }
    return false;
  }
  function gid(id) {
    return D.getElementById(id);
  }
  function getEls() {
    return {
      review: gid("_ctl0_Content__ctl0_CB_Review_1"),
      freeze: gid("_ctl0_Content__ctl0_CB_Freeze_0"),
      radio: gid("_ctl0_Content__ctl0_RadioButtons_0"),
      save: gid("_ctl0_Content__ctl0_SBT_Save"),
    };
  }
  function ensureList() {
    var L = LS.getItem(K_LIST),
      DN = LS.getItem(K_DONE),
      FL = LS.getItem(K_FAIL);
    if (!L) {
      var inp = S.prompt(
        "Enter folder names to freeze (comma-separated)",
        "Maintenance Treatment Cycle 58, Maintenance Treatment Cycle 59"
      );
      if (!inp) {
        log("No list configured");
        return null;
      }
      var arr = inp.split(",").map(trim).filter(Boolean);
      if (!arr.length) {
        log("List is empty");
        return null;
      }
      setJSON(K_LIST, arr);
      setJSON(K_DONE, []);
      setJSON(K_FAIL, []);
      LS.setItem(K_PHASE, "SELECT");
      LS.removeItem(K_CUR);
      L = LS.getItem(K_LIST);
      DN = LS.getItem(K_DONE);
      FL = LS.getItem(K_FAIL);
    }
    return {
      list: JSON.parse(L || "[]"),
      done: JSON.parse(DN || "[]"),
      fail: JSON.parse(FL || "[]"),
    };
  }
  function nextName(list, done, fail) {
    for (var i = 0; i < list.length; i++) {
      var n = list[i];
      if (
        done.indexOf(n) === -1 &&
        !fail.some(function (f) {
          return f.name === n;
        })
      )
        return n;
    }
    return null;
  }
  function setPhase(p) {
    LS.setItem(K_PHASE, p);
  }
  function getPhase() {
    return LS.getItem(K_PHASE) || "SELECT";
  }
  function setCur(n) {
    if (n) LS.setItem(K_CUR, n);
    else LS.removeItem(K_CUR);
  }
  function getCur() {
    return LS.getItem(K_CUR) || null;
  }
  function uiEnsure() {
    var id = "fb_panel_" + RUN;
    var el = gid(id);
    if (el) return el;
    el = D.createElement("div");
    el.id = id;
    el.style.cssText =
      "position:fixed;right:12px;bottom:12px;z-index:2147483647;background:#fff;border:1px solid #ddd;border-radius:8px;box-shadow:0 4px 14px rgba(0,0,0,.12);font:12px/1.4 -apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial;padding:10px 12px;max-width:380px;color:#222";
    el.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:6px"><strong>FreezeBot</strong><span style="opacity:.6;font-size:11px">' +
      RUN +
      '</span></div><div id="fb_current_' +
      RUN +
      '" style="margin-bottom:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">Current: <em>—</em></div><div id="fb_line_' +
      RUN +
      '" style="margin-bottom:8px"></div><div style="display:flex;gap:6px;flex-wrap:wrap"><button id="fb_copy_' +
      RUN +
      '" style="padding:6px 8px;border:1px solid #ccc;border-radius:6px;background:#f6f6f6;cursor:pointer">Copy Error List</button><button id="fb_skip_' +
      RUN +
      '" style="padding:6px 8px;border:1px solid #ccc;border-radius:6px;background:#fff;cursor:pointer">Skip Current (mark error)</button><button id="fb_close_' +
      RUN +
      '" style="margin-left:auto;padding:6px 8px;border:1px solid #ccc;border-radius:6px;background:#fff;cursor:pointer">Close</button></div>';
    D.body.appendChild(el);
    var copyBtn = gid("fb_copy_" + RUN),
      skipBtn = gid("fb_skip_" + RUN),
      closeBtn = gid("fb_close_" + RUN);
    copyBtn.onclick = function () {
      var fails = getJSON(K_FAIL, []);
      var text = fails.length
        ? fails
            .map(function (f, i) {
              return (
                i +
                1 +
                ". " +
                f.name +
                " | reason: " +
                (f.reason || "n/a") +
                " | time: " +
                f.ts
              );
            })
            .join("\\n")
        : "(no errors)";
      try {
        var ta = D.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.right = "-9999px";
        D.body.appendChild(ta);
        ta.select();
        D.execCommand("copy");
        D.body.removeChild(ta);
        S.alert("Copied error list (" + fails.length + " items)");
      } catch (e) {
        S.prompt("Copy the following", text);
      }
    };
    skipBtn.onclick = function () {
      var cur = getCur();
      if (!cur) {
        S.alert("No current item");
        return;
      }
      pushFail(cur, "manually skipped");
      setCur(null);
      setPhase("SELECT");
      var st2 = ensureList();
      if (!st2) {
        return;
      }
      var nx = nextName(st2.list, st2.done, st2.fail);
      if (!nx) {
        S.alert("No pending items left");
        uiUpdate();
        return;
      }
      setCur(nx);
      uiUpdate();
      var a = findAnchorByName(nx);
      if (a) {
        a.click();
      } else {
        S.alert(
          "Next item not found: " +
            nx +
            "; select it manually then click the bookmark again"
        );
      }
    };
    closeBtn.onclick = function () {
      var p = gid("fb_panel_" + RUN);
      if (p && p.remove) p.remove();
    };
    return el;
  }
  function uiUpdate() {
    var st = ensureList();
    if (!st) return;
    var total = st.list.length,
      done = st.done.length,
      fail = st.fail.length;
    var pending = Math.max(total - done - fail, 0);
    uiEnsure();
    var line = gid("fb_line_" + RUN);
    if (line) {
      line.innerHTML =
        "Done <b>" +
        done +
        "</b> / Pending <b>" +
        pending +
        "</b> / Failed <b>" +
        fail +
        "</b> / Total <b>" +
        total +
        "</b>";
    }
    var curEl = gid("fb_current_" + RUN);
    if (curEl) {
      var cur = getCur();
      curEl.innerHTML = "Current: <em>" + (cur ? cur : "—") + "</em>";
    }
  }
  uiEnsure();
  uiUpdate();
  var st = ensureList();
  if (!st) {
    alertx("No list configured, cancelled");
    return;
  }
  var list = st.list,
    done = st.done,
    fail = st.fail;
  var phase = getPhase(),
    cur = getCur();
  log("phase=" + phase + ", cur=" + (cur || "-"));
  function gotoNext() {
    var nx = nextName(list, done, fail);
    if (!nx) {
      alertx("All items completed ✅");
      setPhase("DONE");
      setCur(null);
      uiUpdate();
      return null;
    }
    setCur(nx);
    log("Switch to: " + nx);
    uiUpdate();
    return nx;
  }
  if (phase === "SELECT") {
    if (!cur) {
      cur = gotoNext();
      if (!cur) return;
    }
    var a = findAnchorByName(cur);
    if (!a) {
      pushFail(cur, "anchor not found");
      cur = gotoNext();
      if (!cur) return;
      var a2 = findAnchorByName(cur);
      if (a2) {
        setPhase("ACT");
        a2.click();
      } else {
        alertx("Still cannot find next item; please check names and page");
      }
    } else {
      log("Click folder (will reload): " + cur);
      setPhase("ACT");
      a.click();
    }
    return;
  }
  if (phase === "ACT") {
    if (!cur) {
      cur = gotoNext();
      if (!cur) return;
    }
    var tr = findRowByName(cur);
    if (!tr) {
      alertx(
        "Target not selected yet: " +
          cur +
          "; please load selected state then click again"
      );
      return;
    }
    var els = getEls();
    if (!els.review || !els.freeze || !els.radio || !els.save) {
      pushFail(cur, "missing controls (Review/Freeze/Radio/Save)");
      cur = gotoNext();
      if (!cur) return;
      var a3 = findAnchorByName(cur);
      if (a3) {
        setPhase("ACT");
        a3.click();
      } else {
        setPhase("SELECT");
      }
      uiUpdate();
      return;
    }
    if (!els.review.checked) {
      els.review.click();
      log("✔ check Review");
    } else {
      log("Review already checked");
    }
    if (!els.freeze.checked) {
      els.freeze.click();
      log("✔ check Freeze");
    } else {
      log("Freeze already checked");
    }
    if (!els.radio.checked) {
      els.radio.click();
      log("✔ select Radio: Set");
    } else {
      log("Radio(Set) already selected");
    }
    log("💾 Click Save (will reload)…");
    setPhase("VERIFY");
    els.save.click();
    return;
  }
  if (phase === "VERIFY") {
    if (!cur) {
      cur = gotoNext();
      if (!cur) return;
    }
    if (!pageFrozenOK()) {
      alertx(
        'Freeze not verified yet (need freeze icon inside the gray cell); try again later or use "Skip Current"'
      );
      uiUpdate();
      return;
    }
    log("✅ Verified: " + cur);
    done.push(cur);
    setJSON(K_DONE, done);
    uiUpdate();
    var nx = nextName(list, done, fail);
    if (!nx) {
      alertx("All items completed ✅");
      setPhase("DONE");
      setCur(null);
      uiUpdate();
      return;
    }
    setCur(nx);
    log("Auto-switch to next: " + nx);
    uiUpdate();
    var a4 = findAnchorByName(nx);
    if (!a4) {
      setPhase("SELECT");
      alertx(
        "Next anchor not found: " +
          nx +
          "; select it manually then click the bookmark"
      );
      return;
    }
    setPhase("ACT");
    a4.click();
    return;
  }
  if (phase === "DONE") {
    alertx("All items completed ✅");
    uiUpdate();
    return;
  }
})();