const { executeAction } = require("../automation/e-racuni");

const { AUTOMATE_ACTION, LogEntry } = require("../interface");

(async () => {
  executeAction(
    null,
    "https://e-racuni.com/S8a/Clockin-CA74538906CA0D009684938F0815D96F",
    AUTOMATE_ACTION.START_BTN
  );
})();
