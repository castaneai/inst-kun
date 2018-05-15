import * as functions from 'firebase-functions';
const formidable = require('formidable');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

export const helloWorld = functions.https.onRequest((request, response) => {
    response.send(`
    <form action="upload" enctype="multipart/form-data" method="post">
    <input type="file" name="upload">
    <input type="submit" value="upload">
    </form>`)
});

export const upload = functions.https.onRequest((req, res: functions.Response) => {
    const form = new formidable.IncomingForm();
    form.parse(req, (err, fields, files) => {
        const file = files['upload'];
        if (!file) {
            res.send('upload file not found');
            return;
        }
        console.info(`upload file type: ${file.type}, path: ${file.path}`);
        ffmpeg(file.path)
            .noVideo()
            .format('wav')
            .on('error', (err, stdout, stderr) => {
                console.error(err.message);
                console.error(stdout);
                console.error(stderr);
            })
            .on('end', () => console.info('ended!'))
            .on('progress', (prog) => {
                console.log(`progress: ${prog.percent}%`);
            })
            .pipe(res, { end: true });
    });
});
