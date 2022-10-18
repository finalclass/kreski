const initUI = (function () {
    let speed = 0.5;
    let trackSize = 2;
    let totalPlayers = 4;
    let laps = 3;

    function globalSettings() {
        return `
        <style>
            .form-item {
                margin: 20px 0;
            }

            .form-item label {
                width: 150px;
                display: inline-block;
            }
        </style>
        <div class="global-settings">
            <div class="form-item">
                <label for="game-speed">Motorcycle speed</label>
                <input type="range" id="game-speed" min="0.1" max="1.3" value="${speed}" step="0.1">
                ${speed}
            </div>
            <div class="form-item">
                <label for="track-size">Track size</label>
                <input type="range" id="track-size" min="1.2" max="3.4" value="${trackSize}" step="0.2">
                ${trackSize}
            </div>
            <div class="form-item">
                <label for="total-players">Number of players</label>
                <input type="range" id="total-players" min="1" max="8" value="${totalPlayers}" step="1">
                ${totalPlayers}
            </div>

            <div class="form-item">
                <label for="laps">Number of laps</label>
                <input type="range" id="laps" min="1" max="20" value="${laps}" step="1">
                ${laps}
            </div>
        </div>
        `;
    }

    function renderMenu() {
        const menu = document.createElement('nav');

        menu.innerHTML = `
<div class="menu" style="
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    flex-direction: column;
">
  <img src="logo.png" />
  <div class="settings-content" style="
    background: #fff;
    padding: 20px;
    border-radius: 5px;
  ">
      ${globalSettings()}
  </div>
  <button id="start-btn">Start</button>
</div>
        `;

        document.body.appendChild(menu);
        document.querySelector('#game-speed').addEventListener('input', (event) => {
            speed = parseFloat(event.target.value, 10);
            document.querySelector('#game-speed').nextSibling.textContent = speed;
            saveProps();
        });

        document.querySelector('#track-size').addEventListener('input', (event) => {
            trackSize = parseFloat(event.target.value, 10);
            document.querySelector('#track-size').nextSibling.textContent = trackSize;
            saveProps();
        });

        document.querySelector('#total-players').addEventListener('input', (event) => {
            totalPlayers = parseInt(event.target.value, 10);
            document.querySelector('#total-players').nextSibling.textContent = totalPlayers;
            saveProps();
        });

        document.querySelector('#laps').addEventListener('input', (event) => {
            laps = parseInt(event.target.value, 10);
            document.querySelector('#laps').nextSibling.textContent = laps;
            saveProps();
        });

        const $startBtn = document.querySelector('#start-btn');
        $startBtn.focus();
        $startBtn.addEventListener('click', () => {
            document.body.removeChild(menu);
            startGame({ speed, trackSize, totalPlayers, laps });
        });
    }

    function saveProps() {
        const props = {
            speed,
            trackSize,
            totalPlayers,
            laps
        };

        localStorage.setItem('props', JSON.stringify(props));
    }

    function loadProps() {
        const props = JSON.parse(localStorage.getItem('props'));
        if (props) {
            speed = props.speed;
            trackSize = props.trackSize;
            totalPlayers = props.totalPlayers;
            laps = props.laps;
        }
    }

    return function () {
        loadProps();
        renderMenu();
    }
})();

initUI();
