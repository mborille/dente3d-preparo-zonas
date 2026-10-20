// ---------- Modelo do dente 3D e do preparo por zonas ----------
// Unidades em mm. t = posição ao longo da coroa: 0 no colo (cervical), 1 na borda incisal.
var TEETH = {
  inc_central: { name: 'Incisivo central superior', H: 10.5, root: 13,
    rx: [[0, 3.1], [0.3, 3.7], [0.7, 4.15], [1, 4.0]], ry: [[0, 3.3], [0.3, 3.0], [0.7, 2.2], [1, 1.0]] },
  inc_lateral: { name: 'Incisivo lateral superior', H: 9.0, root: 13,
    rx: [[0, 2.5], [0.3, 3.0], [0.7, 3.3], [1, 3.1]], ry: [[0, 3.0], [0.3, 2.7], [0.7, 2.0], [1, 0.9]] },
  canino: { name: 'Canino superior', H: 10.0, root: 16,
    rx: [[0, 3.0], [0.3, 3.5], [0.7, 3.8], [1, 1.2]], ry: [[0, 3.8], [0.3, 3.6], [0.7, 3.1], [1, 1.4]] }
};
var ZONES = [{ k: 'C', n: 'Cervical', t0: 0, t1: 1 / 3 }, { k: 'M', n: 'Médio', t0: 1 / 3, t1: 2 / 3 }, { k: 'I', n: 'Incisal', t0: 2 / 3, t1: 1 }];
var DEFAULTS = { en: { C: 0.4, M: 0.8, I: 1.2 }, red: { C: 0.2, M: 0.5, I: 0.7 }, ad: 0.3, inc: 1.0, minCer: 0.5 };
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }
function interp(tab, t) {
  t = clamp(t, 0, 1);
  for (var i = 1; i < tab.length; i++) if (t <= tab[i][0]) { var a = tab[i - 1], b = tab[i]; return a[1] + (b[1] - a[1]) * (t - a[0]) / (b[0] - a[0]); }
  return tab[tab.length - 1][1];
}
function zoneOf(t) { return t < 1 / 3 ? 'C' : t < 2 / 3 ? 'M' : 'I'; }
// valor suave por zona: interpola entre os centros das zonas (1/6, 1/2, 5/6)
function zoneValue(vals, t) {
  var c = [1 / 6, 0.5, 5 / 6], v = [vals.C, vals.M, vals.I];
  if (t <= c[0]) return v[0]; if (t >= c[2]) return v[2];
  var i = t < c[1] ? 0 : 1; return v[i] + (v[i + 1] - v[i]) * (t - c[i]) / (c[i + 1] - c[i]);
}
// avalia cada zona: desgaste, esmalte restante, dentina exposta, cerâmica
function evaluate(p) {
  return ZONES.map(function (z) {
    var en = p.en[z.k], red = p.red[z.k], rem = en - red, cer = red + p.ad;
    var dentin = Math.max(0, red - en);
    var pctLeft = en > 0 ? clamp(rem, 0, en) / en * 100 : 0;
    var status = dentin > 1e-9 ? 'dentin' : (en > 0 && rem / en < 0.3 - 1e-9) ? 'low' : 'ok';
    return { k: z.k, name: z.n, en: en, red: red, rem: rem, dentin: dentin, pctLeft: pctLeft, cer: cer, status: status, thin: cer < p.minCer - 1e-9 };
  });
}
function incisalInfo(tooth, p) { var T = TEETH[tooth]; return { red: p.inc, pct: p.inc / T.H * 100, tCut: 1 - p.inc / T.H }; }
function sp(v, e) { return (v < 0 ? -1 : 1) * Math.pow(Math.abs(v), e); }
// ponto da superfície (mm). th: ângulo ao redor (π/2 = vestibular). t pode ser negativo (raiz).
function surfacePoint(tooth, t, th, prep, p) {
  var T = TEETH[tooth], rx, ry, z;
  if (t >= 0) {
    rx = interp(T.rx, t); ry = interp(T.ry, t); z = t * T.H;
    if (prep) { var tc = 1 - p.inc / T.H; z = Math.min(t, tc) * T.H; }
  } else {
    var u = -t; var k = Math.pow(u, 1.4); rx = T.rx[0][1] * (1 - 0.18 * u - 0.72 * k); ry = T.ry[0][1] * (1 - 0.15 * u - 0.75 * k);
    z = t * T.root; // t em [-1,0]: -1 é o ápice
  }
  var c = Math.cos(th), s = Math.sin(th), e = 2 / 2.5;
  var x = rx * sp(c, e), y = ry * sp(s, e);
  if (prep && t >= 0 && s > 0) {
    var w = clamp((s - 0.15) / 0.6, 0, 1), r = zoneValue(p.red, t);
    y -= r * w;
  }
  return { x: x, y: y, z: z };
}
// malha de quadriláteros: rows x cols
function buildMesh(tooth, prep, p, nT, nA) {
  nT = nT || 24; nA = nA || 40;
  var ts = []; var rootRows = 6;
  for (var i = 0; i <= rootRows; i++) ts.push(-1 + i / rootRows);
  for (var j = 1; j <= nT; j++) ts.push(j / nT);
  var V = [];
  ts.forEach(function (t) { var row = []; for (var a = 0; a < nA; a++) row.push(surfacePoint(tooth, t, a / nA * Math.PI * 2, prep, p)); V.push(row); });
  var Q = [];
  for (var r = 0; r < ts.length - 1; r++) for (var a2 = 0; a2 < nA; a2++) {
    var a3 = (a2 + 1) % nA, tm = (ts[r] + ts[r + 1]) / 2, th = (a2 + 0.5) / nA * Math.PI * 2;
    Q.push({ v: [V[r][a2], V[r][a3], V[r + 1][a3], V[r + 1][a2]], t: tm, th: th, vest: Math.sin(th) > 0.15 && tm >= 0, root: tm < 0 });
  }
  return Q;
}
// perfil sagital (plano mesiodistal central): contorno vestibular e lingual da coroa
function sectionProfile(tooth, p, n) {
  n = n || 30; var T = TEETH[tooth], out = [];
  for (var i = 0; i <= n; i++) {
    var t = i / n, ry = interp(T.ry, t), enam = zoneValue(p.en, t), red = zoneValue(p.red, t);
    out.push({ t: t, z: t * T.H, vOut: ry, lOut: -ry, vEnamel: ry - enam, vPrep: ry - red, vCer: ry - red + red + p.ad });
  }
  return out;
}
function summaryText(tooth, p) {
  var rows = evaluate(p), T = TEETH[tooth];
  var f = function (x) { return (Math.round(x * 100) / 100).toString().replace('.', ','); };
  var L = [T.name + ': preparo vestibular por zonas (planejamento educacional)'];
  rows.forEach(function (r) {
    L.push(r.name + ': esmalte ' + f(r.en) + ' mm, desgaste ' + f(r.red) + ' mm, esmalte restante ' + f(Math.max(0, r.rem)) + ' mm (' + Math.round(r.pctLeft) + '%)' +
      (r.dentin > 0 ? ', dentina exposta ' + f(r.dentin) + ' mm' : '') + ', cerâmica ' + f(r.cer) + ' mm' + (r.thin ? ' (abaixo do mínimo)' : ''));
  });
  L.push('Redução incisal: ' + f(p.inc) + ' mm (' + Math.round(p.inc / T.H * 100) + '% da coroa)');
  return L.join('\n');
}
