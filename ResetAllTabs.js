/*!
 * Project: Classic Rave Freeze Automation in Grid View
 * Author: Jiun-Wei Chen (GitHub: jwchen317-cloud)
 * License: MIT
 * Created: 2025-11-14
 * Description: Clear all FreezeBot-related data across the current domain.
 */

javascript: (function () {
  var LS = window.localStorage,
    SS = window.sessionStorage,
    D = document;
  var removed = 0;
  var patterns = [
    /^FB_RUN_.*_(LIST|DONE|PHASE|CUR|FAIL)$/i,
    /^FB_(LIST|DONE|PHASE|CUR|FAIL)$/i,
    /^freezeBot/i,
  ];
  for (var i = LS.length - 1; i >= 0; i--) {
    var k = LS.key(i);
    if (!k) continue;
    for (var p = 0; p < patterns.length; p++) {
      if (patterns[p].test(k)) {
        LS.removeItem(k);
        removed++;
        break;
      }
    }
  }
  try {
    SS.removeItem("FB_RUN");
  } catch (e) {}
  var panels = D.querySelectorAll("[id^='fb_panel_FB_RUN_']");
  panels.forEach(function (n) {
    if (n && n.remove) n.remove();
  });
  alert(
    "FreezeBot: cleared ALL FreezeBot-related data (" +
      removed +
      " keys removed).\n(Other tabs\' progress has been reset)"
  );
})();