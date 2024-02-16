// ==UserScript==
// @name         PrUn KAWA Tooltips
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Adds FIO powered market tooltips to Apex console
// @author       Manderius (Rynx), inspired by Tim Davis (binarygod, @timthedevguy), modifed by Xray
// @match        https://apex.prosperousuniverse.com/
// @grant        none
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.10.0/jquery.min.js
// @downloadURL  https://raw.githubusercontent.com/Xraydylan/PrUn_Tooltips_KAWA/main/tooltips.js
// @updateURL    https://raw.githubusercontent.com/Xraydylan/PrUn_Tooltips_KAWA/main/tooltips.js
// ==/UserScript==

let $ = jQuery;
let prices = [];
let last_update = null;
let updates_on = null;
const styles =
    '.prun-tooltip-base{display:flex;pointer-events:none;position:absolute!important;font-family:"Droid Sans",sans-serif;font-size:10px;color:#bbb;z-index:100000;}.prun-tooltip-box{flex:1 1 auto}.prun-tooltip-content{box-sizing:border-box;max-height:100%;max-width:100%;overflow:auto}.prun-tooltip-fade{opacity:0;-webkit-transition-property:opacity;-moz-transition-property:opacity;-o-transition-property:opacity;-ms-transition-property:opacity;transition-property:opacity}.prun-tooltip-fade.prun-tooltip-show{opacity:1}.prun-tooltip-sidetip .prun-tooltip-box{background:#222;border:1px solid #2b485a;box-shadow:0 0 5px rgba(63,162,222,.5);border-radius:0}.prun-tooltip-sidetip.prun-tooltip-right .prun-tooltip-box{margin-left:0}.prun-tooltip-sidetip .prun-tooltip-content{line-height:10px;padding:0}.prun-tooltip-sidetip .prun-tooltip-arrow{overflow:hidden;display:none;position:absolute}.prun-tooltip-content H1{border-bottom:1px solid #2b485a;background-color:rgba(63,162,222,.15);padding-bottom:8px;padding-top:9px;padding-left:10px;margin:0;font-weight:400;padding-right:10px;font-size:12px}';
const tooltip_html = `
<div
  class="prun-tooltip-base prun-tooltip-sidetip prun-tooltip-right prun-tooltip-fade prun-tooltip-show"
>
  <div class="prun-tooltip-box" style="margin: 0px">
    <div class="prun-tooltip-content">
      <div class="PrUn_tooltip_content">
        <h1>{TITLE}</h1>
        <table class="PrUnTools_Table">
          <thead>
            <tr>
              <th></th>
              <th>AI1</th>
              <th>CI1</th>
              <th>IC1</th>
              <th>NC1</th>
              <th>KAWA</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Ask</td>
              <td class="accounting-cell">{Ask.AI1}</td>
              <td class="accounting-cell">{Ask.CI1}</td>
              <td class="accounting-cell">{Ask.IC1}</td>
              <td class="accounting-cell">{Ask.NC1}</td>
              <td>Min</td>
              <td class="accounting-cell">{KAWA.min}</td>
            </tr>
            <tr>
              <td>Bid</td>
              <td class="accounting-cell">{Buy.AI1}</td>
              <td class="accounting-cell">{Buy.CI1}</td>
              <td class="accounting-cell">{Buy.IC1}</td>
              <td class="accounting-cell">{Buy.NC1}</td>
              <td>Max</td>
              <td class="accounting-cell">{KAWA.max}</td>
            </tr>
            <tr>
              <td>Average</td>
              <td class="accounting-cell">{Avg.AI1}</td>
              <td class="accounting-cell">{Avg.CI1}</td>
              <td class="accounting-cell">{Avg.IC1}</td>
              <td class="accounting-cell">{Avg.NC1}</td>
              <td>Avg</td>
              <td class="accounting-cell">{KAWA.avg}</td>
            </tr>
            <tr class="top-border-cell">
              <td>Supply</td>
              <td class="accounting-cell">{Supply.AI1}</td>
              <td class="accounting-cell">{Supply.CI1}</td>
              <td class="accounting-cell">{Supply.IC1}</td>
              <td class="accounting-cell">{Supply.NC1}</td>
              <td>Prox</td>
              <td class="accounting-cell">{KAWA.proxion}</td>
            </tr>
            <tr>
              <td>Demand</td>
              <td class="accounting-cell">{Demand.AI1}</td>
              <td class="accounting-cell">{Demand.CI1}</td>
              <td class="accounting-cell">{Demand.IC1}</td>
              <td class="accounting-cell">{Demand.NC1}</td>
              <td></td>
              <td></td>
            </tr>
          </tbody>
          <tfoot>
            <tr class="bottom-border-cell">
              <td colspan="5">Updates on {UPDATE} ; Kawa updated: {KAWA.UPDATE}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</div>
`;
const tooltip_html_nodata = `
<div
  class="prun-tooltip-base prun-tooltip-sidetip prun-tooltip-right prun-tooltip-fade prun-tooltip-show"
>
  <div class="prun-tooltip-box" style="margin: 0px">
    <div class="prun-tooltip-content">
      <div class="PrUn_tooltip_content">
        <h1>{TITLE}</h1>
      </div>
    </div>
  </div>
</div>
`;

// Ticker => Planets => Prices
// Data Updated 2023-Feb-19
const kawa_updated = '2023-Feb-19';
const kawa_prices = {'DW': {'KW-602c': 24.0, 'Proxion': 25.0, 'Milliways': 24.5, 'Etherwind': 24.5, 'Katoa': 25.0, 'Umbra': 25.0, 'Uponor': 25.0, 'Nemesis': 25.0, 'Kiruna': 25.0, 'Libertas': 25.0, 'Nike': 25.0, 'Deimos': 25.0, 'Poseidon': 26.0, 'Ementior': 26.0, 'Gallus': 26.0}, 'RAT': {'Milliways': 39.0, 'Proxion': 40.0, 'KW-602c': 39.0, 'Etherwind': 40.0, 'Katoa': 40.0, 'Umbra': 40.0, 'Uponor': 40.0, 'Nemesis': 41.0, 'Kiruna': 41.0, 'Libertas': 41.0, 'Nike': 41.0, 'Deimos': 41.0, 'Poseidon': 41.0, 'Ementior': 43.0, 'Gallus': 42.0}, 'OVE': {'Hephaestus': 39.0, 'Proxion': 40.0, 'Deimos': 40.0, 'Nike': 40.0, 'Etherwind': 40.0, 'Milliways': 40.0, 'Uponor': 40.0, 'Umbra': 40.0, 'Katoa': 40.0, 'Kiruna': 40.0, 'Libertas': 40.0, 'Poseidon': 40.0, 'Ementior': 40.0, 'Gallus': 40.0}, 'COF': {'KW-602c': 250.0, 'Proxion': 250.0, 'Etherwind': 250.0, 'Milliways': 250.0, 'Poseidon': 250.0, 'Ementior': 250.0, 'Gallus': 250.0}, 'PWO': {'Hephaestus': 84.0, 'Proxion': 85.0, 'Deimos': 84.0, 'Nike': 85.0, 'Etherwind': 85.0, 'Milliways': 85.0, 'Uponor': 85.0, 'Umbra': 85.0, 'Katoa': 85.0, 'Kiruna': 85.0, 'Libertas': 85.0, 'Poseidon': 86.0, 'Ementior': 86.0, 'Gallus': 86.0}, 'EXO': {'Hephaestus': 84.0, 'Proxion': 85.0, 'Deimos': 84.0, 'Nike': 84.0, 'Etherwind': 85.0, 'Milliways': 85.0, 'Uponor': 85.0, 'Umbra': 85.0, 'Katoa': 85.0, 'Kiruna': 85.0, 'Libertas': 85.0, 'Poseidon': 86.0, 'Ementior': 86.0, 'Gallus': 86.0}, 'PT': {'Uponor': 145.0, 'Proxion': 145.0, 'Kiruna': 145.0, 'Libertas': 145.0, 'Hephaestus': 150.0, 'Milliways': 150.0, 'Umbra': 150.0, 'Etherwind': 150.0, 'Katoa': 150.0, 'Nike': 150.0, 'Deimos': 150.0, 'Poseidon': 150.0, 'Ementior': 150.0, 'Gallus': 150.0}, 'KOM': {'Milliways': 195.0, 'Proxion': 195.0}, 'REP': {'Hephaestus': 205.0, 'Proxion': 205.0}, 'MED': {'Griffonstone': 310.0, 'Proxion': 310.0}, 'HMS': {'Hephaestus': 370.0, 'Proxion': 370.0}, 'SCN': {'Phobos': 540.0, 'Proxion': 540.0}, 'ALE': {'Milliways': 320.0, 'Proxion': 320.0}, 'SC': {'Griffonstone': 520.0, 'Proxion': 520.0}, 'FIM': {'KW-602c': 490.0, 'Proxion': 490.0}, 'HSS': {'Hephaestus': 640.0, 'Proxion': 640.0}, 'PDA': {'Hephaestus': 1150.0, 'Proxion': 1150.0}, 'GIN': {'Milliways': 490.0, 'Proxion': 490.0}, 'VG': {'Milliways': 590.0, 'Proxion': 590.0}, 'MEA': {'KW-602c': 1150.0, 'Proxion': 1200.0}, 'LC': {'Hephaestus': 2300.0, 'Proxion': 2300.0}, 'WS': {'Hephaestus': 2800.0, 'Proxion': 2800.0}, 'WIN': {'Milliways': 2450.0, 'Proxion': 2450.0}, 'NST': {'Griffonstone': 760.0, 'Proxion': 760.0}, 'FF': {'LS-746b': 7.5, 'Proxion': 8.1, 'Etherwind': 7.9, 'Nike': 7.9, 'Deimos': 7.9, 'Katoa': 7.9, 'Umbra': 8.0, 'Nemesis': 8.2, 'Kiruna': 8.2, 'Libertas': 8.2, 'Poseidon': 8.6, 'Ementior': 8.6, 'Gallus': 8.7}, 'SF': {'LS-746b': 4.5, 'Proxion': 5.3, 'Etherwind': 5.0, 'Nike': 5.0, 'Deimos': 5.0, 'Katoa': 5.2, 'Umbra': 5.2, 'Nemesis': 5.3, 'Kiruna': 5.3, 'Libertas': 5.4, 'Poseidon': 5.8, 'Ementior': 5.9, 'Gallus': 5.9}, 'BBH': {'Nike': 770.0, 'Proxion': 780.0, 'Deimos': 770.0, 'Libertas': 780.0, 'Kiruna': 780.0, 'Etherwind': 770.0, 'Katoa': 780.0, 'Nemesis': 780.0, 'Poseidon': 780.0, 'Ementior': 790.0, 'Gallus': 790.0}, 'BDE': {'Nike': 710.0, 'Proxion': 730.0, 'Deimos': 720.0, 'Libertas': 720.0, 'Kiruna': 720.0, 'Etherwind': 730.0, 'Katoa': 730.0, 'Nemesis': 730.0, 'Poseidon': 740.0, 'Ementior': 740.0, 'Gallus': 740.0}, 'BSE': {'Nike': 540.0, 'Proxion': 550.0, 'Deimos': 540.0, 'Libertas': 550.0, 'Kiruna': 550.0, 'Etherwind': 540.0, 'Katoa': 550.0, 'Nemesis': 550.0, 'Poseidon': 550.0, 'Ementior': 550.0, 'Gallus': 550.0}, 'BTA': {'Nike': 500.0, 'Proxion': 510.0, 'Deimos': 500.0, 'Libertas': 510.0, 'Kiruna': 510.0, 'Etherwind': 500.0, 'Katoa': 510.0, 'Nemesis': 510.0, 'Poseidon': 510.0, 'Ementior': 510.0, 'Gallus': 510.0}, 'LBH': {'Nike': 1100.0, 'Proxion': 1100.0, 'Deimos': 1100.0, 'Katoa': 1100.0, 'Poseidon': 1100.0, 'Ementior': 1100.0, 'Gallus': 1100.0}, 'LDE': {'Nike': 2300.0, 'Proxion': 2350.0, 'Deimos': 2350.0, 'Katoa': 2350.0, 'Poseidon': 2350.0, 'Ementior': 2350.0, 'Gallus': 2350.0}, 'LSE': {'Nike': 2500.0, 'Proxion': 2500.0, 'Deimos': 2500.0, 'Katoa': 2500.0, 'Poseidon': 2550.0, 'Ementior': 2550.0, 'Gallus': 2550.0}, 'LTA': {'Nike': 1000.0, 'Proxion': 1050.0, 'Deimos': 1000.0, 'Katoa': 1000.0, 'Poseidon': 1050.0, 'Ementior': 1050.0, 'Gallus': 1050.0}, 'HSE': {'Libertas': 4100.0, 'Proxion': 4100.0, 'Deimos': 4100.0, 'Nike': 4100.0}, 'RBH': {'Libertas': 4200.0, 'Proxion': 4200.0, 'Deimos': 4300.0, 'Nike': 4200.0}, 'RDE': {'Nike': 7500.0, 'Proxion': 7500.0, 'Deimos': 7500.0, 'Libertas': 7500.0}, 'RSE': {'Nike': 6200.0, 'Proxion': 6200.0, 'Deimos': 6200.0, 'Libertas': 6200.0}, 'RTA': {'Libertas': 3800.0, 'Proxion': 3800.0, 'Deimos': 3800.0, 'Nike': 3800.0}, 'ABH': {'Libertas': 14500.0, 'Proxion': 14500.0, 'Nike': 14500.0}, 'ADE': {'Libertas': 11500.0, 'Proxion': 12000.0, 'Nike': 12000.0}, 'ASE': {'Libertas': 11500.0, 'Proxion': 11500.0, 'Nike': 11500.0}, 'ATA': {'Libertas': 8400.0, 'Proxion': 8400.0, 'Nike': 8500.0}, 'EPO': {'Griffonstone': 40.0, 'Proxion': 41.0, 'Nike': 41.0, 'Deimos': 41.0, 'Umbra': 41.0, 'Katoa': 41.0}, 'GL': {'Deimos': 105.0, 'Proxion': 105.0, 'Poseidon': 105.0, 'Ementior': 105.0, 'Gallus': 105.0}, 'INS': {'Nike': 59.0, 'Proxion': 61.0, 'Deimos': 60.0, 'Katoa': 61.0}, 'MCG': {'Ementior': 10.0, 'Proxion': 13.0, 'Hephaestus': 10.0, 'Nike': 11.0, 'Deimos': 11.0, 'Katoa': 11.5, 'Uponor': 11.5, 'Griffonstone': 12.0, 'Etherwind': 13.0, 'Kiruna': 13.0, 'Libertas': 13.0, 'Poseidon': 11.0, 'Gallus': 10.5}, 'NCS': {'Malahat': 13.0, 'Proxion': 13.5, 'Phobos': 13.5, 'Deimos': 13.5, 'Etherwind': 13.5, 'Katoa': 13.5, 'Umbra': 13.5, 'Griffonstone': 13.5}, 'NFI': {'Malahat': 4.1, 'Proxion': 4.3, 'Phobos': 4.1, 'Nike': 4.2, 'Deimos': 4.2, 'Kiruna': 4.2, 'Libertas': 4.2, 'Etherwind': 4.4}, 'NG': {'Deimos': 300.0, 'Proxion': 300.0}, 'RG': {'Deimos': 320.0, 'Proxion': 330.0}, 'SEA': {'Hephaestus': 42.0, 'Proxion': 43.0, 'Deimos': 42.0, 'Nike': 42.0, 'Uponor': 43.0, 'Katoa': 43.0, 'Libertas': 43.0, 'Ementior': 43.0, 'Gallus': 44.0}, 'AEF': {'Nike': 1300.0, 'Proxion': 1400.0, 'Deimos': 1350.0, 'Libertas': 1400.0}, 'DEC': {'Griffonstone': 5200.0, 'Proxion': 5200.0, 'Umbra': 5200.0}, 'FC': {'Nike': 1250.0, 'Proxion': 1250.0}, 'FLP': {'Libertas': 175.0, 'Proxion': 190.0, 'Kiruna': 180.0, 'Nike': 180.0, 'Katoa': 195.0}, 'GC': {'Libertas': 87.0, 'Proxion': 88.0, 'Kiruna': 87.0, 'Katoa': 88.0, 'Nike': 89.0}, 'GV': {'Nike': 560.0, 'Proxion': 560.0}, 'MGC': {'Nike': 4900.0, 'Proxion': 4900.0}, 'MHL': {'Libertas': 1450.0, 'Proxion': 1450.0, 'Nike': 1450.0, 'Kiruna': 1450.0, 'Deimos': 1450.0}, 'TCS': {'Umbra': 1750.0, 'Proxion': 1800.0}, 'TRU': {'Nike': 130.0, 'Proxion': 145.0, 'Deimos': 135.0, 'Libertas': 135.0, 'Kiruna': 140.0, 'Etherwind': 145.0, 'Katoa': 145.0, 'Poseidon': 150.0, 'Ementior': 140.0, 'Gallus': 135.0}, 'TSH': {'Libertas': 11000.0, 'Proxion': 11000.0}, 'BTS': {'Aratora': 195.0, 'Proxion': 205.0, 'Griffonstone': 200.0, 'Umbra': 205.0}, 'H2O': {'Etherwind': 11.0, 'Proxion': 13.0, 'KW-602c': 12.0, 'Milliways': 12.5, 'Umbra': 13.0, 'Katoa': 13.0, 'Griffonstone': 13.0, 'Nemesis': 13.5, 'Harmonia': 14.0, 'Poseidon': 15.0}, 'LES': {'WU-013d': 285.0, 'Proxion': 490.0, 'YI-280d': 340.0, 'Umbra': 490.0}, 'ALG': {'Proxion': 95.0, 'Katoa': 100.0, 'Umbra': 100.0, 'Milliways': 100.0, 'KW-602c': 105.0, 'Etherwind': 105.0, 'Poseidon': 115.0}, 'BEA': {'Proxion': 81.0, 'Pyrgos': 81.0, 'Nemesis': 81.0, 'Verdant': 86.0, 'Harmonia': 86.0, 'Katoa': 86.0, 'Milliways': 87.0, 'KW-602c': 90.0, 'Etherwind': 91.0, 'Poseidon': 86.0}, 'CAF': {'Proxion': 500.0, 'Katoa': 510.0, 'Milliways': 510.0, 'KW-602c': 510.0, 'Etherwind': 510.0, 'Poseidon': 520.0}, 'FOD': {'Proxion': 93.0, 'Milliways': 96.0, 'KW-602c': 99.0, 'Katoa': 99.0, 'Etherwind': 105.0, 'Poseidon': 115.0}, 'GRA': {'Pyrgos': 1350.0, 'Proxion': 1350.0, 'Poseidon': 1350.0}, 'GRN': {'Pyrgos': 70.0, 'Proxion': 70.0, 'Verdant': 74.0, 'Harmonia': 75.0, 'Katoa': 75.0, 'Milliways': 77.0, 'Tacotopia': 79.0, 'KW-602c': 80.0, 'Etherwind': 80.0, 'Poseidon': 74.0}, 'HCP': {'Pyrgos': 81.0, 'Proxion': 83.0, 'Verdant': 87.0, 'Katoa': 88.0, 'Harmonia': 88.0, 'Milliways': 89.0, 'Tacotopia': 90.0, 'KW-602c': 92.0, 'Etherwind': 93.0, 'Poseidon': 98.0}, 'HER': {'Pyrgos': 620.0, 'Proxion': 630.0, 'Katoa': 630.0, 'Milliways': 630.0, 'KW-602c': 630.0, 'Etherwind': 640.0, 'Harmonia': 640.0, 'Verdant': 640.0, 'Poseidon': 640.0}, 'HOP': {'Pyrgos': 910.0, 'Proxion': 920.0, 'Milliways': 920.0, 'KW-602c': 920.0, 'Poseidon': 930.0}, 'MAI': {'Pyrgos': 74.0, 'Proxion': 75.0, 'Verdant': 79.0, 'Harmonia': 81.0, 'Katoa': 82.0, 'Milliways': 84.0, 'Tacotopia': 86.0, 'KW-602c': 88.0, 'Etherwind': 88.0, 'Poseidon': 95.0}, 'MTP': {'Milliways': 1000.0, 'Proxion': 1000.0, 'Poseidon': 1050.0}, 'MUS': {'Proxion': 100.0, 'Katoa': 105.0, 'Milliways': 110.0, 'KW-602c': 110.0, 'Etherwind': 110.0, 'Poseidon': 120.0}, 'NUT': {'Pyrgos': 75.0, 'Proxion': 77.0, 'Verdant': 80.0, 'Katoa': 82.0, 'Harmonia': 83.0, 'Milliways': 84.0, 'KW-602c': 87.0, 'Etherwind': 87.0, 'Poseidon': 80.0}, 'PIB': {'Pyrgos': 560.0, 'Proxion': 560.0, 'Katoa': 570.0, 'Milliways': 570.0, 'KW-602c': 570.0, 'Etherwind': 570.0, 'Poseidon': 580.0}, 'PPA': {'KW-602c': 79.0, 'Proxion': 88.0, 'Milliways': 80.0, 'Poseidon': 115.0}, 'RCO': {'Proxion': 340.0, 'Pyrgos': 350.0, 'Nemesis': 350.0, 'Katoa': 350.0, 'Milliways': 350.0, 'KW-602c': 350.0, 'Etherwind': 350.0, 'Harmonia': 350.0, 'Verdant': 360.0, 'Poseidon': 360.0}, 'RSI': {'Milliways': 680.0, 'Proxion': 680.0, 'KW-602c': 680.0, 'Poseidon': 700.0}, 'VEG': {'Pyrgos': 77.0, 'Proxion': 78.0, 'Verdant': 82.0, 'Harmonia': 84.0, 'Katoa': 84.0, 'Milliways': 86.0, 'KW-602c': 89.0, 'Etherwind': 89.0, 'Poseidon': 96.0}, 'VIT': {'Milliways': 215.0, 'Proxion': 225.0, 'KW-602c': 220.0, 'Poseidon': 235.0}, 'AMM': {'AM-528g': 40.0, 'Proxion': 62.0, 'Katoa': 59.0, 'Biogenesis': 60.0, 'Umbra': 60.0, 'Milliways': 62.0, 'KW-602c': 63.0, 'LS-746b': 65.0, 'Griffonstone': 66.0, 'Ementior': 49.0, 'Gallus': 49.0}, 'AR': {'KI-401d': 115.0, 'Proxion': 160.0, 'Deimos': 140.0, 'Nike': 140.0, 'RC-040f': 155.0, 'Libertas': 160.0}, 'F': {'BEN CX': 600.0, 'Proxion': 610.0, 'Umbra': 610.0, 'Griffonstone': 620.0}, 'H': {'KI-401d': 38.0, 'Proxion': 60.0, 'CB-282d': 48.0, 'Hephaestus': 50.0, 'Deimos': 51.0, 'Griffonstone': 54.0, 'LS-746b': 56.0, 'Katoa': 58.0, 'Umbra': 59.0, 'Ementior': 72.0, 'Gallus': 71.0}, 'HE': {'Prism': 60.0, 'Proxion': 75.0, 'Kiruna': 71.0, 'Libertas': 71.0, 'BEN CX': 75.0, 'Gibson': 77.0, 'Nike': 84.0, 'Deimos': 84.0, 'Ementior': 89.0, 'Gallus': 89.0}, 'HE3': {'Orm': 165.0, 'Proxion': 175.0, 'Katoa': 175.0, 'Umbra': 175.0, 'LS-746b': 180.0, 'Ementior': 190.0, 'Gallus': 190.0}, 'N': {'Biogenesis': 53.0, 'Proxion': 59.0, 'Umbra': 62.0, 'Griffonstone': 66.0, 'Hephaestus': 69.0, 'Ementior': 72.0}, 'NE': {'BEN CX': 220.0, 'Proxion': 225.0, 'Deimos': 225.0, 'Nike': 225.0, 'Libertas': 230.0}, 'O': {'Etherwind': 25.5, 'Proxion': 37.0, 'Griffonstone': 35.0, 'Umbra': 36.0, 'Kiruna': 38.0, 'Deimos': 38.0, 'ZV-759b': 38.0, 'Ementior': 51.0}, 'BER': {'YI-280j': 98.0, 'Proxion': 130.0, 'Umbra': 130.0, 'SO-715c': 140.0, 'Griffonstone': 140.0}, 'BOR': {'Electronica': 91.0, 'Proxion': 135.0, 'Deimos': 110.0, 'ANT CX': 110.0, 'Griffonstone': 115.0, 'Umbra': 130.0}, 'BRM': {'Gallus': 25.5, 'Proxion': 74.0, 'KI-840c': 37.0, 'ANT CX': 66.0, 'Umbra': 69.0, 'Kiruna': 83.0, 'Griffonstone': 79.0}, 'CLI': {'Elon': 66.0, 'Proxion': 110.0, 'ANT CX': 79.0, 'Hephaestus': 82.0, 'KI-840c': 91.0, 'UV-072c': 95.0, 'Umbra': 105.0, 'Katoa': 105.0, 'Kiruna': 115.0}, 'GAL': {'Katoa': 62.0, 'Proxion': 75.0, 'UV-072c': 74.0, 'Umbra': 79.0, 'Phobos': 100.0, 'Ementior': 105.0, 'Gallus': 105.0}, 'HAL': {'Kiruna': 79.0, 'Proxion': 96.0, 'Griffonstone': 88.0, 'XH-668c': 95.0, 'KI-439b': 99.0, 'Umbra': 100.0, 'Deimos': 105.0, 'Ementior': 130.0}, 'LST': {'XG-326a': 25.5, 'Proxion': 46.0, 'Nike': 25.5, 'Aratora': 30.0, 'Hephaestus': 38.0, 'Griffonstone': 42.0, 'UV-072c': 49.0, 'Katoa': 57.0, 'Umbra': 57.0, 'Kiruna': 63.0, 'Libertas': 64.0, 'Ementior': 28.5}, 'MAG': {'WU-013d': 145.0, 'Proxion': 270.0, 'ANT CX': 200.0, 'Deimos': 205.0, 'Nike': 215.0}, 'MGS': {'Elon': 39.0, 'Proxion': 73.0, 'ANT CX': 49.0, 'Hephaestus': 51.0, 'Katoa': 71.0}, 'SCR': {'Nemesis': 56.0, 'Proxion': 75.0, 'Katoa': 73.0, 'Etherwind': 81.0, 'XH-668c': 84.0, 'Kiruna': 85.0, 'Deimos': 91.0, 'Ementior': 90.0, 'Gallus': 89.0}, 'TAI': {'SO-715b': 115.0, 'Proxion': 220.0, 'Umbra': 200.0, 'Griffonstone': 265.0}, 'TCO': {'CH-771c': 230.0, 'Proxion': 380.0, 'Umbra': 370.0, 'Griffonstone': 430.0}, 'TS': {'BEN CX': 250.0, 'Proxion': 260.0}, 'ZIR': {'KI-401b': 92.0, 'Proxion': 210.0, 'ANT CX': 145.0, 'Griffonstone': 170.0, 'Etherwind': 190.0, 'Umbra': 205.0}, 'ALO': {'Nascent': 28.0, 'Proxion': 54.0, 'Aceland': 33.0, 'Deimos': 35.0, 'Kiruna': 56.0, 'Ementior': 40.0}, 'AUO': {'Elon': 74.0, 'Proxion': 150.0, 'ANT CX': 96.0, 'Deimos': 105.0, 'Kiruna': 155.0, 'Ementior': 195.0}, 'CUO': {'KI-840c': 66.0, 'Proxion': 170.0, 'ANT CX': 115.0, 'Deimos': 120.0, 'Kiruna': 175.0, 'Ementior': 225.0}, 'FEO': {'Kiruna': 27.0, 'Proxion': 74.0, 'ZV-759b': 37.0, 'Deimos': 55.0, 'Ementior': 165.0}, 'LIO': {'YI-280d': 59.0, 'Proxion': 105.0, 'KI-439b': 65.0, 'Kiruna': 100.0, 'Deimos': 105.0, 'Ementior': 140.0}, 'SIO': {'Poseidon': 26.5, 'Proxion': 56.0, 'XG-326a': 33.0, 'Etherwind': 38.0, 'Kiruna': 57.0, 'Nike': 57.0, 'Deimos': 57.0, 'Hephaestus': 59.0, 'Ementior': 43.0}, 'TIO': {'XG-326a': 46.0, 'Proxion': 75.0, 'YI-280d': 64.0, 'Kiruna': 69.0, 'KI-401b': 84.0, 'ANT CX': 88.0, 'Deimos': 89.0, 'Ementior': 105.0}, 'AL': {'Deimos': 245.0, 'Proxion': 285.0, 'Nike': 255.0, 'Hephaestus': 255.0, 'Aceland': 260.0, 'Etherwind': 270.0, 'Kiruna': 275.0, 'Katoa': 285.0, 'Umbra': 285.0, 'Libertas': 285.0, 'Ementior': 260.0, 'Gallus': 270.0}, 'AU': {'Deimos': 430.0, 'Proxion': 670.0, 'Kiruna': 510.0, 'Etherwind': 640.0, 'Ementior': 580.0}, 'CU': {'Deimos': 460.0, 'Proxion': 600.0, 'Phobos': 500.0, 'Kiruna': 560.0, 'Etherwind': 560.0, 'Umbra': 590.0, 'Ementior': 690.0}, 'FE': {'Kiruna': 235.0, 'Proxion': 295.0, 'Libertas': 255.0, 'Deimos': 270.0, 'ZV-759b': 285.0, 'Etherwind': 320.0, 'Ementior': 420.0, 'Gallus': 410.0}, 'LI': {'YI-280d': 440.0, 'Proxion': 450.0, 'Kiruna': 450.0, 'Etherwind': 460.0, 'Deimos': 460.0, 'Phobos': 460.0, 'KI-439b': 480.0, 'Ementior': 470.0}, 'SI': {'Ementior': 500.0, 'Proxion': 550.0, 'Deimos': 520.0, 'Phobos': 530.0, 'Hephaestus': 530.0, 'Umbra': 540.0, 'Etherwind': 550.0, 'Kiruna': 560.0}, 'STL': {'Kiruna': 510.0, 'Proxion': 580.0, 'Libertas': 540.0, 'Deimos': 550.0, 'Uponor': 560.0, 'ZV-759b': 570.0, 'Nike': 580.0, 'Katoa': 590.0, 'Etherwind': 600.0, 'Ementior': 700.0, 'Gallus': 690.0}, 'TI': {'Kiruna': 550.0, 'Proxion': 590.0, 'Deimos': 590.0}, 'W': {'Griffonstone': 9300.0, 'Proxion': 9300.0, 'Deimos': 9300.0, 'Umbra': 9300.0}, 'AST': {'Kiruna': 1000.0, 'Proxion': 1050.0, 'Deimos': 1100.0}, 'BGO': {'Deimos': 470.0, 'Proxion': 680.0, 'Kiruna': 530.0, 'Libertas': 580.0, 'Katoa': 720.0, 'Ementior': 620.0}, 'BOS': {'Griffonstone': 2150.0, 'Proxion': 2150.0, 'Kiruna': 2150.0, 'Katoa': 2150.0, 'Umbra': 2150.0, 'Deimos': 2150.0}, 'BRO': {'Deimos': 510.0, 'Proxion': 640.0, 'Kiruna': 580.0, 'Etherwind': 600.0, 'Libertas': 610.0, 'Katoa': 630.0, 'Ementior': 660.0}, 'FAL': {'Kiruna': 600.0, 'Proxion': 620.0, 'Katoa': 630.0, 'Deimos': 650.0}, 'FET': {'Kiruna': 990.0, 'Proxion': 1050.0, 'Katoa': 1050.0, 'Deimos': 1100.0}, 'RGO': {'Deimos': 510.0, 'Proxion': 750.0, 'Kiruna': 590.0, 'Libertas': 650.0, 'Ementior': 670.0}, 'WAL': {'Kiruna': 3100.0, 'Proxion': 3100.0, 'Katoa': 3100.0, 'Deimos': 3200.0}, 'DCL': {'Hephaestus': 1700.0, 'Proxion': 1700.0, 'Uponor': 1700.0, 'Katoa': 1700.0, 'Libertas': 1700.0, 'Nike': 1700.0, 'Deimos': 1700.0}, 'DCM': {'Hephaestus': 1050.0, 'Proxion': 1050.0, 'Uponor': 1050.0, 'Katoa': 1050.0, 'Libertas': 1050.0, 'Nike': 1050.0, 'Deimos': 1050.0}, 'DCS': {'Hephaestus': 390.0, 'Proxion': 390.0, 'Uponor': 390.0, 'Katoa': 390.0, 'Libertas': 390.0, 'Nike': 390.0, 'Deimos': 390.0}, 'PE': {'Hephaestus': 3.0, 'Proxion': 3.1, 'Deimos': 3.0, 'Nike': 3.0, 'Phobos': 3.0, 'Aceland': 3.0, 'Katoa': 3.1, 'Umbra': 3.1, 'Uponor': 3.1, 'Kiruna': 3.1, 'Libertas': 3.1, 'Ementior': 3.3, 'Gallus': 3.3}, 'PG': {'Griffonstone': 12.5, 'Proxion': 12.5, 'Uponor': 12.5, 'Umbra': 12.5, 'KW-602c': 12.5, 'Milliways': 12.5, 'Katoa': 12.5, 'Deimos': 12.5, 'Hephaestus': 12.5, 'Nike': 12.5, 'Ementior': 12.5, 'Gallus': 12.5}, 'PSL': {'Hephaestus': 1050.0, 'Proxion': 1050.0, 'Uponor': 1050.0, 'Katoa': 1050.0, 'Libertas': 1050.0, 'Deimos': 1050.0, 'Nike': 1050.0}, 'PSM': {'Hephaestus': 610.0, 'Proxion': 610.0, 'Uponor': 610.0, 'Deimos': 610.0, 'Nike': 610.0, 'Katoa': 610.0, 'Libertas': 610.0}, 'PSS': {'Hephaestus': 300.0, 'Proxion': 310.0, 'Uponor': 310.0, 'Katoa': 310.0, 'Libertas': 310.0}, 'CF': {'Deimos': 1850.0, 'Proxion': 1900.0, 'Nike': 1850.0, 'Etherwind': 1900.0, 'Kiruna': 1900.0, 'Katoa': 1900.0, 'Libertas': 1900.0, 'Ementior': 1950.0}, 'COT': {'Uponor': 770.0, 'Proxion': 780.0, 'Deimos': 780.0, 'Hephaestus': 780.0, 'Griffonstone': 780.0, 'Katoa': 780.0, 'Umbra': 780.0}, 'CTF': {'Kiruna': 8800.0, 'Proxion': 8800.0, 'Deimos': 8900.0}, 'KV': {'Hephaestus': 7000.0, 'Proxion': 7000.0, 'Katoa': 7000.0, 'Uponor': 7000.0, 'Nike': 7000.0, 'Gallus': 7100.0}, 'NL': {'Hephaestus': 1300.0, 'Proxion': 1350.0, 'Deimos': 1350.0, 'Uponor': 1350.0, 'Katoa': 1350.0, 'Umbra': 1350.0, 'Nike': 1350.0, 'Gallus': 1350.0}, 'SIL': {'Hephaestus': 1400.0, 'Proxion': 1400.0, 'Katoa': 1400.0, 'Umbra': 1400.0, 'Uponor': 1400.0}, 'TK': {'Uponor': 11500.0, 'Proxion': 11500.0}, 'BAC': {'Griffonstone': 780.0, 'Proxion': 780.0, 'Umbra': 780.0}, 'BL': {'Griffonstone': 2050.0, 'Proxion': 2100.0, 'Umbra': 2050.0}, 'BLE': {'Griffonstone': 840.0, 'Proxion': 850.0, 'Umbra': 850.0}, 'CST': {'Griffonstone': 1800.0, 'Proxion': 1800.0, 'Umbra': 1800.0}, 'DDT': {'Griffonstone': 1250.0, 'Proxion': 1250.0}, 'EES': {'Umbra': 24500.0, 'Proxion': 24500.0}, 'ETC': {'Umbra': 7500.0, 'Proxion': 7500.0}, 'FLX': {'Griffonstone': 53.0, 'Proxion': 56.0, 'Deimos': 55.0, 'ZV-759b': 55.0, 'Etherwind': 55.0, 'XH-668c': 55.0, 'Umbra': 55.0, 'Kiruna': 56.0, 'Ementior': 59.0}, 'IND': {'Griffonstone': 1000.0, 'Proxion': 1000.0}, 'LCR': {'Griffonstone': 1200.0, 'Proxion': 1200.0}, 'NAB': {'Griffonstone': 35.0, 'Proxion': 36.0, 'LS-746b': 35.0, 'Electronica': 36.0, 'Katoa': 36.0, 'Umbra': 36.0, 'Ementior': 37.0, 'Gallus': 37.0}, 'NR': {'Griffonstone': 115.0, 'Proxion': 115.0, 'Nike': 115.0, 'Umbra': 115.0}, 'NS': {'Griffonstone': 98.0, 'Proxion': 105.0, 'Umbra': 100.0, 'Harmonia': 105.0, 'Milliways': 105.0, 'Etherwind': 105.0, 'Poseidon': 110.0, 'Ementior': 110.0}, 'OLF': {'Umbra': 430.0, 'Proxion': 430.0}, 'PFE': {'Umbra': 205.0, 'Proxion': 210.0, 'Katoa': 210.0, 'Griffonstone': 210.0, 'Kiruna': 215.0}, 'REA': {'KI-840c': 165.0, 'Proxion': 165.0, 'Griffonstone': 165.0, 'Umbra': 165.0, 'Milliways': 165.0}, 'SOI': {'KI-840c': 165.0, 'Proxion': 195.0, 'ANT CX': 180.0, 'Hephaestus': 180.0, 'Griffonstone': 185.0, 'Umbra': 190.0, 'Katoa': 190.0, 'Kiruna': 195.0}, 'TCL': {'Griffonstone': 990.0, 'Proxion': 990.0, 'Umbra': 990.0}, 'THF': {'Griffonstone': 195.0, 'Proxion': 200.0, 'Deimos': 195.0, 'Umbra': 200.0, 'Katoa': 200.0}, 'BE': {'Griffonstone': 1350.0, 'Proxion': 1350.0, 'Katoa': 1350.0, 'Etherwind': 1350.0, 'Umbra': 1350.0, 'Nike': 1350.0, 'Phobos': 1350.0}, 'C': {'Proxion': 210.0, 'Etherwind': 215.0, 'Tacotopia': 215.0, 'Harmonia': 220.0, 'Katoa': 225.0, 'Umbra': 225.0, 'Uponor': 225.0, 'Griffonstone': 230.0, 'Kiruna': 230.0, 'ZV-759b': 235.0, 'Deimos': 235.0, 'Poseidon': 240.0, 'Ementior': 250.0}, 'CA': {'Griffonstone': 330.0, 'Proxion': 350.0, 'Umbra': 350.0, 'Milliways': 350.0}, 'CL': {'Griffonstone': 810.0, 'Proxion': 850.0, 'Umbra': 840.0}, 'ES': {'Umbra': 980.0, 'Proxion': 990.0}, 'I': {'Hephaestus': 430.0, 'Proxion': 510.0, 'Elon': 450.0, 'Etherwind': 490.0, 'Milliways': 500.0, 'Katoa': 510.0, 'Uponor': 510.0, 'Kiruna': 520.0}, 'MG': {'Hephaestus': 27.5, 'Proxion': 32.0, 'Deimos': 28.5, 'Elon': 29.0, 'Griffonstone': 29.5, 'Uponor': 31.0, 'Umbra': 31.0, 'Katoa': 31.0}, 'NA': {'Griffonstone': 18.0, 'Proxion': 24.0, 'Umbra': 18.5, 'Deimos': 25.5, 'Kiruna': 28.5}, 'S': {'Deimos': 56.0, 'Proxion': 62.0, 'Hephaestus': 58.0, 'Griffonstone': 60.0, 'Katoa': 63.0, 'Umbra': 63.0, 'Ementior': 61.0, 'Gallus': 62.0}, 'TA': {'Griffonstone': 9100.0, 'Proxion': 9300.0, 'Katoa': 9300.0, 'Umbra': 9300.0}, 'TC': {'Umbra': 3200.0, 'Proxion': 3300.0, 'Katoa': 3300.0}, 'ZR': {'Griffonstone': 8500.0, 'Proxion': 8600.0, 'Umbra': 8600.0}, 'AAR': {'Phobos': 4600.0, 'Proxion': 4600.0}, 'AWF': {'Phobos': 2150.0, 'Proxion': 2200.0}, 'BID': {'Malahat': 20500.0, 'Proxion': 20500.0}, 'BMF': {'Malahat': 8500.0, 'Proxion': 8500.0}, 'BSC': {'Griffonstone': 12500.0, 'Proxion': 12500.0}, 'BWS': {'Malahat': 6700.0, 'Proxion': 6700.0}, 'HD': {'Hephaestus': 1200.0, 'Proxion': 1250.0}, 'HOG': {'Phobos': 2450.0, 'Proxion': 2450.0}, 'MHP': {'Malahat': 1600.0, 'Proxion': 1600.0}, 'RAD': {'Malahat': 3500.0, 'Proxion': 3500.0}, 'SAR': {'Malahat': 9100.0, 'Proxion': 9100.0, 'Phobos': 9100.0}, 'CD': {'Malahat': 7400.0, 'Proxion': 7400.0}, 'DIS': {'Hephaestus': 4300.0, 'Proxion': 4300.0}, 'FAN': {'Hephaestus': 530.0, 'Proxion': 530.0}, 'MB': {'Hephaestus': 2250.0, 'Proxion': 2250.0}, 'MPC': {'Hephaestus': 490.0, 'Proxion': 490.0}, 'PCB': {'Hephaestus': 620.0, 'Proxion': 620.0}, 'RAM': {'Hephaestus': 820.0, 'Proxion': 820.0}, 'ROM': {'Hephaestus': 1100.0, 'Proxion': 1100.0}, 'SEN': {'Hephaestus': 235.0, 'Proxion': 235.0}, 'TPU': {'Hephaestus': 1100.0, 'Proxion': 1100.0}, 'TRA': {'Malahat': 650.0, 'Proxion': 650.0}, 'BCO': {'Deimos': 165.0, 'Proxion': 165.0, 'Ementior': 165.0}, 'BGC': {'Deimos': 165.0, 'Proxion': 165.0, 'Ementior': 165.0}, 'CAP': {'Malahat': 105.0, 'Proxion': 105.0}, 'HCC': {'Deimos': 170.0, 'Proxion': 170.0, 'Ementior': 170.0}, 'LDI': {'Malahat': 215.0, 'Proxion': 215.0}, 'MFK': {'Kiruna': 77.0, 'Proxion': 78.0, 'Libertas': 78.0, 'Deimos': 79.0, 'Ementior': 80.0}, 'MWF': {'Phobos': 125.0, 'Proxion': 125.0}, 'SFK': {'Kiruna': 21.0, 'Proxion': 21.5, 'Libertas': 21.5, 'Deimos': 22.0, 'Ementior': 22.0}, 'SWF': {'Phobos': 57.0, 'Proxion': 57.0}, 'TRN': {'Phobos': 125.0, 'Proxion': 125.0}, 'ACS': {'Hephaestus': 66000.0, 'Proxion': 66000.0}, 'ADS': {'Hephaestus': 52000.0, 'Proxion': 52000.0}, 'COM': {'Hephaestus': 37000.0, 'Proxion': 37000.0}, 'FFC': {'Hephaestus': 160000.0, 'Proxion': 160000.0}, 'LIS': {'Hephaestus': 265000.0, 'Proxion': 265000.0}, 'LOG': {'Hephaestus': 30000.0, 'Proxion': 30000.0}, 'WR': {'Hephaestus': 77000.0, 'Proxion': 77000.0}, 'CBL': {'Malahat': 36000.0, 'Proxion': 36000.0}, 'CBM': {'Malahat': 24500.0, 'Proxion': 24500.0}, 'CBS': {'Malahat': 16500.0, 'Proxion': 16500.0}, 'POW': {'Malahat': 2750.0, 'Proxion': 2800.0}, 'SOL': {'Phobos': 350.0, 'Proxion': 350.0}, 'SP': {'Malahat': 900.0, 'Proxion': 900.0}, 'ADR': {'Griffonstone': 20500.0, 'Proxion': 20500.0}, 'BND': {'Griffonstone': 160.0, 'Proxion': 160.0}, 'PK': {'Griffonstone': 500.0, 'Proxion': 500.0}, 'SEQ': {'Kiruna': 4800.0, 'Proxion': 4800.0}, 'STR': {'Hephaestus': 720.0, 'Proxion': 740.0, 'Uponor': 740.0, 'Katoa': 740.0, 'Ementior': 750.0}, 'TUB': {'Deimos': 68.0, 'Proxion': 68.0}, 'OFF': {'Hephaestus': 25.0, 'Proxion': 26.5, 'Uponor': 25.0, 'Katoa': 25.5, 'Deimos': 26.0, 'Kiruna': 26.5, 'Milliways': 26.5, 'Ementior': 26.5}, 'SUN': {'Katoa': 160.0, 'Proxion': 160.0}, 'UTS': {'Kiruna': 1800.0, 'Proxion': 1800.0}, 'BAI': {'Malahat': 6200.0, 'Proxion': 6200.0}, 'LD': {'Malahat': 4600.0, 'Proxion': 4600.0}, 'MLI': {'Malahat': 9300.0, 'Proxion': 9300.0}, 'NF': {'Malahat': 4600.0, 'Proxion': 4600.0}, 'SA': {'Malahat': 3100.0, 'Proxion': 3100.0}, 'SAL': {'Malahat': 3100.0, 'Proxion': 3100.0}, 'WM': {'Malahat': 6200.0, 'Proxion': 6200.0}, 'DA': {'Malahat': 21500.0, 'Proxion': 21500.0}, 'DD': {'Malahat': 22000.0, 'Proxion': 22000.0}, 'DV': {'Malahat': 9600.0, 'Proxion': 9600.0}, 'EDC': {'Malahat': 6400.0, 'Proxion': 6400.0}, 'NN': {'Malahat': 25000.0, 'Proxion': 25000.0}, 'OS': {'Malahat': 25000.0, 'Proxion': 25000.0}, 'IDC': {'Malahat': 9300.0, 'Proxion': 9300.0}, 'IMM': {'Malahat': 58000.0, 'Proxion': 58000.0}, 'SNM': {'Malahat': 65000.0, 'Proxion': 65000.0}, 'WAI': {'Malahat': 45000.0, 'Proxion': 45000.0}, 'AFR': {'Deimos': 9300.0, 'Proxion': 9300.0}, 'BFP': {'Hephaestus': 13000.0, 'Proxion': 13000.0}, 'BFR': {'Deimos': 1200.0, 'Proxion': 1250.0}, 'CHA': {'Nike': 22500.0, 'Proxion': 22500.0}, 'ENG': {'Hephaestus': 280000.0, 'Proxion': 280000.0}, 'FIR': {'Malahat': 470000.0, 'Proxion': 470000.0}, 'FSE': {'Hephaestus': 320000.0, 'Proxion': 320000.0}, 'GCH': {'Deimos': 8100.0, 'Proxion': 8100.0}, 'GEN': {'Deimos': 100000.0, 'Proxion': 100000.0}, 'GNZ': {'Deimos': 17500.0, 'Proxion': 17500.0}, 'HPR': {'Hephaestus': 570000.0, 'Proxion': 570000.0}, 'HYR': {'Hephaestus': 1100000.0, 'Proxion': 1100000.0}, 'LFE': {'Malahat': 65000.0, 'Proxion': 65000.0}, 'LFP': {'Hephaestus': 3100.0, 'Proxion': 3100.0}, 'MFE': {'Phobos': 33000.0, 'Proxion': 33000.0}, 'NOZ': {'Hephaestus': 36000.0, 'Proxion': 36000.0}, 'QCR': {'Hephaestus': 290000.0, 'Proxion': 290000.0}, 'RAG': {'Malahat': 225000.0, 'Proxion': 225000.0}, 'RCS': {'Hephaestus': 93000.0, 'Proxion': 93000.0}, 'RCT': {'Hephaestus': 285000.0, 'Proxion': 285000.0}, 'SFE': {'Phobos': 20500.0, 'Proxion': 20500.0}, 'AGS': {'Katoa': 135000.0, 'Proxion': 135000.0}, 'BHP': {'Deimos': 970.0, 'Proxion': 1150.0, 'Etherwind': 1100.0, 'Katoa': 1100.0, 'Kiruna': 1150.0}, 'LHP': {'Deimos': 840.0, 'Proxion': 990.0, 'Etherwind': 950.0, 'Katoa': 980.0, 'Kiruna': 1000.0}, 'NV1': {'Hephaestus': 91000.0, 'Proxion': 91000.0}, 'SSC': {'Nike': 125.0, 'Proxion': 145.0, 'Deimos': 130.0, 'Kiruna': 135.0, 'Katoa': 140.0}, 'THP': {'Nike': 1650.0, 'Proxion': 1700.0}, 'LCB': {'Kiruna': 200000.0, 'Proxion': 205000.0}, 'LFL': {'Katoa': 175000.0, 'Proxion': 175000.0}, 'LSL': {'Kiruna': 125000.0, 'Proxion': 125000.0}, 'MCB': {'Kiruna': 100000.0, 'Proxion': 105000.0}, 'MFL': {'Kiruna': 87000.0, 'Proxion': 87000.0}, 'MSL': {'Kiruna': 51000.0, 'Proxion': 51000.0}, 'SCB': {'Kiruna': 32000.0, 'Proxion': 32000.0}, 'SFL': {'Kiruna': 43000.0, 'Proxion': 43000.0}, 'SSL': {'Kiruna': 12000.0, 'Proxion': 12000.0, 'Katoa': 12000.0}, 'TCB': {'Kiruna': 5500.0, 'Proxion': 5600.0, 'Katoa': 5600.0, 'Deimos': 5800.0}, 'VCB': {'Kiruna': 200000.0, 'Proxion': 200000.0}, 'VSC': {'Kiruna': 9400.0, 'Proxion': 9600.0, 'Katoa': 9700.0, 'Deimos': 10000.0}, 'WCB': {'Kiruna': 200000.0, 'Proxion': 205000.0}, 'BR1': {'Nike': 215000.0, 'Proxion': 215000.0}, 'BR2': {'Nike': 280000.0, 'Proxion': 285000.0}, 'BRS': {'Nike': 93000.0, 'Proxion': 95000.0}, 'CQL': {'Nike': 470000.0, 'Proxion': 480000.0}, 'CQM': {'Nike': 390000.0, 'Proxion': 390000.0}, 'CQS': {'Nike': 330000.0, 'Proxion': 330000.0}, 'CQT': {'Nike': 63000.0, 'Proxion': 64000.0}, 'DOU': {'Nike': 87000.0, 'Proxion': 87000.0}, 'HAB': {'Nike': 29500.0, 'Proxion': 29500.0}, 'LU': {'Nike': 41000.0, 'Proxion': 41000.0}, 'RDL': {'Nike': 255000.0, 'Proxion': 255000.0}, 'SU': {'Nike': 68000.0, 'Proxion': 68000.0}, 'TCU': {'Nike': 40000.0, 'Proxion': 41000.0}, 'WOR': {'Nike': 42000.0, 'Proxion': 42000.0}, 'CCD': {'Malahat': 23000.0, 'Proxion': 23000.0}, 'DCH': {'Malahat': 7200.0, 'Proxion': 7200.0}, 'DRF': {'Nike': 1700.0, 'Proxion': 1700.0}, 'RED': {'Malahat': 19500.0, 'Proxion': 19500.0}, 'SDR': {'Malahat': 29000.0, 'Proxion': 29000.0}, 'SRD': {'Malahat': 23000.0, 'Proxion': 23000.0}, 'SUD': {'Malahat': 33000.0, 'Proxion': 33000.0}, 'BPT': {'Katoa': 1600.0, 'Proxion': 1600.0}, 'BWH': {'Deimos': 2050.0, 'Proxion': 2050.0}};
let kawa_display = {};

function make_kawa() {
    for (const [ticker, planets] of Object.entries(kawa_prices)) {
        let min_price, max_price, avg_price, proxion;
        min_price = Math.min(...Object.values(planets));
        max_price = Math.max(...Object.values(planets));
        avg_price = (Object.values(planets).reduce((a, b) => a + b, 0) / Object.values(planets).length).toFixed(2);
        proxion = planets["Proxion"] || 0;
        kawa_display[ticker] = {
            min: min_price,
            max: max_price,
            avg: avg_price,
            proxion: proxion,
        };
    }
}

function get_kawa(ticket) {
    return kawa_display[ticket];
}

function getPrices(callback) {
    // Check if last_update is null or if now is past the updates on
    if (!last_update || new Date() > updates_on) {
        // Get market data from FIO
        $.ajax({
            type: "GET",
            url: "https://rest.fnar.net/exchange/all",
            success: function (output, status, xhr) {
                // Grab data
                prices = output;
                // Set last update to now
                last_update = new Date();
                // Set updates_on to 5 minutes from now
                updates_on = new Date(last_update.getTime() + 5 * 60000);

                callback(output);
            },
            error: function () {
                console.log("Error in API call");
            },
        });
    } else {
        // No update needed go ahead and parse the data
        callback(prices);
    }
}

function generateTooltipContent(ticker, title) {
    let kawa = get_kawa(ticker);
    let html = tooltip_html.replace("{UPDATE}", updates_on.toLocaleString());
    // Find Material in FIO data
    let market_data = prices.filter((obj) => {
        return obj.MaterialTicker === ticker;
    });
    if (market_data.length === 0) {
        return createElement(tooltip_html_nodata.replace("{TITLE}", title));
    }


    html = html.replace("{KAWA.min}",
        kawa ? kawa.min.toLocaleString() : "null");
    html = html.replace("{KAWA.max}",
        kawa ? kawa.max.toLocaleString() : "null");
    html = html.replace("{KAWA.avg}",
        kawa ? kawa.avg.toLocaleString() : "null");
    html = html.replace("{KAWA.proxion}",
        kawa ? kawa.proxion.toLocaleString() : "null");

    html = html.replace("{KAWA.UPDATE}", kawa_updated);

    // Filter should return all 4 markets worth of data, populate our tooltip
    market_data.forEach(function (ticker_data) {
        html = html.replace(
            `{Ask.${ticker_data.ExchangeCode}}`,
            ticker_data.Ask ? ticker_data.Ask.toLocaleString() : "null"
        );
        html = html.replace(
            `{Buy.${ticker_data.ExchangeCode}}`,
            ticker_data.Bid ? ticker_data.Bid.toLocaleString() : "null"
        );
        html = html.replace(
            `{Avg.${ticker_data.ExchangeCode}}`,
            ticker_data.PriceAverage
                ? ticker_data.PriceAverage.toLocaleString()
                : "null"
        );
        html = html.replace(
            `{Supply.${ticker_data.ExchangeCode}}`,
            ticker_data.Supply ? ticker_data.Supply.toLocaleString() : "null"
        );
        html = html.replace(
            `{Demand.${ticker_data.ExchangeCode}}`,
            ticker_data.Demand ? ticker_data.Demand.toLocaleString() : "null"
        );
        html = html.replace(`{TITLE}`, title);
    });
    // Replace any nulls with '--'
    html = html.replaceAll("null", "--");
    return createElement(html);
}

function createElement(html) {
    var div = document.createElement("div");
    div.innerHTML = html.trim();
    return div.firstChild;
}

function showTooltip(item, ticker) {
    if ($(`#tooltip_${ticker}`).length > 0) {
        return document.getElementById(`tooltip_${ticker}`);
    }
    const title = $(item).attr("title");
    const content = generateTooltipContent(ticker, title);
    content.id = `tooltip_${ticker}`;

    // Positioning
    document.body.appendChild(content);

    const positionFromLeft =
        item.getBoundingClientRect().right + item.offsetWidth / 6;
    const canFitOnRight =
        positionFromLeft + content.offsetWidth < window.innerWidth;
    if (canFitOnRight) {
        content.style.left = positionFromLeft + "px";
    } else {
        content.style.left =
            item.getBoundingClientRect().left -
            item.offsetWidth / 6 -
            content.offsetWidth +
            "px";
    }

    let positionFromTop =
        item.getBoundingClientRect().top +
        item.offsetHeight / 2 -
        content.offsetHeight / 2;
    const doesBottomOverflow =
        positionFromTop + content.offsetHeight > window.innerHeight;
    const doesTopOverflow = positionFromTop < 0;
    if (doesBottomOverflow) {
        content.style.top =
            window.innerHeight - content.offsetHeight - 3 + "px";
    } else if (doesTopOverflow) {
        content.style.top = "3px";
    } else {
        content.style.top = positionFromTop + "px";
    }

    return content;
}

function hideTooltip(tooltip) {
    try {
        tooltip.remove();
    } catch (e) {}
}

function addEventListenersToItems(items) {
    items.forEach((item) => {
        const ticker = $(item).find(".ColoredIcon__label___OU1I4oP").text();
        $(item).children().attr("title", "");
        let tooltip;
        item.addEventListener("mouseover", () => {
            tooltip = showTooltip(item, ticker);
        });
        item.addEventListener("mouseout", () => {
            hideTooltip(tooltip);
        });
        item.addEventListener("mousedown", () => {
            hideTooltip(tooltip);
        });
    });
}

function setupTooltips(items) {
    getPrices(() => addEventListenersToItems(items));
}

function monitorOnElementCreated(selector, callback, onlyOnce = true) {
    const getElementsFromNodes = (nodes) =>
        Array.from(nodes)
            .flatMap((node) =>
                node.nodeType === 3
                    ? null
                    : Array.from(node.querySelectorAll(selector))
            )
            .filter((item) => item !== null);
    let onMutationsObserved = function (mutations) {
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length) {
                const elements = getElementsFromNodes(mutation.addedNodes);
                if (elements && elements.length > 0) {
                    if (onlyOnce) {
                        observer.disconnect();
                        callback(elements[0]);
                        return;
                    }
                    callback(elements);
                }
            }
        });
    };

    let containerSelector = "body";
    let target = document.querySelector(containerSelector);
    let config = { childList: true, subtree: true };
    let MutationObserver =
        window.MutationObserver || window.WebKitMutationObserver;
    let observer = new MutationObserver(onMutationsObserved);
    observer.observe(target, config);
}

function addStyle(styleString) {
    var style = document.createElement("style");
    if (style.styleSheet) {
        style.styleSheet.cssText = styleString;
    } else {
        style.appendChild(document.createTextNode(styleString));
    }
    document.getElementsByTagName("head")[0].appendChild(style);
}

function waitForApexLoad() {
    make_kawa();
    getPrices(() => {});
    const insideFrameSelector = ".ColoredIcon__container___djaR4r2";
    monitorOnElementCreated(
        insideFrameSelector,
        (items) => setTimeout(() => setupTooltips(items), 100),
        false
    );

    const onLoad = () => {
        addStyle(styles);
    };

    const selector = "#TOUR_TARGET_BUTTON_BUFFER_NEW";
    monitorOnElementCreated(selector, onLoad);
}

(function () {
    "use strict";
    waitForApexLoad();
})();
