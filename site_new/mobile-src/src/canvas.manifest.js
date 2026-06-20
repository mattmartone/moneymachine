export const manifest = {
  screens: {
    scr_mkdl7r: { name: "Race Day", route: "/", position: { "x": 160, "y": 220 } },
    scr_126tth: { name: "History", route: "/history", position: { "x": 1560, "y": 4180 } },
    scr_1td9mx: { name: "Settings", route: "/settings", position: { "x": 0, "y": 0 }, isDefaultRow: true }
  },
  sections: {
    sec_qx359b: { name: "Home", x: 0, y: 0, width: 1520, height: 1180 },
    sec_81kh9v: { name: "Strategy", x: 0, y: 1980, width: 1520, height: 1180 },
    sec_v7dej9: { name: "Tracking", x: 0, y: 3960, width: 2920, height: 1180 }
  },
  layers: [
  { kind: "section", id: "sec_qx359b", children: [
    { kind: "screen", id: "scr_mkdl7r" }]
  },
  { kind: "section", id: "sec_81kh9v", children: [
    { kind: "screen", id: "scr_i5jofj" }]
  },
  { kind: "screen", id: "scr_1td9mx" },
  { kind: "section", id: "sec_v7dej9", children: [
    { kind: "screen", id: "scr_eiwels" },
    { kind: "screen", id: "scr_126tth" }]
  }]

};