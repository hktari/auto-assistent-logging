const { executeAction } = require("../automation/e-racuni");

const { AUTOMATE_ACTION, LogEntry } = require("../interface");

(async () => {
  executeAction(AUTOMATE_ACTION.START_BTN, {
    appLoggedInURL:
      "https://e-racuni.com/S8a/Clockin-CA74538906CA0D009684938F0815D96F",
    appHomepageURL: "https://e-racuni.com/S8a",
    itsClientId: "IflQSpp3KaK00Cwf095MyYnQ_3881595479",
    itcSIDhomepage: "xtgrLk3eekf9Sptlltb0flYS_3883195249",
  });
})();
