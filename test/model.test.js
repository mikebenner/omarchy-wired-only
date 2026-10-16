const test = require("node:test")
const assert = require("node:assert/strict")
const path = require("node:path")
const fs = require("node:fs")

// Model.js carries a `.pragma library` line for QML; strip it before Node
// loads the rest as a CommonJS module, in this realm so strict deep-equal
// sees ordinary objects.
function loadModel() {
  const source = fs.readFileSync(path.join(__dirname, "..", "Model.js"), "utf8").replace(/^\.pragma library\n/m, "")
  const module = { exports: {} }
  new Function("module", "exports", source)(module, module.exports)
  return module.exports
}

const Model = loadModel()
const WIRED = 1
const WIFI = 2

test("a connected wired device is recognised whichever way the list is ordered", () => {
  assert.equal(Model.anyConnected([{ type: WIFI, connected: true }, { type: WIRED, connected: true }], WIRED), true)
  assert.equal(Model.anyConnected([{ type: WIRED, connected: false }], WIRED), false)
  assert.equal(Model.anyConnected([], WIRED), false)
  assert.equal(Model.anyConnected(null, WIRED), false)
  assert.equal(Model.anyConnected([null, { type: WIRED, connected: true }], WIRED), true, "a null entry is skipped")
})

test("availability needs both a radio and a port, connected or not", () => {
  const both = [{ type: WIFI, connected: false }, { type: WIRED, connected: false }]
  assert.equal(Model.hasDeviceType(both, WIFI) && Model.hasDeviceType(both, WIRED), true)
  assert.equal(Model.hasDeviceType([{ type: WIFI }], WIRED), false)
})

test("the cable in and the setting on takes a radio that is on", () => {
  assert.deepEqual(Model.decide({ enabled: true, wired: true, wifiOn: true, held: false }), { action: "off", held: true })
})

test("a radio already off is not taken, so it is not given back later", () => {
  assert.deepEqual(Model.decide({ enabled: true, wired: true, wifiOn: false, held: false }), { action: null, held: false })
  assert.deepEqual(Model.decide({ enabled: true, wired: false, wifiOn: false, held: false }), { action: null, held: false })
})

test("a repeat cable event leaves a held radio alone", () => {
  assert.deepEqual(Model.decide({ enabled: true, wired: true, wifiOn: false, held: true }), { action: null, held: true })
})

test("the cable going gives back a held radio", () => {
  assert.deepEqual(Model.decide({ enabled: true, wired: false, wifiOn: false, held: true }), { action: "on", held: false })
})

test("turning the setting off gives back a held radio even with the cable in", () => {
  assert.deepEqual(Model.decide({ enabled: false, wired: true, wifiOn: false, held: true }), { action: "on", held: false })
})

test("a radio switched back on by hand while held is simply released", () => {
  assert.deepEqual(Model.decide({ enabled: true, wired: false, wifiOn: true, held: true }), { action: null, held: false })
})

test("with the setting off and nothing held, nothing happens", () => {
  assert.deepEqual(Model.decide({ enabled: false, wired: true, wifiOn: true, held: false }), { action: null, held: false })
  assert.deepEqual(Model.decide({ enabled: false, wired: false, wifiOn: false, held: false }), { action: null, held: false })
  assert.deepEqual(Model.decide(undefined), { action: null, held: false })
})

test("state parses strictly and falls back to off", () => {
  assert.deepEqual(Model.parseState('{"enabled":true,"held":true,"portSeen":true}'), { enabled: true, held: true, portSeen: true })
  assert.deepEqual(Model.parseState('{"enabled":"yes","held":1}'), { enabled: false, held: false, portSeen: false }, "only real booleans count")
  assert.deepEqual(Model.parseState(""), { enabled: false, held: false, portSeen: false })
  assert.deepEqual(Model.parseState("not json"), { enabled: false, held: false, portSeen: false })
  assert.deepEqual(Model.parseState("[]"), { enabled: false, held: false, portSeen: false })
  assert.equal(Model.serializeState(true, false, true), '{"enabled":true,"held":false,"portSeen":true}')
})

test("tooltips say what the glyph means and what a click does", () => {
  assert.match(Model.tooltip(false, false, false), /off\. Click to turn Wi-Fi off/)
  assert.match(Model.tooltip(true, true, true), /Wi-Fi is off while Ethernet is connected/)
  assert.match(Model.tooltip(true, true, false), /stays as you left it/)
  assert.match(Model.tooltip(true, false, false), /goes off when Ethernet connects/)
})
