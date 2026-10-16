import QtQuick
import Quickshell
import Quickshell.Io
import Quickshell.Networking
import "Model.js" as Model

// Keeps a docked laptop single-homed. With the setting on, the Wi-Fi radio
// goes off while a wired link is connected and comes back when the link goes,
// a dock pulled or a cable unplugged alike. It runs inside omarchy-shell with
// the user's own rights, through the same NetworkManager bridge the network
// panel's Wi-Fi switch uses, so there is no root hook and nothing in /etc.
//
// Why: with Ethernet and Wi-Fi both up there are two default routes and no
// source policy routing, so anything bound to the Wi-Fi address still leaves
// over the cable. Some office firewalls answer that by flushing the client's
// connections every few minutes, which shows up as calls going on hold.
Item {
  id: root

  property var shell: null
  property var manifest: null

  readonly property string stateFile: Quickshell.env("HOME") + "/.local/state/omarchy/wired-only.json"

  // The setting, and whether this service is the one that switched the radio
  // off. Only a radio it took is given back; one the user switched off
  // themselves stays off.
  property bool enabled: false
  property bool held: false
  // The state file has been read (or found missing) once; nothing is switched
  // before that, so a shell restart cannot act on defaults.
  property bool loaded: false

  readonly property bool networkManager: Networking.backend === NetworkBackendType.NetworkManager
  readonly property var devices: Networking.devices ? Networking.devices.values : []
  readonly property bool wired: Model.anyConnected(devices, DeviceType.Wired)
  readonly property bool wifiOn: Networking.wifiEnabled
  // A radio to switch and a port to plug in; without both there is nothing
  // for the setting to do and the widget hides.
  readonly property bool available: networkManager
    && Model.hasDeviceType(devices, DeviceType.Wifi)
    && Model.hasDeviceType(devices, DeviceType.Wired)

  // The cable is what changes things. The radio's own changes are left alone
  // on purpose: switching Wi-Fi back on by hand while docked is respected
  // until the next cable event.
  onWiredChanged: reconcile()
  onEnabledChanged: {
    if (!loaded) return
    persist()
    reconcile()
  }

  function setEnabled(value) {
    enabled = !!value
  }

  function toggle() {
    enabled = !enabled
  }

  function reconcile() {
    if (!loaded || !networkManager) return
    var step = Model.decide({ enabled: enabled, wired: wired, wifiOn: wifiOn, held: held })
    if (step.action === "off") Networking.wifiEnabled = false
    else if (step.action === "on") Networking.wifiEnabled = true
    if (step.held !== held) {
      held = step.held
      persist()
    }
  }

  function persist() {
    stateView.setText(Model.serializeState(enabled, held))
  }

  // ~/.local/state/omarchy exists on every Omarchy install, so the file needs
  // no directory of its own. Watching it lets a hand edit, or a second shell
  // instance, show up here without a restart.
  FileView {
    id: stateView
    path: root.stateFile
    watchChanges: true
    onFileChanged: reload()
    onLoaded: {
      var state = Model.parseState(text())
      root.held = state.held
      root.enabled = state.enabled
      if (!root.loaded) {
        root.loaded = true
        root.reconcile()
      }
    }
    onLoadFailed: function(error) {
      if (!root.loaded) {
        root.loaded = true
        root.reconcile()
      }
    }
  }
}
