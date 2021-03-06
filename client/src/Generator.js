import React from 'react';
import Button from 'react-bootstrap/Button';
import * as mm from "@magenta/music";
import * as Tone from 'tone';

const Generator = (props) => {
    const { temperature, melodyRnn, updateNotes } = props;

    const generateMelody = async () => {
        let random_note = Math.floor(Math.random() * 12) + 1;
        let freq = 2 ** (random_note / 12) * 330;
        let midi_note = Tone.Frequency(freq).toMidi();
        const seed = {
            notes: [
            { pitch: midi_note, quantizedStartStep: 0, quantizedEndStep: 1 }
            ],
            totalQuantizedSteps: 1,
            quantizationInfo: { stepsPerQuarter: 4}
        };
        const steps = 31;

        const result = await melodyRnn.continueSequence(seed, steps, temperature);
        const combined = mm.sequences.concatenate([seed, result]);

        const startSteps = [];
        for (let note of combined.notes) {
            startSteps.push(note.quantizedStartStep);
        }
        
        const noteRestsPairs = [];
        for (let i = 0; i < startSteps.length; i++) {
            const startDiff = (i + 1 === startSteps.length ? 32 : startSteps[i + 1]) - startSteps[i];
            const noteRests = [[null, null], null];
            const noteDuration = Math.pow(2, Math.floor(Math.log(startDiff) / Math.log(2)));
            const noteType = (16 / noteDuration).toString();
            noteRests[0][0] = combined.notes[i].pitch;
            noteRests[0][1] = noteType==="0.5" ? "1/2" : noteType.toString(); // double-whole note

            const restTime = startDiff - noteDuration;
            let counter = 1;
            const rests = [];
            while (counter <= restTime) {
                const include = restTime & counter;
                if (include) rests.push((16 / counter).toString());
                counter <<= 1;
            }
            noteRests[1] = rests;
            noteRestsPairs.push(noteRests);
        }

        updateNotes(noteRestsPairs);
    };

    return <Button variant="info" onClick={generateMelody}>Generate</Button>;
}

export default Generator;