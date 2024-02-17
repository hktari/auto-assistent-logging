const sinon = require("sinon");
const mddszApi = require("../automation/mddsz-api");
const eracuniApi = require("../automation/e-racuni");

const executeActionStub = sinon.stub(mddszApi, "executeAction");
const eracuniExecuteActionStub = sinon.stub(eracuniApi, "executeAction");

const dbFacade = require("../dbFacade");

const chai = require("chai");
const { expect, assert } = require("chai");
const { describe, it } = require("mocha");
const autoAssistant = require("../auto-assistant");
const {
  AUTOMATE_ACTION,
  CONFIG_TYPE,
  LogEntry,
  LOG_ENTRY_STATUS,
  AUTOMATION_TYPE,
} = require("../interface");
const {
  AutomationAction,
  AutomationActionResult,
  ERacuniAutomationActionResult,
} = require("../util/actions");
const deepEqualInAnyOrder = require("deep-equal-in-any-order");
const Sinon = require("sinon");

chai.use(deepEqualInAnyOrder);
chai.config.truncateThreshold = 0;

describe("auto-assistant.js", () => {
  const testUser = {
    accountId: 0,
    login_info_id: 0,
    email: "test@example.com",
    automationEnabled: true,
    username: "test",
    password: "secret",
  };

  beforeEach(() => {
    Sinon.restore();
  });

  const automationActionsForUser = {
    test: [
      {
        date: new Date(Date.UTC(2022, 7, 15)),
        actions: [
          new AutomationActionResult(
            testUser,
            AUTOMATE_ACTION.START_BTN,
            CONFIG_TYPE.WEEKLY,
            new Date(Date.UTC(2022, 7, 15, 12, 0)),
            "Successfully executed start_btn action",
            null
          ),
          new AutomationActionResult(
            testUser,
            AUTOMATE_ACTION.STOP_BTN,
            CONFIG_TYPE.WEEKLY,
            new Date(Date.UTC(2022, 7, 15, 20, 0)),
            "Successfully executed stop_btn action",
            null
          ),
        ],
      },
      {
        date: new Date(Date.UTC(2022, 7, 18)),
        actions: [
          new AutomationActionResult(
            testUser,
            AUTOMATE_ACTION.START_BTN,
            CONFIG_TYPE.DAILY,
            new Date(Date.UTC(2022, 7, 18, 6, 0)),
            "Successfully executed start_btn action",
            null
          ),
          new AutomationActionResult(
            testUser,
            AUTOMATE_ACTION.STOP_BTN,
            CONFIG_TYPE.DAILY,
            new Date(Date.UTC(2022, 7, 18, 14, 0)),
            "Successfully executed stop_btn action",
            null
          ),
          new AutomationActionResult(
            testUser,
            AUTOMATE_ACTION.START_BTN,
            CONFIG_TYPE.WEEKLY,
            new Date(Date.UTC(2022, 7, 18, 20, 0)),
            null,
            null
          ),
          new AutomationActionResult(
            testUser,
            AUTOMATE_ACTION.STOP_BTN,
            CONFIG_TYPE.WEEKLY,
            new Date(Date.UTC(2022, 7, 19, 4, 0)),
            null,
            null
          ),
        ],
      },
    ],
    "test-eracuni": [{}],
  };

  function getActionsByDate(date, configType = null) {
    let matches = automationActionsForUser["test"].filter(
      (i) => i.date.getTime() === date.getTime()
    )[0].actions;
    if (configType) {
      matches = matches.filter((a) => a.configType === configType);
    }

    return matches;
  }

  describe("filterOutAlreadyExecuted", () => {
    const actions = [
      new AutomationAction(
        testUser,
        AUTOMATE_ACTION.START_BTN,
        CONFIG_TYPE.DAILY,
        new Date(Date.UTC(2022, 7, 15, 12, 0))
      ),
      new AutomationAction(
        testUser,
        AUTOMATE_ACTION.STOP_BTN,
        CONFIG_TYPE.DAILY,
        new Date(Date.UTC(2022, 7, 15, 20, 0))
      ),
    ];
    const logEntries = [
      new LogEntry(
        "test",
        LOG_ENTRY_STATUS.SUCCESSFUL,
        new Date(2022, 7, 15, 12, 0),
        null,
        "successful",
        AUTOMATE_ACTION.START_BTN,
        CONFIG_TYPE.DAILY
      ),
    ];

    it("should not return the entry existing in both lists", () => {
      const filtered = autoAssistant._filterOutAlreadyExecuted(
        actions,
        logEntries
      );
      expect(filtered).to.have.lengthOf(1);
      expect(filtered).to.not.deep.include(actions[0]);
    });

    it("should return the entry existing only inside the actions list", () => {
      expect(
        autoAssistant._filterOutAlreadyExecuted(actions, logEntries)
      ).to.deep.include(actions[1]);
    });
  });

  describe("handleAutomationForUser()", () => {
    it("should return an instance of AutomationActionResult", (done) => {
      const automationAction = automationActionsForUser["test"][0].actions[0];
      executeActionStub.reset();
      executeActionStub.returns(Promise.resolve(automationAction.message));

      autoAssistant
        .handleAutomationForUser(testUser, automationAction.dueAt)
        .then((actionResults) => {
          expect(executeActionStub.calledOnce, "stub is called").to.be.true;
          expect(actionResults[0]).to.deep.equal(automationAction);
          done();
        })
        .catch((err) => done(err));
    });

    it("weekly automation - it should return weekly automation action", (done) => {
      const weeklyActionDate = new Date(Date.UTC(2022, 15, 7, 12, 0));
      const automationAction = automationActionsForUser["test"][0].actions[0];
      executeActionStub.reset();
      executeActionStub.returns(Promise.resolve(automationAction.message));

      autoAssistant
        .handleAutomationForUser(testUser, automationAction.dueAt)
        .then((actionResults) => {
          expect(executeActionStub.calledOnce).to.be.true;
          expect(actionResults[0]).to.deep.equal(automationAction);
          done();
        })
        .catch((err) => done(err));
    });

    describe("daily + weekly automation", () => {
      const date = new Date(Date.UTC(2022, 7, 18));

      for (const dailyAction of getActionsByDate(date, CONFIG_TYPE.DAILY)) {
        it(`expect daily automation for ${dailyAction.actionType}`, (done) => {
          executeActionStub.reset();
          executeActionStub.returns(Promise.resolve(dailyAction.message));

          autoAssistant
            .handleAutomationForUser(testUser, dailyAction.dueAt)
            .then((actionResults) => {
              expect(executeActionStub.calledOnce).to.be.true;
              expect(actionResults).to.have.length(1);
              expect(actionResults[0]).to.deep.equal(dailyAction);
              done();
            })
            .catch((err) => done(err));
        });
      }

      for (const weeklyAction of getActionsByDate(date, CONFIG_TYPE.WEEKLY)) {
        it(`don't expect weekly automation for ${weeklyAction.actionType}`, (done) => {
          console.log(weeklyAction.dueAt);
          autoAssistant
            .handleAutomationForUser(testUser, weeklyAction.dueAt)
            .then((actionResults) => {
              executeActionStub.reset();
              executeActionStub.returns(Promise.resolve(weeklyAction.message));

              expect(executeActionStub.calledOnce).to.be.false;
              expect(actionResults).to.deep.equal([]);
              done();
            })
            .catch((err) => done(err));
        });
      }
    });

    describe("when time is less than 8AM", () => {
      it("weekly stop_btn action from previous day is returned", (done) => {
        const yesterdayWeeklyAction = new AutomationActionResult(
          testUser,
          AUTOMATE_ACTION.STOP_BTN,
          CONFIG_TYPE.WEEKLY,
          new Date(Date.UTC(2022, 7, 26, 4, 0)),
          "Successfuly executed stop_btn action",
          null
        );

        executeActionStub.reset();
        executeActionStub.returns(
          Promise.resolve(yesterdayWeeklyAction.message)
        );

        autoAssistant
          .handleAutomationForUser(testUser, yesterdayWeeklyAction.dueAt)
          .then((actionResults) => {
            expect(executeActionStub.calledOnce, "executeAction() was called")
              .to.be.true;
            expect(actionResults[0]).to.deep.equal(yesterdayWeeklyAction);
            done();
          })
          .catch((err) => done(err));
      });

      it("and already executed stop_btn from previous day, [] is returned", (done) => {
        const yesterdayWeeklyActionExecuted = new AutomationActionResult(
          testUser,
          AUTOMATE_ACTION.STOP_BTN,
          CONFIG_TYPE.WEEKLY,
          new Date(Date.UTC(2022, 8, 2, 4, 0)),
          null,
          null
        );

        executeActionStub.reset();
        executeActionStub.returns(
          Promise.resolve(yesterdayWeeklyActionExecuted.message)
        );

        autoAssistant
          .handleAutomationForUser(
            testUser,
            yesterdayWeeklyActionExecuted.dueAt
          )
          .then((actionResults) => {
            expect(executeActionStub.calledOnce, "executeAction() was called")
              .to.be.false;
            expect(actionResults).to.deep.equal([]);
            done();
          })
          .catch((err) => done(err));
      });
    });

    // it('for date when daily automation action exists, it should return daily automation action', (done) => {
    //     const
    // })

    it("when no automation action exists, it should return []", (done) => {
      const noAutomationDatetime = new Date(Date.UTC(2022, 7, 20)); // saturday
      autoAssistant
        .handleAutomationForUser(testUser, noAutomationDatetime)
        .then((actionResults) => {
          expect(actionResults).to.deep.equal([]);
          done();
        })
        .catch((err) => done(err));
    });

    it("when weekly exception, it should not return weekly automation action", (done) => {
      const exceptionDatetime = new Date(Date.UTC(2022, 7, 17, 12, 0));
      autoAssistant
        .handleAutomationForUser(testUser, exceptionDatetime)
        .then((actionResults) => {
          expect(actionResults, "no actions returned").to.deep.equal([]);
          done();
        })
        .catch((err) => done(err));
    });

    it("when action already executed, it should return []", (done) => {
      const alreadyExecutedDatetime = new Date(Date.UTC(2022, 7, 16, 14, 0));
      autoAssistant
        .handleAutomationForUser(testUser, alreadyExecutedDatetime)
        .then((actionResults) => {
          expect(actionResults).to.deep.equal([]);
          done();
        })
        .catch((err) => done(err));
    });

    it("[943D9429-1EA6-4DA1-8D76-C6B5F9D480D1] when start_btn has failed and stop_btn should be executed, it should return AutomationActionResult of type STOP_BTN", (done) => {
      const time = new Date("2024-01-31T22:00:00");
      autoAssistant
        .handleAutomationForUser(testUser, time)
        .then((result) => {
          expect(result).to.have.length(1);
          expect(result[0].actionType).to.equal(AUTOMATE_ACTION.STOP_BTN);
          done();
        })
        .catch((err) => done(err));
    });

    describe("eracuni configuration", () => {
      const eracuniConfig = {
        accountId: 2,
        itsClientId: "IflQSpp3KaK00Cwf095MyYnQ_3881595479",
        itcSIDhomepage: "xtgrLk3eekf9Sptlltb0flYS_3883195249",
        appHomepageURL: "https://test.eracuni.com",
        appLoggedInURL: "https://test.eracuni.com/test-eracuni/2923920",
      };

      const eracuniUser = {
        accountId: 2,
        login_info_id: 2,
        email: "test-eracuni@example.com",
        automationEnabled: true,
        username: "test-eracuni",
        password: "secret",
      };

      it("388D06F5-AB37-4B0F-8734-DFACF13528C0: when failed log entry exists for mddsz automation and successful for e-racuni. It should retry mddsz automation", (done) => {
        const time = new Date(Date.UTC(2024, 0, 31, 14, 0));
        const getLogEntriesStub = sinon.stub(dbFacade, "getLogEntries");

        const testCaseLogEntries = Promise.resolve([
          new LogEntry(
            eracuniUser.username,
            LOG_ENTRY_STATUS.SUCCESSFUL,
            time,
            null,
            "e-računi OK",
            AUTOMATE_ACTION.START_BTN,
            CONFIG_TYPE.DAILY,
            AUTOMATION_TYPE.ERACUNI
          ),
          new LogEntry(
            eracuniUser.username,
            LOG_ENTRY_STATUS.FAILED,
            time,
            null,
            "MDDSZ ERR",
            AUTOMATE_ACTION.START_BTN,
            CONFIG_TYPE.DAILY,
            AUTOMATION_TYPE.MDDSZ
          ),
        ]);
        getLogEntriesStub.returns(testCaseLogEntries);

        autoAssistant
          .handleAutomationForUser(eracuniUser, time)
          .then((result) => {
            expect(result).to.have.length(1);

            done();
          })
          .catch((err) => done(err));
      });

      it("should return an instance of ERacuniAutomationActionResult", (done) => {
        const automationAction = new AutomationActionResult(
          eracuniUser,
          AUTOMATE_ACTION.START_BTN,
          CONFIG_TYPE.DAILY,
          new Date(Date.UTC(2024, 0, 23, 14, 0)),
          "MDDSZ OK",
          null
        );

        const eRacuniAutomationAction = new ERacuniAutomationActionResult(
          eracuniConfig,
          eracuniUser,
          AUTOMATE_ACTION.START_BTN,
          CONFIG_TYPE.DAILY,
          new Date(Date.UTC(2024, 0, 23, 14, 0)),
          "ERACUNI OK",
          null
        );

        executeActionStub.reset();
        executeActionStub.returns(Promise.resolve("MDDSZ OK"));
        eracuniExecuteActionStub.reset();
        eracuniExecuteActionStub.returns(Promise.resolve("ERACUNI OK"));

        autoAssistant
          .handleAutomationForUser(eracuniUser, automationAction.dueAt)
          .then((actionResults) => {
            expect(
              executeActionStub.calledOnce,
              "MDDSZ executeAction stub is called"
            ).to.be.true;

            expect(actionResults[0]).to.deep.equal(automationAction);
            expect(actionResults[1]).to.deep.equal(eRacuniAutomationAction);
            done();
          })
          .catch((err) => done(err));
      });
    });
  });

  describe("logAutomationResult()", () => {
    it("should return 1 when valid", (done) => {
      const validAutomationResult = new AutomationActionResult(
        testUser,
        AUTOMATE_ACTION.START_BTN,
        CONFIG_TYPE.WEEKLY,
        new Date(Date.UTC(2022, 10, 1, 12, 0)),
        "Successfuly executed start_btn action"
      );

      autoAssistant
        .logAutomationResult(validAutomationResult)
        .then((insertCnt) => {
          expect(insertCnt).to.equal(1);
          done();
        })
        .catch((err) => done(err));
    });
    it("expect logEntries() to return newly added", (done) => {
      const newlyAdded = new LogEntry(
        testUser.username,
        LOG_ENTRY_STATUS.SUCCESSFUL,
        new Date(Date.UTC(2022, 10, 2, 12, 0)),
        null,
        "Successfuly executed start_btn action",
        AUTOMATE_ACTION.START_BTN,
        CONFIG_TYPE.WEEKLY
      );

      const db = require("../dbFacade");
      autoAssistant
        .logAutomationResult(
          new AutomationActionResult(
            testUser,
            newlyAdded.action,
            newlyAdded.configType,
            newlyAdded.timestamp,
            newlyAdded.message,
            newlyAdded.error
          )
        )
        .then((_) => {
          return db
            .getLogEntries(testUser.username, newlyAdded.timestamp)
            .then((logEntries) => {
              expect(logEntries).to.deep.contain(newlyAdded);
              done();
            });
        })
        .catch((err) => done(err));
    });
    // todo: implement
    // it('should throw error when invalid', (done) => {
    //     const invalidAutomationResult = new AutomationActionResult(
    //         testUser,
    //         AUTOMATE_ACTION.START_BTN,
    //         CONFIG_TYPE.WEEKLY,
    //         new Date(Date.UTC(2022, 10, 1, 12, 0)),
    //         'Successfuly executed start_btn action')

    //     autoAssistant.logAutomationResult(invalidAutomationResult)
    //         .then(insertCnt => {
    //             expect(insertCnt, 'expecting exception').to.equal(0)
    //             done(true)
    //         })
    //         .catch(err => {
    //             done()
    //         })
    // })
  });

  describe("_sortByDatetimeAsc", () => {
    it("should sort by dueAt ascending order", () => {
      const now = Date.now();
      const last = new AutomationAction(null, null, null, new Date(now + 1000));
      const second = new AutomationAction(null, null, null, new Date(now));
      const first = new AutomationAction(
        null,
        null,
        null,
        new Date(now - 1000)
      );
      const actions = [last, second, first];

      const sorted = autoAssistant._sortByDatetimeAsc(actions);

      expect(sorted[0]).to.equal(first);
      expect(sorted[1]).to.equal(second);
      expect(sorted[2]).to.equal(last);
    });
  });

  describe("_isSameDay", () => {
    it("should throw if invalid arguments passed", () => {
      expect(() => autoAssistant._isSameDay("2022-02-02", "2022-02-02")).to
        .throw;
    });
    it("should return false when dates are different", () => {
      const monday = new Date(2022, 10, 14);
      const tuesday = new Date(2022, 10, 15);

      expect(autoAssistant._isSameDay(monday, tuesday)).to.be.false;
    });

    it("should return true when dates are same and hours different", () => {
      const oneAmMonday = new Date(2022, 10, 14, 1);
      const twoPmMonday = new Date(2022, 10, 14, 14);

      expect(autoAssistant._isSameDay(oneAmMonday, twoPmMonday)).to.be.true;
    });
  });
});
