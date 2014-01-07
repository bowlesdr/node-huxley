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
function _setValueById(driver, id, value, next) {
    console.log('  Setting value = "' + value + '" for element with ID = "' + id + '"');
    driver
        .executeScript(
            '$("#' + id + '").val("' + value + '");'
        )
        .then(next);
}

function _setValueByClass(driver, elClass, value, next) {
    console.log('  Setting value = "' + value + '" for visible element with CLASS = "' + elClass + '"');
    driver
        .executeScript(
            '$(".' + elClass + ':visible").val("' + value + '");'
        )
        .then(next);
}

function _clickById(driver, id, next) {
    console.log('  Clicking element with ID = "' + id + '"');
    driver
        .executeScript(
            'return document.getElementById("' + id + '");'
        )
        .then(function(activeElement) {
            activeElement
                .click()
                .then(next);
        });
}

function _clickByClass(driver, elClass, next) {
    console.log('  Clicking visible element with CLASS = "' + elClass + '"');
    driver
        .executeScript(
            'return $(".' + elClass + ':visible")[0];'
        )
        .then(function(activeElement) {
            activeElement
                .click()
                .then(next);
        });
}

function _simulateRightClick(driver, posX, posY, next) {   // DRB edit
    var posString = '(' + posX + ', ' + posY + ')';
    console.log('  RightClicking ' + posString);

    driver
        .executeScript(
            'var el = document.elementFromPoint' + posString + ';' +
                'if ((el.tagName === "TEXTAREA" || el.tagName === "INPUT") && document.caretPositionFromPoint) {' +
                'var range = document.caretPositionFromPoint' + posString + ';' +
                'var offset = range.offset;' +
                'document.elementFromPoint' + posString + '.setSelectionRange(offset, offset);' +
                '}' +
                'var rightClick = document.createEvent("MouseEvents");'+
                'rightClick.initMouseEvent('+
                    '\'contextmenu\', '+
                    'true,      '+
                    'true,      '+
                    'window,    '+
                    '1,         '+
                    posX + ',   '+
                    posY + ',   '+
                    posX + ',   '+
                    posY + ',   '+
                    'false,     '+
                    'false,     '+
                    'false,     '+
                    'false,     '+
                    '2,         '+
                    'null       '+
                ');'+
                'el.dispatchEvent(rightClick);'
        )
        .then(next);
}

function _simulateDoubleClick(driver, posX, posY, next) {   // CEA edit
    var posString = '(' + posX + ', ' + posY + ')';
    console.log('  Double-Clicking ' + posString);

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

                'var doubleClick = document.createEvent("MouseEvents");'+
                'doubleClick.initMouseEvent('+
                '\'dblclick\', '+
                'true,      '+
                'true,      '+
                'window,    '+
                '1,         '+
                posX + ',   '+
                posY + ',   '+
                posX + ',   '+
                posY + ',   '+
                'false,     '+
                'false,     '+
                'false,     '+
                'false,     '+
                '2,         '+
                'null       '+
                ');'+
                'el.dispatchEvent(doubleClick);'
        )
        .then(next);
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
      switch (currentEvent.action) {

////////////////////////////////////////////////////////////////////////////////
// industrialwebapps.com additions by Dave Bowles and Chris Aitken (Jan-2014) //
////////////////////////////////////////////////////////////////////////////////
        case consts.STEP_DOUBLECLICK:
          fn = _simulateDoubleClick.bind(
            null, driver, currentEvent.x, currentEvent.y, _next
          );
          break;
        case consts.STEP_CLICKBYID:
          fn = _clickById.bind(
            null, driver, currentEvent.id, _next
          );
          break;
        case consts.STEP_SETVALUEBYID:
          fn = _setValueById.bind(
            null, driver, currentEvent.id, currentEvent.value, _next
          );
          break;
        case consts.STEP_RIGHTCLICK:  // DRB edit
          fn = _simulateRightClick.bind(
            null, driver, currentEvent.x, currentEvent.y, _next
          );
          break;
        case consts.STEP_CLICKBYCLASS:
          fn = _clickByClass.bind(
            null, driver, currentEvent.class, _next
          );
          break;
        case consts.STEP_SETVALUEBYCLASS:
          fn = _setValueByClass.bind(
            null, driver, currentEvent.class, currentEvent.value, _next
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
