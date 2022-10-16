const initUI = (function () {
    let speed = 0.3;
    let trackSize = 2;

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
                <input type="range" id="game-speed" min="0.1" max="5" value="0.3" step="0.1">
                ${speed}
            </div>
            <div class="form-item">
                <label for="track-size">Track size</label>
                <input type="range" id="track-size" min="1" max="5" value="2" step="1">
                ${trackSize}
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
    justify-content: center;
    align-items: center;
">
  <div class="settings-content" style="
    background: #fff;
    padding: 20px;
    border-radius: 5px;
  ">
      ${globalSettings()}
  </div>
</div>
        `;
        document.body.appendChild(menu);
        document.querySelector('#game-speed').addEventListener('input', (event) => {
            speed = event.target.value;
            document.querySelector('#game-speed').nextSibling.textContent = speed;
        });

        document.querySelector('#track-size').addEventListener('input', (event) => {
            trackSize = event.target.value;
            document.querySelector('#track-size').nextSibling.textContent = trackSize;
        });
    }

    return function () {
        renderMenu();
    }
})();

initUI();
