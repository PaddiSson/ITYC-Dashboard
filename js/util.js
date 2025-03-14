/* 
This file is part of ITYC DashBoard.

ITYC DashBoard is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

ITYC DashBoard is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU General Public License for more details.

You should have received a copy of the GNU General Public License along with Foobar. If not, see <https://www.gnu.org/licenses/>

Feel free to contact SkipperDuMad on discord skipperdumad#8855

*/

var sortField = "none";
var currentSortOrder = 0;

// Earth radius in nm, 360*60/(2*Pi);
var radius = 3437.74683;

var guessOptionBits = {
    "hull":  1,
    "winch": 2,
    "foil":  4,
    "light": 8,
    "reach": 16,
    "heavy": 32,
    "hullDetected":64,
    "foilDetected":128,
    "winchDetected":256,
    3:32, //stay
    4:8,  //LJ
    5:16,  //C0
    6:32,  //HG
    7:8,  //LG
};

function angle(h0, h1) {
    return Math.abs(Math.PI - Math.abs(h1 - h0));
}

function courseAngle(lat0, lon0, lat1, lon1) {

    if(lon0 < lon1+0.00002 && lon0 > lon1-0.00002)
    { // When heading in PI or 0 trigo fails ;)
        if(lat0 <lat1) return 0; else return Math.PI;
    }
    var rlat0 = toRad(lat0);
    var rlat1 = toRad(lat1);
    var rlon0 = toRad(lon0);
    var rlon1 = toRad(lon1);
    var xi = gcAngle(rlat0, rlon0, rlat1, rlon1);
    var a = Math.acos((Math.sin(rlat1) - Math.sin(rlat0) * Math.cos(xi)) / (Math.cos(rlat0) * Math.sin(xi)));
    return (Math.sin(rlon1 - rlon0) > 0) ? a : (2 * Math.PI - a);
}


function formatDDMMYY (d) {
    var s = ""
        + pad0(d.getUTCDate())
        + pad0(d.getUTCMonth() + 1)
        + d.getUTCFullYear().toString().substring(2,4);
    return s;        
}

function formatDHMS(seconds) {
    if (seconds === undefined || isNaN(seconds) || seconds < 0) {
        return "-";
    }

    seconds = Math.floor(seconds / 1000);

    var days = Math.floor(seconds / 86400);
    var hours = Math.floor(seconds / 3600) % 24;
    var minutes = Math.floor(seconds / 60) % 60;
    let retVal = "";
    if(days!=0) retVal = pad0(days) + "d " + pad0(hours) + "h " + pad0(minutes) + "m";
    else if(hours!=0) retVal = pad0(hours) + "h " + pad0(minutes) + "m";
    else retVal = pad0(minutes) + "m"; 

    return retVal;
}

function formatHHMMSSSS (d) {
    var s = ""
        + pad0(d.getUTCHours())
        + pad0(d.getUTCMinutes())
        + pad0(d.getUTCSeconds());
    return s;
}
    
function formatHM (seconds) {
    if (seconds === undefined || isNaN(seconds) || seconds < 0) {
        return "-";
    }

    seconds = Math.floor(seconds / 1000);

    var hours = Math.floor(seconds / 3600);
    seconds -= 3600 * hours;

    var minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    let ret;
    if(hours!=0)
    {
        ret = pad0(hours,1)+ "h" + pad0(minutes) + "m";
    } else
    {
        ret = pad0(minutes,1) + "m";    
    }
    return ret;
}


function formatTimeNotif(ts) {
    var tsOptions = {
        hour: "numeric",
        minute: "numeric",
        hour12: false
    };
    var d = (ts) ? (new Date(ts)) : (new Date());
    return new Intl.DateTimeFormat("lookup", tsOptions).format(d);
}

function formatTimestampToISO(ts) {
    const date = new Date(ts);
    return date.toISOString(); // return '2025-01-16T15:30:00.000Z'
}

function formatTimestampToReadableDate(ts) {
    const date = new Date(ts);
    return date.toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short' }); // return 'Sunday, November 10, 2024 at 2:22 PM'
}

function formatPosition(lat, lon) {
    var latDMS = toDMS(lat);
    var lonDMS = toDMS(lon);
    var latString = latDMS.g + "°" + pad0(latDMS.m) + "'" + pad0(latDMS.s) + "." + pad0(latDMS.cs, 2) + '"';
    var lonString = lonDMS.g + "°" + pad0(lonDMS.m) + "'" + pad0(lonDMS.s) + "." + pad0(lonDMS.cs, 2) + '"';

    var separator = document.getElementById("vrzenPositionFormat").checked?" ":" - ";
    return latString + ((latDMS.u == 1) ? "N" : "S") + separator + lonString + ((lonDMS.u == 1) ? "E" : "W");
}
function formatPosition2l(lat, lon) {
    var latDMS = toDMS(lat);
    var lonDMS = toDMS(lon);
    var latString = latDMS.g + "°" + pad0(latDMS.m) + "'" + pad0(latDMS.s) + "." + pad0(latDMS.cs, 2) + '"';
    var lonString = lonDMS.g + "°" + pad0(lonDMS.m) + "'" + pad0(lonDMS.s) + "." + pad0(lonDMS.cs, 2) + '"';


    return "<p>"+latString + ((latDMS.u == 1) ? "N" : "S") + "</p><p>" + lonString + ((lonDMS.u == 1) ? "E" : "W")+"</p>";
}
function gcAngle(rlat0, rlon0, rlat1, rlon1) {
    return Math.acos(Math.sin(rlat0) * Math.sin(rlat1) + Math.cos(rlat0) * Math.cos(rlat1) * Math.cos(rlon1 - rlon0));
}

// Greate circle distance
function gcDistance(pos0, pos1) {
    // e = r · arccos(sin(φA) · sin(φB) + cos(φA) · cos(φB) · cos(λB – λA))
    var rlat0 = toRad(pos0.lat);
    var rlat1 = toRad(pos1.lat);
    var rlon0 = toRad(pos0.lon);
    var rlon1 = toRad(pos1.lon);
    return radius * gcAngle(rlat0, rlon0, rlat1, rlon1);
}

function pad0 (val, length=2, base=10) {
    var result = val.toString(base)
    while (result.length < length) result = '0' + result;
    return result;
}

function roundTo(number, digits) {
    if (number !== undefined && !isNaN(number)) {
        var scale = Math.pow(10, digits);
        return (Math.round(number * scale) / scale).toFixed(digits);
    } else {
        return "-";
    }
}

function sign(x) {
    return (x < 0) ? -1 : 1;
}
    
function toDeg(angle) {
    return angle / Math.PI * 180;
}
    
function toDMS(number) {
    var u = sign(number);
    number = Math.abs(number);
    var g = Math.floor(number);
    var frac = number - g;
    var m = Math.floor(frac * 60);
    frac = frac - m / 60;
    var s = Math.floor(frac * 3600);
    var cs = roundTo(360000 * (frac - s / 3600), 0);
    while (cs >= 100) {
        cs = cs - 100;
        s = s + 1;
    }
    return {
        "u": u,
        "g": g,
        "m": m,
        "s": s,
        "cs": cs
    };
}
    
function toRad(angle) {
    return angle / 180 * Math.PI;
}

function convertDMS2Dec(lat,lon)
{
   // const regex = /^(\d+)A(\d+)'(\d+) ([NS])\s+(\d+)A(\d+)'(\d+) ([EW])$/;
    
    const regex = /(\d+)[^A-Za-z0-9](\d+)'((\d+)|(\d+(\.|,)\d+)) ([NSEW])/;
    
    const match = lat.match(regex);
    const match1 = lon.match(regex);
    
    if (match && match1) {
        const latDegrees = parseInt(match[1]);
        const latMinutes = parseInt(match[2]);
        const latSeconds = parseFloat(match[3]);
        const latDirection = match[7];
        const latitude = latDegrees + latMinutes / 60 + latSeconds / 3600;
        
        const lonDegrees = parseInt(match1[1]);
        const lonMinutes = parseInt(match1[2]);
        const lonSeconds = parseFloat(match1[3]);
        const lonDirection = match1[7];
        const longitude = lonDegrees + lonMinutes / 60 + lonSeconds / 3600;    
        return {
            lat: latDirection === 'N' ? latitude : -latitude,
            lon: lonDirection === 'E' ? longitude : -longitude
        };       
    } else {
        return {
            lat:0,
            lon:0
        }; // Coordonnées invalides
    }

}
function genth(id, content, title, sortfield, sortmark) {
    var checkboxId = '';
    if (!content) {
        var contentAlt = id.split("_")[1];
        checkboxId = "fleet_" + contentAlt.toLowerCase();
    }
    else checkboxId = "fleet_" + content.toLowerCase();
    var checkBox = document.getElementById(checkboxId);
    if ((! checkBox ) || checkBox.checked ) {
        if (sortfield && sortmark != undefined) {
            content = content + " " + (sortmark ? "&#x25b2;" : "&#x25bc;");
        }
        var cspan = '';
        if (id=="th_twa" || id=="th_sail") {
            cspan = "colspan = 2";
        }
        return '<th ' + cspan + ' id="' + id + '"'
            + (sortfield ? ' style="background: DarkBlue;"' : "")
            + (title ? (' title="' + title + '"') : "")
            + '>' + content + '</th>';
    } else {
        return ""
    }
}

function genthRacelog(id, checkboxConfigName, content, title) {
    var checkboxId = "racelog_" + checkboxConfigName;
    var checkBox = document.getElementById(checkboxId);
    if ((! checkBox ) || checkBox.checked ) {
        return '<th id="' + id + '"'
            + (title ? (' title="' + title + '"') : "")
            + '>' + content + '</th>';
    } else {
        return ""
    }
}
function gentd(name, style,title, value) {
    var checkboxId = "fleet_" + name.toLowerCase();
    var checkBox = document.getElementById(checkboxId);
    if ((! checkBox ) || checkBox.checked ) {
        if (checkboxId == "fleet_sailicon") {
            var checkBoxSail = document.getElementById('fleet_sail');
            if (!checkBoxSail.checked) return "";
        }
        else if (checkboxId == "fleet_twaicon") {
            var checkBoxTWA = document.getElementById('fleet_twa');
            if (!checkBoxTWA.checked) return "";
        }
        return '<td class="' + name + '" ' 
                            + style 
                            + (title ? (' title="' + title + '"') : "")
                            + ' >' + value + '</td>';
    }    else {
        return ""
    }

}
function gentdRacelog(className, checkboxConfigName, style, title, value) {
    var checkboxId = "racelog_" + checkboxConfigName;
    var checkBox = document.getElementById(checkboxId);
    if (!style || style === null) style = '';
    if ((! checkBox ) || checkBox.checked ) {
        return '<td class="' + className + '" ' 
            + style 
            + (title ? (' title="' + title + '"') : "")
            + ' >' + value + '</td>';
    } else {
        return "";
    }
}

function formatDateTable(ts) {
    var tsOptions = {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour12: false
    };
    if(ts=='-') return "-";
    var d = (ts) ? (new Date(ts)) : (new Date());
    return new Intl.DateTimeFormat("lookup", tsOptions).format(d);
}
function PositionOpenPopup(url, title, w, h) {
    // Fixes dual-screen position                         Most browsers      Firefox
    var dualScreenLeft = window.screenLeft != undefined ? window.screenLeft : screen.left;
    var dualScreenTop = window.screenTop != undefined ? window.screenTop : screen.top;

    var width = window.innerWidth ? window.innerWidth : document.documentElement.clientWidth ? document.documentElement.clientWidth : screen.width;
    var height = window.innerHeight ? window.innerHeight : document.documentElement.clientHeight ? document.documentElement.clientHeight : screen.height;

    // var left = ((width / 2) - (w / 2)) + dualScreenLeft;
    // var top = ((height / 2) - (h / 2)) + dualScreenTop;
    var left = (width - w) + dualScreenLeft;
    var top = (height - h) + dualScreenTop;
    var newWindow = window.open(url, title, 'location=no, menubar=no, resizable=no, scrollbars=no, status=no, titlebar=no, toolbar=no, width=' + w + ', height=' + h + ', top=' + top + ', left=' + left);

    // Puts focus on the newWindow
    if (window.focus) {
        newWindow.focus();
    }
    return newWindow;
}

function sortFriends(fleet,origin) {
    function sortFriendsByField(rf, field) {
        function numeric (s) {
            var r = String(s);
            if ( r.substr(0, 1) == "(" ) {
                r = r.slice(1, -1);
            }
            if ( isNaN(r) ) {
                r = r.toUpperCase();
            } else {
                r = Number(r);
            }
            return r;
        }
        function convertSymbolsEntry(entry) {
            if (typeof entry !== 'string') {
                return entry;
            }
            // By field
            if (field == 'xoption_foils') {
                if (entry === "no") return -1;
                if (entry === "?") return -2;
                if (entry.includes("%")) return parseFloat(entry.replace(/%/g, ''));
            }
            else if (field == 'xfactor') {
                if (isNaN(entry)) return -3;
            }
            if (entry === "-") return -3;
            return entry;
        }
        rf.table.sort(function (uidA, uidB) {
            // Check if we have values at all
            if (rf.uinfo[uidA] == undefined && rf.uinfo[uidB] == undefined) return 0;
            if (rf.uinfo[uidB] == undefined) return -1;
            if (rf.uinfo[uidA] == undefined) return 1;

            // Fetch value of sort field and convert to number.
            var entryA = rf.uinfo[uidA][field];
            var entryB = rf.uinfo[uidB][field];

            // Prefer defined values over undefined values
            if (entryA == undefined && entryB == undefined) return 0;
            if (entryB == undefined) return -1;
            if (entryA == undefined) return 1;

            entryA = convertSymbolsEntry(entryA);
            entryB = convertSymbolsEntry(entryB);

            // Cast to number if possible
            entryA = numeric(entryA);
            entryB = numeric(entryB);

            // Compare values.
            if (currentSortOrder == 0) {
                if (entryA < entryB) return -1;
                if (entryA > entryB) return 1;
            } else {
                if (entryA > entryB) return -1;
                if (entryA < entryB) return 1;
            }
            return 0;
        });
    }
// generate sorted list, expire old entries
    function sortFriendsByCategory(fleet) {
        var fln = new Array();

        function sortPrio (uinfo) {
            const category2 = ["followed", "team", "certified", "normal", "real"];
            return category2.indexOf(uinfo.type2);
        }
        Object.keys(fleet.uinfo).forEach(function (key) {
            fln.push(key);
        });

        fln.sort(function (a, b) {
            var au = fleet.uinfo[a];
            var bu = fleet.uinfo[b];
            // Team before opponents
            if (au.team == bu.team) {
                if (sortPrio(au) == sortPrio(bu)) {
                    if (au.rank == bu.rank) {
                        return (au.displayName && au.displayName.localeCompare(bu.displayName)) || 0;
                    } else if (au.rank < bu.rank) {
                        return -1;
                    } else {
                        return 1;
                    }
                } else if ( sortPrio(au) < sortPrio(bu) ) {
                    return -1;
                } else {
                    return 1;
                }
            } else if (au.team) {
                return -1;
            } else {
                return 1;
            }
        });
        fleet.table = fln;
    }
    
    if (sortField != "none" || origin >= 5) {
        sortFriendsByField(fleet, sortField);
    } else {
        sortFriendsByCategory(fleet);
    }
}

function set_sortField(value)
{
    sortField = value;
}

function set_currentSortOrder(value)
{
    currentSortOrder = value;
}

function formatShortDate(ts, dflt, timezone) {
    if (!ts && dflt) return dflt;
    if(ts=='-') return "-";
    const date = new Date(ts);
    var month, day, hours, minutes, utcDate;
    if (!timezone) {
        utcDate = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), date.getUTCHours(), date.getUTCMinutes(), date.getUTCSeconds()));
        month = (utcDate.getUTCMonth() + 1).toString().padStart(2, '0');
        day = utcDate.getUTCDate().toString().padStart(2, '0');
        hours = utcDate.getUTCHours().toString().padStart(2, '0');
        minutes = utcDate.getUTCMinutes().toString().padStart(2, '0');
    } else {
        month = (date.getMonth() + 1).toString().padStart(2, '0');
        day = date.getDate().toString().padStart(2, '0');
        hours = date.getHours().toString().padStart(2, '0');
        minutes = date.getMinutes().toString().padStart(2, '0');
    }
    return `${day}/${month} ${hours}:${minutes}`;
}

function readTextFile(file) {
    var csvFile = "";
    new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.addEventListener('loadend', () => {
            if (xhr.status === 200 || xhr.status == 0) {
                csvFile = xhr.responseText;
                resolve(true);
            }else {
                alert('Import Impossible\n' + 'Fichier ' +file + ' introuvable!');
                console.log("Fichier " +file + " introuvable!");
                resolve(false);
            }
            
        });
        xhr.open("GET", file, false);
        xhr.send();
    });

    return csvFile;
}

function callCopyValue() {
    var CopyText = document.getElementById("pos_v");
    CopyText.select();
    navigator.clipboard.writeText(CopyText.value);
  }
  
function cpy2Clipbord(text) {
    var el = document.createElement('textarea');
    el.value = text;
    el.style = {position: 'absolute', left: '-9999px'};
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);

}

function sailId2Color(sailId) {
    sailId = sailId % 10;
    switch (sailId) {
        case 1://"Ji":
            return "#FF6666";
            break;
        case 4://"LJ":
            return "#FFF266";
            break;
        case 3://"St":
            return "#66FF66";
            break;
        case 5://"C0":
            return "#66CCFF";
            break;
        case 6://"HG":
            return "#FF66FF";
            break;
        case 7://"LG":
            return "#FFC44D";
            break;
        case 2://"Sp":
            return "#6666FF";
            break;
        default:
            return "#FFFFFF";
    }
}



var createRingBuffer = function(length){

    var pointer = 0, buffer = []; 
  
    return {
      get  : function(key){return buffer[key];},
      push : function(item){
        buffer[pointer] = item;
        pointer = (length + pointer +1) % length;
      }
    };
  };

  function openTab(url, baseUrl,reuseTab)
  {
      var isTabActive = false;
      var tabId = 0;
      chrome.tabs.query({}, function(tabs) { 
          for(var i=0;i<tabs.length;i++) {
              if(tabs[i].url.toLowerCase().includes(baseUrl.toLowerCase()) == true) {
                  isTabActive = true;
                  tabId = tabs[i].id;
                  break;
              }
          }
  
          if(isTabActive == false || !reuseTab) {
              chrome.tabs.create({ url:url },async function(tab){chrome.tabs.move(tab.id, {index: tab.index+1});});
          } else{
              chrome.tabs.update(tabId, {url:url,selected:true});
          }
      });
  }

function isOdd(number) {
    return number % 2 !== 0;
}
  
function isBitSet(num, mask){
    let a = num&mask;
    if(a===0)
        return false;
    else
        return true;
}
export { angle,
         courseAngle,
         formatDDMMYY,
         formatDHMS,
         formatHHMMSSSS,
         formatHM,
         formatPosition,formatPosition2l,
         gcAngle,
         gcDistance,
         pad0,
         roundTo,
         sign,
         toDeg,
         toDMS,convertDMS2Dec,
         toRad,
         genth,gentd,formatDateTable,
         sortFriends,sortField,currentSortOrder,set_sortField,set_currentSortOrder,formatTimeNotif,
         formatShortDate,readTextFile,callCopyValue,sailId2Color,
         genthRacelog,gentdRacelog,createRingBuffer,PositionOpenPopup,openTab,
         formatTimestampToISO,formatTimestampToReadableDate,
         isOdd,guessOptionBits,isBitSet
       };

