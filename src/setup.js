'use strict';

import Settings from './settings.js';
import { _preUpdateToken, _wallsBlockMovement } from './src/tokenwarp.js';

Hooks.once('init', () => {
  new Settings().registerSettings();
})

Hooks.on('preUpdateToken', _preUpdateToken);
