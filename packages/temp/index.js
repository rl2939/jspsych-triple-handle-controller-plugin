var jsVAVideo = (function (jspsych) {
  "use strict";

  const info = {
    name: "valence-arousal video annotation",
    parameters: {
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

    updateStatus() {
      const gamepads = navigator.getGamepads
        ? navigator.getGamepads()
        : webkitGetGamepads
        ? webkitGetGamepads()
        : [];
      if (gamepads.length == 0) {
        return;
      }
      for (const j in gamepads) {
        // this assumes only one plugged in controller
        // console.log(JSON.stringify(this.controllers[j].axes));
        if (gamepads[j] && "axes" in gamepads[j]) {
          let valence = gamepads[j].axes[this.throttleValenceAxis],
            arousal = gamepads[j].axes[this.throttleArousalAxis];
          console.log(valence, arousal);
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

    connectHandler(e) {
      this.controllers[e.gamepad.index] = e.gamepad;
      let s = ``;
      for (const j in this.controllers) {
        s += this.controllers[j];
      }
      this.startDataCollection();
    }
    disconnectHandler(e) {
      delete this.controllers[e.gamepad.index];
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
      </style>
      <div id="jsvavideo-container">
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
            <h1 id="vav-title">Title</h1>
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

      this.controllers = {};
      this.rate = trial.rate;
      this.interval = null;
      this.throttleValenceAxis = trial.throttle_valence_axis;
      this.throttleArousalAxis = trial.throttle_arousal_axis;
      this.data = { valence: [], arousal: [] };

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
