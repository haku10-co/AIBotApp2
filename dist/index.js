"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
// readlineモジュールをインポートし、コマンドラインインターフェイスを作成します。
const readline_1 = __importDefault(require("readline"));
// langchainライブラリから必要なモジュールをインポートします。
const openai_1 = require("langchain/llms/openai");
const prompts_1 = require("langchain/prompts");
const memory_1 = require("langchain/memory");
const chains_1 = require("langchain/chains");
const text_1 = require("langchain/document_loaders/fs/text");
const memory_2 = require("langchain/vectorstores/memory");
const openai_2 = require("langchain/embeddings/openai");
// 環境変数をロードするためのdotenv設定
require("dotenv").config();
// readlineインターフェイスをセットアップします。
const rl = readline_1.default.createInterface({
    input: process.stdin,
    output: process.stdout
});
// アプリケーションのメイン関数です。
const run = async () => {
    // LLM（Large Language Model）を初期化します。
    const llm_1 = new openai_1.OpenAI({ temperature: 1, modelName: "gpt-3.5-turbo-16k", verbose: true });
    // BufferMemoryを初期化します。これは会話のコンテキストを保存します。
    const memory = new memory_1.BufferMemory();
    // ConversationChainを初期化します。これは会話を続けるためのチェーンです。
    const chain = new chains_1.ConversationChain({ llm: llm_1, memory });
    // テキストローダーを使ってドキュメントを読み込みます。
    const loader0 = new text_1.TextLoader("./src/document_loaders/example_data/サービスについてのQA.txt");
    const docs1 = await loader0.load();
    const loader1 = new text_1.TextLoader("./src/document_loaders/example_data/代理店募集についてのQA.txt");
    const docs2 = await loader1.load();
    // 別のテキストファイルからキャラクター情報を読み込みます。
    const loader2 = new text_1.TextLoader("./src/document_loaders/setting_data/set.txt");
    const characterInfo = await loader2.load();
    // Documentオブジェクトを作成し、読み込んだドキュメントを保持します。
    // 新しいBufferMemoryインスタンスを作成し、キャラクター情報を保存します。
    const memory2 = new memory_1.BufferMemory();
    const inputValues = { character: characterInfo };
    const outputValues = { dummyKey: "dummyValue" }; // ここに適切なキーと値を設定します
    memory2.saveContext(inputValues, outputValues);
    // OpenAIEmbeddingsを初期化します。これはOpenAIのEmbeddings APIを使って単語の埋め込みを取得します。
    const docs = [...docs1, ...docs2];
    const vectorStore = await memory_2.MemoryVectorStore.fromDocuments(docs, new openai_2.OpenAIEmbeddings());
    // PromptTemplateを設定します。これはユーザーの質問に基づいてプロンプトを生成します。
    const prompt = new prompts_1.PromptTemplate({
        inputVariables: ["question"],
        template: "{question}がわからないようなので教えて",
    });
    // 会話を続けるための関数です。
    const continueConversation = async () => {
        rl.question('入力: ', async (nextInput) => {
            if (nextInput.toLowerCase() === 'exit') {
                rl.close();
                return;
            }
            // ユーザーの入力とドキュメントの内容を組み合わせて次の入力を生成します。
            const results = await vectorStore.similaritySearch(nextInput);
            const similarDoc = results[0].metadata;
            const combinedInput = `${nextInput}について違和感なく会話して\n関連情報: ${similarDoc.content}`;
            // ConversationChainを呼び出して回答を取得します。
            const response = await chain.call({ input: combinedInput });
            console.log(`回答: ${response.response}`);
            continueConversation();
        });
    };
    // 初期の質問を受け取ります。
    rl.question('何について質問しますか？ ', async (initialInput) => {
        // PromptTemplateを使って初期プロンプトを生成します。
        const initialPrompt = await prompt.format({ question: initialInput });
        // 初期プロンプトとドキュメントの内容を組み合わせます。
        const initialResults = await vectorStore.similaritySearch(initialInput);
        const initialSimilarDoc = initialResults[0].metadata;
        const combinedInitialInput = `${initialPrompt}\n
    関連情報: ${initialSimilarDoc.content}`;
        // ConversationChainを呼び出して初期の回答を取得します。
        const initialResponse = await chain.call({ input: combinedInitialInput });
        console.log(`回答: ${initialResponse.response}`);
        // 会話を続けるために関数を呼び出します。
        continueConversation();
    });
};
exports.run = run;
// アプリケーションを実行します。
(0, exports.run)();
//# sourceMappingURL=index.js.map