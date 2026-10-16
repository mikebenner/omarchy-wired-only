import QtQuick
import Quickshell
import qs.Ui
import qs.Commons
import "Model.js" as Model

// A cable glyph in the bar: lit while Wi-Fi is being held off for Ethernet,
// plain while the setting waits for a cable, struck through while the setting
// is off. Click to turn the setting on or off; middle-click opens the network
// panel. The decisions live in Service.qml, which the shell loads once;
// this widget is instantiated per monitor and only reflects it.
BarWidget {
  id: root
  moduleName: "mikebenner.wired-only"

  property var service: null
  readonly property bool enabled: service ? service.enabled : false
  readonly property bool held: service ? service.held : false
  readonly property bool wired: service ? service.wired : false
  readonly property bool available: service ? service.available : false

  visible: service !== null && available
  implicitWidth: button.implicitWidth
  implicitHeight: button.implicitHeight

  // The service may load after the bar does; ask again until it is there.
  function findService() {
    if (service) return
    if (bar && bar.shell && typeof bar.shell.serviceFor === "function") {
      service = bar.shell.serviceFor(moduleName)
    }
  }

  Component.onCompleted: findService()
  onBarChanged: findService()

  Timer {
    interval: 1000
    repeat: true
    running: root.service === null
    onTriggered: root.findService()
  }

  BarIconButton {
    id: button
    anchors.fill: parent
    bar: root.bar
    // nf-md-ethernet and nf-md-ethernet_off, written as escapes so no editor
    // can strip the codepoints.
    text: root.enabled ? "󰈀" : "󰈂"
    active: root.enabled && root.held
    tooltipText: Model.tooltip(root.enabled, root.wired, root.held)
    onPressed: function(b) {
      if (b === Qt.MiddleButton) root.bar.run("omarchy-shell shell toggle omarchy.network")
      else if (root.service) root.service.toggle()
    }
  }
}
