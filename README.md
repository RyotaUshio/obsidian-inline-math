# No More Flickering Inline Math for Obsidian

<a href="https://www.buymeacoffee.com/ryotaushio" target="_blank"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy Me A Coffee" style="height: 60px !important;width: 217px !important;" ></a>

With this [Obsidian.md](https://obsidian.md/) plugin, you will be no longer disturbed by the **flickering inline math**!

Turned OFF               | Turned ON
:-----------------------:|:------------------------:
![Turned OFF](fig/off.gif) | ![Turned ON](fig/on.gif)

Thank you for those who shared their ideas on the [forum](https://forum.obsidian.md/t/inline-math-allow-white-spaces-before-closing-dollar-signs/63551)!

## Installation

Although this plugin is still in beta version, you can install it using BRAT. 

1.  Install the [BRAT](obsidian://show-plugin?id=obsidian42-brat) community plugin and enable it.
2.  Go to **Options**. In the **Beta Plugin List** section, click on the **Add Beta plugin** button.
3.  Copy and paste `https://github.com/RyotaUshio/obsidian-inline-math` in the pop-up prompt and click on **Add Plugin**.
4.  (Optional) Turn on **Auto-update plugins at startup** at the top of the page.
5.  Go to **Community plugins > Installed plugins**. You will find "No more flickering inline math" in the list. Click on the toggle button to enable it.

## How does it work?

It's simple. Obsidian doesn't recognize `$[space]...$` or `$...[space]$` as a math.
So, when an inline math `$...$` is found, this plugin inserts `{}` at the beginning and end of it:

```latex
${} ... {}$
```

These brackets are then hidden so that you are not disturbed by them.

## Don't like the bracket pollution? Don't worry!

You can always safely clean up the brackets by running the following commands:

- **Clean up brackets in this note**
- **Clean up brackets in all the opened notes**
