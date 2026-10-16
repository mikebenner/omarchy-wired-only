// Pure decisions, kept out of QML so Node can test them.
.pragma library

// Any device of the given NetworkManager type that is connected.
function anyConnected(devices, type) {
  var list = devices || []
  for (var i = 0; i < list.length; i++) {
    var device = list[i]
    if (device && device.type === type && device.connected) return true
  }
  return false
}

function hasDeviceType(devices, type) {
  var list = devices || []
  for (var i = 0; i < list.length; i++) {
    if (list[i] && list[i].type === type) return true
  }
  return false
}

// What to do with the radio given the setting, the cable and whether this
// plugin is the one that switched the radio off. `held` is the record that
// makes the plugin give back only what it took: a radio the user switched
// off themselves is never switched on by an unplug or by turning the setting
// off. Returns the action ("off", "on" or null) and the new `held`.
function decide(state) {
  var s = state || {}
  if (s.enabled && s.wired) {
    if (s.wifiOn) return { action: "off", held: true }
    return { action: null, held: !!s.held }
  }
  if (s.held) {
    return { action: s.wifiOn ? null : "on", held: false }
  }
  return { action: null, held: false }
}

function parseState(raw) {
  var fallback = { enabled: false, held: false }
  try {
    var parsed = JSON.parse(String(raw || ""))
    if (!parsed || typeof parsed !== "object") return fallback
    return { enabled: parsed.enabled === true, held: parsed.held === true }
  } catch (error) {
    return fallback
  }
}

function serializeState(enabled, held) {
  return JSON.stringify({ enabled: !!enabled, held: !!held })
}

function tooltip(enabled, wired, held) {
  if (!enabled) return "Wired only is off. Click to turn Wi-Fi off while Ethernet is connected."
  if (held) return "Wired only: Wi-Fi is off while Ethernet is connected. Click to turn the setting off."
  if (wired) return "Wired only: on. Wi-Fi was already off, so it stays as you left it."
  return "Wired only: on. Wi-Fi goes off when Ethernet connects."
}

if (typeof module !== "undefined") {
  module.exports = {
    anyConnected: anyConnected,
    hasDeviceType: hasDeviceType,
    decide: decide,
    parseState: parseState,
    serializeState: serializeState,
    tooltip: tooltip
  }
}
