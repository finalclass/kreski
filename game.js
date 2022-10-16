const startGame = (function () {
    const playerColors = ['#f00', '#0f0', '#00f', '#ff0', '#f0f', '#0ff', '#fff', '#000'];
    const controls = ['q', '/', 'v', 'u', 'z', 'm', 'r', ']'];
    /** @type {HTMLCanvasElement} */
    const $view = document.querySelector('#view');
    /** @type {CanvasRenderingContext2D} */
    const ctx = $view.getContext('2d');
    const width = $view.width;
    const height = $view.height;
    const trackSize = 2;
    const pressedKeys = {};
    const grassColor = '#070';

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    function onKeyDown(event) {
        pressedKeys[event.key.toLowerCase()] = true;
    }

    function onKeyUp(event) {
        pressedKeys[event.key.toLowerCase()] = false;
    }

    function initPlayer(size, playerNumber, totalPlayers) {
        const trackHeight = (height - height / trackSize) / 2;
        const gap = trackHeight / (totalPlayers + 1);
        const trackHeightStart = height - trackHeight;

        const head = {
            x: width / 2,
            y: trackHeightStart + gap * (playerNumber + 1)
        }

        const tail = [];
        for (let i = 0; i < size; i += 1) {
            tail.push({
                x: head.x - i,
                y: head.y,
            });
        }

        return {
            color: playerColors[playerNumber],
            head,
            tail: tail.reverse(),
            thickness: 4,
            speed: 0.3,
            hasCollided: false,
            controlKey: controls[playerNumber],
            direction: 0
        };
    }

    function isCollision(playerHead) {
        const data = ctx.getImageData(playerHead.x, playerHead.y, 1, 1).data;
        return data[0] === 0 && data[1] === 119 && data[2] === 0 && data[3] === 255
    }

    function drawTrack() {
        // outer track
        ctx.beginPath();
        ctx.fillStyle = '#333';
        ctx.ellipse(width / 3, height / 2, width / 3, height / 2, 0,  Math.PI / 2, -Math.PI / 2);
        ctx.rect(width / 3, 0, width / 3, height);
        ctx.ellipse(2 * width / 3, height / 2, width / 3, height / 2, 0,  -Math.PI / 2, Math.PI / 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = grassColor;
        ctx.ellipse(width / 3, height / 2, width / (3 * trackSize) , height / (2 * trackSize), 0,  Math.PI / 2, -Math.PI / 2);
        ctx.rect(
            width / 3,
            height / 2 - height / (2 * trackSize),
            width / 3,
            2 * (height / (2 * trackSize))
        );
        ctx.ellipse(2 * width / 3, height / 2, width / (3 * trackSize) , height / (2 * trackSize), 0,  -Math.PI / 2, Math.PI / 2);
        ctx.fill();
    }

    function drawBackground() {
        ctx.beginPath();
        ctx.fillStyle = grassColor;
        ctx.rect(0, 0, width, height);
        ctx.fill();
    }

    function drawPlayers(players) {
        for (let p = 0; p < players.length; p += 1) {
            const player = players[p];
            ctx.beginPath();
            ctx.fillStyle = player.color;
            ctx.fillRect(player.head.x - player.thickness / 2, player.head.y - player.thickness / 2, player.thickness, player.thickness);
            for (let i = 0; i < player.tail.length; i += 1) {
                ctx.fillRect(player.tail[i].x - player.thickness / 2, player.tail[i].y - player.thickness / 2, player.thickness, player.thickness);
            }
            ctx.fill();
        }
    }

    function drawStart() {
        ctx.beginPath();
        ctx.strokeStyle = '#999';
        ctx.moveTo(width / 2, height / 2 + height / (2 * trackSize));
        ctx.lineTo(width / 2, height);
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    function draw(state) {
        drawBackground();
        drawTrack();
        drawStart();
        drawPlayers(state.players);

        drawCounter(state);
    }

    function drawCounter(state) {
        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        const fontSize = Math.round(height / 20);
        ctx.font = fontSize + 'px sans-serif';

        if (state.countingOnePassed) {
            ctx.fillText('3', width / 2 - fontSize * 2, height / 2);
        } else {
            ctx.strokeText('3', width / 2 - fontSize * 2, height / 2);
        }

        if (state.countingTwoPassed) {
            ctx.fillText('2', width / 2, height / 2);
        } else {
            ctx.strokeText('2', width / 2, height / 2);
        }

        if (state.countingThreePassed) {
            ctx.fillText('1', width / 2 + fontSize * 2, height / 2);
        } else {
            ctx.strokeText('1', width / 2 + fontSize * 2, height / 2);
        }
    }

    function playNote(frequency, duration) {
        // create Oscillator node
        const audioCtx = new(window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();

        oscillator.type = 'square';
        oscillator.frequency.value = frequency; // value in hertz
        oscillator.connect(audioCtx.destination);
        oscillator.start();

        setTimeout(
            function() {
                oscillator.stop();
            }, duration);
    }

    let lastTimestampMs = 0;

    function updateState(timestampMs, state) {
        const timeMs = timestampMs - lastTimestampMs;
        lastTimestampMs = timestampMs;

        if (state.isCounting) {
            const countingTime = timestampMs - state.countingStartTime;

            if (countingTime > 0) {
                if (!state.countingOnePassed) {
                    playNote(659, 32)
                }
                state.countingOnePassed = true;
            }
            if (countingTime > 1000) {
                if (!state.countingTwoPassed) {
                    playNote(659, 32)
                }
                state.countingTwoPassed = true;
            }

            if (countingTime > 2000) {
                if (!state.countingThreePassed) {
                    playNote(987, 4)
                }
                state.countingThreePassed = true;
                state.isCounting = false;
                state.started = true;
            }
        }
        if (!state.started && pressedKeys['enter']) {
            state.isCounting = true;
            state.countingStartTime = timestampMs;
        }

        if (state.started) {
            state.players.forEach(player => {

                const oldHead = player.head;
                player.tail.push(oldHead);
                player.tail.shift();

                if (pressedKeys[player.controlKey]) {
                    player.direction += -Math.PI / 200;
                }

                player.head = {
                    x: oldHead.x + player.speed * timeMs * Math.cos(player.direction),
                    y: oldHead.y + player.speed * timeMs * Math.sin(player.direction)
                };

                if (isCollision(player.head)) {
                    player.speed = 0;
                    player.hasCollided = true;
                }
            });
        }

        return state;
    }

    function initialState(totalPlayers) {
        const players = [];

        for (let i = 0; i < totalPlayers; i += 1) {
            players.push(initPlayer(width / 70, i, totalPlayers));
        }

        return {
            isCounting: false,
            countingStartTime: 0,
            started: false,
            countingOnePassed: false,
            countingTwoPassed: false,
            countingThreePassed: false,
            players
        };
    }

    function tick(state, timestampMs) {
        state = updateState(timestampMs, state);
        draw(state);
        requestAnimationFrame(tick.bind(null, state));
    }

    return function start(totalPlayers) {
        const state = initialState(totalPlayers);
        requestAnimationFrame(tick.bind(null, state));
    }
})();

startGame(4);
