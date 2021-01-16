ics = require('ics');
const {writeFileSync } = require('fs');

// This script populates an ICS file with events throughout the year 
// on the Episcopal Liturgical Calendar.

// The script populates all of the Sundays and special days for a calendar
// year (Jan 1 through Dec 31), not for a church year (1st Advent - Christ
// the King). Type the year you want to populate here (below):
const year = 2021;

var events = new Array();

function createEvent(year, month, day, title){
    var endDay = day;
    var endMonth = month;
    var endYear = year;
    if( day == daysInMonth(month, year) ){
        endDay = 1;
	if (month == 12){
	    endMonth = 1;
	    endYear = year+1;
        } else {
	    endMonth = month+1;
        }
    } else {
        endDay = day+1;
    }
    var event = {
        start: [year, month, day],
	end: [endYear, endMonth, endDay],
        title: title
    }
    return(event);
}

function convertOrdinal(num){
  var ordinal;
  if( num > 10 && num < 14){
    ordinal = num + 'th';
  }
  else{
    var lastDigit = num % 10;
    switch(lastDigit){
      case 1:
        ordinal = num + 'st';
        break;
      case 2:
        ordinal = num + 'nd';
        break;
      case 3:
        ordinal = num + 'rd';
        break;
      default:
        ordinal = num + 'th';
    }
  }
  return ordinal;
}

function leap(year){
    var by4 = !(year % 4);           // divisible by 4?
    var by100 = !(year % 100);       // divisible by 100?
    var by400 = !(year % 400);       // divisible by 400?
    return ( (by4 && !by100) || by400 );
}

function daysInMonth(month, year){
    month = month-1;
    var days = new Array ( 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 );
    if (leap(year)) days[1] = 29;
    return days[month];
}

function dayOfYear(month, date, year){
   var x;
   doy = 0;
   for (x = 1 ; x < month; x++){
       doy += parseInt(daysInMonth(x, year));
   }
   doy = doy + date;
   return doy;
}

function cartersQ(year){
   var b, d, e, q;
   b = 225 - 11 * (year % 19);
   d = ((b - 21) % 30) + 21;
   if (d > 48) d-=1;
   e = (year + parseInt(year/4) + d + 1) % 7;
   q = d + 7 - e;
   return q;
}

function calcEaster(year){
  var q = cartersQ(year);
  var month, date;
  if (q < 32){
    month = 3;        // Easter is in March
    date = q;
  }else{
    month = 4;        // Easter is in April
    date = parseInt(q - 31);
  }
  return dayOfYear(month, date, year);
}

function extractMonth(dayOfYear, year){
   var total = dayOfYear;
   var month = 1;  
   while(total > daysInMonth(month, year)){
     total -= daysInMonth(month, year);
     month++;       
   }
   return month;
}

function extractDate(dayOfYear, year){
   var day = dayOfYear;
   var x;
   month = extractMonth(dayOfYear, year);
   for(x = 1; x < month; x++){
     day -= daysInMonth(x, year);
   }
   return day;
}

function numToMonth(month){
  var list = new Array
    ("Jan", "Feb", "Mar", "Apr", "May", "Jun",
     "Jul", "Aug", "Sep", "Oct", "Nov", "Dec");
  return (list[month]);
}

var easter = calcEaster(year);
var annunciationDoy = dayOfYear(2, 25, year);
var annunciationDate = new Date(numToMonth(extractMonth(annunciationDoy, year)) + ' ' + extractDate(annunciationDoy, year) + ' ' + year);
var x, easterCount, fixedCount;
var month, day, name, offset;

var easterCentricHolidays = new Array
  ("Ash Wednesday", -46, 
   "1st Sunday of Lent", -42,
   "Ember Day", -39,
   "Ember Day", -37,
   "Ember Day", -36,
   "2nd Sunday of Lent", -35,
   "3rd Sunday of Lent", -28,
   "4th Sunday of Lent", -21,
   "5th Sunday of Lent", -14,
   "Palm Sunday", -7, 
   "Maundy Thursday", -3,
   "Good Friday", -2, 
   "Holy Saturday", -1, 
   "Easter", 0, 
   "2nd Sunday of Easter", 7, 
   "3rd Sunday of Easter", 14, 
   "4th Sunday of Easter", 21, 
   "5th Sunday of Easter", 28, 
   "6th Sunday of Easter", 35,
   "Rogation Day", 36,
   "Rogation Day", 37,
   "Rogation Day", 38,
   "Ascension", 39, 
   "7th Sunday of Easter", 42, 
   "Pentecost Sunday (Whitsunday)", 49,
   "Ember Day", 52,
   "Ember Day", 54,
   "Ember Day", 55,
   "Trinity Sunday", 56 
  );

var fixedHolidays = new Array
  ("Christmas", 12, 25, 
   "The Holy Name", 1, 1, 
   "Epiphany", 1, 6, 
   "Presentation of Jesus at the Temple (Candlemas)", 2, 2, 
   "Holy Cross Day", 9, 14,
   "Saint Michael and All Angels (Michaelmas)", 9, 29,
   "All Saints", 11, 1
  );

if((annunciationDoy < easter - 7) && (annunciationDate.getDay() == 0)){
  annunciationDoy += 1;
  fixedHolidays.push("The Annunciation", 3, 26);
}
else if((annunciationDoy >= easter - 7) && (annunciationDoy <= easter + 7)){
  easterCentricHolidays.push("The Annunciation", 8);
}else{
  fixedHolidays.push("The Annunciation", 3, 25);
}

function calcEmberDays(){
  var holyCross = new Date('September 14, ' + year);
  var holyCrossDow = holyCross.getDay();
  var dec13 = new Date('December 13, ' + year);
  var dec13Dow = dec13.getDay();
  var emberDays = new Array();
  if(holyCrossDow < 2){
    var sun = dayOfYear(9, 14, year) - holyCrossDow;
    var ember1 = sun + 3;
    var ember2 = sun + 5;
    var ember3 = sun + 6;
    var e1Da = extractDate(ember1, year);
    var e2Da = extractDate(ember2, year);
    var e3Da = extractDate(ember3, year);
    emberDays.push("Ember Day", 9, e1Da,
    "Ember Day", 9, e2Da,
    "Ember Day", 9, e3Da);
  }else{
    var sun = dayOfYear(9, 14, year) + (7 - holyCrossDow);
    var ember1 = sun + 3;
    var ember2 = sun + 5;
    var ember3 = sun + 6;
    var e1Da = extractDate(ember1, year);
    var e2Da = extractDate(ember2, year);
    var e3Da = extractDate(ember3, year);
    emberDays.push("Ember Day", 9, e1Da,
    "Ember Day", 9, e2Da,
    "Ember Day", 9, e3Da);
  }
  if(dec13Dow < 2){
    var sun = dayOfYear(12, 13, year) - dec13Dow;
    var ember1 = sun + 3;
    var ember2 = sun + 5;
    var ember3 = sun + 6;
    var e1Da = extractDate(ember1, year);
    var e2Da = extractDate(ember2, year);
    var e3Da = extractDate(ember3, year);
    emberDays.push("Ember Day", 12, e1Da,
    "Ember Day", 12, e2Da,
    "Ember Day", 12, e3Da);
  }else{
    var sun = dayOfYear(12, 13, year) + (7 - dec13Dow);
    var ember1 = sun + 3;
    var ember2 = sun + 5;
    var ember3 = sun + 6;
    var e1Da = extractDate(ember1, year);
    var e2Da = extractDate(ember2, year);
    var e3Da = extractDate(ember3, year);
    emberDays.push("Ember Day", 12, e1Da,
    "Ember Day", 12, e2Da,
    "Ember Day", 12, e3Da);
  } 
  return emberDays;
}

var emberDays = calcEmberDays();
fixedHolidays = fixedHolidays.concat(emberDays);
var nativity = new Date('Dec 25 ' + year);
var nativityDow = nativity.getDay();

if(nativityDow == 0){
  fourthAdvent = 18;
}else{
  fourthAdvent = 25 - nativityDow;
}

var advent = dayOfYear(12, fourthAdvent, year)
var epiphany = new Date('Jan 6 ' + year);
var epiphanyDow = epiphany.getDay();

if(epiphanyDow == 0){
  epiphanySunday = 13;
}else{
  epiphanySunday = 6 + (7 - epiphanyDow);
}

firstEpiphany = dayOfYear(1, epiphanySunday, year);
lastEpiphany = easter - 49;
function populateCalendar(){
  easterCount = easterCentricHolidays.length;
  for(x = 0; x < easterCount; x+=2){
    var title = easterCentricHolidays[x];   
    var offset = easterCentricHolidays[x+1];
    var month = extractMonth(easter+offset, year);
    var day = extractDate(easter+offset, year);
    events.push(createEvent(year, month, day, title));
  }
  
  fixedCount = fixedHolidays.length;
  
  for(x = 0; x < fixedCount; x+=3){
    var title = fixedHolidays[x];
    var month = fixedHolidays[x+1];
    var day = fixedHolidays[x+2];
    events.push(createEvent(year, month, day, title));
  }
  
  for(n = 5; n > 0; n--){
    var title;
    if(n > 1){
      adventWeek = n-1;
      title = convertOrdinal(adventWeek) + ' Sunday of Advent';
    }else{
      title = "Christ the King";
    }
    var month = extractMonth(advent, year);
    var day = extractDate(advent, year);
    events.push(createEvent(year, month, day, title));
    advent -= 7;
  }
  
  var properOffset = 63;
  var properNum;
  var sundayAfterPentecost = 2;
  
  if(81 <= easter && easter <= 85){
    properNum = 3;
  }
  else if(86 <= easter && easter <= 92){
    properNum = 4;
  }
  else if(93 <= easter && easter <= 99){
    properNum = 5;
  }
  else if(100 <= easter && easter <= 106){
     properNum = 6;
  }
  else if(107 <= easter && easter <= 113){
    properNum = 7;
  }else{
    properNum = 8;
  } 
  
  while(properOffset+easter-7 < advent){
    var title = convertOrdinal(sundayAfterPentecost) + ' Sunday after Pentecost (Proper ' + properNum + ')';
    var month = extractMonth(easter+properOffset, year);
    var day = extractDate(easter+properOffset, year);
    events.push(createEvent(year, month, day, title));
    properOffset += 7;
    properNum += 1;
    sundayAfterPentecost += 1;
  }
   
  epiphanyNum = 1;
  for(e = firstEpiphany; e <= lastEpiphany; e += 7){
    var title = convertOrdinal(epiphanyNum) + ' Sunday after the Epiphany';
    var month = extractMonth(e, year);
    var day = extractDate(e, year);
    events.push(createEvent(year, month, day, title));
    epiphanyNum ++;
  }
}

populateCalendar();

ics.createEvents(events, function(error, value){
    if (error) {
        console.error(error);
        return;
    }
    writeFileSync('./ELCal_'+year+'.ics', value);
});
