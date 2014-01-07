module.exports = {
  HUXLEYFILE_NAME: 'Huxleyfile.json',
  SCREENSHOTS_FOLDER_EXT: '.hux',
  RECORD_FILE_NAME: 'record.json',
  DIFF_PNG_NAME: 'diff.png',
  STEP_SCREENSHOT: 'screenshot',
  STEP_CLICK: 'click',
  STEP_KEYPRESS: 'keypress',
  STEP_PAUSE: 'pause',
////////////////////////////////////////////////////////////////////////////////
// industrialwebapps.com additions by Chris Aitken and Dave Bowles (Jan-2014) //
////////////////////////////////////////////////////////////////////////////////
  STEP_CLICKBYID:    'click-by-id',
  STEP_RIGHTCLICK:   'right-click',
  STEP_SETVALUEBYID: 'set-value-by-id',
  STEP_DOUBLECLICK:  'double-click',
////////////////////////////////////////////
// End of industrialwebapps.com additions //
////////////////////////////////////////////
  // optimal default screen size. 1200 is bootstrap's definition of 'large
  // screen' and 795 is a mba 13inch's available height for firefox window in
  // Selenium. The actual height of the chromeless viewport should be 689
  DEFAULT_SCREEN_SIZE: [1200, 795]
};
