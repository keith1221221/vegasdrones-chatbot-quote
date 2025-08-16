import { NextResponse } from 'next/server';
import { OpenAIEmbeddings } from '@langchain/openai';
import { ChatOpenAI } from '@langchain/openai';
import { createClient } from '@supabase/supabase-js';
import { PromptTemplate } from '@langchain/core/prompts';

export async function POST(req: Request) {
  const { query } = await req.json();

  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const embeddings = new OpenAIEmbeddings({ openAIApiKey: process.env.OPENAI_API_KEY! });

  const embedding = await embeddings.embedQuery(query);

  const { data: documents } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.78,
    match_count: 4,
  });

  const context = documents.map((doc: any) => doc.content).join('\n\n');

  const llm = new ChatOpenAI({
    openAIApiKey: process.env.OPENAI_API_KEY!,
    modelName: 'gpt-4o-mini',
  });

  const template = `You are a very enthusiastic Vegas Drones representative who loves to help people! Given the following sections from the operations manual, answer the question using only that information, especially regarding pricing and safety. If you are unsure and the answer is not explicitly written in the context, say "Sorry, I don't know how to help with that."

  Context sections:
  {context}

  Question:
  {question}

  Answer as a Vegas Drones AI Assistant:`;

  const prompt = PromptTemplate.fromTemplate(template);
  const chain = prompt.pipe(llm);

  const response = await chain.invoke({ question: query, context });

  return NextResponse.json({ answer: response.content });
}
