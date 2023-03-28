const startGame = (function () {
    const playerColors = ['#f00', '#0f0', '#99f', '#ff0', '#f0f', '#0ff', '#fff', '#000'];
    const controls = ['q', '/', 'v', 'u', 'z', 'm', 'r', ']'];
    /** @type {HTMLCanvasElement} */
    const $view = document.querySelector('#view');
    /** @type {CanvasRenderingContext2D} */
    const ctx = $view.getContext('2d');
    const width = $view.width;
    const height = $view.height;
    const pressedKeys = {};
    const grassColor = '#070';

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    function middleEllipseRadius(trackSize) {
        return height / (2 * trackSize);
    }

    function renderTimestamp(ts) {
        const d = new Date(ts);
        return d.getMinutes().toString().padStart(2, '0') +
            ':' +
            d.getSeconds().toString().padStart(2, '0') +
            '.' +
            d.getMilliseconds().toString().padStart(3, '0');
    }

    function onKeyDown(event) {
        pressedKeys[event.key.toLowerCase()] = true;
    }

    function onKeyUp(event) {
        pressedKeys[event.key.toLowerCase()] = false;
    }

    function initPlayer(size, playerNumber, totalPlayers, trackSize, speed) {
        const trackHeight = (height / 2) - middleEllipseRadius(trackSize);
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
            speed,
            turnSpeed: 4 * speed,
            hasCollided: false,
            controlKey: controls[playerNumber],
            direction: 0,
            hasFinished: false,
            finishedAt: 0,
            currentSide: 'left',
            sidesSwitches: 0
        };
    }

    function isCollision(playerHead) {
        const data = ctx.getImageData(playerHead.x, playerHead.y, 1, 1).data;
        return data[0] === 0 && data[1] === 119 && data[2] === 0 && data[3] === 255
    }

    function drawTrack(state) {
        // outer track
        ctx.beginPath();
        ctx.fillStyle = '#333';
        ctx.ellipse(width / 3, height / 2, width / 3, height / 2, 0,  Math.PI / 2, -Math.PI / 2);
        ctx.rect(width / 3, 0, width / 3, height);
        ctx.ellipse(2 * width / 3, height / 2, width / 3, height / 2, 0,  -Math.PI / 2, Math.PI / 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = grassColor;
        ctx.ellipse(
            width / 3,
            height / 2,
            width / (3 * state.trackSize) ,
            middleEllipseRadius(state.trackSize),
            0,
            Math.PI / 2,
            -Math.PI / 2
        );
        ctx.rect(
            width / 3,
            height / 2 - height / (2 * state.trackSize),
            width / 3,
            2 * (height / (2 * state.trackSize))
        );
        ctx.ellipse(
            2 * width / 3,
            height / 2,
            width / (3 * state.trackSize),
            middleEllipseRadius(state.trackSize),
            0,
            -Math.PI / 2,
            Math.PI / 2
        );
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

    function drawStart(state) {
        ctx.beginPath();
        ctx.strokeStyle = '#999';
        ctx.moveTo(width / 2, height / 2 + middleEllipseRadius(state.trackSize));
        ctx.lineTo(width / 2, height);
        ctx.lineWidth = 4;
        ctx.stroke();
    }

    function drawScore(state) {
        const scoresTop = (height - middleEllipseRadius(state.trackSize)) / 2.1;
        const scoresLeft = 0.8 * (width / 3);

        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.font = '30px sans-serif';
        for (let p = 0; p < state.players.length; p += 1) {
            const player = state.players[p];

            ctx.beginPath();
            ctx.fillStyle = player.color;
            ctx.rect(scoresLeft, scoresTop + p * 30, 30, 30);
            ctx.fill();

            ctx.beginPath();
            ctx.fillStyle = '#fff';
            ctx.font = '30px sans-serif';
            ctx.fillText(
                player.controlKey,
                scoresLeft + 40,
                scoresTop + p * 30 + 25
            );

            if (player.hasCollided || player.hasFinished) {

                ctx.beginPath();
                let suffix = 'CRASH';
                ctx.fillStyle = '#222';

                if (player.hasFinished && !isWinner(state.players, player)) {
                    suffix = 'FINISHED on position ' + getRank(state.players, player);
                    ctx.fillStyle = '#fff';
                }

                if (player.hasFinished && isWinner(state.players, player)) {
                    suffix = 'WINNER';
                    ctx.fillStyle = '#bb0';
                }

                ctx.fillText(
                    renderTimestamp(player.finishedAt - state.gameStartedAt) + ' ' + suffix,
                    scoresLeft + 60,
                    scoresTop + p * 30 + 25
                );
                ctx.fill();
            }
        }
    }

    function isGameFinished(players) {
        return players.filter(p => p.hasFinished || p.hasCollided).length === players.length;
    }

    function drawTimer(state) {
        if (!state.gameStartedAt) {
            return;
        }

        const now = state.gameFinishedAt || Date.now();

        ctx.beginPath();
        ctx.fillStyle = '#fff';
        ctx.font = '30px Arial';
        ctx.fillText(
            renderTimestamp(now - state.gameStartedAt),
            width / 2 - 50,
            height / 2 + height / 10
        );
        ctx.fill();
    }

    function draw(state) {
        drawBackground();
        drawTrack(state);
        drawStart(state);
        drawPlayers(state.players);
        drawScore(state);
        drawTimer(state);

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

        if (!state.gameFinishedAt && isGameFinished(state.players)) {
            state.gameFinishedAt = Date.now();
        }

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
                state.gameStartedAt = Date.now();
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
                    player.direction += -Math.PI / (200 / player.turnSpeed);
                }

                player.head = {
                    x: oldHead.x + player.speed * timeMs * Math.cos(player.direction),
                    y: oldHead.y + player.speed * timeMs * Math.sin(player.direction)
                };

                if (isCollision(player.head)) {
                    player.speed = 0;
                    player.hasCollided = true;
                    player.finishedAt = Date.now();
                    playNote(216, 32)
                }

                if (player.currentSide === 'left' && player.head.x > width / 2) {
                    player.currentSide = 'right';
                    player.sidesSwitches += 1;
                }

                if (player.currentSide === 'right' && player.head.x <= width / 2) {
                    player.currentSide = 'left';
                    player.sidesSwitches += 1;
                }

                if (!player.hasFinished && player.sidesSwitches === 1 + 2 * state.laps) {
                    player.hasFinished = true;
                    player.finishedAt = Date.now();
                    player.speed = 0;
                }
            });
        }

        return state;
    }

    function getRank(players, player) {
        return players.filter(p => p.finishedAt < player.finishedAt).length + 1;
    }

    function isWinner(players, player) {
        return players
            .filter(p => p.hasFinished)
            .sort((a, b) => a.finishedAt - b.finishedAt)[0] === player;
    }

    function initialState({ totalPlayers, laps, trackSize, speed }) {
        const players = [];

        for (let i = 0; i < totalPlayers; i += 1) {
            players.push(initPlayer(width / 140, i, totalPlayers, trackSize, speed));
        }

        return {
            trackSize,
            laps,
            isCounting: false,
            countingStartTime: 0,
            started: false,
            countingOnePassed: false,
            countingTwoPassed: false,
            countingThreePassed: false,
            players,
            gameStartedAt: 0,
            gameFinishedAt: 0,
            speed
        };
    }

    function tick(state, timestampMs) {
        state = updateState(timestampMs, state);
        draw(state);
        requestAnimationFrame(tick.bind(null, state));
    }

    return function start(cfg) {
        const state = initialState(cfg);
        requestAnimationFrame(tick.bind(null, state));
    }
})();

// startGame({ totalPlayers: 4, laps: 2, trackSize: 2 });
