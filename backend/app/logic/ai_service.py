import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# 環境変数の読み込みとクライアント初期化
load_dotenv()
token = os.getenv("OPENAI_API_KEY")
client = OpenAI(api_key=token)

def discover_trending_topics(all_headlines):
    """全メディアの見出しから共通トピックを厳選して6つ抽出する"""
    prompt = f"""
あなたはニュース編集者です。以下の「見出しリスト」を分析し、トピックを【必ずちょうど6つ】選んでください。

見出しリスト:
{all_headlines}

### トピック選定ルール（優先順位順）
1. **実在確認（最重要）**: 見出しリストに実際に登場する固有名詞・事象のみを使うこと。
2. **国際的重要性**: 以下のテーマを優先する。
   - 戦争・紛争・停戦交渉
   - 外交・国際合意
   - 大規模自然災害・人道危機
   - 主要国の選挙・政権交代
   - 国際経済・貿易摩擦
   ※ 一国内の司法・建設等の国内ニュースは選ばない。
   ※ 「スキャンダル」は複数国に影響する国際的なものは可だが、一国内の政治スキャンダルは不可。
   ※ 州・地方レベルの選挙（例：カリフォルニア州知事選）は不可。国政選挙のみ対象。
3. **複数メディア優先**: 2カ国以上の見出しに登場するトピックを優先する。
4. **重複禁止（厳格に）**: 同じ紛争・地域の出来事を別の角度で表現しただけのトピックを複数選ばない。
   - NG例：「ロシア侵攻」と「ウクライナ停戦」→ 同じ紛争なので1つにまとめる
   - NG例：「米イラン交渉」と「イラン停戦」→ 同じ合意プロセスなので1つにまとめる
5. **多様性確保**: 6つのトピックが地域・テーマで偏らないよう選ぶ。

### トピック名・クエリの必須条件（最重要）
- トピック名は必ず「**具体的な事象語**（停戦・攻撃・合意・選挙・制裁など）」を含めること。
- 「トランプ政権」「ロシア」「中国」のように**主体だけのトピック名は禁止**。
  → NG: 「トランプ政権」  OK: 「トランプ関税政策」「トランプ移民規制」
  → NG: 「ロシア侵攻」   OK: 「ウクライナ停戦交渉」（停戦という事象で統合）
- query_en も同様に具体的な事象語を含めること。「Trump Administration」「Russia」のような広すぎるクエリは禁止。

### トピック名とquery_enの一致ルール（最重要）
- トピック名に含まれる国名・地名と、query_enの最初の単語は必ず一致させること
- 例：トピック名「ルーマニア選挙」→ query_en は「Romania Election」（Bulgariaは禁止）
- 例：トピック名「カナダ 貿易」→ query_en は「Canada Tariffs」（US Canadaは可、米韓は禁止）
- トピック名を決めてからquery_enを生成すること。逆順は禁止。

### 検索語の生成ルール

**query_en**（英語メディア向け・GoogleニュースRSS検索用）
- 「主語となる国・組織名」＋「**具体的な事象語**」の英語2語のみ。
- 事象語は「Ceasefire / Attack / Election / Tariffs / Sanctions / Invasion / Strike / Talks」等の具体語を使うこと。
- 「Agreement / Policy / Issue / Situation / Crisis」等の**曖昧な語は禁止**。特に合意系トピックは必ず「Ceasefire」「Talks」「Deal」等の具体語にすること。
- 正しい例：
  ✅ 「Iran Ceasefire」（イランとの停戦）← "US Iran Agreement"ではなくこちら
  ✅ 「Ukraine Ceasefire」（ウクライナ停戦）
  ✅ 「Hungary Election」（ハンガリー選挙）
  ✅ 「Israel Attack」（イスラエル攻撃）
  ✅ 「Trump Tariffs」（トランプ関税）
  ✅ 「Hormuz Blockade」（ホルムズ海峡封鎖）← "Trump Blockade"ではなくこちら。封鎖の主体がトランプでも地名を優先する
  ✅ 「China Taiwan Talks」または「Taiwan Pressure」（中台関係）← "China Taiwan"の2語だけは禁止。必ず事象語を加える
- 誤った例：
  ❌ 「US Iran Agreement」← "Agreement"は広すぎる。"Iran Ceasefire"にする
  ❌ 「Trump Administration」← 主体のみ。"Trump Tariffs"等にする
  ❌ 「Trump Blockade」← 地名を優先。"Hormuz Blockade"にする
  ❌ 「China Taiwan」← 主体のみ・事象語なし。"Taiwan Pressure"や"China Taiwan Talks"にする
  ❌ 「China Taiwan Policy」← "Policy"は曖昧。"Taiwan Pressure"等にする
  ❌ 「Russia Invasion」← 上位概念すぎる。"Ukraine Ceasefire"等の具体事象にする

**query_nhk**（NHK専用・日本語RSS全文検索用）
- NHKの記事タイトルに実際に出てくる**具体的な日本語キーワードを2語**。
- 必ず「固有名詞（国名・地名・人名）＋具体的な事象語」の組み合わせにすること。
- 正しい例：
  ✅ 「イラン 停戦」（米イラン停戦合意）← "米国 イラン"ではなくこちら
  ✅ 「ウクライナ 停戦」（ウクライナ停戦）
  ✅ 「ハンガリー 選挙」（ハンガリー選挙）
  ✅ 「ホルムズ 海峡」（ホルムズ海峡）← 複合語は分割
  ✅ 「トランプ 関税」（トランプ関税）
- 誤った例：
  ❌ 「米国 イラン」← 主体のみ。"イラン 停戦"にする
  ❌ 「中国 台湾」← 主体のみ・事象語なし。"台湾 会談"や"中国 圧力"等にする
  ❌ 「海峡通過」← 複合語。"ホルムズ 海峡"に分割する
  ❌ 「トランプ 封鎖」← 地名を優先。"ホルムズ 封鎖"にする

出力は必ず以下のJSON形式のみとしてください。topicsの要素数は必ず6。

{{
    "topics": [
        {{
            "name": "トピック名(日本語・具体的な事象語を含む)",
            "query_en": "English 2words（具体的な事象語必須）",
            "query_nhk": "日本語キーワード1 日本語キーワード2"
        }}
    ]
}}
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )
    
    res_text = response.choices[0].message.content.strip()
    # Markdownの装飾（```json ... ```）を削る
    if res_text.startswith("```json"):
        res_text = res_text.replace("```json", "").replace("```", "").strip()

    topics = json.loads(res_text)["topics"]

    if len(topics) != 6:
        print(f"  ⚠️  トピック数が{len(topics)}個です（期待値: 6）")

    topics = topics[:6]
    topics = deduplicate_topics(topics)

    # 重複除去で6件未満になった場合は補充
    if len(topics) < 6:
        print(f"  ⚠️  重複除去後{len(topics)}件 → {6 - len(topics)}件補充します")
        topics = supplement_topics(topics, all_headlines, len(topics), target=6)

    # トピック名とquery_enの国名乖離チェック
    _check_topic_name_consistency(topics)

    print("  📋 選定されたトピック（重複除去・補充後）:")
    for i, t in enumerate(topics, 1):
        print(f"     {i}. {t['name']} (en: {t['query_en']} / nhk: {t['query_nhk']})")

    return topics

def deduplicate_topics(topics):
    """
    AIが生成したトピックリストに実質的な重複がないかチェックし、
    重複があれば統合して整える。
    """
    if len(topics) <= 1:
        return topics

    topic_list_str = "\n".join(
        f"{i+1}. {t['name']} (query_en: {t['query_en']})"
        for i, t in enumerate(topics)
    )
    prompt = f"""以下のニューストピックリストに、実質的に同じ事象を指す重複がありますか？

{topic_list_str}

### 重複と判定するケース
- 同じ国・地域の全く同じ紛争・交渉・合意を、ほぼ同じ言葉で表現しているだけ → 重複
- 具体例：
  「ロシア・ウクライナ戦争」と「ウクライナ停戦合意」→ 重複
  「米・イラン交渉」と「イラン停戦合意」→ 重複（同じ合意プロセス）

### 絶対に重複としてはいけないケース（最重要）
- query_enの最初の単語が異なる場合は重複でない
  例：「Ukraine ～」と「Hormuz ～」→ 主語が違うので絶対に重複でない
  例：「Romania ～」と「Ukraine ～」→ 国が違うので絶対に重複でない
- 異なる地域・国が主語のトピックは絶対に統合しない
- テーマが異なるトピックは絶対に統合しない
  例：「ホルムズ海峡封鎖」と「ウクライナ停戦」→ 地域もテーマも違うので重複でない
- 判断が迷う場合は必ず重複としない（duplicatesを空リストにする）
- 無理に統合して意味不明なトピック名を作ることは厳禁

重複がある場合は全ての重複ペアを返してください。
重複がない場合は duplicates を空リストにしてください。

出力は必ず以下のJSON形式のみ:
{{
    "duplicates": [
        {{
            "keep": 残すトピックの番号(1始まり),
            "remove": 削除するトピックの番号(1始まり),
            "merged_name": "統合後のトピック名（より具体的な事象語を含む名称）",
            "merged_query_en": "統合後のquery_en（英語2語・具体的な事象語）",
            "merged_query_nhk": "統合後のquery_nhk（日本語2語・NHK検索用）"
        }}
    ]
}}
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )
    res_text = response.choices[0].message.content.strip()
    if res_text.startswith("```json"):
        res_text = res_text.replace("```json", "").replace("```", "").strip()

    result = json.loads(res_text)
    duplicates = result.get("duplicates", [])

    if not duplicates:
        return topics

    remove_indices = set()
    for dup in duplicates:
        keep_idx   = dup["keep"] - 1
        remove_idx = dup["remove"] - 1
        if 0 <= keep_idx < len(topics) and 0 <= remove_idx < len(topics):
            topics[keep_idx]["name"]      = dup["merged_name"]
            topics[keep_idx]["query_en"]  = dup["merged_query_en"]
            topics[keep_idx]["query_nhk"] = dup["merged_query_nhk"]
            remove_indices.add(remove_idx)
            print(f"  🔀 重複統合: {dup['merged_name']} (#{dup['remove']}を削除)")

    return [t for i, t in enumerate(topics) if i not in remove_indices]


def supplement_topics(topics, all_headlines, current_count, target=6):
    """
    重複除去でトピックが target 件未満になった場合、不足分を補充する。
    すでに選ばれているトピックと重複しないよう除外リストを渡す。
    """
    shortage = target - current_count
    if shortage <= 0:
        return topics

    existing = "\n".join(f"- {t['name']} (query_en: {t['query_en']})" for t in topics)
    prompt = f"""以下の「見出しリスト」から、すでに選ばれているトピックと重複しない国際的に重要なトピックを
【ちょうど{shortage}つ】追加してください。

見出しリスト:
{all_headlines}

### すでに選ばれているトピック（これらと重複するものは選ばないこと）:
{existing}

### 選定ルール（抽出時と同じ基準を厳守）
- 見出しリストに実際に登場する事象のみを使うこと
- 戦争・外交・選挙・経済摩擦など国際的に重要なテーマを優先する
- 禁止: 一国内の司法・建設・政治スキャンダル等の国内ニュース
- 禁止: 州・地方レベルの選挙（例：カリフォルニア州知事選）。国政選挙のみ対象。
- 禁止: 「トランプ政権」「ロシア」等の主体だけのトピック
- 禁止クエリ語: Scandal / Administration / Policy / Issue / Situation / Crisis / Relations / Agreement / Improvement / Tensions / Concerns / Ties
- query_enは必ず「固有名詞（国名・地名・組織名）＋具体的な事象語」の2語にすること
- 抽象的な名詞との組み合わせは禁止。必ず動詞的・事象的な語を使うこと
- 正しい例：「Canada Tariffs」「Canada Trade」「Mexico Dispute」「Hungary Election」
- 誤った例：「Canada Economic Relations」「Mexico Diplomatic Crisis」「Ukraine Tensions」
- 必ず具体的な事象語（Ceasefire / Attack / Election / Tariffs / Sanctions / Strike / Talks 等）を含めること

### 検索語ルール
- query_en: 英語2語（国・組織名＋具体的事象語）
- query_nhk: 日本語2語（NHKの記事タイトルに出てくる具体的な語、固有名詞＋事象語）

出力は必ず以下のJSON形式のみ:
{{
    "topics": [
        {{
            "name": "トピック名（具体的な事象語必須）",
            "query_en": "English 2words",
            "query_nhk": "日本語1 日本語2"
        }}
    ]
}}
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        response_format={"type": "json_object"},
    )
    new_topics = json.loads(response.choices[0].message.content).get("topics", [])
    added = new_topics[:shortage]
    for t in added:
        print(f"  ➕ 補充トピック: {t['name']} (en: {t['query_en']} / nhk: {t['query_nhk']})")
    return topics + added

def is_article_relevant(media_key, topic_name, article_title, query):
    """
    取得記事がトピックに関連しているかAIで簡易チェック。
    「いいえ」と明示された場合のみ除外（デフォルトは採用）。
    """
    prompt = f"""以下の記事タイトルは、指定されたトピック・検索語と関連していますか？
最初の1語を必ず「はい」または「いいえ」にして答えてください。

トピック名: {topic_name}
検索語: {query}
記事タイトル: {article_title}

判断基準：
- 同じ地域・国・組織が少しでも関係していれば「はい」
- トピックの関連語（停戦・封鎖・攻撃など）が記事に含まれていれば「はい」
- 全く異なるテーマ・地域の記事であれば「いいえ」
- 少しでも関連する可能性があれば「はい」
- 迷ったら必ず「はい」
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=10,
    )
    answer = response.choices[0].message.content.strip()
    # 「いいえ」で始まる場合のみ除外。それ以外（「はい」・判断不能）は採用
    is_relevant = not answer.startswith("いいえ")
    if not is_relevant:
        print(f"  [{media_key}] 関連性チェック結果: {answer!r} → スキップ")
    return is_relevant

def generate_combined_report(topic_name, all_news_content):
    """
    各国要約・横断分析・スコア・重要用語をまとめた構造化JSONを返す。
    DB保存に直接使える形式。
    """
    user_prompt = f"""
# 設定
あなたは国際情勢の事実を分析し、深みのある解説を提供するシニアエディターです。
提供された「ニュース素材」を精読し、以下のルールに従って構造化JSONを生成してください。

# ニュース素材
{all_news_content}

---
# 必須ルール

## 1. summary（要約文）の改善
- **主語の省略**: 「アメリカは」「BBCは」といった国名・メディア名の主語で文章を始めないでください。
- **具体性と分量**: 1文を長くし、背景や具体的な数値、地名、人名を含めて【300文字程度】の濃厚な解説にしてください。
- **複数記事の統合**: 同一メディアから複数の記事（見出し）がある場合は、それらをバラバラに扱うのではなく、情報を統合して一つの包括的なストーリーとして要約してください。
- **文体**: 伝聞（〜と報じた）を避け、事実に基づいた断定的な解説調（〜である、〜となっている）で記述してください。
- **報道がない場合**: ニュース素材に「※関連ニュースなし」とある国は、必ずJSONに含めた上で、summaryを「本トピックに関する報道は確認されませんでした。」とし、score等は1にしてください。

## 2. スコアリング（5段階評価）
以下の評価軸を元に、1〜5の整数で評価してください（5=最高、1=最低）。
- recommend_score:
    軸1 TPO適応力: 相手が誰でも刺さるか・知的で建設的な対話のきっかけになるか（5=誰にでも使えるアイスブレイク）
    軸2 ビジネス波及効果: 原油・為替・サプライチェーン・現地市場など意思決定に繋がる示唆があるか（5=直接的なビジネス示唆あり）
- variance_score: 
    軸1 主役の不一致度: 各メディアが「誰の動き」を中心に据えているかの食い違い
    軸2 善悪・原因の所在: 「誰のせいか」という主張の食い違い
    軸3 事態の呼び方: 同じ出来事を異なる言葉で定義しているか
    軸4 主張の方向性: ポジ・ネガ比率の違い

## 3. comparison_summary（横断分析）の書き方
- **国名主語を徹底**: メディア名（BBC, CNN等）は出さず、「アメリカやイギリスは〜を強調する一方で、日本は…」のように、**国名を主語にして**比較してください。

## 4. difficult_word（用語解説）の高度化
- **選定数**: 3つ
- **選定基準**: 「大統領」や「戦争」といった一般的すぎる言葉を避け、そのニュース特有の専門用語、地政学用語、条約名、組織名、または文脈依存の重要な概念を選んでください。
- **解説の詳細化**: その用語が「このニュースにおいてどのような意味を持つか」を含め、2〜3文で詳しく解説してください。

---
# 厳守事項
- 「※関連ニュースなし」と記載されているメディアの内容を推測で補完してはいけない
- JSONのみを返すこと。説明文・マークダウン記法・コードブロックは一切不要

出力JSON形式:
{{
  "country_summaries": [
    {{
      "country": "国名（イギリス／カタール／アメリカ／日本／インド）",
      "media_name": "メディア名",
      "summary": "【上記ルールに従った300文字程度の要約】",
      "url": "記事URL（なしの場合は空文字）",
      "article_title": "記事タイトル（なしの場合は空文字）",
      "recommend_score": 1〜5の数値,
      "difficult_word": [
        {{"term": "高度な用語名1", "description": "詳細な解説"}},
        {{"term": "高度な用語名2", "description": "詳細な解説"}},
        {{"term": "高度な用語名3", "description": "詳細な解説"}}
      ]
    }}
  ],
  "comparison_summary": {{
    "summary": "【全メディアを横断分析した視点の違いを浮き彫りにする文章】",
    "variance_score": 1〜5の数値,
    "difficult_word": [
      {{"term": "全体の重要用語1", "description": "詳細な解説"}},
      {{"term": "全体の重要用語2", "description": "詳細な解説"}},
      {{"term": "全体の重要用語3", "description": "詳細な解説"}}
    ]
  }}
}}
"""
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": "あなたは複数のソースを統合し、最適な情報を提供するシニアエディターです。必ずJSONのみを返してください。"},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
        response_format={"type": "json_object"},
    )
    res_text = response.choices[0].message.content.strip()
    if res_text.startswith("```json"):
        res_text = res_text.replace("```json", "").replace("```", "").strip()

    return json.loads(res_text)

def _check_topic_name_consistency(topics):
    """
    トピック名の品質チェックを2種類実施し警告を出す。
    チェック1: query_enの国名とトピック名が乖離していないか
    チェック2: トピック名に事象語が含まれているか（主体のみトピックの検出）
    """
    # --- チェック1: 国名乖離 ---
    name_map = {
        "nigeria": ["ナイジェリア", "ニジェリア"],
        "niger":   ["ニジェール"],
        "ukraine": ["ウクライナ"],
        "russia":  ["ロシア"],
        "iran":    ["イラン"],
        "israel":  ["イスラエル"],
        "hungary": ["ハンガリー"],
        "china":   ["中国"],
        "taiwan":  ["台湾"],
        "trump":   ["トランプ"],
        "hormuz":  ["ホルムズ", "封鎖", "海峡"],  # Hormuz系は封鎖・海峡も可
        "us":      ["アメリカ", "米"],
        "canada":  ["カナダ"],      
        "bulgaria":["ブルガリア"],  
        "romania": ["ルーマニア"],
    }
    for t in topics:
        query_first = t["query_en"].split()[0].lower()
        expected_ja = name_map.get(query_first, [])
        if expected_ja and not any(ja in t["name"] for ja in expected_ja):
            print(f"  ⚠️  [国名乖離] 「{t['name']}」← query_en: {t['query_en']}")
            print(f"       トピック名に含まれるべき語の候補: {expected_ja}")

    # --- チェック2: 主体のみトピック（事象語なし）の検出 ---
    # 事象語リスト（これらのいずれかがトピック名に含まれていれば合格）
    event_words = [
        "停戦", "攻撃", "選挙", "合意", "交渉", "制裁", "関税", "封鎖", "空爆",
        "侵攻", "紛争", "政権交代", "会談", "和解", "優遇", "圧力", "規制",
        "戦争", "危機", "崩壊", "支援", "撤退", "核", "ミサイル", "爆撃",
    ]
    for t in topics:
        if not any(w in t["name"] for w in event_words):
            print(f"  ⚠️  [事象語なし] 「{t['name']}」は主体のみのトピック名の可能性があります")
            print(f"       query_en: {t['query_en']} / query_nhk: {t['query_nhk']}")


    # --- チェック3: 州・地方レベルの選挙の検出 ---
    # 州名リスト（日本語・英語）
    state_names = [
        "カリフォルニア", "テキサス", "ニューヨーク", "フロリダ", "イリノイ",
        "california", "texas", "new york", "florida", "illinois",
        "州知事", "governor", "州議会", "市長", "mayor",
    ]
    for t in topics:
        name_lower = t["name"].lower()
        query_lower = t["query_en"].lower()
        if any(s.lower() in name_lower or s.lower() in query_lower for s in state_names):
            print(f"  ⚠️  [州レベル選挙] 「{t['name']}」は州・地方レベルの可能性があります")
            print(f"       国際的重要性の観点から選定を再検討してください")