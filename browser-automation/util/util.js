const daysMap = {
    '1': 'mon',
    '2': 'tue',
    '3': 'wed',
    '4': 'thu',
    '5': 'fri',
    '6': 'sat',
    '0': 'sun',
}
const abbrevMap = Object.fromEntries(Object.entries(daysMap).map(kv => [kv[1], kv[0]]))

function dayOfWeekToAbbrv(day) {
    if (daysMap.hasOwnProperty(day)) {
        return daysMap[day]
    } else {
        throw new Error(`Failed to map day ${day} to abbreviation.\nMap: ${Object.entries(daysMap)}`)
    }
}

function abbrevToDayOfWeek(abbrev) {
    if (abbrevMap.hasOwnProperty(abbrev)) {
        return daysMap[abbrev]
    } else {
        throw new Error(`Failed to map day ${abbrev} to abbreviation.\nMap: ${Object.entries(abbrevMap)}`)
    }
}

// handle when environment variable is '' or undefined
function getEnvVariableOrDefault(key, defaultVal){
    return !process.env[key] ? defaultVal : process.env[key];
}

module.exports = {
    dayOfWeekToAbbrv,
    abbrevToDayOfWeek,
    getEnvVariableOrDefault
}