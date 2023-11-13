// readlineモジュールをインポートし、コマンドラインインターフェイスを作成します。
import readline from 'readline';
// langchainライブラリから必要なモジュールをインポートします。
import { OpenAI } from "langchain/llms/openai";
import { PromptTemplate } from "langchain/prompts";
import { BufferMemory } from "langchain/memory";
import { ConversationChain } from "langchain/chains";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { TextSplitter } from "langchain/text_splitter";


// 環境変数をロードするためのdotenv設定
require("dotenv").config();

// readlineインターフェイスをセットアップします。
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// アプリケーションのメイン関数です。
export const run = async () => {
  // LLM（Large Language Model）を初期化します。
  const llm_1 = new OpenAI({ temperature: 1, modelName: "gpt-4-1106-preview" , verbose: true });
  // BufferMemoryを初期化します。これは会話のコンテキストを保存します。
  const memory = new BufferMemory();
  // ConversationChainを初期化します。これは会話を続けるためのチェーンです。
  const chain = new ConversationChain({ llm: llm_1, memory });

  class CustomTextSplitter extends TextSplitter {
    async splitText(text: string): Promise<string[]> {
      // 行ごとにテキストを分割し、undefinedと空文字列をフィルタリングします。
      return text.split('\n').filter(line => line !== undefined && line !== '');
    }
  }
  
  // テキストローダーを使ってドキュメントを読み込みます。
  const loader0 = new TextLoader("./src/document_loaders/example_data/サービスについてのQA.txt");
  const docs1 = await loader0.load();
  const loader1 = new TextLoader("./src/document_loaders/example_data/代理店募集についてのQA.txt");
  const docs2 = await loader1.load();
  

  // 別のテキストファイルからキャラクター情報を読み込みます。
  const loader2 = new TextLoader("./src/document_loaders/setting_data/set.txt");
  const characterInfo = await loader2.load();

  // Documentオブジェクトを作成し、読み込んだドキュメントを保持します。
  
  // OpenAIEmbeddingsを初期化します。これはOpenAIのEmbeddings APIを使って単語の埋め込みを取得します。
  const docs = [...docs1, ...docs2];
  // ドキュメントを分割します。
  const textSplitter = new CustomTextSplitter();
  const splitDocs = await textSplitter.splitDocuments(docs);
  const embeddings = new OpenAIEmbeddings();
  const vectorStore = await MemoryVectorStore.fromDocuments(splitDocs, embeddings);
  // PromptTemplateを設定します。これはユーザーの質問に基づいてプロンプトを生成します。
  const prompt = new PromptTemplate({
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
      const combinedInput = `${nextInput}\nベクター検索QandA結果: ${results[0].pageContent}\nキャラクター情報: ${characterInfo[0].pageContent}`;
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

    const combinedInitialInput = `${initialPrompt}\n関連情報: ${initialResults[0].pageContent}\nキャラクター情報: ${characterInfo[0].pageContent}`;
    // ConversationChainを呼び出して初期の回答を取得します。
    const initialResponse = await chain.call({ input: combinedInitialInput });
    console.log(`回答: ${initialResponse.response}`);
    // 会話を続けるために関数を呼び出します。
    continueConversation();
  });
};

// アプリケーションを実行します。
run();
