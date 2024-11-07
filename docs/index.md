# triple-handle-controller

**TODO change main URL below **
Current version: 1.0.2. [See version history](https://github.com/jspsych/jsPsych/blob/main/packages/plugin-html-audio-response/CHANGELOG.md).

This plugin displays a video and records inputs from the participant via a game controller. This plugin requires an external game controller with at least one or more analogue input devices, such as a handle or a pressure sensitive button. The recording of data starts when the user presses the record button and ends when the video stops.

The plugin will record data as indicated by the _rate_ variable (how many times it will record per second).

## Parameters

In addition to the [parameters available in all plugins](../overview/plugins.md#parameters-available-in-all-plugins), this plugin accepts the following parameters. Parameters with a default value of _undefined_ must be specified. Other parameters can be left unspecified if the default value is acceptable.

| Parameter     | Type    | Default Value                       | Description                                                                                                                                                                                                                           |
| ------------- | ------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| title         | string  | undefined                           | The title to appear above the video.                                                                                                                                                                                                  |
| video_src     | string  | undefined                           | The url of the video location.                                                                                                                                                                                                        |
| axis_1        | numeric | undefined                           | The input number of the first axis.                                                                                                                                                                                                   |
| axis_2        | numeric | undefined                           | The input number of the second axis.                                                                                                                                                                                                  |
| axis_3        | numeric | undefined                           | The input number of the third axis.                                                                                                                                                                                                   |
| axis_location | complex | ["L", "H", "R"]                     | An array of three characters which will indicate the placement of each of the three axises on screen. "L" places the axis on the left of the screen, "R" places the axis on the right of the screen, and "H" hides the axis entirely. |
| axes_labels   | complex | ["axis1", "axis2", "axis3"]         | An array of the three axis names. If an axis is not going to be used, then an empty string ("") can be used in place of the name.                                                                                                     |
| axis1_labels  | complex | ["low", "neutral", "high"]          | An array of labels for axis 1. The label in index 1 appears near the bottom of the axis, the one in index 2 appears near the middle, and the one in index 3 appears near the top.                                                     |
| axis2_labels  | complex | ["negative", "neutral", "positive"] | An array of labels for axis 2. The label in index 1 appears near the bottom of the axis, the one in index 2 appears near the middle, and the one in index 3 appears near the top.                                                     |
| axis3_labels  | complex | ["a", "b", "c"]                     | An array of labels for axis 3. The label in index 1 appears near the bottom of the axis, the one in index 2 appears near the middle, and the one in index 3 appears near the top.                                                     |
| rate          | numeric | 1000                                | Number of miliseconds between each data call.                                                                                                                                                                                         |

## Data Generated

In addition to the [default data collected by all plugins](../overview/plugins.md#data-collected-by-all-plugins), this plugin collects the following data for each trial.

| Name        | Type    | Value                                                                                                                                                                              |
| ----------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| data_arrays | array   | An array of three arrays, each representing an different input device. Each of the three arrays inside contains a value of the handle taken as often as set in the rate parameter. |
| rate        | numeric | Number of miliseconds between each data call.                                                                                                                                      |
| video_src   | string  | A URL to a copy of the videodata.                                                                                                                                                  |
| duration    | numeric | The length of the video, in seconds.                                                                                                                                               |

<!-- ## Simulation Mode

This plugin does not yet support [simulation mode](../overview/simulation.md). -->

## Install

**TODO change URLS of install files**

Using the CDN-hosted JavaScript file:

```js
<script src="https://unpkg.com/@jspsych/plugin-html-audio-response@1.0.2"></script>
```

Using the JavaScript file downloaded from a GitHub release dist archive:

```js
<script src="jspsych/plugin-html-audio-response.js"></script>
```

Using NPM:

```
npm install @jspsych/plugin-html-audio-response
```

```js
import htmlAudioResponse from "@jspsych/plugin-html-audio-response";
```

## Examples

???+ example "Simple spoken response to a stimulus"
=== "Code"
```javascript
        var experiment = [
            {
                type: jsTripleHandleController,
                axis_1: 0,
                axis_2: 1,
                axis_3: 2,
                axis_location: ["L", "R", "L"],
                axis2_labels: ["negative", "neutral", "positive"],
                axis1_labels: ["low", "neutral", "high"],
                css_clases: ["thc-override"],
                axes_labels: ["axis1 (axis 1)", "axis2 (axis 2)", "item 3 (axis 3)"],
                title: "",
                // from the full throttle paper: a monitor refresh rate of 60 Hz meant
                // that their position could be mapped on to changes on screen every 16.7 ms
                // or higher. Device co-ordinates were thus recorded in intervals of 1-2
                // refresh rates.
                rate: 1000 / 60,
            },
        ];
        ```

    === "Demo"
        <div style="text-align:center;">
            <iframe src="index.html" width="90%;" height="600px;" frameBorder="0"></iframe>
        </div>

    <a target="_blank" rel="noopener noreferrer" href="index.html">Open demo in new tab</a>
