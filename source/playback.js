'use strict';

var colors = require('colors');
var path = require('path');
var specialKeys = require('selenium-webdriver').Key;

var imageOperations = require('./imageOperations');
var consts = require('./constants');

function _simulateScreenshot(driver,
                            recordPath,
                            screenshotIndex,
                            overrideScreenshots,
                            next) {
  console.log('  Taking screenshot ' + screenshotIndex);

  driver
    .takeScreenshot()
    // TODO: isolate the logic for saving image outside of this unrelated step
    .then(function(tempImage) {
      // TODO: browser name
      var oldImagePath = path.join(recordPath, screenshotIndex + '.png');
      if (overrideScreenshots) {
        return imageOperations.writeToFile(oldImagePath, tempImage, next);
      }

      imageOperations.compareAndSaveDiffOnMismatch(tempImage,
                                                  oldImagePath,
                                                  recordPath,
                                                  function(err, areSame) {
          if (err) return next(err);

          if (!areSame) {
            return next(
              'New screenshot looks different. ' +
              'The diff image is saved for you to examine.'
            );
          }

          next();
        }
      );
    });
}

function _simulateKeypress(driver, key, next) {
  console.log('  Typing ' + key);

  driver
    .executeScript('return document.activeElement;')
    .then(function(activeElement) {
      if (!activeElement) return next();

      // refer to `bigBrother.js`. The special keys are the arrow keys, stored
      // like 'ARROW_LEFT', By chance, the webdriver's `Key` object stores these
      // keys
      if (key.length > 1) key = specialKeys[key];
      activeElement
        .sendKeys(key)
        .then(next);
    });
}

// TODO: handle friggin select menu click, can't right now bc browsers
function _simulateClick(driver, posX, posY, next) {
  var posString = '(' + posX + ', ' + posY + ')';
  console.log('  Clicking ' + posString);

  driver
    // TODO: isolate this into a script file clicking on an input/textarea
    // element focuses it but doesn't place the carret at the correct position;
    // do it here (only works for ff)
    .executeScript(
      'var el = document.elementFromPoint' + posString + ';' +
      'if ((el.tagName === "TEXTAREA" || el.tagName === "INPUT") && document.caretPositionFromPoint) {' +
        'var range = document.caretPositionFromPoint' + posString + ';' +
        'var offset = range.offset;' +
        'document.elementFromPoint' + posString + '.setSelectionRange(offset, offset);' +
      '}' +
      'return document.elementFromPoint' + posString + ';'
    )
    .then(function(el) {
      el.click();
    })
    .then(next);
}

////////////////////////////////////////////////////////////////////////////////
// industrialwebapps.com additions by Dave Bowles and Chris Aitken (Jan-2014) //
////////////////////////////////////////////////////////////////////////////////
function _waitForThenDragAndDrop(driver, dragSelector, dropSelector, timeoutMs, interval, next) {
    console.log('  Waiting up to ' + timeoutMs + ' milliseconds to drag ' + dragSelector + ' to "' + dropSelector);
    var startTime = Date.now();
    var timeout = Date.now() + timeoutMs;
    var checkExist = function() {
        driver
            .executeScript('var ret = [];' +
                           'ret[0] = ' + dragSelector + '[0];' +
                           'ret[1] = ' + dropSelector + '[0];' +
                           'return ret')
            .then(function(el) {
                if(el.length == 2) {
                    console.log('    %s found in %s milliseconds'.green, dragSelector, Date.now() - startTime);
                    console.log('  Dragging ' + dragSelector + ' to "' + dropSelector + '"\n');
                    driver.actions()
                        .mouseDown(el[0])
                        .mouseMove(el[1])
                        .mouseUp(el[1])
                        .perform();
                    next();
                } else if(Date.now() > timeout) {
                    console.log('ERROR:  Element Not Found!!!\n'.bold.red);
                    process.exit(1);
                } else {
                    setTimeout(checkExist, interval);
                }
            });
    };
    checkExist();
}

function _waitForThenSetWithWebdriver(driver, selector, value, timeoutMs, interval, next){
    console.log('  Waiting up to ' + timeoutMs + ' milliseconds to set ' + selector + ' to "' + value + '" via webdriver');
    var startTime = Date.now();
    var timeout = Date.now() + timeoutMs;
    var checkExist = function() {
        driver
            .executeScript('return ' + selector + '[0];')
            .then(function(el) {
                if(el) {
                    console.log('    %s found in %s milliseconds'.green, selector, Date.now() - startTime);
                    console.log('  Setting ' + selector + ' to "' + value + '"\n');
                    el.sendKeys(value);
                    next();
                } else if(Date.now() > timeout) {
                    console.log('ERROR:  Element Not Found!!!\n'.bold.red);
                    process.exit(1);
                } else {
                    setTimeout(checkExist, interval);
                }
            });
    };
    checkExist();
}

function _waitForNotFound(driver, selector, timeoutMs, interval, next) {
    console.log('  Waiting up to ' + timeoutMs + ' milliseconds for ' + selector + ' to go away');
    var startTime = Date.now();
    var timeout = Date.now() + timeoutMs;
    var checkExist = function() {
        driver
            .executeScript('return ' + selector + '.length')
            .then(function(success) {
                if(success == 0) {
                    console.log('    %s not found after %s milliseconds\n'.green, selector, Date.now() - startTime);
                    next();
                } else if(Date.now() > timeout) {
                    console.log('ERROR:  Element Still Found!!!\n'.bold.red);
                    process.exit(1);
                } else {
                    setTimeout(checkExist, interval);
                }
            });
    };
    checkExist();
}

function _waitForSelector(driver, selector, timeoutMs, interval, next) {
    console.log('  Waiting up to ' + timeoutMs + ' milliseconds for ' + selector + '');
    var startTime = Date.now();
    var timeout = Date.now() + timeoutMs;
    var checkExist = function() {
        driver
            .executeScript('return ' + selector + '.length')
            .then(function(success) {
                if(success > 0) {
                    console.log('    %s found in %s milliseconds\n'.green, selector, Date.now() - startTime);
                    next();
                } else if(Date.now() > timeout) {
                    console.log('ERROR:  Element Not Found!!!\n'.bold.red);
                    process.exit(1);
                } else {
                    setTimeout(checkExist, interval);
                }
            });
    };
    checkExist();
}

function _waitForThenSet(driver, selector, value, timeoutMs, interval, next) {
    console.log('  Waiting up to ' + timeoutMs + ' milliseconds to set ' + selector + ' to "' + value + '"');
    var startTime = Date.now();
    var timeout = Date.now() + timeoutMs;
    var checkExist = function() {
        driver
            .executeScript('return ' + selector + '.length')
            .then(function(success) {
                if(success > 0) {
                    console.log('    %s found after %s milliseconds'.green, selector, Date.now() - startTime);
                    _setValueBySelector(driver, selector, value, next);
                } else if(Date.now() > timeout) {
                    console.log('ERROR:  Element Not Found!!!'.bold.red);
                    process.exit(1);
                } else {
                    setTimeout(checkExist, interval);
                }
            });
    };
    checkExist();
}

function _waitForThenClick(driver, selector, clicktype, timeoutMs, interval, next) {
    console.log('  Waiting up to ' + timeoutMs + ' milliseconds to ' + clicktype + '-click ' + selector + '');
    var startTime = Date.now();
    var timeout = Date.now() + timeoutMs;
    var checkExist = function() {
        driver
            .executeScript('return ' + selector + '.length')
            .then(function(success) {
                if(success > 0) {
                    console.log('    %s found in %s milliseconds'.green, selector, Date.now() - startTime);
                    _clickBySelector(driver, selector, clicktype, next);
                } else if(Date.now() > timeout) {
                    console.log('ERROR:  Element Not Found!!!'.bold.red);
                    process.exit(1);
                } else {
                    setTimeout(checkExist, interval);
                }
            });
    };
    checkExist();
}

function _setValueBySelector(driver, selector, value, next) {
    console.log('  Setting ' + selector + ' to "' + value +'" via client-side javascript\n');
    driver
        .executeScript(selector + '.val("' + value + '"); return;')
        .then(next);
}

function _clickBySelector(driver, selector, clicktype, next) {
    // clickType can be Right, Left or Double
    console.log('  ' + clicktype + '-clicking on: ' + selector + '\n');
    switch(clicktype) {
        case 'Left':
            driver
                .executeScript('return ' + selector + '[0];')
                .then(function(el) {
                    el
                    .click()
                    .then(next);
                });
            break;

        case 'Right':
            driver
                .executeScript(
                    'var el = ' + selector + '[0];' +
                    'el.dispatchEvent(new CustomEvent("contextmenu"));'
                )
                .then(next);
            break;

        case 'Double':
            driver
                .executeScript(
                    'var el = ' + selector + '[0];' +
                    'el.dispatchEvent(new CustomEvent("dblclick"));'
                )
                .then(next);
            break;
    }
}

////////////////////////////////////////////
// End of industrialwebapps.com additions //
////////////////////////////////////////////

function playback(playbackInfo, next) {
  var currentEventIndex = 0;
  var driver = playbackInfo.driver;
  var events = playbackInfo.recordContent;
  var overrideScreenshots = playbackInfo.overrideScreenshots;
  var recordPath = playbackInfo.recordPath;
  var screenshotCount = 1;

  // pass `_next` as the callback when the current simulated event
  // completes
  function _next(err) {
    if (err) return next(err);

    var currentEvent = events[currentEventIndex];
    var fn;

    if (currentEventIndex === events.length - 1) {
      fn = _simulateScreenshot.bind(null,
                                    driver,
                                    recordPath,
                                    screenshotCount,
                                    overrideScreenshots,
                                    function(err) {
        imageOperations.removeDanglingImages(
          playbackInfo.recordPath, screenshotCount + 1, function(err2) {
            next(err || err2 || null);
          }
        );
      });
    } else {
      if(currentEvent.note) {
        if(currentEvent.note.trim() != '' || currentEvent.action.trim() != '') {
          console.log( '%s (%s)'.bold.blue, currentEvent.note, currentEvent.action);
        }
      }
      switch (currentEvent.action) {

////////////////////////////////////////////////////////////////////////////////
// industrialwebapps.com additions by Dave Bowles and Chris Aitken (Jan-2014) //
////////////////////////////////////////////////////////////////////////////////

        case consts.STEP_WAITFORTHENDRAGDROP:
          fn = _waitForThenDragAndDrop.bind(
            null, driver, currentEvent.dragSelector, currentEvent.dropSelector, currentEvent.timeoutMs, currentEvent.interval, _next
          );
          break;
        case consts.STEP_WAITFORNOTFOUND:
          fn = _waitForNotFound.bind(
            null, driver, currentEvent.selector, currentEvent.timeoutMs, currentEvent.interval, _next
          );
          break;
        case consts.STEP_WAITFORTHENSET_WD:
          fn = _waitForThenSetWithWebdriver.bind(
            null, driver, currentEvent.selector, currentEvent.value, currentEvent.timeoutMs, currentEvent.interval, _next
          );
          break;
        case consts.STEP_WAITFOR:
          fn = _waitForSelector.bind(
            null, driver, currentEvent.selector, currentEvent.timeoutMs, currentEvent.interval, _next
          );
          break;
        case consts.STEP_WAITFORTHENSET:
            fn = _waitForThenSet.bind(
                null, driver, currentEvent.selector, currentEvent.value, currentEvent.timeoutMs, currentEvent.interval, _next
            );
          break;
        case consts.STEP_WAITFORTHENCLICK:
            fn = _waitForThenClick.bind(
                null, driver, currentEvent.selector, currentEvent.clicktype, currentEvent.timeoutMs, currentEvent.interval, _next
            );
          break;
        case consts.STEP_SETVALUE:
            fn = _setValueBySelector.bind(
                null, driver, currentEvent.selector, currentEvent.value, _next
            );
          break;
        case consts.STEP_CLICKBYSELECTOR:
            fn = _clickBySelector.bind(
                null, driver, currentEvent.selector, currentEvent.clicktype, _next
            );
          break;
////////////////////////////////////////////
// End of industrialwebapps.com additions //
////////////////////////////////////////////

        case consts.STEP_CLICK:
          fn = _simulateClick.bind(
            null, driver, currentEvent.x, currentEvent.y, _next
          );
          break;
        case consts.STEP_KEYPRESS:
          fn = _simulateKeypress.bind(null, driver, currentEvent.key, _next);
          break;
        case consts.STEP_SCREENSHOT:
          fn = _simulateScreenshot.bind(null,
                                        driver,
                                        recordPath,
                                        screenshotCount++,
                                        overrideScreenshots,
                                        _next);
          break;
        case consts.STEP_PAUSE:
          fn = function() {
            console.log('  Pause for %s ms'.grey, currentEvent.ms);
            setTimeout(_next, currentEvent.ms);
          };
          break;
      }
    }

    currentEventIndex++;
    fn();
  }

  _next();
}

module.exports = playback;
