export const manifest = {
  screens: {
    scr_c7fyix: { name: "Landing", route: "/", position: { "x": 160, "y": 220 } },
    scr_zlr38e: { name: "Dashboard", route: "/app", position: { "x": 1560, "y": 220 } },
    scr_2lihu0: { name: "Strategies", route: "/app/strategies", position: { "x": 160, "y": 2200 } },
    scr_h84klt: { name: "Order Builder", route: "/app/order", position: { "x": 1560, "y": 2200 } },
    scr_pkk3ao: { name: "Account", route: "/app/account", position: { "x": 2960, "y": 2200 } }
  },
  sections: {
    sec_r7tyqw: { name: "Auth flow", x: 0, y: 0, width: 2920, height: 1180 },
    sec_46hqwi: { name: "App features", x: 0, y: 1980, width: 4320, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_r7tyqw", children: [
    { kind: "screen", id: "scr_c7fyix" },
    { kind: "screen", id: "scr_zlr38e" }]
  },
  { kind: "section", id: "sec_46hqwi", children: [
    { kind: "screen", id: "scr_2lihu0" },
    { kind: "screen", id: "scr_h84klt" },
    { kind: "screen", id: "scr_pkk3ao" }]
  }]

};