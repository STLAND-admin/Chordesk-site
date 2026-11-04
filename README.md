# Chordesk · Concept website

**Play a chord. Control your desktop. / 指间和弦，掌控桌面。**

[Live website](https://stland-admin.github.io/Chordesk-site/) · [Native iOS and Mac source](https://github.com/STLAND-admin/Chordesk)

The complete website switches between Chinese and English. It remembers the language locally; `?lang=en` and `?lang=zh` create shareable language links.

## What it shows

- The origin: what distinguishes an unfolded Duo from an iPad or iPhone? The additional rear screen can add an interaction dimension.
- The design evolution: from a rear trackpad to simple rear holds, leaving precise work to the thumbs in front.
- A highlighted ergonomic observation about the palm heel and thumb–index web supporting the device. This is the author's observation and a design hypothesis, not a quantified study.
- A 3D grip model with 0 / 1 / 2 rear contacts, view and grip controls. The rear screen starts on the left when viewed from the front.
- No rear contact: direct touch. One rear finger + two front fingers: Mission Control vertically, Spaces horizontally. Two rear fingers held: a temporary front trackpad.
- A real-device video showing Duo and Mac together: 1080p, 30 fps, H.264, no audio, 2 minutes 10 seconds. Playback is user-initiated. The author explicitly chose to retain the full launch and QR-pairing sequence. The old 2D simulator remains in Git history.

The page never connects to a host, captures a desktop, or requests camera/microphone access. The 3D model is an illustration, not exact device geometry or a hardware test.

## Run locally

```sh
python3 -m http.server 8744 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:8744/`. Buildless HTML/CSS/JavaScript; use HTTP for ES modules. Three.js 0.180.0 is vendored locally under its MIT license in `dist/vendor/THREE-LICENSE.txt`.

## Publish

GitHub Actions checks JavaScript and publishes only `dist/` to GitHub Pages. Enable Pages / Actions and set `PAGES_ENABLED=true`. Native source, builds, signing material and pairing information are not part of this website repository.

The Mac 0.18.1 Apple Silicon test installer is available from the linked native release (not notarized). The [iOS TestFlight beta](https://testflight.apple.com/join/WZDXKgvg) is now linked from the homepage. It requires the companion Mac on the same local network. Regular iPhones use on-screen controls; hardware compatibility testing continues. The camera accessory use was disclosed in Beta App Review. TestFlight approval is not an App Store release.

Feedback issues are public. Do not include pairing QR codes, credentials, or private desktop content.

## License

Project-owned code and content use [CC BY-NC-SA 4.0](LICENSE). Three.js retains its MIT license. See [NOTICE.md](NOTICE.md) for scope and attribution.
