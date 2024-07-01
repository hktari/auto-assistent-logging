# TODO
- bugfix: MDDSZ fails: TimeoutError: Timed out after 30000 ms while trying to connect to the browser! Only Chrome at revision r1022525 is guaranteed to work.
- add implementation for test case 388D06F5-AB37-4B0F-8734-DFACF13528C0 (automation_type)
- implement support on backend and frontend for eračuni configuration


## BROWSER AUTOMATION
- use docker image from https://pptr.dev/guides/docker to run script in puppeteer container. The script needs to be compiled using a bundler.


## WEBSERVER
- refactor cors implementation

## BACKEND
- isAdmin field
- workweek input for validity

## FRONTEND
- logs UTC to local time                        OK
- update calendar when updating weekly config   OK
- close popup on delete event                   OK
- login page: hide password, desktop layout     OK
- edit event: endAt is max start + 1            OK
- weekly config table scrolls
- display past events in calendar
- disallow creation of events in the past