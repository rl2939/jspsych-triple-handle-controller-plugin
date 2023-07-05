var jsVAVideo = (function (jspsych) {
  "use strict";

  /* Set up constants */
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
      mode: {
        type: jspsych.ParameterType.STRING,
        default: "DEBUG",
      },
      axes_labels: {
        type: jspsych.ParameterType.COMPLEX,
        default: ["valence", "arousal"],
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
   * **Subjective Perception Logger**
   *
   * This plugin collects responses to an video file in real time
   * using a game controller.
   *
   * @author YOUR NAME
   * @see {@link https://DOCUMENTATION_URL DOCUMENTATION LINK TEXT}
   */
  class jsVAVideoPlugin {
    constructor(jsPsych) {
      this.jsPsych = jsPsych;
    }

    /**
     * Finds (seeks) out gamepads.
     * @returns {Array} An Array of Gamepad objects
     */
    seekGamepads() {
      return navigator.getGamepads
        ? navigator.getGamepads()
        : webkitGetGamepads
        ? webkitGetGamepads()
        : [];
    }

    /**
     * Converts a value from one range to another.
     * @param {Number} value Value to convert.
     * @param {Number} in_min Minimum value of the old range.
     * @param {Number} in_max Maximum value of the old range.
     * @param {Number} out_min Minimum value of the new range.
     * @param {Number} out_max Minimum value of the new range.
     * @returns {Number} The value from the old range converted to the new range.
     */
    mapValue(value, in_min, in_max, out_min, out_max) {
      return (
        ((value - in_min) * (out_max - out_min)) / (in_max - in_min) + out_min
      );
    }

    /**
     * Collects and update values from a controller.
     * @returns {undefined} No value.
     */
    updateStatus() {
      if (!this.animate) {
        return;
      }
      const gamepads = this.seekGamepads();
      if (gamepads.length == 0) {
        return;
      }
      for (const i in gamepads) {
        // this assumes only one plugged in controller
        if (gamepads[i] && "axes" in gamepads[i]) {
          let valence = gamepads[i].axes[this.throttleValenceAxis],
            arousal = gamepads[i].axes[this.throttleArousalAxis];
          let valenceMeter = 1 - (valence + 1) / 2,
            arousalMeter = 1 - (arousal + 1) / 2;

          this.currentArousal = Math.max(
            0,
            this.mapValue(arousalMeter, this.zeroThreshold, 1, 0, 1)
          );
          this.currentValence = Math.max(
            0,
            this.mapValue(valenceMeter, this.zeroThreshold, 1, 0, 1)
          );

          document
            .getElementById("vav-measuring-dimension-1")
            .style.setProperty(
              `--meter-height`,
              Math.ceil(100 * this.currentValence) / 100
            );
          document
            .getElementById("vav-measuring-dimension-0")
            .style.setProperty(
              `--meter-height`,
              Math.ceil(100 * this.currentArousal) / 100
            );
        }
      }
      requestAnimationFrame(this.updateStatus);
    }

    /**
     * Ends a trial.
     */
    endIt() {
      window.clearInterval(this.interval);
      this.animate = false;
      // end trial
      this.jsPsych.finishTrial({
        data_arrays: this.dataArrays,
        rate: this.rate,
        video_src: this.videoSrc,
        duration: this.videoDuration,
      });
    }

    /**
     * Checks if there is a controller with at least two axises are plugged in. 
     * @returns {Boolean} True if a controller with at least two axes are pluged in, false otherwise
     */
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

    /**
     * Connects a gamepad.
     * @param {Gamepad} e The gamepad object to be connected.
     */
    connectHandler(e) {
      this.controllers[e.gamepad.index] = e.gamepad;
      if (this.validControllerPluggedIn()) {
        document.getElementById("vav-overlay").style.display = "none";
        this.startDataCollection();
      }
    }
    /**
     * Disconnects a gamepad.
     * @param {Gamepad} e The gamepad object to be disconnected. 
     */
    disconnectHandler(e) {
      delete this.controllers[e.gamepad.index];
      if (!this.validControllerPluggedIn()) {
        document.getElementById("vav-overlay").style.display = "flex";
        this.pauseRecording();
        this.pausePlaying();
      }
    }
    /**
     * Starts the data collection
     * @returns {undefined} No value if there is data collection already started.
     */
    startDataCollection() {
      if (this.interval != null) {
        // has already started!
        return;
      }

      if (Object.keys(this.controllers).length > 0) {
        this.animate = true;
        requestAnimationFrame(this.updateStatus);
        this.interval = window.setInterval(() => {
          this.recordData();
        }, this.rate);
      }
    }

    /**
     * Records data from the controller.
     * @returns {undefined} No data
     */
    recordData() {
      if (
        this.currentArousal == null ||
        this.currentValence == null ||
        this.videoPlayer.paused ||
        !this.recordingData
      ) {
        this.recordingFeedback.innerText = "";
        return;
      }
      if (this.mode == "DEBUG") {
        this.recordingFeedback.innerText = "Recording";
      }
      let i = this.dataArrays.length - 1;
      this.dataArrays[i].valence.push(this.currentValence);
      this.dataArrays[i].arousal.push(this.currentArousal);
      console.log(this.currentValence, this.currentArousal);
    }

    /**
     * Resets all axis data
     */
    resetData() {
      this.dataArrays.push({ valence: [], arousal: [] });
    }

    /**
     * Starts the video.
     */
    startPlaying() {
      this.playBtn.textContent = this.pauseStr;
      this.playBtn.classList.add("active-btn");
      this.videoPlayer.classList.add("playing");
      this.recordBtn.disabled = true;
      this.videoPlayer.play();
    }
    
    /**
     * Pauses the video.
     */
    pausePlaying() {
      this.playBtn.textContent = this.playStr;
      this.playBtn.classList.remove("active-btn");
      this.videoPlayer.classList.remove("playing");
      this.recordBtn.disabled = false;
      this.videoPlayer.pause();
    }

    /**
     * Starts recording of data. Also starts the video in the video player.
     */
    startRecording() {
      if (!this.recordingData) {
        this.recordingData = true;
        this.videoPlayer.currentTime = 0;
      }
      this.resetBtn.disabled = false;
      this.videoPlayer.classList.add("recording");
      this.measuringNeedles[0].classList.add("recording");
      this.measuringNeedles[1].classList.add("recording");
      this.recordBtn.textContent = this.pauseStr;
      this.recordBtn.classList.add("active-btn");
      this.playBtn.disabled = true;
      this.videoPlayer.play();
    }

    /**
     * Pauses recording of data.
     */
    pauseRecording() {
      this.videoPlayer.pause();
      this.videoPlayer.classList.remove("recording");
      this.measuringNeedles[0].classList.remove("recording");
      this.measuringNeedles[1].classList.remove("recording");
      this.recordBtn.textContent = this.recordStr;
      this.recordBtn.classList.remove("active-btn");
      this.playBtn.disabled = false;
    }

    /**
     * Stops recording of data.
     */
    stopRecording() {
      this.pauseRecording();
      this.recordingData = false;
      this.resetData();
    }

    /**
     * Starts the video. Does not record data.
     * @returns {undefined} No value
     */
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

        this.startPlaying();
      } else {
        this.pausePlaying();
      }
    }

    /**
     * Starts recording data.
     */
    recordButtonClick() {
      // when the video is playing but not recording
      // this button will be disabled, so no need to
      // test those cases
      if (this.videoPlayer.paused) {
        this.startRecording();
      } else {
        this.pauseRecording();
      }
    }

    /**
     * Locks the video player button and unlocks the data buttons.
     */
    videoEnded() {
      if (this.recordingData) {
        // locks player buttons
        this.recordBtn.disabled = true;
        this.recordBtn.textContent = this.recordStr;
        this.recordBtn.classList.remove("active-btn");
        this.playBtn.disabled = true;
        this.playBtn.textContent = this.playStr;
        this.playBtn.classList.remove("active-btn");

        this.videoPlayer.classList.remove("recording", "playing");
        this.measuringNeedles[0].classList.remove("recording");
        this.measuringNeedles[1].classList.remove("recording");

        // unlocks data button
        this.saveBtn.disabled = false;
      } else {
        this.videoPlayer.currentTime = 0;
        this.pausePlaying();
      }
    }

    /**
     * Resets the video and the recording.
     * @returns {undefined} No data
     */
    resetButtonClick() {
      if (this.recordingData) {
        // this might not always be needed, but it's probably
        // fine to call it just in case
        this.pauseRecording();
      }
      if (
        !window.confirm(
          `This will remove the already recorded data and start again. Are you sure?`
        )
      ) {
        return;
      }
      this.videoPlayer.currentTime = 0;
      this.resetData();
      this.recordBtn.disabled = false;
      this.playBtn.disabled = false;
      this.resetBtn.disabled = true;
      this.saveBtn.disabled = true;
    }

    /**
     * Saves data.
     */
    saveButtonClick() {
      this.endIt();
    }

    /**
     * Combines labels together
     * @param {*} labels The labels to be formatted
     * @returns {String} None if no labels, 
     * HTML containing a span of the cominbed string otherwise.
     */
    formatLabels(labels) {
      if (!labels) {
        return ``;
      }
      return labels.map((s) => "<span>" + s + "</span>").join("");
    }

    /**
     * Sets up a trial to record controller in real time 
     * while watching a video.
     * @param {HTMLElement} display_element The DOM element 
     * where jsPsych content is being rendered.
     * @param {object} trial Object containing all of the 
     * parameters specified in the corresponding TimelineNode. 
     */
    trial(display_element, trial) {
      this.animate = false;
      this.currentValence = null;
      this.currentArousal = null;
      this.controllers = {};
      this.rate = trial.rate;
      this.mode = trial.mode ? trial.mode : "DEBUG";
      this.interval = null;
      this.throttleValenceAxis = trial.throttle_valence_axis;
      this.throttleArousalAxis = trial.throttle_arousal_axis;
      this.dataArrays = [{ valence: [], arousal: [] }];
      this.videoSrc = trial.video_src;
      /* actual zero on the throttle is `sticky,` so to avoid 
      forcing users to apply an excess of strength to move 
      the throttle out of 0, we slightly reduce the scale */
      this.zeroThreshold = 0.2;

      display_element.innerHTML = `
      <style>
        :root {
          --meter-height: 0.5;
          --meter-width: 3rem;
          --meter-margin: 3px;
          --meter-max-height: 80vh;
          --roundness: 3rem;
          --fast-transition: 0.2s;
          --meter-bg: 0, 0, 0;
          --meter-fg: 0, 0, 0;
          --meter-border-color: 255, 255, 255;
        }

        #jsvavideo-container {
          display: grid;
          gap: 3rem;
          grid-template-columns: minmax(var(--measuring-needle-w), auto) fit-content(960px) minmax(var(--measuring-needle-w), auto);
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
          background-color: rgb(var(--meter-bg));
          border-radius: var(--roundness);
        }

        .vav-measuring-needle.recording {
          --meter-fg: 255, 255, 255;
        }
        .vav-measuring-needle:after {
          content: "";
          transition: var(--fast-transition) ease background-color;
          position: absolute;
          bottom: var(--meter-margin);
          right: var(--meter-margin);
          left: var(--meter-margin);
          background-color: rgb(var(--meter-fg));
          border: var(--meter-margin) solid rgb(var(--meter-border-color));
          border-radius: var(--roundness);
          box-sizing: border-box;
          height: calc(
            (var(--meter-max-height) - 1 * var(--meter-margin) - var(--roundness)) *
              var(--meter-height) + var(--roundness) - var(--meter-margin)
          );
        }

        #vav-measuring-dimension-0 {
          grid-column: 1;
        }
        #vav-measuring-dimension-1 {
          grid-column: 3;
        }

        .vav-measuring-labels, .vav-axis-label {
          display: flex;
          width: calc(var(--meter-max-height) - 1 * var(--roundness));
          height: 1rem;
          position: absolute;
          align-items: center;
          justify-content: space-between;
          text-transform: uppercase;
        }

        .vav-axis-label {
          font-weight: 700;
          justify-content: center;
        }

        #vav-measuring-dimension-0 .vav-measuring-labels, #vav-measuring-dimension-1 .vav-axis-label {
          transform: rotate(90deg)
            translateY(calc(var(--meter-width) * -0.5 - var(--meter-margin) * 4));
          flex-direction: row-reverse;
        }

        #vav-measuring-dimension-1 .vav-measuring-labels, #vav-measuring-dimension-0 .vav-axis-label {
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

        #vav-video-toolbar {
          display: grid;
          grid-template-columns: max-content auto max-content;
          gap: 1rem;
        }

        #vav-video-column {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
        }

        #vav-player {
          width: 100%;
          box-sizing: border-box;
          transition: var(--fast-transition) ease border-color;
          border: calc(2 * var(--meter-margin)) solid black;
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

        #recording-feedback {
          position: fixed;
          left: 1rem;
          bottom: 1rem;
        }
      </style>
      <div id="vav-overlay">
        <p>
          A controller with throttles has not been detected.
          If you have already plugged one in, please try pressing any 
          of its buttons or sliding its throttles to activate it.
        </p>
      </div>
      <div id="recording-feedback">...</div>
      <div id="jsvavideo-container">
        <div
          class="vav-measuring-needle-container"
          id="vav-measuring-dimension-0"
        >
          ${
            trial.axes_labels
              ? '<div class="vav-axis-label">' + trial.axes_labels[0] + "</div>"
              : ""
          }
          <div class="vav-measuring-needle"></div>
          <div class="vav-measuring-labels">
            ${this.formatLabels(trial.arousal_labels)}
          </div>
        </div>
        <div id="vav-video-column">
          <div id="vav-video-container">
            ${trial.title ? '<h1 id="vav-title">' + trial.title + "</h1>" : ""}
            <video id="vav-player" src="${
              trial.video_src ? trial.video_src : ""
            }"></video>
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
          ${
            trial.axes_labels
              ? '<div class="vav-axis-label">' + trial.axes_labels[1] + "</div>"
              : ""
          }
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

      this.recordingFeedback = document.getElementById("recording-feedback");
      if (this.mode !== "DEBUG") {
        this.recordingFeedback.style.display = "none";
      }

      this.playBtn.addEventListener("click", this.playButtonClick);
      this.recordBtn.addEventListener("click", this.recordButtonClick);
      this.resetBtn.addEventListener("click", this.resetButtonClick);
      this.saveBtn.addEventListener("click", this.saveButtonClick);

      this.videoPlayer = document.getElementById("vav-player");
      this.videoPlayer.addEventListener("ended", this.videoEnded);
      this.videoPlayer.addEventListener("loadedmetadata", () => {
        this.videoDuration = this.videoPlayer.duration;
      });

      this.measuringNeedles = document.getElementsByClassName(
        "vav-measuring-needle"
      );

      /**
       * Looks to see if a gamepad is connected.
       */
      window.addEventListener("gamepadconnected", (e) => {
        this.connectHandler(e);
      });

      /**
       * Looks to see if a gamepad is disconnected.
       */
      window.addEventListener("gamepaddisconnected", (e) => {
        this.disconnectHandler(e);
      });
    }
  }
  jsVAVideoPlugin.info = info;

  return jsVAVideoPlugin;
})(jsPsychModule);
