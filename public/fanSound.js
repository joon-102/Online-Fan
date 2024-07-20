document.addEventListener('DOMContentLoaded', () => {
    const toggleSoundButton = document.getElementById('toggleSound');
    const whoAlertElement = document.querySelector('.who-alert');
    const strengthDisplay = document.querySelector('.strength');
    const fanBlades = document.querySelector('.fan-blades');
    const toggleOnlineButton = document.querySelector('.real-time');
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    let isPlaying = false;
    let noiseNode, gainNode;
    let step = 1;
    let socket;
    let isOnline = false;

    const icons = {
        unmute: `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" fill="currentColor" class="bi bi-volume-up-fill" viewBox="0 0 16 16">
                <path d="M11.536 14.01A8.47 8.47 0 0 0 14.026 8a8.47 8.47 0 0 0-2.49-6.01l-.708.707A7.48 7.48 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303z"/>
                <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.48 5.48 0 0 1 11.025 8a5.48 5.48 0 0 1-1.61 3.89z"/>
                <path d="M8.707 11.182A4.5 4.5 0 0 0 10.025 8a4.5 4.5 0 0 0-1.318-3.182L8 5.525A3.5 3.5 0 0 1 9.025 8 3.5 3.5 0 0 1 8 10.475zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06"/>
            </svg>
        `,
        mute: `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="14" fill="currentColor" class="bi bi-volume-mute-fill" viewBox="0 0 16 16">
                <path d="M6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06m7.137 2.096a.5.5 0 0 1 0 .708L12.207 8l1.647 1.646a.5.5 0 0 1-.708.708L11.5 8.707l-1.646 1.647a.5.5 0 0 1-.708-.708L10.793 8 9.146 6.354a.5.5 0 1 1 .708-.708L11.5 7.293l1.646-1.647a.5.5 0 0 1 .708 0"/>
            </svg>
        `
    };

    toggleSoundButton.innerHTML = icons.unmute;

    function createFanSound() {
        const bufferSize = 2 * audioContext.sampleRate;
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const output = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = audioContext.createBufferSource();
        whiteNoise.buffer = buffer;
        whiteNoise.loop = true;

        const filter = audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(500, audioContext.currentTime);

        gainNode = audioContext.createGain();
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(audioContext.destination);

        noiseNode = whiteNoise;
    }

    function startFanSound() {
        createFanSound();
        noiseNode.start();
        updateDisplay();
        toggleSoundButton.innerHTML = icons.unmute;
        isPlaying = true;
    }

    function stopFanSound() {
        if (noiseNode) {
            noiseNode.stop();
        }
        toggleSoundButton.innerHTML = icons.mute;
        isPlaying = false;
    }

    function updateDisplay() {
        strengthDisplay.innerHTML = `모드 : ${step} 단계`;
        fanBlades.style.animation = `spin ${0.6 - (step * 0.1)}s linear infinite`;
    }

    function adjustVolume(increase) {
        if (isOnline) {
            if (increase && step < 5) {
                step++;
                socket.emit("plus", { step: step, username: globalThis.username });
            } else if (!increase && step > 1) {
                step--;
                socket.emit("minus", { step: step, username: globalThis.username });
            }
        } else {
            if (increase && step < 5) {
                step++;
                gainNode.gain.value = Math.min(gainNode.gain.value + 0.1, 1.0);
            } else if (!increase && step > 1) {
                step--;
                gainNode.gain.value = Math.max(gainNode.gain.value - 0.1, 0.0);
            }
        }
        updateDisplay();
    }

    toggleSoundButton.addEventListener('click', () => {
        isPlaying ? stopFanSound() : startFanSound(); // 신문법 거의 처음 써봄 키읔
    });

    function webSocket() {
        if (!socket) {
            socket = io({ path: '/socket.io' });

            socket.on("connect", () => {
                socket.on("step", (data) => {
                    step = data.step;
                    whoAlertElement.innerHTML = `<p>수정자 : ${data.username}</p>`;
                    updateDisplay()
                });
            })
        }

        if (isOnline == true) {
            isOnline = false;
            toggleOnlineButton.innerHTML = `Start Online mode`
            whoAlertElement.innerHTML = `<p></p>`;
            toggleOnlineButton.style.background = '#444'
            toggleOnlineButton.style.color = '#d3d3d3'

            socket.off('step')
            socket.off('connect')
        } else {
            isOnline = true;
            toggleOnlineButton.innerHTML = `Stop Online mode`
            toggleOnlineButton.style.background = 'linear-gradient(in hsl longer hue 45deg, rgba(255, 0, 0, 0.537) 0 0)'
            toggleOnlineButton.style.color = 'black'
        }
    }

    document.querySelector('.real-time').addEventListener('click', webSocket);
    document.querySelector('.ok').addEventListener('click', startFanSound);
    document.querySelector('.plus').addEventListener('click', () => adjustVolume(true));
    document.querySelector('.minus').addEventListener('click', () => adjustVolume(false));
});
