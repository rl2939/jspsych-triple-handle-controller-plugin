# triple-lever-controller

Current version: 1.0.2. [See version history](https://github.com/jspsych/jsPsych/blob/main/packages/plugin-html-audio-response/CHANGELOG.md).

This plugin displays a video and records inputs from the participant via a game controller. This plugin requires an external game controller with at least one or more analogue input devices, such as a lever or an pressure sensitive button. The recording of data starts when the user presses the record button and ends when the video stops.

The plugin will record data as as indicated by the _rate_ variable (how many times it will record per second).

## Parameters

In addition to the [parameters available in all plugins](../overview/plugins.md#parameters-available-in-all-plugins), this plugin accepts the following parameters. Parameters with a default value of *undefined* must be specified. Other parameters can be left unspecified if the default value is acceptable.

Parameter | Type | Default Value | Description
----------|------|---------------|------------
title | string | undefined | The title to appear above the video.
video_src | string | undefined | The url of the video location.
axis_1 | int | undefined | The input number of the first axis.
axis_2 | int | undefined | The input number of the second axis.
axis_3 | int | undefined | The input number of the third axis.
axis_location | complex | ["L", "H", "R"] | An array of three characters which will indicate the placement of each of the three axises on screen. "L" places the axis on the left of the screen, "R" places the axis on the right of the screen, and "H" hides the axis entirely.
axes_labels | complex | ["axis1", "axis2", "axis3"] | An array of the three axis names. If an axis is not going to be used, then an empty string ("") can be used in place of the name.
axis1_labels | complex | ["low", "neutral", "high"] | An array of labels for axis 1. The label in index 1 appears near the bottom of the axis, the one in index 2 appears near the middle, and the one in index 2 appears near the top.
axis2_labels | complex | ["negative", "neutral", "positive"] | An array of labels for axis 2. The label in index 1 appears near the bottom of the axis, the one in index 2 appears near the middle, and the one in index 2 appears near the top.
axis3_labels | complex | ["a", "b", "c"] | An array of labels for axis 3. The label in index 1 appears near the bottom of the axis, the one in index 2 appears near the middle, and the one in index 2 appears near the top.
rate | int | 1000 | Number of miliseconds between each data call.



## Data Generated

In addition to the [default data collected by all plugins](../overview/plugins.md#data-collected-by-all-plugins), this plugin collects the following data for each trial.

Name | Type | Value
-----|------|------
rt | numeric | The time, since the onset of the stimulus, for the participant to click the done button. If the button is not clicked (or not enabled), then `rt` will be `null`.
response | base64 string | The base64-encoded audio data.
stimulus | string | The HTML content that was displayed on the screen.
estimated_stimulus_onset | number | This is an estimate of when the stimulus appeared relative to the start of the audio recording. The plugin is configured so that the recording should start prior to the display of the stimulus. We have not yet been able to verify the accuracy of this estimate with external measurement devices.
audio_url | string | A URL to a copy of the audio data.

## Simulation Mode

This plugin does not yet support [simulation mode](../overview/simulation.md).

## Install

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
import htmlAudioResponse from '@jspsych/plugin-html-audio-response';
```

## Examples

???+ example "Simple spoken response to a stimulus"
    === "Code"
        ```javascript
        var trial = {
            type: jsPsychHtmlAudioResponse,
            stimulus: `
            <p style="font-size:48px; color:red;">GREEN</p>
            <p>Speak the color of the ink.</p>`,
            recording_duration: 3500
        };
        ```

    === "Demo"
        <div style="text-align:center;">
            <iframe src="../../demos/jspsych-html-audio-response-demo1.html" width="90%;" height="600px;" frameBorder="0"></iframe>
        </div>

    <a target="_blank" rel="noopener noreferrer" href="../../demos/jspsych-html-audio-response-demo1.html">Open demo in new tab</a>

???+ example "Allow playback and rerecording; save data to server immediately"
    === "Code"
        ```javascript
        var trial = {
            type: jsPsychHtmlAudioResponse,
            stimulus: `
                <p>Please sing the first few seconds of a song and click the button when you are done.</p>
            `,
            recording_duration: 15000,
            allow_playback: true,
            on_finish: function(data){
                fetch('/save-my-data.php', { audio_base64: data.response })
                    .then((audio_id){
                        data.response = audio_id;
                    });
            }
        };
        ```

        This example assumes that there is a script on your experiment server that accepts the data called `save-my-data.php`. It also assumes that the script will generate a response with an ID for the stored audio file (`audio_id`). In the example, we replace the very long base64 representation of the audio file with the generated ID, which could be just a handful of characters. This would let you link files to responses in data analysis, without having to store long audio files in memory during the experiment.

    === "Demo"
        <div style="text-align:center;">
            <iframe src="../../demos/jspsych-html-audio-response-demo2.html" width="90%;" height="600px;" frameBorder="0"></iframe>
        </div>

    <a target="_blank" rel="noopener noreferrer" href="../../demos/jspsych-html-audio-response-demo2.html">Open demo in new tab</a>

???+ example "Use recorded audio as a subsequent stimulus"
    === "Code"
        ```javascript
        var instruction = {
            type: jsPsychHtmlButtonResponse,
            stimulus: `
                <img src='img/10.gif' style="width:100px; padding: 20px;"></img>
                <p>Make up a name for this shape. When you have one in mind, click the button and then say the name aloud.</p>
            `,
            choices: ['I am ready.']
        }

        var record = {
            type: jsPsychHtmlAudioResponse,
            stimulus: `
                <img src='img/10.gif' style="width:100px; padding: 20px;"></img>
                <p>Recording...</p>
            `,
            recording_duration: 1500,
            save_audio_url: true
        };

        var playback = {
            type: jsPsychAudioButtonResponse,
            stimulus: ()=>{
                return jsPsych.data.get().last(1).values()[0].audio_url;
            },
            prompt: '<p>Click the object the matches the spoken name.</p>',
            choices: ['img/9.gif','img/10.gif','img/11.gif','img/12.gif'],
            button_html: '<img src="%choice%" style="width:100px; padding: 20px;"></img>'
        }
        ```

    === "Demo"
        <div style="text-align:center;">
            <iframe src="../../demos/jspsych-html-audio-response-demo3.html" width="90%;" height="600px;" frameBorder="0"></iframe>
        </div>

    <a target="_blank" rel="noopener noreferrer" href="../../demos/jspsych-html-audio-response-demo3.html">Open demo in new tab</a>

