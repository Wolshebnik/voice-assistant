import { openUrl } from './open-url.js';
import { exitApp } from './exit.js';
import { openYoutube } from './open-youtube.js';
import {
  mediaBackward,
  mediaForward,
  mediaPause,
  mediaSeekBy,
} from './media-control.js';

export const actions = {
  openUrl,
  openYoutube,
  play: mediaPause,
  pause: mediaPause,
  forward: mediaForward,
  backward: mediaBackward,
  forwardBy: (sec) => mediaSeekBy(Math.abs(Number(sec) || 0)),
  backwardBy: (sec) => mediaSeekBy(-Math.abs(Number(sec) || 0)),
  sayHello: () => {
    console.log('👋 Привет! Я здесь.');
  },
  exit: exitApp,
};
