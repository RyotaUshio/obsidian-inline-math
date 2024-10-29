# No More Flickering Inline Math for Obsidian

With this [Obsidian.md](https://obsidian.md/) plugin, you will be no longer disturbed by the **flickering inline math**!

Turned OFF               | Turned ON
:-----------------------:|:------------------------:
![Turned OFF](fig/off.gif) | ![Turned ON](fig/on.gif)

## Latex Suite compatibility

If you are a [Latex Suite](https://github.com/artisticat1/obsidian-latex-suite) user, you will need to modify [the following lines](https://github.com/artisticat1/obsidian-latex-suite/blob/f405de10e7bb13aa03621029a7655a6fce1647bf/src/default_snippets.js#L261-L263) to avoid some conflicts.

```js
	{trigger: "(", replacement: "($0)$1", options: "mA"},
	{trigger: "{", replacement: "{$0}$1", options: "mA"},
	{trigger: "[", replacement: "[$0]$1", options: "mA"},
```

All you have to do is to remove `$1` from `replacement`. If your snippet looks like the following, you are good to go.

```js
	{trigger: "(", replacement: "($0)", options: "mA"},
	{trigger: "{", replacement: "{$0}", options: "mA"},
	{trigger: "[", replacement: "[$0]", options: "mA"},
```

Thank you @carpetdev for the [insight](https://github.com/RyotaUshio/obsidian-inline-math/issues/6#issuecomment-2442938736)!

## How does it work?

It's simple. You can see what's going on under the hood by going to the plugin settings > "Debug mode" and turning on "Disable decorations".

https://github.com/RyotaUshio/obsidian-inline-math/assets/72342591/cde99cc2-b1f9-4521-993f-c7bc63b5a9d4

Obsidian doesn't recognize `$[space]...$` or `$...[space]$` as a math.
So, when an inline math `$...$` is found, this plugin inserts `{}` at the beginning and end of it:

```latex
${} ... {}$
```

These braces are then **hidden** so that you are not disturbed by them (, which is disabled in the video above by "Disable decorations").

***And importantly, they are automatically deleted when you escape from `$...$`, so you don't need to worry about messing up your notes with braces!***

## Companion plugins

Here's a list of other math-related plugins I've developed:

- [LaTeX-like Theorem & Equation Referencer](https://github.com/RyotaUshio/obsidian-latex-theorem-equation-referencer)
- [Better Math in Callouts & Blockquotes](https://github.com/RyotaUshio/obsidian-math-in-callout)
- [MathJax Preamble Manager](https://github.com/RyotaUshio/obsidian-mathjax-preamble-manager)
- [Auto-\\displaystyle Inline Math](https://github.com/RyotaUshio/obsidian-auto-displaystyle-inline-math)

## Reporting issues

If you find something is not working well, please report it by [filing an issue](https://github.com/RyotaUshio/obsidian-inline-math/issues). Attatching the following information is highly appreciated:

- The result of the "Show debug info" command
- Screen recording of what happened, with `Debug mode > Disable decorations` turned on. If possible, please visualize your keystroke with a tool like [KeyCastr](https://github.com/keycastr/keycastr).

## Support Development

If you find my plugins useful, please support my work to ensure they continue to work!

<a href="https://github.com/sponsors/RyotaUshio" target="_blank"><img src="https://img.shields.io/static/v1?label=Sponsor&message=%E2%9D%A4&logo=GitHub&color=%23fe8e86" alt="GitHub Sponsors" style="width: 180px; height:auto;"></a>

<a href="https://www.buymeacoffee.com/ryotaushio" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="width: 180px; height:auto;"></a>

<a href='https://ko-fi.com/E1E6U7CJZ' target='_blank'><img height='36' style='border:0px; width: 180px; height:auto;' src='https://storage.ko-fi.com/cdn/kofi2.png?v=3' border='0' alt='Buy Me a Coffee at ko-fi.com' /></a>
