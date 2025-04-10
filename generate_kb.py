import random

# --- Configuration ---
lodges = [
    {"name": "Marula Grove Lodge", "country": "South Africa", "region": "near Kruger", "focus": ["Big 5", "luxury", "photography"], "rooms": "luxury suites"},
    {"name": "Leadwood House", "country": "South Africa", "region": "Sabi Sand area", "focus": ["families", "exclusive use", "leopards"], "rooms": "private villa"},
    {"name": "Rhino Ridge Camp", "country": "South Africa", "region": "private reserve", "focus": ["rhino conservation", "walking safaris", "views"], "rooms": "tented suites"},
    {"name": "Khwai River Lodge", "country": "Botswana", "region": "Okavango Delta, Khwai concession", "focus": ["water activities", "predators", "elephants"], "rooms": "tented suites"},
    {"name": "Savuti Plains Camp", "country": "Botswana", "region": "Savuti channel area", "focus": ["lions", "migration (seasonal)", "remote feel"], "rooms": "spacious tents"},
    {"name": "Baobab Point", "country": "Botswana", "region": "Makgadikgadi Pans area", "focus": ["meerkats", "cultural experiences", "stargazing"], "rooms": "stylish chalets"},
    {"name": "Okavango Trails", "country": "Botswana", "region": "Okavango Delta heart", "focus": ["mokoro", "birding", "classic safari"], "rooms": "traditional tents"},
    {"name": "Coral Coast Lodge", "country": "Mozambique", "region": "coastal reserve", "focus": ["beach", "diving", "snorkeling", "relaxation"], "rooms": "beachfront bungalows"},
    {"name": "Bazaruto Blue Villa", "country": "Mozambique", "region": "Bazaruto Archipelago", "focus": ["island hopping", "luxury", "marine life", "exclusive"], "rooms": "private luxury villa"},
    {"name": "Mangrove Creek Camp", "country": "Mozambique", "region": "remote delta/coast", "focus": ["kayaking", "birding", "off-the-grid", "nature"], "rooms": "rustic eco-cabins"},
]

general_topics = [
    "policy_kids_family",
    "food_beverage_philosophy",
    "conservation_efforts",
    "what_to_pack_safari",
    "malaria_precautions",
    "connectivity_wifi",
    "best_time_south_africa",
    "best_time_botswana",
    "best_time_mozambique",
    "activities_overview_sa",
    "activities_overview_botswana",
    "activities_overview_mozambique",
]

knowledge_entries = []

# --- Generate Lodge-Specific Entries ---
for lodge in lodges:
    lodge_slug = lodge["name"].lower().replace(" ", "_")
    country_slug = lodge["country"].lower().replace(" ", "_")
    base_keywords = {lodge_slug, country_slug, lodge["country"].lower(), "lodge", "accommodation"}
    base_keywords.update(lodge["focus"])

    # 1. Lodge Overview
    topic_overview = f"lodge_{country_slug}_{lodge_slug}_overview"
    content_overview = (
        f"{lodge['name']} in {lodge['country']} ({lodge['region']}) offers a unique experience focused on {', '.join(lodge['focus'])}. "
        f"Accommodation consists of {lodge['rooms']}. Expect excellent wildlife viewing opportunities. [Add 1-2 more sentences about its unique selling points]."
    )
    keywords_overview = list(base_keywords | {"overview", "description"})
    knowledge_entries.append({"topic": topic_overview, "content": content_overview, "keywords": keywords_overview})

    # 2. Lodge Activities (Example - can be made more specific)
    topic_activities = f"lodge_{country_slug}_{lodge_slug}_activities"
    activities_list = ["game drives", "guided walks", "birdwatching"] # Basic list
    if "water activities" in lodge["focus"] or "mokoro" in lodge["focus"]: activities_list.append("mokoro trips")
    if "walking safaris" in lodge["focus"]: activities_list.append("extended walking safaris")
    if "beach" in lodge["focus"]: activities_list.extend(["snorkeling", "beach relaxation"])
    if "diving" in lodge["focus"]: activities_list.append("diving (may require certification)")

    content_activities = (
        f"Activities at {lodge['name']} typically include {', '.join(activities_list[:3])}. "
        f"Depending on the location and season, other options like {', '.join(activities_list[3:])} may be available. [Confirm specific activities available]."
    )
    keywords_activities = list(base_keywords | {"activities", "things to do"} | set(activities_list))
    knowledge_entries.append({"topic": topic_activities, "content": content_activities, "keywords": keywords_activities})

# --- Generate General Topic Entries ---
for topic in general_topics:
    keywords = {topic.split('_')[0], topic.split('_')[1]} # Basic keywords from topic name
    content = f"Placeholder content for {topic.replace('_', ' ').title()}. [Please add detailed information here regarding Nyoka's specific policy/approach/recommendations for {topic.split('_', 1)[1].replace('_', ' ')}]."

    if topic == "policy_kids_family":
        content = "Nyoka welcomes families! Generally, children over [e.g., 6 or 8] are welcome on standard game drives. Some lodges, like Leadwood House, are ideal for families. Minimum age requirements may vary by lodge and activity. We offer [mention any specific kids programs if applicable]. Please inquire for details specific to your family and chosen lodge."
        keywords.update(["kids", "children", "family", "policy", "age", "restrictions"])
    elif topic == "food_beverage_philosophy":
        content = "At Nyoka, we pride ourselves on [e.g., fresh, locally sourced ingredients, fine dining, authentic African cuisine, accommodating dietary needs]. Meals are often served [e.g., communally, privately, in scenic locations]. We offer a selection of quality South African wines and other beverages. [Add more detail on meal style]."
        keywords.update(["food", "dining", "meals", "cuisine", "drinks", "beverages", "dietary"])
    elif topic == "conservation_efforts":
        content = "Conservation is core to Nyoka's mission. We actively support [mention specific projects like rhino anti-poaching, community development, habitat restoration]. A portion of your stay contributes directly to these efforts. [Add details about partnerships or specific initiatives]."
        keywords.update(["conservation", "community", "sustainability", "rhino", "environment", "support"])
    elif topic == "what_to_pack_safari":
        content = "For your Nyoka safari, we recommend packing neutral-colored clothing (khaki, green, brown), layers for cool mornings/evenings, comfortable walking shoes, sun hat, sunscreen, insect repellent, binoculars, and a good camera. Avoid bright colors and camouflage. Luggage restrictions may apply on small aircraft. [Add link to detailed packing list if available]."
        keywords.update(["packing", "clothing", "what to wear", "safari gear", "luggage"])
    elif topic == "malaria_precautions":
        content = "Some Nyoka locations are in malaria areas. We strongly recommend consulting your doctor or a travel clinic well in advance of your trip to discuss appropriate malaria prophylaxis and preventative measures like insect repellent and covering up at dawn/dusk. While lodges take precautions, personal protection is key."
        keywords.update(["malaria", "health", "safety", "precautions", "doctor", "prophylaxis", "mosquito"])
    elif topic == "connectivity_wifi":
        content = "Wi-Fi connectivity is available at most Nyoka lodges, typically in main areas [or specify if in rooms]. Please note that due to our remote locations, bandwidth may be limited and suitable for basic email/messaging rather than heavy streaming. Embrace the opportunity to disconnect!"
        keywords.update(["wifi", "internet", "connectivity", "connection", "phone signal"])
    elif "best_time" in topic:
        country = topic.split('_')[-1].replace('_', ' ').title()
        content = f"The best time to visit {country} depends on your interests. Generally, the dry season ([Months, e.g., May-Oct for SA/Bots]) offers peak game viewing as animals gather near water. The green season ([Months, e.g., Nov-Apr]) brings lush scenery, baby animals, and excellent birding, but rain is possible. For Mozambique beaches ([Months, e.g., Apr-Nov]) offer sunny days. [Add more specific nuances]."
        keywords.update(["best time", "when to go", "season", "weather", country.lower()])
    elif "activities_overview" in topic:
         country = topic.split('_')[-1].replace('sa','South Africa').title() # Adjust for abbreviation
         content = f"Key activities in Nyoka's {country} lodges include world-class game drives searching for the Big 5 [Adjust based on country: e.g., water activities in Bots, beach in Moz]. We also offer guided bush walks, birdwatching, and unique cultural experiences depending on the specific lodge. [Add 1-2 highlight activities per country]."
         keywords.update(["activities", "things to do", country.lower(), "game drive", "safari"])


    knowledge_entries.append({
        "topic": topic,
        "content": content,
        "keywords": list(keywords | {topic.split('_')[-1]}) # Add last part of topic as keyword
        })


# --- Output ---
# Option 1: Print dictionaries (for manual copy-paste into Supabase UI)
import pprint
print("--- Knowledge Base Entries (Copy values into Supabase 'Insert Row') ---")
pprint.pprint(knowledge_entries)

# Option 2: Generate SQL INSERT statements (more advanced)
# print("\n--- SQL INSERT Statements ---")
# print("INSERT INTO knowledge_base (topic, content, keywords) VALUES")
# sql_values = []
# for entry in knowledge_entries:
#     # Basic escaping for SQL strings (replace single quote with two single quotes)
#     topic_sql = entry['topic'].replace("'", "''")
#     content_sql = entry['content'].replace("'", "''")
#     # Format keywords array for PostgreSQL: ARRAY['keyword1', 'keyword2']
#     keywords_sql = "ARRAY['" + "', '".join(kw.replace("'", "''") for kw in entry['keywords']) + "']"
#     sql_values.append(f"('{topic_sql}', '{content_sql}', {keywords_sql})")
# print(',\n'.join(sql_values) + ';')