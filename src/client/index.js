import { connect, play } from './networking';
import { startRendering, stopRendering } from './render';
import { startCapturingInput, stopCapturingInput } from './input';
import { downloadAssets } from './assets';
import { initState } from './state';
import { setLeaderboardHidden } from './leaderboard';

import 'bootstrap/dist/css/bootstrap.min.css';
import './css/main.css';

const playMenu = document.getElementById('play-menu');
const playButton = document.getElementById('play-button');
const usernameInput = document.getElementById('username-input');

Promise.all([
  connect(onGameOver),
  downloadAssets(),
]).then(() => {
  playMenu.classList.remove('hidden');
  usernameInput.focus();
  playButton.onclick = () => {
    // Play!

	 switch (document.getElementById('selected_color').value) {
      case 'red':
        document.getElementById('health_header').value = 'red_tank.png'; // set what color tank to use
        break;
      case 'green':
        document.getElementById('health_header').value = 'green_tank.png'; // set what color tank to use
        break;
      case 'blue':
        document.getElementById('health_header').value = 'blue_tank.png'; // set what color tank to use
        break;
      case 'purple':
        document.getElementById('health_header').value = 'purple_tank.png'; // set what color tank to use
        break;
	 }

    play(usernameInput.value);
    playMenu.classList.add('hidden');
    initState();
    startCapturingInput();
    startRendering();
    setLeaderboardHidden(false);
  };
}).catch(console.error);

function onGameOver() {
  stopCapturingInput();
  stopRendering();
  playMenu.classList.remove('hidden');
  setLeaderboardHidden(true);
}
