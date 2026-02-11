# SMS Spam Detector (Frontend + Backend)

Run locally:

```bash
python -m pip install -r requirements.txt
python app.py
```

Open http://localhost:5000 in your browser. The app will attempt to load the model files from `notebooks/model.pkl` and `notebooks/vectorizer.pkl`.

## Live demo page (GitHub Pages)

If you want visitors to see the demo video immediately when opening the project, enable GitHub Pages for this repository (the workflow below will auto-publish the `docs/` site). Once published the demo will be available at:

https://irtazafayaz.github.io/sms-spam-detection/

If Pages is not enabled yet, enable it in your repository Settings → Pages → Source → Deploy from a branch → `gh-pages` (the provided workflow will populate that branch automatically on push).

## Demo video

To include a demo video in this repository's README, copy your video file (e.g. `demo.mp4`) into an `assets/` folder at the repo root and add the following HTML snippet to this README where you want the player shown:

Play or download the video directly from the repo:

- Download/play locally: [assets/demo.mp4](assets/demo.mp4)

Note: GitHub's README renderer does not reliably display the HTML5 `<video>` player. For a polished embedded player in your project page, upload the video to YouTube/Vimeo and embed the link, or use GitHub Pages which can render raw HTML. Example external link:

```markdown
[Watch demo](https://youtu.be/your_video_id)
```

Notes:

- Large media files are not recommended in Git history. Consider uploading the video to YouTube/Vimeo and embedding the link instead:

```markdown
[Watch demo](https://youtu.be/your_video_id)
```

If you'd like, I can add your desktop video into the repo for you (or add a commit that references it). Tell me the full path to the video file on your machine (e.g. `/Users/you/Desktop/demo.mp4`) and I'll copy it into `assets/`, commit, and push.
