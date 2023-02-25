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
      this.mainContainer.innerHTML = `oh yeahs ${s}`;
      this.startDataCollection();
    }
    disconnectHandler(e) {
      delete this.controllers[e.gamepad.index];
      this.mainContainer.innerHTML = `oh nohs`;
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
        <div id="vavideo-main-container">
          <p>All cops bastards</p>
        </div>
        <button id="end-it">End it</button>`;
      document.getElementById("end-it").addEventListener("click", () => {
        console.log("oi");
        this.endIt();
      });

      this.mainContainer = document.getElementById("vavideo-main-container");

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
