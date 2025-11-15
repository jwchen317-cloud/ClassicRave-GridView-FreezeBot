/*!
 * Project: Classic Rave Freeze Automation in Grid View
 * Author: Jiun-Wei Chen (GitHub: jwchen317-cloud)
 * License: MIT
 * Created: 2025-11-14
 * Description: Clear FreezeBot state (list/progress/errors) for the current tab only.
 */

javascript: (function () {
  var S = window,
    LS = S.localStorage,
    SS = S.sessionStorage,
    D = document;
  var RUN = SS.getItem("FB_RUN");
  if (!RUN) {
    alert("FreezeBot: no RunID in this tab; nothing to reset");
    return;
  }
  var pref = RUN + "_",
    n = 0;
  for (var i = LS.length - 1; i >= 0; i--) {
    var k = LS.key(i);
    if (k && k.indexOf(pref) === 0) {
      LS.removeItem(k);
      n++;
    }
  }
  SS.removeItem("FB_RUN");
  var p = D.getElementById("fb_panel_" + RUN);
  if (p && p.remove) p.remove();
  alert(
    "FreezeBot: cleared this tab\'s list/progress/errors (" +
      n +
      " keys removed).\n(This tab\'s RunID has been reset)"
  );
})();
