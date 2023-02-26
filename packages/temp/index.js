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

          document
            .getElementById("vav-measuring-dimension-1")
            .style.setProperty(`--meter-height`, valenceMeter);
          document
            .getElementById("vav-measuring-dimension-0")
            .style.setProperty(`--meter-height`, arousalMeter);
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

    trial(display_element, trial) {
      this.controllers = {};
      this.rate = trial.rate;
      this.title = trial.title;
      this.interval = null;
      this.throttleValenceAxis = trial.throttle_valence_axis;
      this.throttleArousalAxis = trial.throttle_arousal_axis;
      this.data = { valence: [], arousal: [] };

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
          display: flex;
          justify-content: center;
          gap: 1rem;
        }

        #vav-video-column {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
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
            <span>Calm</span>
            <span>Neutral</span>
            <span>Excited</span>
          </div>
        </div>
        <div id="vav-video-column">
          <div id="vav-video-container">
            ${this.title ? '<h1 id="vav-title">' + this.title + "</h1>" : ""}
            <video id="vav-player" src="./videos/ID120_vid4.mp4"></video>
            <div id="vav-video-toolbar">
              <button>Play</button>
              <button>Reset</button>
            </div>
          </div>
          <div id="vav-measurements-plots"></div>
        </div>
        <div
          class="vav-measuring-needle-container"
          id="vav-measuring-dimension-1"
        >
          <div class="vav-measuring-labels">
            <span>Negative</span>
            <span>Neutral</span>
            <span>Positive</span>
          </div>
          <div class="vav-measuring-needle"></div>
        </div>
      </div>

        <button id="end-it">End it</button>`;
      document.getElementById("end-it").addEventListener("click", () => {
        console.log("oi");
        this.endIt();
      });

      window.addEventListener("gamepadconnected", (e) => {
        this.connectHandler(e);
      });
      window.addEventListener("gamepaddisconnected", (e) => {
        this.disconnectHandler(e);
      });

      this.startDataCollection();
    }
  }
  jsVAVideoPlugin.info = info;

  return jsVAVideoPlugin;
})(jsPsychModule);
