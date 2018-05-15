import * as functions from 'firebase-functions';
const speech = require('@google-cloud/speech');
const formidable = require('formidable');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const MAX_DURATION = 60;

export const detectInst = functions.https.onRequest((req, res) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        const file = files['upload'];
        if (!file) {
            res.send('upload file not found');
            return;
        }
        const duration = Math.min(parseInt(fields['duration']), MAX_DURATION);
        const client = new speech.SpeechClient();

        const request = {
            config: {
                encoding: 'LINEAR16',
                sampleRateHertz: 44100,
                languageCode: 'ja-JP',
            },
            interimResults: false,
        };

        var isErr = false;
        var isInst = false;
        const recognizeStream = client
            .streamingRecognize(request)
            .on('error', console.error)
            .on('data', data => {
                isInst = true;
                const ts = data.results[0].alternatives[0].transcript;
                console.log(
                    `Transcription: ${ts}`
                );
                res.send(`<h1>インスト曲ではありません！（ボーカル入りです）</h1>
                <h2>抽出された歌詞</h2>
                <pre>${ts}</pre>
                <a href="/">←戻る</a>`)
            })
            .on('end', () => {
                if (!isErr && !isInst) {
                    res.send(`<h1>インスト曲です！</h1><a href="/">←戻る</a>`)
                }
            })

        ffmpeg(file.path)
            .noVideo()
            .duration(duration)
            .format('s16le')
            .audioChannels(1)
            .on('start', cmd => console.info(cmd))
            .on('progress', prog => console.debug('progress: ', prog.percent))
            .on('error', (err, stdout, stderr) => {
                isErr = true;
                console.error('err!', err);
                console.error('stdout', stdout);
                console.error('stderr', stderr);
                res.send('えりり');
            })
            .pipe(recognizeStream, { end: true });
    });
});
