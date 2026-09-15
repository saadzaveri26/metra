"""
Seed datasets for METRA Vector Database:
1. `rules_corpus`: Statutory provisions of the Legal Metrology Act, 2009 and 
   the Legal Metrology (Packaged Commodities) Rules, 2011 (PCR 2011).
2. `seller_registry`: 100% fictional manufacturer & packer entities for 
   fuzzy entity resolution and repeat-offender risk scoring.
   (IMPORTANT: Strictly uses fictional business entities to protect privacy and integrity).
"""
from typing import List, Dict, Any

# --- 1. Rules Corpus (Statutory Legal Metrology Knowledge Base) ---

RULES_CORPUS_DATA: List[Dict[str, Any]] = [
    {
        "id": "RULE_6_1_A_MFG_DETAILS",
        "text": (
            "Rule 6(1)(a), Packaged Commodities Rules 2011: The name and complete address of the "
            "manufacturer, or where the manufacturer is not the packer, the name and complete address "
            "of the manufacturer and packer, or for imported commodities, the name and complete address "
            "of the importer must be declared on every packaged commodity. In case of domestic commodities, "
            "the declaration shall contain the street address, city, state, and pin code."
        ),
        "metadata": {
            "rule_number": "6(1)(a)",
            "act_section": "Section 36(1), Legal Metrology Act, 2009",
            "statutory_reference": "PCR 2011 Rule 6(1)(a)",
            "field_name": "manufacturer",
            "category": "mandatory_declaration",
            "penalty": "Fine up to ₹25,000 for first offence, up to ₹50,000 for second offence, and up to ₹1,00,000 or 1 year imprisonment for subsequent offences.",
        },
    },
    {
        "id": "RULE_6_1_AA_ORIGIN",
        "text": (
            "Rule 6(1)(aa), Packaged Commodities Rules 2011: The name of the country of origin or "
            "manufacture or assembly in case of imported products shall be mentioned on the package. "
            "For e-commerce marketplaces and imported retail goods, omission of the country of origin "
            "constitutes a direct violation of Section 36(1) of the Legal Metrology Act, 2009."
        ),
        "metadata": {
            "rule_number": "6(1)(aa)",
            "act_section": "Section 36(1), Legal Metrology Act, 2009",
            "statutory_reference": "PCR 2011 Rule 6(1)(aa)",
            "field_name": "country_of_origin",
            "category": "imported_goods",
            "penalty": "Fine up to ₹25,000 for first offence, up to ₹50,000 for second offence under Section 36(1).",
        },
    },
    {
        "id": "RULE_6_1_B_GENERIC_NAME",
        "text": (
            "Rule 6(1)(b), Packaged Commodities Rules 2011: The common or generic name of the commodity "
            "contained in the package and, in case of packages with more than one product, the name and "
            "number or quantity of each product shall be mentioned on the principal display panel."
        ),
        "metadata": {
            "rule_number": "6(1)(b)",
            "act_section": "Section 36(1), Legal Metrology Act, 2009",
            "statutory_reference": "PCR 2011 Rule 6(1)(b)",
            "field_name": "generic_name",
            "category": "mandatory_declaration",
            "penalty": "Fine up to ₹25,000 for first offence under Section 36(1).",
        },
    },
    {
        "id": "RULE_6_1_C_NET_QTY",
        "text": (
            "Rule 6(1)(c) & Rule 12, Packaged Commodities Rules 2011: The net quantity, in terms of standard "
            "units of weight or measure, of the commodity contained in the package shall be declared. "
            "Units must be metric (g, kg, ml, l, m). The net quantity declaration must not include the weight "
            "of wrappers or packaging material. Short delivery beyond Maximum Permissible Error (MPE) triggers "
            "prosecution under Section 36(2)."
        ),
        "metadata": {
            "rule_number": "6(1)(c) / Rule 12",
            "act_section": "Section 36(1) and Section 36(2), Legal Metrology Act, 2009",
            "statutory_reference": "PCR 2011 Rule 6(1)(c) & Rule 12",
            "field_name": "net_quantity",
            "category": "weights_and_measures",
            "penalty": "Fine up to ₹25,000 for first offence under Section 36(1); Short quantity fine up to ₹50,000 or imprisonment under Section 36(2).",
        },
    },
    {
        "id": "RULE_6_1_D_MFG_DATE",
        "text": (
            "Rule 6(1)(d), Packaged Commodities Rules 2011: The month and year in which the commodity is "
            "manufactured or pre-packed or imported shall be declared. Format may be MM/YYYY or Month Year. "
            "For perishable goods or cosmetics, the best-before or expiry date is additionally mandatory."
        ),
        "metadata": {
            "rule_number": "6(1)(d)",
            "act_section": "Section 36(1), Legal Metrology Act, 2009",
            "statutory_reference": "PCR 2011 Rule 6(1)(d)",
            "field_name": "manufacture_date",
            "category": "mandatory_declaration",
            "penalty": "Fine up to ₹25,000 for first offence under Section 36(1).",
        },
    },
    {
        "id": "RULE_6_1_E_MRP",
        "text": (
            "Rule 6(1)(e) & Rule 18, Packaged Commodities Rules 2011: Maximum Retail Price (MRP) inclusive of all taxes. "
            "Every pre-packaged commodity must clearly declare retail sale price in Indian Rupees as MRP inclusive of all taxes "
            "or incl. of all taxes. Dual MRP or altering or charging above printed price is prohibited under Section 36(1)."
        ),
        "metadata": {
            "rule_number": "6(1)(e) / Rule 18",
            "act_section": "Section 36(1) and Section 18, Legal Metrology Act, 2009",
            "statutory_reference": "PCR 2011 Rule 6(1)(e) & Rule 18",
            "field_name": "mrp",
            "category": "pricing",
            "penalty": "Fine up to ₹25,000 for first offence, up to ₹50,000 for second offence.",
        },
    },
    {
        "id": "RULE_6_11_UNIT_SALE_PRICE",
        "text": (
            "Rule 6(11), Packaged Commodities Rules 2011: The unit sale price (USP) shall be declared on every "
            "pre-packaged commodity. For commodities weighing or measuring more than 1 kg or 1 litre, USP must be "
            "expressed in rupees per kg or per litre. For packages less than 1 kg or 1 litre, USP must be in rupees "
            "per gram or per millilitre, rounded to the nearest two decimal places."
        ),
        "metadata": {
            "rule_number": "6(11)",
            "act_section": "Section 36(1), Legal Metrology Act, 2009",
            "statutory_reference": "PCR 2011 Rule 6(11)",
            "field_name": "unit_sale_price",
            "category": "pricing",
            "penalty": "Fine up to ₹25,000 for first offence under Section 36(1).",
        },
    },
    {
        "id": "RULE_6_1_F_CONSUMER_CARE",
        "text": (
            "Rule 6(1)(f), Packaged Commodities Rules 2011: The name, address, telephone number and email address "
            "of the person who can be contacted by the consumer in case of a complaint or query must be clearly declared "
            "on the package under the heading 'Customer Care' or 'Consumer Care Executive'."
        ),
        "metadata": {
            "rule_number": "6(1)(f)",
            "act_section": "Section 36(1), Legal Metrology Act, 2009",
            "statutory_reference": "PCR 2011 Rule 6(1)(f)",
            "field_name": "consumer_care",
            "category": "consumer_protection",
            "penalty": "Fine up to ₹25,000 for first offence under Section 36(1).",
        },
    },
    {
        "id": "RULE_7_TABLE_1_FONT_SIZE",
        "text": (
            "Rule 7 & Table I, Packaged Commodities Rules 2011: Minimum height of numerals and letters for mandatory "
            "declarations on the principal display panel. Net quantity up to 200g/200ml requires min 2.0mm font height "
            "(blown/moulded 4.0mm); 200g-1kg/1L requires min 4.0mm (blown/moulded 6.0mm); above 1kg/1L requires min 6.0mm. "
            "Small or unreadable text obscuring declarations violates Rule 7."
        ),
        "metadata": {
            "rule_number": "Rule 7 / Table I",
            "act_section": "Section 36(1), Legal Metrology Act, 2009",
            "statutory_reference": "PCR 2011 Rule 7 & Table I",
            "field_name": "font_analysis",
            "category": "font_size_and_legibility",
            "penalty": "Fine up to ₹25,000 for first offence under Section 36(1).",
        },
    },
    {
        "id": "RULE_8_PRINCIPAL_DISPLAY_PANEL",
        "text": (
            "Rule 8, Packaged Commodities Rules 2011: The principal display panel (PDP) of a package shall contain all "
            "mandatory declarations clearly grouped together. For rectangular packages, PDP is 40% of height x width; "
            "for cylindrical packages, 40% of height x circumference. Grouping mandatory declarations on different panels "
            "without clear linkage constitutes non-compliance."
        ),
        "metadata": {
            "rule_number": "Rule 8",
            "act_section": "Section 36(1), Legal Metrology Act, 2009",
            "statutory_reference": "PCR 2011 Rule 8",
            "field_name": "pdp_layout",
            "category": "label_geometry",
            "penalty": "Fine up to ₹25,000 for first offence under Section 36(1).",
        },
    },
    {
        "id": "ACT_SECTION_36_1_PENALTY",
        "text": (
            "Section 36(1), Legal Metrology Act, 2009: Penalty for manufacture, pack, import, sale, or distribution "
            "of non-standard packaged commodities. Whoever manufactures, packs, imports, sells, distributes, or offers "
            "any pre-packaged commodity which does not conform to the declarations on the package prescribed by the "
            "rules shall be punished with fine which may extend to twenty-five thousand rupees, for the second offence "
            "to fifty thousand rupees, and for subsequent offences to one lakh rupees or with imprisonment up to one year."
        ),
        "metadata": {
            "rule_number": "Section 36(1)",
            "act_section": "Section 36(1), Legal Metrology Act, 2009",
            "statutory_reference": "Act Section 36(1)",
            "field_name": "statutory_penalty",
            "category": "prosecution_clause",
            "penalty": "First offence: ₹25,000; Second offence: ₹50,000; Subsequent: ₹1,00,000 or 1 year imprisonment.",
        },
    },
    {
        "id": "ACT_SECTION_36_2_SHORT_DELIVERY",
        "text": (
            "Section 36(2), Legal Metrology Act, 2009: Penalty for selling, distributing, or delivering any pre-packaged "
            "commodity with lesser quantity or measure than that declared on the package. Punishable with fine not less than "
            "ten thousand rupees which may extend to fifty thousand rupees, or with imprisonment for a term which may extend "
            "to one year, or with both."
        ),
        "metadata": {
            "rule_number": "Section 36(2)",
            "act_section": "Section 36(2), Legal Metrology Act, 2009",
            "statutory_reference": "Act Section 36(2)",
            "field_name": "short_quantity",
            "category": "weights_and_measures",
            "penalty": "Fine of ₹10,000 to ₹50,000, or imprisonment up to 1 year, or both.",
        },
    },
    {
        "id": "ACT_SECTION_49_COMPANIES",
        "text": (
            "Section 49, Legal Metrology Act, 2009: Offences by companies. Where an offence under this Act has been committed "
            "by a company, the person nominated by the company under sub-section (2) as in charge of business, as well as the "
            "company itself, shall be deemed to be guilty of the offence and liable to be proceeded against and punished."
        ),
        "metadata": {
            "rule_number": "Section 49",
            "act_section": "Section 49, Legal Metrology Act, 2009",
            "statutory_reference": "Act Section 49",
            "field_name": "company_liability",
            "category": "corporate_liability",
            "penalty": "Nominated Director / Officer in charge personally liable along with corporate fine.",
        },
    },
];

# --- 2. Seller Registry (100% Fictional Entities for Entity Resolution) ---

SELLER_REGISTRY_DATA: List[Dict[str, Any]] = [
    {
        "id": "SELLER-FIC-001",
        "canonical_name": "Suvidha FMCG Pvt. Ltd.",
        "text": (
            "Suvidha FMCG Pvt. Ltd. Also known as Suvidha F.M.C.G. Private Limited, Suvidha Consumer Goods, "
            "Suvidha Foods Gurugram. Manufacturer and packer in Plot 45, Udyog Vihar Phase 2, Gurugram, Haryana. "
            "GSTIN: 06AABCS1234F1Z5."
        ),
        "metadata": {
            "business_id": "SELLER-FIC-001",
            "canonical_name": "Suvidha FMCG Pvt. Ltd.",
            "aliases": ["Suvidha F.M.C.G. Private Limited", "Suvidha Consumer Goods", "Suvidha Foods Gurugram"],
            "gstin": "06AABCS1234F1Z5",
            "state_region": "HR",
            "category": "Packaged Snacks",
            "historical_violations_count": 3,
            "risk_tier": "HIGH",
            "last_violation_date": "2026-08-10",
        },
    },
    {
        "id": "SELLER-FIC-002",
        "canonical_name": "Bharat Packaged Commodities Ltd.",
        "text": (
            "Bharat Packaged Commodities Ltd. Also known as Bharat Packaged Goods Private Limited, Bharat Commodities Peenya, "
            "Bharat Agro Pack. Packaging unit in Peenya Industrial Area, Bengaluru, Karnataka. GSTIN: 29AABCB5678G1Z2."
        ),
        "metadata": {
            "business_id": "SELLER-FIC-002",
            "canonical_name": "Bharat Packaged Commodities Ltd.",
            "aliases": ["Bharat Packaged Goods Private Limited", "Bharat Commodities Peenya", "Bharat Agro Pack"],
            "gstin": "29AABCB5678G1Z2",
            "state_region": "KA",
            "category": "Edible Oils & Flours",
            "historical_violations_count": 0,
            "risk_tier": "LOW",
            "last_violation_date": "",
        },
    },
    {
        "id": "SELLER-FIC-003",
        "canonical_name": "Himalayan Nectar Foods Ltd.",
        "text": (
            "Himalayan Nectar Foods Ltd. Also known as Himalayan Nectar Food Products, Himalayan Pure Honey, "
            "Himalayan Pure Honey Solan, Himalayan Nectar Solan. Natural honey packing plant in Baddi, Solan, "
            "Himachal Pradesh. GSTIN: 02AABCH9012H1Z9."
        ),
        "metadata": {
            "business_id": "SELLER-FIC-003",
            "canonical_name": "Himalayan Nectar Foods Ltd.",
            "aliases": ["Himalayan Nectar Food Products", "Himalayan Pure Honey", "Himalayan Pure Honey Solan", "Himalayan Nectar Solan"],
            "gstin": "02AABCH9012H1Z9",
            "state_region": "HP",
            "category": "Honey & Food Supplements",
            "historical_violations_count": 2,
            "risk_tier": "MEDIUM",
            "last_violation_date": "2026-07-22",
        },
    },
    {
        "id": "SELLER-FIC-004",
        "canonical_name": "Kaveri Agro Industries Pvt. Ltd.",
        "text": (
            "Kaveri Agro Industries Pvt. Ltd. Also known as Kaveri Agro Products, Kaveri Spices Tamil Nadu, "
            "Kaveri Agro Hosur. Spices processor in SIPCOT Industrial Complex, Hosur, Tamil Nadu. GSTIN: 33AABCK3456J1Z1."
        ),
        "metadata": {
            "business_id": "SELLER-FIC-004",
            "canonical_name": "Kaveri Agro Industries Pvt. Ltd.",
            "aliases": ["Kaveri Agro Products", "Kaveri Spices Tamil Nadu", "Kaveri Agro Hosur"],
            "gstin": "33AABCK3456J1Z1",
            "state_region": "TN",
            "category": "Spices & Condiments",
            "historical_violations_count": 1,
            "risk_tier": "LOW",
            "last_violation_date": "2026-06-15",
        },
    },
    {
        "id": "SELLER-FIC-005",
        "canonical_name": "Vanguard Consumer Formulations Ltd.",
        "text": (
            "Vanguard Consumer Formulations Ltd. Also known as Vanguard Formulations Pvt. Ltd., Vanguard FMCG Gujarat, "
            "Vanguard Chemical Products. Manufacturing unit in GIDC Naroda, Ahmedabad, Gujarat. GSTIN: 24AABCV7890K1Z3."
        ),
        "metadata": {
            "business_id": "SELLER-FIC-005",
            "canonical_name": "Vanguard Consumer Formulations Ltd.",
            "aliases": ["Vanguard Formulations Pvt. Ltd.", "Vanguard FMCG Gujarat", "Vanguard Chemical Products"],
            "gstin": "24AABCV7890K1Z3",
            "state_region": "GJ",
            "category": "Household & Cleaning Products",
            "historical_violations_count": 5,
            "risk_tier": "HIGH",
            "last_violation_date": "2026-09-02",
        },
    },
]
