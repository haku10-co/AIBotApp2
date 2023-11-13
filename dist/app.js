"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const hn_1 = require("langchain/document_loaders/web/hn");
const opensearch_1 = require("langchain/vectorstores/opensearch");
const openai_1 = require("langchain/chat_models/openai");
const schema_1 = require("langchain/schema");
const openai_2 = require("langchain/embeddings/openai");
const opensearch_2 = require("@opensearch-project/opensearch");
async function main() {
    try {
        // Create an instance of OpenAIEmbeddings
        const embeddings = new openai_2.OpenAIEmbeddings();
        const client = new opensearch_2.Client({
            nodes: ['http://localhost:9200'],
        });
        // ベクトルストアを作成
        const vectorStore = new opensearch_1.OpenSearchVectorStore(embeddings, {
            client,
            indexName: 'my_index'
        });
        // データローダーを作成
        const loader = new hn_1.HNLoader("https://news.ycombinator.com/item?id=34817881");
        // データをロード
        const docs = await loader.load();
        // データをインデックス化
        await opensearch_1.OpenSearchVectorStore.fromDocuments(docs, embeddings, {
            client,
            indexName: 'my_index'
        });
        // クエリに基づいて検索
        // クエリに基づいて検索
        const results = await vectorStore.similaritySearch('my query', 1);
        console.log(results); // 検索結果を表示
        // ChatOpenAIのインスタンスを作成
        const chat = new openai_1.ChatOpenAI({
            openAIApiKey: "YOUR_OPENAI_API_KEY" // ここにあなたのOpenAI APIキーを入力してください
        });
        // ユーザーメッセージを取得してAIに応答させる関数
        async function getResponse(userMessage) {
            const result = await chat.call([
                new schema_1.HumanMessage(userMessage)
            ]);
            return result.content;
        }
        // ユーザーメッセージを設定して応答を取得
        const userMessage = "こんにちは、あなたは誰ですか？";
        const response = await getResponse(userMessage);
        // AIの応答を表示
        console.log(response);
    }
    catch (error) {
        console.error('An error occurred:', error);
    }
}
// main関数を実行
main();
//# sourceMappingURL=app.js.map