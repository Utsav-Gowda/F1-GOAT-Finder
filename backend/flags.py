"""Mappings from Ergast nationality/country strings to flag emojis."""

# Driver nationality (adjective form from drivers.csv `nationality` field)
NATIONALITY_TO_FLAG = {
    "American": "🇺🇸",
    "American-Italian": "🇺🇸",
    "Argentine": "🇦🇷",
    "Argentine-Italian": "🇦🇷",
    "Australian": "🇦🇺",
    "Austrian": "🇦🇹",
    "Belgian": "🇧🇪",
    "Brazilian": "🇧🇷",
    "British": "🇬🇧",
    "Canadian": "🇨🇦",
    "Chilean": "🇨🇱",
    "Chinese": "🇨🇳",
    "Colombian": "🇨🇴",
    "Czech": "🇨🇿",
    "Danish": "🇩🇰",
    "Dutch": "🇳🇱",
    "East German": "🇩🇪",
    "Finnish": "🇫🇮",
    "French": "🇫🇷",
    "German": "🇩🇪",
    "Hungarian": "🇭🇺",
    "Indian": "🇮🇳",
    "Indonesian": "🇮🇩",
    "Irish": "🇮🇪",
    "Italian": "🇮🇹",
    "Japanese": "🇯🇵",
    "Liechtensteiner": "🇱🇮",
    "Malaysian": "🇲🇾",
    "Mexican": "🇲🇽",
    "Monegasque": "🇲🇨",
    "New Zealander": "🇳🇿",
    "Polish": "🇵🇱",
    "Portuguese": "🇵🇹",
    "Rhodesian": "🇿🇼",  # modern Zimbabwe
    "Russian": "🇷🇺",
    "South African": "🇿🇦",
    "Spanish": "🇪🇸",
    "Swedish": "🇸🇪",
    "Swiss": "🇨🇭",
    "Thai": "🇹🇭",
    "Uruguayan": "🇺🇾",
    "Venezuelan": "🇻🇪",
}

# Circuit country (noun form from circuits.csv `country` field)
COUNTRY_TO_FLAG = {
    "Argentina": "🇦🇷",
    "Australia": "🇦🇺",
    "Austria": "🇦🇹",
    "Azerbaijan": "🇦🇿",
    "Bahrain": "🇧🇭",
    "Belgium": "🇧🇪",
    "Brazil": "🇧🇷",
    "Canada": "🇨🇦",
    "China": "🇨🇳",
    "France": "🇫🇷",
    "Germany": "🇩🇪",
    "Hungary": "🇭🇺",
    "India": "🇮🇳",
    "Italy": "🇮🇹",
    "Japan": "🇯🇵",
    "Korea": "🇰🇷",
    "Malaysia": "🇲🇾",
    "Mexico": "🇲🇽",
    "Monaco": "🇲🇨",
    "Morocco": "🇲🇦",
    "Netherlands": "🇳🇱",
    "Portugal": "🇵🇹",
    "Qatar": "🇶🇦",
    "Russia": "🇷🇺",
    "Saudi Arabia": "🇸🇦",
    "Singapore": "🇸🇬",
    "South Africa": "🇿🇦",
    "Spain": "🇪🇸",
    "Sweden": "🇸🇪",
    "Switzerland": "🇨🇭",
    "Turkey": "🇹🇷",
    "UAE": "🇦🇪",
    "UK": "🇬🇧",
    "USA": "🇺🇸",
    "United States": "🇺🇸",
    "Vietnam": "🇻🇳",
}


def flag_for_nationality(nationality: str) -> str:
    """Return flag emoji for a driver's nationality, or empty string."""
    return NATIONALITY_TO_FLAG.get(nationality, "")


def flag_for_country(country: str) -> str:
    """Return flag emoji for a circuit's country, or empty string."""
    return COUNTRY_TO_FLAG.get(country, "")
