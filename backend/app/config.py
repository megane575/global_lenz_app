# -------------------------------------------------------
# メディア設定
# -------------------------------------------------------
SOURCES = {
    "BBC": {
        "name": "BBC News",
        "country": "イギリス",
        "top_rss": "https://feeds.bbci.co.uk/news/world/rss.xml",
        "search_rss": None,  # 公式RSSで記事検索も行う
        "lang": "en",
    },
    "Al Jazeera": {
        "name": "Al Jazeera English",
        "country": "カタール",
        "top_rss": "https://www.aljazeera.com/xml/rss/all.xml",  # 公式RSS
        "search_rss": None,  # 記事検索はGoogleニュース経由（ソースフィルター）
        "lang": "en",
    },
    "CNN": {
        "name": "CNN",
        "country": "アメリカ",
        "top_rss": "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
        "search_rss": None,
        "lang": "en",
    },
    "NHK": {
        "name": "NHK NEWS WEB",
        "country": "日本",
        "top_rss": "https://www.nhk.or.jp/rss/news/cat6.xml",  # 国際ニュース
        "search_rss": None,
        "lang": "ja",
    },
    "DD News": {
        "name": "DD News",
        "country": "インド",
        "top_rss": "https://news.google.com/rss?hl=en-IN&gl=IN&ceid=IN:en",
        "search_rss": None,
        "lang": "en",
    },
}

# GoogleニュースのRSSソースフィルター設定
GOOGLE_SOURCE_FILTERS = {
    "BBC":        "source:BBC_News",
    "Al Jazeera": "source:Al_Jazeera_English",
    "CNN":        "source:CNN",
    "DD News":    "site:ddnews.gov.in",
}

# 各メディアのドメイン（出典一致チェック用）
MEDIA_DOMAINS = {
    "BBC":        ["bbc.com", "bbc.co.uk"],
    "Al Jazeera": ["aljazeera.com", "aljazeera.net"],
    "CNN":        ["cnn.com"],
    "DD News":    ["ddnews.gov.in"],
}