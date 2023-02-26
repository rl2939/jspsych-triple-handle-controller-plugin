var jsVAVideo = (function (jspsych) {
  "use strict";

  const info = {
    name: "valence-arousal video annotation",
    parameters: {
      title: {
        type: jspsych.ParameterType.STRING,
        default: undefined,
      },
      video_src: {
        type: jspsych.ParameterType.STRING,
        default: undefined,
      },
      throttle_valence_axis: {
        type: jspsych.ParameterType.INT,
        default: undefined,
      },
      valence_labels: {
        type: jspsych.ParameterType.COMPLEX,
        default: ["negative", "neutral", "positive"],
      },
      arousal_labels: {
        type: jspsych.ParameterType.COMPLEX,
        default: ["low", "neutral", "high"],
      },
      throttle_arousal_axis: {
        type: jspsych.ParameterType.INT,
        default: undefined,
      },
      rate: {
        type: jspsych.ParameterType.INT,
        default: 1000,
      },
    },
  };

  /**
   * **PLUGIN-NAME**
   *
   * SHORT PLUGIN DESCRIPTION
   *
   * @author YOUR NAME
   * @see {@link https://DOCUMENTATION_URL DOCUMENTATION LINK TEXT}
   */
  class jsVAVideoPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    seekGamepads() {
      return navigator.getGamepads
        ? navigator.getGamepads()
        : webkitGetGamepads
        ? webkitGetGamepads()
        : [];
    }

    mapValue(value, in_min, in_max, out_min, out_max) {
      return (
        ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
      );
    }

    updateStatus() {
      const gamepads = this.seekGamepads();
      if (gamepads.length == 0) {
        return;
      }
      for (const i in gamepads) {
        // this assumes only one plugged in controller
        if (gamepads[i] && "axes" in gamepads[i]) {
          let valence = gamepads[i].axes[this.throttleValenceAxis],
            arousal = gamepads[i].axes[this.throttleArousalAxis];
          let valenceMeter =
              Math.round(10000 * (1 - (valence + 1) / 2)) / 10000,
            arousalMeter = Math.round(10000 * (1 - (arousal + 1) / 2)) / 10000;

          arousalMeter = Math.max(
            0,
            this.mapValue(arousalMeter, this.zeroThreshold, 1, 0, 1)
          );
          valenceMeter = Math.max(
            0,
            this.mapValue(valenceMeter, this.zeroThreshold, 1, 0, 1)
          );

          document
            .getElementById("vav-measuring-dimension-1")
            .style.setProperty(`--meter-height`, valenceMeter);
          document
            .getElementById("vav-measuring-dimension-0")
            .style.setProperty(`--meter-height`, arousalMeter);

          if (this.recordingData && !this.videoPlayer.paused) {
            this.recordData(valenceMeter, arousalMeter);
          }
        }
      }
    }

    endIt() {
      // data saving
      var trial_data = {
        parameter_name: "parameter value",
      };
      // end trial
      this.jsPsych.finishTrial(trial_data);
    }

    validControllerPluggedIn() {
      const gamepads = this.seekGamepads();
      if (gamepads.length == 0) {
        return false;
      }
      let foundValenceThrottle = false,
        foundArousalThrottle = false;
      for (const i in gamepads) {
        if (gamepads[i] && "axes" in gamepads[i]) {
          if (gamepads[i].axes[this.throttleValenceAxis] !== undefined) {
            foundValenceThrottle = true;
          }
          if (gamepads[i].axes[this.throttleValenceAxis] !== undefined) {
            foundArousalThrottle = true;
          }
        }
      }
      return foundValenceThrottle && foundArousalThrottle;
    }

    connectHandler(e) {
      console.log("connected");
      this.controllers[e.gamepad.index] = e.gamepad;
      if (this.validControllerPluggedIn()) {
        document.getElementById("vav-overlay").style.display = "none";
        this.startDataCollection();
      }
    }
    disconnectHandler(e) {
      console.log("disconnected");
      delete this.controllers[e.gamepad.index];
      if (!this.validControllerPluggedIn()) {
        console.log("invalid");
        document.getElementById("vav-overlay").style.display = "flex";
      }
    }

    startDataCollection() {
      if (this.interval != null) {
        // has already started!
        return;
      }

      if (Object.keys(this.controllers).length > 0) {
        this.interval = window.setInterval(() => {
          this.updateStatus();
        }, this.rate);
      }
    }

    recordData(valence, arousal) {
      let i = this.data.length - 1;
      this.data[i].valence.push(valence);
      this.data[i].arousal.push(arousal);
    }

    resetData() {
      this.data.push({ valence: [], arousal: [] });
    }

    startRecording() {
      if (!this.recordingData) {
        this.recordingData = true;
        this.videoPlayer.currentTime = 0;
      }
      this.videoPlayer.classList.add("recording");
      this.recordBtn.textContent = this.pauseStr;
      this.recordBtn.classList.add("active-btn");
      this.playBtn.disabled = true;
      this.videoPlayer.play();
    }
    pauseRecording() {
      this.videoPlayer.pause();
      this.videoPlayer.classList.remove("recording");
      this.recordBtn.textContent = this.recordStr;
      this.recordBtn.classList.remove("active-btn");
      this.playBtn.disabled = false;
    }
    stopRecording() {
      this.pauseRecording();
      this.recordingData = false;
      this.resetData();
    }

    playButtonClick() {
      if (this.playBtn.textContent == this.playStr) {
        if (this.recordingData) {
          // ask user if they want to reset previous recording
          if (
            !window.confirm(
              `There is a current recording in progress. Do you want to erase it?`
            )
          ) {
            return;
          }
          this.stopRecording();
          this.videoPlayer.currentTime = 0;
        }

        this.playBtn.textContent = this.pauseStr;
        this.playBtn.classList.add("active-btn");
        this.videoPlayer.classList.add("playing");
        this.recordBtn.disabled = true;
        this.videoPlayer.play();
      } else {
        this.playBtn.textContent = this.playStr;
        this.playBtn.classList.remove("active-btn");
        this.videoPlayer.classList.remove("playing");
        this.recordBtn.disabled = false;
        this.videoPlayer.pause();
      }
    }

    recordButtonClick() {
      if (this.recordBtn.textContent == this.recordStr) {
        this.startRecording();
      } else {
        this.pauseRecording();
      }
    }
    resetButtonClick() {}
    saveButtonClick() {}

    formatLabels(labels) {
      if (!labels) {
        return ``;
      }
      return labels.map((s) => "<span>" + s + "</span>").join("");
    }

    trial(display_element, trial) {
      this.controllers = {};
      this.rate = trial.rate;
      this.interval = null;
      this.throttleValenceAxis = trial.throttle_valence_axis;
      this.throttleArousalAxis = trial.throttle_arousal_axis;
      this.data = [{ valence: [], arousal: [] }];
      /* actual zero on the throttle is `sticky,` so to avoid 
      forcing users to apply an excess of strength to move 
      the throttle out of 0, we slightly reduce the scale */
      this.zeroThreshold = 0.2;

      display_element.innerHTML = `
      <style>
        :root {
          --meter-height: 0.5;
          --meter-width: 3rem;
          --meter-margin: 0.2rem;
          --meter-max-height: 80vh;
          --roundness: 3rem;
          --meter-bg: 0, 0, 0;
          --meter-fg: 255, 255, 255;
        }

        #jsvavideo-container {
          display: grid;
          gap: 3rem;
          --measuring-needle-w: calc(var(--meter-width) + 3rem);
          grid-template-columns: var(--measuring-needle-w) auto var(
              --measuring-needle-w
            );
          width: 100%;
        }

        .vav-measuring-needle-container {
          display: flex;
          justify-content: center;
          align-items: center;
          grid-row: 1;
        }

        .vav-measuring-needle {
          position: relative;
          height: var(--meter-max-height);
          width: var(--meter-width);
          background: rgb(var(--meter-bg));
          border-radius: var(--roundness);
        }

        .vav-measuring-needle:after {
          content: "";
          position: absolute;
          bottom: var(--meter-margin);
          right: var(--meter-margin);
          left: var(--meter-margin);
          background: rgb(var(--meter-fg));
          border-radius: var(--roundness);
          height: calc(
            (var(--meter-max-height) - var(--meter-margin) - var(--roundness)) *
              var(--meter-height) + var(--roundness) - var(--meter-margin)
          );
        }

        #vav-measuring-dimension-0 {
          grid-column: 1;
        }
        #vav-measuring-dimension-1 {
          grid-column: 3;
        }

        .vav-measuring-labels {
          display: flex;
          width: calc(var(--meter-max-height) - 1 * var(--roundness));
          height: 1rem;
          position: absolute;
          align-items: center;
          justify-content: space-between;
          text-transform: uppercase;
        }

        #vav-measuring-dimension-0 .vav-measuring-labels {
          transform: rotate(90deg)
            translateY(calc(var(--meter-width) * -0.5 - var(--meter-margin) * 4));
          flex-direction: row-reverse;
        }

        #vav-measuring-dimension-1 .vav-measuring-labels {
          transform: rotate(-90deg)
            translateY(calc(var(--meter-width) * -1 + var(--meter-margin) * 3.5));
          flex-direction: row;
        }

        #vav-video-container,
        #vav-measurements-plots {
          grid-column: 2;
        }

        #vav-video-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        #vav-title {
          margin: 0;
          text-align: center;
        }

        #vav-player {
          width: 100%;
        }

        #vav-video-toolbar {
          display: grid;
          grid-template-columns: max-content auto max-content max-content;
          gap: 1rem;
        }

        #vav-video-column {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
        }

        #vav-player {
          border: 3px solid black;
          border-radius: 0.25rem;
        }

        #vav-player.recording {
          border-color: tomato;
        }

        #vav-player.playing {
          border-color: mediumseagreen;
        }

        #vav-overlay {
          position: fixed;
          inset: 0;
          background-color: rgba(242, 242, 239, 0.9);
          backdrop-filter: blur(20px);
          z-index: 999999;
          display: flex;
          justify-content: center;
          align-items: center;
        }
  
        #vav-overlay p {
          max-width: 40ch;
          text-align: center;
          font-size: 1.5rem;
          line-height: 1.4;
        }

        .player-btn {
          word-spacing: 0.5rem;
        }

        #play-btn {
          color: seagreen;
          border-color: seagreen;
        }

        #play-btn:hover:not(disabled):not(.active-btn):not(:active) {
          background-color: #b7f7d3;
        }

        #play-btn:active, #play-btn.active-btn {
          background-color: seagreen;
          color: white;
        }

        #record-btn {
          border-color: tomato;
          color: tomato;
        }

        #record-btn:hover:not(disabled):not(.active-btn):not(:active) {
          background-color: mistyrose;
        }

        #record-btn:active, #record-btn.active-btn {
          background-color: tomato;
          color: white;
        }

        #play-btn:disabled, #record-btn:disabled {
          border-color: lightgray;
          color: lightgray;
          background-color: white !important;
        }

        #record-btn::first-letter {
        }
      </style>
      <div id="jsvavideo-container">
        <div id="vav-overlay">
          <p>
            A controller with throttles has not been detected.
            If you have already plugged one in, please try pressing any 
            of its buttons or sliding its throttles to activate it.
          </p>
        </div>
        <div
          class="vav-measuring-needle-container"
          id="vav-measuring-dimension-0"
        >
          <div class="vav-measuring-needle"></div>
          <div class="vav-measuring-labels">
            ${this.formatLabels(trial.arousal_labels)}
          </div>
        </div>
        <div id="vav-video-column">
          <div id="vav-video-container">
            ${trial.title ? '<h1 id="vav-title">' + trial.title + "</h1>" : ""}
            <video id="vav-player" src="./videos/ID120_vid4.mp4"></video>
            <div id="vav-video-toolbar">
              <div class="vav-toolbar-group">
                <button id="play-btn" class="jspsych-btn player-btn">► Play</button>
                <button id="record-btn" class="jspsych-btn player-btn">● Record</button>
              </div>
              <span></span>

              <div class="vav-toolbar-group">
                <button id="reset-btn" class="jspsych-btn" disabled>Try again</button>
                <button id="save-btn" class="jspsych-btn" disabled>Save</button>
              </div>
            </div>
          </div>
          <div id="vav-measurements-plots"></div>
        </div>
        <div
          class="vav-measuring-needle-container"
          id="vav-measuring-dimension-1"
        >
          <div class="vav-measuring-labels">
          ${this.formatLabels(trial.valence_labels)}
          </div>
          <div class="vav-measuring-needle"></div>
        </div>
      </div>`;

      this.playStr = "► Play";
      this.pauseStr = "⏸ Pause";
      this.recordStr = "● Record";

      this.playBtn = document.getElementById("play-btn");
      this.recordBtn = document.getElementById("record-btn");
      this.resetBtn = document.getElementById("reset-btn");
      this.saveBtn = document.getElementById("save-btn");

      this.recordingData = false;

      this.playBtn.addEventListener("click", this.playButtonClick);
      this.recordBtn.addEventListener("click", this.recordButtonClick);
      this.resetBtn.addEventListener("click", this.resetButtonClick);
      this.saveBtn.addEventListener("click", this.saveButtonClick);

      this.videoPlayer = document.getElementById("vav-player");

      window.addEventListener("gamepadconnected", (e) => {
        this.connectHandler(e);
      });
      window.addEventListener("gamepaddisconnected", (e) => {
        this.disconnectHandler(e);
      });
    }
  }
  jsVAVideoPlugin.info = info;

  return jsVAVideoPlugin;
})(jsPsychModule);
