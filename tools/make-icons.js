// 앱 아이콘(PNG) 생성: node tools/make-icons.js
const fs = require('fs'), zlib = require('zlib'), path = require('path');
const PAL = { k: [20, 12, 16], g: [108, 160, 64], G: [58, 106, 44], l: [168, 208, 96], Y: [248, 216, 56], Z: [184, 144, 16], w: [246, 240, 220], o: [224, 120, 46], e: [216, 106, 74], E: [138, 58, 42], q: [106, 74, 138], s: [220, 174, 104] };
const ART = [
  'qqqqqqqqqqqqqqqq', 'qqqqqqqkkqqqqqqq', 'qqqqqqkgGkqqqqqq', 'qqkkqqklGkqkkqqq', 'qkgGkqklGkqklGkq', 'qklGkkklGkkklGkq', 'oqkGgglGGggGGkoo', 'ooookkklGkkkkooo',
  'eeeeeeklGkeeeeee', 'eeekkkklGkkkeeee', 'eekYYYZkGkYZkeee', 'ekYwYYZZkYwZZkee', 'ekYYYZZZZYYZkEEE', 'sskkkkkkkkkkksss', 'ssssssssssssssss', 'ssssssssssssssss'
];
function png(size) {
  const s = size / 16, raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const c = PAL[ART[Math.floor(y / s)][Math.floor(x / s)]];
      const o = y * (size * 4 + 1) + 1 + x * 4; raw[o] = c[0]; raw[o + 1] = c[1]; raw[o + 2] = c[2]; raw[o + 3] = 255;
    }
  }
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = b => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (t, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(size, 0); ih.writeUInt32BE(size, 4); ih[8] = 8; ih[9] = 6; ih[10] = 0; ih[11] = 0; ih[12] = 0;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}
const out = path.join(__dirname, '..', 'icons');
fs.mkdirSync(out, { recursive: true });
for (const n of [192, 512]) fs.writeFileSync(path.join(out, `icon-${n}.png`), png(n));
console.log('icons written');
