module.exports = {
  HUXLEYFILE_NAME:        'Huxleyfile.json',
  SCREENSHOTS_FOLDER_EXT: '.hux',
  RECORD_FILE_NAME:       'record.json',
  DIFF_PNG_NAME:          'diff.png',
  STEP_SCREENSHOT:        'screenshot',
  STEP_CLICK:             'click',
  STEP_KEYPRESS:          'keypress',
  STEP_PAUSE:             'pause',
////////////////////////////////////////////////////////////////////////////////
// industrialwebapps.com additions by Chris Aitken and Dave Bowles (Jan-2014) //
////////////////////////////////////////////////////////////////////////////////
  STEP_WAITFORTHENDRAGDROP: 'wait-for-then-drag-and-drop',
  STEP_WAITFORNOTFOUND:     'wait-for-not-found',
  STEP_WAITFORTHENSET_WD:   'wait-for-then-set-with-webdriver',
  STEP_WAITFOR:             'wait-for',
  STEP_WAITFORTHENSET:      'wait-for-then-set',
  STEP_WAITFORTHENCLICK:    'wait-for-then-click',
  STEP_SETVALUE:            'set-value',
  STEP_CLICKBYSELECTOR:     'click-by-selector',
////////////////////////////////////////////
// End of industrialwebapps.com additions //
////////////////////////////////////////////
  // optimal default screen size. 1200 is bootstrap's definition of 'large
  // screen' and 795 is a mba 13inch's available height for firefox window in
  // Selenium. The actual height of the chromeless viewport should be 689
  DEFAULT_SCREEN_SIZE: [1200, 795]
};
