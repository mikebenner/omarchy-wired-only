# Wired Only for Omarchy

Turns Wi-Fi off while Ethernet is connected and back on when the cable goes, so a docked laptop stays single-homed. An Omarchy shell plugin: a service that watches the wired link and a small bar widget to switch it on and off.

## Why

With Ethernet and Wi-Fi both up, a laptop has two default routes and no source policy routing, so anything that binds to the Wi-Fi address still leaves over the cable (`ip route get 1.1.1.1 from <wifi-ip>` answers `dev eth0`). WebRTC in a video call and a mesh VPN with per-address endpoints both do this. Most networks shrug. Some office firewalls answer by flushing every connection the laptop has open every few minutes, which you notice as calls going "on hold". Turning the radio off while docked fixes it outright; this plugin does that for you.

## What it does

- With the setting on, the Wi-Fi radio goes off as soon as a wired link connects and comes back when the link goes: a dock pulled or a cable unplugged alike.
- It only gives back a radio it switched off itself. Wi-Fi you turned off on purpose stays off on unplug and when you turn the setting off.
- Switching Wi-Fi back on by hand while docked is respected until the next cable event.
- Off by default, since a cable isn't always a way to the internet.

It runs inside `omarchy-shell` with your own rights, through the same NetworkManager bridge the network panel's Wi-Fi switch uses. Nothing runs as root and nothing lands in `/etc`. The flip side: it works while you are logged in. A cable plugged in at the login screen is noticed when the shell starts.

## Install

```bash
omarchy plugin add https://github.com/mikebenner/omarchy-wired-only.git --enable
```

Then put the widget in the bar, for example beside the network widget:

```bash
omarchy bar put mikebenner.wired-only --after omarchy.network
```

The widget shows a cable glyph while the machine has both a Wi-Fi radio and an Ethernet port (a dock's port counts while it is plugged in). Click it to turn the setting on or off; middle-click opens the network panel. Lit means Wi-Fi is being held off for Ethernet right now; struck through means the setting is off.

The setting and the "I took the radio" record live in `~/.local/state/omarchy/wired-only.json`.

## Uninstall

```bash
omarchy plugin remove mikebenner.wired-only
```

If Wi-Fi was off at that moment because the plugin held it, turn it back on from the network panel once.

## Development

```bash
node --test test/
omarchy plugin validate .
```

## License

MIT
