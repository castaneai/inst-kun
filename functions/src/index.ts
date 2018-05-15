import * as functions from 'firebase-functions';
const speech = require('@google-cloud/speech');
const formidable = require('formidable');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const MAX_DURATION = 60;

export const index = functions.https.onRequest((req, res) => {
    res.send(`
<h1>インスト判定くん</h1>
<p>楽曲をアップロードすると、インスト音源かどうかを判定してくれます</p>
<form action="upload" enctype="multipart/form-data" method="post">
    <p><input type="file" name="upload"></p>
    <p><label>判定する秒数（最大60秒）：<input type="text" name="duration" value="10"></label></p>
    <button type="submit">判定する</button>
</form>`)
});

export const upload = functions.https.onRequest((req, res: functions.Response) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        const file = files['upload'];
        if (!file) {
            res.end('upload file not found');
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
                if (!isInst) {
                    res.send(`<h1>インスト曲です！</h1><a href="/">←戻る</a>`)
                }
            })

        ffmpeg(file.path)
            .noVideo()
            .duration(duration)
            .format('s16le')
            .audioChannels(1)
            .pipe(recognizeStream, { end: true });
    });
});
